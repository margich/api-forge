import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it } from 'vitest';
import { CodeGenerationService } from '../services/codeGenerationService';
import {
  ExportOptions,
  ProjectExportService,
} from '../services/projectExportService';
import {
  FieldType,
  GeneratedProject,
  GenerationOptions,
  Model,
} from '../types';

describe('ProjectExportService', () => {
  let projectExportService: ProjectExportService;
  let codeGenerationService: CodeGenerationService;
  let sampleModels: Model[];
  let sampleGenerationOptions: GenerationOptions;
  let sampleProject: GeneratedProject;

  beforeEach(async () => {
    projectExportService = new ProjectExportService();
    codeGenerationService = new CodeGenerationService();

    // Create sample models
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

    sampleGenerationOptions = {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
    };

    // Generate a sample project
    sampleProject = await codeGenerationService.generateProject(
      sampleModels,
      sampleGenerationOptions
    );
  });

  describe('createProjectPackage', () => {
    it('should create a project package with default options', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      expect(projectPackage).toBeDefined();
      expect(projectPackage.id).toBeDefined();
      expect(projectPackage.name).toBe(sampleProject.name);
      expect(projectPackage.files).toBeDefined();
      expect(projectPackage.files.length).toBeGreaterThan(0);
      expect(projectPackage.metadata).toBeDefined();
      expect(projectPackage.setupInstructions).toBeDefined();
      expect(projectPackage.createdAt).toBeInstanceOf(Date);
    });

    it('should exclude test files when includeTests is false', async () => {
      const exportOptions: ExportOptions = {
        format: 'zip',
        includeTests: false,
        includeDocumentation: true,
        template: 'basic',
      };

      const projectPackage = await projectExportService.createProjectPackage(
        sampleProject,
        exportOptions
      );

      const testFiles = projectPackage.files.filter(
        (file) => file.type === 'test'
      );
      expect(testFiles).toHaveLength(0);
    });

    it('should exclude documentation files when includeDocumentation is false', async () => {
      const exportOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: false,
        template: 'basic',
      };

      const projectPackage = await projectExportService.createProjectPackage(
        sampleProject,
        exportOptions
      );

      const docFiles = projectPackage.files.filter(
        (file) => file.type === 'documentation'
      );
      expect(docFiles).toHaveLength(0);
    });

    it('should include template-specific files based on template option', async () => {
      const basicOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'basic',
      };

      const advancedOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'advanced',
      };

      const basicPackage = await projectExportService.createProjectPackage(
        sampleProject,
        basicOptions
      );

      const advancedPackage = await projectExportService.createProjectPackage(
        sampleProject,
        advancedOptions
      );

      // Advanced template should have more files than basic
      expect(advancedPackage.files.length).toBeGreaterThan(
        basicPackage.files.length
      );

      // Check for specific advanced template files
      const hasGithubWorkflow = advancedPackage.files.some((file) =>
        file.path.includes('.github/workflows')
      );
      expect(hasGithubWorkflow).toBe(true);

      const hasEslintConfig = advancedPackage.files.some(
        (file) => file.path === '.eslintrc.js'
      );
      expect(hasEslintConfig).toBe(true);
    });

    it('should generate correct project metadata', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const metadata = projectPackage.metadata;
      expect(metadata.name).toBe(sampleProject.name);
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.framework).toBe(sampleGenerationOptions.framework);
      expect(metadata.database).toBe(sampleGenerationOptions.database);
      expect(metadata.authentication).toBe(
        sampleGenerationOptions.authentication
      );
      expect(metadata.language).toBe(sampleGenerationOptions.language);
      expect(metadata.features).toBeInstanceOf(Array);
      expect(metadata.features.length).toBeGreaterThan(0);
      expect(metadata.dependencies).toBeDefined();
      expect(metadata.devDependencies).toBeDefined();
    });

    it('should generate setup instructions', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const instructions = projectPackage.setupInstructions;
      expect(instructions).toContain('Setup Instructions');
      expect(instructions).toContain('npm install');
      expect(instructions).toContain('.env');
      expect(instructions).toContain('DATABASE_URL');

      if (sampleGenerationOptions.authentication === 'jwt') {
        expect(instructions).toContain('JWT_SECRET');
      }

      // Should contain endpoint documentation
      sampleModels.forEach((model) => {
        expect(instructions).toContain(model.name);
      });
    });
  });

  describe('createZipArchive', () => {
    it('should create a valid zip archive', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const zipBuffer =
        await projectExportService.createZipArchive(projectPackage);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);

      // Check that it starts with ZIP file signature
      const zipSignature = zipBuffer.subarray(0, 4);
      expect(zipSignature.toString('hex')).toBe('504b0304'); // ZIP file signature
    });

    it('should include all project files in the archive', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const zipBuffer =
        await projectExportService.createZipArchive(projectPackage);
      expect(zipBuffer.length).toBeGreaterThan(1000); // Should be substantial size

      // The archive should contain multiple files
      // We can't easily extract and verify contents without additional dependencies,
      // but we can verify the buffer is substantial and has the right signature
    });
  });

  describe('createTarArchive', () => {
    it('should create a valid tar.gz archive', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const tarBuffer =
        await projectExportService.createTarArchive(projectPackage);

      expect(tarBuffer).toBeInstanceOf(Buffer);
      expect(tarBuffer.length).toBeGreaterThan(0);

      // Check that it starts with gzip signature
      const gzipSignature = tarBuffer.subarray(0, 2);
      expect(gzipSignature.toString('hex')).toBe('1f8b'); // GZIP file signature
    });
  });

  describe('template files generation', () => {
    it('should generate basic template files', async () => {
      const basicOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'basic',
      };

      const projectPackage = await projectExportService.createProjectPackage(
        sampleProject,
        basicOptions
      );

      // Check for basic template files
      const gitignoreFile = projectPackage.files.find(
        (f) => f.path === '.gitignore'
      );
      expect(gitignoreFile).toBeDefined();
      expect(gitignoreFile?.content).toContain('node_modules/');

      const dockerFile = projectPackage.files.find(
        (f) => f.path === 'Dockerfile'
      );
      expect(dockerFile).toBeDefined();
      expect(dockerFile?.content).toContain('FROM node:');

      const dockerComposeFile = projectPackage.files.find(
        (f) => f.path === 'docker-compose.yml'
      );
      expect(dockerComposeFile).toBeDefined();
      expect(dockerComposeFile?.content).toContain('version:');
    });

    it('should generate advanced template files', async () => {
      const advancedOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'advanced',
      };

      const projectPackage = await projectExportService.createProjectPackage(
        sampleProject,
        advancedOptions
      );

      // Check for advanced template files
      const githubWorkflow = projectPackage.files.find(
        (f) => f.path === '.github/workflows/ci.yml'
      );
      expect(githubWorkflow).toBeDefined();
      expect(githubWorkflow?.content).toContain('name: CI');

      const eslintConfig = projectPackage.files.find(
        (f) => f.path === '.eslintrc.js'
      );
      expect(eslintConfig).toBeDefined();
      expect(eslintConfig?.content).toContain('module.exports');

      const prettierConfig = projectPackage.files.find(
        (f) => f.path === '.prettierrc'
      );
      expect(prettierConfig).toBeDefined();
    });

    it('should generate enterprise template files', async () => {
      const enterpriseOptions: ExportOptions = {
        format: 'zip',
        includeTests: true,
        includeDocumentation: true,
        template: 'enterprise',
      };

      const projectPackage = await projectExportService.createProjectPackage(
        sampleProject,
        enterpriseOptions
      );

      // Check for enterprise template files
      const k8sDeployment = projectPackage.files.find(
        (f) => f.path === 'k8s/deployment.yml'
      );
      expect(k8sDeployment).toBeDefined();
      expect(k8sDeployment?.content).toContain('apiVersion: apps/v1');

      const helmChart = projectPackage.files.find(
        (f) => f.path === 'helm/Chart.yaml'
      );
      expect(helmChart).toBeDefined();
      expect(helmChart?.content).toContain('apiVersion: v2');

      const prometheusConfig = projectPackage.files.find(
        (f) => f.path === 'monitoring/prometheus.yml'
      );
      expect(prometheusConfig).toBeDefined();
    });
  });

  describe('docker compose generation', () => {
    it('should generate appropriate docker-compose for PostgreSQL', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const dockerComposeFile = projectPackage.files.find(
        (f) => f.path === 'docker-compose.yml'
      );
      expect(dockerComposeFile).toBeDefined();
      expect(dockerComposeFile?.content).toContain('postgres:');
      expect(dockerComposeFile?.content).toContain('POSTGRES_DB');
      expect(dockerComposeFile?.content).toContain('5432:5432');
    });

    it('should include JWT environment variables when JWT auth is used', async () => {
      const projectPackage =
        await projectExportService.createProjectPackage(sampleProject);

      const dockerComposeFile = projectPackage.files.find(
        (f) => f.path === 'docker-compose.yml'
      );
      expect(dockerComposeFile).toBeDefined();
      expect(dockerComposeFile?.content).toContain('JWT_SECRET');
      expect(dockerComposeFile?.content).toContain('JWT_REFRESH_SECRET');
    });
  });

  describe('error handling', () => {
    it('should handle empty project gracefully', async () => {
      const emptyProject: GeneratedProject = {
        ...sampleProject,
        models: [],
        endpoints: [],
        files: [],
      };

      const projectPackage =
        await projectExportService.createProjectPackage(emptyProject);

      expect(projectPackage).toBeDefined();
      expect(projectPackage.files.length).toBeGreaterThan(0); // Should still have template files
    });

    it('should handle missing package.json gracefully', async () => {
      const projectWithoutPackageJson: GeneratedProject = {
        ...sampleProject,
        files: sampleProject.files.filter((f) => f.path !== 'package.json'),
      };

      const projectPackage = await projectExportService.createProjectPackage(
        projectWithoutPackageJson
      );

      expect(projectPackage).toBeDefined();
      expect(projectPackage.metadata.dependencies).toEqual({});
      expect(projectPackage.metadata.devDependencies).toEqual({});
    });
  });
});
