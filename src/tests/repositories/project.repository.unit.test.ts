import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../repositories/base.repository';
import { ProjectRepository } from '../../repositories/project.repository';

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
  },
}));

import { prisma } from '../../lib/database';

describe('ProjectRepository Unit Tests', () => {
  let projectRepository: ProjectRepository;

  beforeEach(() => {
    projectRepository = new ProjectRepository();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
      };

      const mockProject = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
        generatedCode: [],
      };

      (prisma.project.create as any).mockResolvedValue(mockProject);

      const result = await projectRepository.create(projectData);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: projectData,
        include: {
          models: true,
          generatedCode: true,
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should handle creation errors', async () => {
      const projectData = {
        name: 'Test Project',
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
      };

      (prisma.project.create as any).mockRejectedValue(
        new Error('Database error')
      );

      await expect(projectRepository.create(projectData)).rejects.toThrow(
        'Failed to create project'
      );
    });
  });

  describe('findById', () => {
    it('should find a project by id', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
        generatedCode: [],
      };

      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const result = await projectRepository.findById(projectId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        include: {
          models: {
            include: {
              fields: true,
              sourceRelationships: true,
              targetRelationships: true,
            },
          },
          generatedCode: true,
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent project', async () => {
      const projectId = 'non-existent-id';
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const result = await projectRepository.findById(projectId);

      expect(result).toBeNull();
    });

    it('should handle find errors', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      (prisma.project.findUnique as any).mockRejectedValue(
        new Error('Database error')
      );

      await expect(projectRepository.findById(projectId)).rejects.toThrow(
        'Failed to find project'
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: 'Updated Project',
        description: 'Updated description',
      };

      const mockUpdatedProject = {
        id: projectId,
        name: 'Updated Project',
        description: 'Updated description',
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
        generatedCode: [],
      };

      (prisma.project.update as any).mockResolvedValue(mockUpdatedProject);

      const result = await projectRepository.update(projectId, updateData);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date),
        },
        include: {
          models: true,
          generatedCode: true,
        },
      });
      expect(result).toEqual(mockUpdatedProject);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const projectId = 'non-existent-id';
      const updateData = { name: 'Updated' };

      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      (prisma.project.update as any).mockRejectedValue(error);

      await expect(
        projectRepository.update(projectId, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      const projectId = '123e4567-e89b-12d3-a456-426614174000';
      (prisma.project.delete as any).mockResolvedValue({});

      await projectRepository.delete(projectId);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });

    it('should throw NotFoundError for non-existent project', async () => {
      const projectId = 'non-existent-id';

      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      (prisma.project.delete as any).mockRejectedValue(error);

      await expect(projectRepository.delete(projectId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('count', () => {
    it('should count projects', async () => {
      (prisma.project.count as any).mockResolvedValue(5);

      const result = await projectRepository.count();

      expect(prisma.project.count).toHaveBeenCalledWith({ where: undefined });
      expect(result).toBe(5);
    });

    it('should count projects with filter', async () => {
      const whereClause = { framework: 'express' };
      (prisma.project.count as any).mockResolvedValue(3);

      const result = await projectRepository.count(whereClause);

      expect(prisma.project.count).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toBe(3);
    });
  });

  describe('findByName', () => {
    it('should find a project by name', async () => {
      const projectName = 'Test Project';
      const mockProject = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: projectName,
        framework: 'express',
        database: 'postgresql',
        authType: 'jwt',
        language: 'typescript',
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
        generatedCode: [],
      };

      (prisma.project.findFirst as any).mockResolvedValue(mockProject);

      const result = await projectRepository.findByName(projectName);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { name: projectName },
        include: {
          models: true,
          generatedCode: true,
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent project name', async () => {
      const projectName = 'Non-existent Project';
      (prisma.project.findFirst as any).mockResolvedValue(null);

      const result = await projectRepository.findByName(projectName);

      expect(result).toBeNull();
    });
  });
});
