import { NextRequest, NextResponse } from 'next/server';
import { DeploymentService } from '../../../services/deploymentService';
import { GeneratedProject } from '../../../types';

const deploymentService = new DeploymentService();

/**
 * POST /api/deployment - Deploy a project to a cloud platform
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, options } = body;

    // Validate required fields
    if (!project || !options) {
      return NextResponse.json(
        { error: 'Project and deployment options are required' },
        { status: 400 }
      );
    }

    if (!options.platform) {
      return NextResponse.json(
        { error: 'Deployment platform is required' },
        { status: 400 }
      );
    }

    // Deploy the project
    const deployment = await deploymentService.deployProject(
      project as GeneratedProject,
      options
    );

    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to deploy project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deployment - List all deployments
 */
export async function GET() {
  try {
    const deployments = await deploymentService.listDeployments();
    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch deployments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
