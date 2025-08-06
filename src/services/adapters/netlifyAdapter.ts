import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class NetlifyAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('netlify');
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

    this.addLog(status, 'info', 'Deployment deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // Netlify-specific validations
    if (!options.environmentVariables.NETLIFY_AUTH_TOKEN) {
      warnings.push(
        'NETLIFY_AUTH_TOKEN not provided - deployment may require manual authentication'
      );
    }

    // Netlify Functions validation
    if (options.environmentVariables.NETLIFY_FUNCTIONS_DIRECTORY) {
      const functionsDir =
        options.environmentVariables.NETLIFY_FUNCTIONS_DIRECTORY;
      if (!functionsDir.startsWith('./') && !functionsDir.startsWith('/')) {
        warnings.push(
          'NETLIFY_FUNCTIONS_DIRECTORY should be a relative or absolute path'
        );
      }
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

    // Generate netlify.toml configuration
    files['netlify.toml'] = this.generateNetlifyToml(project, options);

    // Generate Netlify Functions
    files['netlify/functions/api.js'] = this.generateNetlifyFunction(project);

    // Generate _redirects file for SPA routing
    files['_redirects'] = this.generateRedirects(project);

    return files;
  }

  private generateNetlifyToml(
    project: GeneratedProject,
    options: DeploymentOptions
  ): string {
    const config = {
      build: {
        command: 'npm run build',
        functions: 'netlify/functions',
        publish: 'dist',
      },
      dev: {
        command: 'npm run dev',
        port: 3000,
      },
      context: {
        production: {
          environment: options.environmentVariables,
        },
        'deploy-preview': {
          environment: {
            ...options.environmentVariables,
            NODE_ENV: 'staging',
          },
        },
      },
      functions: {
        api: {
          included_files: ['src/**/*'],
        },
      },
    };

    // Convert to TOML format (simplified)
    let toml = '[build]\n';
    toml += `  command = "${config.build.command}"\n`;
    toml += `  functions = "${config.build.functions}"\n`;
    toml += `  publish = "${config.build.publish}"\n\n`;

    toml += '[dev]\n';
    toml += `  command = "${config.dev.command}"\n`;
    toml += `  port = ${config.dev.port}\n\n`;

    // Add environment variables
    toml += '[context.production.environment]\n';
    Object.entries(options.environmentVariables).forEach(([key, value]) => {
      toml += `  ${key} = "${value}"\n`;
    });

    return toml;
  }

  private generateNetlifyFunction(project: GeneratedProject): string {
    return `const express = require('express');
const serverless = require('serverless-http');

// Import your Express app
const app = require('../../src/app');

// Export the serverless function
exports.handler = serverless(app);
`;
  }

  private generateRedirects(project: GeneratedProject): string {
    let redirects = '# API routes\n';
    redirects += '/api/* /.netlify/functions/api/:splat 200\n\n';

    redirects += '# SPA fallback\n';
    redirects += '/* /index.html 200\n';

    return redirects;
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Preparing Netlify deployment...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} Netlify configuration files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        { message: 'Uploading to Netlify...', duration: 2500, progress: 30 },
        { message: 'Installing dependencies...', duration: 3500, progress: 50 },
        { message: 'Building application...', duration: 3000, progress: 70 },
        {
          message: 'Deploying to Netlify CDN...',
          duration: 2000,
          progress: 85,
        },
        {
          message: 'Setting up Netlify Functions...',
          duration: 1500,
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

    // Generate Netlify-style URL
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `https://${sanitizedName}-${randomSuffix}.netlify.app`;
  }
}
