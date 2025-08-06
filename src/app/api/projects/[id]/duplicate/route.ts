import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '../../../../../services/projectService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const newName = body.name;

    const projectService = ProjectService.getInstance();
    const duplicatedProject = await projectService.duplicateProject(
      params.id,
      newName
    );

    if (!duplicatedProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or could not be duplicated',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: duplicatedProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to duplicate project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to duplicate project',
      },
      { status: 500 }
    );
  }
}
