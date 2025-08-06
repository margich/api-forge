'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProjectExport } from '../../components/ProjectExport';
import { FieldType, GenerationOptions, Model } from '../../types';

export default function ProjectExportDemo() {
  const [exportStatus, setExportStatus] = useState<string>('');

  // Sample models for demonstration
  const sampleModels: Model[] = [
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
        {
          id: uuidv4(),
          name: 'age',
          type: 'number' as FieldType,
          required: false,
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
        {
          id: uuidv4(),
          name: 'content',
          type: 'text' as FieldType,
          required: true,
          unique: false,
          validation: [],
        },
        {
          id: uuidv4(),
          name: 'published',
          type: 'boolean' as FieldType,
          required: false,
          unique: false,
          defaultValue: false,
          validation: [],
        },
      ],
      relationships: [
        {
          id: uuidv4(),
          type: 'oneToMany',
          sourceModel: 'User',
          targetModel: 'Post',
          sourceField: 'id',
          targetField: 'userId',
          cascadeDelete: true,
        },
      ],
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

  const sampleGenerationOptions: GenerationOptions = {
    framework: 'express',
    database: 'postgresql',
    authentication: 'jwt',
    language: 'typescript',
    includeTests: true,
    includeDocumentation: true,
  };

  const handleExportStart = () => {
    setExportStatus('Starting export...');
  };

  const handleExportComplete = () => {
    setExportStatus('Export completed successfully!');
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handleExportError = (error: string) => {
    setExportStatus(`Export failed: ${error}`);
    setTimeout(() => setExportStatus(''), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Project Export Demo
          </h1>
          <p className="text-gray-600">
            This demo shows the project export functionality. You can export a
            complete API project with the sample models shown below.
          </p>
        </div>

        {exportStatus && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              exportStatus.includes('failed')
                ? 'bg-red-100 text-red-800 border border-red-200'
                : exportStatus.includes('completed')
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            {exportStatus}
          </div>
        )}

        <ProjectExport
          models={sampleModels}
          generationOptions={sampleGenerationOptions}
          onExportStart={handleExportStart}
          onExportComplete={handleExportComplete}
          onExportError={handleExportError}
        />

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What's Included in the Export
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Core Files</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete Express.js application</li>
                <li>• TypeScript configuration</li>
                <li>• Package.json with dependencies</li>
                <li>• Environment configuration</li>
                <li>• Database schemas and migrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Generated Code
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CRUD controllers for each model</li>
                <li>• Service layer with business logic</li>
                <li>• Repository pattern for data access</li>
                <li>• JWT authentication system</li>
                <li>• Input validation schemas</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Documentation
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• OpenAPI 3.0 specification</li>
                <li>• Interactive Swagger UI</li>
                <li>• Setup instructions</li>
                <li>• API endpoint documentation</li>
                <li>• Project structure guide</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                DevOps (Advanced/Enterprise)
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Docker configuration</li>
                <li>• GitHub Actions CI/CD</li>
                <li>• Kubernetes deployment files</li>
                <li>• Monitoring configuration</li>
                <li>• ESLint and Prettier setup</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
