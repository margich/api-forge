import { Project } from '../generated/prisma';
import { prisma } from '../lib/database';
import {
  BaseRepository,
  FindManyOptions,
  NotFoundError,
  RepositoryError,
} from './base.repository';

export interface CreateProjectInput {
  name: string;
  description?: string;
  framework: string;
  database: string;
  authType: string;
  language: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  framework?: string;
  database?: string;
  authType?: string;
  language?: string;
}

export class ProjectRepository
  implements BaseRepository<Project, CreateProjectInput, UpdateProjectInput>
{
  async create(data: CreateProjectInput): Promise<Project> {
    try {
      return await prisma.project.create({
        data,
        include: {
          models: true,
          generatedCode: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to create project', error as Error);
    }
  }

  async findById(id: string): Promise<Project | null> {
    try {
      return await prisma.project.findUnique({
        where: { id },
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
    } catch (error) {
      throw new RepositoryError('Failed to find project', error as Error);
    }
  }

  async findMany(options: FindManyOptions = {}): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        where: options.where,
        orderBy: options.orderBy || { createdAt: 'desc' },
        skip: options.skip,
        take: options.take,
        include: options.include || {
          models: true,
          generatedCode: true,
        },
      });
    } catch (error) {
      throw new RepositoryError('Failed to find projects', error as Error);
    }
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          models: true,
          generatedCode: true,
        },
      });
      return project;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Project', id);
      }
      throw new RepositoryError('Failed to update project', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.project.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Project', id);
      }
      throw new RepositoryError('Failed to delete project', error);
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await prisma.project.count({ where });
    } catch (error) {
      throw new RepositoryError('Failed to count projects', error as Error);
    }
  }

  // Additional project-specific methods
  async findByName(name: string): Promise<Project | null> {
    try {
      return await prisma.project.findFirst({
        where: { name },
        include: {
          models: true,
          generatedCode: true,
        },
      });
    } catch (error) {
      throw new RepositoryError(
        'Failed to find project by name',
        error as Error
      );
    }
  }
}
