import { v4 as uuidv4 } from 'uuid';
import {
  AuthConfig,
  Endpoint,
  GeneratedFile,
  GeneratedProject,
  GenerationOptions,
  Model,
} from '../types';

export interface CRUDEndpoints {
  create: Endpoint;
  read: Endpoint;
  update: Endpoint;
  delete: Endpoint;
  list: Endpoint;
}

export interface AuthModule {
  files: GeneratedFile[];
  endpoints: Endpoint[];
}

export interface MiddlewareConfig {
  authentication: boolean;
  cors: boolean;
  logging: boolean;
  validation: boolean;
}

export interface MiddlewareModule {
  files: GeneratedFile[];
}

export class CodeGenerationService {
  /**
   * Generate a complete project from models and options
   */
  async generateProject(
    models: Model[],
    options: GenerationOptions
  ): Promise<GeneratedProject> {
    const projectId = uuidv4();
    const projectName = `generated-api-${Date.now()}`;

    // Generate all components
    const endpoints: Endpoint[] = [];
    const files: GeneratedFile[] = [];

    // Generate project structure files
    const structureFiles = await this.generateProjectStructure(options);
    files.push(...structureFiles);

    // Generate models and schemas
    const modelFiles = await this.generateModels(models, options);
    files.push(...modelFiles);

    // Generate CRUD operations for each model
    for (const model of models) {
      const crudEndpoints = await this.generateCRUDOperations(model);
      endpoints.push(
        crudEndpoints.create,
        crudEndpoints.read,
        crudEndpoints.update,
        crudEndpoints.delete,
        crudEndpoints.list
      );

      const crudFiles = await this.generateCRUDFiles(model, options);
      files.push(...crudFiles);
    }

    // Generate authentication if enabled
    let authConfig: AuthConfig = {
      type: options.authentication,
      roles: [],
      protectedRoutes: [],
    };

    if (options.authentication !== 'jwt') {
      const authModule = await this.generateAuthentication(authConfig);
      files.push(...authModule.files);
      endpoints.push(...authModule.endpoints);
    }

    // Generate middleware
    const middlewareConfig: MiddlewareConfig = {
      authentication: true,
      cors: true,
      logging: true,
      validation: true,
    };
    const middlewareModule = await this.generateMiddleware(middlewareConfig);
    files.push(...middlewareModule.files);

    // Generate main application file
    const appFile = await this.generateMainApp(models, options);
    files.push(appFile);

    return {
      id: projectId,
      name: projectName,
      models,
      endpoints,
      authConfig,
      files,
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: projectName,
          version: '1.0.0',
        },
        servers: [],
        paths: {},
        components: {
          schemas: {},
          securitySchemes: {},
        },
      },
      generationOptions: options,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate CRUD operations for a specific model
   */
  async generateCRUDOperations(model: Model): Promise<CRUDEndpoints> {
    const modelName = model.name.toLowerCase();
    const ModelName = model.name;

    return {
      create: {
        id: uuidv4(),
        path: `/${modelName}`,
        method: 'POST',
        modelName: ModelName,
        operation: 'create',
        authenticated: false,
        roles: [],
        description: `Create a new ${ModelName}`,
      },
      read: {
        id: uuidv4(),
        path: `/${modelName}/:id`,
        method: 'GET',
        modelName: ModelName,
        operation: 'read',
        authenticated: false,
        roles: [],
        description: `Get a ${ModelName} by ID`,
      },
      update: {
        id: uuidv4(),
        path: `/${modelName}/:id`,
        method: 'PUT',
        modelName: ModelName,
        operation: 'update',
        authenticated: false,
        roles: [],
        description: `Update a ${ModelName} by ID`,
      },
      delete: {
        id: uuidv4(),
        path: `/${modelName}/:id`,
        method: 'DELETE',
        modelName: ModelName,
        operation: 'delete',
        authenticated: false,
        roles: [],
        description: `Delete a ${ModelName} by ID`,
      },
      list: {
        id: uuidv4(),
        path: `/${modelName}`,
        method: 'GET',
        modelName: ModelName,
        operation: 'list',
        authenticated: false,
        roles: [],
        description: `List all ${ModelName}s`,
      },
    };
  }

