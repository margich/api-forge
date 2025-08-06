import { GeneratedProject } from '../../types';
import {
  DeploymentLog,
  DeploymentOptions,
  DeploymentStatus,
  ValidationResult,
} from '../deploymentService';
import { BaseCloudAdapter } from './baseAdapter';

export class AWSAdapter extends BaseCloudAdapter {
  private deployments: Map<string, DeploymentStatus> = new Map();

  constructor() {
    super('aws');
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
      this.addLog(status, 'info', 'AWS deployment cancelled by user');
    }
  }

  async delete(deploymentId: string): Promise<void> {
    const status = this.deployments.get(deploymentId);
    if (!status) {
      throw new Error(`Deployment not found: ${deploymentId}`);
    }

    this.addLog(status, 'info', 'AWS resources deleted');
    this.deployments.delete(deploymentId);
  }

  async validateConfig(options: DeploymentOptions): Promise<ValidationResult> {
    const baseValidation = this.validateCommonOptions(options);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    // AWS-specific validations
    if (!options.environmentVariables.AWS_ACCESS_KEY_ID) {
      errors.push('AWS_ACCESS_KEY_ID is required for AWS deployment');
    }

    if (!options.environmentVariables.AWS_SECRET_ACCESS_KEY) {
      errors.push('AWS_SECRET_ACCESS_KEY is required for AWS deployment');
    }

    if (options.region && !this.isValidAWSRegion(options.region)) {
      errors.push(`Invalid AWS region: ${options.region}`);
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

    // Generate CloudFormation template
    files['cloudformation.yaml'] = this.generateCloudFormationTemplate(
      project,
      options
    );

    // Generate Dockerfile for ECS
    files['Dockerfile'] = this.generateDockerfile(project);

    // Generate buildspec.yml for CodeBuild
    files['buildspec.yml'] = this.generateBuildSpec(project);

    return files;
  }

  private generateCloudFormationTemplate(
    project: GeneratedProject,
    options: DeploymentOptions
  ): string {
    const template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: `CloudFormation template for ${project.name}`,
      Parameters: {
        Environment: {
          Type: 'String',
          Default: options.environment,
          AllowedValues: ['development', 'staging', 'production'],
        },
      },
      Resources: {
        ECSCluster: {
          Type: 'AWS::ECS::Cluster',
          Properties: {
            ClusterName: `${project.name}-cluster`,
          },
        },
        TaskDefinition: {
          Type: 'AWS::ECS::TaskDefinition',
          Properties: {
            Family: project.name,
            Cpu: '256',
            Memory: '512',
            NetworkMode: 'awsvpc',
            RequiresCompatibilities: ['FARGATE'],
            ExecutionRoleArn: { Ref: 'ExecutionRole' },
            ContainerDefinitions: [
              {
                Name: project.name,
                Image: `${project.name}:latest`,
                PortMappings: [
                  {
                    ContainerPort: 3000,
                    Protocol: 'tcp',
                  },
                ],
                Environment: Object.entries(options.environmentVariables).map(
                  ([name, value]) => ({
                    Name: name,
                    Value: value,
                  })
                ),
              },
            ],
          },
        },
        ExecutionRole: {
          Type: 'AWS::IAM::Role',
          Properties: {
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'ecs-tasks.amazonaws.com',
                  },
                  Action: 'sts:AssumeRole',
                },
              ],
            },
            ManagedPolicyArns: [
              'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            ],
          },
        },
      },
    };

    return JSON.stringify(template, null, 2);
  }

  private generateDockerfile(project: GeneratedProject): string {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
`;
  }

  private generateBuildSpec(project: GeneratedProject): string {
    const buildSpec = {
      version: '0.2',
      phases: {
        pre_build: {
          commands: [
            'echo Logging in to Amazon ECR...',
            'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
          ],
        },
        build: {
          commands: [
            'echo Build started on `date`',
            'echo Building the Docker image...',
            `docker build -t ${project.name} .`,
            `docker tag ${project.name}:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/${project.name}:latest`,
          ],
        },
        post_build: {
          commands: [
            'echo Build completed on `date`',
            'echo Pushing the Docker image...',
            `docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/${project.name}:latest`,
          ],
        },
      },
    };

    return JSON.stringify(buildSpec, null, 2);
  }

  private async deployAsync(
    project: GeneratedProject,
    options: DeploymentOptions,
    status: DeploymentStatus
  ): Promise<void> {
    try {
      status.status = 'deploying';
      this.updateProgress(status, 10, 'Initializing AWS deployment...');

      // Generate deployment files
      const deploymentFiles = this.generateDeploymentFiles(project, options);
      this.addLog(
        status,
        'info',
        `Generated ${Object.keys(deploymentFiles).length} AWS configuration files`
      );

      // Simulate deployment steps
      await this.simulateDeployment(status, [
        {
          message: 'Creating CloudFormation stack...',
          duration: 3000,
          progress: 25,
        },
        { message: 'Building Docker image...', duration: 4000, progress: 45 },
        {
          message: 'Pushing to ECR repository...',
          duration: 3500,
          progress: 65,
        },
        {
          message: 'Deploying to ECS Fargate...',
          duration: 4000,
          progress: 85,
        },
        {
          message: 'Configuring load balancer...',
          duration: 2000,
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

    // Generate AWS ALB URL
    const region = options.region || 'us-east-1';
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `https://${projectName}-${randomSuffix}.${region}.elb.amazonaws.com`;
  }

  private isValidAWSRegion(region: string): boolean {
    const validRegions = [
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'eu-west-1',
      'eu-west-2',
      'eu-west-3',
      'eu-central-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
      'ap-northeast-2',
    ];
    return validRegions.includes(region);
  }
}
