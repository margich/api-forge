import { NextRequest, NextResponse } from 'next/server';
import { CodeGenerationService } from '../../../../../services/codeGenerationService';
import {
  ExportOptions,
  ProjectExportService,
} from '../../../../../services/projectExportService';
import { GenerationOptions, Model } from '../../../../../types';

const projectExportService = new ProjectExportService();
const codeGenerationService = new CodeGenerationService();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      models = [],
      generationOptions,
      exportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'basic',
      },
    }: {
      models: Model[];
      generationOptions: GenerationOptions;
      exportOptions?: ExportOptions;
    } = body;

    // Validate required fields
    if (!models || models.length === 0) {
      return NextResponse.json(
        { error: 'Models are required for project export' },
        { status: 400 }
      );
    }

    if (!generationOptions) {
      return NextResponse.json(
        { error: 'Generation options are required for project export' },
        { status: 400 }
      );
    }

    // Generate the complete project
    const generatedProject = await codeGenerationService.generateProject(
      models,
      generationOptions
    );

    // Create project package
    const projectPackage = await projectExportService.createProjectPackage(
      generatedProject,
      exportOptions
    );

    // Create archive based on format
    let archiveBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (exportOptions.format === 'tar') {
      archiveBuffer =
        await projectExportService.createTarArchive(projectPackage);
      contentType = 'application/gzip';
      filename = `${generatedProject.name}.tar.gz`;
    } else {
      archiveBuffer =
        await projectExportService.createZipArchive(projectPackage);
      contentType = 'application/zip';
      filename = `${generatedProject.name}.zip`;
    }

    // Return the archive as a download
    return new NextResponse(archiveBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': archiveBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Project export error:', error);

    return NextResponse.json(
      {
        error: 'Failed to export project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const format = (searchParams.get('format') as 'zip' | 'tar') || 'zip';
    const includeTests = searchParams.get('includeTests') !== 'false';
    const includeDocumentation =
      searchParams.get('includeDocumentation') !== 'false';
    const template =
      (searchParams.get('template') as 'basic' | 'advanced' | 'enterprise') ||
      'basic';

    // For GET requests, we need to retrieve the project from storage
    // This is a placeholder - in a real implementation, you'd fetch from a database
    return NextResponse.json(
      {
        error: 'GET method not implemented. Use POST with project data.',
        message:
          'To export a project, send a POST request with models and generation options.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Project export error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process export request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