  /**
   * Generate authentication module
   */
  async generateAuthentication(authConfig: AuthConfig): Promise<AuthModule> {
    const files: GeneratedFile[] = [];
    const endpoints: Endpoint[] = [];

    // Generate auth middleware
    files.push({
      path: 'src/middleware/auth.ts',
      content: this.generateAuthMiddleware(authConfig),
      type: 'source',
      language: 'typescript',
    });

    // Generate auth routes
    files.push({
      path: 'src/routes/auth.ts',
      content: this.generateAuthRoutes(authConfig),
      type: 'source',
      language: 'typescript',
    });

    // Generate auth endpoints
    endpoints.push(
      {
        id: uuidv4(),
        path: '/auth/login',
        method: 'POST',
        modelName: 'Auth',
        operation: 'create',
        authenticated: false,
        roles: [],
        description: 'User login',
      },
      {
        id: uuidv4(),
        path: '/auth/register',
        method: 'POST',
        modelName: 'Auth',
        operation: 'create',
        authenticated: false,
        roles: [],
        description: 'User registration',
      }
    );

    return { files, endpoints };
  }

  /**
   * Generate middleware module
   */
  async generateMiddleware(
    middlewareConfig: MiddlewareConfig
  ): Promise<MiddlewareModule> {
    const files: GeneratedFile[] = [];

    if (middlewareConfig.cors) {
      files.push({
        path: 'src/middleware/cors.ts',
        content: this.generateCorsMiddleware(),
        type: 'source',
        language: 'typescript',
      });
    }

    if (middlewareConfig.logging) {
      files.push({
        path: 'src/middleware/logging.ts',
        content: this.generateLoggingMiddleware(),
        type: 'source',
        language: 'typescript',
      });
    }

    if (middlewareConfig.validation) {
      files.push({
        path: 'src/middleware/validation.ts',
        content: this.generateValidationMiddleware(),
        type: 'source',
        language: 'typescript',
      });
    }

    return { files };
  }

