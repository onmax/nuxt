import type { SchemaDefinition } from 'untyped'
import { consola } from 'consola'

// Type definition for Standard Schema V1 compatibility
export interface StandardSchemaV1 {
  '~standard': {
    validate: (value: unknown) => any
    version: number
  }
}

// Type guard to check if a value is a Standard Schema
export function isStandardSchema (schema: any): schema is StandardSchemaV1 {
  return schema
    && typeof schema === 'object'
    && '~standard' in schema
    && typeof schema['~standard'] === 'object'
    && typeof schema['~standard'].validate === 'function'
}

// Type to represent either a JSON Schema or Standard Schema
export type ExtendedSchemaDefinition = SchemaDefinition | StandardSchemaV1

// Interface for schema extension with Standard Schema support
export interface StandardSchemaExtension {
  $standardSchema?: StandardSchemaV1
}

// Convert Standard Schema to JSON Schema (basic implementation)
export async function standardSchemaToJsonSchema (schema: StandardSchemaV1): Promise<SchemaDefinition> {
  // This is a simplified conversion - in practice, this would need to be more sophisticated
  // For now, we'll return a basic object schema that allows any properties
  // In a full implementation, this would introspect the Standard Schema and convert
  // its validation rules to JSON Schema format

  consola.warn('Standard Schema conversion is experimental. Full validation features may not be available.')

  return {
    type: 'object',
    additionalProperties: true,
    description: 'Schema converted from Standard Schema format',
  }
}

// Validate configuration using Standard Schema
export async function validateWithStandardSchema (
  schema: StandardSchemaV1,
  config: any,
): Promise<{ success: boolean, issues?: any[] }> {
  try {
    const result = await schema['~standard'].validate(config)

    // Handle different Standard Schema result formats
    if ('issues' in result && result.issues && result.issues.length > 0) {
      return {
        success: false,
        issues: result.issues,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      issues: [{ message: error instanceof Error ? error.message : 'Validation failed' }],
    }
  }
}

// Format validation issues for user-friendly display
export function formatStandardSchemaIssue (issue: any): string {
  const path = issue.path
    ? issue.path.map((p: any) => p && typeof p === 'object' && 'key' in p ? p.key : p).join('.')
    : 'root'
  return `${path}: ${issue.message || 'Validation error'}`
}
