import { AuthConfig, Endpoint, Field, FieldType, Model } from '../types';
import { OpenAPISpec } from '../types/configuration';

export interface DocumentationService {
  generateOpenAPISpec(
    models: Model[],
    endpoints: Endpoint[],
    authConfig?: AuthConfig
  ): Promise<OpenAPISpec>;
  generateSwaggerUI(spec: OpenAPISpec): Promise<string>;
  updateDocumentation(projectId: string, changes: ModelChange[]): Promise<void>;
}

export interface ModelChange {
  type: 'added' | 'updated' | 'deleted';
  model: Model;
  previousModel?: Model;
}

export class OpenAPIDocumentationService implements DocumentationService {
  /**
   * Generate OpenAPI 3.0 specification from model definitions and endpoints
   */
  async generateOpenAPISpec(
    models: Model[],
    endpoints: Endpoint[],
    authConfig?: AuthConfig
  ): Promise<OpenAPISpec> {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Generated API',
        version: '1.0.0',
        description: 'Automatically generated API documentation',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
      },
    };

    // Generate schemas for all models
    for (const model of models) {
      this.generateModelSchemas(model, spec);
    }

    // Generate paths for all endpoints
    for (const endpoint of endpoints) {
      this.generateEndpointPath(endpoint, models, spec);
    }

    // Add authentication schemes if configured
    if (authConfig) {
      this.generateSecuritySchemes(authConfig, spec);
    }

    return spec;
  }

  /**
   * Generate Swagger UI HTML page
   */
  async generateSwaggerUI(spec: OpenAPISpec): Promise<string> {
    const specJson = JSON.stringify(spec, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${specJson},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  }

  /**
   * Update documentation when models change
   */
  async updateDocumentation(
    projectId: string,
    changes: ModelChange[]
  ): Promise<void> {
    // This would typically update a stored specification
    // For now, we'll just log the changes
    console.log(`Updating documentation for project ${projectId}:`, changes);

    // In a real implementation, this would:
    // 1. Load the existing OpenAPI spec for the project
    // 2. Apply the model changes to update schemas and paths
    // 3. Save the updated specification
    // 4. Potentially trigger regeneration of documentation files
  }

  /**
   * Generate OpenAPI schemas for a model
   */
  private generateModelSchemas(model: Model, spec: OpenAPISpec): void {
    const modelName = model.name;

    // Generate main model schema
    const modelSchema = {
      type: 'object',
      required: ['id', 'createdAt', 'updatedAt'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier',
        },
        ...this.generateFieldProperties(model.fields),
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Creation timestamp',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Last update timestamp',
        },
      },
    };

    // Add required fields from model definition
    const requiredFields = model.fields
      .filter((field) => field.required)
      .map((field) => field.name);

    if (requiredFields.length > 0) {
      modelSchema.required.push(...requiredFields);
    }

    spec.components.schemas[modelName] = modelSchema;

    // Generate create request schema (without id, timestamps)
    const createSchema = {
      type: 'object',
      required: requiredFields,
      properties: this.generateFieldProperties(model.fields),
    };

    spec.components.schemas[`Create${modelName}Request`] = createSchema;

    // Generate update request schema (all fields optional)
    const updateSchema = {
      type: 'object',
      properties: this.generateFieldProperties(model.fields, true),
    };

    spec.components.schemas[`Update${modelName}Request`] = updateSchema;

    // Generate list response schema
    spec.components.schemas[`${modelName}ListResponse`] = {
      type: 'object',
      required: ['success', 'data', 'pagination'],
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        data: {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${modelName}`,
          },
        },
        pagination: {
          $ref: '#/components/schemas/PaginationInfo',
        },
      },
    };

    // Generate single item response schema
    spec.components.schemas[`${modelName}Response`] = {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        data: {
          $ref: `#/components/schemas/${modelName}`,
        },
      },
    };

    // Add common schemas if not already present
    if (!spec.components.schemas['PaginationInfo']) {
      spec.components.schemas['PaginationInfo'] = {
        type: 'object',
        required: ['page', 'limit', 'total', 'pages'],
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Current page number',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Number of items per page',
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of items',
          },
          pages: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of pages',
          },
        },
      };
    }

    if (!spec.components.schemas['ErrorResponse']) {
      spec.components.schemas['ErrorResponse'] = {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field name that caused the error',
                },
                message: {
                  type: 'string',
                  description: 'Field-specific error message',
                },
              },
            },
            description: 'Detailed validation errors',
          },
        },
      };
    }
  }

  /**
   * Generate OpenAPI properties for model fields
   */
  private generateFieldProperties(
    fields: Field[],
    allOptional: boolean = false
  ): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const field of fields) {
      const property = this.mapFieldTypeToOpenAPI(field.type);

      if (field.description) {
        property.description = field.description;
      }

      if (field.defaultValue !== undefined) {
        property.default = field.defaultValue;
      }

      // Add validation constraints
      if (field.validation && field.validation.length > 0) {
        for (const rule of field.validation) {
          switch (rule.type) {
            case 'minLength':
              if (property.type === 'string') {
                property.minLength = Number(rule.value);
              }
              break;
            case 'maxLength':
              if (property.type === 'string') {
                property.maxLength = Number(rule.value);
              }
              break;
            case 'min':
              if (property.type === 'number' || property.type === 'integer') {
                property.minimum = Number(rule.value);
              }
              break;
            case 'max':
              if (property.type === 'number' || property.type === 'integer') {
                property.maximum = Number(rule.value);
              }
              break;
            case 'pattern':
              if (property.type === 'string') {
                property.pattern = String(rule.value);
              }
              break;
          }
        }
      }

      properties[field.name] = property;
    }

    return properties;
  }

  /**
   * Map field types to OpenAPI schema types
   */
  private mapFieldTypeToOpenAPI(fieldType: FieldType): any {
    switch (fieldType) {
      case 'string':
      case 'text':
        return { type: 'string' };
      case 'email':
        return { type: 'string', format: 'email' };
      case 'url':
        return { type: 'string', format: 'uri' };
      case 'uuid':
        return { type: 'string', format: 'uuid' };
      case 'date':
        return { type: 'string', format: 'date-time' };
      case 'number':
      case 'float':
      case 'decimal':
        return { type: 'number' };
      case 'integer':
        return { type: 'integer' };
      case 'boolean':
        return { type: 'boolean' };
      case 'json':
        return { type: 'object' };
      default:
        return { type: 'string' };
    }
  }

  /**
   * Generate OpenAPI path for an endpoint
   */
  private generateEndpointPath(
    endpoint: Endpoint,
    models: Model[],
    spec: OpenAPISpec
  ): void {
    const path = endpoint.path;
    const method = endpoint.method.toLowerCase();

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    const operation: any = {
      summary:
        endpoint.description || `${endpoint.operation} ${endpoint.modelName}`,
      operationId: `${endpoint.operation}${endpoint.modelName}`,
      tags: [endpoint.modelName],
    };

    // Add security if endpoint is authenticated
    if (endpoint.authenticated) {
      operation.security = [{ bearerAuth: [] }];
    }

    // Add parameters for path variables
    const pathParams = this.extractPathParameters(path);
    if (pathParams.length > 0) {
      operation.parameters = pathParams.map((param) => ({
        name: param,
        in: 'path',
        required: true,
        schema: {
          type: param === 'id' ? 'string' : 'string',
          format: param === 'id' ? 'uuid' : undefined,
        },
        description: `${param} parameter`,
      }));
    }

    // Add query parameters for list operations
    if (endpoint.operation === 'list') {
      if (!operation.parameters) {
        operation.parameters = [];
      }
      operation.parameters.push(
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Page number for pagination',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          description: 'Number of items per page',
        }
      );
    }

    // Add request body for create/update operations
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      const schemaName =
        endpoint.method === 'POST'
          ? `Create${endpoint.modelName}Request`
          : `Update${endpoint.modelName}Request`;

      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${schemaName}`,
            },
          },
        },
      };
    }

    // Add responses
    operation.responses = this.generateEndpointResponses(endpoint);

    spec.paths[path][method] = operation;
  }

  /**
   * Extract path parameters from a path string
   */
  private extractPathParameters(path: string): string[] {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map((match) => match.substring(1)) : [];
  }

  /**
   * Generate response definitions for an endpoint
   */
  private generateEndpointResponses(endpoint: Endpoint): Record<string, any> {
    const responses: Record<string, any> = {};

    switch (endpoint.operation) {
      case 'create':
        responses['201'] = {
          description: `${endpoint.modelName} created successfully`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${endpoint.modelName}Response`,
              },
            },
          },
        };
        break;

      case 'read':
        responses['200'] = {
          description: `${endpoint.modelName} retrieved successfully`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${endpoint.modelName}Response`,
              },
            },
          },
        };
        responses['404'] = {
          description: `${endpoint.modelName} not found`,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        };
        break;

      case 'update':
        responses['200'] = {
          description: `${endpoint.modelName} updated successfully`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${endpoint.modelName}Response`,
              },
            },
          },
        };
        responses['404'] = {
          description: `${endpoint.modelName} not found`,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        };
        break;

      case 'delete':
        responses['204'] = {
          description: `${endpoint.modelName} deleted successfully`,
        };
        responses['404'] = {
          description: `${endpoint.modelName} not found`,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        };
        break;

      case 'list':
        responses['200'] = {
          description: `${endpoint.modelName} list retrieved successfully`,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${endpoint.modelName}ListResponse`,
              },
            },
          },
        };
        break;
    }

    // Add common error responses
    responses['400'] = {
      description: 'Bad request - validation error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse',
          },
        },
      },
    };

    if (endpoint.authenticated) {
      responses['401'] = {
        description: 'Unauthorized - authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      };

      if (endpoint.roles && endpoint.roles.length > 0) {
        responses['403'] = {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        };
      }
    }

    responses['500'] = {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/ErrorResponse',
          },
        },
      },
    };

    return responses;
  }

  /**
   * Generate security schemes for authentication
   */
  private generateSecuritySchemes(
    authConfig: AuthConfig,
    spec: OpenAPISpec
  ): void {
    switch (authConfig.type) {
      case 'jwt':
        spec.components.securitySchemes['bearerAuth'] = {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication',
        };
        break;

      case 'oauth':
        if (authConfig.providers && authConfig.providers.length > 0) {
          for (const provider of authConfig.providers) {
            spec.components.securitySchemes[`oauth_${provider.name}`] = {
              type: 'oauth2',
              description: `OAuth2 authentication via ${provider.name}`,
              flows: {
                authorizationCode: {
                  authorizationUrl: `https://auth.${provider.name}.com/oauth/authorize`,
                  tokenUrl: `https://auth.${provider.name}.com/oauth/token`,
                  scopes: provider.scopes.reduce(
                    (acc, scope) => {
                      acc[scope] = `${scope} access`;
                      return acc;
                    },
                    {} as Record<string, string>
                  ),
                },
              },
            };
          }
        }
        break;

      case 'session':
        spec.components.securitySchemes['sessionAuth'] = {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
          description: 'Session-based authentication',
        };
        break;
    }
  }
}