  /**
   * Generate project structure files
   */
  private async generateProjectStructure(
    options: GenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(options),
      type: 'config',
      language: 'json',
    });

    // TypeScript config
    if (options.language === 'typescript') {
      files.push({
        path: 'tsconfig.json',
        content: this.generateTsConfig(),
        type: 'config',
        language: 'json',
      });
    }

    // Environment config
    files.push({
      path: '.env.example',
      content: this.generateEnvExample(options),
      type: 'config',
    });

    // README
    files.push({
      path: 'README.md',
      content: this.generateReadme(options),
      type: 'documentation',
      language: 'markdown',
    });

    return files;
  }

  /**
   * Generate model files
   */
  private async generateModels(
    models: Model[],
    options: GenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const model of models) {
      // Generate model definition
      files.push({
        path: `src/models/${model.name}.ts`,
        content: this.generateModelFile(model, options),
        type: 'source',
        language: 'typescript',
      });

      // Generate database schema
      if (options.database === 'postgresql') {
        files.push({
          path: `src/schemas/${model.name.toLowerCase()}.sql`,
          content: this.generatePostgreSQLSchema(model),
          type: 'source',
          language: 'sql',
        });
      }
    }

    // Generate database connection
    files.push({
      path: 'src/database/connection.ts',
      content: this.generateDatabaseConnection(options),
      type: 'source',
      language: 'typescript',
    });

    return files;
  }

  /**
   * Generate CRUD files for a model
   */
  private async generateCRUDFiles(
    model: Model,
    options: GenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate controller
    files.push({
      path: `src/controllers/${model.name}Controller.ts`,
      content: this.generateController(model, options),
      type: 'source',
      language: 'typescript',
    });

    // Generate service
    files.push({
      path: `src/services/${model.name}Service.ts`,
      content: this.generateService(model, options),
      type: 'source',
      language: 'typescript',
    });

    // Generate repository
    files.push({
      path: `src/repositories/${model.name}Repository.ts`,
      content: this.generateRepository(model, options),
      type: 'source',
      language: 'typescript',
    });

    // Generate routes
    files.push({
      path: `src/routes/${model.name.toLowerCase()}.ts`,
      content: this.generateRoutes(model, options),
      type: 'source',
      language: 'typescript',
    });

    // Generate validation schemas
    files.push({
      path: `src/validation/${model.name}Validation.ts`,
      content: this.generateValidationSchemas(model),
      type: 'source',
      language: 'typescript',
    });

    // Generate tests if enabled
    if (options.includeTests) {
      files.push({
        path: `src/tests/${model.name}Controller.test.ts`,
        content: this.generateControllerTests(model, options),
        type: 'test',
        language: 'typescript',
      });
    }

    return files;
  }

  /**
   * Generate main application file
   */
  private async generateMainApp(
    models: Model[],
    options: GenerationOptions
  ): Promise<GeneratedFile> {
    return {
      path: 'src/app.ts',
      content: this.generateAppFile(models, options),
      type: 'source',
      language: 'typescript',
    };
  }
  // Template generation methods

  private generatePackageJson(options: GenerationOptions): string {
    const dependencies: Record<string, string> = {
      express: '^4.18.2',
    };

    const devDependencies: Record<string, string> = {
      '@types/node': '^20.0.0',
      nodemon: '^3.0.0',
    };

    if (options.language === 'typescript') {
      dependencies['typescript'] = '^5.0.0';
      devDependencies['@types/express'] = '^4.17.17';
      devDependencies['ts-node'] = '^10.9.0';
    }

    if (options.database === 'postgresql') {
      dependencies['pg'] = '^8.11.0';
      if (options.language === 'typescript') {
        devDependencies['@types/pg'] = '^8.10.0';
      }
    }

    if (options.authentication === 'jwt') {
      dependencies['jsonwebtoken'] = '^9.0.0';
      dependencies['bcryptjs'] = '^2.4.3';
      if (options.language === 'typescript') {
        devDependencies['@types/jsonwebtoken'] = '^9.0.0';
        devDependencies['@types/bcryptjs'] = '^2.4.0';
      }
    }

    if (options.includeTests) {
      devDependencies['jest'] = '^29.0.0';
      devDependencies['supertest'] = '^6.3.0';
      if (options.language === 'typescript') {
        devDependencies['@types/jest'] = '^29.0.0';
        devDependencies['@types/supertest'] = '^2.0.0';
      }
    }

    return JSON.stringify(
      {
        name: 'generated-api',
        version: '1.0.0',
        description: 'Generated API project',
        main: options.language === 'typescript' ? 'dist/app.js' : 'src/app.js',
        scripts: {
          start:
            options.language === 'typescript'
              ? 'node dist/app.js'
              : 'node src/app.js',
          dev:
            options.language === 'typescript'
              ? 'nodemon --exec ts-node src/app.ts'
              : 'nodemon src/app.js',
          build:
            options.language === 'typescript'
              ? 'tsc'
              : 'echo "No build step needed"',
          test: options.includeTests ? 'jest' : 'echo "No tests configured"',
        },
        dependencies,
        devDependencies,
      },
      null,
      2
    );
  }

  private generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'src/**/*.test.ts'],
      },
      null,
      2
    );
  }

  private generateEnvExample(options: GenerationOptions): string {
    let content = `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
`;

    if (options.database === 'postgresql') {
      content += `DATABASE_URL=postgresql://username:password@localhost:5432/database_name
`;
    } else if (options.database === 'mysql') {
      content += `DATABASE_URL=mysql://username:password@localhost:3306/database_name
`;
    } else if (options.database === 'mongodb') {
      content += `DATABASE_URL=mongodb://localhost:27017/database_name
`;
    }

    if (options.authentication === 'jwt') {
      content += `
# Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
`;
    }

    return content;
  }

  private generateReadme(options: GenerationOptions): string {
    return `# Generated API Project

This is an automatically generated API project using ${options.framework} with ${options.database} database.

## Features

- RESTful API endpoints
- ${options.database} database integration
- ${options.authentication} authentication
- Input validation
- Error handling
- ${options.includeTests ? 'Comprehensive test suite' : 'Basic structure'}
- ${options.includeDocumentation ? 'OpenAPI documentation' : 'Basic documentation'}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

The API provides CRUD operations for all defined models. See the generated controllers for specific endpoint details.

## Project Structure

- \`src/app.ts\` - Main application entry point
- \`src/controllers/\` - Request handlers
- \`src/services/\` - Business logic
- \`src/repositories/\` - Data access layer
- \`src/models/\` - Data models
- \`src/routes/\` - Route definitions
- \`src/middleware/\` - Custom middleware
- \`src/validation/\` - Input validation schemas
${options.includeTests ? '- `src/tests/` - Test files' : ''}

## License

MIT
`;
  }

  private generateModelFile(model: Model, options: GenerationOptions): string {
    const fields = model.fields
      .map((field) => {
        const optional = field.required ? '' : '?';
        const type = this.mapFieldTypeToTypeScript(field.type);
        return `  ${field.name}${optional}: ${type};`;
      })
      .join('\n');

    return `export interface ${model.name} {
  id: string;
${fields}
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${model.name}Request {
${model.fields
  .filter((f) => f.name !== 'id')
  .map((field) => {
    const optional = field.required ? '' : '?';
    const type = this.mapFieldTypeToTypeScript(field.type);
    return `  ${field.name}${optional}: ${type};`;
  })
  .join('\n')}
}

export interface Update${model.name}Request {
${model.fields
  .filter((f) => f.name !== 'id')
  .map((field) => {
    const type = this.mapFieldTypeToTypeScript(field.type);
    return `  ${field.name}?: ${type};`;
  })
  .join('\n')}
}
`;
  }

  private generatePostgreSQLSchema(model: Model): string {
    const tableName =
      model.metadata.tableName || model.name.toLowerCase() + 's';

    const fields = model.fields
      .map((field) => {
        const sqlType = this.mapFieldTypeToPostgreSQL(field.type);
        const nullable = field.required ? 'NOT NULL' : '';
        const unique = field.unique ? 'UNIQUE' : '';
        const defaultValue = field.defaultValue
          ? `DEFAULT '${field.defaultValue}'`
          : '';

        return `  ${field.name} ${sqlType} ${nullable} ${unique} ${defaultValue}`.trim();
      })
      .join(',\n');

    return `CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${fields},
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;
  }

  private generateDatabaseConnection(options: GenerationOptions): string {
    if (options.database === 'postgresql') {
      return `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
`;
    }

    return `// Database connection placeholder for ${options.database}
export default {};
`;
  }

  private generateController(model: Model, options: GenerationOptions): string {
    const modelName = model.name;
    const serviceName = `${modelName}Service`;

    return `import { Request, Response, NextFunction } from 'express';
import { ${serviceName} } from '../services/${serviceName}';
import { Create${modelName}Request, Update${modelName}Request } from '../models/${modelName}';

export class ${modelName}Controller {
  private ${modelName.toLowerCase()}Service: ${serviceName};

  constructor() {
    this.${modelName.toLowerCase()}Service = new ${serviceName}();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: Create${modelName}Request = req.body;
      const result = await this.${modelName.toLowerCase()}Service.create(data);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.${modelName.toLowerCase()}Service.getById(id);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '${modelName} not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.${modelName.toLowerCase()}Service.getAll(
        Number(page),
        Number(limit)
      );
      
      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: Update${modelName}Request = req.body;
      const result = await this.${modelName.toLowerCase()}Service.update(id, data);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '${modelName} not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.${modelName.toLowerCase()}Service.delete(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: '${modelName} not found'
        });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
