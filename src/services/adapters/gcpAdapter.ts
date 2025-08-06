import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class GCPAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('gcp');
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
      this.addLog(status, 'info', 'GCP deployment cancelled by user');
    }
  }

  async delete(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    this.addLog(status, 'info', 'GCP resources deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // GCP-specific validations
    if (!options.environmentVariables.GOOGLE_APPLICATION_CREDENTIALS) {
      warnings.push(
        'GOOGLE_APPLICATION_CREDENTIALS not provided - using default service account'
      );
    }

    if (!options.environmentVariables.GCP_PROJECT_ID) {
      errors.push('GCP_PROJECT_ID is required for GCP deployment');
    }

    if (options.region && !this.isValidGCPRegion(options.region)) {
      errors.push(`Invalid GCP region: ${options.region}`);
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

    // Generate app.yaml for App Engine
    files['app.yaml'] = this.generateAppYaml(project, options);

    // Generate cloudbuild.yaml for Cloud Build
    files['cloudbuild.yaml'] = this.generateCloudBuildConfig(project);

    // Generate Dockerfile
    files['Dockerfile'] = this.generateDockerfile(project);

    return files;
  }

  private generateAppYaml(
    project: GeneratedProject,
    options: DeploymentOptions
  ): string {
    const appYaml = {
      runtime: 'nodejs18',
      service: project.name,
      env_variables: options.environmentVariables,
      automatic_scaling: {
        min_instances: 1,
        max_instances: 10,
        target_cpu_utilization: 0.6,
      },
      resources: {
        cpu: 1,
        memory_gb: 0.5,
      },
    };

    // Convert to YAML format (simplified)
    let yaml = `runtime: ${appYaml.runtime}\n`;
    yaml += `service: ${appYaml.service}\n\n`;

    yaml += 'env_variables:\n';
    Object.entries(appYaml.env_variables).forEach(([key, value]) => {
      yaml += `  ${key}: "${value}"\n`;
    });

    yaml += '\nautomatic_scaling:\n';
    yaml += `  min_instances: ${appYaml.automatic_scaling.min_instances}\n`;
    yaml += `  max_instances: ${appYaml.automatic_scaling.max_instances}\n`;
    yaml += `  target_cpu_utilization: ${appYaml.automatic_scaling.target_cpu_utilization}\n`;

    yaml += '\nresources:\n';
    yaml += `  cpu: ${appYaml.resources.cpu}\n`;
    yaml += `  memory_gb: ${appYaml.resources.memory_gb}\n`;

    return yaml;
  }

  private generateCloudBuildConfig(project: GeneratedProject): string {
    const buildConfig = {
      steps: [
        {
          name: 'node:18',
          entrypoint: 'npm',
          args: ['install'],
        },
        {
          name: 'node:18',
          entrypoint: 'npm',
          args: ['run', 'build'],
        },
        {
          name: 'gcr.io/cloud-builders/gcloud',
          args: ['app', 'deploy'],
        },
      ],
      timeout: '1200s',
    };

    return JSON.stringify(buildConfig, null, 2);
  }

  private generateDockerfile(project: GeneratedProject): string {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
`;
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Initializing GCP deployment...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} GCP configuration files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        {
          message: 'Uploading to Cloud Storage...',
          duration: 2500,
          progress: 25,
        },
        { message: 'Starting Cloud Build...', duration: 4000, progress: 45 },
        {
          message: 'Building container image...',
          duration: 3500,
          progress: 65,
        },
        { message: 'Deploying to App Engine...', duration: 4000, progress: 85 },
        {
          message: 'Configuring traffic routing...',
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

    // Generate App Engine URL
    const projectId =
      options.environmentVariables.GCP_PROJECT_ID || 'project-id';
    const region = options.region || 'us-central1';
    return `https://${projectName}-dot-${projectId}.${region}.r.appspot.com`;
  }

  private isValidGCPRegion(region: string): boolean {
    const validRegions = [
      'us-central1',
      'us-east1',
      'us-east4',
      'us-west1',
      'us-west2',
      'us-west3',
      'us-west4',
      'europe-west1',
      'europe-west2',
      'europe-west3',
      'europe-west4',
      'europe-west6',
      'asia-east1',
      'asia-east2',
      'asia-northeast1',
      'asia-northeast2',
      'asia-northeast3',
      'asia-south1',
      'asia-southeast1',
      'asia-southeast2',
    ];
    return validRegions.includes(region);
  }
}
