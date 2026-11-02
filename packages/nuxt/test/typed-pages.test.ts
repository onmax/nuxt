import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join, normalize } from 'pathe'
import { withoutTrailingSlash } from 'ufo'
import { describe, expect, it, onTestFinished } from 'vitest'
import { buildNuxt, writeTypes } from '@nuxt/kit'
import { loadNuxt } from '../src/index.ts'

const pagesFixtureDir = withoutTrailingSlash(normalize(fileURLToPath(new URL('./pages-fixture', import.meta.url))))

describe('typed pages', () => {
  it('generates typed-router.d.ts from a single page scan when preparing', async () => {
    const buildDir = mkdtempSync(join(tmpdir(), 'nuxt-typed-pages-'))
    onTestFinished(() => rmSync(buildDir, { recursive: true, force: true }))

    let pagesExtendCalls = 0
    const nuxt = await loadNuxt({
      cwd: pagesFixtureDir,
      ready: true,
      overrides: {
        _prepare: true,
        buildDir,
        experimental: { typedPages: true },
        modules: [
          (_options, nuxt) => {
            nuxt.hook('pages:extend', (pages) => {
              pagesExtendCalls++
              pages.push({ name: 'from-module', path: '/from-module', file: join(pagesFixtureDir, 'pages/index.vue') })
            })
          },
        ],
      },
    })
    onTestFinished(() => nuxt.close())

    // `nuxt prepare` and `nuxt build` clear the build dir after modules are set up
    rmSync(buildDir, { recursive: true, force: true })
    await buildNuxt(nuxt)

    const dts = readFileSync(join(buildDir, 'types/typed-router.d.ts'), 'utf8')
    expect(dts).toContain(`'/'`)
    expect(dts).toContain(`'from-module'`)
    expect(pagesExtendCalls).toBe(1)
  })

  async function prepareTsConfig (experimental: { contentMappers?: boolean }) {
    const buildDir = mkdtempSync(join(tmpdir(), 'nuxt-typed-pages-'))
    onTestFinished(() => rmSync(buildDir, { recursive: true, force: true }))
    const nuxt = await loadNuxt({
      cwd: pagesFixtureDir,
      ready: true,
      overrides: { _prepare: true, buildDir, typesDir: buildDir, experimental: { typedPages: true, ...experimental } },
    })
    onTestFinished(() => nuxt.close())
    await writeTypes(nuxt)
    return JSON.parse(readFileSync(join(buildDir, 'tsconfig.app.json'), 'utf8'))
  }

  it('adds the vue-router volar plugins to vueCompilerOptions', async () => {
    const tsConfig = await prepareTsConfig({})
    expect(tsConfig).not.toHaveProperty('contentMappers')
    expect(tsConfig.vueCompilerOptions.plugins).toEqual([
      'vue-router/volar/sfc-route-blocks',
      { name: 'vue-router/volar/sfc-typed-router', options: { rootDir: pagesFixtureDir } },
    ])
  })

  it('adds the typed router codegen plugin to the vue content mapper with `experimental.contentMappers`', async () => {
    const tsConfig = await prepareTsConfig({ contentMappers: true })
    expect(tsConfig).not.toHaveProperty('vueCompilerOptions')
    expect(tsConfig.contentMappers).toEqual([{
      package: '@vue/content-mapper',
      extensions: ['.vue'],
      options: {
        plugins: [{ name: fileURLToPath(new URL('../content-mapper/typed-router.cjs', import.meta.url)), options: { rootDir: pagesFixtureDir } }],
      },
    }])
  })
})
