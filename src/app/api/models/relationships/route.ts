import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  formatSuccessResponse,
  handleOptions,
  validateRequest,
  withErrorHandler,
} from '../../../../lib/api-middleware';
import { modelValidationService } from '../../../../services/modelValidationService';
import { ModelSchema } from '../../../../types/models';

// Request schemas
const CheckRelationshipsRequestSchema = z.object({
  models: z.array(ModelSchema),
});

// POST /api/models/relationships - Check relationships between models
export const POST = withErrorHandler(async (request: NextRequest) => {
  const { models } = await validateRequest(CheckRelationshipsRequestSchema)(
    request
  );

  // Validate relationships
  const relationshipValidation =
    modelValidationService.validateRelationships(models);

  // Generate relationship analysis
  const relationshipAnalysis = analyzeRelationships(models);

  return formatSuccessResponse({
    validation: relationshipValidation,
    analysis: relationshipAnalysis,
  });
});

// Helper function to analyze relationships
function analyzeRelationships(models: any[]) {
  const analysis = {
    totalRelationships: 0,
    relationshipTypes: {
      oneToOne: 0,
      oneToMany: 0,
      manyToMany: 0,
    },
    modelConnections: new Map<string, string[]>(),
    orphanedModels: [] as string[],
    highlyConnectedModels: [] as { name: string; connectionCount: number }[],
  };

  // Count relationships and analyze connections
  models.forEach((model) => {
    const connections: string[] = [];

    model.relationships.forEach((relationship: any) => {
      analysis.totalRelationships++;
      analysis.relationshipTypes[
        relationship.type as keyof typeof analysis.relationshipTypes
      ]++;

      if (!connections.includes(relationship.targetModel)) {
        connections.push(relationship.targetModel);
      }
    });

    analysis.modelConnections.set(model.name, connections);

    // Check for highly connected models (more than 5 connections)
    if (connections.length > 5) {
      analysis.highlyConnectedModels.push({
        name: model.name,
        connectionCount: connections.length,
      });
    }

    // Check for orphaned models (no relationships)
    if (connections.length === 0) {
      // Also check if this model is referenced by others
      const isReferenced = models.some((otherModel) =>
        otherModel.relationships.some(
          (rel: any) => rel.targetModel === model.name
        )
      );

      if (!isReferenced) {
        analysis.orphanedModels.push(model.name);
      }
    }
  });

  return analysis;
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return handleOptions();
}
