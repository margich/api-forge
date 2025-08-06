import { z } from 'zod';

// Enums and constants
export const FieldTypes = [
  'string',
  'number',
  'boolean',
  'date',
  'email',
  'url',
  'uuid',
  'json',
  'text',
  'integer',
  'float',
  'decimal',
] as const;

export const RelationshipTypes = [
  'oneToOne',
  'oneToMany',
  'manyToMany',
] as const;

export const Frameworks = ['express', 'fastify', 'koa'] as const;
export const Databases = ['postgresql', 'mysql', 'mongodb'] as const;
export const AuthTypes = ['jwt', 'oauth', 'session'] as const;
export const Languages = ['typescript', 'javascript'] as const;

// Type definitions
export type FieldType = (typeof FieldTypes)[number];
export type RelationshipType = (typeof RelationshipTypes)[number];
export type Framework = (typeof Frameworks)[number];
export type Database = (typeof Databases)[number];
export type AuthType = (typeof AuthTypes)[number];
export type Language = (typeof Languages)[number];

// Validation schemas
export const ValidationRuleSchema = z.object({
  type: z.enum(['minLength', 'maxLength', 'min', 'max', 'pattern', 'custom']),
  value: z.union([z.string(), z.number()]),
  message: z.string().optional(),
});

export const FieldSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(FieldTypes),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.array(ValidationRuleSchema).default([]),
  description: z.string().optional(),
});

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(RelationshipTypes),
  sourceModel: z.string().min(1),
  targetModel: z.string().min(1),
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
  cascadeDelete: z.boolean().default(false),
});

export const ModelMetadataSchema = z.object({
  tableName: z.string().optional(),
  timestamps: z.boolean().default(true),
  softDelete: z.boolean().default(false),
  description: z.string().optional(),
  requiresAuth: z.boolean().default(true),
  allowedRoles: z.array(z.string()).default([]),
});

export const ModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  fields: z.array(FieldSchema),
  relationships: z.array(RelationshipSchema).default([]),
  metadata: ModelMetadataSchema.default(() => ({
    timestamps: true,
    softDelete: false,
  })),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// TypeScript interfaces derived from schemas
export type ValidationRule = z.infer<typeof ValidationRuleSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type ModelMetadata = z.infer<typeof ModelMetadataSchema>;
export type Model = z.infer<typeof ModelSchema>;
