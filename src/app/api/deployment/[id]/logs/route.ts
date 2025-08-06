import { NextRequest, NextResponse } from 'next/server';
import { DeploymentService } from '../../../../../services/deploymentService';

const deploymentService = new DeploymentService();

/**
 * GET /api/deployment/[id]/logs - Get deployment logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    const logs = await deploymentService.getDeploymentLogs(id);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching deployment logs:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch deployment logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
