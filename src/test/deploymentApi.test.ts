import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as cancelPOST } from '../app/api/deployment/[id]/cancel/route';
import { GET as logsGET } from '../app/api/deployment/[id]/logs/route';
import {
  DELETE as statusDELETE,
  GET as statusGET,
} from '../app/api/deployment/[id]/route';
import { GET as platformsGET } from '../app/api/deployment/platforms/route';
import {
  GET as deploymentGET,
  POST as deploymentPOST,
} from '../app/api/deployment/route';

// Mock the deployment service
vi.mock('../services/deploymentService', () => ({
  DeploymentService: vi.fn().mockImplementation(() => ({
    deployProject: vi.fn(),
    getDeploymentStatus: vi.fn(),
    getDeploymentLogs: vi.fn(),
    cancelDeployment: vi.fn(),
    deleteDeployment: vi.fn(),
    listDeployments: vi.fn(),
    getAvailablePlatforms: vi.fn(),
  })),
}));

describe('Deployment API Routes', () => {
  let mockDeploymentService: any;

  beforeEach(async () => {
    const { DeploymentService } = await import('../services/deploymentService');
    mockDeploymentService = new DeploymentService();
    vi.clearAllMocks();
  });

  describe('POST /api/deployment', () => {
    it('should deploy project successfully', async () => {
      const mockProject = {
        id: 'test-project',
        name: 'test-api',
        models: [],
        endpoints: [],
        authConfig: { type: 'jwt', roles: [], protectedRoutes: [] },
        files: [],
        openAPISpec: {
          openapi: '3.0.0',
          info: { title: 'Test', version: '1.0.0' },
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

      const mockOptions = {
        platform: 'vercel',
        environment: 'production',
        environmentVariables: { NODE_ENV: 'production' },
      };

      const mockDeployment = {
        id: 'deployment-123',
        projectId: mockProject.id,
        platform: 'vercel',
        status: 'pending',
        progress: 0,
        message: 'Starting deployment',
        logs: [],
        startedAt: new Date(),
      };

      mockDeploymentService.deployProject.mockResolvedValue(mockDeployment);

      const request = new NextRequest('http://localhost:3000/api/deployment', {
        method: 'POST',
        body: JSON.stringify({
          project: mockProject,
          options: mockOptions,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await deploymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDeployment);
      expect(mockDeploymentService.deployProject).toHaveBeenCalledWith(
        mockProject,
        mockOptions
      );
    });

    it('should return 400 for missing project', async () => {
      const request = new NextRequest('http://localhost:3000/api/deployment', {
        method: 'POST',
        body: JSON.stringify({
          options: { platform: 'vercel' },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await deploymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Project and deployment options are required');
    });

    it('should return 400 for missing platform', async () => {
      const request = new NextRequest('http://localhost:3000/api/deployment', {
        method: 'POST',
        body: JSON.stringify({
          project: { id: 'test' },
          options: { environment: 'production' },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await deploymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Deployment platform is required');
    });

    it('should return 500 for deployment service error', async () => {
      mockDeploymentService.deployProject.mockRejectedValue(
        new Error('Deployment failed')
      );

      const request = new NextRequest('http://localhost:3000/api/deployment', {
        method: 'POST',
        body: JSON.stringify({
          project: { id: 'test' },
          options: { platform: 'vercel', environment: 'production' },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await deploymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to deploy project');
      expect(data.details).toBe('Deployment failed');
    });
  });

  describe('GET /api/deployment', () => {
    it('should return list of deployments', async () => {
      const mockDeployments = [
        {
          id: 'deployment-1',
          projectId: 'project-1',
          platform: 'vercel',
          status: 'success',
          progress: 100,
          message: 'Completed',
          logs: [],
          startedAt: new Date(),
        },
      ];

      mockDeploymentService.listDeployments.mockResolvedValue(mockDeployments);

      const response = await deploymentGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDeployments);
      expect(mockDeploymentService.listDeployments).toHaveBeenCalled();
    });

    it('should return 500 for service error', async () => {
      mockDeploymentService.listDeployments.mockRejectedValue(
        new Error('Service error')
      );

      const response = await deploymentGET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch deployments');
    });
  });

  describe('GET /api/deployment/[id]', () => {
    it('should return deployment status', async () => {
      const deploymentId = 'deployment-123';
      const mockStatus = {
        id: deploymentId,
        projectId: 'project-1',
        platform: 'vercel',
        status: 'success',
        progress: 100,
        message: 'Completed',
        logs: [],
        startedAt: new Date(),
      };

      mockDeploymentService.getDeploymentStatus.mockResolvedValue(mockStatus);

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}`
      );
      const response = await statusGET(request, {
        params: { id: deploymentId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockStatus);
      expect(mockDeploymentService.getDeploymentStatus).toHaveBeenCalledWith(
        deploymentId
      );
    });

    it('should return 404 for non-existent deployment', async () => {
      const deploymentId = 'non-existent';
      mockDeploymentService.getDeploymentStatus.mockRejectedValue(
        new Error('Deployment not found: non-existent')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}`
      );
      const response = await statusGET(request, {
        params: { id: deploymentId },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Deployment not found');
    });
  });

  describe('DELETE /api/deployment/[id]', () => {
    it('should delete deployment successfully', async () => {
      const deploymentId = 'deployment-123';
      mockDeploymentService.deleteDeployment.mockResolvedValue(undefined);

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}`,
        { method: 'DELETE' }
      );
      const response = await statusDELETE(request, {
        params: { id: deploymentId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Deployment deleted successfully');
      expect(mockDeploymentService.deleteDeployment).toHaveBeenCalledWith(
        deploymentId
      );
    });

    it('should return 404 for non-existent deployment', async () => {
      const deploymentId = 'non-existent';
      mockDeploymentService.deleteDeployment.mockRejectedValue(
        new Error('Deployment not found: non-existent')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}`,
        { method: 'DELETE' }
      );
      const response = await statusDELETE(request, {
        params: { id: deploymentId },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Deployment not found');
    });
  });

  describe('GET /api/deployment/[id]/logs', () => {
    it('should return deployment logs', async () => {
      const deploymentId = 'deployment-123';
      const mockLogs = [
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Starting deployment',
        },
        {
          timestamp: new Date(),
          level: 'info',
          message: 'Deployment completed',
        },
      ];

      mockDeploymentService.getDeploymentLogs.mockResolvedValue(mockLogs);

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}/logs`
      );
      const response = await logsGET(request, { params: { id: deploymentId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockLogs);
      expect(mockDeploymentService.getDeploymentLogs).toHaveBeenCalledWith(
        deploymentId
      );
    });
  });

  describe('POST /api/deployment/[id]/cancel', () => {
    it('should cancel deployment successfully', async () => {
      const deploymentId = 'deployment-123';
      mockDeploymentService.cancelDeployment.mockResolvedValue(undefined);

      const request = new NextRequest(
        `http://localhost:3000/api/deployment/${deploymentId}/cancel`,
        { method: 'POST' }
      );
      const response = await cancelPOST(request, {
        params: { id: deploymentId },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Deployment cancelled successfully');
      expect(mockDeploymentService.cancelDeployment).toHaveBeenCalledWith(
        deploymentId
      );
    });
  });

  describe('GET /api/deployment/platforms', () => {
    it('should return available platforms', async () => {
      mockDeploymentService.getAvailablePlatforms.mockReturnValue([
        'vercel',
        'netlify',
        'heroku',
      ]);

      const response = await platformsGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data[0]).toHaveProperty('id', 'vercel');
      expect(data[0]).toHaveProperty('name', 'Vercel');
      expect(data[0]).toHaveProperty('description');
      expect(data[0]).toHaveProperty('features');
      expect(data[0]).toHaveProperty('regions');
    });

    it('should return 500 for service error', async () => {
      mockDeploymentService.getAvailablePlatforms.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await platformsGET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch deployment platforms');
    });
  });
});
