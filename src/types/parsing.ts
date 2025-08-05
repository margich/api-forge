import { z } from 'zod';

// Parsing result schemas
export const SuggestionSchema = z.object({
  type: z.enum(['field', 'relationship', 'model', 'validation']),
  message: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error']),
  modelId: z.string().optional(),
  fieldId: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
  warnings: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })
  ),
});

export const ParsedModelsSchema = z.object({
  models: z.array(z.any()), // Will reference ModelSchema
  confidence: z.number().min(0).max(1),
  suggestions: z.array(SuggestionSchema),
  ambiguities: z.array(
    z.object({
      text: z.string(),
      possibleInterpretations: z.array(z.string()),
    })
  ),
});

export const ModelChangeSchema = z.object({
  type: z.enum(['create', 'update', 'delete']),
  modelId: z.string(),
  fieldId: z.string().optional(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  timestamp: z.date().default(() => new Date()),
});

// TypeScript interfaces derived from schemas
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ParsedModels = z.infer<typeof ParsedModelsSchema>;
export type ModelChange = z.infer<typeof ModelChangeSchema>;
