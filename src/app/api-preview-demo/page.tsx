'use client';

import { useState } from 'react';
import { APIPreview } from '../../components';
import { AuthConfig, Endpoint, Model } from '../../types';

// Sample data for demonstration
const sampleModels: Model[] = [
  {
    id: '1',
    name: 'User',
    fields: [
      {
        id: 'field-1',
        name: 'name',
        type: 'string',
        required: true,
        unique: false,
        validation: [
          {
            type: 'minLength',
            value: 2,
            message: 'Name must be at least 2 characters',
          },
          {
            type: 'maxLength',
            value: 50,
            message: 'Name must be less than 50 characters',
          },
        ],
        description: 'User full name',
      },
      {
        id: 'field-2',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        validation: [],
        description: 'User email address',
      },
      {
        id: 'field-3',
        name: 'age',
        type: 'integer',
        required: false,
        unique: false,
        validation: [
          { type: 'min', value: 18, message: 'Must be at least 18 years old' },
          {
            type: 'max',
            value: 120,
            message: 'Must be less than 120 years old',
          },
        ],
        description: 'User age in years',
      },
      {
        id: 'field-4',
        name: 'isActive',
        type: 'boolean',
        required: false,
        unique: false,
        validation: [],
        defaultValue: true,
        description: 'Whether the user account is active',
      },
    ],
    relationships: [
      {
        id: 'rel-1',
        type: 'oneToMany',
        sourceModel: 'User',
        targetModel: 'Post',
        sourceField: 'id',
        targetField: 'authorId',
        cascadeDelete: false,
      },
    ],
    metadata: {
      timestamps: true,
      softDelete: false,
      requiresAuth: true,
      allowedRoles: ['admin', 'user'],
      description: 'System users with authentication',
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    name: 'Post',
    fields: [
      {
        id: 'field-5',
        name: 'title',
        type: 'string',
        required: true,
        unique: false,
        validation: [
          {
            type: 'minLength',
            value: 5,
            message: 'Title must be at least 5 characters',
          },
          {
            type: 'maxLength',
            value: 200,
            message: 'Title must be less than 200 characters',
          },
        ],
        description: 'Post title',
      },
      {
        id: 'field-6',
        name: 'content',
        type: 'text',
        required: true,
        unique: false,
        validation: [
          {
            type: 'minLength',
            value: 10,
            message: 'Content must be at least 10 characters',
          },
        ],
        description: 'Post content body',
      },
      {
        id: 'field-7',
        name: 'published',
        type: 'boolean',
        required: false,
        unique: false,
        validation: [],
        defaultValue: false,
        description: 'Whether the post is published',
      },
      {
        id: 'field-8',
        name: 'authorId',
        type: 'uuid',
        required: true,
        unique: false,
        validation: [],
        description: 'ID of the post author',
      },
      {
        id: 'field-9',
        name: 'tags',
        type: 'json',
        required: false,
        unique: false,
        validation: [],
        description: 'Post tags as JSON array',
      },
    ],
    relationships: [
      {
        id: 'rel-2',
        type: 'oneToMany',
        sourceModel: 'Post',
        targetModel: 'Comment',
        sourceField: 'id',
        targetField: 'postId',
        cascadeDelete: true,
      },
    ],
    metadata: {
      timestamps: true,
      softDelete: true,
      requiresAuth: false,
      allowedRoles: [],
      description: 'Blog posts with content and metadata',
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '3',
    name: 'Comment',
    fields: [
      {
        id: 'field-10',
        name: 'content',
        type: 'text',
        required: true,
        unique: false,
        validation: [
          { type: 'minLength', value: 1, message: 'Comment cannot be empty' },
          {
            type: 'maxLength',
            value: 1000,
            message: 'Comment must be less than 1000 characters',
          },
        ],
        description: 'Comment content',
      },
      {
        id: 'field-11',
        name: 'postId',
        type: 'uuid',
        required: true,
        unique: false,
        validation: [],
        description: 'ID of the post this comment belongs to',
      },
      {
        id: 'field-12',
        name: 'authorEmail',
        type: 'email',
        required: true,
        unique: false,
        validation: [],
        description: 'Email of the comment author',
      },
    ],
    relationships: [],
    metadata: {
      timestamps: true,
      softDelete: false,
      requiresAuth: false,
      allowedRoles: [],
      description: 'Comments on blog posts',
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
];

const sampleAuthConfig: AuthConfig = {
  type: 'jwt',
  jwtSecret: 'your-secret-key',
  roles: [
    { name: 'admin', permissions: ['read', 'write', 'delete'] },
    { name: 'user', permissions: ['read', 'write'] },
    { name: 'guest', permissions: ['read'] },
  ],
  protectedRoutes: ['/users', '/admin'],
};

export default function APIPreviewDemo() {
  const [models] = useState<Model[]>(sampleModels);
  const [authConfig] = useState<AuthConfig>(sampleAuthConfig);

  // Mock endpoint testing function
  const handleEndpointTest = async (endpoint: Endpoint, requestData: any) => {
    // Simulate API call delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 1200)
    );

    // Simulate different response scenarios
    const scenarios = [
      'success',
      'validation_error',
      'not_found',
      'server_error',
    ];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    switch (scenario) {
      case 'success':
        return {
          success: true,
          data: {
            id: crypto.randomUUID(),
            ...requestData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

      case 'validation_error':
        throw new Error('Validation failed: Email is required');

      case 'not_found':
        throw new Error('Resource not found');

      case 'server_error':
        throw new Error('Internal server error');

      default:
        return { success: true, data: requestData };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            API Preview Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            This demo showcases the APIPreview component with sample blog API
            models. You can explore the generated endpoints, view data schemas,
            and test the interactive API testing functionality.
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          style={{ height: '800px' }}
        >
          <APIPreview
            models={models}
            authConfig={authConfig}
            onEndpointTest={handleEndpointTest}
            className="h-full"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Features Demonstrated
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Automatic endpoint generation from models</li>
              <li>• Interactive API testing with mock responses</li>
              <li>• Schema visualization with field details</li>
              <li>• Authentication indicators</li>
              <li>• Real-time preview updates</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Sample Models
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • <strong>User:</strong> Authentication required, admin/user
                roles
              </li>
              <li>
                • <strong>Post:</strong> Public access, soft delete enabled
              </li>
              <li>
                • <strong>Comment:</strong> Public access, linked to posts
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Try It Out
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Switch between Endpoints, Schemas, and Testing views</li>
              <li>• Expand model groups to see CRUD operations</li>
              <li>• Click endpoints to view sample requests/responses</li>
              <li>• Test endpoints with the interactive testing interface</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
