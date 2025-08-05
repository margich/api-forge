import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promptParserService } from '../../../services/promptParserService';

// Request schema validation
const ParsePromptRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(5000, 'Prompt too long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = ParsePromptRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { prompt } = validationResult.data;

    // Parse the prompt using the service
    const result = await promptParserService.parsePrompt(prompt);

    // Validate the extracted models
    const validation = promptParserService.validateModels(result.models);

    // Get improvement suggestions
    const improvements = promptParserService.suggestImprovements(result.models);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        validation,
        improvements,
      },
    });
  } catch (error) {
    console.error('Error in parse-prompt API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
