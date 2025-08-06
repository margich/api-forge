import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class VercelAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('vercel');
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

    // In a real implementation, this would call Vercel API to delete the deployment
    this.addLog(status, 'info', 'Deployment deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // Vercel-specific validations
    if (options.region && !this.isValidVercelRegion(options.region)) {
      errors.push(`Invalid Vercel region: ${options.region}`);
    }

    // Check for Vercel-specific environment variables
    if (!options.environmentVariables.VERCEL_TOKEN) {
      warnings.push(
        'VERCEL_TOKEN not provided - deployment may require manual authentication'
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

    // Generate vercel.json configuration
    files['vercel.json'] = JSON.stringify(
      {
        version: 2,
        name: project.name,
        builds: [
          {
            src: 'src/app.ts',
            use: '@vercel/node',
          },
        ],
        routes: [
          {
            src: '/api/(.*)',
            dest: '/src/app.ts',
          },
          {
            src: '/(.*)',
            dest: '/src/app.ts',
          },
        ],
        env: options.environmentVariables,
        regions: options.region ? [options.region] : ['iad1'],
      },
      null,
      2
    );

    // Generate package.json scripts for Vercel
    const packageJsonContent = project.files.find(
      (f) => f.path === 'package.json'
    )?.content;
    if (packageJsonContent) {
      try {
        const packageJson = JSON.parse(packageJsonContent);
        packageJson.scripts = {
          ...packageJson.scripts,
          'vercel-build': 'npm run build',
          start: 'node dist/app.js',
        };
        files['package.json'] = JSON.stringify(packageJson, null, 2);
      } catch (error) {
        console.warn('Failed to update package.json for Vercel deployment');
      }
    }

    return files;
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Preparing deployment files...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} deployment files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        { message: 'Uploading project files...', duration: 2000, progress: 30 },
        { message: 'Installing dependencies...', duration: 3000, progress: 50 },
        { message: 'Building application...', duration: 2500, progress: 70 },
        {
          message: 'Deploying to Vercel edge network...',
          duration: 2000,
          progress: 90,
        },
        {
          message: 'Configuring custom domain...',
          duration: 1000,
          progress: 95,
        },
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

    // Generate Vercel-style URL
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `https://${sanitizedName}-${randomSuffix}.vercel.app`;
  }

  private isValidVercelRegion(region: string): boolean {
    const validRegions = [
      'iad1',
      'dub1',
      'fra1',
      'gru1',
      'hkg1',
      'hnd1',
      'icn1',
      'kix1',
      'lax1',
      'lhr1',
      'pdx1',
      'sfo1',
      'sin1',
      'syd1',
      'bom1',
      'cdg1',
    ];
    return validRegions.includes(region);
  }
}
