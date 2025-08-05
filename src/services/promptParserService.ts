import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  Field,
  FieldTypes,
  Model,
  ParsedModels,
  RelationshipTypes,
  Suggestion,
  ValidationResult,
} from '../types';

// Schema for AI-generated model extraction
const ExtractedModelSchema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(
        z.object({
          name: z.string(),
          type: z.enum(FieldTypes),
          required: z.boolean().default(false),
          unique: z.boolean().default(false),
          description: z.string().optional(),
        })
      ),
    })
  ),
  relationships: z.array(
    z.object({
      sourceModel: z.string(),
      targetModel: z.string(),
      type: z.enum(RelationshipTypes),
      description: z.string().optional(),
    })
  ),
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(
    z.object({
      text: z.string(),
      reason: z.string(),
      suggestions: z.array(z.string()),
    })
  ),
});

type ExtractedModel = z.infer<typeof ExtractedModelSchema>;

/**
 * Service for parsing natural language prompts and extracting data models using AI
 */
export class PromptParserService {
  private openaiClient: typeof openai;

  constructor() {
    this.openaiClient = openai;
  }

  /**
   * Parse a natural language prompt and extract data models using AI
   */
  async parsePrompt(prompt: string): Promise<ParsedModels> {
    try {
      if (!prompt.trim()) {
        return {
          models: [],
          confidence: 0,
          suggestions: [
            {
              type: 'model',
              message: 'Please provide a description of your data models.',
              severity: 'warning',
            },
          ],
          ambiguities: [],
        };
      }

      // Use AI to extract structured data from the prompt
      const { object: extractedData } = await generateObject({
        model: this.openaiClient('gpt-4o-mini'),
        schema: ExtractedModelSchema,
        prompt: this.buildExtractionPrompt(prompt),
      });

      // Convert AI-extracted data to our internal model format
      const models = this.convertToInternalModels(extractedData);

      // Generate suggestions based on the extracted models
      const suggestions = this.generateSuggestions(models, extractedData);

      // Convert ambiguities to our format
      const ambiguities = extractedData.ambiguities.map((amb) => ({
        text: amb.text,
        possibleInterpretations: amb.suggestions,
      }));

      return {
        models,
        confidence: extractedData.confidence,
        suggestions,
        ambiguities,
      };
    } catch (error) {
      console.error('Error parsing prompt with AI:', error);

      // Fallback to basic parsing if AI fails
      return this.fallbackParsing(prompt);
    }
  }

  /**
   * Validate extracted models for consistency and completeness
   */
  validateModels(models: Model[]): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> =
      [];

    // Check for duplicate model names
    const modelNames = models.map((m) => m.name.toLowerCase());
    const duplicateNames = modelNames.filter(
      (name, index) => modelNames.indexOf(name) !== index
    );

    if (duplicateNames.length > 0) {
      errors.push({
        field: 'models',
        message: `Duplicate model names found: ${duplicateNames.join(', ')}`,
        code: 'DUPLICATE_MODEL_NAMES',
      });
    }

