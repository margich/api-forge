import { NextRequest, NextResponse } from 'next/server';
import { ModelChange } from '../../../../services/documentationService';
import { OpenAPIGenerator } from '../../../../services/openApiGenerator';
import { AuthConfig, Endpoint, Model } from '../../../../types';

const openApiGenerator = new OpenAPIGenerator();

/**
 * Update documentation when models change
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, changes, currentModels, currentEndpoints, authConfig } =
      body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Changes array is required' },
        { status: 400 }
      );
    }

    if (!currentModels || !Array.isArray(currentModels)) {
      return NextResponse.json(
        { error: 'Current models array is required' },
        { status: 400 }
      );
    }

    if (!currentEndpoints || !Array.isArray(currentEndpoints)) {
      return NextResponse.json(
        { error: 'Current endpoints array is required' },
        { status: 400 }
      );
    }

    // Update documentation
    const updatedFiles = await openApiGenerator.updateDocumentationForChanges(
      projectId,
      changes as ModelChange[],
      currentModels as Model[],
      currentEndpoints as Endpoint[],
      authConfig as AuthConfig
    );

    return NextResponse.json({
      success: true,
      data: {
        updatedFiles,
        message: `Documentation updated for ${changes.length} model changes`,
      },
    });
  } catch (error) {
    console.error('Error updating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to update documentation' },
      { status: 500 }
    );
  }
}
