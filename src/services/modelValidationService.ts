import { z } from 'zod';
import {
  Field,
  FieldSchema,
  Model,
  ModelSchema,
  RelationshipSchema,
} from '../types/models';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  circularReferences: string[];
}

export class ModelValidationService {
  /**
   * Validate a single model structure
   */
  validateModel(model: Model): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Validate against schema
      ModelSchema.parse(model);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: 'SCHEMA_VALIDATION_ERROR',
          });
        });
      }
    }

    // Validate model name conventions
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
      warnings.push({
        field: 'name',
        message:
          'Model name should start with uppercase letter and use PascalCase',
        code: 'NAMING_CONVENTION_WARNING',
      });
    }

    // Validate field names are unique
    const fieldNames = new Set<string>();
    model.fields.forEach((field, index) => {
      if (fieldNames.has(field.name)) {
        errors.push({
          field: `fields[${index}].name`,
          message: `Duplicate field name: ${field.name}`,
          code: 'DUPLICATE_FIELD_NAME',
        });
      }
      fieldNames.add(field.name);

      // Validate field naming conventions
      if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
        warnings.push({
          field: `fields[${index}].name`,
          message:
            'Field name should start with lowercase letter and use camelCase',
          code: 'FIELD_NAMING_CONVENTION_WARNING',
        });
      }
    });

    // Validate at least one field exists
    if (model.fields.length === 0) {
      errors.push({
        field: 'fields',
        message: 'Model must have at least one field',
        code: 'NO_FIELDS_ERROR',
      });
    }

    // Validate primary key field exists (id field)
    const hasIdField = model.fields.some(
      (field) => field.name === 'id' && field.type === 'uuid' && field.unique
    );

    if (!hasIdField) {
      warnings.push({
        field: 'fields',
        message: 'Model should have an id field of type uuid that is unique',
        code: 'NO_PRIMARY_KEY_WARNING',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple models and their relationships
   */
  validateModels(models: Model[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate each model individually
    models.forEach((model, index) => {
      const modelValidation = this.validateModel(model);

      modelValidation.errors.forEach((error) => {
        errors.push({
          ...error,
          field: `models[${index}].${error.field}`,
        });
      });

      modelValidation.warnings.forEach((warning) => {
        warnings.push({
          ...warning,
          field: `models[${index}].${warning.field}`,
        });
      });
    });

    // Validate model names are unique
    const modelNames = new Set<string>();
    models.forEach((model, index) => {
      if (modelNames.has(model.name)) {
        errors.push({
          field: `models[${index}].name`,
          message: `Duplicate model name: ${model.name}`,
          code: 'DUPLICATE_MODEL_NAME',
        });
      }
      modelNames.add(model.name);
    });

    // Validate relationships
    const relationshipValidation = this.validateRelationships(models);
    errors.push(...relationshipValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate relationships between models
   */
  validateRelationships(models: Model[]): RelationshipValidationResult {
    const errors: ValidationError[] = [];
    const modelMap = new Map(models.map((model) => [model.name, model]));
    const circularReferences: string[] = [];

    models.forEach((model, modelIndex) => {
      model.relationships.forEach((relationship, relIndex) => {
        const fieldPath = `models[${modelIndex}].relationships[${relIndex}]`;

        // Validate relationship schema
        try {
          RelationshipSchema.parse(relationship);
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
              errors.push({
                field: `${fieldPath}.${err.path.join('.')}`,
                message: err.message,
                code: 'RELATIONSHIP_SCHEMA_ERROR',
              });
            });
          }
        }

        // Validate target model exists
        const targetModel = modelMap.get(relationship.targetModel);
        if (!targetModel) {
          errors.push({
            field: `${fieldPath}.targetModel`,
            message: `Target model '${relationship.targetModel}' does not exist`,
            code: 'TARGET_MODEL_NOT_FOUND',
          });
          return;
        }

        // Validate source field exists in source model
        const sourceFieldExists = model.fields.some(
          (field) => field.name === relationship.sourceField
        );
        if (!sourceFieldExists) {
          errors.push({
            field: `${fieldPath}.sourceField`,
            message: `Source field '${relationship.sourceField}' does not exist in model '${model.name}'`,
            code: 'SOURCE_FIELD_NOT_FOUND',
          });
        }

        // Validate target field exists in target model
        const targetFieldExists = targetModel.fields.some(
          (field) => field.name === relationship.targetField
        );
        if (!targetFieldExists) {
          errors.push({
            field: `${fieldPath}.targetField`,
            message: `Target field '${relationship.targetField}' does not exist in model '${relationship.targetModel}'`,
            code: 'TARGET_FIELD_NOT_FOUND',
          });
        }

        // Check for circular references
        if (
          this.hasCircularReference(
            model.name,
            relationship.targetModel,
            models,
            new Set()
          )
        ) {
          const circularPath = `${model.name} -> ${relationship.targetModel}`;
          if (!circularReferences.includes(circularPath)) {
            circularReferences.push(circularPath);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      circularReferences,
    };
  }

  /**
   * Check for circular references in relationships
   */
  private hasCircularReference(
    startModel: string,
    currentModel: string,
    models: Model[],
    visited: Set<string>
  ): boolean {
    if (visited.has(currentModel)) {
      return currentModel === startModel;
    }

    visited.add(currentModel);

    const model = models.find((m) => m.name === currentModel);
    if (!model) return false;

    for (const relationship of model.relationships) {
      if (
        this.hasCircularReference(
          startModel,
          relationship.targetModel,
          models,
          new Set(visited)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate field types and constraints
   */
  validateField(field: Field): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      FieldSchema.parse(field);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: 'FIELD_SCHEMA_ERROR',
          });
        });
      }
    }

    // Validate field-specific constraints
    if (field.type === 'email' && field.validation.length === 0) {
      warnings.push({
        field: 'validation',
        message: 'Email fields should have email validation rules',
        code: 'MISSING_EMAIL_VALIDATION',
      });
    }

    if (field.type === 'string' && field.validation.length === 0) {
      warnings.push({
        field: 'validation',
        message: 'String fields should have length validation rules',
        code: 'MISSING_STRING_VALIDATION',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const modelValidationService = new ModelValidationService();
