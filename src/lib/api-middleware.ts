import { ApiError } from 'next/dist/server/api-utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface ApiError extends Error {
  statusCode: number;
  code: string;
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundApiError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`
    );
    this.name = 'NotFoundApiError';
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500;
  code = 'DATABASE_ERROR';

  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (
    error instanceof ValidationError ||
    error instanceof NotFoundApiError ||
    error instanceof ConflictError ||
    error instanceof DatabaseError
  ) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(error instanceof ValidationError &&
          error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message:
        error instanceof Error ? error.message : 'Unknown error occurred',
    },
    { status: 500 }
  );
}

// Request validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  };
}

// Query parameter validation middleware
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest): T => {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      return schema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', error.errors);
      }
      throw error;
    }
  };
}

// Path parameter validation middleware
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (params: any): T => {
    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid path parameters', error.errors);
      }
      throw error;
    }
  };
}

// Success response formatter
export function formatSuccessResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  );
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Options handler for CORS
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Async error handler wrapper
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
}

// Rate limiting (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (request: NextRequest): void => {
    const clientIp =
      request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    const clientData = requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientIp, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (clientData.count >= maxRequests) {
      throw new ApiError('Rate limit exceeded');
    }

    clientData.count++;
  };
}
