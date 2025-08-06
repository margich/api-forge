import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '../../../services/projectService';
import { CreateProjectInput } from '../../../types';

export async function GET() {
  try {
    const projectService = ProjectService.getInstance();
    const projects = await projectService.listProjects();

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Failed to list projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list projects',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const input: CreateProjectInput = {
      name: body.name,
      description: body.description,
      originalPrompt: body.originalPrompt,
    };

    if (!input.name || input.name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    const projectService = ProjectService.getInstance();
    const project = await projectService.createProject(input);

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
