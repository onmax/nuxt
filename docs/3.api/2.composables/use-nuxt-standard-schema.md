---
title: 'Standard Schema Support'
description: 'Extend Nuxt configuration validation with Standard Schema (Zod, Valibot, ArkType, etc.)'
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/nuxt/nuxt/blob/main/packages/schema/src/utils/standard-schema.ts
    size: xs
---

Nuxt 3 supports [Standard Schema](https://github.com/standard-schema/standard-schema) for configuration validation, enabling you to use popular validation libraries like Zod, Valibot, and ArkType to validate your Nuxt configuration at build time.

## Overview

Standard Schema support allows you to:

1. **App-level validation**: Validate your entire `nuxt.config.ts` or specific parts using `$schema`
2. **Module-level validation**: Module authors can provide Standard Schema validation for their module options
3. **Partial validation**: Only validate specific configuration sections while leaving others unvalidated
4. **Build-time errors**: Get detailed validation errors during development and build time

## App-level Configuration Validation

### Basic Usage

You can use Standard Schema to validate your entire configuration or specific parts:

```ts [nuxt.config.ts]
import { object, string, number } from 'valibot'

export default defineNuxtConfig({
  runtimeConfig: {
    baseApi: 'https://api.example.com',
    apiKey: process.env.API_KEY || '',
    timeout: 5000
  },
  
  // Validate only runtimeConfig
  $schema: object({
    runtimeConfig: object({
      baseApi: string(),
      apiKey: string(),
      timeout: number()
    })
  })
})
```

### Using Zod

```ts [nuxt.config.ts]
import { z } from 'zod'

export default defineNuxtConfig({
  runtimeConfig: {
    baseApi: 'https://api.example.com',
    apiKey: process.env.API_KEY || '',
    timeout: 5000
  },
  
  $schema: z.object({
    runtimeConfig: z.object({
      baseApi: z.string().url(),
      apiKey: z.string().min(1),
      timeout: z.number().positive()
    })
  })
})
```

### Validation Behavior

- **Partial validation**: Only keys defined in your schema are validated
- **Extra keys allowed**: Keys not in your schema are ignored (no errors)
- **Strict mode**: Use `.strict()` in Zod or equivalent in other libraries to disallow extra keys
- **Build-time errors**: Validation failures abort the build with detailed error messages

## Module-level Schema Validation

### For Module Authors

Module authors can provide Standard Schema validation for their module options:

```ts [modules/my-module/module.ts]
import { defineNuxtModule } from '@nuxt/kit'
import { extendNuxtStandardSchema } from '@nuxt/kit'
import { z } from 'zod'

export default defineNuxtModule({
  meta: { name: 'my-awesome-module' },
  setup(_, nuxt) {
    // Add Standard Schema validation for this module
    extendNuxtStandardSchema('myAwesomeModule', z.object({
      endpoint: z.string().url(),
      apiKey: z.string().min(1),
      timeout: z.number().positive().optional().default(5000),
      retries: z.number().int().min(0).max(5).default(3)
    }))
  }
})
```

### User Configuration

When a user configures the module, validation runs automatically:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['my-awesome-module'],
  
  myAwesomeModule: {
    endpoint: 'https://api.example.com', // ✅ Valid URL
    apiKey: 'secret-key',                // ✅ Valid string
    timeout: 3000,                       // ✅ Valid positive number
    retries: 2,                          // ✅ Valid integer 0-5
    // extraProperty: true               // ✅ Allowed (ignored)
  }
})
```

### Validation Errors

If validation fails, you'll see detailed error messages:

```bash
❌ [Nuxt Schema] Standard Schema validation failed for "myAwesomeModule":
  1. endpoint: Expected string, received number
  2. timeout: Number must be greater than 0
```

## Advanced Examples

### Complex Validation with Valibot

```ts [nuxt.config.ts]
import { object, string, number, optional, url, minLength } from 'valibot'

export default defineNuxtConfig({
  runtimeConfig: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp',
      ssl: false
    },
    api: {
      baseUrl: 'https://api.example.com',
      version: 'v1',
      timeout: 30000
    }
  },
  
  $schema: object({
    runtimeConfig: object({
      database: object({
        host: string([minLength(1)]),
        port: number(),
        name: string([minLength(1)]),
        ssl: optional(boolean())
      }),
      api: object({
        baseUrl: string([url()]),
        version: string(),
        timeout: optional(number())
      })
    })
  })
})
```

### Runtime Config with Environment Variables

```ts [nuxt.config.ts]
import { z } from 'zod'

