/**
 * Basic end-to-end workflow tests
 * Tests the core user journey through the application
 */

import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectService } from '../../services/projectService';
import { SessionService } from '../../services/sessionService';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
});

describe('Basic User Workflow', () => {
  let projectService: ProjectService;
  let sessionService: SessionService;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset singleton instances
    // @ts-ignore
    ProjectService.instance = undefined;
    // @ts-ignore
    SessionService.instance = undefined;

    projectService = ProjectService.getInstance();
    sessionService = SessionService.getInstance();
  });

  it('should complete a basic project workflow', async () => {
    // Step 1: Create a new project
    const project = await projectService.createProject({
      name: 'Test API',
      description: 'A test API project',
      originalPrompt: 'Create a simple user management API',
    });

    expect(project).toBeDefined();
    expect(project.name).toBe('Test API');
    expect(project.status).toBe('draft');
    expect(sessionService.getCurrentProjectId()).toBe(project.id);

    // Step 2: Add a model
    const userModel = {
      id: uuidv4(),
      name: 'User',
      fields: [
        {
          id: uuidv4(),
          name: 'email',
          type: 'email' as const,
          required: true,
          unique: true,
          validation: [],
        },
        {
          id: uuidv4(),
          name: 'name',
          type: 'string' as const,
          required: true,
          unique: false,
          validation: [],
        },
      ],
      relationships: [],
      metadata: {
        timestamps: true,
        softDelete: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProject = await projectService.updateProject(project.id, {
      models: [userModel],
      status: 'ready',
    });

    expect(updatedProject).toBeDefined();
    expect(updatedProject!.models).toHaveLength(1);
    expect(updatedProject!.models[0].name).toBe('User');
    expect(updatedProject!.status).toBe('ready');

    // Step 3: Export the project
    const exportData = await projectService.exportProject(project.id);
    expect(exportData).toBeDefined();
    expect(typeof exportData).toBe('string');

    const parsedExport = JSON.parse(exportData!);
    expect(parsedExport.name).toBe('Test API');
    expect(parsedExport.models).toHaveLength(1);
  });

  it('should handle session management', async () => {
    // Test session preferences
    sessionService.updatePreferences({
      theme: 'dark',
      autoSave: false,
    });

    const preferences = sessionService.getPreferences();
    expect(preferences.theme).toBe('dark');
    expect(preferences.autoSave).toBe(false);

    // Test project switching
    const project1 = await projectService.createProject({ name: 'Project 1' });
    const project2 = await projectService.createProject({ name: 'Project 2' });

    expect(sessionService.getCurrentProjectId()).toBe(project2.id);

    sessionService.setCurrentProjectId(project1.id);
    expect(sessionService.getCurrentProjectId()).toBe(project1.id);

    const recentProjects = sessionService.getRecentProjects();
    expect(recentProjects).toContain(project1.id);
    expect(recentProjects).toContain(project2.id);
  });

  it('should handle project CRUD operations', async () => {
    // Create
    const project = await projectService.createProject({
      name: 'CRUD Test',
      description: 'Testing CRUD operations',
    });

    expect(project.name).toBe('CRUD Test');

    // Read
    const retrieved = await projectService.getProject(project.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('CRUD Test');

    // Update
    const updated = await projectService.updateProject(project.id, {
      name: 'Updated CRUD Test',
      description: 'Updated description',
    });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe('Updated CRUD Test');
    expect(updated!.description).toBe('Updated description');

    // Delete
    const deleted = await projectService.deleteProject(project.id);
    expect(deleted).toBe(true);

    const shouldBeNull = await projectService.getProject(project.id);
    expect(shouldBeNull).toBeNull();
  });
});
