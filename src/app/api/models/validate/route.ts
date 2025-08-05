import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  formatSuccessResponse,
  handleOptions,
  ValidationError,
  withErrorHandler,
} from '../../../../lib/api-middleware';
import { modelValidationService } from '../../../../services/modelValidationService';
import { ModelSchema } from '../../../../types/models';

// Request schemas
const ValidateModelRequestSchema = z.object({
  model: ModelSchema,
});

const ValidateModelsRequestSchema = z.object({
  models: z.array(ModelSchema),
});

// POST /api/models/validate - Validate model(s)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Check if validating single model or multiple models
  const isSingleModel = 'model' in body;
  const isMultipleModels = 'models' in body;

  if (!isSingleModel && !isMultipleModels) {
    throw new ValidationError(
      'Request must contain either "model" or "models" field'
    );
  }

  if (isSingleModel) {
    // Validate single model
    const validationResult = ValidateModelRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid model data',
        validationResult.error.errors
      );
    }

    const { model } = validationResult.data;
    const validation = modelValidationService.validateModel(model);

    return formatSuccessResponse({
      validation,
      type: 'single',
    });
  } else {
    // Validate multiple models
    const validationResult = ValidateModelsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid models data',
        validationResult.error.errors
      );
    }

    const { models } = validationResult.data;
    const validation = modelValidationService.validateModels(models);
    const relationshipValidation =
      modelValidationService.validateRelationships(models);

    return formatSuccessResponse({
      validation,
      relationshipValidation,
      type: 'multiple',
    });
  }
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return handleOptions();
}
