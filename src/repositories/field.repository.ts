import { Field } from '../generated/prisma';
import { prisma } from '../lib/database';
import {
  BaseRepository,
  FindManyOptions,
  NotFoundError,
  RepositoryError,
} from './base.repository';

export interface CreateFieldInput {
  name: string;
  type: string;
  modelId: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  validation?: any;
  description?: string;
}

export interface UpdateFieldInput {
  name?: string;
  type?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: string;
  validation?: any;
  description?: string;
}

export class FieldRepository
  implements BaseRepository<Field, CreateFieldInput, UpdateFieldInput>
{
  async create(data: CreateFieldInput): Promise<Field> {
    try {
      return await prisma.field.create({
        data,
        include: {
          model: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to create field', error as Error);
    }
  }

  async findById(id: string): Promise<Field | null> {
    try {
      return await prisma.field.findUnique({
        where: { id },
        include: {
          model: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find field', error as Error);
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<Field[]> {
    try {
      return await prisma.field.findMany({
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'asc' },
        skip: options.skip,
        take: options.take,
        include: options.include || {
          model: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find fields', error as Error);
    }
  }

  async update(id: string, data: UpdateFieldInput): Promise<Field> {
    try {
      const field = await prisma.field.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          model: true,
        },
      });
      return field;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Field', id);
      }
      throw new RepositoryError('Failed to update field', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.field.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Field', id);
      }
      throw new RepositoryError('Failed to delete field', error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await prisma.field.count({ where });
    } catch (error) {
      throw new RepositoryError('Failed to count fields', error as Error);
    }
  }

  // Additional field-specific methods
  async findByModelId(modelId: string): Promise<Field[]> {
    try {
      return await prisma.field.findMany({
        where: { modelId },
        orderBy: { name: 'asc' },
        include: {
          model: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find fields by model',
        error as Error
      );
    }
  }

  async findByName(modelId: string, name: string): Promise<Field | null> {
    try {
      return await prisma.field.findFirst({
        where: {
          modelId,
          name,
        },
        include: {
          model: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find field by name', error as Error);
    }
  }

  async createMany(fields: CreateFieldInput[]): Promise<Field[]> {
    try {
      const createdFields: Field[] = [];
      for (const fieldData of fields) {
        const field = await this.create(fieldData);
        createdFields.push(field);
      }
      return createdFields;
    } catch (error) {
      throw new RepositoryError(
        'Failed to create multiple fields',
        error as Error
      );
    }
  }
}
