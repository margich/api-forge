import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/models/relationships/route';

// Mock the model validation service
vi.mock('../../services/modelValidationService', () => ({
  modelValidationService: {
    validateRelationships: vi.fn(),
  },
}));

const { modelValidationService } = await import(
  '../../services/modelValidationService'
);
const mockValidationService = vi.mocked(modelValidationService);

describe('/api/models/relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze relationships successfully', async () => {
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
            targetModel: 'Post',
            sourceField: 'id',
            targetField: 'userId',
            cascadeDelete: false,
          },
        ],
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
        relationships: [],
        metadata: { timestamps: true, softDelete: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockValidation = {
      isValid: true,
      errors: [],
      circularReferences: [],
    };

    mockValidationService.validateRelationships.mockReturnValue(mockValidation);

    const request = new NextRequest(
      'http://localhost:3000/api/models/relationships',
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
    expect(data.data.validation.isValid).toBe(true);
    expect(data.data.analysis).toBeDefined();
    expect(data.data.analysis.totalRelationships).toBe(1);
    expect(data.data.analysis.relationshipTypes.oneToMany).toBe(1);
  });
});
