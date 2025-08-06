import { AuthConfig, Endpoint, Model } from '../types';
import { GeneratedFile, OpenAPISpec } from '../types/configuration';
import {
  ModelChange,
  OpenAPIDocumentationService,
} from './documentationService';

/**
 * Service for generating OpenAPI documentation files and integrating with project generation
 */
export class OpenAPIGenerator {
  private documentationService: OpenAPIDocumentationService;

  constructor() {
    this.documentationService = new OpenAPIDocumentationService();
  }

  /**
   * Generate OpenAPI specification and documentation files for a project
   */
  async generateDocumentationFiles(
    models: Model[],
    endpoints: Endpoint[],
    authConfig?: AuthConfig
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate OpenAPI specification
    const spec = await this.documentationService.generateOpenAPISpec(
      models,
      endpoints,
      authConfig
    );

    // Generate openapi.json file
    files.push({
      path: 'docs/openapi.json',
      content: JSON.stringify(spec, null, 2),
      type: 'documentation',
      language: 'json',
    });

    // Generate openapi.yaml file
    files.push({
      path: 'docs/openapi.yaml',
      content: this.convertJsonToYaml(spec),
      type: 'documentation',
      language: 'yaml',
    });

    // Generate Swagger UI HTML
    const swaggerUI = await this.documentationService.generateSwaggerUI(spec);
    files.push({
      path: 'docs/index.html',
      content: swaggerUI,
      type: 'documentation',
      language: 'html',
    });

    // Generate API documentation markdown
    const markdownDocs = this.generateMarkdownDocumentation(spec, models);
    files.push({
      path: 'docs/API.md',
      content: markdownDocs,
      type: 'documentation',
      language: 'markdown',
    });

    // Generate Postman collection
    const postmanCollection = this.generatePostmanCollection(spec);
    files.push({
      path: 'docs/postman-collection.json',
      content: JSON.stringify(postmanCollection, null, 2),
      type: 'documentation',
      language: 'json',
    });

    return files;
  }

  /**
   * Update documentation when models change
   */
  async updateDocumentationForChanges(
    projectId: string,
    changes: ModelChange[],
    currentModels: Model[],
    currentEndpoints: Endpoint[],
    authConfig?: AuthConfig
  ): Promise<GeneratedFile[]> {
    // Log the changes for tracking
    await this.documentationService.updateDocumentation(projectId, changes);

    // Regenerate all documentation files with updated models
    return this.generateDocumentationFiles(
      currentModels,
      currentEndpoints,
      authConfig
    );
  }

