import { SessionData, SessionDataSchema } from '../types/project';

const SESSION_STORAGE_KEY = 'api-generator-session';
const PROJECT_STORAGE_PREFIX = 'api-generator-project-';

export class SessionService {
  private static instance: SessionService;
  private sessionData: SessionData;

  private constructor() {
    this.sessionData = this.loadSession();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private loadSession(): SessionData {
    if (typeof window === 'undefined') {
      // Server-side rendering fallback
      return SessionDataSchema.parse({});
    }

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.lastActivity) {
          parsed.lastActivity = new Date(parsed.lastActivity);
        }
        return SessionDataSchema.parse(parsed);
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }

    return SessionDataSchema.parse({});
  }

  private saveSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(this.sessionData)
      );
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  public getSession(): SessionData {
    return { ...this.sessionData };
  }

  public getCurrentProjectId(): string | null {
    return this.sessionData.currentProjectId || null;
  }

  public setCurrentProjectId(projectId: string | null): void {
    this.sessionData.currentProjectId = projectId || undefined;
    this.sessionData.lastActivity = new Date();

    if (projectId) {
      this.addToRecentProjects(projectId);
    }

    this.saveSession();
  }

  public addToRecentProjects(projectId: string): void {
    const recent = this.sessionData.recentProjects.filter(
      (id) => id !== projectId
    );
    recent.unshift(projectId);
    this.sessionData.recentProjects = recent.slice(0, 10);
    this.saveSession();
  }

  public getRecentProjects(): string[] {
    return [...this.sessionData.recentProjects];
  }

  public updatePreferences(
    preferences: Partial<SessionData['preferences']>
  ): void {
    this.sessionData.preferences = {
      ...this.sessionData.preferences,
      ...preferences,
    };
    this.sessionData.lastActivity = new Date();
    this.saveSession();
  }

  public getPreferences(): SessionData['preferences'] {
    return { ...this.sessionData.preferences };
  }

  public clearSession(): void {
    this.sessionData = SessionDataSchema.parse({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  public isAutoSaveEnabled(): boolean {
    return this.sessionData.preferences.autoSave;
  }

  public shouldShowTips(): boolean {
    return this.sessionData.preferences.showTips;
  }

  public getTheme(): 'light' | 'dark' | 'system' {
    return this.sessionData.preferences.theme;
  }
}
