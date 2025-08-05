# Database Layer Documentation

This directory contains the database layer implementation for the API Generator project, including repository patterns, database utilities, and data models.

## Architecture

The database layer follows the Repository pattern to provide a clean abstraction over data access operations. It uses Prisma as the ORM with PostgreSQL as the primary database.

### Components

- **Database Connection** (`src/lib/database.ts`): Singleton Prisma client with connection management
- **Base Repository** (`base.repository.ts`): Common interface and error handling for all repositories
- **Entity Repositories**: Specific implementations for each data model
- **Database Schema** (`prisma/schema.prisma`): Prisma schema defining all data models

## Data Models

### Project

Represents a user's API project with configuration settings.

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  framework: string; // express, fastify, koa
  database: string; // postgresql, mysql, mongodb
  authType: string; // jwt, oauth, session
  language: string; // typescript, javascript
  createdAt: Date;
  updatedAt: Date;
}
```

### Model

Represents a data model within a project (e.g., User, Product).

```typescript
interface Model {
  id: string;
  name: string;
  projectId: string;
  tableName?: string;
  timestamps: boolean;
  softDelete: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Field

Represents a field within a model (e.g., email, name, age).

```typescript
interface Field {
  id: string;
  name: string;
  type: string; // string, number, boolean, date, etc.
  modelId: string;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  validation?: any; // JSON validation rules
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationship

Represents relationships between models.

```typescript
interface Relationship {
  id: string;
  type: string; // oneToOne, oneToMany, manyToMany
  sourceModelId: string;
  targetModelId: string;
  sourceField: string;
  targetField: string;
  cascadeDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### GeneratedCode

Stores metadata about generated code files.

```typescript
interface GeneratedCode {
  id: string;
  type: string; // model, controller, route, etc.
  filename: string;
  content: string;
  hash: string; // For change detection
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Repository Usage

### Basic CRUD Operations

```typescript
import { projectRepository } from '../repositories';

// Create
const project = await projectRepository.create({
  name: 'My API',
  framework: 'express',
  database: 'postgresql',
  authType: 'jwt',
  language: 'typescript',
});

// Read
const project = await projectRepository.findById('project-id');
const projects = await projectRepository.findMany();

// Update
const updatedProject = await projectRepository.update('project-id', {
  name: 'Updated API Name',
});

// Delete
await projectRepository.delete('project-id');

// Count
const count = await projectRepository.count();
```

### Advanced Queries

```typescript
// Find with filtering and pagination
const projects = await projectRepository.findMany({
  where: { framework: 'express' },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
});

// Find models by project
const models = await modelRepository.findByProjectId('project-id');

// Find fields by model
const fields = await fieldRepository.findByModelId('model-id');
```

### Transaction Support

```typescript
import { withTransaction } from '../lib/database';

const result = await withTransaction(async (tx) => {
  const project = await projectRepository.create(projectData);
  const model = await modelRepository.create({
    ...modelData,
    projectId: project.id,
  });
  return { project, model };
});
```

## Error Handling

The repositories use custom error classes for better error handling:

- `RepositoryError`: Base error for repository operations
- `NotFoundError`: When a resource is not found
- `ValidationError`: When validation fails

```typescript
try {
  const project = await projectRepository.findById('invalid-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Project not found');
  } else if (error instanceof RepositoryError) {
    console.log('Database operation failed');
  }
}
```

## Database Setup

### Environment Configuration

Create a `.env` file with your database connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/api_generator?schema=public"
```

### Running Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name init

# Deploy migrations to production
npx prisma migrate deploy
```

### Database Health Check

```typescript
import { checkDatabaseConnection } from '../lib/database';

const isHealthy = await checkDatabaseConnection();
if (!isHealthy) {
  console.error('Database connection failed');
}
```

## Testing

The database layer includes comprehensive unit and integration tests:

```bash
# Run all repository tests
pnpm test src/tests/repositories/

# Run integration tests
pnpm test src/tests/integration/

# Run with coverage
pnpm test:coverage
```

## Best Practices

1. **Always use repositories** instead of direct Prisma calls in business logic
2. **Handle errors appropriately** using the custom error classes
3. **Use transactions** for operations that modify multiple entities
4. **Validate input data** before passing to repositories
5. **Use proper TypeScript types** for better type safety
6. **Test repository methods** with both unit and integration tests

## Performance Considerations

- Use `include` and `select` options to fetch only needed data
- Implement pagination for large result sets
- Use database indexes for frequently queried fields
- Consider connection pooling for high-traffic applications
- Monitor query performance and optimize as needed
