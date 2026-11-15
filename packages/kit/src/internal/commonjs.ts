import { readFileSync } from 'node:fs'
import { isAbsolute } from 'pathe'
import { resolveModulePath } from 'exsolve'
import { resolvePackageJSON } from './package-json.ts'
import { directoryToURL } from './esm.ts'

const RELATIVE_RE = /^\.{1,2}(?:\/|$)/

/**
 * Whether Node loads the bare specifier `id`, resolved from one of the directories in `from`,
 * as CommonJS. Vite's dev module runner evaluates inlined modules as ESM, so a CommonJS
 * package can only run there when Node loads it as an external.
 *
 * Returns `false` when `id` is not a bare specifier or does not resolve.
 */
export function isCommonJSPackage (id: string, from: string[]): boolean {
  if (isAbsolute(id) || RELATIVE_RE.test(id)) {
    return false
  }
  const path = resolveModulePath(id, {
    from: from.map(dir => directoryToURL(dir)),
    conditions: ['node', 'import'],
    try: true,
  })
  if (!path || path.endsWith('.mjs') || path.endsWith('.mts')) {
    return false
  }
  if (path.endsWith('.cjs') || path.endsWith('.cts')) {
    return true
  }
  if (!path.endsWith('.js')) {
    return false
  }
  const pkgPath = resolvePackageJSON(path, { try: true })
  if (!pkgPath) {
    return true
  }
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf8')).type !== 'module'
  } catch {
    return false
  }
}
