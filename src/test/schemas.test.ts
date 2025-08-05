import { describe, expect, it } from 'vitest';
import {
  AuthConfigSchema,
  DeploymentConfigSchema,
  EndpointSchema,
  GeneratedFileSchema,
  GenerationOptionsSchema,
} from '../types/configuration';
import {
  FieldSchema,
  ModelMetadataSchema,
  ModelSchema,
  RelationshipSchema,
  ValidationRuleSchema,
} from '../types/models';
import {
  ModelChangeSchema,
  ParsedModelsSchema,
  SuggestionSchema,
  ValidationResultSchema,
} from '../types/parsing';

describe('Zod Schemas', () => {
  describe('ValidationRuleSchema', () => {
    it('should validate a correct validation rule', () => {
      const validRule = {
        type: 'minLength',
        value: 5,
        message: 'Must be at least 5 characters',
      };

      const result = ValidationRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('should invalidate a rule with invalid type', () => {
      const invalidRule = {
        type: 'invalidType',
        value: 5,
      };

      const result = ValidationRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });
  });

  describe('FieldSchema', () => {
    it('should validate a correct field', () => {
      const validField = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        validation: [],
      };

      const result = FieldSchema.safeParse(validField);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalField = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'name',
        type: 'string',
      };

      const result = FieldSchema.safeParse(minimalField);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required).toBe(false);
        expect(result.data.unique).toBe(false);
        expect(result.data.validation).toEqual([]);
      }
    });

    it('should invalidate a field with invalid UUID', () => {
      const invalidField = {
        id: 'invalid-uuid',
        name: 'name',
        type: 'string',
      };

      const result = FieldSchema.safeParse(invalidField);
      expect(result.success).toBe(false);
    });

    it('should invalidate a field with empty name', () => {
      const invalidField = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        type: 'string',
      };

      const result = FieldSchema.safeParse(invalidField);
      expect(result.success).toBe(false);
    });

    it('should invalidate a field with invalid type', () => {
      const invalidField = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'field',
        type: 'invalidType',
      };

      const result = FieldSchema.safeParse(invalidField);
      expect(result.success).toBe(false);
    });
  });

  describe('RelationshipSchema', () => {
    it('should validate a correct relationship', () => {
      const validRelationship = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'oneToMany',
        sourceModel: 'User',
        targetModel: 'Post',
        sourceField: 'id',
        targetField: 'userId',
        cascadeDelete: true,
      };

      const result = RelationshipSchema.safeParse(validRelationship);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalRelationship = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'oneToOne',
        sourceModel: 'User',
        targetModel: 'Profile',
        sourceField: 'id',
        targetField: 'userId',
      };

      const result = RelationshipSchema.safeParse(minimalRelationship);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cascadeDelete).toBe(false);
      }
    });

    it('should invalidate a relationship with invalid type', () => {
      const invalidRelationship = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalidType',
        sourceModel: 'User',
        targetModel: 'Post',
        sourceField: 'id',
        targetField: 'userId',
      };

      const result = RelationshipSchema.safeParse(invalidRelationship);
      expect(result.success).toBe(false);
    });
  });

  describe('ModelMetadataSchema', () => {
    it('should validate correct metadata', () => {
      const validMetadata = {
        tableName: 'users',
        timestamps: true,
        softDelete: false,
        description: 'User model',
      };

      const result = ModelMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const emptyMetadata = {};

      const result = ModelMetadataSchema.safeParse(emptyMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timestamps).toBe(true);
        expect(result.data.softDelete).toBe(false);
      }
    });
  });

  describe('ModelSchema', () => {
    it('should validate a correct model', () => {
      const validModel = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'User',
        fields: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'name',
            type: 'string',
            required: true,
            unique: false,
            validation: [],
          },
        ],
        relationships: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = ModelSchema.safeParse(validModel);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalModel = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'User',
        fields: [],
      };

      const result = ModelSchema.safeParse(minimalModel);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relationships).toEqual([]);
        expect(result.data.metadata).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('AuthConfigSchema', () => {
    it('should validate JWT auth config', () => {
      const jwtConfig = {
        type: 'jwt',
        jwtSecret: 'secret-key',
        roles: [
          {
            name: 'admin',
            permissions: ['read', 'write', 'delete'],
          },
        ],
        protectedRoutes: ['/api/admin'],
      };

      const result = AuthConfigSchema.safeParse(jwtConfig);
      expect(result.success).toBe(true);
    });

    it('should validate OAuth config', () => {
      const oauthConfig = {
        type: 'oauth',
        providers: [
          {
            name: 'google',
            clientId: 'client-id',
            clientSecret: 'client-secret',
            scopes: ['profile', 'email'],
          },
        ],
        roles: [],
        protectedRoutes: [],
      };

      const result = AuthConfigSchema.safeParse(oauthConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('GenerationOptionsSchema', () => {
    it('should validate correct generation options', () => {
      const options = {
        framework: 'express',
        database: 'postgresql',
        authentication: 'jwt',
        language: 'typescript',
        includeTests: true,
        includeDocumentation: true,
      };

      const result = GenerationOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalOptions = {
        framework: 'express',
        database: 'postgresql',
        authentication: 'jwt',
        language: 'typescript',
      };

      const result = GenerationOptionsSchema.safeParse(minimalOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeTests).toBe(true);
        expect(result.data.includeDocumentation).toBe(true);
      }
    });
  });

  describe('DeploymentConfigSchema', () => {
    it('should validate correct deployment config', () => {
      const config = {
        platform: 'aws',
        region: 'us-east-1',
        environment: 'production',
        environmentVariables: {
          NODE_ENV: 'production',
          DATABASE_URL: 'postgres://...',
        },
        customDomain: 'api.example.com',
      };

      const result = DeploymentConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalConfig = {
        platform: 'aws',
      };

      const result = DeploymentConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.environment).toBe('production');
        expect(result.data.environmentVariables).toEqual({});
      }
    });
  });

  describe('EndpointSchema', () => {
    it('should validate correct endpoint', () => {
      const endpoint = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        path: '/api/users',
        method: 'GET',
        modelName: 'User',
        operation: 'list',
        authenticated: true,
        roles: ['admin'],
        description: 'List all users',
      };

      const result = EndpointSchema.safeParse(endpoint);
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const minimalEndpoint = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        path: '/api/users',
        method: 'GET',
        modelName: 'User',
        operation: 'read',
      };

      const result = EndpointSchema.safeParse(minimalEndpoint);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authenticated).toBe(false);
        expect(result.data.roles).toEqual([]);
      }
    });
  });

  describe('GeneratedFileSchema', () => {
    it('should validate correct generated file', () => {
      const file = {
        path: 'src/models/User.ts',
        content: 'export class User {}',
        type: 'source',
        language: 'typescript',
      };

      const result = GeneratedFileSchema.safeParse(file);
      expect(result.success).toBe(true);
    });

    it('should invalidate file with empty path', () => {
      const file = {
        path: '',
        content: 'content',
        type: 'source',
      };

      const result = GeneratedFileSchema.safeParse(file);
      expect(result.success).toBe(false);
    });
  });

  describe('SuggestionSchema', () => {
    it('should validate correct suggestion', () => {
      const suggestion = {
        type: 'field',
        message: 'Consider adding a unique constraint',
        severity: 'warning',
        modelId: '123e4567-e89b-12d3-a456-426614174000',
        fieldId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = SuggestionSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });

    it('should validate suggestion without optional fields', () => {
      const suggestion = {
        type: 'model',
        message: 'Model looks good',
        severity: 'info',
      };

      const result = SuggestionSchema.safeParse(suggestion);
      expect(result.success).toBe(true);
    });
  });

  describe('ValidationResultSchema', () => {
    it('should validate correct validation result', () => {
      const result = {
        isValid: false,
        errors: [
          {
            field: 'name',
            message: 'Name is required',
            code: 'REQUIRED',
          },
        ],
        warnings: [
          {
            field: 'email',
            message: 'Email format might be invalid',
            code: 'FORMAT_WARNING',
          },
        ],
      };

      const validationResult = ValidationResultSchema.safeParse(result);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('ParsedModelsSchema', () => {
    it('should validate correct parsed models', () => {
      const parsedModels = {
        models: [],
        confidence: 0.85,
        suggestions: [
          {
            type: 'field',
            message: 'Consider adding validation',
            severity: 'info',
          },
        ],
        ambiguities: [
          {
            text: 'user profile',
            possibleInterpretations: [
              'User model with profile field',
              'Separate UserProfile model',
            ],
          },
        ],
      };

      const result = ParsedModelsSchema.safeParse(parsedModels);
      expect(result.success).toBe(true);
    });

    it('should invalidate parsed models with invalid confidence', () => {
      const parsedModels = {
        models: [],
        confidence: 1.5, // Invalid: > 1
        suggestions: [],
        ambiguities: [],
      };

      const result = ParsedModelsSchema.safeParse(parsedModels);
      expect(result.success).toBe(false);
    });
  });

  describe('ModelChangeSchema', () => {
    it('should validate correct model change', () => {
      const change = {
        type: 'update',
        modelId: '123e4567-e89b-12d3-a456-426614174000',
        fieldId: '123e4567-e89b-12d3-a456-426614174001',
        oldValue: 'oldName',
        newValue: 'newName',
        timestamp: new Date(),
      };

      const result = ModelChangeSchema.safeParse(change);
      expect(result.success).toBe(true);
    });

    it('should apply default timestamp', () => {
      const change = {
        type: 'create',
        modelId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = ModelChangeSchema.safeParse(change);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timestamp).toBeInstanceOf(Date);
      }
    });
  });
});
