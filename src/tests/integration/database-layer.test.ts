import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkDatabaseConnection, withTransaction } from '../../lib/database';
import {
  fieldRepository,
  generatedCodeRepository,
  modelRepository,
  projectRepository,
  relationshipRepository,
} from '../../repositories';

// Mock the prisma client
vi.mock('../../lib/database', () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    model: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    field: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    relationship: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    generatedCode: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
  checkDatabaseConnection: vi.fn(),
  withTransaction: vi.fn(),
}));

import { prisma } from '../../lib/database';

describe('Database Layer Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Repository Integration', () => {
    it('should create a complete project with models and fields', async () => {
      // Mock data
      const projectData = {
        name: 'E-commerce API',
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
      };

      const mockProject = {
        id: 'project-123',
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
        generatedCode: [],
      };

      const mockModel = {
        id: 'model-123',
        name: 'User',
        projectId: 'project-123',
        timestamps: true,
        softDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        fields: [],
        sourceRelationships: [],
        targetRelationships: [],
        project: mockProject,
      };

      const mockField = {
        id: 'field-123',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        modelId: 'model-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        model: mockModel,
      };

      // Setup mocks
      (prisma.project.create as any).mockResolvedValue(mockProject);
      (prisma.model.create as any).mockResolvedValue(mockModel);
      (prisma.field.create as any).mockResolvedValue(mockField);

      // Test the workflow
      const project = await projectRepository.create(projectData);
      expect(project.id).toBe('project-123');

      const model = await modelRepository.create({
        name: 'User',
        projectId: project.id,
      });
      expect(model.id).toBe('model-123');

      const field = await fieldRepository.create({
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        modelId: model.id,
      });
      expect(field.id).toBe('field-123');

      // Verify all repositories were called correctly
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: projectData,
        include: {
          models: true,
          generatedCode: true,
        },
      });

      expect(prisma.model.create).toHaveBeenCalledWith({
        data: {
          name: 'User',
          projectId: 'project-123',
        },
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
          project: true,
        },
      });

      expect(prisma.field.create).toHaveBeenCalledWith({
        data: {
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          modelId: 'model-123',
        },
        include: {
          model: true,
        },
      });
    });

    it('should handle relationships between models', async () => {
      const mockRelationship = {
        id: 'relationship-123',
        type: 'oneToMany',
        sourceModelId: 'user-model-123',
        targetModelId: 'post-model-123',
        sourceField: 'posts',
        targetField: 'userId',
        cascadeDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceModel: { id: 'user-model-123', name: 'User' },
        targetModel: { id: 'post-model-123', name: 'Post' },
      };

      (prisma.relationship.create as any).mockResolvedValue(mockRelationship);

      const relationship = await relationshipRepository.create({
        type: 'oneToMany',
        sourceModelId: 'user-model-123',
        targetModelId: 'post-model-123',
        sourceField: 'posts',
        targetField: 'userId',
      });

      expect(relationship.id).toBe('relationship-123');
      expect(prisma.relationship.create).toHaveBeenCalledWith({
        data: {
          type: 'oneToMany',
          sourceModelId: 'user-model-123',
          targetModelId: 'post-model-123',
          sourceField: 'posts',
          targetField: 'userId',
        },
        include: {
          sourceModel: true,
          targetModel: true,
        },
      });
    });

    it('should manage generated code metadata', async () => {
      const mockGeneratedCode = {
        id: 'generated-123',
        type: 'model',
        filename: 'user.model.ts',
        content: 'export class User { ... }',
        hash: 'abc123',
        projectId: 'project-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        project: { id: 'project-123', name: 'Test Project' },
      };

      (prisma.generatedCode.create as any).mockResolvedValue(mockGeneratedCode);

      const generatedCode = await generatedCodeRepository.create({
        type: 'model',
        filename: 'user.model.ts',
        content: 'export class User { ... }',
        hash: 'abc123',
        projectId: 'project-123',
      });

      expect(generatedCode.id).toBe('generated-123');
      expect(prisma.generatedCode.create).toHaveBeenCalledWith({
        data: {
          type: 'model',
          filename: 'user.model.ts',
          content: 'export class User { ... }',
          hash: 'abc123',
          projectId: 'project-123',
        },
        include: {
          project: true,
        },
      });
    });
  });

  describe('Database Utilities', () => {
    it('should check database connection', async () => {
      (prisma.$queryRaw as any).mockResolvedValue([{ result: 1 }]);
      (checkDatabaseConnection as any).mockResolvedValue(true);

      const isConnected = await checkDatabaseConnection();
      expect(isConnected).toBe(true);
    });

    it('should handle database connection failure', async () => {
      (prisma.$queryRaw as any).mockRejectedValue(
        new Error('Connection failed')
      );
      (checkDatabaseConnection as any).mockResolvedValue(false);

      const isConnected = await checkDatabaseConnection();
      expect(isConnected).toBe(false);
    });

    it('should support transactions', async () => {
      const mockTransactionCallback = vi
        .fn()
        .mockResolvedValue('transaction result');
      (prisma.$transaction as any).mockImplementation((callback) =>
        callback(prisma)
      );
      (withTransaction as any).mockImplementation((callback) =>
        prisma.$transaction(callback)
      );

      const result = await withTransaction(mockTransactionCallback);

      expect(result).toBe('transaction result');
      expect(mockTransactionCallback).toHaveBeenCalledWith(prisma);
    });
  });

  describe('Repository Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      (prisma.project.create as any).mockRejectedValue(
        new Error('Database constraint violation')
      );

      await expect(
        projectRepository.create({
          name: 'Test Project',
          framework: 'express',
          database: 'postgresql',
          authType: 'jwt',
          language: 'typescript',
        })
      ).rejects.toThrow('Failed to create project');
    });

    it('should handle not found errors', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      (prisma.project.update as any).mockRejectedValue(error);

      await expect(
        projectRepository.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Project with id non-existent-id not found');
    });
  });
});
