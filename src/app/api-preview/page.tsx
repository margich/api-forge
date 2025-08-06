'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { APIPreview } from '../../components';
import { ProjectService } from '../../services/projectService';
import { SessionService } from '../../services/sessionService';
import { OpenAPISpec, Project } from '../../types';

export default function APIPreviewPage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [apiSpec, setApiSpec] = useState<OpenAPISpec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCurrentProject();
  }, []);

  const loadCurrentProject = async () => {
    try {
      const sessionService = SessionService.getInstance();
      const projectService = ProjectService.getInstance();
      const currentProjectId = sessionService.getCurrentProjectId();

      if (!currentProjectId) {
        router.push('/');
        return;
      }

      const currentProject = await projectService.getProject(currentProjectId);
      if (!currentProject) {
        router.push('/');
        return;
      }

      if (currentProject.models.length === 0) {
        router.push('/model-editor');
        return;
      }

      setProject(currentProject);
      await generateAPISpec(currentProject);
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAPISpec = async (projectData: Project) => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call the documentation service
      // For now, we'll create a mock API spec
      const mockSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: projectData.name,
          version: '1.0.0',
          description: projectData.description || 'Generated API',
        },
        servers: [
          {
            url: 'http://localhost:3000/api',
            description: 'Development server',
          },
        ],
        paths: {},
        components: {
          schemas: {},
          securitySchemes: {},
        },
      };

      // Generate paths and schemas for each model
      projectData.models.forEach((model) => {
        const modelName = model.name.toLowerCase();
        const ModelName = model.name;

        // Add schema
        mockSpec.components.schemas[ModelName] = {
          type: 'object',
          properties: model.fields.reduce((props: any, field) => {
            props[field.name] = {
              type:
                field.type === 'string'
                  ? 'string'
                  : field.type === 'number' ||
                      field.type === 'integer' ||
                      field.type === 'float'
                    ? 'number'
                    : field.type === 'boolean'
                      ? 'boolean'
                      : field.type === 'date'
                        ? 'string'
                        : 'string',
              ...(field.type === 'date' && { format: 'date-time' }),
              ...(field.description && { description: field.description }),
            };
            return props;
          }, {}),
          required: model.fields.filter((f) => f.required).map((f) => f.name),
        };

        // Add CRUD paths
        mockSpec.paths[`/${modelName}`] = {
          get: {
            summary: `List ${ModelName}s`,
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: `#/components/schemas/${ModelName}` },
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: `Create ${ModelName}`,
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${ModelName}` },
                },
              },
            },
            responses: {
              '201': {
                description: 'Created successfully',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${ModelName}` },
                  },
                },
              },
            },
          },
        };

        mockSpec.paths[`/${modelName}/{id}`] = {
          get: {
            summary: `Get ${ModelName} by ID`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${ModelName}` },
                  },
                },
              },
            },
          },
          put: {
            summary: `Update ${ModelName}`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${ModelName}` },
                },
              },
            },
            responses: {
              '200': {
                description: 'Updated successfully',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${ModelName}` },
                  },
                },
              },
            },
          },
          delete: {
            summary: `Delete ${ModelName}`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '204': {
                description: 'Deleted successfully',
              },
            },
          },
        };
      });

      setApiSpec(mockSpec);
    } catch (error) {
      console.error('Failed to generate API spec:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToEditor = () => {
    router.push('/model-editor');
  };

  const handleContinueToExport = () => {
    router.push('/export-deploy');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading API preview...
          </p>
        </div>
      </div>
    );
  }

  if (!project || !apiSpec) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Unable to Generate Preview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please ensure you have models defined in your project.
        </p>
        <button
          onClick={() => router.push('/model-editor')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Go to Model Editor
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            API Preview
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Project: {project.name}</span>
            <span>•</span>
            <span>{project.models.length} models</span>
            <span>•</span>
            <span>{Object.keys(apiSpec.paths).length} endpoints</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBackToEditor}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Editor
          </button>
          <button
            onClick={handleContinueToExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue to Export →
          </button>
        </div>
      </div>

      {/* API Preview Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {isGenerating ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Generating API specification...
              </p>
            </div>
          </div>
        ) : (
          <APIPreview apiSpec={apiSpec} models={project.models} />
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-green-50 dark:bg-green-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
          🎉 Your API is Ready!
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
          <div>
            <h4 className="font-medium mb-1">Generated Features</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Complete CRUD operations for all models</li>
              <li>OpenAPI 3.0 specification</li>
              <li>Request/response validation</li>
              <li>Interactive documentation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Next Steps</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Review the API endpoints and schemas</li>
              <li>Test endpoints with sample data</li>
              <li>Export or deploy your project</li>
              <li>Integrate with your frontend application</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
