import { v4 as uuidv4 } from 'uuid';
import { OpenAPIDocumentationService } from '../services/documentationService';
import { OpenAPIGenerator } from '../services/openApiGenerator';
import { AuthConfig, Endpoint, Model } from '../types';

/**
 * Example demonstrating OpenAPI documentation generation
 */
async function demonstrateOpenAPIGeneration() {
  console.log('🚀 OpenAPI Documentation Generation Example\n');

  // Create sample models
  const models: Model[] = [
    {
      id: uuidv4(),
      name: 'User',
      fields: [
        {
          id: uuidv4(),
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          validation: [
            {
              type: 'pattern',
              value: '^[^@]+@[^@]+\\.[^@]+$',
              message: 'Invalid email format',
            },
          ],
          description: 'User email address',
        },
        {
          id: uuidv4(),
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
              value: 100,
              message: 'Name must be less than 100 characters',
            },
          ],
          description: 'User full name',
        },
        {
          id: uuidv4(),
          name: 'age',
          type: 'integer',
          required: false,
          unique: false,
          validation: [
            { type: 'min', value: 0, message: 'Age must be positive' },
            { type: 'max', value: 150, message: 'Age must be realistic' },
          ],
          description: 'User age in years',
        },
      ],
      relationships: [],
      metadata: {
        tableName: 'users',
        timestamps: true,
        softDelete: false,
        description: 'User account information',
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
          id: uuidv4(),
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
          description: 'Post content',
        },
        {
          id: uuidv4(),
          name: 'published',
          type: 'boolean',
          required: false,
          unique: false,
          defaultValue: false,
          validation: [],
          description: 'Whether the post is published',
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
        tableName: 'posts',
        timestamps: true,
        softDelete: false,
        description: 'Blog posts',
        requiresAuth: true,
        allowedRoles: ['admin', 'author'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Create sample endpoints
  const endpoints: Endpoint[] = [
    {
      id: uuidv4(),
      path: '/users',
      method: 'POST',
      modelName: 'User',
      operation: 'create',
      authenticated: false,
      roles: [],
      description: 'Create a new user',
    },
    {
      id: uuidv4(),
      path: '/users/:id',
      method: 'GET',
      modelName: 'User',
      operation: 'read',
      authenticated: false,
      roles: [],
      description: 'Get a user by ID',
    },
    {
      id: uuidv4(),
      path: '/users',
      method: 'GET',
      modelName: 'User',
      operation: 'list',
      authenticated: false,
      roles: [],
      description: 'List all users',
    },
    {
      id: uuidv4(),
      path: '/users/:id',
      method: 'PUT',
      modelName: 'User',
      operation: 'update',
      authenticated: true,
      roles: ['admin', 'user'],
      description: 'Update a user by ID',
    },
    {
      id: uuidv4(),
      path: '/users/:id',
      method: 'DELETE',
      modelName: 'User',
      operation: 'delete',
      authenticated: true,
      roles: ['admin'],
      description: 'Delete a user by ID',
    },
    {
      id: uuidv4(),
      path: '/posts',
      method: 'POST',
      modelName: 'Post',
      operation: 'create',
      authenticated: true,
      roles: ['admin', 'author'],
      description: 'Create a new post',
    },
    {
      id: uuidv4(),
      path: '/posts/:id',
      method: 'GET',
      modelName: 'Post',
      operation: 'read',
      authenticated: false,
      roles: [],
      description: 'Get a post by ID',
    },
  ];

  // Create auth config
  const authConfig: AuthConfig = {
    type: 'jwt',
    jwtSecret: 'example-secret',
    roles: [
      { name: 'admin', permissions: ['create', 'read', 'update', 'delete'] },
      { name: 'user', permissions: ['read', 'update'] },
      { name: 'author', permissions: ['create', 'read', 'update'] },
    ],
    protectedRoutes: ['/users/:id', '/posts'],
  };

  // Initialize services
  const documentationService = new OpenAPIDocumentationService();
  const openApiGenerator = new OpenAPIGenerator();

  console.log('📋 Generating OpenAPI specification...');

  // Generate OpenAPI specification
  const spec = await documentationService.generateOpenAPISpec(
    models,
    endpoints,
    authConfig
  );

  console.log('✅ OpenAPI specification generated successfully!');
  console.log(`   - Title: ${spec.info.title}`);
  console.log(`   - Version: ${spec.info.version}`);
  console.log(
    `   - Models: ${Object.keys(spec.components.schemas).filter((key) => !key.includes('Response') && !key.includes('Request') && !key.includes('Info')).length}`
  );
  console.log(`   - Endpoints: ${Object.keys(spec.paths).length}`);
  console.log(
    `   - Security schemes: ${Object.keys(spec.components.securitySchemes).length}\n`
  );

  console.log('📄 Generating documentation files...');

  // Generate all documentation files
  const files = await openApiGenerator.generateDocumentationFiles(
    models,
    endpoints,
    authConfig
  );

  console.log('✅ Documentation files generated successfully!');
  files.forEach((file) => {
    console.log(
      `   - ${file.path} (${file.type}, ${file.language || 'no language'})`
    );
  });
  console.log();

  console.log('🔧 Demonstrating documentation update...');

  // Simulate model changes
  const changes = [
    {
      type: 'updated' as const,
      model: {
        ...models[0],
        fields: [
          ...models[0].fields,
          {
            id: uuidv4(),
            name: 'avatar',
            type: 'url' as const,
            required: false,
            unique: false,
            validation: [],
            description: 'User avatar URL',
          },
        ],
      },
      previousModel: models[0],
    },
  ];

  const updatedFiles = await openApiGenerator.updateDocumentationForChanges(
    'example-project',
    changes,
    models,
    endpoints,
    authConfig
  );

  console.log('✅ Documentation updated successfully!');
  console.log(`   - Updated ${updatedFiles.length} files\n`);

  console.log('🎯 Example completed successfully!');
  console.log(
    'The OpenAPI documentation generation service is working correctly.'
  );

  return {
    spec,
    files,
    updatedFiles,
  };
}

// Export for use in other examples or tests
export { demonstrateOpenAPIGeneration };

// Run the example if this file is executed directly
if (require.main === module) {
  demonstrateOpenAPIGeneration().catch(console.error);
}
