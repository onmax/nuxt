import { spawn } from 'node:child_process'
import process from 'node:process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'
import { afterAll, describe, expect, it } from 'vitest'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import { setPendingClientBuild } from '@nuxt/kit/internal'
import type { Nuxt } from '@nuxt/schema'
import { getRandomPort } from 'get-port-please'
import type { Plugin } from 'vite'
import { join } from 'pathe'

const tmpDir = fileURLToPath(new URL('./.tmp/ssr-styles', import.meta.url))

async function writeApp () {
  await mkdir(join(tmpDir, 'app/components'), { recursive: true })
  await writeFile(join(tmpDir, 'app/app.vue'), [
    '<script setup>import Styled from \'./components/Styled.vue\'</script>',
    '<template><div class="app"><Styled /></div></template>',
    '<style>.app{color:#123456}</style>',
  ].join('\n'))
  await writeFile(join(tmpDir, 'app/components/Styled.vue'), [
    '<template><p :class="$style.moduleClass" class="plain scoped">styled</p></template>',
    '<style>.plain{color:#654321}</style>',
    '<style scoped>.scoped{margin:3px}</style>',
    '<style module>.moduleClass{padding:5px}</style>',
  ].join('\n'))
}

/**
 * Builds the client environment at the same time as the ssr one and marks its state pending
 * until it's done, as when the client builds in another process.
 */
function concurrentClientBuild (getNuxt: () => Nuxt): Plugin {
  return {
    name: 'concurrent-client-build',
    buildApp (builder) {
      const client = builder.environments.client!
      const built = builder.build(client)
      client.isBuilt = true
      setPendingClientBuild(built.then(() => ({})), getNuxt())
      return Promise.resolve()
    },
  }
}

async function build (options: { concurrentClient?: boolean } = {}) {
  const ssrTransforms: string[] = []
  const recorder: Plugin = {
    name: 'record-ssr-transforms',
    transform (_code, id) {
      if (this.environment.name === 'ssr') {
        ssrTransforms.push(id)
      }
    },
  }

  const plugins = options.concurrentClient ? [recorder, concurrentClientBuild(() => nuxt)] : [recorder]
  const nuxt = await loadNuxt({
    cwd: tmpDir,
    ready: true,
    dev: false,
    overrides: {
      buildId: 'ssr-styles-test',
      compatibilityDate: 'latest',
      devtools: { enabled: false },
      ssr: true,
      features: { inlineStyles: true },
      vite: { plugins },
    },
  })

  try {
    await buildNuxt(nuxt)
  } finally {
    await nuxt.close()
  }

  return ssrTransforms
}

async function render () {
  const port = await getRandomPort('127.0.0.1')
  const server = spawn(process.execPath, [join(tmpDir, '.output/server/index.mjs')], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: 'ignore',
  })
  try {
    for (let i = 0; i < 100; i++) {
      const html = await fetch(`http://127.0.0.1:${port}/`).then(r => r.text()).catch(() => undefined)
      if (html) { return html }
      await sleep(100)
    }
    throw new Error('server did not start')
  } finally {
    server.kill()
  }
}

describe('ssr styles', () => {
  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it('compiles only the style blocks the server build reads', async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await writeApp()

    const ssrTransforms = await build()
    const styleTransforms = ssrTransforms.filter(id => id.includes('type=style'))
    expect(styleTransforms.filter(id => !id.includes('&inline&used&') && !id.includes('.module.'))).toEqual([])

    const html = await render()
    const inlined = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n')
    for (const css of ['.app{color:#123456}', '.plain{color:#654321}', 'margin:3px', 'padding:5px']) {
      expect(inlined).toContain(css)
    }
    expect(html).not.toMatch(/<link[^>]+rel="stylesheet"/)
    expect(html).toMatch(/<p class="[^"]*_moduleClass_/)
  }, 240 * 1000)

  it('inlines the same styles when the client state arrives during the ssr build', async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await writeApp()

    await build()
    const serial = await render()
    await build({ concurrentClient: true })
    const concurrent = await render()

    expect(concurrent).toContain('margin:3px')
    expect(concurrent).toBe(serial)
  }, 240 * 1000)
})
