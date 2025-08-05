import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  ConflictError,
  DatabaseError,
  formatSuccessResponse,
  handleOptions,
  NotFoundApiError,
  validateParams,
  validateRequest,
  withErrorHandler,
} from '../../../../lib/api-middleware';
import {
  NotFoundError,
  RepositoryError,
} from '../../../../repositories/base.repository';
import { ModelRepository } from '../../../../repositories/model.repository';

const modelRepository = new ModelRepository();

// Request schemas
const UpdateModelRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tableName: z.string().optional(),
  timestamps: z.boolean().optional(),
  softDelete: z.boolean().optional(),
  description: z.string().optional(),
});

const ModelParamsSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/models/[id] - Get a specific model
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = validateParams(ModelParamsSchema)(params);

    try {
      const model = await modelRepository.findById(id);

      if (!model) {
        throw new NotFoundApiError('Model', id);
      }

      return formatSuccessResponse({ model });
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new DatabaseError(error.message, error);
      }
      throw error;
    }
  }
);

// PUT /api/models/[id] - Update a specific model
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = validateParams(ModelParamsSchema)(params);
    const updateData = await validateRequest(UpdateModelRequestSchema)(request);

    try {
      // If name is being updated, check for conflicts
      if (updateData.name) {
        const existingModel = await modelRepository.findById(id);
        if (!existingModel) {
          throw new NotFoundApiError('Model', id);
        }

        const conflictingModel = await modelRepository.findByName(
          existingModel.projectId,
          updateData.name
        );

        if (conflictingModel && conflictingModel.id !== id) {
          throw new ConflictError(
            `A model with name '${updateData.name}' already exists in this project`
          );
        }
      }

      const model = await modelRepository.update(id, updateData);

      return formatSuccessResponse({ model });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundApiError('Model', id);
      }
      if (error instanceof RepositoryError) {
        throw new DatabaseError(error.message, error);
      }
      throw error;
    }
  }
);

// DELETE /api/models/[id] - Delete a specific model
export const DELETE = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = validateParams(ModelParamsSchema)(params);

    try {
      await modelRepository.delete(id);

      return formatSuccessResponse(null, 200, 'Model deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundApiError('Model', id);
      }
      if (error instanceof RepositoryError) {
        throw new DatabaseError(error.message, error);
      }
      throw error;
    }
  }
);

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return handleOptions();
}
