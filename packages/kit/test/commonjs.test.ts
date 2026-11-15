import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { isCommonJSPackage } from '../src/internal/commonjs.ts'

let root: string
let modulesDir: string

async function addPackage (name: string, pkg: Record<string, unknown>, files: Record<string, string>) {
  const dir = join(modulesDir, name)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name, ...pkg }))
  for (const [file, code] of Object.entries(files)) {
    await mkdir(join(dir, file, '..'), { recursive: true })
    await writeFile(join(dir, file), code)
  }
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'nuxt-kit-commonjs-'))
  modulesDir = join(root, 'node_modules')
  await addPackage('cjs-main', { main: 'index.js' }, { 'index.js': 'module.exports = 1' })
  // like `yaml`: the `node` condition points at CommonJS, the default at ESM
  await addPackage('cjs-node-export', { exports: { '.': { node: './dist/index.js', default: './browser/index.js' } } }, {
    'dist/index.js': 'exports.a = 1',
    'browser/index.js': 'export const a = 1',
    'browser/package.json': '{ "type": "module" }',
  })
  await addPackage('esm-type-module', { type: 'module', main: 'index.js' }, { 'index.js': 'export default 1' })
  await addPackage('dual', { exports: { '.': { import: './index.mjs', require: './index.cjs' } } }, {
    'index.mjs': 'export default 1',
    'index.cjs': 'module.exports = 1',
  })
  await addPackage('cjs-only-export', { exports: './index.cjs' }, { 'index.cjs': 'module.exports = 1' })
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('isCommonJSPackage', () => {
  it('detects packages that Node loads as CommonJS', () => {
    expect(isCommonJSPackage('cjs-main', [modulesDir])).toBe(true)
    expect(isCommonJSPackage('cjs-node-export', [modulesDir])).toBe(true)
    expect(isCommonJSPackage('cjs-only-export', [modulesDir])).toBe(true)
  })

  it('keeps ES module packages', () => {
    expect(isCommonJSPackage('esm-type-module', [modulesDir])).toBe(false)
    expect(isCommonJSPackage('dual', [modulesDir])).toBe(false)
  })

  it('ignores paths and specifiers that do not resolve', () => {
    expect(isCommonJSPackage(join(modulesDir, 'cjs-main'), [modulesDir])).toBe(false)
    expect(isCommonJSPackage('./cjs-main', [modulesDir])).toBe(false)
    expect(isCommonJSPackage('not-installed', [modulesDir])).toBe(false)
  })

  it('resolves from any of the given directories', () => {
    expect(isCommonJSPackage('cjs-main', [join(root, 'elsewhere/node_modules'), modulesDir])).toBe(true)
  })
})
