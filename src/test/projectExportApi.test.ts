import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { GET, POST } from '../app/api/projects/export/route';
import { FieldType, GenerationOptions, Model } from '../types';

describe('Project Export API', () => {
  let sampleModels: Model[];
  let sampleGenerationOptions: GenerationOptions;

  beforeEach(() => {
    // Create sample models for testing
    sampleModels = [
      {
        id: uuidv4(),
        name: 'User',
        fields: [
          {
            id: uuidv4(),
            name: 'email',
            type: 'email' as FieldType,
            required: true,
            unique: true,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'name',
            type: 'string' as FieldType,
            required: true,
            unique: false,
            validation: [],
          },
        ],
        relationships: [],
        metadata: {
          timestamps: true,
          softDelete: false,
          requiresAuth: true,
          allowedRoles: ['admin', 'user'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleGenerationOptions = {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
    };
  });

  describe('POST /api/projects/export', () => {
    it('should export a project with valid input', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment'
      );
      expect(response.headers.get('Content-Disposition')).toContain('.zip');

      // Verify the response body is a buffer
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Verify ZIP file signature
      const uint8Array = new Uint8Array(buffer);
      const signature = Array.from(uint8Array.slice(0, 4))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(signature).toBe('504b0304'); // ZIP file signature
    });

    it('should export a tar.gz project when format is tar', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'tar',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/gzip');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment'
      );
      expect(response.headers.get('Content-Disposition')).toContain('.tar.gz');

      // Verify the response body is a buffer
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);

      // Verify GZIP file signature
      const uint8Array = new Uint8Array(buffer);
      const signature = Array.from(uint8Array.slice(0, 2))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(signature).toBe('1f8b'); // GZIP file signature
    });

    it('should return 400 when models are missing', async () => {
      const requestBody = {
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('model');
    });

    it('should return 400 when models array is empty', async () => {
      const requestBody = {
        models: [],
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('model');
    });

    it('should return 400 when generation options are missing', async () => {
      const requestBody = {
        models: sampleModels,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid generation options');
    });

    it('should return 400 when model validation fails', async () => {
      const invalidModels = [
        {
          id: 'invalid-uuid',
          name: '',
          fields: [],
          relationships: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const requestBody = {
        models: invalidModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid model data');
    });

    it('should return 400 when generation options validation fails', async () => {
      const invalidGenerationOptions = {
        framework: 'invalid-framework',
        database: 'invalid-database',
        authentication: 'invalid-auth',
        language: 'invalid-language',
        includeTests: 'not-boolean',
        includeDocumentation: 'not-boolean',
      };

      const requestBody = {
        models: sampleModels,
        generationOptions: invalidGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid generation options');
    });

    it('should use default export options when not provided', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        // exportOptions not provided
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/zip'); // Default format
      expect(response.headers.get('Content-Disposition')).toContain('.zip');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to export project');
    });

    it('should include cache control headers', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe(
        'no-cache, no-store, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });

  describe('GET /api/projects/export', () => {
    it('should return export options and supported formats', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'GET',
        }
      );

      const response = await GET();

      expect(response.status).toBe(200);
      const responseData = await response.json();

      expect(responseData.supportedFormats).toEqual(['zip', 'tar']);
      expect(responseData.supportedTemplates).toEqual([
        'basic',
        'advanced',
        'enterprise',
      ]);
      expect(responseData.defaultOptions).toBeDefined();
      expect(responseData.defaultOptions.format).toBe('zip');
      expect(responseData.defaultOptions.includeTests).toBe(true);
      expect(responseData.defaultOptions.includeDocumentation).toBe(true);
      expect(responseData.defaultOptions.template).toBe('basic');
      expect(responseData.templateDescriptions).toBeDefined();
      expect(responseData.templateDescriptions.basic).toBeDefined();
      expect(responseData.templateDescriptions.advanced).toBeDefined();
      expect(responseData.templateDescriptions.enterprise).toBeDefined();
    });
  });

  describe('export with different templates', () => {
    it('should export with basic template', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should export with advanced template', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'advanced',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should export with enterprise template', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: true,
          template: 'enterprise',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('export with different options', () => {
    it('should export without tests when includeTests is false', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: false,
          includeDocumentation: true,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('should export without documentation when includeDocumentation is false', async () => {
      const requestBody = {
        models: sampleModels,
        generationOptions: sampleGenerationOptions,
        exportOptions: {
          format: 'zip',
          includeTests: true,
          includeDocumentation: false,
          template: 'basic',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/projects/export',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });
});
