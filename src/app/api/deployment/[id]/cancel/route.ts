import { NextRequest, NextResponse } from 'next/server';
import { DeploymentService } from '../../../../../services/deploymentService';

const deploymentService = new DeploymentService();

/**
 * POST /api/deployment/[id]/cancel - Cancel a deployment
 */
export async function POST(
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

    await deploymentService.cancelDeployment(id);
    return NextResponse.json({ message: 'Deployment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling deployment:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to cancel deployment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
