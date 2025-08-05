import { Relationship } from '../generated/prisma';
import { prisma } from '../lib/database';
import {
  BaseRepository,
  FindManyOptions,
  NotFoundError,
  RepositoryError,
} from './base.repository';

export interface CreateRelationshipInput {
  type: string;
  sourceModelId: string;
  targetModelId: string;
  sourceField: string;
  targetField: string;
  cascadeDelete?: boolean;
}

export interface UpdateRelationshipInput {
  type?: string;
  sourceField?: string;
  targetField?: string;
  cascadeDelete?: boolean;
}

export class RelationshipRepository
  implements
    BaseRepository<
      Relationship,
      CreateRelationshipInput,
      UpdateRelationshipInput
    >
{
  async create(data: CreateRelationshipInput): Promise<Relationship> {
    try {
      return await prisma.relationship.create({
        data,
        include: {
          sourceModel: true,
          targetModel: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to create relationship',
        error as Error
      );
    }
  }

  async findById(id: string): Promise<Relationship | null> {
    try {
      return await prisma.relationship.findUnique({
        where: { id },
        include: {
          sourceModel: true,
          targetModel: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find relationship', error as Error);
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<Relationship[]> {
    try {
      return await prisma.relationship.findMany({
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
        include: options.include || {
          sourceModel: true,
          targetModel: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find relationships', error as Error);
    }
  }

  async update(
    id: string,
    data: UpdateRelationshipInput
  ): Promise<Relationship> {
    try {
      const relationship = await prisma.relationship.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          sourceModel: true,
          targetModel: true,
        },
      });
      return relationship;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Relationship', id);
      }
      throw new RepositoryError('Failed to update relationship', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.relationship.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Relationship', id);
      }
      throw new RepositoryError('Failed to delete relationship', error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await prisma.relationship.count({ where });
    } catch (error) {
      throw new RepositoryError(
        'Failed to count relationships',
        error as Error
      );
    }
  }

  // Additional relationship-specific methods
  async findBySourceModel(sourceModelId: string): Promise<Relationship[]> {
    try {
      return await prisma.relationship.findMany({
        where: { sourceModelId },
        include: {
          sourceModel: true,
          targetModel: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find relationships by source model',
        error as Error
      );
    }
  }

  async findByTargetModel(targetModelId: string): Promise<Relationship[]> {
    try {
      return await prisma.relationship.findMany({
        where: { targetModelId },
        include: {
          sourceModel: true,
          targetModel: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find relationships by target model',
        error as Error
      );
    }
  }

  async findByModel(modelId: string): Promise<Relationship[]> {
    try {
      return await prisma.relationship.findMany({
        where: {
          OR: [{ sourceModelId: modelId }, { targetModelId: modelId }],
        },
        include: {
          sourceModel: true,
          targetModel: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find relationships by model',
        error as Error
      );
    }
  }
}