    // Validate each model
    models.forEach((model, modelIndex) => {
      // Check for empty models
      if (model.fields.length === 0) {
        warnings.push({
          field: `models[${modelIndex}].fields`,
          message: `Model "${model.name}" has no fields defined`,
          code: 'EMPTY_MODEL',
        });
      }

      // Check for duplicate field names within a model
      const fieldNames = model.fields.map((f) => f.name.toLowerCase());
      const duplicateFields = fieldNames.filter(
        (name, index) => fieldNames.indexOf(name) !== index
      );

      if (duplicateFields.length > 0) {
        errors.push({
          field: `models[${modelIndex}].fields`,
          message: `Duplicate field names in model "${model.name}": ${duplicateFields.join(', ')}`,
          code: 'DUPLICATE_FIELD_NAMES',
        });
      }

      // Validate relationships
      model.relationships.forEach((relationship, relIndex) => {
        const targetModelExists = models.some(
          (m) => m.name === relationship.targetModel
        );
        if (!targetModelExists) {
          errors.push({
            field: `models[${modelIndex}].relationships[${relIndex}]`,
            message: `Target model "${relationship.targetModel}" not found for relationship in "${model.name}"`,
            code: 'INVALID_RELATIONSHIP_TARGET',
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate suggestions for improving model definitions
   */
  suggestImprovements(models: Model[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    models.forEach((model) => {
      // Suggest adding ID field if missing
      const hasIdField = model.fields.some(
        (f) => f.name.toLowerCase() === 'id' || f.type === 'uuid'
      );

      if (!hasIdField) {
        suggestions.push({
          type: 'field',
          message: `Consider adding an ID field to model "${model.name}"`,
          severity: 'info',
          modelId: model.id,
        });
      }

      // Suggest adding timestamps if enabled in metadata
      if (model.metadata.timestamps) {
        const hasCreatedAt = model.fields.some((f) =>
          f.name.toLowerCase().includes('created')
        );
        const hasUpdatedAt = model.fields.some((f) =>
          f.name.toLowerCase().includes('updated')
        );

        if (!hasCreatedAt) {
          suggestions.push({
            type: 'field',
            message: `Consider adding a "createdAt" timestamp field to model "${model.name}"`,
            severity: 'info',
            modelId: model.id,
          });
        }

        if (!hasUpdatedAt) {
          suggestions.push({
            type: 'field',
            message: `Consider adding an "updatedAt" timestamp field to model "${model.name}"`,
            severity: 'info',
            modelId: model.id,
          });
        }
      }

      // Suggest validation for email fields
      model.fields.forEach((field) => {
        if (field.type === 'email' && field.validation.length === 0) {
          suggestions.push({
            type: 'validation',
            message: `Consider adding email validation to field "${field.name}" in model "${model.name}"`,
            severity: 'info',
            modelId: model.id,
            fieldId: field.id,
          });
        }
      });
    });

    return suggestions;
  }

  /**
   * Build the prompt for AI model extraction
   */
  private buildExtractionPrompt(userPrompt: string): string {
    return `
You are an expert database designer and API architect. Analyze the following natural language description and extract structured data models.

User Description: "${userPrompt}"

Your task is to:
1. Identify all data entities/models mentioned or implied
2. Extract fields for each model with appropriate data types
3. Identify relationships between models
4. Assess confidence in your extraction (0-1 scale)
5. Note any ambiguities or unclear parts

Guidelines:
- Model names should be singular and PascalCase (e.g., "User", "BlogPost")
- Field names should be camelCase (e.g., "firstName", "createdAt")
- Choose appropriate field types from: ${FieldTypes.join(', ')}
- Relationship types: ${RelationshipTypes.join(', ')}
- Mark fields as required if they seem essential (like name, email for users)
- Mark fields as unique if they should be unique (like email, username)
- Be conservative with confidence - only high confidence (0.8+) if very clear
- Identify ambiguous terms or unclear relationships

Common patterns:
- Users typically have: id, name/firstName/lastName, email, password, createdAt, updatedAt
- Products typically have: id, name, description, price, createdAt, updatedAt
- Posts/Articles typically have: id, title, content, published, authorId, createdAt, updatedAt
- Orders typically have: id, userId, total, status, orderDate, createdAt, updatedAt

If the description mentions authentication, include appropriate user fields.
If it mentions e-commerce, include product and order models.
If it mentions content management, include post/article models.
`;
  }

  /**
   * Convert AI-extracted data to internal model format
   */
  private convertToInternalModels(extractedData: ExtractedModel): Model[] {
    const models: Model[] = [];

    // First pass: create models with fields
    extractedData.models.forEach((aiModel) => {
      const fields: Field[] = [];

      // Add ID field if not present
      const hasIdField = aiModel.fields.some(
        (f) => f.name.toLowerCase() === 'id'
      );
      if (!hasIdField) {
        fields.push({
          id: uuidv4(),
          name: 'id',
          type: 'uuid',
          required: true,
          unique: true,
          validation: [],
          description: `Unique identifier for ${aiModel.name}`,
        });
      }

      // Add extracted fields
      aiModel.fields.forEach((aiField) => {
        fields.push({
          id: uuidv4(),
          name: aiField.name,
          type: aiField.type,
          required: aiField.required,
          unique: aiField.unique,
          validation:
            aiField.type === 'email'
              ? [
                  {
                    type: 'pattern',
                    value: '^[^@]+@[^@]+\\.[^@]+$',
                    message: 'Invalid email format',
                  },
                ]
              : [],
          description:
            aiField.description || `${aiField.name} field for ${aiModel.name}`,
        });
      });

      models.push({
        id: uuidv4(),
        name: aiModel.name,
        fields,
        relationships: [], // Will be populated in second pass
        metadata: {
          timestamps: true,
          softDelete: false,
          description: aiModel.description || `${aiModel.name} model`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Second pass: add relationships
    extractedData.relationships.forEach((aiRelationship) => {
      const sourceModel = models.find(
        (m) => m.name === aiRelationship.sourceModel
      );
      if (sourceModel) {
        sourceModel.relationships.push({
          id: uuidv4(),
          type: aiRelationship.type,
          sourceModel: aiRelationship.sourceModel,
          targetModel: aiRelationship.targetModel,
          sourceField: `${aiRelationship.targetModel.toLowerCase()}Id`,
          targetField: 'id',
          cascadeDelete: false,
        });
      }
    });

    return models;
  }

  /**
   * Generate suggestions based on AI extraction results
   */
  private generateSuggestions(
    models: Model[],
    extractedData: ExtractedModel
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (models.length === 0) {
      suggestions.push({
        type: 'model',
        message:
          'No models were detected. Try describing your data entities more explicitly.',
        severity: 'warning',
      });
    }

    if (extractedData.confidence < 0.7) {
      suggestions.push({
        type: 'model',
        message:
          'The model extraction has low confidence. Consider providing more detailed descriptions.',
        severity: 'warning',
      });
    }

    if (models.length === 1) {
      suggestions.push({
        type: 'model',
        message:
          'Consider adding relationships between models to create a more complete data structure.',
        severity: 'info',
      });
    }

    // Add model-specific suggestions
    models.forEach((model) => {
      if (model.fields.length <= 2) {
        suggestions.push({
          type: 'field',
          message: `Model "${model.name}" has very few fields. Consider adding more descriptive fields.`,
          severity: 'info',
          modelId: model.id,
        });
      }
    });

    return suggestions;
  }

  /**
   * Fallback parsing when AI is unavailable
   */
  private fallbackParsing(prompt: string): ParsedModels {
    // Simple keyword-based extraction as fallback
    const models: Model[] = [];
    const suggestions: Suggestion[] = [
      {
        type: 'model',
        message:
          'AI parsing unavailable. Using basic keyword extraction. Results may be incomplete.',
        severity: 'warning',
      },
    ];

    // Basic entity extraction
    const commonEntities = [
      'user',
      'product',
      'order',
      'post',
      'comment',
      'category',
    ];
    const lowerPrompt = prompt.toLowerCase();

    commonEntities.forEach((entity) => {
      if (lowerPrompt.includes(entity)) {
        const fields: Field[] = [
          {
            id: uuidv4(),
            name: 'id',
            type: 'uuid',
            required: true,
            unique: true,
            validation: [],
            description: `Unique identifier for ${entity}`,
          },
          {
            id: uuidv4(),
            name: 'name',
            type: 'string',
            required: true,
            unique: false,
            validation: [],
            description: `Name of the ${entity}`,
          },
        ];

        models.push({
          id: uuidv4(),
          name: this.capitalize(entity),
          fields,
          relationships: [],
          metadata: {
            timestamps: true,
            softDelete: false,
            description: `${entity} model (fallback extraction)`,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    return {
      models,
      confidence: 0.3, // Low confidence for fallback
      suggestions,
      ambiguities: [],
    };
  }

  /**
   * Utility function to capitalize strings
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

// Export singleton instance
export const promptParserService = new PromptParserService();
