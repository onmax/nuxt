import { boolean, number, object, optional, string } from 'valibot'

export default defineNuxtConfig({
  // Example configuration with various types

  // Standard Schema validation using Valibot
  $schema: object({
    runtimeConfig: object({
      // Server-side validation
      databaseUrl: string(),
      apiSecret: string(),
      port: number(),

      public: object({
        // Client-side validation
        apiBaseUrl: string(),
        enableAnalytics: boolean(),
        maxRetries: number(),
      }),
    }),

    // Custom feature validation
    myFeature: optional(object({
      endpoint: string(),
      timeout: optional(number()),
      retries: optional(number()),
      enableLogging: optional(boolean()),
    })),
  }),
  runtimeConfig: {
    // Server-side configuration
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',
    apiSecret: process.env.API_SECRET || 'super-secret-key',
    port: Number.parseInt(process.env.PORT || '3000'),

    public: {
      // Client-side configuration
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
      enableAnalytics: process.env.NUXT_PUBLIC_ANALYTICS === 'true',
      maxRetries: Number.parseInt(process.env.NUXT_PUBLIC_MAX_RETRIES || '3'),
    },
  },

  // Custom app configuration
  myFeature: {
    endpoint: 'https://feature.api.com',
    timeout: 5000,
    retries: 3,
    enableLogging: true,
  },
})