`;
  }

  private generateService(model: Model, options: GenerationOptions): string {
    const modelName = model.name;
    const repositoryName = `${modelName}Repository`;

    return `import { ${repositoryName} } from '../repositories/${repositoryName}';
import { ${modelName}, Create${modelName}Request, Update${modelName}Request } from '../models/${modelName}';

export class ${modelName}Service {
  private ${modelName.toLowerCase()}Repository: ${repositoryName};

  constructor() {
    this.${modelName.toLowerCase()}Repository = new ${repositoryName}();
  }

  async create(data: Create${modelName}Request): Promise<${modelName}> {
    // Add business logic validation here
    return await this.${modelName.toLowerCase()}Repository.create(data);
  }

  async getById(id: string): Promise<${modelName} | null> {
    return await this.${modelName.toLowerCase()}Repository.findById(id);
  }

  async getAll(page: number = 1, limit: number = 10): Promise<{
    items: ${modelName}[];
    total: number;
  }> {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.${modelName.toLowerCase()}Repository.findMany(limit, offset),
      this.${modelName.toLowerCase()}Repository.count()
    ]);
    
    return { items, total };
  }

  async update(id: string, data: Update${modelName}Request): Promise<${modelName} | null> {
    const existing = await this.${modelName.toLowerCase()}Repository.findById(id);
    if (!existing) {
      return null;
    }
    
    return await this.${modelName.toLowerCase()}Repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.${modelName.toLowerCase()}Repository.findById(id);
    if (!existing) {
      return false;
    }
    
    await this.${modelName.toLowerCase()}Repository.delete(id);
    return true;
  }
}
`;
  }

  private generateRepository(model: Model, options: GenerationOptions): string {
    const modelName = model.name;
    const tableName =
      model.metadata.tableName || model.name.toLowerCase() + 's';

    if (options.database === 'postgresql') {
      return `import { query } from '../database/connection';
