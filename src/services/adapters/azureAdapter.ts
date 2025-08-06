import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class AzureAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('azure');
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
      this.addLog(status, 'info', 'Azure deployment cancelled by user');
    }
  }

  async delete(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    this.addLog(status, 'info', 'Azure resources deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // Azure-specific validations
    if (!options.environmentVariables.AZURE_CLIENT_ID) {
      errors.push('AZURE_CLIENT_ID is required for Azure deployment');
    }

    if (!options.environmentVariables.AZURE_CLIENT_SECRET) {
      errors.push('AZURE_CLIENT_SECRET is required for Azure deployment');
    }

    if (!options.environmentVariables.AZURE_TENANT_ID) {
      errors.push('AZURE_TENANT_ID is required for Azure deployment');
    }

    if (options.region && !this.isValidAzureRegion(options.region)) {
      errors.push(`Invalid Azure region: ${options.region}`);
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

    // Generate ARM template
    files['azuredeploy.json'] = this.generateARMTemplate(project, options);

    // Generate parameters file
    files['azuredeploy.parameters.json'] = this.generateParametersFile(
      project,
      options
    );

    // Generate Dockerfile
    files['Dockerfile'] = this.generateDockerfile(project);

    // Generate Azure DevOps pipeline
    files['azure-pipelines.yml'] = this.generateAzurePipeline(project);

    return files;
  }

  private generateARMTemplate(
    project: GeneratedProject,
    options: DeploymentOptions
  ): string {
    const template = {
      $schema:
        'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
      contentVersion: '1.0.0.0',
      parameters: {
        appName: {
          type: 'string',
          defaultValue: project.name,
          metadata: {
            description: 'Name of the web app',
          },
        },
        location: {
          type: 'string',
          defaultValue: '[resourceGroup().location]',
          metadata: {
            description: 'Location for all resources',
          },
        },
        sku: {
          type: 'string',
          defaultValue: 'B1',
          allowedValues: ['F1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3'],
          metadata: {
            description: 'The SKU of App Service Plan',
          },
        },
      },
      variables: {
        appServicePlanName: `[concat(parameters('appName'), '-plan')]`,
        webAppName: `[parameters('appName')]`,
      },
      resources: [
        {
          type: 'Microsoft.Web/serverfarms',
          apiVersion: '2020-06-01',
          name: "[variables('appServicePlanName')]",
          location: "[parameters('location')]",
          sku: {
            name: "[parameters('sku')]",
          },
          kind: 'linux',
          properties: {
            reserved: true,
          },
        },
        {
          type: 'Microsoft.Web/sites',
          apiVersion: '2020-06-01',
          name: "[variables('webAppName')]",
          location: "[parameters('location')]",
          dependsOn: [
            "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
          ],
          kind: 'app,linux,container',
          properties: {
            serverFarmId:
              "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
            siteConfig: {
              linuxFxVersion: `DOCKER|${project.name}:latest`,
              appSettings: Object.entries(options.environmentVariables).map(
                ([name, value]) => ({
                  name,
                  value,
                })
              ),
            },
          },
        },
      ],
      outputs: {
        webAppUrl: {
          type: 'string',
          value:
            "[concat('https://', reference(variables('webAppName')).defaultHostName)]",
        },
      },
    };

    return JSON.stringify(template, null, 2);
  }

  private generateParametersFile(
    project: GeneratedProject,
    options: DeploymentOptions
  ): string {
    const parameters = {
      $schema:
        'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
      contentVersion: '1.0.0.0',
      parameters: {
        appName: {
          value: project.name,
        },
        location: {
          value: options.region || 'East US',
        },
        sku: {
          value: options.environment === 'production' ? 'B2' : 'B1',
        },
      },
    };

    return JSON.stringify(parameters, null, 2);
  }

  private generateDockerfile(project: GeneratedProject): string {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 80

CMD ["npm", "start"]
`;
  }

  private generateAzurePipeline(project: GeneratedProject): string {
    return `trigger:
- main

variables:
  dockerRegistryServiceConnection: 'azure-container-registry'
  imageRepository: '${project.name}'
  containerRegistry: 'myregistry.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: Docker@2
      displayName: Build and push an image to container registry
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  jobs:
  - deployment: Deploy
    displayName: Deploy
    environment: '${project.name}-${options.environment}'
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            displayName: 'Azure Web App on Container Deploy'
            inputs:
              azureSubscription: 'azure-service-connection'
              appName: '${project.name}'
              containers: $(containerRegistry)/$(imageRepository):$(tag)
`;
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Initializing Azure deployment...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} Azure configuration files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        { message: 'Creating resource group...', duration: 2000, progress: 20 },
        { message: 'Deploying ARM template...', duration: 4000, progress: 40 },
        {
          message: 'Building container image...',
          duration: 3500,
          progress: 60,
        },
        {
          message: 'Pushing to Azure Container Registry...',
          duration: 3000,
          progress: 75,
        },
        {
          message: 'Deploying to App Service...',
          duration: 3000,
          progress: 90,
        },
        {
          message: 'Configuring custom domain...',
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

    // Generate Azure App Service URL
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `https://${sanitizedName}.azurewebsites.net`;
  }

  private isValidAzureRegion(region: string): boolean {
    const validRegions = [
      'East US',
      'East US 2',
      'West US',
      'West US 2',
      'West US 3',
      'Central US',
      'North Central US',
      'South Central US',
      'West Central US',
      'Canada Central',
      'Canada East',
      'Brazil South',
      'North Europe',
      'West Europe',
      'France Central',
      'Germany West Central',
      'UK South',
      'UK West',
      'Switzerland North',
      'East Asia',
      'Southeast Asia',
      'Australia East',
      'Australia Southeast',
      'Central India',
      'South India',
      'West India',
      'Japan East',
      'Japan West',
      'Korea Central',
      'Korea South',
    ];
    return validRegions.includes(region);
  }
}
