import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldType, GenerationOptions, Model } from '../../types';
import { ProjectExport } from '../ProjectExport';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and appendChild/removeChild
const mockAnchorElement = {
  href: '',
  download: '',
  click: vi.fn(),
};

const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockAnchorElement as any;
  }
  return originalCreateElement.call(document, tagName);
});

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('ProjectExport', () => {
  let sampleModels: Model[];
  let sampleGenerationOptions: GenerationOptions;
  let mockOnExportStart: ReturnType<typeof vi.fn>;
  let mockOnExportComplete: ReturnType<typeof vi.fn>;
  let mockOnExportError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

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
      {
        id: uuidv4(),
        name: 'Post',
        fields: [
          {
            id: uuidv4(),
            name: 'title',
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

    mockOnExportStart = vi.fn();
    mockOnExportComplete = vi.fn();
    mockOnExportError = vi.fn();
  });

  it('should render project export component', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    expect(screen.getByText('Export Project')).toBeInTheDocument();
    expect(screen.getByText('Project Summary')).toBeInTheDocument();
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('Project Template')).toBeInTheDocument();
  });

  it('should display project summary correctly', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Models count
    expect(screen.getByText('express')).toBeInTheDocument();
    expect(screen.getByText('postgresql')).toBeInTheDocument();
    expect(screen.getByText('jwt')).toBeInTheDocument();
  });

  it('should display models to export', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    expect(screen.getByText('Models to Export')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('2 fields')).toBeInTheDocument();
    expect(screen.getByText('1 fields')).toBeInTheDocument();
  });

  it('should allow changing export format', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    const zipRadio = screen.getByLabelText('ZIP Archive');
    const tarRadio = screen.getByLabelText('TAR.GZ Archive');

    expect(zipRadio).toBeChecked();
    expect(tarRadio).not.toBeChecked();

    fireEvent.click(tarRadio);

    expect(zipRadio).not.toBeChecked();
    expect(tarRadio).toBeChecked();
  });

  it('should allow changing project template', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    const templateSelect = screen.getByDisplayValue('Basic');

    fireEvent.change(templateSelect, { target: { value: 'advanced' } });

    expect(templateSelect).toHaveValue('advanced');
    expect(
      screen.getByText(
        'Includes CI/CD workflows, linting, and formatting configuration'
      )
    ).toBeInTheDocument();
  });

  it('should show/hide advanced options', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    // Advanced options should be hidden initially
    expect(screen.queryByText('Advanced Options')).not.toBeInTheDocument();

    // Click to show advanced options
    fireEvent.click(screen.getByText('Show Advanced Options'));

    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    expect(screen.getByText('Include Test Files')).toBeInTheDocument();
    expect(screen.getByText('Include API Documentation')).toBeInTheDocument();

    // Click to hide advanced options
    fireEvent.click(screen.getByText('Hide Advanced Options'));

    expect(screen.queryByText('Advanced Options')).not.toBeInTheDocument();
  });

  it('should handle successful export', async () => {
    const mockBlob = new Blob(['mock file content'], {
      type: 'application/zip',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'Content-Disposition') {
            return 'attachment; filename="test-project.zip"';
          }
          return null;
        },
      },
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
        onExportStart={mockOnExportStart}
        onExportComplete={mockOnExportComplete}
        onExportError={mockOnExportError}
      />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    fireEvent.click(exportButton);

    expect(mockOnExportStart).toHaveBeenCalled();
    expect(screen.getByText('Exporting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models: sampleModels,
          generationOptions: sampleGenerationOptions,
          exportOptions: {
            format: 'zip',
            includeTests: true,
            includeDocumentation: true,
            template: 'basic',
          },
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnExportComplete).toHaveBeenCalled();
    });

    expect(mockAnchorElement.download).toBe('test-project.zip');
    expect(mockAnchorElement.click).toHaveBeenCalled();
  });

  it('should handle export error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Export failed' }),
    });

    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
        onExportStart={mockOnExportStart}
        onExportComplete={mockOnExportComplete}
        onExportError={mockOnExportError}
      />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExportError).toHaveBeenCalledWith('Export failed');
    });
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
        onExportStart={mockOnExportStart}
        onExportComplete={mockOnExportComplete}
        onExportError={mockOnExportError}
      />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExportError).toHaveBeenCalledWith('Network error');
    });
  });

  it('should disable export button when no models', () => {
    render(
      <ProjectExport models={[]} generationOptions={sampleGenerationOptions} />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    expect(exportButton).toBeDisabled();
  });

  it('should handle error when no models available', () => {
    render(
      <ProjectExport
        models={[]}
        generationOptions={sampleGenerationOptions}
        onExportError={mockOnExportError}
      />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    fireEvent.click(exportButton);

    expect(mockOnExportError).toHaveBeenCalledWith(
      'No models available for export'
    );
  });

  it('should update export button text based on format', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    expect(screen.getByText('Export Project (ZIP)')).toBeInTheDocument();

    const tarRadio = screen.getByLabelText('TAR.GZ Archive');
    fireEvent.click(tarRadio);

    expect(screen.getByText('Export Project (TAR)')).toBeInTheDocument();
  });

  it('should toggle advanced options correctly', () => {
    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    // Show advanced options
    fireEvent.click(screen.getByText('Show Advanced Options'));

    const includeTestsCheckbox = screen.getByLabelText('Include Test Files');
    const includeDocsCheckbox = screen.getByLabelText(
      'Include API Documentation'
    );

    expect(includeTestsCheckbox).toBeChecked();
    expect(includeDocsCheckbox).toBeChecked();

    // Toggle checkboxes
    fireEvent.click(includeTestsCheckbox);
    fireEvent.click(includeDocsCheckbox);

    expect(includeTestsCheckbox).not.toBeChecked();
    expect(includeDocsCheckbox).not.toBeChecked();
  });

  it('should use default filename when Content-Disposition header is missing', async () => {
    const mockBlob = new Blob(['mock file content'], {
      type: 'application/zip',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => null, // No Content-Disposition header
      },
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
        onExportComplete={mockOnExportComplete}
      />
    );

    const exportButton = screen.getByText('Export Project (ZIP)');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExportComplete).toHaveBeenCalled();
    });

    expect(mockAnchorElement.download).toMatch(/generated-api-\d+\.zip/);
  });

  it('should send correct export options based on user selections', async () => {
    const mockBlob = new Blob(['mock file content'], {
      type: 'application/zip',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: () => 'attachment; filename="test.zip"',
      },
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <ProjectExport
        models={sampleModels}
        generationOptions={sampleGenerationOptions}
      />
    );

    // Change format to TAR
    fireEvent.click(screen.getByLabelText('TAR.GZ Archive'));

    // Change template to advanced
    const templateSelect = screen.getByDisplayValue('Basic');
    fireEvent.change(templateSelect, { target: { value: 'advanced' } });

    // Show advanced options and toggle settings
    fireEvent.click(screen.getByText('Show Advanced Options'));
    fireEvent.click(screen.getByLabelText('Include Test Files'));

    const exportButton = screen.getByText('Export Project (TAR)');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models: sampleModels,
          generationOptions: sampleGenerationOptions,
          exportOptions: {
            format: 'tar',
            includeTests: false,
            includeDocumentation: true,
            template: 'advanced',
          },
        }),
      });
    });
  });
});
