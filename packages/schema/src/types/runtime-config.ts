/**
 * A compact description of a runtime config value, which the server applies environment
 * variables against on startup.
 *
 * - `'s'`, `'n'`, `'i'`, `'b'`, `'z'`: string, number, integer, boolean and `null`
 * - `'*'`: any value
 * - `{ t }`: a string, number or integer with the checks from its JSON Schema
 * - `{ e }`: one of the listed values
 * - `{ o }`: any of the listed schemas, tried in order
 * - `{ a }`: an array of the given schema
 * - `{ p, r, d }`: an object with the given properties, of which `r` are required, and `d` are
 *   the defaults of its properties
 */
export type RuntimeConfigSchemaNode =
  | 's' | 'n' | 'i' | 'b' | 'z' | '*'
  | RuntimeConfigSchemaString
  | RuntimeConfigSchemaNumber
  | { e: unknown[] }
  | { o: RuntimeConfigSchemaNode[] }
  | { a: RuntimeConfigSchemaNode }
  | RuntimeConfigSchemaObject

export interface RuntimeConfigSchemaString {
  t: 's'
  minLength?: number
  maxLength?: number
  /**
   * A regular expression the string must match. JSON Schema has no flags, so a match that
   * ignores case and line breaks is accepted too.
   */
  pattern?: string
  /** `uri` is any value `new URL()` accepts. */
  format?: 'uri' | 'email'
}

export interface RuntimeConfigSchemaNumber {
  t: 'n' | 'i'
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}

export interface RuntimeConfigSchemaObject {
  p: Record<string, RuntimeConfigSchemaNode>
  r?: string[]
  d?: Record<string, unknown>
}

/** A schema declared at a path within `runtimeConfig`. */
export interface RuntimeConfigSchemaEntry {
  path: string[]
  node: RuntimeConfigSchemaNode
  /** Whether a value must be provided at runtime, as the schema has no default. */
  required: boolean
  /** Whether the schema was set by a module with `updateRuntimeConfig`, rather than in `nuxt.config`. */
  module?: boolean
}
