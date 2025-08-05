import { Model } from '../generated/prisma';
import { prisma } from '../lib/database';
import {
  BaseRepository,
  FindManyOptions,
  NotFoundError,
  RepositoryError,
} from './base.repository';

export interface CreateModelInput {
  name: string;
  projectId: string;
  tableName?: string;
  timestamps?: boolean;
  softDelete?: boolean;
  description?: string;
}

export interface UpdateModelInput {
  name?: string;
  tableName?: string;
  timestamps?: boolean;
  softDelete?: boolean;
  description?: string;
}

export class ModelRepository
  implements BaseRepository<Model, CreateModelInput, UpdateModelInput>
{
  async create(data: CreateModelInput): Promise<Model> {
    try {
      return await prisma.model.create({
        data,
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to create model', error as Error);
    }
  }

  async findById(id: string): Promise<Model | null> {
    try {
      return await prisma.model.findUnique({
        where: { id },
        include: {
          fields: true,
          sourceRelationships: {
            include: {
              targetModel: true,
            },
          },
          targetRelationships: {
            include: {
              sourceModel: true,
            },
          },
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find model', error as Error);
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<Model[]> {
    try {
      return await prisma.model.findMany({
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
        include: options.include || {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find models', error as Error);
    }
  }

  async update(id: string, data: UpdateModelInput): Promise<Model> {
    try {
      const model = await prisma.model.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
          project: true,
        },
      });
      return model;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Model', id);
      }
      throw new RepositoryError('Failed to update model', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.model.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Model', id);
      }
      throw new RepositoryError('Failed to delete model', error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await prisma.model.count({ where });
    } catch (error) {
      throw new RepositoryError('Failed to count models', error as Error);
    }
  }

  // Additional model-specific methods
  async findByProjectId(projectId: string): Promise<Model[]> {
    try {
      return await prisma.model.findMany({
        where: { projectId },
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find models by project',
        error as Error
      );
    }
  }

  async findByName(projectId: string, name: string): Promise<Model | null> {
    try {
      return await prisma.model.findFirst({
        where: {
          projectId,
          name,
        },
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find model by name', error as Error);
    }
  }
}
