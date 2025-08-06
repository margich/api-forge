'use client';

import React, { useState } from 'react';
import { GenerationOptions, Model } from '../types';

export interface ExportOptions {
  format: 'zip' | 'tar';
  includeTests: boolean;
  includeDocumentation: boolean;
  template: 'basic' | 'advanced' | 'enterprise';
}

interface ProjectExportProps {
  models: Model[];
  generationOptions: GenerationOptions;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

export const ProjectExport: React.FC<ProjectExportProps> = ({
  models,
  generationOptions,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'zip',
    includeTests: true,
    includeDocumentation: true,
    template: 'basic',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleExport = async () => {
    if (!models || models.length === 0) {
      onExportError?.('No models available for export');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      const response = await fetch('/api/projects/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models,
          generationOptions,
          exportOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `generated-api-${Date.now()}.${exportOptions.format === 'tar' ? 'tar.gz' : 'zip'}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExportComplete?.();
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const templateDescriptions = {
    basic: 'Essential files with Docker support and basic configuration',
    advanced: 'Includes CI/CD workflows, linting, and formatting configuration',
    enterprise:
      'Full enterprise setup with Kubernetes, Helm charts, and monitoring',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Export Project</h2>
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      <div className="space-y-6">
        {/* Project Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Project Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Models:</span>
              <span className="ml-2 text-gray-600">{models.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Framework:</span>
              <span className="ml-2 text-gray-600">
                {generationOptions.framework}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className="ml-2 text-gray-600">
                {generationOptions.database}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Authentication:</span>
              <span className="ml-2 text-gray-600">
                {generationOptions.authentication}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="zip"
                  checked={exportOptions.format === 'zip'}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      format: e.target.value as 'zip',
                    }))
                  }
                  className="mr-2"
                />
                ZIP Archive
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="tar"
                  checked={exportOptions.format === 'tar'}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      format: e.target.value as 'tar',
                    }))
                  }
                  className="mr-2"
                />
                TAR.GZ Archive
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Template
            </label>
            <select
              value={exportOptions.template}
              onChange={(e) =>
                setExportOptions((prev) => ({
                  ...prev,
                  template: e.target.value as
                    | 'basic'
                    | 'advanced'
                    | 'enterprise',
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <p className="mt-1 text-sm text-gray-600">
              {templateDescriptions[exportOptions.template]}
            </p>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTests}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeTests: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Include Test Files
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeDocumentation}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeDocumentation: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Include API Documentation
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={isExporting || models.length === 0}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              isExporting || models.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isExporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              `Export Project (${exportOptions.format.toUpperCase()})`
            )}
          </button>
        </div>

        {/* Model List */}
        {models.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Models to Export
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {models.map((model) => (
                <div key={model.id} className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">{model.name}</h4>
                  <p className="text-sm text-gray-600">
                    {model.fields.length} fields
                    {model.relationships.length > 0 &&
                      `, ${model.relationships.length} relationships`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
