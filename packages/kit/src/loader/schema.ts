import type { SchemaDefinition, StandardSchemaExtension, StandardSchemaV1 } from '@nuxt/schema'
import { useNuxt } from '../context'

export function extendNuxtSchema (def: SchemaDefinition | (() => SchemaDefinition)) {
  const nuxt = useNuxt()
  nuxt.hook('schema:extend', (schemas) => {
    schemas.push(typeof def === 'function' ? def() : def)
  })
}

/**
 * Extend Nuxt configuration schema with Standard Schema (Zod, Valibot, etc.)
 *
 * @param configPath - The configuration path (e.g., 'myModule', 'runtimeConfig')
 * @param standardSchema - A Standard Schema compatible validation schema
 *
 * @example
 * ```ts
 * import { z } from 'zod'
 * import { extendNuxtStandardSchema } from '@nuxt/kit'
 *
 * extendNuxtStandardSchema('myModule', z.object({
 *   endpoint: z.string().url(),
 *   timeout: z.number().positive().optional()
 * }))
 * ```
 */
export function extendNuxtStandardSchema (configPath: string, standardSchema: StandardSchemaV1) {
  const nuxt = useNuxt()
  nuxt.hook('schema:extend', (schemas) => {
    const extension: StandardSchemaExtension & Record<string, any> = {
      $standardSchema: standardSchema,
      [configPath]: {}, // Placeholder for the config path
    }
    schemas.push(extension as any)
  })
}
