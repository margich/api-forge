import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  ConflictError,
  DatabaseError,
  formatSuccessResponse,
  handleOptions,
  validateQuery,
  validateRequest,
  withErrorHandler,
} from '../../../lib/api-middleware';
import { RepositoryError } from '../../../repositories/base.repository';
import { ModelRepository } from '../../../repositories/model.repository';

const modelRepository = new ModelRepository();

// Request schemas
const CreateModelRequestSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().uuid(),
  tableName: z.string().optional(),
  timestamps: z.boolean().default(true),
  softDelete: z.boolean().default(false),
  description: z.string().optional(),
});

const GetModelsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/models - List models with optional filtering
export const GET = withErrorHandler(async (request: NextRequest) => {
  const queryParams = validateQuery(GetModelsQuerySchema)(request);
  const { projectId, page, limit } = queryParams;
  const skip = (page - 1) * limit;

  let models;
  let total;

  try {
    if (projectId) {
      models = await modelRepository.findByProjectId(projectId);
      total = models.length;
      // Apply pagination manually for project-specific queries
      models = models.slice(skip, skip + limit);
    } else {
      const where = {};
      models = await modelRepository.findMany({
        where,
        skip,
        take: limit,
      });
      total = await modelRepository.count(where);
    }

    return formatSuccessResponse({
      models,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof RepositoryError) {
      throw new DatabaseError(error.message, error);
    }
    throw error;
  }
});

// POST /api/models - Create a new model
export const POST = withErrorHandler(async (request: NextRequest) => {
  const modelData = await validateRequest(CreateModelRequestSchema)(request);

  try {
    // Check if model with same name exists in project
    const existingModel = await modelRepository.findByName(
      modelData.projectId,
      modelData.name
    );

    if (existingModel) {
      throw new ConflictError(
        `A model with name '${modelData.name}' already exists in this project`
      );
    }

    const model = await modelRepository.create(modelData);

    return formatSuccessResponse({ model }, 201);
  } catch (error) {
    if (error instanceof RepositoryError) {
      throw new DatabaseError(error.message, error);
    }
    throw error;
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return handleOptions();
}