import { ${modelName}, Create${modelName}Request, Update${modelName}Request } from '../models/${modelName}';

export class ${modelName}Repository {
  private tableName = '${tableName}';

  async create(data: Create${modelName}Request): Promise<${modelName}> {
    const fields = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => \`$\${index + 1}\`).join(', ');
    
    const query_text = \`
      INSERT INTO \${this.tableName} (\${fields})
      VALUES (\${placeholders})
      RETURNING *
    \`;
    
    const result = await query(query_text, values);
    return this.mapRowToModel(result.rows[0]);
  }

  async findById(id: string): Promise<${modelName} | null> {
    const result = await query(
      \`SELECT * FROM \${this.tableName} WHERE id = $1\`,
      [id]
    );
    
    return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
  }

  async findMany(limit: number, offset: number): Promise<${modelName}[]> {
    const result = await query(
      \`SELECT * FROM \${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2\`,
      [limit, offset]
    );
    
    return result.rows.map(row => this.mapRowToModel(row));
  }

  async count(): Promise<number> {
    const result = await query(\`SELECT COUNT(*) FROM \${this.tableName}\`);
    return parseInt(result.rows[0].count);
  }

  async update(id: string, data: Update${modelName}Request): Promise<${modelName}> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((field, index) => \`\${field} = $\${index + 2}\`).join(', ');
    
    const query_text = \`
      UPDATE \${this.tableName}
      SET \${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    \`;
    
    const result = await query(query_text, [id, ...values]);
    return this.mapRowToModel(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await query(\`DELETE FROM \${this.tableName} WHERE id = $1\`, [id]);
  }

  private mapRowToModel(row: any): ${modelName} {
    return {
      id: row.id,
${model.fields.map((field) => `      ${field.name}: row.${field.name},`).join('\n')}
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
`;
    }

