import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '../../../../services/projectService';
import { UpdateProjectInput } from '../../../../types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectService = ProjectService.getInstance();
    const project = await projectService.getProject(id);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Failed to get project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get project',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: UpdateProjectInput = {
      name: body.name,
      description: body.description,
      status: body.status,
      models: body.models,
      generationOptions: body.generationOptions,
      authConfig: body.authConfig,
    };

    const projectService = ProjectService.getInstance();
    const updatedProject = await projectService.updateProject(id, updates);

    if (!updatedProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update project',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectService = ProjectService.getInstance();
    const success = await projectService.deleteProject(id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or could not be deleted',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete project',
      },
      { status: 500 }
    );
  }
}
