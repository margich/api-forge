import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ModelChange,
  OpenAPIDocumentationService,
} from '../services/documentationService';
import { AuthConfig, Endpoint, Model } from '../types';

describe('OpenAPIDocumentationService', () => {
  let service: OpenAPIDocumentationService;
  let sampleModels: Model[];
  let sampleEndpoints: Endpoint[];
  let sampleAuthConfig: AuthConfig;

  beforeEach(() => {
    service = new OpenAPIDocumentationService();

    // Create sample models
    sampleModels = [
      {
        id: uuidv4(),
        name: 'User',
        fields: [
          {
            id: uuidv4(),
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
            validation: [
              {
                type: 'pattern',
                value: '^[^@]+@[^@]+\\.[^@]+$',
                message: 'Invalid email format',
              },
            ],
            description: 'User email address',
          },
          {
            id: uuidv4(),
            name: 'name',
            type: 'string',
            required: true,
            unique: false,
            validation: [
              {
                type: 'minLength',
                value: 2,
                message: 'Name must be at least 2 characters',
              },
              {
                type: 'maxLength',
                value: 100,
                message: 'Name must be less than 100 characters',
              },
            ],
            description: 'User full name',
          },
          {
            id: uuidv4(),
            name: 'age',
            type: 'integer',
            required: false,
            unique: false,
            validation: [
              { type: 'min', value: 0, message: 'Age must be positive' },
              { type: 'max', value: 150, message: 'Age must be realistic' },
            ],
            description: 'User age in years',
          },
        ],
        relationships: [],
        metadata: {
          tableName: 'users',
          timestamps: true,
          softDelete: false,
          description: 'User account information',
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Post',
        fields: [
          {
            id: uuidv4(),
            name: 'title',
            type: 'string',
            required: true,
            unique: false,
            validation: [
              {
                type: 'minLength',
                value: 5,
                message: 'Title must be at least 5 characters',
              },
              {
                type: 'maxLength',
                value: 200,
                message: 'Title must be less than 200 characters',
              },
            ],
            description: 'Post title',
          },
          {
            id: uuidv4(),
            name: 'content',
            type: 'text',
            required: true,
            unique: false,
            validation: [
              {
                type: 'minLength',
                value: 10,
                message: 'Content must be at least 10 characters',
              },
            ],
            description: 'Post content',
          },
          {
            id: uuidv4(),
            name: 'published',
            type: 'boolean',
            required: false,
            unique: false,
            defaultValue: false,
            validation: [],
            description: 'Whether the post is published',
          },
        ],
        relationships: [
          {
            id: uuidv4(),
            type: 'oneToMany',
            sourceModel: 'User',
            targetModel: 'Post',
            sourceField: 'id',
            targetField: 'userId',
            cascadeDelete: true,
          },
        ],
        metadata: {
          tableName: 'posts',
          timestamps: true,
          softDelete: false,
          description: 'Blog posts',
          requiresAuth: true,
          allowedRoles: ['admin', 'author'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Create sample endpoints
    sampleEndpoints = [
      {
        id: uuidv4(),
        path: '/users',
        method: 'POST',
        modelName: 'User',
        operation: 'create',
        authenticated: false,
        roles: [],
        description: 'Create a new user',
      },
      {
        id: uuidv4(),
        path: '/users/:id',
        method: 'GET',
        modelName: 'User',
        operation: 'read',
        authenticated: false,
        roles: [],
        description: 'Get a user by ID',
      },
      {
        id: uuidv4(),
        path: '/users',
        method: 'GET',
        modelName: 'User',
        operation: 'list',
        authenticated: false,
        roles: [],
        description: 'List all users',
      },
      {
        id: uuidv4(),
        path: '/users/:id',
        method: 'PUT',
        modelName: 'User',
        operation: 'update',
        authenticated: true,
        roles: ['admin', 'user'],
        description: 'Update a user by ID',
      },
      {
        id: uuidv4(),
        path: '/users/:id',
        method: 'DELETE',
        modelName: 'User',
        operation: 'delete',
        authenticated: true,
        roles: ['admin'],
        description: 'Delete a user by ID',
      },
    ];

    // Create sample auth config
    sampleAuthConfig = {
      type: 'jwt',
      jwtSecret: 'test-secret',
      roles: [
        { name: 'admin', permissions: ['create', 'read', 'update', 'delete'] },
        { name: 'user', permissions: ['read', 'update'] },
        { name: 'author', permissions: ['create', 'read', 'update'] },
      ],
      protectedRoutes: ['/users/:id'],
    };
  });

  describe('generateOpenAPISpec', () => {
    it('should generate a valid OpenAPI 3.0 specification', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.title).toBe('Generated API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.servers).toHaveLength(2);
      expect(spec.components).toBeDefined();
      expect(spec.paths).toBeDefined();
    });

    it('should generate schemas for all models', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      // Check that schemas are generated for each model
      expect(spec.components.schemas['User']).toBeDefined();
      expect(spec.components.schemas['Post']).toBeDefined();
      expect(spec.components.schemas['CreateUserRequest']).toBeDefined();
      expect(spec.components.schemas['UpdateUserRequest']).toBeDefined();
      expect(spec.components.schemas['UserListResponse']).toBeDefined();
      expect(spec.components.schemas['UserResponse']).toBeDefined();
    });

    it('should generate correct field properties with validation', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const userSchema = spec.components.schemas['User'] as any;
      expect(userSchema.properties.email).toEqual({
        type: 'string',
        format: 'email',
        description: 'User email address',
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
      });

      expect(userSchema.properties.name).toEqual({
        type: 'string',
        description: 'User full name',
        minLength: 2,
        maxLength: 100,
      });

      expect(userSchema.properties.age).toEqual({
        type: 'integer',
        description: 'User age in years',
        minimum: 0,
        maximum: 150,
      });
    });

    it('should generate paths for all endpoints', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users/:id']).toBeDefined();
      expect(spec.paths['/users'].post).toBeDefined();
      expect(spec.paths['/users'].get).toBeDefined();
      expect(spec.paths['/users/:id'].get).toBeDefined();
      expect(spec.paths['/users/:id'].put).toBeDefined();
      expect(spec.paths['/users/:id'].delete).toBeDefined();
    });

    it('should add authentication to protected endpoints', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const updateOperation = spec.paths['/users/:id'].put;
      const deleteOperation = spec.paths['/users/:id'].delete;

      expect(updateOperation.security).toEqual([{ bearerAuth: [] }]);
      expect(deleteOperation.security).toEqual([{ bearerAuth: [] }]);
    });

    it('should generate security schemes for JWT authentication', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      expect(spec.components.securitySchemes['bearerAuth']).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication',
      });
    });

    it('should generate correct responses for different operations', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const createOperation = spec.paths['/users'].post;
      const readOperation = spec.paths['/users/:id'].get;
      const deleteOperation = spec.paths['/users/:id'].delete;

      expect(createOperation.responses['201']).toBeDefined();
      expect(readOperation.responses['200']).toBeDefined();
      expect(readOperation.responses['404']).toBeDefined();
      expect(deleteOperation.responses['204']).toBeDefined();
    });

    it('should add pagination parameters to list endpoints', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );

      const listOperation = spec.paths['/users'].get;
      const pageParam = listOperation.parameters.find(
        (p: any) => p.name === 'page'
      );
      const limitParam = listOperation.parameters.find(
        (p: any) => p.name === 'limit'
      );

      expect(pageParam).toBeDefined();
      expect(pageParam.schema.type).toBe('integer');
      expect(pageParam.schema.minimum).toBe(1);
      expect(pageParam.schema.default).toBe(1);

      expect(limitParam).toBeDefined();
      expect(limitParam.schema.type).toBe('integer');
      expect(limitParam.schema.minimum).toBe(1);
      expect(limitParam.schema.maximum).toBe(100);
      expect(limitParam.schema.default).toBe(10);
    });

    it('should handle models without authentication requirements', async () => {
      const publicModel: Model = {
        ...sampleModels[0],
        metadata: {
          ...sampleModels[0].metadata,
          requiresAuth: false,
        },
      };

      const spec = await service.generateOpenAPISpec(
        [publicModel],
        sampleEndpoints,
        sampleAuthConfig
      );

      expect(spec.components.schemas['User']).toBeDefined();
    });
  });

  describe('generateSwaggerUI', () => {
    it('should generate valid HTML for Swagger UI', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );
      const html = await service.generateSwaggerUI(spec);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('swagger-ui-dist');
      expect(html).toContain('SwaggerUIBundle');
      expect(html).toContain(JSON.stringify(spec, null, 2));
    });

    it('should include proper CSS and JavaScript dependencies', async () => {
      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sampleAuthConfig
      );
      const html = await service.generateSwaggerUI(spec);

      expect(html).toContain('swagger-ui.css');
      expect(html).toContain('swagger-ui-bundle.js');
      expect(html).toContain('swagger-ui-standalone-preset.js');
    });
  });

  describe('updateDocumentation', () => {
    it('should log model changes for tracking', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const changes: ModelChange[] = [
        {
          type: 'added',
          model: sampleModels[0],
        },
        {
          type: 'updated',
          model: sampleModels[1],
          previousModel: { ...sampleModels[1], name: 'OldPost' },
        },
      ];

      await service.updateDocumentation('test-project-id', changes);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Updating documentation for project test-project-id:',
        changes
      );

      consoleSpy.mockRestore();
    });
  });

  describe('field type mapping', () => {
    it('should correctly map all field types to OpenAPI types', async () => {
      const testModel: Model = {
        id: uuidv4(),
        name: 'TestModel',
        fields: [
          {
            id: uuidv4(),
            name: 'stringField',
            type: 'string',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'textField',
            type: 'text',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'emailField',
            type: 'email',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'urlField',
            type: 'url',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'uuidField',
            type: 'uuid',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'dateField',
            type: 'date',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'numberField',
            type: 'number',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'integerField',
            type: 'integer',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'booleanField',
            type: 'boolean',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'jsonField',
            type: 'json',
            required: true,
            unique: false,
            validation: [],
          },
        ],
        relationships: [],
        metadata: { timestamps: true, softDelete: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const spec = await service.generateOpenAPISpec(
        [testModel],
        [],
        sampleAuthConfig
      );
      const schema = spec.components.schemas['TestModel'] as any;

      expect(schema.properties.stringField.type).toBe('string');
      expect(schema.properties.textField.type).toBe('string');
      expect(schema.properties.emailField.type).toBe('string');
      expect(schema.properties.emailField.format).toBe('email');
      expect(schema.properties.urlField.type).toBe('string');
      expect(schema.properties.urlField.format).toBe('uri');
      expect(schema.properties.uuidField.type).toBe('string');
      expect(schema.properties.uuidField.format).toBe('uuid');
      expect(schema.properties.dateField.type).toBe('string');
      expect(schema.properties.dateField.format).toBe('date-time');
      expect(schema.properties.numberField.type).toBe('number');
      expect(schema.properties.integerField.type).toBe('integer');
      expect(schema.properties.booleanField.type).toBe('boolean');
      expect(schema.properties.jsonField.type).toBe('object');
    });
  });

  describe('OAuth authentication', () => {
    it('should generate OAuth security schemes', async () => {
      const oauthConfig: AuthConfig = {
        type: 'oauth',
        providers: [
          {
            name: 'google',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            scopes: ['profile', 'email'],
          },
        ],
        roles: [],
        protectedRoutes: [],
      };

      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        oauthConfig
      );

      expect(spec.components.securitySchemes['oauth_google']).toBeDefined();
      expect(spec.components.securitySchemes['oauth_google'].type).toBe(
        'oauth2'
      );
      expect(
        spec.components.securitySchemes['oauth_google'].flows.authorizationCode
      ).toBeDefined();
    });
  });

  describe('session authentication', () => {
    it('should generate session security schemes', async () => {
      const sessionConfig: AuthConfig = {
        type: 'session',
        sessionConfig: {
          secret: 'test-session-secret',
          maxAge: 86400,
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        },
        roles: [],
        protectedRoutes: [],
      };

      const spec = await service.generateOpenAPISpec(
        sampleModels,
        sampleEndpoints,
        sessionConfig
      );

      expect(spec.components.securitySchemes['sessionAuth']).toBeDefined();
      expect(spec.components.securitySchemes['sessionAuth'].type).toBe(
        'apiKey'
      );
      expect(spec.components.securitySchemes['sessionAuth'].in).toBe('cookie');
      expect(spec.components.securitySchemes['sessionAuth'].name).toBe(
        'sessionId'
      );
    });
  });
});
