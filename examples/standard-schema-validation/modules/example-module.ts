import { defineNuxtModule, extendNuxtStandardSchema } from '@nuxt/kit'
import { boolean, maxValue, minValue, number, object, optional, string, url } from 'valibot'

export interface ModuleOptions {
  apiEndpoint: string
  timeout?: number
  retries?: number
  enableDebug?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'example-module',
    configKey: 'exampleModule',
  },
  defaults: {
    apiEndpoint: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    enableDebug: false,
  },
  setup (options, nuxt) {
    // Add Standard Schema validation for this module's configuration
    extendNuxtStandardSchema('exampleModule', object({
      apiEndpoint: string([url('Must be a valid URL')]),
      timeout: optional(number([minValue(1000, 'Timeout must be at least 1000ms')])),
      retries: optional(number([
        minValue(0, 'Retries cannot be negative'),
        maxValue(10, 'Too many retries (max 10)'),
      ])),
      enableDebug: optional(boolean()),
    }))

    // Module setup logic would go here
    if (options.enableDebug) {
      console.log('Example module loaded with options:', options)
    }

    // Add a simple composable
    nuxt.hook('imports:extend', (imports) => {
      imports.push({
        name: 'useExampleModule',
        as: 'useExampleModule',
        from: '#build/example-module-composable',
      })
    })

    // Add the composable file
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.virtual ||= {}
      nitroConfig.virtual['#build/example-module-composable'] = `
export const useExampleModule = () => {
  return {
    apiEndpoint: '${options.apiEndpoint}',
    timeout: ${options.timeout},
    retries: ${options.retries},
    enableDebug: ${options.enableDebug}
  }
}
`
    })
  },
})
