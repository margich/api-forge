import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeploymentService } from '../services/deploymentService';
import { GeneratedProject } from '../types';

// Mock the adapters
vi.mock('../services/adapters', () => ({
  VercelAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
  NetlifyAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
  HerokuAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
  AWSAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
  GCPAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
  AzureAdapter: vi.fn().mockImplementation(() => ({
    deploy: vi.fn(),
    getStatus: vi.fn(),
    getLogs: vi.fn(),
    cancel: vi.fn(),
    delete: vi.fn(),
    validateConfig: vi.fn(),
  })),
}));

describe('DeploymentService', () => {
  let deploymentService: DeploymentService;
  let mockProject: GeneratedProject;

  beforeEach(() => {
    deploymentService = new DeploymentService();
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
          content: '{"name": "test-api"}',
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
  });

  describe('getAvailablePlatforms', () => {
    it('should return all available platforms', () => {
      const platforms = deploymentService.getAvailablePlatforms();
      expect(platforms).toEqual([
        'vercel',
        'netlify',
        'heroku',
        'aws',
        'gcp',
        'azure',
      ]);
    });
  });

  describe('deployProject', () => {
    it('should deploy project to Vercel successfully', async () => {
      const options = {
        platform: 'vercel' as const,
        environment: 'production' as const,
        environmentVariables: {
          NODE_ENV: 'production',
        },
      };

      const mockDeployment = {
        id: 'deployment-123',
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'pending' as const,
        progress: 0,
        message: 'Initializing deployment...',
        logs: [],
        startedAt: new Date(),
      };

      // Mock the adapter's deploy method
      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.validateConfig.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      mockAdapter.deploy.mockResolvedValue(mockDeployment);

      const result = await deploymentService.deployProject(
        mockProject,
        options
      );

      expect(result).toEqual(mockDeployment);
      expect(mockAdapter.validateConfig).toHaveBeenCalledWith(options);
      expect(mockAdapter.deploy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockProject,
          deploymentConfig: expect.any(Object),
        }),
        options
      );
    });

    it('should throw error for unsupported platform', async () => {
      const options = {
        platform: 'unsupported' as any,
        environment: 'production' as const,
        environmentVariables: {},
      };

      await expect(
        deploymentService.deployProject(mockProject, options)
      ).rejects.toThrow('Unsupported platform: unsupported');
    });

    it('should throw error for invalid configuration', async () => {
      const options = {
        platform: 'vercel' as const,
        environment: 'production' as const,
        environmentVariables: {},
      };

      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.validateConfig.mockResolvedValue({
        valid: false,
        errors: ['Invalid configuration'],
        warnings: [],
      });

      await expect(
        deploymentService.deployProject(mockProject, options)
      ).rejects.toThrow('Invalid configuration: Invalid configuration');
    });
  });

  describe('getDeploymentStatus', () => {
    it('should return deployment status', async () => {
      const deploymentId = 'deployment-123';
      const mockStatus = {
        id: deploymentId,
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'success' as const,
        progress: 100,
        message: 'Deployment completed',
        logs: [],
        startedAt: new Date(),
        completedAt: new Date(),
        url: 'https://test-api.vercel.app',
      };

      // Add deployment to internal storage
      (deploymentService as any).deployments.set(deploymentId, mockStatus);

      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.getStatus.mockResolvedValue(mockStatus);

      const result = await deploymentService.getDeploymentStatus(deploymentId);

      expect(result).toEqual(mockStatus);
      expect(mockAdapter.getStatus).toHaveBeenCalledWith(deploymentId);
    });

    it('should throw error for non-existent deployment', async () => {
      await expect(
        deploymentService.getDeploymentStatus('non-existent')
      ).rejects.toThrow('Deployment not found: non-existent');
    });
  });

  describe('getDeploymentLogs', () => {
    it('should return deployment logs', async () => {
      const deploymentId = 'deployment-123';
      const mockLogs = [
        {
          timestamp: new Date(),
          level: 'info' as const,
          message: 'Starting deployment',
        },
        {
          timestamp: new Date(),
          level: 'info' as const,
          message: 'Deployment completed',
        },
      ];

      const mockDeployment = {
        id: deploymentId,
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'success' as const,
        progress: 100,
        message: 'Deployment completed',
        logs: mockLogs,
        startedAt: new Date(),
      };

      (deploymentService as any).deployments.set(deploymentId, mockDeployment);

      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.getLogs.mockResolvedValue(mockLogs);

      const result = await deploymentService.getDeploymentLogs(deploymentId);

      expect(result).toEqual(mockLogs);
      expect(mockAdapter.getLogs).toHaveBeenCalledWith(deploymentId);
    });
  });

  describe('cancelDeployment', () => {
    it('should cancel deployment successfully', async () => {
      const deploymentId = 'deployment-123';
      const mockDeployment = {
        id: deploymentId,
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'deploying' as const,
        progress: 50,
        message: 'Deploying...',
        logs: [],
        startedAt: new Date(),
      };

      (deploymentService as any).deployments.set(deploymentId, mockDeployment);

      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.cancel.mockResolvedValue(undefined);

      await deploymentService.cancelDeployment(deploymentId);

      expect(mockAdapter.cancel).toHaveBeenCalledWith(deploymentId);

      const updatedDeployment = (deploymentService as any).deployments.get(
        deploymentId
      );
      expect(updatedDeployment.status).toBe('cancelled');
      expect(updatedDeployment.completedAt).toBeDefined();
    });
  });

  describe('deleteDeployment', () => {
    it('should delete deployment successfully', async () => {
      const deploymentId = 'deployment-123';
      const mockDeployment = {
        id: deploymentId,
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'success' as const,
        progress: 100,
        message: 'Deployment completed',
        logs: [],
        startedAt: new Date(),
      };

      (deploymentService as any).deployments.set(deploymentId, mockDeployment);

      const mockAdapter = (deploymentService as any).adapters.get('vercel');
      mockAdapter.delete.mockResolvedValue(undefined);

      await deploymentService.deleteDeployment(deploymentId);

      expect(mockAdapter.delete).toHaveBeenCalledWith(deploymentId);
      expect((deploymentService as any).deployments.has(deploymentId)).toBe(
        false
      );
    });
  });

  describe('listDeployments', () => {
    it('should return all deployments', async () => {
      const deployment1 = {
        id: 'deployment-1',
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'success' as const,
        progress: 100,
        message: 'Completed',
        logs: [],
        startedAt: new Date(),
      };

      const deployment2 = {
        id: 'deployment-2',
        projectId: mockProject.id,
        platform: 'netlify',
        status: 'deploying' as const,
        progress: 50,
        message: 'In progress',
        logs: [],
        startedAt: new Date(),
      };

      (deploymentService as any).deployments.set('deployment-1', deployment1);
      (deploymentService as any).deployments.set('deployment-2', deployment2);

      const result = await deploymentService.listDeployments();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(deployment1);
      expect(result).toContainEqual(deployment2);
    });

    it('should return empty array when no deployments exist', async () => {
      const result = await deploymentService.listDeployments();
      expect(result).toEqual([]);
    });
  });
});
