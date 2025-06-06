import type { UnimportOptions } from 'unimport'

export interface ImportsOptions extends UnimportOptions {
  /**
   * Enable implicit auto import from Vue, Nuxt and module contributed utilities.
   * Generate global TypeScript definitions.
   * @default true
   */
  autoImport?: boolean

  /**
   * Directories to scan for auto imports.
   * @see https://nuxt.com/docs/guide/directory-structure/composables#how-files-are-scanned
   * @default ['./composables', './utils']
   */
  dirs?: string[]

  /**
   * Enabled scan for local directories for auto imports.
   * When this is disabled, `dirs` options will be ignored.
   * @default true
   */
  scan?: boolean

  /**
   * Assign auto imported utilities to `globalThis` instead of using built time transformation.
   * @default false
   */
  global?: boolean

  transform?: {
    exclude?: RegExp[]
    include?: RegExp[]
  }

  /**
   * Add polyfills for setInterval, requestIdleCallback, and others
   * @default true
   */
  polyfills?: boolean
}
