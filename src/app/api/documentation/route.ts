import { NextRequest, NextResponse } from 'next/server';
import { OpenAPIDocumentationService } from '../../../services/documentationService';
import { AuthConfig, Endpoint, Model } from '../../../types';

const documentationService = new OpenAPIDocumentationService();

/**
 * Generate OpenAPI specification from models and endpoints
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { models, endpoints, authConfig } = body;

    // Validate required fields
    if (!models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: 'Models array is required' },
        { status: 400 }
      );
    }

    if (!endpoints || !Array.isArray(endpoints)) {
      return NextResponse.json(
        { error: 'Endpoints array is required' },
        { status: 400 }
      );
    }

    // Generate OpenAPI specification
    const spec = await documentationService.generateOpenAPISpec(
      models as Model[],
      endpoints as Endpoint[],
      authConfig as AuthConfig
    );

    return NextResponse.json({
      success: true,
      data: spec,
    });
  } catch (error) {
    console.error('Error generating OpenAPI specification:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}
