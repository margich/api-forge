import { NextRequest, NextResponse } from 'next/server';
import { DeploymentService } from '../../../../services/deploymentService';

const deploymentService = new DeploymentService();

/**
 * GET /api/deployment/[id] - Get deployment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    const deployment = await deploymentService.getDeploymentStatus(id);
    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment status:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch deployment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deployment/[id] - Delete a deployment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    await deploymentService.deleteDeployment(id);
    return NextResponse.json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    console.error('Error deleting deployment:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to delete deployment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
