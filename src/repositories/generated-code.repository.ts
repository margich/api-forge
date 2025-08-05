import { GeneratedCode } from '../generated/prisma';
import { prisma } from '../lib/database';
import {
  BaseRepository,
  FindManyOptions,
  NotFoundError,
  RepositoryError,
} from './base.repository';

export interface CreateGeneratedCodeInput {
  type: string;
  filename: string;
  content: string;
  hash: string;
  projectId: string;
}

export interface UpdateGeneratedCodeInput {
  type?: string;
  filename?: string;
  content?: string;
  hash?: string;
}

export class GeneratedCodeRepository
  implements
    BaseRepository<
      GeneratedCode,
      CreateGeneratedCodeInput,
      UpdateGeneratedCodeInput
    >
{
  async create(data: CreateGeneratedCodeInput): Promise<GeneratedCode> {
    try {
      return await prisma.generatedCode.create({
        data,
        include: {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to create generated code',
        error as Error
      );
    }
  }

  async findById(id: string): Promise<GeneratedCode | null> {
    try {
      return await prisma.generatedCode.findUnique({
        where: { id },
        include: {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find generated code',
        error as Error
      );
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<GeneratedCode[]> {
    try {
      return await prisma.generatedCode.findMany({
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
        include: options.include || {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find generated code',
        error as Error
      );
    }
  }

  async update(
    id: string,
    data: UpdateGeneratedCodeInput
  ): Promise<GeneratedCode> {
    try {
      const generatedCode = await prisma.generatedCode.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          project: true,
        },
      });
      return generatedCode;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('GeneratedCode', id);
      }
      throw new RepositoryError('Failed to update generated code', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.generatedCode.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('GeneratedCode', id);
      }
      throw new RepositoryError('Failed to delete generated code', error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await prisma.generatedCode.count({ where });
    } catch (error) {
      throw new RepositoryError(
        'Failed to count generated code',
        error as Error
      );
    }
  }

  // Additional generated code-specific methods
  async findByProjectId(projectId: string): Promise<GeneratedCode[]> {
    try {
      return await prisma.generatedCode.findMany({
        where: { projectId },
        orderBy: { filename: 'asc' },
        include: {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find generated code by project',
        error as Error
      );
    }
  }

  async findByType(projectId: string, type: string): Promise<GeneratedCode[]> {
    try {
      return await prisma.generatedCode.findMany({
        where: {
          projectId,
          type,
        },
        orderBy: { filename: 'asc' },
        include: {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find generated code by type',
        error as Error
      );
    }
  }

  async findByFilename(
    projectId: string,
    filename: string
  ): Promise<GeneratedCode | null> {
    try {
      return await prisma.generatedCode.findFirst({
        where: {
          projectId,
          filename,
        },
        include: {
          project: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find generated code by filename',
        error as Error
      );
    }
  }

  async upsertByFilename(
    projectId: string,
    filename: string,
    data: Omit<CreateGeneratedCodeInput, 'projectId'>
  ): Promise<GeneratedCode> {
    try {
      const existing = await this.findByFilename(projectId, filename);

      if (existing) {
        return await this.update(existing.id, data);
      } else {
        return await this.create({ ...data, projectId });
      }
    } catch (error) {
      throw new RepositoryError(
        'Failed to upsert generated code',
        error as Error
      );
    }
  }
}
