import { NextResponse } from 'next/server';
import { DeploymentService } from '../../../../services/deploymentService';

const deploymentService = new DeploymentService();

/**
 * GET /api/deployment/platforms - Get available deployment platforms
 */
export async function GET() {
  try {
    const platforms = deploymentService.getAvailablePlatforms();

    // Return platform information with descriptions
    const platformInfo = platforms.map((platform) => ({
      id: platform,
      name: getPlatformDisplayName(platform),
      description: getPlatformDescription(platform),
      features: getPlatformFeatures(platform),
      regions: getPlatformRegions(platform),
    }));

    return NextResponse.json(platformInfo);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch deployment platforms',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    vercel: 'Vercel',
    netlify: 'Netlify',
    heroku: 'Heroku',
    aws: 'Amazon Web Services',
    gcp: 'Google Cloud Platform',
    azure: 'Microsoft Azure',
  };
  return names[platform] || platform;
}

function getPlatformDescription(platform: string): string {
  const descriptions: Record<string, string> = {
    vercel:
      'Serverless platform optimized for frontend frameworks and static sites',
    netlify: 'All-in-one platform for automating modern web projects',
    heroku:
      'Cloud platform that lets companies build, deliver, monitor and scale apps',
    aws: 'Comprehensive cloud computing platform with extensive services',
    gcp: "Google's suite of cloud computing services",
    azure:
      "Microsoft's cloud computing service for building, testing, deploying applications",
  };
  return descriptions[platform] || 'Cloud deployment platform';
}

function getPlatformFeatures(platform: string): string[] {
  const features: Record<string, string[]> = {
    vercel: [
      'Automatic HTTPS',
      'Global CDN',
      'Serverless Functions',
      'Preview Deployments',
      'Custom Domains',
    ],
    netlify: [
      'Continuous Deployment',
      'Form Handling',
      'Serverless Functions',
      'Split Testing',
      'Edge Functions',
    ],
    heroku: [
      'Easy Git Deployment',
      'Add-on Ecosystem',
      'Automatic Scaling',
      'Database Support',
      'Process Management',
    ],
    aws: [
      'ECS Fargate',
      'Application Load Balancer',
      'RDS Database',
      'CloudFormation',
      'Auto Scaling',
    ],
    gcp: [
      'App Engine',
      'Cloud Build',
      'Cloud SQL',
      'Load Balancing',
      'Auto Scaling',
    ],
    azure: [
      'App Service',
      'Container Registry',
      'SQL Database',
      'Application Gateway',
      'Auto Scaling',
    ],
  };
  return features[platform] || [];
}

function getPlatformRegions(platform: string): string[] {
  const regions: Record<string, string[]> = {
    vercel: ['iad1', 'dub1', 'fra1', 'gru1', 'hkg1', 'hnd1', 'icn1', 'sfo1'],
    netlify: ['Global CDN'],
    heroku: ['us', 'eu'],
    aws: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    gcp: ['us-central1', 'europe-west1', 'asia-east1'],
    azure: ['East US', 'West Europe', 'Southeast Asia'],
  };
  return regions[platform] || [];
}
