import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../app/api/models/route';

// Mock the model repository
vi.mock('../../repositories/model.repository', () => ({
  ModelRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    findByProjectId: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  })),
}));

const { ModelRepository } = await import('../../repositories/model.repository');
const MockModelRepository = vi.mocked(ModelRepository);

describe('/api/models', () => {
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = new MockModelRepository();
  });

  describe('GET /api/models', () => {
    it('should return paginated models', async () => {
      const mockModels = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User',
          projectId: '550e8400-e29b-41d4-a716-446655440001',
          tableName: 'users',
          timestamps: true,
          softDelete: false,
          description: 'User model',
          createdAt: new Date(),
          updatedAt: new Date(),
          fields: [],
          sourceRelationships: [],
          targetRelationships: [],
          project: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Test Project',
          },
        },
      ];

      mockRepository.findMany.mockResolvedValue(mockModels);
      mockRepository.count.mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/models?page=1&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.models).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(20);
      expect(data.data.pagination.total).toBe(1);
    });

    it('should filter models by projectId', async () => {
      const mockModels = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'User',
          projectId: '550e8400-e29b-41d4-a716-446655440001',
          fields: [],
          sourceRelationships: [],
          targetRelationships: [],
        },
      ];

      mockRepository.findByProjectId.mockResolvedValue(mockModels);

      const request = new NextRequest(
        'http://localhost:3000/api/models?projectId=550e8400-e29b-41d4-a716-446655440001'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.models).toHaveLength(1);
      expect(mockRepository.findByProjectId).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001'
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/models?page=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/models', () => {
    it('should create a new model successfully', async () => {
      const newModel = {
        name: 'User',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        description: 'User model',
      };

      const createdModel = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...newModel,
        tableName: null,
        timestamps: true,
        softDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [],
        sourceRelationships: [],
        targetRelationships: [],
        project: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Project',
        },
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdModel);

      const request = new NextRequest('http://localhost:3000/api/models', {
        method: 'POST',
        body: JSON.stringify(newModel),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.model.name).toBe('User');
      expect(mockRepository.create).toHaveBeenCalledWith(newModel);
    });
  });
});
