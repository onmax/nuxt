import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'
import { watch } from 'chokidar'
import { defu } from 'defu'
import { debounce } from 'perfect-debounce'
import { createIsIgnored, createResolver, defineNuxtModule, directoryToURL, importModule } from '@nuxt/kit'
import { generateTypes, resolveSchema as resolveUntypedSchema } from 'untyped'
import type { Schema, SchemaDefinition } from 'untyped'
import untypedPlugin from 'untyped/babel-plugin'
import { createJiti } from 'jiti'
import { formatStandardSchemaIssue, isStandardSchema, standardSchemaToJsonSchema, validateWithStandardSchema } from '@nuxt/schema'
import type { StandardSchemaExtension, StandardSchemaV1 } from '@nuxt/schema'
import { logger } from '../utils'

export default defineNuxtModule({
  meta: {
    name: 'nuxt:nuxt-config-schema',
  },
  async setup (_, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Initialize untyped/jiti loader
    const _resolveSchema = createJiti(fileURLToPath(import.meta.url), {
      cache: false,
      transformOptions: {
        babel: {
          plugins: [untypedPlugin],
        },
      },
    })

    // Register module types
    nuxt.hook('prepare:types', async (ctx) => {
      ctx.references.push({ path: 'schema/nuxt.schema.d.ts' })
      if (nuxt.options._prepare) {
        await writeSchema(schema)
      }
    })

    // Resolve schema after all modules initialized
    let schema: Schema
    nuxt.hook('modules:done', async () => {
      schema = await resolveSchema()
    })

    // Write schema after build to allow further modifications
    nuxt.hooks.hook('build:done', () => writeSchema(schema))

    // Watch for schema changes in development mode
    if (nuxt.options.dev) {
      const onChange = debounce(async () => {
        schema = await resolveSchema()
        await writeSchema(schema)
      })

      if (nuxt.options.experimental.watcher === 'parcel') {
        try {
          const { subscribe } = await importModule<typeof import('@parcel/watcher')>('@parcel/watcher', {
            url: [nuxt.options.rootDir, ...nuxt.options.modulesDir].map(dir => directoryToURL(dir)),
          })
          for (const layer of nuxt.options._layers) {
            const subscription = await subscribe(layer.config.rootDir, onChange, {
              ignore: ['!nuxt.schema.*'],
            })
            nuxt.hook('close', () => subscription.unsubscribe())
          }
          return
        } catch {
          logger.warn('Falling back to `chokidar` as `@parcel/watcher` cannot be resolved in your project.')
        }
      }

      const isIgnored = createIsIgnored(nuxt)
      const dirsToWatch = nuxt.options._layers.map(layer => resolver.resolve(layer.config.rootDir))
      const SCHEMA_RE = /(?:^|\/)nuxt.schema.\w+$/
      const watcher = watch(dirsToWatch, {
        ...nuxt.options.watchers.chokidar,
        depth: 1,
        ignored: [
          (path, stats) => (stats && !stats.isFile()) || !SCHEMA_RE.test(path),
          isIgnored,
          /[\\/]node_modules[\\/]/,
        ],
        ignoreInitial: true,
      })
      watcher.on('all', onChange)
      nuxt.hook('close', () => watcher.close())
    }

    // --- utils ---

    async function resolveSchema () {
      // Global import
      // @ts-expect-error adding to globalThis for 'auto-import' support within nuxt.config file
      globalThis.defineNuxtSchema = (val: any) => val

      // Load schema from layers
      const schemaDefs: SchemaDefinition[] = []
      const standardSchemas: StandardSchemaV1[] = []

      // Process the main config $schema
      if (nuxt.options.$schema) {
        if (isStandardSchema(nuxt.options.$schema)) {
          standardSchemas.push(nuxt.options.$schema)
          // Convert Standard Schema to JSON Schema for merging
          const jsonSchema = await standardSchemaToJsonSchema(nuxt.options.$schema)
          schemaDefs.push(jsonSchema)
        } else {
          schemaDefs.push(nuxt.options.$schema)
        }
      }

      for (const layer of nuxt.options._layers) {
        const filePath = await resolver.resolvePath(resolve(layer.config.rootDir, 'nuxt.schema'))
        if (filePath && existsSync(filePath)) {
          let loadedConfig: SchemaDefinition | StandardSchemaV1
          try {
            // TODO: fix type for second argument of `import`
            loadedConfig = await _resolveSchema.import(filePath, { default: true }) as SchemaDefinition | StandardSchemaV1
          } catch (err) {
            logger.warn(
              'Unable to load schema from',
              filePath,
              err,
            )
            continue
          }

          if (isStandardSchema(loadedConfig)) {
            standardSchemas.push(loadedConfig)
            // Convert Standard Schema to JSON Schema for merging
            const jsonSchema = await standardSchemaToJsonSchema(loadedConfig)
            schemaDefs.push(jsonSchema)
          } else {
            schemaDefs.push(loadedConfig)
          }
        }
      }

      // Collect module-provided Standard Schemas
      const moduleStandardSchemas: Record<string, StandardSchemaV1> = {}

      // Allow hooking to extend custom schemas
      await nuxt.hooks.callHook('schema:extend', schemaDefs)

      // Process any Standard Schemas from modules via the new hook mechanism
      nuxt.hooks.addHooks({
        'schema:extend': (schemas: (SchemaDefinition | StandardSchemaExtension)[]) => {
          for (const schemaOrExtension of schemas) {
            // Check if this is a Standard Schema extension
            if (typeof schemaOrExtension === 'object' && '$standardSchema' in schemaOrExtension && schemaOrExtension.$standardSchema) {
              const standardSchema = schemaOrExtension.$standardSchema
              // Store for validation later
              const keys = Object.keys(schemaOrExtension).filter(key => key !== '$standardSchema')
              for (const key of keys) {
                moduleStandardSchemas[key] = standardSchema
              }
            }
          }
        },
      })

      // Validate configuration against Standard Schemas if any
      if (standardSchemas.length > 0 || Object.keys(moduleStandardSchemas).length > 0) {
        // Validate app-level schemas
        for (const standardSchema of standardSchemas) {
          const validationResult = await validateWithStandardSchema(standardSchema, nuxt.options)
          if (!validationResult.success && validationResult.issues) {
            const errorMessages = validationResult.issues.map(issue => formatStandardSchemaIssue(issue))
            logger.error('❌ [Nuxt Schema] Standard Schema validation failed:')
            for (const [index, message] of errorMessages.entries()) {
              logger.error(`  ${index + 1}. ${message}`)
            }
            throw new Error('Configuration validation failed')
          }
        }

        // Validate module-level schemas
        for (const [configPath, standardSchema] of Object.entries(moduleStandardSchemas)) {
          const configValue = configPath.split('.').reduce((obj, key) => obj?.[key], nuxt.options)
          if (configValue !== undefined) {
            const validationResult = await validateWithStandardSchema(standardSchema, configValue)
            if (!validationResult.success && validationResult.issues) {
              const errorMessages = validationResult.issues.map(issue => formatStandardSchemaIssue(issue))
              logger.error(`❌ [Nuxt Schema] Standard Schema validation failed for "${configPath}":`)
              for (const [index, message] of errorMessages.entries()) {
                logger.error(`  ${index + 1}. ${message}`)
              }
              throw new Error(`Configuration validation failed for "${configPath}"`)
            }
          }
        }

        logger.success('✅ Standard Schema validation passed')
      }

      // Resolve and merge schemas
      const schemas = await Promise.all(
        schemaDefs.map(schemaDef => resolveUntypedSchema(schemaDef)),
      )

      // Merge after normalization
      const schema = defu(...schemas as [Schema, Schema])

      // Allow hooking to extend resolved schema
      await nuxt.hooks.callHook('schema:resolved', schema)

      return schema
    }

    async function writeSchema (schema: Schema) {
      await nuxt.hooks.callHook('schema:beforeWrite', schema)
      // Write it to build dir
      await mkdir(resolve(nuxt.options.buildDir, 'schema'), { recursive: true })
      await writeFile(
        resolve(nuxt.options.buildDir, 'schema/nuxt.schema.json'),
        JSON.stringify(schema, null, 2),
        'utf8',
      )
      const _types = generateTypes(schema, {
        addExport: true,
        interfaceName: 'NuxtCustomSchema',
        partial: true,
        allowExtraKeys: false,
      })
      const types =
        _types +
        `
export type CustomAppConfig = Exclude<NuxtCustomSchema['appConfig'], undefined>
type _CustomAppConfig = CustomAppConfig

declare module '@nuxt/schema' {
  interface NuxtConfig extends Omit<NuxtCustomSchema, 'appConfig'> {}
  interface NuxtOptions extends Omit<NuxtCustomSchema, 'appConfig'> {}
  interface CustomAppConfig extends _CustomAppConfig {}
}

declare module 'nuxt/schema' {
  interface NuxtConfig extends Omit<NuxtCustomSchema, 'appConfig'> {}
  interface NuxtOptions extends Omit<NuxtCustomSchema, 'appConfig'> {}
  interface CustomAppConfig extends _CustomAppConfig {}
}
`
      const typesPath = resolve(
        nuxt.options.buildDir,
        'schema/nuxt.schema.d.ts',
      )
      await writeFile(typesPath, types, 'utf8')
      await nuxt.hooks.callHook('schema:written')
    }
  },
})
