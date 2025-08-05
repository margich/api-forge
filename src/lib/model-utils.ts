import { v4 as uuidv4 } from 'uuid';
import {
  Field,
  FieldSchema,
  FieldType,
  Model,
  ModelSchema,
  Relationship,
  RelationshipSchema,
  RelationshipType,
} from '../types/models';
import { ValidationResult } from '../types/parsing';

/**
 * Creates a new model with default values
 */
export function createModel(name: string, description?: string): Model {
  return {
    id: uuidv4(),
    name,
    fields: [],
    relationships: [],
    metadata: {
      description,
      timestamps: true,
      softDelete: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Creates a new field with default values
 */
export function createField(
  name: string,
  type: FieldType,
  options: Partial<Omit<Field, 'id' | 'name' | 'type'>> = {}
): Field {
  return {
    id: uuidv4(),
    name,
    type,
    required: options.required ?? false,
    unique: options.unique ?? false,
    defaultValue: options.defaultValue,
    validation: options.validation ?? [],
    description: options.description,
  };
}

/**
 * Creates a new relationship with default values
 */
export function createRelationship(
  type: RelationshipType,
  sourceModel: string,
  targetModel: string,
  sourceField: string,
  targetField: string,
  cascadeDelete = false
): Relationship {
  return {
    id: uuidv4(),
    type,
    sourceModel,
    targetModel,
    sourceField,
    targetField,
    cascadeDelete,
  };
}

/**
 * Validates a model using Zod schema
 */
export function validateModel(model: unknown): ValidationResult {
  const result = ModelSchema.safeParse(model);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    isValid: false,
    errors,
    warnings: [],
  };
}

/**
 * Validates a field using Zod schema
 */
export function validateField(field: unknown): ValidationResult {
  const result = FieldSchema.safeParse(field);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    isValid: false,
    errors,
    warnings: [],
  };
}

/**
 * Validates a relationship using Zod schema
 */
export function validateRelationship(relationship: unknown): ValidationResult {
  const result = RelationshipSchema.safeParse(relationship);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    isValid: false,
    errors,
    warnings: [],
  };
}

/**
 * Validates relationships between models
 */
export function validateModelRelationships(models: Model[]): ValidationResult {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];
  const modelNames = new Set(models.map((m) => m.name));

  for (const model of models) {
    for (const relationship of model.relationships) {
      // Check if target model exists
      if (!modelNames.has(relationship.targetModel)) {
        errors.push({
          field: `${model.name}.relationships.${relationship.id}`,
          message: `Target model '${relationship.targetModel}' does not exist`,
          code: 'INVALID_TARGET_MODEL',
        });
      }

      // Check if source field exists
      const sourceField = model.fields.find(
        (f) => f.name === relationship.sourceField
      );
      if (!sourceField) {
        errors.push({
          field: `${model.name}.relationships.${relationship.id}`,
          message: `Source field '${relationship.sourceField}' does not exist in model '${model.name}'`,
          code: 'INVALID_SOURCE_FIELD',
        });
      }

      // Check if target field exists in target model
      const targetModel = models.find(
        (m) => m.name === relationship.targetModel
      );
      if (targetModel) {
        const targetField = targetModel.fields.find(
          (f) => f.name === relationship.targetField
        );
        if (!targetField) {
          errors.push({
            field: `${model.name}.relationships.${relationship.id}`,
            message: `Target field '${relationship.targetField}' does not exist in model '${relationship.targetModel}'`,
            code: 'INVALID_TARGET_FIELD',
          });
        }
      }
    }

    // Check for duplicate field names
    const fieldNames = model.fields.map((f) => f.name);
    const duplicateFields = fieldNames.filter(
      (name, index) => fieldNames.indexOf(name) !== index
    );
    if (duplicateFields.length > 0) {
      errors.push({
        field: `${model.name}.fields`,
        message: `Duplicate field names found: ${duplicateFields.join(', ')}`,
        code: 'DUPLICATE_FIELD_NAMES',
      });
    }
  }

  // Check for duplicate model names
  const modelNamesList = models.map((m) => m.name);
  const duplicateModels = modelNamesList.filter(
    (name, index) => modelNamesList.indexOf(name) !== index
  );
  if (duplicateModels.length > 0) {
    errors.push({
      field: 'models',
      message: `Duplicate model names found: ${duplicateModels.join(', ')}`,
      code: 'DUPLICATE_MODEL_NAMES',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Adds a field to a model
 */
export function addFieldToModel(model: Model, field: Field): Model {
  return {
    ...model,
    fields: [...model.fields, field],
    updatedAt: new Date(),
  };
}

/**
 * Updates a field in a model
 */
export function updateFieldInModel(
  model: Model,
  fieldId: string,
  updates: Partial<Field>
): Model {
  return {
    ...model,
    fields: model.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates } : field
    ),
    updatedAt: new Date(),
  };
}

/**
 * Removes a field from a model
 */
export function removeFieldFromModel(model: Model, fieldId: string): Model {
  return {
    ...model,
    fields: model.fields.filter((field) => field.id !== fieldId),
    updatedAt: new Date(),
  };
}

/**
 * Adds a relationship to a model
 */
export function addRelationshipToModel(
  model: Model,
  relationship: Relationship
): Model {
  return {
    ...model,
    relationships: [...model.relationships, relationship],
    updatedAt: new Date(),
  };
}

/**
 * Updates a relationship in a model
 */
export function updateRelationshipInModel(
  model: Model,
  relationshipId: string,
  updates: Partial<Relationship>
): Model {
  return {
    ...model,
    relationships: model.relationships.map((rel) =>
      rel.id === relationshipId ? { ...rel, ...updates } : rel
    ),
    updatedAt: new Date(),
  };
}

/**
 * Removes a relationship from a model
 */
export function removeRelationshipFromModel(
  model: Model,
  relationshipId: string
): Model {
  return {
    ...model,
    relationships: model.relationships.filter(
      (rel) => rel.id !== relationshipId
    ),
    updatedAt: new Date(),
  };
}

/**
 * Gets all models that have relationships with the given model
 */
export function getRelatedModels(models: Model[], modelName: string): Model[] {
  return models.filter((model) =>
    model.relationships.some(
      (rel) => rel.sourceModel === modelName || rel.targetModel === modelName
    )
  );
}

/**
 * Checks if a field name is valid (follows naming conventions)
 */
export function isValidFieldName(name: string): boolean {
  // Must start with letter, can contain letters, numbers, underscores
  const fieldNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  return fieldNameRegex.test(name) && name.length <= 100;
}

/**
 * Checks if a model name is valid (follows naming conventions)
 */
export function isValidModelName(name: string): boolean {
  // Must start with letter, can contain letters and numbers, PascalCase preferred
  const modelNameRegex = /^[A-Z][a-zA-Z0-9]*$/;
  return modelNameRegex.test(name) && name.length <= 100;
}

/**
 * Converts a model name to table name (snake_case)
 */
export function modelNameToTableName(modelName: string): string {
  return modelName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .concat('s'); // Pluralize
}

/**
 * Gets the default value for a field type
 */
export function getDefaultValueForFieldType(fieldType: FieldType): any {
  switch (fieldType) {
    case 'string':
    case 'email':
    case 'url':
    case 'uuid':
    case 'text':
      return '';
    case 'number':
    case 'integer':
    case 'float':
    case 'decimal':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return new Date();
    case 'json':
      return {};
    default:
      return null;
  }
}
