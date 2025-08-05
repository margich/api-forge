import { v4 as uuidv4 } from 'uuid';
import { describe, expect, it } from 'vitest';
import { FieldType, GenerationOptions, Model } from '../../types';
import { CodeFormatter } from '../codeFormatter';
import { CodeGenerationService } from '../codeGenerationService';

describe('Code Generation Integration', () => {
  it('should generate a complete API project with formatted code', async () => {
    // Create a sample model
    const userModel: Model = {
      id: uuidv4(),
      name: 'User',
      fields: [
        {
          id: uuidv4(),
          name: 'name',
          type: 'string' as FieldType,
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
          validation: [
            { type: 'min', value: 0, message: 'Age must be positive' },
            { type: 'max', value: 150, message: 'Age must be realistic' },
          ],
        },
      ],
      relationships: [],
      metadata: {
        tableName: 'users',
        timestamps: true,
        softDelete: false,
        description: 'User management model',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const productModel: Model = {
      id: uuidv4(),
      name: 'Product',
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
          name: 'description',
          type: 'text' as FieldType,
          required: false,
          unique: false,
          validation: [],
        },
        {
          id: uuidv4(),
          name: 'price',
          type: 'decimal' as FieldType,
          required: true,
          unique: false,
          validation: [
            { type: 'min', value: 0, message: 'Price must be positive' },
          ],
        },
        {
          id: uuidv4(),
          name: 'inStock',
          type: 'boolean' as FieldType,
          required: true,
          unique: false,
          defaultValue: true,
          validation: [],
        },
      ],
      relationships: [],
      metadata: {
        tableName: 'products',
        timestamps: true,
        softDelete: false,
        description: 'Product catalog model',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generation options
    const options: GenerationOptions = {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
    };

    // Generate the project
    const codeGenerator = new CodeGenerationService();
    const project = await codeGenerator.generateProject(
      [userModel, productModel],
      options
    );

    // Verify project structure
    expect(project.id).toBeDefined();
    expect(project.name).toMatch(/^generated-api-\d+$/);
    expect(project.models).toHaveLength(2);
    expect(project.endpoints).toHaveLength(10); // 5 endpoints per model
    expect(project.files.length).toBeGreaterThan(20); // Should have many files

    // Verify essential files exist
    const filePaths = project.files.map((f) => f.path);
    const essentialFiles = [
      'package.json',
      'tsconfig.json',
      '.env.example',
      'README.md',
      'src/app.ts',
      'src/models/User.ts',
      'src/models/Product.ts',
      'src/controllers/UserController.ts',
      'src/controllers/ProductController.ts',
      'src/services/UserService.ts',
      'src/services/ProductService.ts',
      'src/repositories/UserRepository.ts',
      'src/repositories/ProductRepository.ts',
      'src/routes/user.ts',
      'src/routes/product.ts',
      'src/database/connection.ts',
      'src/schemas/user.sql',
      'src/schemas/product.sql',
    ];

    essentialFiles.forEach((filePath) => {
      expect(filePaths).toContain(filePath);
    });

    // Verify file contents
    const packageJson = project.files.find((f) => f.path === 'package.json');
    expect(packageJson).toBeDefined();
    const packageData = JSON.parse(packageJson!.content);
    expect(packageData.dependencies).toHaveProperty('express');
    expect(packageData.dependencies).toHaveProperty('pg');
    expect(packageData.dependencies).toHaveProperty('jsonwebtoken');

    const userModel_file = project.files.find(
      (f) => f.path === 'src/models/User.ts'
    );
    expect(userModel_file).toBeDefined();
    expect(userModel_file!.content).toContain('export interface User');
    expect(userModel_file!.content).toContain('name: string;');
    expect(userModel_file!.content).toContain('email: string;');
    expect(userModel_file!.content).toContain('age?: number;');

    const userController = project.files.find(
      (f) => f.path === 'src/controllers/UserController.ts'
    );
    expect(userController).toBeDefined();
    expect(userController!.content).toContain('export class UserController');
    expect(userController!.content).toContain('create = async');
    expect(userController!.content).toContain('getById = async');
    expect(userController!.content).toContain('getAll = async');
    expect(userController!.content).toContain('update = async');
    expect(userController!.content).toContain('delete = async');

    const userSchema = project.files.find(
      (f) => f.path === 'src/schemas/user.sql'
    );
    expect(userSchema).toBeDefined();
    expect(userSchema!.content).toContain('CREATE TABLE users');
    expect(userSchema!.content).toContain('name VARCHAR(255) NOT NULL');
    expect(userSchema!.content).toContain('email VARCHAR(255) NOT NULL UNIQUE');
    expect(userSchema!.content).toContain('age INTEGER');

    // Test code formatting
    const formatter = new CodeFormatter();
    const formattedFiles = formatter.formatFiles(project.files.slice(0, 5)); // Format first 5 files

    expect(formattedFiles).toHaveLength(5);
    formattedFiles.forEach((file) => {
      expect(file.content).toBeDefined();
      expect(file.content.length).toBeGreaterThan(0);
    });

    // Verify validation
    const validationResults = project.files
      .filter((f) => f.language === 'typescript' || f.language === 'json')
      .slice(0, 3) // Test first 3 files
      .map((file) => formatter.validateCode(file));

    validationResults.forEach((result) => {
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Verify endpoints
    const userEndpoints = project.endpoints.filter(
      (e) => e.modelName === 'User'
    );
    const productEndpoints = project.endpoints.filter(
      (e) => e.modelName === 'Product'
    );

    expect(userEndpoints).toHaveLength(5);
    expect(productEndpoints).toHaveLength(5);

    const operations = ['create', 'read', 'update', 'delete', 'list'];
    operations.forEach((operation) => {
      expect(userEndpoints.some((e) => e.operation === operation)).toBe(true);
      expect(productEndpoints.some((e) => e.operation === operation)).toBe(
        true
      );
    });

    // Verify project metadata
    expect(project.generationOptions).toEqual(options);
    expect(project.authConfig.type).toBe('jwt');
    expect(project.openAPISpec.openapi).toBe('3.0.0');
    expect(project.openAPISpec.info.title).toBe(project.name);
  });

  it('should handle different configuration options', async () => {
    const simpleModel: Model = {
      id: uuidv4(),
      name: 'Task',
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
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Test with different options
    const mysqlOptions: GenerationOptions = {
      framework: 'express',
      database: 'mysql',
      authentication: 'session',
      language: 'typescript',
      includeTests: false,
      includeDocumentation: false,
    };

    const codeGenerator = new CodeGenerationService();
    const project = await codeGenerator.generateProject(
      [simpleModel],
      mysqlOptions
    );

    expect(project.generationOptions.database).toBe('mysql');
    expect(project.generationOptions.authentication).toBe('session');
    expect(project.generationOptions.includeTests).toBe(false);
    expect(project.authConfig.type).toBe('session');

    // Should not include test files
    const testFiles = project.files.filter(
      (f) => f.path.includes('test') || f.type === 'test'
    );
    expect(testFiles).toHaveLength(0);
  });
});