    return `// Repository placeholder for ${options.database}
export class ${modelName}Repository {}
`;
  }

  private generateRoutes(model: Model, options: GenerationOptions): string {
    const modelName = model.name;
    const controllerName = `${modelName}Controller`;
    const routePath = model.name.toLowerCase();

    return `import { Router } from 'express';
import { ${controllerName} } from '../controllers/${controllerName}';
import { validate${modelName} } from '../validation/${modelName}Validation';

const router = Router();
const ${modelName.toLowerCase()}Controller = new ${controllerName}();

// Create ${modelName}
router.post('/', validate${modelName}.create, ${modelName.toLowerCase()}Controller.create);

// Get all ${modelName}s
router.get('/', ${modelName.toLowerCase()}Controller.getAll);

// Get ${modelName} by ID
router.get('/:id', ${modelName.toLowerCase()}Controller.getById);

// Update ${modelName}
router.put('/:id', validate${modelName}.update, ${modelName.toLowerCase()}Controller.update);

// Delete ${modelName}
router.delete('/:id', ${modelName.toLowerCase()}Controller.delete);

export default router;
`;
  }

  private generateValidationSchemas(model: Model): string {
    const modelName = model.name;

    const createValidation = model.fields
      .filter((field) => field.name !== 'id')
      .map((field) => {
        const validations = [];

        if (field.required) {
          validations.push('.required()');
        } else {
          validations.push('.optional()');
        }

        if (field.type === 'string') {
          validations.push('.isString()');
          if (field.validation.some((v) => v.type === 'minLength')) {
            const minLength = field.validation.find(
              (v) => v.type === 'minLength'
            )?.value;
            validations.push(`.isLength({ min: ${minLength} })`);
          }
          if (field.validation.some((v) => v.type === 'maxLength')) {
            const maxLength = field.validation.find(
              (v) => v.type === 'maxLength'
            )?.value;
            validations.push(`.isLength({ max: ${maxLength} })`);
          }
        } else if (field.type === 'email') {
          validations.push('.isEmail()');
        } else if (field.type === 'number' || field.type === 'integer') {
          validations.push('.isNumeric()');
        }

        return `  body('${field.name}')${validations.join('')}`;
      })
      .join(',\n');

    const updateValidation = model.fields
      .filter((field) => field.name !== 'id')
      .map((field) => {
        const validations = ['.optional()'];

        if (field.type === 'string') {
          validations.push('.isString()');
        } else if (field.type === 'email') {
          validations.push('.isEmail()');
        } else if (field.type === 'number' || field.type === 'integer') {
          validations.push('.isNumeric()');
        }

        return `  body('${field.name}')${validations.join('')}`;
      })
      .join(',\n');

    return `import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validate${modelName} = {
  create: [
${createValidation},
    handleValidationErrors
  ],
  
  update: [
${updateValidation},
    handleValidationErrors
  ]
};
`;
  }

  private generateControllerTests(
    model: Model,
    options: GenerationOptions
  ): string {
    const modelName = model.name;
    const routePath = model.name.toLowerCase();

    return `import request from 'supertest';
import app from '../app';

describe('${modelName}Controller', () => {
  const testData = {
${model.fields
  .filter((f) => f.name !== 'id')
  .map((field) => {
    const value = this.generateTestValue(field.type);
    return `    ${field.name}: ${JSON.stringify(value)}`;
  })
  .join(',\n')}
  };

  describe('POST /${routePath}', () => {
    it('should create a new ${modelName}', async () => {
      const response = await request(app)
        .post('/${routePath}')
        .send(testData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
${model.fields
  .filter((f) => f.name !== 'id')
  .map(
    (field) =>
      `      expect(response.body.data.${field.name}).toBe(testData.${field.name});`
  )
  .join('\n')}
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/${routePath}')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /${routePath}', () => {
    it('should return all ${modelName}s', async () => {
      const response = await request(app)
        .get('/${routePath}')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('GET /${routePath}/:id', () => {
    it('should return a ${modelName} by ID', async () => {
      // First create a ${modelName}
      const createResponse = await request(app)
        .post('/${routePath}')
        .send(testData);

      const id = createResponse.body.data.id;

      const response = await request(app)
        .get(\`/${routePath}/\${id}\`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(id);
    });

    it('should return 404 for non-existent ${modelName}', async () => {
      const response = await request(app)
        .get('/${routePath}/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('${modelName} not found');
    });
  });
});
`;
  }

  private generateAppFile(models: Model[], options: GenerationOptions): string {
    const imports = models
      .map(
        (model) =>
          `import ${model.name.toLowerCase()}Routes from './routes/${model.name.toLowerCase()}';`
      )
      .join('\n');

    const routes = models
      .map(
        (model) =>
          `app.use('/${model.name.toLowerCase()}', ${model.name.toLowerCase()}Routes);`
      )
      .join('\n');

    return `import express from 'express';
import cors from 'cors';
${imports}
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
${routes}

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

export default app;
`;
  }

  // Middleware generation methods

  private generateAuthMiddleware(authConfig: AuthConfig): string {
    return `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user as any;
    next();
  });
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasRequiredRole = roles.some(role => req.user!.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
`;
  }

  private generateAuthRoutes(authConfig: AuthConfig): string {
    return `import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = Router();

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isString().trim().isLength({ min: 1 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // TODO: Save user to database
    // const user = await userService.create({ email, password: hashedPassword, name });

    // Generate JWT token
    const token = jwt.sign(
      { id: 'user-id', email, roles: ['user'] },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: 'user-id',
          email,
          name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // TODO: Get user from database
    // const user = await userService.findByEmail(email);
    
    // For demo purposes, using mock data
    const mockUser = {
      id: 'user-id',
      email,
      password: await bcrypt.hash('password123', 10), // Mock hashed password
      name: 'Demo User'
    };

    // Verify password
    const isValidPassword = await bcrypt.compare(password, mockUser.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email, roles: ['user'] },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

export default router;
`;
  }

  private generateCorsMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};
