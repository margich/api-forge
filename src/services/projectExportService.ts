import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedFile, GeneratedProject } from '../types';

export interface ProjectPackage {
  id: string;
  name: string;
  files: GeneratedFile[];
  metadata: ProjectMetadata;
  setupInstructions: string;
  createdAt: Date;
}

export interface ProjectMetadata {
  name: string;
  version: string;
  description: string;
  framework: string;
  database: string;
  authentication: string;
  language: string;
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface ExportOptions {
  format: 'zip' | 'tar';
  includeTests: boolean;
  includeDocumentation: boolean;
  template: 'basic' | 'advanced' | 'enterprise';
}

export class ProjectExportService {
  /**
   * Create a project package from a generated project
   */
  async createProjectPackage(
    project: GeneratedProject,
    options: ExportOptions = {
      format: 'zip',
      includeTests: true,
      includeDocumentation: true,
      template: 'basic',
    }
  ): Promise<ProjectPackage> {
    const packageId = uuidv4();

    // Filter files based on options
    let files = [...project.files];

    if (!options.includeTests) {
      files = files.filter((file) => file.type !== 'test');
    }

    if (!options.includeDocumentation) {
      files = files.filter((file) => file.type !== 'documentation');
    }

    // Generate metadata
    const metadata = this.generateProjectMetadata(project, options);

    // Generate setup instructions
    const setupInstructions = this.generateSetupInstructions(project, options);

    // Add template-specific files
    const templateFiles = await this.generateTemplateFiles(project, options);
    files.push(...templateFiles);

    return {
      id: packageId,
      name: project.name,
      files,
      metadata,
      setupInstructions,
      createdAt: new Date(),
    };
  }

