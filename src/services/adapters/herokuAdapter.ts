import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class HerokuAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('heroku');
  }

  async deploy(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Promise<DeploymentStatus> {
    const status = this.createInitialStatus(project.id, this.platformName);
    this.deployments.set(status.id, status);

    // Start deployment process
    this.deployAsync(project, options, status);

    return status;
  }

  async getStatus(deploymentId: string): Promise<DeploymentStatus> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }
    return status;
  }

  async getLogs(deploymentId: string): Promise<DeploymentLog[]> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }
    return status.logs;
  }

  async cancel(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    if (status.status === 'deploying') {
      status.status = 'cancelled';
      status.completedAt = new Date();
      this.addLog(status, 'info', 'Deployment cancelled by user');
    }
  }

  async delete(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    this.addLog(status, 'info', 'Heroku app deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // Heroku-specific validations
    if (!options.environmentVariables.HEROKU_API_KEY) {
      warnings.push(
        'HEROKU_API_KEY not provided - deployment may require manual authentication'
      );
    }

    // Validate Heroku region
    if (options.region && !this.isValidHerokuRegion(options.region)) {
      errors.push(`Invalid Heroku region: ${options.region}`);
    }

    // Check for required Heroku environment variables
    if (!options.environmentVariables.PORT) {
      warnings.push(
        'PORT environment variable not set - Heroku will assign one automatically'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  protected generateDeploymentFiles(
    project: GeneratedProject,
    options: DeploymentOptions
  ): Record<string, string> {
    const files: Record<string, string> = {};

    // Generate Procfile
    files['Procfile'] = this.generateProcfile(project);

    // Generate app.json for Heroku app configuration
    files['app.json'] = JSON.stringify(
      this.generateAppJson(project, options),
      null,
      2
    );

    // Generate runtime.txt for Node.js version
    files['runtime.txt'] = 'node-18.x';

    // Update package.json for Heroku
    const packageJsonContent = project.files.find(
      (f) => f.path === 'package.json'
    )?.content;
    if (packageJsonContent) {
      try {
        const packageJson = JSON.parse(packageJsonContent);
        packageJson.scripts = {
          ...packageJson.scripts,
          'heroku-postbuild': 'npm run build',
          start: 'node dist/app.js',
        };
        packageJson.engines = {
          node: '>=18.0.0',
          npm: '>=8.0.0',
        };
        files['package.json'] = JSON.stringify(packageJson, null, 2);
      } catch (error) {
        console.warn('Failed to update package.json for Heroku deployment');
      }
    }

    return files;
  }

  private generateProcfile(project: GeneratedProject): string {
    return 'web: npm start\n';
  }

  private generateAppJson(
    project: GeneratedProject,
    options: DeploymentOptions
  ) {
    const appJson = {
      name: project.name,
      description: `Generated API project with ${project.models.length} models`,
      repository: `https://github.com/user/${project.name}`,
      logo: 'https://node-js-sample.herokuapp.com/node.png',
      keywords: ['node', 'express', 'api', 'generated'],
      image: 'heroku/nodejs',
      stack: 'heroku-22',
      buildpacks: [
        {
          url: 'heroku/nodejs',
        },
      ],
      env: {} as Record<string, any>,
      formation: {
        web: {
          quantity: 1,
          size: 'basic',
        },
      },
      addons: [] as string[],
    };

    // Add environment variables
    Object.entries(options.environmentVariables).forEach(([key, value]) => {
      appJson.env[key] = {
        description: `Environment variable: ${key}`,
        value: value,
      };
    });

    // Add database addon based on project configuration
    const dbType = project.generationOptions.database;
    if (dbType === 'postgresql') {
      appJson.addons.push('heroku-postgresql:mini');
    }

    return appJson;
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Creating Heroku app...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} Heroku configuration files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        {
          message: 'Pushing to Heroku Git repository...',
          duration: 3000,
          progress: 25,
        },
        { message: 'Detecting buildpack...', duration: 1000, progress: 35 },
        { message: 'Installing dependencies...', duration: 4000, progress: 55 },
        { message: 'Building application...', duration: 3000, progress: 75 },
        { message: 'Starting dynos...', duration: 2000, progress: 90 },
        { message: 'Configuring database...', duration: 1500, progress: 95 },
      ]);

      // Generate deployment URL
      const deploymentUrl = this.generateDeploymentUrl(project.name, options);
      this.completeDeployment(status, true, deploymentUrl);
    } catch (error) {
      this.completeDeployment(
        status,
        false,
        undefined,
        error instanceof Error ? error.message : 'Unknown deployment error'
      );
    }
  }

  private generateDeploymentUrl(
    projectName: string,
    options: DeploymentOptions
  ): string {
    if (options.customDomain) {
      return `https://${options.customDomain}`;
    }

    // Generate Heroku-style URL
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `https://${sanitizedName}-${randomSuffix}.herokuapp.com`;
  }

  private isValidHerokuRegion(region: string): boolean {
    const validRegions = ['us', 'eu'];
    return validRegions.includes(region);
  }
}