export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only (private)
    databaseUrl: process.env.DATABASE_URL,
    apiSecret: process.env.API_SECRET,
    
    public: {
      // Client-side (public)
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com'
    }
  },
  
  $schema: z.object({
    runtimeConfig: z.object({
      databaseUrl: z.string().url(),
      apiSecret: z.string().min(32),
      public: z.object({
        apiBaseUrl: z.string().url()
      })
    })
  })
})
```

## Migration from JSON Schema

If you're currently using JSON Schema with `$schema`, migration is straightforward:

### Before (JSON Schema)

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  runtimeConfig: {
    apiKey: 'secret'
  },
  
  $schema: {
    type: 'object',
    properties: {
      runtimeConfig: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' }
        },
        required: ['apiKey']
      }
    }
  }
})
```

### After (Standard Schema)

```ts [nuxt.config.ts]
import { z } from 'zod'

export default defineNuxtConfig({
  runtimeConfig: {
    apiKey: 'secret'
  },
  
  $schema: z.object({
    runtimeConfig: z.object({
      apiKey: z.string()
    })
  })
})
```

## Supported Libraries

Standard Schema support works with any library that implements the [Standard Schema specification](https://github.com/standard-schema/standard-schema):

- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[Valibot](https://valibot.dev/)** - Modular and lightweight validation library  
- **[ArkType](https://arktype.io/)** - TypeScript's 1:1 validator
- **[Joi](https://joi.dev/)** - Object schema validation (with adapter)
- **[Yup](https://github.com/jquense/yup)** - Object schema builder (with adapter)

## Error Handling

### Development Mode

In development, validation errors are logged to the console and the dev server continues running:

```bash
❌ [Nuxt Schema] Standard Schema validation failed:
  1. runtimeConfig.apiKey: Expected string, received number (123)
  2. runtimeConfig.timeout: Number must be greater than 0 (-1)
```

### Build Mode

In production builds, validation errors abort the build process:

```bash
❌ [Nuxt Schema] Standard Schema validation failed:
  1. runtimeConfig.baseUrl: Invalid URL format
   
Error: Configuration validation failed
    at resolveSchema (/path/to/project/.nuxt/dist/server/index.mjs:1234:5)
```

## Best Practices

### 1. Start with Partial Validation

Begin by validating only critical configuration sections:

```ts
// Good: Validate only what matters most
$schema: z.object({
  runtimeConfig: z.object({
    apiKey: z.string().min(1),
    databaseUrl: z.string().url()
  })
})
```

### 2. Use Transformations

Leverage Standard Schema transformations for data coercion:

```ts
import { z } from 'zod'

$schema: z.object({
  runtimeConfig: z.object({
    port: z.string().transform(Number).pipe(z.number().positive()),
    debug: z.string().transform(val => val === 'true')
  })
})
```

### 3. Provide Helpful Error Messages

Use custom error messages for better developer experience:

```ts
import { z } from 'zod'

$schema: z.object({
  runtimeConfig: z.object({
    apiKey: z.string().min(1, 'API key is required and cannot be empty'),
    baseUrl: z.string().url('Base URL must be a valid URL')
  })
})
```

### 4. Module Configuration

For modules, validate at the module level rather than requiring users to add schemas:

```ts [modules/my-module/module.ts]
export default defineNuxtModule({
  setup(options, nuxt) {
    // Validate module options automatically
    extendNuxtStandardSchema('myModule', MyModuleSchema)
  }
})
```

## TypeScript Integration

Standard Schema validation works seamlessly with TypeScript. When using Zod or other TypeScript-first libraries, you get:

- **Type inference**: Configuration types are automatically inferred from your schema
- **IDE support**: Autocomplete and error checking in your editor
- **Type safety**: Compile-time checks ensure your configuration matches your schema

```ts
import { z } from 'zod'

const ConfigSchema = z.object({
  runtimeConfig: z.object({
    apiKey: z.string(),
    timeout: z.number()
  })
})

export default defineNuxtConfig({
  // TypeScript will enforce this matches ConfigSchema
  runtimeConfig: {
    apiKey: 'secret',
    timeout: 5000
  },
  $schema: ConfigSchema
})
``` 
