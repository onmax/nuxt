import { useNuxt } from '@nuxt/kit'
import { isCommonJSPackage } from '@nuxt/kit/internal'
import escapeRegExp from 'escape-string-regexp'
import { normalize } from 'pathe'

interface Envs {
  isDev: boolean
  isClient?: boolean
  isServer?: boolean
}

function resolveTranspile (envs: Envs): Array<string | RegExp> {
  const patterns: Array<string | RegExp> = []
  for (const entry of useNuxt().options.build.transpile) {
    const pattern = typeof entry === 'function' ? entry(envs) || undefined : entry
    if (typeof pattern === 'string') {
      patterns.push(normalize(pattern))
    } else if (pattern instanceof RegExp) {
      patterns.push(pattern)
    }
  }
  return patterns
}

/**
 * The patterns of `build.transpile` as regular expressions. For a server environment in
 * development, CommonJS packages are left out: Vite's module runner evaluates inlined code
 * as ESM, so Node has to load them as externals.
 */
export function getTranspilePatterns (envs: Envs): RegExp[] {
  const skipCommonJS = envs.isServer && envs.isDev
  const modulesDir = useNuxt().options.modulesDir
  return resolveTranspile(envs)
    .filter(pattern => !skipCommonJS || typeof pattern !== 'string' || !isCommonJSPackage(pattern, modulesDir))
    .map(pattern => typeof pattern === 'string' ? new RegExp(escapeRegExp(pattern)) : pattern)
}

/** The string patterns of `build.transpile`, for `optimizeDeps.exclude`. */
export function getTranspileStrings (envs: Envs): string[] {
  return resolveTranspile(envs).filter(pattern => typeof pattern === 'string')
}
