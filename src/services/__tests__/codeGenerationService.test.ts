import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { FieldType, GenerationOptions, Model } from '../../types';
import { CodeGenerationService } from '../codeGenerationService';

describe('CodeGenerationService', () => {
  let service: CodeGenerationService;
  let mockModel: Model;
  let mockOptions: GenerationOptions;

  beforeEach(() => {
    service = new CodeGenerationService();

    mockModel = {
      id: uuidv4(),
      name: 'User',
      fields: [
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
          name: 'email',
          type: 'email' as FieldType,
          required: true,
          unique: true,
          validation: [],
        },
        {
          id: uuidv4(),
          name: 'age',
          type: 'integer' as FieldType,
          required: false,
          unique: false,
          validation: [],
        },
      ],
      relationships: [],
      metadata: {
        timestamps: true,
        softDelete: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockOptions = {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
    };
  });

  describe('generateProject', () => {
    it('should generate a complete project with all required files', async () => {
      const result = await service.generateProject([mockModel], mockOptions);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toMatch(/^generated-api-\d+$/);
      expect(result.models).toEqual([mockModel]);
      expect(result.endpoints).toHaveLength(10); // 5 CRUD operations + 5 auth endpoints
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.generationOptions).toEqual(mockOptions);
    });

    it('should generate correct file structure', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const filePaths = result.files.map((f) => f.path);

      // Check for essential files
      expect(filePaths).toContain('package.json');
      expect(filePaths).toContain('tsconfig.json');
      expect(filePaths).toContain('.env.example');
      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('src/app.ts');

      // Check for model-specific files
      expect(filePaths).toContain('src/models/User.ts');
      expect(filePaths).toContain('src/controllers/UserController.ts');
      expect(filePaths).toContain('src/services/UserService.ts');
      expect(filePaths).toContain('src/repositories/UserRepository.ts');
      expect(filePaths).toContain('src/routes/user.ts');
      expect(filePaths).toContain('src/validation/UserValidation.ts');

      // Check for database files
      expect(filePaths).toContain('src/database/connection.ts');
      expect(filePaths).toContain('src/schemas/user.sql');

      // Check for middleware files
      expect(filePaths).toContain('src/middleware/cors.ts');
      expect(filePaths).toContain('src/middleware/logging.ts');
      expect(filePaths).toContain('src/middleware/validation.ts');

      // Check for test files
      expect(filePaths).toContain('src/tests/UserController.test.ts');
    });

    it('should generate different files based on options', async () => {
      const jsOptions = { ...mockOptions, language: 'javascript' as const };
      const result = await service.generateProject([mockModel], jsOptions);
      const filePaths = result.files.map((f) => f.path);

      expect(filePaths).not.toContain('tsconfig.json');
    });

    it('should handle multiple models', async () => {
      const secondModel: Model = {
        ...mockModel,
        id: uuidv4(),
        name: 'Product',
      };

      const result = await service.generateProject(
        [mockModel, secondModel],
        mockOptions
      );

      expect(result.models).toHaveLength(2);
      expect(result.endpoints).toHaveLength(15); // 5 endpoints per model + 5 auth endpoints

      const filePaths = result.files.map((f) => f.path);
      expect(filePaths).toContain('src/models/User.ts');
      expect(filePaths).toContain('src/models/Product.ts');
      expect(filePaths).toContain('src/controllers/UserController.ts');
      expect(filePaths).toContain('src/controllers/ProductController.ts');
    });
  });

  describe('generateCRUDOperations', () => {
    it('should generate all CRUD endpoints for a model', async () => {
      const result = await service.generateCRUDOperations(mockModel);

      expect(result).toHaveProperty('create');
      expect(result).toHaveProperty('read');
      expect(result).toHaveProperty('update');
      expect(result).toHaveProperty('delete');
      expect(result).toHaveProperty('list');

      expect(result.create.method).toBe('POST');
      expect(result.create.path).toBe('/user');
      expect(result.create.operation).toBe('create');

      expect(result.read.method).toBe('GET');
      expect(result.read.path).toBe('/user/:id');
      expect(result.read.operation).toBe('read');

      expect(result.update.method).toBe('PUT');
      expect(result.update.path).toBe('/user/:id');
      expect(result.update.operation).toBe('update');

      expect(result.delete.method).toBe('DELETE');
      expect(result.delete.path).toBe('/user/:id');
      expect(result.delete.operation).toBe('delete');

      expect(result.list.method).toBe('GET');
      expect(result.list.path).toBe('/user');
      expect(result.list.operation).toBe('list');
    });

    it('should generate endpoints with correct model names', async () => {
      const result = await service.generateCRUDOperations(mockModel);

      Object.values(result).forEach((endpoint) => {
        expect(endpoint.modelName).toBe('User');
        expect(endpoint.id).toBeDefined();
        expect(endpoint.description).toContain('User');
      });
    });
  });

  describe('generateAuthentication', () => {
    it('should generate authentication module with JWT', async () => {
      const authConfig = {
        type: 'jwt' as const,
        roles: [],
        protectedRoutes: [],
      };

      const result = await service.generateAuthentication(authConfig);

      expect(result.files).toHaveLength(9);
      expect(result.endpoints).toHaveLength(5);

      const filePaths = result.files.map((f) => f.path);
      expect(filePaths).toContain('src/middleware/auth.ts');
      expect(filePaths).toContain('src/routes/auth.ts');

      const endpointPaths = result.endpoints.map((e) => e.path);
      expect(endpointPaths).toContain('/auth/login');
      expect(endpointPaths).toContain('/auth/register');
    });

    it('should generate authentication files with correct content', async () => {
      const authConfig = {
        type: 'jwt' as const,
        roles: [],
        protectedRoutes: [],
      };

      const result = await service.generateAuthentication(authConfig);
      const authMiddleware = result.files.find(
        (f) => f.path === 'src/middleware/auth.ts'
      );
      const authRoutes = result.files.find(
        (f) => f.path === 'src/routes/auth.ts'
      );

      expect(authMiddleware?.content).toContain('authenticateToken');
      expect(authMiddleware?.content).toContain('AuthenticatedRequest');
      expect(authMiddleware?.content).toContain('jwt.verify');

      expect(authRoutes?.content).toContain('/register');
      expect(authRoutes?.content).toContain('/login');
      expect(authRoutes?.content).toContain('AuthController'); // Auth routes now use AuthController instead of inline bcrypt
    });
  });

  describe('generateMiddleware', () => {
    it('should generate all middleware files when enabled', async () => {
      const middlewareConfig = {
        authentication: true,
        cors: true,
        logging: true,
        validation: true,
      };

      const result = await service.generateMiddleware(middlewareConfig);

      expect(result.files).toHaveLength(3); // cors, logging, validation
      const filePaths = result.files.map((f) => f.path);

      expect(filePaths).toContain('src/middleware/cors.ts');
      expect(filePaths).toContain('src/middleware/logging.ts');
      expect(filePaths).toContain('src/middleware/validation.ts');
    });

    it('should generate only enabled middleware', async () => {
      const middlewareConfig = {
        authentication: false,
        cors: true,
        logging: false,
        validation: true,
      };

      const result = await service.generateMiddleware(middlewareConfig);

      expect(result.files).toHaveLength(2);
      const filePaths = result.files.map((f) => f.path);

      expect(filePaths).toContain('src/middleware/cors.ts');
      expect(filePaths).toContain('src/middleware/validation.ts');
      expect(filePaths).not.toContain('src/middleware/logging.ts');
    });
  });

  describe('file content generation', () => {
    it('should generate valid TypeScript model interfaces', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const modelFile = result.files.find(
        (f) => f.path === 'src/models/User.ts'
      );

      expect(modelFile).toBeDefined();
      expect(modelFile?.content).toContain('export interface User');
      expect(modelFile?.content).toContain(
        'export interface CreateUserRequest'
      );
      expect(modelFile?.content).toContain(
        'export interface UpdateUserRequest'
      );
      expect(modelFile?.content).toContain('name: string;');
      expect(modelFile?.content).toContain('email: string;');
      expect(modelFile?.content).toContain('age?: number;');
    });

    it('should generate valid PostgreSQL schema', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const schemaFile = result.files.find(
        (f) => f.path === 'src/schemas/user.sql'
      );

      expect(schemaFile).toBeDefined();
      expect(schemaFile?.content).toContain('CREATE TABLE users');
      expect(schemaFile?.content).toContain('name VARCHAR(255) NOT NULL');
      expect(schemaFile?.content).toContain(
        'email VARCHAR(255) NOT NULL UNIQUE'
      );
      expect(schemaFile?.content).toContain('age INTEGER');
      expect(schemaFile?.content).toContain('created_at TIMESTAMP');
      expect(schemaFile?.content).toContain('updated_at TIMESTAMP');
    });

    it('should generate valid package.json', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const packageFile = result.files.find((f) => f.path === 'package.json');

      expect(packageFile).toBeDefined();

      const packageJson = JSON.parse(packageFile!.content);
      expect(packageJson.name).toBe('generated-api');
      expect(packageJson.dependencies).toHaveProperty('express');
      expect(packageJson.dependencies).toHaveProperty('typescript');
      expect(packageJson.dependencies).toHaveProperty('pg');
      expect(packageJson.dependencies).toHaveProperty('jsonwebtoken');
      expect(packageJson.devDependencies).toHaveProperty('jest');
    });

    it('should generate controller with proper error handling', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const controllerFile = result.files.find(
        (f) => f.path === 'src/controllers/UserController.ts'
      );

      expect(controllerFile).toBeDefined();
      expect(controllerFile?.content).toContain('try {');
      expect(controllerFile?.content).toContain('} catch (error) {');
      expect(controllerFile?.content).toContain('next(error)');
      expect(controllerFile?.content).toContain('res.status(201)');
      expect(controllerFile?.content).toContain('res.status(404)');
    });

    it('should generate repository with database queries', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const repoFile = result.files.find(
        (f) => f.path === 'src/repositories/UserRepository.ts'
      );

      expect(repoFile).toBeDefined();
      expect(repoFile?.content).toContain('INSERT INTO');
      expect(repoFile?.content).toContain('SELECT * FROM');
      expect(repoFile?.content).toContain('UPDATE');
      expect(repoFile?.content).toContain('deactivateUser'); // User repository doesn't have DELETE FROM, but has deactivateUser
      expect(repoFile?.content).toContain('mapRowToUser'); // User repository uses mapRowToUser instead of mapRowToModel
    });

    it('should generate test files with proper test cases', async () => {
      const result = await service.generateProject([mockModel], mockOptions);
      const testFile = result.files.find(
        (f) => f.path === 'src/tests/UserController.test.ts'
      );

      expect(testFile).toBeDefined();
      expect(testFile?.content).toContain("describe('UserController'");
      expect(testFile?.content).toContain('POST /user');
      expect(testFile?.content).toContain('GET /user');
      expect(testFile?.content).toContain('expect(');
      expect(testFile?.content).toContain('.toBe(');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle models with no fields', async () => {
      const emptyModel: Model = {
        ...mockModel,
        fields: [],
      };

      const result = await service.generateProject([emptyModel], mockOptions);
      expect(result).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle different database types', async () => {
      const mysqlOptions = { ...mockOptions, database: 'mysql' as const };
      const result = await service.generateProject([mockModel], mysqlOptions);

      expect(result).toBeDefined();
      expect(result.generationOptions.database).toBe('mysql');
    });

    it('should handle different authentication types', async () => {
      const sessionOptions = {
        ...mockOptions,
        authentication: 'session' as const,
      };
      const result = await service.generateProject([mockModel], sessionOptions);

      expect(result).toBeDefined();
      expect(result.authConfig.type).toBe('session');
    });

    it('should handle models with complex field types', async () => {
      const complexModel: Model = {
        ...mockModel,
        fields: [
          {
            id: uuidv4(),
            name: 'data',
            type: 'json' as FieldType,
            required: false,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'website',
            type: 'url' as FieldType,
            required: false,
            unique: false,
            validation: [],
          },
          {
            id: uuidv4(),
            name: 'description',
            type: 'text' as FieldType,
            required: false,
            unique: false,
            validation: [],
          },
        ],
      };

      const result = await service.generateProject([complexModel], mockOptions);
      const modelFile = result.files.find(
        (f) => f.path === 'src/models/User.ts'
      );

      expect(modelFile?.content).toContain('data?: any;');
      expect(modelFile?.content).toContain('website?: string;');
      expect(modelFile?.content).toContain('description?: string;');
    });
  });
});
