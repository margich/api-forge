import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { POST as documentationPost } from '../app/api/documentation/route';
import {
  GET as swaggerGet,
  POST as swaggerPost,
} from '../app/api/documentation/swagger/route';
import { POST as updatePost } from '../app/api/documentation/update/route';
import { ModelChange } from '../services/documentationService';
import { AuthConfig, Endpoint, Model } from '../types';

describe('Documentation API Routes', () => {
  let sampleModels: Model[];
  let sampleEndpoints: Endpoint[];
  let sampleAuthConfig: AuthConfig;

  beforeEach(() => {
    sampleModels = [
      {
        id: uuidv4(),
        name: 'Category',
        fields: [
          {
            id: uuidv4(),
            name: 'name',
            type: 'string',
            required: true,
            unique: true,
            validation: [
              {
                type: 'minLength',
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            ],
            description: 'Category name',
          },
          {
            id: uuidv4(),
            name: 'description',
            type: 'text',
            required: false,
            unique: false,
            validation: [],
            description: 'Category description',
          },
        ],
        relationships: [],
        metadata: {
          tableName: 'categories',
          timestamps: true,
          softDelete: false,
          description: 'Product categories',
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
        path: '/categories',
        method: 'POST',
        modelName: 'Category',
        operation: 'create',
        authenticated: false,
        roles: [],
        description: 'Create a new category',
      },
      {
        id: uuidv4(),
        path: '/categories/:id',
        method: 'GET',
        modelName: 'Category',
        operation: 'read',
        authenticated: false,
        roles: [],
        description: 'Get a category by ID',
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

  describe('/api/documentation', () => {
    it('should generate OpenAPI specification successfully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: JSON.stringify({
            models: sampleModels,
            endpoints: sampleEndpoints,
            authConfig: sampleAuthConfig,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.openapi).toBe('3.0.0');
      expect(data.data.info.title).toBe('Generated API');
      expect(data.data.components.schemas.Category).toBeDefined();
    });

    it('should return 400 when models are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: JSON.stringify({
            endpoints: sampleEndpoints,
            authConfig: sampleAuthConfig,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Models array is required');
    });

    it('should return 400 when endpoints are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: JSON.stringify({
            models: sampleModels,
            authConfig: sampleAuthConfig,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Endpoints array is required');
    });

    it('should handle invalid JSON gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate OpenAPI specification');
    });

    it('should work without auth config', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: JSON.stringify({
            models: sampleModels,
            endpoints: sampleEndpoints,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.openapi).toBe('3.0.0');
    });
  });

  describe('/api/documentation/swagger', () => {
    it('should generate Swagger UI HTML from spec', async () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        servers: [],
        paths: {},
        components: { schemas: {}, securitySchemes: {} },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/documentation/swagger',
        {
          method: 'POST',
          body: JSON.stringify({ spec }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await swaggerPost(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('swagger-ui');
      expect(html).toContain('Test API');
    });

    it('should return 400 when spec is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/swagger',
        {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await swaggerPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('OpenAPI specification is required');
    });

    it('should generate Swagger UI with external spec URL', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/swagger?specUrl=http://example.com/openapi.json'
      );

      const response = await swaggerGet(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain("url: 'http://example.com/openapi.json'");
    });

    it('should return 400 when specUrl parameter is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/swagger'
      );

      const response = await swaggerGet(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('specUrl parameter is required');
    });
  });

  describe('/api/documentation/update', () => {
    it('should update documentation successfully', async () => {
      const changes: ModelChange[] = [
        {
          type: 'updated',
          model: sampleModels[0],
          previousModel: { ...sampleModels[0], name: 'OldCategory' },
        },
      ];

      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            changes,
            currentModels: sampleModels,
            currentEndpoints: sampleEndpoints,
            authConfig: sampleAuthConfig,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedFiles).toBeDefined();
      expect(data.data.updatedFiles).toHaveLength(5); // All documentation files
      expect(data.data.message).toContain(
        'Documentation updated for 1 model changes'
      );
    });

    it('should return 400 when projectId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            changes: [],
            currentModels: sampleModels,
            currentEndpoints: sampleEndpoints,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Project ID is required');
    });

    it('should return 400 when changes array is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            currentModels: sampleModels,
            currentEndpoints: sampleEndpoints,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Changes array is required');
    });

    it('should return 400 when currentModels is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            changes: [],
            currentEndpoints: sampleEndpoints,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Current models array is required');
    });

    it('should return 400 when currentEndpoints is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            changes: [],
            currentModels: sampleModels,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Current endpoints array is required');
    });

    it('should handle multiple model changes', async () => {
      const changes: ModelChange[] = [
        {
          type: 'added',
          model: sampleModels[0],
        },
        {
          type: 'updated',
          model: sampleModels[0],
          previousModel: { ...sampleModels[0], name: 'OldCategory' },
        },
        {
          type: 'deleted',
          model: sampleModels[0],
        },
      ];

      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            changes,
            currentModels: sampleModels,
            currentEndpoints: sampleEndpoints,
            authConfig: sampleAuthConfig,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toContain(
        'Documentation updated for 3 model changes'
      );
    });

    it('should work without auth config', async () => {
      const changes: ModelChange[] = [
        {
          type: 'updated',
          model: sampleModels[0],
        },
      ];

      const request = new NextRequest(
        'http://localhost:3000/api/documentation/update',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId: 'test-project-id',
            changes,
            currentModels: sampleModels,
            currentEndpoints: sampleEndpoints,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await updatePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      // Test with malformed data that might cause service errors
      const request = new NextRequest(
        'http://localhost:3000/api/documentation',
        {
          method: 'POST',
          body: JSON.stringify({
            models: [{ invalid: 'model' }],
            endpoints: [{ invalid: 'endpoint' }],
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await documentationPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate OpenAPI specification');
    });
  });
});
