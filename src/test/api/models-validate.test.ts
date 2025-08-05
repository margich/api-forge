import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/models/validate/route';

// Mock the model validation service
vi.mock('../../services/modelValidationService', () => ({
  modelValidationService: {
    validateModel: vi.fn(),
    validateModels: vi.fn(),
    validateRelationships: vi.fn(),
  },
}));

const { modelValidationService } = await import(
  '../../services/modelValidationService'
);
const mockValidationService = vi.mocked(modelValidationService);

describe('/api/models/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single model validation', () => {
    it('should validate a single model successfully', async () => {
      const mockModel = {
        id: '1',
        name: 'User',
        fields: [
          {
            id: '1',
            name: 'id',
            type: 'uuid' as const,
            required: true,
            unique: true,
            validation: [],
          },
          {
            id: '2',
            name: 'name',
            type: 'string' as const,
            required: true,
            unique: false,
            validation: [],
          },
        ],
        relationships: [],
        metadata: { timestamps: true, softDelete: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [
          {
            field: 'fields[1].validation',
            message: 'String fields should have length validation rules',
            code: 'MISSING_STRING_VALIDATION',
          },
        ],
      };

      mockValidationService.validateModel.mockReturnValue(mockValidation);

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ model: mockModel }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('single');
      expect(data.data.validation.isValid).toBe(true);
      expect(data.data.validation.warnings).toHaveLength(1);
      expect(mockValidationService.validateModel).toHaveBeenCalledWith(
        mockModel
      );
    });

    it('should return validation errors for invalid model', async () => {
      const mockModel = {
        id: '1',
        name: 'user', // Invalid: should start with uppercase
        fields: [], // Invalid: no fields
        relationships: [],
        metadata: { timestamps: true, softDelete: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockValidation = {
        isValid: false,
        errors: [
          {
            field: 'fields',
            message: 'Model must have at least one field',
            code: 'NO_FIELDS_ERROR',
          },
        ],
        warnings: [
          {
            field: 'name',
            message:
              'Model name should start with uppercase letter and use PascalCase',
            code: 'NAMING_CONVENTION_WARNING',
          },
        ],
      };

      mockValidationService.validateModel.mockReturnValue(mockValidation);

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ model: mockModel }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.validation.isValid).toBe(false);
      expect(data.data.validation.errors).toHaveLength(1);
      expect(data.data.validation.warnings).toHaveLength(1);
    });
  });

  describe('Multiple models validation', () => {
    it('should validate multiple models successfully', async () => {
      const mockModels = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'id',
              type: 'uuid' as const,
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Post',
          fields: [
            {
              id: '2',
              name: 'id',
              type: 'uuid' as const,
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [
            {
              id: '1',
              type: 'oneToMany' as const,
              sourceModel: 'Post',
              targetModel: 'User',
              sourceField: 'userId',
              targetField: 'id',
              cascadeDelete: false,
            },
          ],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const mockRelationshipValidation = {
        isValid: true,
        errors: [],
        circularReferences: [],
      };

      mockValidationService.validateModels.mockReturnValue(mockValidation);
      mockValidationService.validateRelationships.mockReturnValue(
        mockRelationshipValidation
      );

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ models: mockModels }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('multiple');
      expect(data.data.validation.isValid).toBe(true);
      expect(data.data.relationshipValidation.isValid).toBe(true);
      expect(mockValidationService.validateModels).toHaveBeenCalledWith(
        mockModels
      );
      expect(mockValidationService.validateRelationships).toHaveBeenCalledWith(
        mockModels
      );
    });

    it('should detect relationship validation errors', async () => {
      const mockModels = [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'id',
              type: 'uuid' as const,
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [
            {
              id: '1',
              type: 'oneToMany' as const,
              sourceModel: 'User',
              targetModel: 'NonExistentModel', // Invalid target
              sourceField: 'id',
              targetField: 'userId',
              cascadeDelete: false,
            },
          ],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const mockRelationshipValidation = {
        isValid: false,
        errors: [
          {
            field: 'models[0].relationships[0].targetModel',
            message: "Target model 'NonExistentModel' does not exist",
            code: 'TARGET_MODEL_NOT_FOUND',
          },
        ],
        circularReferences: [],
      };

      mockValidationService.validateModels.mockReturnValue(mockValidation);
      mockValidationService.validateRelationships.mockReturnValue(
        mockRelationshipValidation
      );

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ models: mockModels }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.relationshipValidation.isValid).toBe(false);
      expect(data.data.relationshipValidation.errors).toHaveLength(1);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for missing model/models field', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('model" or "models" field');
    });

    it('should return 400 for invalid model schema', async () => {
      const invalidModel = {
        id: 'invalid-uuid', // Invalid UUID
        name: '', // Empty name
        fields: 'not-an-array', // Invalid type
      };

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ model: invalidModel }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      const mockModel = {
        id: '1',
        name: 'User',
        fields: [],
        relationships: [],
        metadata: { timestamps: true, softDelete: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidationService.validateModel.mockImplementation(() => {
        throw new Error('Service error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/models/validate',
        {
          method: 'POST',
          body: JSON.stringify({ model: mockModel }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_SERVER_ERROR');
      expect(data.message).toBe('Service error');
    });
  });
});
