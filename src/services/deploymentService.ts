import { DeploymentConfig, GeneratedProject } from '../types';
import {
  AWSAdapter,
  AzureAdapter,
  GCPAdapter,
  HerokuAdapter,
  NetlifyAdapter,
  VercelAdapter,
} from './adapters';

export interface DeploymentStatus {
  id: string;
  projectId: string;
  platform: string;
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  url?: string;
  logs: DeploymentLog[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface DeploymentLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

export interface DeploymentOptions {
  platform: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'heroku';
  region?: string;
  environment: 'development' | 'staging' | 'production';
  environmentVariables: Record<string, string>;
  customDomain?: string;
  autoScale?: boolean;
  instanceType?: string;
}

export interface CloudPlatformAdapter {
  deploy(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Promise<DeploymentStatus>;
  getStatus(deploymentId: string): Promise<DeploymentStatus>;
  getLogs(deploymentId: string): Promise<DeploymentLog[]>;
  cancel(deploymentId: string): Promise<void>;
  delete(deploymentId: string): Promise<void>;
  validateConfig(options: DeploymentOptions): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DeploymentService {
  private adapters: Map<string, CloudPlatformAdapter> = new Map();
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    // Initialize platform adapters
    this.adapters.set('vercel', new VercelAdapter());
    this.adapters.set('netlify', new NetlifyAdapter());
    this.adapters.set('heroku', new HerokuAdapter());
    this.adapters.set('aws', new AWSAdapter());
    this.adapters.set('gcp', new GCPAdapter());
    this.adapters.set('azure', new AzureAdapter());
  }

  /**
   * Deploy a project to a cloud platform
   */
  async deployProject(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Promise<DeploymentStatus> {
    const adapter = this.adapters.get(options.platform);
    if (!adapter) {
      throw new Error(`Unsupported platform: ${options.platform}`);
    }

    // Validate deployment configuration
    const validation = await adapter.validateConfig(options);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Generate deployment configuration
    const deploymentConfig = this.generateDeploymentConfig(project, options);
    const updatedProject = {
      ...project,
      deploymentConfig,
    };

    // Start deployment
    const deployment = await adapter.deploy(updatedProject, options);
    this.deployments.set(deployment.id, deployment);

    return deployment;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const adapter = this.adapters.get(deployment.platform);
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${deployment.platform}`);
    }

    const status = await adapter.getStatus(deploymentId);
    this.deployments.set(deploymentId, status);

    return status;
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<DeploymentLog[]> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const adapter = this.adapters.get(deployment.platform);
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${deployment.platform}`);
    }

    return await adapter.getLogs(deploymentId);
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const adapter = this.adapters.get(deployment.platform);
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${deployment.platform}`);
    }

    await adapter.cancel(deploymentId);

    // Update local status
    deployment.status = 'cancelled';
    deployment.completedAt = new Date();
    this.deployments.set(deploymentId, deployment);
  }

  /**
   * Delete a deployment
   */
  async deleteDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    const adapter = this.adapters.get(deployment.platform);
    if (!adapter) {
      throw new Error(`Adapter not found for platform: ${deployment.platform}`);
    }

    await adapter.delete(deploymentId);
    this.deployments.delete(deploymentId);
  }

  /**
   * List all deployments
   */
  async listDeployments(): Promise<DeploymentStatus[]> {
    return Array.from(this.deployments.values());
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Generate deployment configuration for different environments
   */
  private generateDeploymentConfig(
    project: GeneratedProject,
    options: DeploymentOptions
  ): DeploymentConfig {
    const baseConfig: DeploymentConfig = {
      platform: options.platform,
      region: options.region,
      environment: options.environment,
      environmentVariables: {
        NODE_ENV: options.environment,
        PORT: '3000',
        ...this.generateDatabaseConfig(project, options),
        ...this.generateAuthConfig(project, options),
        ...options.environmentVariables,
      },
      customDomain: options.customDomain,
    };

    return baseConfig;
  }

  /**
   * Generate database configuration for deployment
   */
  private generateDatabaseConfig(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Record<string, string> {
    const config: Record<string, string> = {};
    const dbType = project.generationOptions.database;

    switch (options.platform) {
      case 'vercel':
        // Vercel typically uses serverless databases
        if (dbType === 'postgresql') {
          config.DATABASE_URL = '${POSTGRES_URL}';
        } else if (dbType === 'mysql') {
          config.DATABASE_URL = '${MYSQL_URL}';
        }
        break;

      case 'heroku':
        // Heroku provides database URLs automatically
        if (dbType === 'postgresql') {
          config.DATABASE_URL = '${DATABASE_URL}';
        }
        break;

      case 'aws':
        // AWS RDS configuration
        config.DB_HOST = '${RDS_HOSTNAME}';
        config.DB_PORT = '${RDS_PORT}';
        config.DB_NAME = '${RDS_DB_NAME}';
        config.DB_USERNAME = '${RDS_USERNAME}';
        config.DB_PASSWORD = '${RDS_PASSWORD}';
        break;

      default:
        // Generic database configuration
        config.DATABASE_URL = '${DATABASE_URL}';
        break;
    }

    return config;
  }

  /**
   * Generate authentication configuration for deployment
   */
  private generateAuthConfig(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Record<string, string> {
    const config: Record<string, string> = {};
    const authType = project.authConfig.type;

    if (authType === 'jwt') {
      config.JWT_SECRET = '${JWT_SECRET}';
      config.JWT_REFRESH_SECRET = '${JWT_REFRESH_SECRET}';
      config.JWT_EXPIRES_IN = '15m';
    }

    // Add OAuth provider configurations
    if (project.authConfig.providers) {
      project.authConfig.providers.forEach((provider) => {
        const providerName = provider.name.toUpperCase();
        config[`${providerName}_CLIENT_ID`] = `\${${providerName}_CLIENT_ID}`;
        config[`${providerName}_CLIENT_SECRET`] =
          `\${${providerName}_CLIENT_SECRET}`;
      });
    }

    return config;
  }
}
