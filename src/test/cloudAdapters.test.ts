import { beforeEach, describe, expect, it } from 'vitest';
import { HerokuAdapter } from '../services/adapters/herokuAdapter';
import { NetlifyAdapter } from '../services/adapters/netlifyAdapter';
import { VercelAdapter } from '../services/adapters/vercelAdapter';
import { DeploymentOptions } from '../services/deploymentService';
import { GeneratedProject } from '../types';

describe('Cloud Platform Adapters', () => {
  let mockProject: GeneratedProject;
  let mockOptions: DeploymentOptions;

  beforeEach(() => {
    mockProject = {
      id: 'test-project-123',
      name: 'test-api',
      models: [
        {
          id: 'user-model',
          name: 'User',
          fields: [
            {
              id: 'field-1',
              name: 'email',
              type: 'email',
              required: true,
              unique: true,
              validation: [],
            },
          ],
          relationships: [],
          metadata: {
            timestamps: true,
            softDelete: false,
            requiresAuth: true,
            allowedRoles: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      endpoints: [],
      authConfig: {
        type: 'jwt',
        roles: [],
        protectedRoutes: [],
      },
      files: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: 'test-api',
            version: '1.0.0',
            scripts: { start: 'node app.js' },
          }),
          type: 'config',
        },
      ],
      openAPISpec: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        servers: [],
        paths: {},
        components: { schemas: {}, securitySchemes: {} },
      },
      generationOptions: {
        framework: 'express',
        database: 'postgresql',
        authentication: 'jwt',
        language: 'typescript',
        includeTests: true,
        includeDocumentation: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockOptions = {
      platform: 'vercel',
      environment: 'production',
      environmentVariables: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    };
  });

  describe('VercelAdapter', () => {
    let adapter: VercelAdapter;

    beforeEach(() => {
      adapter = new VercelAdapter();
    });

    it('should validate configuration correctly', async () => {
      const validOptions = {
        ...mockOptions,
        platform: 'vercel' as const,
        region: 'iad1',
      };

      const result = await adapter.validateConfig(validOptions);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid region', async () => {
      const invalidOptions = {
        ...mockOptions,
        platform: 'vercel' as const,
        region: 'invalid-region',
      };

      const result = await adapter.validateConfig(invalidOptions);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Vercel region: invalid-region');
    });

    it('should deploy project successfully', async () => {
      const deployment = await adapter.deploy(mockProject, mockOptions);

      expect(deployment).toMatchObject({
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'pending',
        progress: 0,
        message: 'Initializing deployment...',
      });
      expect(deployment.id).toBeDefined();
      expect(deployment.startedAt).toBeInstanceOf(Date);
    });

    it('should generate deployment files', () => {
      const files = (adapter as any).generateDeploymentFiles(
        mockProject,
        mockOptions
      );

      expect(files).toHaveProperty('vercel.json');
      expect(files['vercel.json']).toContain('"version": 2');
      expect(files['vercel.json']).toContain(mockProject.name);
    });

    it('should get deployment status', async () => {
      const deployment = await adapter.deploy(mockProject, mockOptions);
      const status = await adapter.getStatus(deployment.id);

      expect(status).toMatchObject({
        id: deployment.id,
        projectId: mockProject.id,
        platform: 'vercel',
      });
    });

    it('should cancel deployment', async () => {
      const deployment = await adapter.deploy(mockProject, mockOptions);

      // Wait a bit for deployment to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      await adapter.cancel(deployment.id);
      const status = await adapter.getStatus(deployment.id);

      expect(status.status).toBe('cancelled');
      expect(status.completedAt).toBeDefined();
    });
  });

  describe('NetlifyAdapter', () => {
    let adapter: NetlifyAdapter;

    beforeEach(() => {
      adapter = new NetlifyAdapter();
    });

    it('should validate configuration correctly', async () => {
      const result = await adapter.validateConfig(mockOptions);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'NETLIFY_AUTH_TOKEN not provided - deployment may require manual authentication'
      );
    });

    it('should deploy project successfully', async () => {
      const deployment = await adapter.deploy(mockProject, mockOptions);

      expect(deployment).toMatchObject({
        projectId: mockProject.id,
        platform: 'netlify',
        status: 'pending',
        progress: 0,
      });
    });

    it('should generate deployment files', () => {
      const files = (adapter as any).generateDeploymentFiles(
        mockProject,
        mockOptions
      );

      expect(files).toHaveProperty('netlify.toml');
      expect(files).toHaveProperty('netlify/functions/api.js');
      expect(files).toHaveProperty('_redirects');

      expect(files['netlify.toml']).toContain('[build]');
      expect(files['_redirects']).toContain('/api/*');
    });
  });

  describe('HerokuAdapter', () => {
    let adapter: HerokuAdapter;

    beforeEach(() => {
      adapter = new HerokuAdapter();
    });

    it('should validate configuration correctly', async () => {
      const validOptions = {
        ...mockOptions,
        region: 'us',
      };

      const result = await adapter.validateConfig(validOptions);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'HEROKU_API_KEY not provided - deployment may require manual authentication'
      );
    });

    it('should reject invalid region', async () => {
      const invalidOptions = {
        ...mockOptions,
        region: 'invalid-region',
      };

      const result = await adapter.validateConfig(invalidOptions);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid Heroku region: invalid-region');
    });

    it('should deploy project successfully', async () => {
      const deployment = await adapter.deploy(mockProject, mockOptions);

      expect(deployment).toMatchObject({
        projectId: mockProject.id,
        platform: 'heroku',
        status: 'pending',
        progress: 0,
      });
    });

    it('should generate deployment files', () => {
      const files = (adapter as any).generateDeploymentFiles(
        mockProject,
        mockOptions
      );

      expect(files).toHaveProperty('Procfile');
      expect(files).toHaveProperty('app.json');
      expect(files).toHaveProperty('runtime.txt');

      expect(files['Procfile']).toContain('web: npm start');
      expect(files['runtime.txt']).toContain('node-18.x');

      const appJson = JSON.parse(files['app.json']);
      expect(appJson.name).toBe(mockProject.name);
      expect(appJson.buildpacks).toBeDefined();
    });
  });

  describe('Deployment Workflow Integration', () => {
    it('should handle complete deployment lifecycle', async () => {
      const adapter = new VercelAdapter();

      // Deploy
      const deployment = await adapter.deploy(mockProject, mockOptions);
      expect(deployment.status).toBe('pending');

      // Check initial status
      let status = await adapter.getStatus(deployment.id);
      expect(status.id).toBe(deployment.id);

      // Wait for deployment to progress
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check updated status
      status = await adapter.getStatus(deployment.id);
      expect(status.progress).toBeGreaterThan(0);

      // Get logs
      const logs = await adapter.getLogs(deployment.id);
      expect(logs).toBeInstanceOf(Array);
      expect(logs.length).toBeGreaterThan(0);

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Check final status
      status = await adapter.getStatus(deployment.id);
      expect(status.status).toBe('success');
      expect(status.progress).toBe(100);
      expect(status.url).toBeDefined();
      expect(status.completedAt).toBeDefined();
    });

    it('should handle deployment cancellation', async () => {
      const adapter = new VercelAdapter();

      // Deploy
      const deployment = await adapter.deploy(mockProject, mockOptions);

      // Wait a bit for deployment to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Cancel
      await adapter.cancel(deployment.id);

      // Check status
      const status = await adapter.getStatus(deployment.id);
      expect(status.status).toBe('cancelled');
      expect(status.completedAt).toBeDefined();
    });

    it('should handle deployment deletion', async () => {
      const adapter = new VercelAdapter();

      // Deploy
      const deployment = await adapter.deploy(mockProject, mockOptions);

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Delete
      await adapter.delete(deployment.id);

      // Verify deletion (should throw error when trying to get status)
      await expect(adapter.getStatus(deployment.id)).rejects.toThrow();
    });
  });
});