  /**
   * Convert JSON to YAML format (simplified implementation)
   */
  private convertJsonToYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          yaml += `${spaces}- ${this.convertJsonToYaml(item, indent + 1).trim()}\n`;
        } else {
          yaml += `${spaces}- ${this.formatYamlValue(item)}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          yaml += this.convertJsonToYaml(value, indent + 1);
        } else if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n`;
          yaml += this.convertJsonToYaml(value, indent + 1);
        } else {
          yaml += `${spaces}${key}: ${this.formatYamlValue(value)}\n`;
        }
      }
    } else {
      return this.formatYamlValue(obj);
    }

    return yaml;
  }

  /**
   * Format a value for YAML output
   */
  private formatYamlValue(value: any): string {
    if (typeof value === 'string') {
      // Escape strings that need quotes
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }

  /**
   * Generate markdown documentation from OpenAPI spec
   */
  private generateMarkdownDocumentation(
    spec: OpenAPISpec,
    models: Model[]
  ): string {
    let markdown = `# ${spec.info.title}\n\n`;

    if (spec.info.description) {
      markdown += `${spec.info.description}\n\n`;
    }

    markdown += `**Version:** ${spec.info.version}\n\n`;

    // Add servers
    if (spec.servers && spec.servers.length > 0) {
      markdown += `## Servers\n\n`;
      for (const server of spec.servers) {
        markdown += `- **${server.description || 'Server'}:** \`${server.url}\`\n`;
      }
      markdown += '\n';
    }

    // Add authentication
    if (
      spec.components.securitySchemes &&
      Object.keys(spec.components.securitySchemes).length > 0
    ) {
      markdown += `## Authentication\n\n`;
      for (const [name, scheme] of Object.entries(
        spec.components.securitySchemes
      )) {
        markdown += `### ${name}\n\n`;
        markdown += `- **Type:** ${(scheme as any).type}\n`;
        if ((scheme as any).description) {
          markdown += `- **Description:** ${(scheme as any).description}\n`;
        }
        markdown += '\n';
      }
    }

    // Add models
    markdown += `## Data Models\n\n`;
    for (const model of models) {
      markdown += `### ${model.name}\n\n`;
      if (model.metadata.description) {
        markdown += `${model.metadata.description}\n\n`;
      }

      markdown += `| Field | Type | Required | Description |\n`;
      markdown += `|-------|------|----------|-------------|\n`;
      markdown += `| id | string (uuid) | Yes | Unique identifier |\n`;

      for (const field of model.fields) {
        const required = field.required ? 'Yes' : 'No';
        const description = field.description || '';
        markdown += `| ${field.name} | ${field.type} | ${required} | ${description} |\n`;
      }

      markdown += `| createdAt | string (date-time) | Yes | Creation timestamp |\n`;
      markdown += `| updatedAt | string (date-time) | Yes | Last update timestamp |\n\n`;
    }

    // Add endpoints
    markdown += `## API Endpoints\n\n`;
    const groupedPaths = this.groupPathsByTag(spec.paths);

    for (const [tag, paths] of Object.entries(groupedPaths)) {
      markdown += `### ${tag}\n\n`;

      for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          markdown += `#### ${method.toUpperCase()} ${path}\n\n`;
          markdown += `${(operation as any).summary}\n\n`;

          if ((operation as any).security) {
            markdown += `🔒 **Authentication required**\n\n`;
          }

          // Add parameters
          if (
            (operation as any).parameters &&
            (operation as any).parameters.length > 0
          ) {
            markdown += `**Parameters:**\n\n`;
            for (const param of (operation as any).parameters) {
              const required = param.required ? ' (required)' : ' (optional)';
              markdown += `- **${param.name}**${required}: ${param.description || ''}\n`;
            }
            markdown += '\n';
          }

          // Add request body
          if ((operation as any).requestBody) {
            markdown += `**Request Body:**\n\n`;
            markdown += `Content-Type: application/json\n\n`;
          }

          // Add responses
          markdown += `**Responses:**\n\n`;
          for (const [code, response] of Object.entries(
            (operation as any).responses
          )) {
            markdown += `- **${code}**: ${(response as any).description}\n`;
          }
          markdown += '\n';
        }
      }
    }

    return markdown;
  }

  /**
   * Group API paths by their tags
   */
  private groupPathsByTag(
    paths: Record<string, any>
  ): Record<string, Record<string, any>> {
    const grouped: Record<string, Record<string, any>> = {};

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        const tags = (operation as any).tags || ['Default'];
        const tag = tags[0];

        if (!grouped[tag]) {
          grouped[tag] = {};
        }
        if (!grouped[tag][path]) {
          grouped[tag][path] = {};
        }
        grouped[tag][path][method] = operation;
      }
    }

    return grouped;
  }

  /**
   * Generate Postman collection from OpenAPI spec
   */
  private generatePostmanCollection(spec: OpenAPISpec): any {
    const collection = {
      info: {
        name: spec.info.title,
        description: spec.info.description,
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'baseUrl',
          value: spec.servers?.[0]?.url || 'http://localhost:3000',
          type: 'string',
        },
      ],
      auth: this.generatePostmanAuth(spec.components.securitySchemes),
      item: [] as any[],
    };

    // Group requests by tags
    const groupedPaths = this.groupPathsByTag(spec.paths);

    for (const [tag, paths] of Object.entries(groupedPaths)) {
      const folder = {
        name: tag,
        item: [] as any[],
      };

      for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          const request = this.generatePostmanRequest(
            path,
            method,
            operation as any
          );
          folder.item.push({
            name:
              (operation as any).summary || `${method.toUpperCase()} ${path}`,
            request,
          });
        }
      }

      collection.item.push(folder);
    }

    return collection;
  }

  /**
   * Generate Postman authentication configuration
   */
  private generatePostmanAuth(securitySchemes: Record<string, any>): any {
    if (securitySchemes.bearerAuth) {
      return {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string',
          },
        ],
      };
    }

    return null;
  }

  /**
   * Generate Postman request object
   */
  private generatePostmanRequest(
    path: string,
    method: string,
    operation: any
  ): any {
    const request: any = {
      method: method.toUpperCase(),
      header: [
        {
          key: 'Content-Type',
          value: 'application/json',
          type: 'text',
        },
      ],
      url: {
        raw: `{{baseUrl}}${path}`,
        host: ['{{baseUrl}}'],
        path: path.split('/').filter((p) => p),
      },
    };

    // Add authentication if required
    if (operation.security) {
      request.auth = {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{authToken}}',
            type: 'string',
          },
        ],
      };
    }

    // Add query parameters
    if (operation.parameters) {
      const queryParams = operation.parameters.filter(
        (p: any) => p.in === 'query'
      );
      if (queryParams.length > 0) {
        request.url.query = queryParams.map((param: any) => ({
          key: param.name,
          value: param.schema?.default || '',
          description: param.description,
          disabled: !param.required,
        }));
      }
    }

    // Add request body for POST/PUT requests
    if (operation.requestBody && (method === 'post' || method === 'put')) {
      request.body = {
        mode: 'raw',
        raw: JSON.stringify(
          this.generateSampleRequestBody(operation.requestBody),
          null,
          2
        ),
        options: {
          raw: {
            language: 'json',
          },
        },
      };
    }

    return request;
  }

  /**
   * Generate sample request body from OpenAPI schema
   */
  private generateSampleRequestBody(requestBody: any): any {
    // This is a simplified implementation
    // In a real scenario, you'd parse the schema and generate appropriate sample data
    return {
      // Sample data would be generated based on the schema
      example: 'Generated sample data based on schema',
    };
  }
}
