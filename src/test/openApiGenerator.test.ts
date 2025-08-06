import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { ModelChange } from '../services/documentationService';
import { OpenAPIGenerator } from '../services/openApiGenerator';
import { AuthConfig, Endpoint, Model } from '../types';

describe('OpenAPIGenerator', () => {
  let generator: OpenAPIGenerator;
  let sampleModels: Model[];
  let sampleEndpoints: Endpoint[];
  let sampleAuthConfig: AuthConfig;

  beforeEach(() => {
    generator = new OpenAPIGenerator();

    sampleModels = [
      {
        id: uuidv4(),
        name: 'Product',
        fields: [
          {
            id: uuidv4(),
            name: 'name',
            type: 'string',
            required: true,
            unique: false,
            validation: [
              {
                type: 'minLength',
                value: 3,
                message: 'Name must be at least 3 characters',
              },
            ],
            description: 'Product name',
          },
          {
            id: uuidv4(),
            name: 'price',
            type: 'decimal',
            required: true,
            unique: false,
            validation: [
              { type: 'min', value: 0, message: 'Price must be positive' },
            ],
            description: 'Product price',
          },
          {
            id: uuidv4(),
            name: 'description',
            type: 'text',
            required: false,
            unique: false,
            validation: [],
            description: 'Product description',
          },
        ],
        relationships: [],
        metadata: {
          tableName: 'products',
          timestamps: true,
          softDelete: false,
          description: 'Product catalog',
          requiresAuth: false,
          allowedRoles: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleEndpoints = [
      {
        id: uuidv4(),
        path: '/products',
        method: 'POST',
        modelName: 'Product',
        operation: 'create',
        authenticated: false,
        roles: [],
        description: 'Create a new product',
      },
      {
        id: uuidv4(),
        path: '/products/:id',
        method: 'GET',
        modelName: 'Product',
        operation: 'read',
        authenticated: false,
        roles: [],
        description: 'Get a product by ID',
      },
    ];

    sampleAuthConfig = {
      type: 'jwt',
      jwtSecret: 'test-secret',
      roles: [
        { name: 'admin', permissions: ['create', 'read', 'update', 'delete'] },
      ],
      protectedRoutes: [],
    };
  });

  describe('generateDocumentationFiles', () => {
    it('should generate all required documentation files', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const filePaths = files.map((f) => f.path);
      expect(filePaths).toContain('docs/openapi.json');
      expect(filePaths).toContain('docs/openapi.yaml');
      expect(filePaths).toContain('docs/index.html');
      expect(filePaths).toContain('docs/API.md');
      expect(filePaths).toContain('docs/postman-collection.json');
    });

    it('should generate valid OpenAPI JSON file', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const jsonFile = files.find((f) => f.path === 'docs/openapi.json');
      expect(jsonFile).toBeDefined();
      expect(jsonFile!.type).toBe('documentation');
      expect(jsonFile!.language).toBe('json');

      const spec = JSON.parse(jsonFile!.content);
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Generated API');
      expect(spec.components.schemas.Product).toBeDefined();
    });

    it('should generate valid OpenAPI YAML file', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const yamlFile = files.find((f) => f.path === 'docs/openapi.yaml');
      expect(yamlFile).toBeDefined();
      expect(yamlFile!.type).toBe('documentation');
      expect(yamlFile!.language).toBe('yaml');
      expect(yamlFile!.content).toContain('openapi: 3.0.0');
      expect(yamlFile!.content).toContain('title: Generated API');
    });

    it('should generate Swagger UI HTML file', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const htmlFile = files.find((f) => f.path === 'docs/index.html');
      expect(htmlFile).toBeDefined();
      expect(htmlFile!.type).toBe('documentation');
      expect(htmlFile!.language).toBe('html');
      expect(htmlFile!.content).toContain('<!DOCTYPE html>');
      expect(htmlFile!.content).toContain('swagger-ui');
    });

    it('should generate markdown documentation', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const mdFile = files.find((f) => f.path === 'docs/API.md');
      expect(mdFile).toBeDefined();
      expect(mdFile!.type).toBe('documentation');
      expect(mdFile!.language).toBe('markdown');
      expect(mdFile!.content).toContain('# Generated API');
      expect(mdFile!.content).toContain('## Data Models');
      expect(mdFile!.content).toContain('### Product');
      expect(mdFile!.content).toContain('## API Endpoints');
    });

    it('should generate Postman collection', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const postmanFile = files.find(
        (f) => f.path === 'docs/postman-collection.json'
      );
      expect(postmanFile).toBeDefined();
      expect(postmanFile!.type).toBe('documentation');
      expect(postmanFile!.language).toBe('json');

      const collection = JSON.parse(postmanFile!.content);
      expect(collection.info.name).toBe('Generated API');
      expect(collection.variable).toBeDefined();
      expect(collection.item).toBeDefined();
    });
  });

  describe('updateDocumentationForChanges', () => {
    it('should regenerate documentation files when models change', async () => {
      const changes: ModelChange[] = [
        {
          type: 'updated',
          model: sampleModels[0],
          previousModel: { ...sampleModels[0], name: 'OldProduct' },
        },
      ];

      const files = await generator.updateDocumentationForChanges(
        'test-project',
        changes,
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      expect(files).toHaveLength(5); // All documentation files
      const jsonFile = files.find((f) => f.path === 'docs/openapi.json');
      expect(jsonFile).toBeDefined();
    });
  });

  describe('YAML conversion', () => {
    it('should convert simple objects to YAML', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const yamlFile = files.find((f) => f.path === 'docs/openapi.yaml');
      const yamlContent = yamlFile!.content;

      expect(yamlContent).toContain('openapi: 3.0.0');
      expect(yamlContent).toContain('info:');
      expect(yamlContent).toContain('  title: Generated API');
      expect(yamlContent).toContain('  version: 1.0.0');
    });

    it('should handle arrays in YAML conversion', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const yamlFile = files.find((f) => f.path === 'docs/openapi.yaml');
      const yamlContent = yamlFile!.content;

      expect(yamlContent).toContain('servers:');
      expect(yamlContent).toContain('- url:');
    });

    it('should escape special characters in YAML strings', async () => {
      const modelWithSpecialChars: Model = {
        ...sampleModels[0],
        fields: [
          {
            id: uuidv4(),
            name: 'specialField',
            type: 'string',
            required: true,
            unique: false,
            validation: [],
            description: 'Field with: special # characters',
          },
        ],
      };

      const files = await generator.generateDocumentationFiles(
        [modelWithSpecialChars],
        sampleEndpoints,
        sampleAuthConfig
      );

      const yamlFile = files.find((f) => f.path === 'docs/openapi.yaml');
      const yamlContent = yamlFile!.content;

      expect(yamlContent).toContain('"Field with: special # characters"');
    });
  });

  describe('Markdown documentation generation', () => {
    it('should include model descriptions in markdown', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const mdFile = files.find((f) => f.path === 'docs/API.md');
      const content = mdFile!.content;

      expect(content).toContain('Product catalog');
      expect(content).toContain('Product name');
      expect(content).toContain('Product price');
    });

    it('should include authentication information', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const mdFile = files.find((f) => f.path === 'docs/API.md');
      const content = mdFile!.content;

      expect(content).toContain('## Authentication');
      expect(content).toContain('bearerAuth');
    });

    it('should group endpoints by model', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const mdFile = files.find((f) => f.path === 'docs/API.md');
      const content = mdFile!.content;

      expect(content).toContain('### Product');
      expect(content).toContain('POST /products');
      expect(content).toContain('GET /products/:id');
    });

    it('should indicate authentication requirements', async () => {
      const authenticatedEndpoint: Endpoint = {
        ...sampleEndpoints[0],
        authenticated: true,
        roles: ['admin'],
      };

      const files = await generator.generateDocumentationFiles(
        sampleModels,
        [authenticatedEndpoint],
        sampleAuthConfig
      );

      const mdFile = files.find((f) => f.path === 'docs/API.md');
      const content = mdFile!.content;

      expect(content).toContain('🔒 **Authentication required**');
    });
  });

  describe('Postman collection generation', () => {
    it('should create folders for each model', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const postmanFile = files.find(
        (f) => f.path === 'docs/postman-collection.json'
      );
      const collection = JSON.parse(postmanFile!.content);

      expect(collection.item).toHaveLength(1);
      expect(collection.item[0].name).toBe('Product');
      expect(collection.item[0].item).toHaveLength(2);
    });

    it('should include base URL variable', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const postmanFile = files.find(
        (f) => f.path === 'docs/postman-collection.json'
      );
      const collection = JSON.parse(postmanFile!.content);

      const baseUrlVar = collection.variable.find(
        (v: any) => v.key === 'baseUrl'
      );
      expect(baseUrlVar).toBeDefined();
      expect(baseUrlVar.value).toBe('http://localhost:3000');
    });

    it('should add authentication to protected requests', async () => {
      const authenticatedEndpoint: Endpoint = {
        ...sampleEndpoints[0],
        authenticated: true,
      };

      const files = await generator.generateDocumentationFiles(
        sampleModels,
        [authenticatedEndpoint],
        sampleAuthConfig
      );

      const postmanFile = files.find(
        (f) => f.path === 'docs/postman-collection.json'
      );
      const collection = JSON.parse(postmanFile!.content);

      const request = collection.item[0].item[0].request;
      expect(request.auth).toBeDefined();
      expect(request.auth.type).toBe('bearer');
    });

    it('should include request body for POST/PUT requests', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const postmanFile = files.find(
        (f) => f.path === 'docs/postman-collection.json'
      );
      const collection = JSON.parse(postmanFile!.content);

      const postRequest = collection.item[0].item.find(
        (item: any) => item.request.method === 'POST'
      );
      expect(postRequest.request.body).toBeDefined();
      expect(postRequest.request.body.mode).toBe('raw');
    });
  });

  describe('error handling', () => {
    it('should handle empty models array', async () => {
      const files = await generator.generateDocumentationFiles(
        [],
        [],
        sampleAuthConfig
      );

      expect(files).toHaveLength(5);
      const jsonFile = files.find((f) => f.path === 'docs/openapi.json');
      const spec = JSON.parse(jsonFile!.content);
      expect(Object.keys(spec.components.schemas)).toHaveLength(0); // No schemas when no models
    });

    it('should handle missing auth config', async () => {
      const files = await generator.generateDocumentationFiles(
        sampleModels,
        sampleEndpoints
      );

      expect(files).toHaveLength(5);
      const jsonFile = files.find((f) => f.path === 'docs/openapi.json');
      const spec = JSON.parse(jsonFile!.content);
      expect(Object.keys(spec.components.securitySchemes)).toHaveLength(0);
    });
  });
});