  /**
   * Create a zip archive from project package
   */
  async createZipArchive(projectPackage: ProjectPackage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Add project metadata file
      archive.append(JSON.stringify(projectPackage.metadata, null, 2), {
        name: 'project.json',
      });

      // Add setup instructions
      archive.append(projectPackage.setupInstructions, { name: 'SETUP.md' });

      // Add all project files
      for (const file of projectPackage.files) {
        archive.append(file.content, { name: file.path });
      }

      archive.finalize();
    });
  }

  /**
   * Create a tar archive from project package
   */
  async createTarArchive(projectPackage: ProjectPackage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: 9,
        },
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Add project metadata file
      archive.append(JSON.stringify(projectPackage.metadata, null, 2), {
        name: 'project.json',
      });

      // Add setup instructions
      archive.append(projectPackage.setupInstructions, { name: 'SETUP.md' });

      // Add all project files
      for (const file of projectPackage.files) {
        archive.append(file.content, { name: file.path });
      }

      archive.finalize();
    });
  }

  /**
   * Generate project metadata
   */
  private generateProjectMetadata(
    project: GeneratedProject,
    options: ExportOptions
  ): ProjectMetadata {
    const generationOptions = project.generationOptions;

    // Extract dependencies from package.json file
    const packageJsonFile = project.files.find(
      (f) => f.path === 'package.json'
    );
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let scripts: Record<string, string> = {};

    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        dependencies = packageJson.dependencies || {};
        devDependencies = packageJson.devDependencies || {};
        scripts = packageJson.scripts || {};
      } catch (error) {
        console.warn('Failed to parse package.json for metadata');
      }
    }

    const features = [
      `${generationOptions.framework} framework`,
      `${generationOptions.database} database`,
      `${generationOptions.authentication} authentication`,
      'RESTful API endpoints',
      'Input validation',
      'Error handling',
    ];

    if (generationOptions.includeTests) {
      features.push('Test suite');
    }

    if (generationOptions.includeDocumentation) {
      features.push('OpenAPI documentation');
    }

    if (project.models.length > 0) {
      features.push(`${project.models.length} data models`);
    }

    if (project.endpoints.length > 0) {
      features.push(`${project.endpoints.length} API endpoints`);
    }

    return {
      name: project.name,
      version: '1.0.0',
      description: `Generated API project with ${project.models.length} models and ${project.endpoints.length} endpoints`,
      framework: generationOptions.framework,
      database: generationOptions.database,
      authentication: generationOptions.authentication,
      language: generationOptions.language,
      features,
      dependencies,
      devDependencies,
      scripts,
    };
  }

  /**
   * Generate setup instructions
   */
  private generateSetupInstructions(
    project: GeneratedProject,
    options: ExportOptions
  ): string {
    const generationOptions = project.generationOptions;

    let instructions = `# ${project.name} - Setup Instructions

This is an automatically generated API project. Follow these steps to get it running:

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager`;

    // Add database-specific prerequisites
    if (generationOptions.database === 'postgresql') {
      instructions += `
- PostgreSQL database server`;
    } else if (generationOptions.database === 'mysql') {
      instructions += `
- MySQL database server`;
    } else if (generationOptions.database === 'mongodb') {
      instructions += `
- MongoDB database server`;
    }

    instructions += `

## Installation Steps

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Configuration

Copy the example environment file and configure your settings:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit the \`.env\` file with your configuration:

- **PORT**: Server port (default: 3000)
- **NODE_ENV**: Environment (development/production)`;

    // Add database configuration instructions
    if (generationOptions.database === 'postgresql') {
      instructions += `
- **DATABASE_URL**: PostgreSQL connection string
  - Format: \`postgresql://username:password@localhost:5432/database_name\``;
    } else if (generationOptions.database === 'mysql') {
      instructions += `
- **DATABASE_URL**: MySQL connection string
  - Format: \`mysql://username:password@localhost:3306/database_name\``;
    } else if (generationOptions.database === 'mongodb') {
      instructions += `
- **DATABASE_URL**: MongoDB connection string
  - Format: \`mongodb://localhost:27017/database_name\``;
    }

    // Add authentication configuration
    if (generationOptions.authentication === 'jwt') {
      instructions += `
- **JWT_SECRET**: Secret key for JWT tokens (use a strong, random string)
- **JWT_REFRESH_SECRET**: Secret key for refresh tokens
- **JWT_EXPIRES_IN**: Token expiration time (default: 15m)`;
    }

    instructions += `

### 3. Database Setup`;

    if (generationOptions.database === 'postgresql') {
      instructions += `

Create a PostgreSQL database and run the schema files:

\`\`\`bash
# Create database
createdb your_database_name

# Run schema files (in order)
psql -d your_database_name -f src/schemas/user.sql`;

      // Add schema files for each model
      project.models.forEach((model) => {
        instructions += `
psql -d your_database_name -f src/schemas/${model.name.toLowerCase()}.sql`;
      });

      instructions += `
\`\`\``;
    } else if (generationOptions.database === 'mysql') {
      instructions += `

Create a MySQL database and run the schema files:

\`\`\`bash
# Create database
mysql -u root -p -e "CREATE DATABASE your_database_name;"

# Run schema files
mysql -u root -p your_database_name < src/schemas/user.sql`;

      project.models.forEach((model) => {
        instructions += `
mysql -u root -p your_database_name < src/schemas/${model.name.toLowerCase()}.sql`;
      });

      instructions += `
\`\`\``;
    }

    instructions += `

### 4. Start the Application

For development:
\`\`\`bash
npm run dev
\`\`\`

For production:
\`\`\`bash
npm run build
npm start
\`\`\`

## API Documentation

The API will be available at \`http://localhost:3000\``;

    if (generationOptions.includeDocumentation) {
      instructions += `

Interactive API documentation (Swagger UI) is available at:
\`http://localhost:3000/api/docs\``;
    }

    instructions += `

## Available Endpoints

### Authentication Endpoints`;

    if (generationOptions.authentication === 'jwt') {
      instructions += `
- \`POST /auth/register\` - User registration
- \`POST /auth/login\` - User login
- \`POST /auth/refresh\` - Refresh access token
- \`POST /auth/logout\` - User logout
- \`GET /auth/profile\` - Get user profile`;
    }

    instructions += `

### Model Endpoints`;

    project.models.forEach((model) => {
      const modelName = model.name.toLowerCase();
      instructions += `

#### ${model.name}
- \`GET /${modelName}\` - List all ${model.name}s
- \`GET /${modelName}/:id\` - Get ${model.name} by ID
- \`POST /${modelName}\` - Create new ${model.name}
- \`PUT /${modelName}/:id\` - Update ${model.name}
- \`DELETE /${modelName}/:id\` - Delete ${model.name}`;
    });

    if (generationOptions.includeTests) {
      instructions += `

## Running Tests

\`\`\`bash
npm test
\`\`\``;
    }

    instructions += `

## Project Structure

- \`src/app.ts\` - Main application entry point
- \`src/controllers/\` - Request handlers
- \`src/services/\` - Business logic
- \`src/repositories/\` - Data access layer
- \`src/models/\` - Data models and interfaces
- \`src/routes/\` - Route definitions
- \`src/middleware/\` - Custom middleware
- \`src/validation/\` - Input validation schemas
- \`src/database/\` - Database connection and utilities`;

    if (generationOptions.includeTests) {
      instructions += `
- \`src/tests/\` - Test files`;
    }

    instructions += `

## Support

This project was generated automatically. For issues with the generated code structure, please refer to the API Generator documentation.

## License

MIT License - Feel free to modify and use this code for your projects.
`;

    return instructions;
  }

  /**
   * Generate template-specific files
   */
  private async generateTemplateFiles(
    project: GeneratedProject,
    options: ExportOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    switch (options.template) {
      case 'basic':
        files.push(...this.generateBasicTemplateFiles(project));
        break;
      case 'advanced':
        files.push(...this.generateAdvancedTemplateFiles(project));
        break;
      case 'enterprise':
        files.push(...this.generateEnterpriseTemplateFiles(project));
        break;
    }

    return files;
  }

  /**
   * Generate basic template files
   */
  private generateBasicTemplateFiles(
    project: GeneratedProject
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Add .gitignore
    files.push({
      path: '.gitignore',
      content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log
`,
      type: 'config',
    });

    // Add Docker support
    files.push({
      path: 'Dockerfile',
      content: `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build if TypeScript
RUN npm run build 2>/dev/null || echo "No build step"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
`,
      type: 'config',
    });

    // Add docker-compose for development
    files.push({
      path: 'docker-compose.yml',
      content: this.generateDockerCompose(project),
      type: 'config',
    });

    return files;
  }

  /**
   * Generate advanced template files
   */
  private generateAdvancedTemplateFiles(
    project: GeneratedProject
  ): GeneratedFile[] {
    const files = this.generateBasicTemplateFiles(project);

    // Add GitHub Actions workflow
    files.push({
      path: '.github/workflows/ci.yml',
      content: `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
`,
      type: 'config',
    });

    // Add ESLint configuration
    files.push({
      path: '.eslintrc.js',
      content: `module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
};
`,
      type: 'config',
      language: 'javascript',
    });

    // Add Prettier configuration
    files.push({
      path: '.prettierrc',
      content: `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
`,
      type: 'config',
      language: 'json',
    });

    return files;
  }

  /**
   * Generate enterprise template files
   */
  private generateEnterpriseTemplateFiles(
    project: GeneratedProject
  ): GeneratedFile[] {
    const files = this.generateAdvancedTemplateFiles(project);

    // Add Kubernetes deployment
    files.push({
      path: 'k8s/deployment.yml',
      content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${project.name}
  labels:
    app: ${project.name}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${project.name}
  template:
    metadata:
      labels:
        app: ${project.name}
    spec:
      containers:
      - name: ${project.name}
        image: ${project.name}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ${project.name}-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ${project.name}-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: ${project.name}-service
spec:
  selector:
    app: ${project.name}
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
`,
      type: 'config',
    });

    // Add Helm chart
    files.push({
      path: 'helm/Chart.yaml',
      content: `apiVersion: v2
name: ${project.name}
description: A Helm chart for ${project.name}
type: application
version: 0.1.0
appVersion: "1.0.0"
`,
      type: 'config',
    });

    // Add monitoring configuration
    files.push({
      path: 'monitoring/prometheus.yml',
      content: `global:
  scrape_interval: 15s

scrape_configs:
  - job_name: '${project.name}'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
`,
      type: 'config',
    });

    return files;
  }

  /**
   * Generate Docker Compose configuration
   */
  private generateDockerCompose(project: GeneratedProject): string {
    const database = project.generationOptions.database;

    let compose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=\${DATABASE_URL}`;

    if (project.generationOptions.authentication === 'jwt') {
      compose += `
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}`;
    }

    compose += `
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:`;

    if (database === 'postgresql') {
      compose += `
    image: postgres:15
    environment:
      - POSTGRES_DB=\${DB_NAME:-api_db}
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;
    } else if (database === 'mysql') {
      compose += `
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=\${DB_NAME:-api_db}
      - MYSQL_USER=\${DB_USER:-mysql}
      - MYSQL_PASSWORD=\${DB_PASSWORD:-password}
      - MYSQL_ROOT_PASSWORD=\${DB_ROOT_PASSWORD:-rootpassword}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:`;
    } else if (database === 'mongodb') {
      compose += `
    image: mongo:6.0
    environment:
      - MONGO_INITDB_DATABASE=\${DB_NAME:-api_db}
      - MONGO_INITDB_ROOT_USERNAME=\${DB_USER:-mongo}
      - MONGO_INITDB_ROOT_PASSWORD=\${DB_PASSWORD:-password}
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:`;
    }

    return compose;
  }
}
