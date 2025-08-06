import { NextRequest, NextResponse } from 'next/server';
import { CodeGenerationService } from '../../../../services/codeGenerationService';
import {
  ExportOptions,
  ProjectExportService,
} from '../../../../services/projectExportService';
import {
  GenerationOptions,
  GenerationOptionsSchema,
  Model,
  ModelSchema,
} from '../../../../types';

const projectExportService = new ProjectExportService();
const codeGenerationService = new CodeGenerationService();

export async function POST(request: NextRequest) {
  try {
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

    // Validate input data
    try {
      // Validate models
      if (!Array.isArray(models) || models.length === 0) {
        return NextResponse.json(
          { error: 'At least one model is required for project export' },
          { status: 400 }
        );
      }

      // Validate each model and convert date strings to Date objects
      for (let i = 0; i < models.length; i++) {
        const model = models[i];

        // Convert date strings to Date objects if they exist
        if (typeof model.createdAt === 'string') {
          model.createdAt = new Date(model.createdAt);
        }
        if (typeof model.updatedAt === 'string') {
          model.updatedAt = new Date(model.updatedAt);
        }

        const result = ModelSchema.safeParse(model);
        if (!result.success) {
          return NextResponse.json(
            {
              error: 'Invalid model data',
              details: result.error.issues,
            },
            { status: 400 }
          );
        }

        // Update the model in the array with the validated version
        models[i] = result.data;
      }

      // Validate generation options
      const genOptionsResult =
        GenerationOptionsSchema.safeParse(generationOptions);
      if (!genOptionsResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid generation options',
            details: genOptionsResult.error.issues,
          },
          { status: 400 }
        );
      }
    } catch (validationError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details:
            validationError instanceof Error
              ? validationError.message
              : 'Validation failed',
        },
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
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

// GET endpoint to retrieve export options and supported formats
export async function GET() {
  try {
    return NextResponse.json({
      supportedFormats: ['zip', 'tar'],
      supportedTemplates: ['basic', 'advanced', 'enterprise'],
      defaultOptions: {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'basic',
      },
      templateDescriptions: {
        basic: 'Essential files with Docker support and basic configuration',
        advanced:
          'Includes CI/CD workflows, linting, and formatting configuration',
        enterprise:
          'Full enterprise setup with Kubernetes, Helm charts, and monitoring',
      },
    });
  } catch (error) {
    console.error('Failed to get export options:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve export options' },
      { status: 500 }
    );
  }
}
