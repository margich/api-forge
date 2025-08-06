import { v4 as uuidv4 } from 'uuid';
import {
  CreateProjectInput,
  Project,
  ProjectSchema,
  ProjectSummary,
  ProjectSummarySchema,
  UpdateProjectInput,
} from '../types/project';
import { SessionService } from './sessionService';

const PROJECT_STORAGE_PREFIX = 'api-generator-project-';
const PROJECTS_INDEX_KEY = 'api-generator-projects-index';

export class ProjectService {
  private static instance: ProjectService;
  private sessionService: SessionService;

  private constructor() {
    this.sessionService = SessionService.getInstance();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  private getStorageKey(projectId: string): string {
    return `${PROJECT_STORAGE_PREFIX}${projectId}`;
  }

  private loadProjectsIndex(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(PROJECTS_INDEX_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load projects index:', error);
      return [];
    }
  }

  private saveProjectsIndex(projectIds: string[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(projectIds));
    } catch (error) {
      console.error('Failed to save projects index:', error);
    }
  }

  private addToIndex(projectId: string): void {
    const index = this.loadProjectsIndex();
    if (!index.includes(projectId)) {
      index.push(projectId);
      this.saveProjectsIndex(index);
    }
  }

  private removeFromIndex(projectId: string): void {
    const index = this.loadProjectsIndex();
    const filtered = index.filter((id) => id !== projectId);
    this.saveProjectsIndex(filtered);
  }

  public async createProject(input: CreateProjectInput): Promise<Project> {
    const project: Project = ProjectSchema.parse({
      id: uuidv4(),
      name: input.name,
      description: input.description,
      originalPrompt: input.originalPrompt,
      status: 'draft',
      models: [],
      lastModified: new Date(),
      createdAt: new Date(),
    });

    await this.saveProject(project);
    this.addToIndex(project.id);
    this.sessionService.setCurrentProjectId(project.id);

    return project;
  }

  public async getProject(projectId: string): Promise<Project | null> {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.getStorageKey(projectId));
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Convert date strings back to Date objects
      if (parsed.lastModified) {
        parsed.lastModified = new Date(parsed.lastModified);
      }
      if (parsed.createdAt) {
        parsed.createdAt = new Date(parsed.createdAt);
      }
      if (parsed.models) {
        parsed.models.forEach((model: any) => {
          if (model.createdAt) model.createdAt = new Date(model.createdAt);
          if (model.updatedAt) model.updatedAt = new Date(model.updatedAt);
        });
      }

      return ProjectSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  public async updateProject(
    projectId: string,
    updates: UpdateProjectInput
  ): Promise<Project | null> {
    const existing = await this.getProject(projectId);
    if (!existing) return null;

    const updated: Project = ProjectSchema.parse({
      ...existing,
      ...updates,
      id: projectId, // Ensure ID doesn't change
      lastModified: new Date(),
    });

    await this.saveProject(updated);
    return updated;
  }

  public async saveProject(project: Project): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const validated = ProjectSchema.parse(project);
      localStorage.setItem(
        this.getStorageKey(project.id),
        JSON.stringify(validated)
      );

      // Auto-save to session if this is the current project
      if (this.sessionService.getCurrentProjectId() === project.id) {
        this.sessionService.addToRecentProjects(project.id);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project');
    }
  }

  public async deleteProject(projectId: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(this.getStorageKey(projectId));
      this.removeFromIndex(projectId);

      // Clear from session if this was the current project
      if (this.sessionService.getCurrentProjectId() === projectId) {
        this.sessionService.setCurrentProjectId(null);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  public async listProjects(): Promise<ProjectSummary[]> {
    const projectIds = this.loadProjectsIndex();
    const summaries: ProjectSummary[] = [];

    for (const projectId of projectIds) {
      const project = await this.getProject(projectId);
      if (project) {
        const summary: ProjectSummary = ProjectSummarySchema.parse({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          modelCount: project.models.length,
          lastModified: project.lastModified,
          createdAt: project.createdAt,
        });
        summaries.push(summary);
      }
    }

    // Sort by last modified date (most recent first)
    return summaries.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    );
  }

  public async getRecentProjects(limit: number = 5): Promise<ProjectSummary[]> {
    const recentIds = this.sessionService.getRecentProjects().slice(0, limit);
    const summaries: ProjectSummary[] = [];

    for (const projectId of recentIds) {
      const project = await this.getProject(projectId);
      if (project) {
        const summary: ProjectSummary = ProjectSummarySchema.parse({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          modelCount: project.models.length,
          lastModified: project.lastModified,
          createdAt: project.createdAt,
        });
        summaries.push(summary);
      }
    }

    return summaries;
  }

  public async duplicateProject(
    projectId: string,
    newName?: string
  ): Promise<Project | null> {
    const original = await this.getProject(projectId);
    if (!original) return null;

    const duplicate: Project = ProjectSchema.parse({
      ...original,
      id: uuidv4(),
      name: newName || `${original.name} (Copy)`,
      status: 'draft',
      createdAt: new Date(),
      lastModified: new Date(),
    });

    await this.saveProject(duplicate);
    this.addToIndex(duplicate.id);

    return duplicate;
  }

  public async exportProject(projectId: string): Promise<string | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    try {
      return JSON.stringify(project, null, 2);
    } catch (error) {
      console.error('Failed to export project:', error);
      return null;
    }
  }

  public async importProject(projectData: string): Promise<Project | null> {
    try {
      const parsed = JSON.parse(projectData);

      // Generate new ID to avoid conflicts
      const project: Project = ProjectSchema.parse({
        ...parsed,
        id: uuidv4(),
        createdAt: new Date(),
        lastModified: new Date(),
      });

      await this.saveProject(project);
      this.addToIndex(project.id);

      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }
}
