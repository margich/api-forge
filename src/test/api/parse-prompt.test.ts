import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/parse-prompt/route';

// Mock the prompt parser service
vi.mock('../../services/promptParserService', () => ({
  promptParserService: {
    parsePrompt: vi.fn(),
    validateModels: vi.fn(),
    suggestImprovements: vi.fn(),
  },
}));

const { promptParserService } = await import(
  '../../services/promptParserService'
);
const mockPromptParserService = vi.mocked(promptParserService);

describe('/api/parse-prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse a valid prompt successfully', async () => {
    // Mock service responses
    const mockParseResult = {
      models: [
        {
          id: '1',
          name: 'User',
          fields: [
            {
              id: '1',
              name: 'id',
              type: 'uuid' as const,
              required: true,
              unique: true,
              validation: [],
            },
            {
              id: '2',
              name: 'name',
              type: 'string' as const,
              required: true,
              unique: false,
              validation: [],
            },
          ],
          relationships: [],
          metadata: { timestamps: true, softDelete: false },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      confidence: 0.9,
      suggestions: [],
      ambiguities: [],
    };

    const mockValidation = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const mockImprovements = [
      {
        type: 'field' as const,
        message: 'Consider adding an email field',
        severity: 'info' as const,
        modelId: '1',
      },
    ];

    mockPromptParserService.parsePrompt.mockResolvedValue(mockParseResult);
    mockPromptParserService.validateModels.mockReturnValue(mockValidation);
    mockPromptParserService.suggestImprovements.mockReturnValue(
      mockImprovements
    );

    // Create request
    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Users have name and email' }),
      headers: { 'Content-Type': 'application/json' },
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.models).toHaveLength(1);
    expect(data.data.models[0].name).toBe('User');
    expect(data.data.confidence).toBe(0.9);
    expect(data.data.validation.isValid).toBe(true);
    expect(data.data.improvements).toHaveLength(1);

    // Verify service calls
    expect(mockPromptParserService.parsePrompt).toHaveBeenCalledWith(
      'Users have name and email'
    );
    expect(mockPromptParserService.validateModels).toHaveBeenCalledWith(
      mockParseResult.models
    );
    expect(mockPromptParserService.suggestImprovements).toHaveBeenCalledWith(
      mockParseResult.models
    );
  });

  it('should return 400 for empty prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
    expect(data.details).toBeDefined();
  });

  it('should return 400 for missing prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 for prompt that is too long', async () => {
    const longPrompt = 'a'.repeat(5001);
    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt: longPrompt }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should handle service errors gracefully', async () => {
    mockPromptParserService.parsePrompt.mockRejectedValue(
      new Error('Service error')
    );

    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Users have name' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.message).toBe('Service error');
  });

  it('should handle invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/parse-prompt', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
