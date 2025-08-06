import { CodeGenerationService } from '../services/codeGenerationService';
import { AuthConfig, GenerationOptions, Model } from '../types';

describe('Authentication Generation', () => {
  let codeGenerationService: CodeGenerationService;
  let mockAuthConfig: AuthConfig;
  let mockGenerationOptions: GenerationOptions;
  let mockModels: Model[];

  beforeEach(() => {
    codeGenerationService = new CodeGenerationService();

    mockAuthConfig = {
      type: 'jwt',
      roles: [
        { name: 'admin', permissions: ['create', 'read', 'update', 'delete'] },
        { name: 'user', permissions: ['read'] },
      ],
      protectedRoutes: ['/api/admin'],
    };

    mockGenerationOptions = {
      framework: 'express',
      database: 'postgresql',
      authentication: 'jwt',
      language: 'typescript',
      includeTests: true,
      includeDocumentation: true,
    };

    mockModels = [
      {
        id: '1',
        name: 'Post',
        fields: [
          {
            id: '1',
            name: 'title',
            type: 'string',
            required: true,
            unique: false,
            validation: [],
          },
          {
            id: '2',
            name: 'content',
            type: 'text',
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
  });

  describe('generateAuthentication', () => {
    it('should generate authentication module with all required files', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      expect(result.files).toHaveLength(9);
      expect(result.endpoints).toHaveLength(5);

      // Check that all required files are generated
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths).toContain('src/models/User.ts');
      expect(filePaths).toContain('src/services/AuthService.ts');
      expect(filePaths).toContain('src/controllers/AuthController.ts');
      expect(filePaths).toContain('src/middleware/auth.ts');
      expect(filePaths).toContain('src/middleware/authorize.ts');
      expect(filePaths).toContain('src/routes/auth.ts');
      expect(filePaths).toContain('src/repositories/UserRepository.ts');
      expect(filePaths).toContain('src/validation/AuthValidation.ts');
      expect(filePaths).toContain('src/schemas/user.sql');
    });

    it('should generate correct authentication endpoints', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const endpointPaths = result.endpoints.map((e) => e.path);
      expect(endpointPaths).toContain('/auth/register');
      expect(endpointPaths).toContain('/auth/login');
      expect(endpointPaths).toContain('/auth/refresh');
      expect(endpointPaths).toContain('/auth/logout');
      expect(endpointPaths).toContain('/auth/profile');

      // Check authentication requirements
      const loginEndpoint = result.endpoints.find(
        (e) => e.path === '/auth/login'
      );
      const profileEndpoint = result.endpoints.find(
        (e) => e.path === '/auth/profile'
      );

      expect(loginEndpoint?.authenticated).toBe(false);
      expect(profileEndpoint?.authenticated).toBe(true);
    });

    it('should generate User model with correct interface', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const userModelFile = result.files.find(
        (f) => f.path === 'src/models/User.ts'
      );
      expect(userModelFile).toBeDefined();
      expect(userModelFile?.content).toContain('interface User');
      expect(userModelFile?.content).toContain('interface CreateUserRequest');
      expect(userModelFile?.content).toContain('interface LoginRequest');
      expect(userModelFile?.content).toContain('interface LoginResponse');
      expect(userModelFile?.content).toContain("role: 'admin' | 'user'");
    });

    it('should generate AuthService with JWT methods', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const authServiceFile = result.files.find(
        (f) => f.path === 'src/services/AuthService.ts'
      );
      expect(authServiceFile).toBeDefined();
      expect(authServiceFile?.content).toContain('import jwt from');
      expect(authServiceFile?.content).toContain('import bcrypt from');
      expect(authServiceFile?.content).toContain('async register');
      expect(authServiceFile?.content).toContain('async login');
      expect(authServiceFile?.content).toContain('async refreshToken');
      expect(authServiceFile?.content).toContain('generateAccessToken');
      expect(authServiceFile?.content).toContain('generateRefreshToken');
    });

    it('should generate authentication middleware', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const authMiddlewareFile = result.files.find(
        (f) => f.path === 'src/middleware/auth.ts'
      );
      expect(authMiddlewareFile).toBeDefined();
      expect(authMiddlewareFile?.content).toContain('authenticateToken');
      expect(authMiddlewareFile?.content).toContain('AuthenticatedRequest');
      expect(authMiddlewareFile?.content).toContain('jwt.verify');
    });

    it('should generate authorization middleware with role-based access', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const authzMiddlewareFile = result.files.find(
        (f) => f.path === 'src/middleware/authorize.ts'
      );
      expect(authzMiddlewareFile).toBeDefined();
      expect(authzMiddlewareFile?.content).toContain('authorize');
      expect(authzMiddlewareFile?.content).toContain('hasPermission');
      expect(authzMiddlewareFile?.content).toContain('requireAdmin');
      expect(authzMiddlewareFile?.content).toContain('requireUser');
    });

    it('should generate user database schema', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const userSchemaFile = result.files.find(
        (f) => f.path === 'src/schemas/user.sql'
      );
      expect(userSchemaFile).toBeDefined();
      expect(userSchemaFile?.content).toContain('CREATE TABLE users');
      expect(userSchemaFile?.content).toContain(
        'email VARCHAR(255) UNIQUE NOT NULL'
      );
      expect(userSchemaFile?.content).toContain(
        'password VARCHAR(255) NOT NULL'
      );
      expect(userSchemaFile?.content).toContain(
        "role VARCHAR(50) NOT NULL DEFAULT 'admin'"
      );
      expect(userSchemaFile?.content).toContain(
        'is_active BOOLEAN DEFAULT true'
      );
      expect(userSchemaFile?.content).toContain(
        'email_verified BOOLEAN DEFAULT false'
      );
    });

    it('should generate validation schemas for auth endpoints', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const validationFile = result.files.find(
        (f) => f.path === 'src/validation/AuthValidation.ts'
      );
      expect(validationFile).toBeDefined();
      expect(validationFile?.content).toContain('validateRegister');
      expect(validationFile?.content).toContain('validateLogin');
      expect(validationFile?.content).toContain('validateRefreshToken');
      expect(validationFile?.content).toContain('isEmail()');
      expect(validationFile?.content).toContain('isLength({ min: 8 })');
    });
  });

  describe('generateProject with authentication', () => {
    it('should include authentication files when JWT is enabled', async () => {
      const result = await codeGenerationService.generateProject(
        mockModels,
        mockGenerationOptions
      );

      const filePaths = result.files.map((f) => f.path);
      expect(filePaths).toContain('src/models/User.ts');
      expect(filePaths).toContain('src/services/AuthService.ts');
      expect(filePaths).toContain('src/middleware/auth.ts');
      expect(filePaths).toContain('src/routes/auth.ts');
    });

    it('should generate protected routes for models requiring authentication', async () => {
      const result = await codeGenerationService.generateProject(
        mockModels,
        mockGenerationOptions
      );

      const postRouteFile = result.files.find(
        (f) => f.path === 'src/routes/post.ts'
      );
      expect(postRouteFile).toBeDefined();
      expect(postRouteFile?.content).toContain('import { authenticateToken }');
      expect(postRouteFile?.content).toContain('import { authorize }');
      expect(postRouteFile?.content).toContain('authenticateToken,');
    });

    it('should include auth routes in main app file', async () => {
      const result = await codeGenerationService.generateProject(
        mockModels,
        mockGenerationOptions
      );

      const appFile = result.files.find((f) => f.path === 'src/app.ts');
      expect(appFile).toBeDefined();
      expect(appFile?.content).toContain(
        "import authRoutes from './routes/auth'"
      );
      expect(appFile?.content).toContain("app.use('/auth', authRoutes)");
    });

    it('should include JWT environment variables', async () => {
      const result = await codeGenerationService.generateProject(
        mockModels,
        mockGenerationOptions
      );

      const envFile = result.files.find((f) => f.path === '.env.example');
      expect(envFile).toBeDefined();
      expect(envFile?.content).toContain('JWT_SECRET=');
      expect(envFile?.content).toContain('JWT_REFRESH_SECRET=');
      expect(envFile?.content).toContain('JWT_EXPIRES_IN=');
    });

    it('should include JWT dependencies in package.json', async () => {
      const result = await codeGenerationService.generateProject(
        mockModels,
        mockGenerationOptions
      );

      const packageFile = result.files.find((f) => f.path === 'package.json');
      expect(packageFile).toBeDefined();

      const packageContent = JSON.parse(packageFile!.content);
      expect(packageContent.dependencies).toHaveProperty('jsonwebtoken');
      expect(packageContent.dependencies).toHaveProperty('bcryptjs');
      expect(packageContent.devDependencies).toHaveProperty(
        '@types/jsonwebtoken'
      );
      expect(packageContent.devDependencies).toHaveProperty('@types/bcryptjs');
    });
  });

  describe('CRUD operations with authentication', () => {
    it('should generate CRUD endpoints with authentication flags', async () => {
      const crudEndpoints = await codeGenerationService.generateCRUDOperations(
        mockModels[0],
        mockAuthConfig
      );

      expect(crudEndpoints.create.authenticated).toBe(true);
      expect(crudEndpoints.update.authenticated).toBe(true);
      expect(crudEndpoints.delete.authenticated).toBe(true);
      expect(crudEndpoints.read.authenticated).toBe(false); // Read is typically public
      expect(crudEndpoints.list.authenticated).toBe(false); // List is typically public

      expect(crudEndpoints.delete.roles).toContain('admin');
    });

    it('should respect model metadata for authentication requirements', async () => {
      const publicModel: Model = {
        ...mockModels[0],
        metadata: {
          ...mockModels[0].metadata,
          requiresAuth: false,
        },
      };

      const crudEndpoints = await codeGenerationService.generateCRUDOperations(
        publicModel,
        mockAuthConfig
      );

      expect(crudEndpoints.create.authenticated).toBe(false);
      expect(crudEndpoints.update.authenticated).toBe(false);
      expect(crudEndpoints.delete.authenticated).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle missing JWT secret gracefully', async () => {
      const authConfigWithoutSecret: AuthConfig = {
        ...mockAuthConfig,
        jwtSecret: undefined,
      };

      const result = await codeGenerationService.generateAuthentication(
        authConfigWithoutSecret
      );

      const authServiceFile = result.files.find(
        (f) => f.path === 'src/services/AuthService.ts'
      );
      expect(authServiceFile?.content).toContain('process.env.JWT_SECRET!');
    });

    it('should generate proper error responses in auth middleware', async () => {
      const result =
        await codeGenerationService.generateAuthentication(mockAuthConfig);

      const authMiddlewareFile = result.files.find(
        (f) => f.path === 'src/middleware/auth.ts'
      );
      expect(authMiddlewareFile?.content).toContain('Access token required');
      expect(authMiddlewareFile?.content).toContain('Invalid or expired token');
      expect(authMiddlewareFile?.content).toContain('res.status(401)');
      expect(authMiddlewareFile?.content).toContain('res.status(403)');
    });
  });
});
