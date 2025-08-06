import { v4 as uuidv4 } from 'uuid';
import { GeneratedProject } from '../../types';
import {
  CloudPlatformAdapter,
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';

export abstract class BaseCloudAdapter implements CloudPlatformAdapter {
  protected platformName: string;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  abstract deploy(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Promise<DeploymentStatus>;

  abstract getStatus(deploymentId: string): Promise<DeploymentStatus>;

  abstract getLogs(deploymentId: string): Promise<DeploymentLog[]>;

  abstract cancel(deploymentId: string): Promise<void>;

  abstract delete(deploymentId: string): Promise<void>;

  abstract validateConfig(
    options: DeploymentOptions
  ): Promise<ValidationResult>;

  /**
   * Create initial deployment status
   */
  protected createInitialStatus(
    projectId: string,
    platform: string
  ): DeploymentStatus {
    return {
      id: uuidv4(),
      projectId,
      platform,
      status: 'pending',
      progress: 0,
      message: 'Initializing deployment...',
      logs: [],
      startedAt: new Date(),
    };
  }

  /**
   * Add log entry to deployment
   */
  protected addLog(
    status: DeploymentStatus,
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: any
  ): void {
    status.logs.push({
      timestamp: new Date(),
      level,
      message,
      details,
    });
  }

  /**
   * Update deployment progress
   */
  protected updateProgress(
    status: DeploymentStatus,
    progress: number,
    message: string
  ): void {
    status.progress = Math.min(100, Math.max(0, progress));
    status.message = message;
    this.addLog(status, 'info', message);
  }

  /**
   * Mark deployment as completed
   */
  protected completeDeployment(
    status: DeploymentStatus,
    success: boolean,
    url?: string,
    error?: string
  ): void {
    status.status = success ? 'success' : 'failed';
    status.progress = 100;
    status.completedAt = new Date();
    status.url = url;
    status.error = error;

    if (success) {
      status.message = 'Deployment completed successfully';
      this.addLog(status, 'info', `Deployment successful. URL: ${url}`);
    } else {
      status.message = 'Deployment failed';
      this.addLog(status, 'error', `Deployment failed: ${error}`);
    }
  }

  /**
   * Validate common deployment options
   */
  protected validateCommonOptions(
    options: DeploymentOptions
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate environment
    if (
      !['development', 'staging', 'production'].includes(options.environment)
    ) {
      errors.push(
        'Invalid environment. Must be development, staging, or production'
      );
    }

    // Validate custom domain format
    if (options.customDomain) {
      const domainRegex =
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(options.customDomain)) {
        errors.push('Invalid custom domain format');
      }
    }

    // Check for required environment variables
    const requiredVars = ['NODE_ENV'];
    for (const varName of requiredVars) {
      if (!options.environmentVariables[varName]) {
        warnings.push(`Missing recommended environment variable: ${varName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate deployment files for the platform
   */
  protected abstract generateDeploymentFiles(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Record<string, string>;

  /**
   * Simulate deployment process (for testing/demo purposes)
   */
  protected async simulateDeployment(
    status: DeploymentStatus,
    steps: Array<{ message: string; duration: number; progress: number }>
  ): Promise<void> {
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.duration));
      this.updateProgress(status, step.progress, step.message);
    }
  }
}
