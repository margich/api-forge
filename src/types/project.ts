import { z } from 'zod';
import { AuthConfigSchema, GenerationOptionsSchema } from './configuration';
import { ModelSchema } from './models';

// Project status enum
export const ProjectStatus = [
  'draft',
  'ready',
  'generated',
  'deployed',
] as const;
export type ProjectStatusType = (typeof ProjectStatus)[number];

// Project schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(ProjectStatus).default('draft'),
  models: z.array(ModelSchema).default([]),
  generationOptions: GenerationOptionsSchema.optional(),
  authConfig: AuthConfigSchema.optional(),
  originalPrompt: z.string().optional(),
  lastModified: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  userId: z.string().optional(), // For future user authentication
});

// Project summary for listing
export const ProjectSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(ProjectStatus),
  modelCount: z.number().int().min(0),
  lastModified: z.date(),
  createdAt: z.date(),
});

// Session data schema
export const SessionDataSchema = z.object({
  currentProjectId: z.string().uuid().optional(),
  recentProjects: z.array(z.string().uuid()).max(10).default([]),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      autoSave: z.boolean().default(true),
      showTips: z.boolean().default(true),
    })
    .default(() => ({
      theme: 'system',
      autoSave: true,
      showTips: true,
    })),
  lastActivity: z.date().default(() => new Date()),
});

// TypeScript interfaces
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export type SessionData = z.infer<typeof SessionDataSchema>;

// Project creation input
export type CreateProjectInput = Pick<
  Project,
  'name' | 'description' | 'originalPrompt'
>;

// Project update input
export type UpdateProjectInput = Partial<
  Omit<Project, 'id' | 'createdAt' | 'userId'>
>;