`;
  }

  private generateLoggingMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: \`\${duration}ms\`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    console.log(JSON.stringify(log));
  });
  
  next();
};
`;
  }

  private generateValidationMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
  }
  
  next();
};

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};
`;
  }

  // Utility methods

  private mapFieldTypeToTypeScript(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      number: 'number',
      integer: 'number',
      float: 'number',
      decimal: 'number',
      boolean: 'boolean',
      date: 'Date',
      email: 'string',
      url: 'string',
      uuid: 'string',
      json: 'any',
      text: 'string',
    };

    return typeMap[fieldType] || 'string';
  }

  private mapFieldTypeToPostgreSQL(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: 'VARCHAR(255)',
      number: 'NUMERIC',
      integer: 'INTEGER',
      float: 'REAL',
      decimal: 'DECIMAL',
      boolean: 'BOOLEAN',
      date: 'TIMESTAMP WITH TIME ZONE',
      email: 'VARCHAR(255)',
      url: 'TEXT',
      uuid: 'UUID',
      json: 'JSONB',
      text: 'TEXT',
    };

    return typeMap[fieldType] || 'VARCHAR(255)';
  }

  private generateTestValue(fieldType: string): any {
    const valueMap: Record<string, any> = {
      string: 'test string',
      number: 42,
      integer: 42,
      float: 42.5,
      decimal: 42.99,
      boolean: true,
      date: new Date().toISOString(),
      email: 'test@example.com',
      url: 'https://example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      json: { key: 'value' },
      text: 'test text content',
    };

    return valueMap[fieldType] || 'test value';
  }
}
