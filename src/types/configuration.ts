import { z } from 'zod';
import { AuthTypes, Databases, Frameworks, Languages } from './models';

// OAuth Provider schema
export const OAuthProviderSchema = z.object({
  name: z.enum(['google', 'github', 'facebook', 'twitter', 'linkedin']),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  scopes: z.array(z.string()).default([]),
});

// Session configuration schema
export const SessionConfigSchema = z.object({
  secret: z.string().min(1),
  maxAge: z.number().positive().default(86400), // 24 hours in seconds
  secure: z.boolean().default(true),
  httpOnly: z.boolean().default(true),
  sameSite: z.enum(['strict', 'lax', 'none']).default('lax'),
});

// Role schema
export const RoleSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
  description: z.string().optional(),
});

// Authentication configuration schema
export const AuthConfigSchema = z.object({
  type: z.enum(AuthTypes),
  providers: z.array(OAuthProviderSchema).optional(),
  jwtSecret: z.string().optional(),
  sessionConfig: SessionConfigSchema.optional(),
  roles: z.array(RoleSchema).default([]),
  protectedRoutes: z.array(z.string()).default([]),
});

// Generation options schema
export const GenerationOptionsSchema = z.object({
  framework: z.enum(Frameworks),
  database: z.enum(Databases),
  authentication: z.enum(AuthTypes),
  language: z.enum(Languages),
  includeTests: z.boolean().default(true),
  includeDocumentation: z.boolean().default(true),
});

// Deployment configuration schema
export const DeploymentConfigSchema = z.object({
  platform: z.enum(['aws', 'gcp', 'azure', 'vercel', 'netlify', 'heroku']),
  region: z.string().optional(),
  environment: z
    .enum(['development', 'staging', 'production'])
    .default('production'),
  environmentVariables: z.record(z.string(), z.string()).default({}),
  customDomain: z.string().optional(),
});

// Generated file schema
export const GeneratedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['source', 'config', 'documentation', 'test']),
  language: z.string().optional(),
});

// Endpoint schema
export const EndpointSchema = z.object({
  id: z.string().uuid(),
  path: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  modelName: z.string().min(1),
  operation: z.enum(['create', 'read', 'update', 'delete', 'list']),
  authenticated: z.boolean().default(false),
  roles: z.array(z.string()).default([]),
  description: z.string().optional(),
});

// OpenAPI specification schema (simplified)
export const OpenAPISpecSchema = z.object({
  openapi: z.string().default('3.0.0'),
  info: z.object({
    title: z.string(),
    version: z.string().default('1.0.0'),
    description: z.string().optional(),
  }),
  servers: z
    .array(
      z.object({
        url: z.string(),
        description: z.string().optional(),
      })
    )
    .default([]),
  paths: z.record(z.string(), z.any()).default({}),
  components: z
    .object({
      schemas: z.record(z.string(), z.any()).default({}),
      securitySchemes: z.record(z.string(), z.any()).default({}),
    })
    .default(() => ({
      schemas: {},
      securitySchemes: {},
    })),
});

// Generated project schema
export const GeneratedProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  models: z.array(z.any()), // Will reference ModelSchema
  endpoints: z.array(EndpointSchema),
  authConfig: AuthConfigSchema,
  files: z.array(GeneratedFileSchema),
  openAPISpec: OpenAPISpecSchema,
  deploymentConfig: DeploymentConfigSchema.optional(),
  generationOptions: GenerationOptionsSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// TypeScript interfaces derived from schemas
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export type Endpoint = z.infer<typeof EndpointSchema>;
export type OpenAPISpec = z.infer<typeof OpenAPISpecSchema>;
export type GeneratedProject = z.infer<typeof GeneratedProjectSchema>;
