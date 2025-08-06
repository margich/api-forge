'use client';

import DeploymentManager from '../../components/DeploymentManager';
import { GeneratedProject } from '../../types';

// Mock project data for demonstration
const mockProject: GeneratedProject = {
  id: 'demo-project-123',
  name: 'my-api-project',
  models: [
    {
      id: 'user-model-1',
      name: 'User',
      fields: [
        {
          id: 'field-1',
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          validation: [],
        },
        {
          id: 'field-2',
          name: 'name',
          type: 'string',
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
    {
      id: 'post-model-2',
      name: 'Post',
      fields: [
        {
          id: 'field-3',
          name: 'title',
          type: 'string',
          required: true,
          unique: false,
          validation: [],
        },
        {
          id: 'field-4',
          name: 'content',
          type: 'text',
          required: true,
          unique: false,
          validation: [],
        },
      ],
      relationships: [
        {
          id: 'rel-1',
          type: 'oneToMany',
          sourceModel: 'User',
          targetModel: 'Post',
          sourceField: 'id',
          targetField: 'userId',
          cascadeDelete: false,
        },
      ],
      metadata: {
        timestamps: true,
        softDelete: true,
        requiresAuth: true,
        allowedRoles: ['admin', 'user'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  endpoints: [
    {
      id: 'endpoint-1',
      path: '/api/users',
      method: 'GET',
      modelName: 'User',
      operation: 'list',
      authenticated: true,
      roles: ['admin'],
    },
    {
      id: 'endpoint-2',
      path: '/api/users',
      method: 'POST',
      modelName: 'User',
      operation: 'create',
      authenticated: true,
      roles: ['admin'],
    },
    {
      id: 'endpoint-3',
      path: '/api/posts',
      method: 'GET',
      modelName: 'Post',
      operation: 'list',
      authenticated: true,
      roles: ['admin', 'user'],
    },
  ],
  authConfig: {
    type: 'jwt',
    jwtSecret: 'demo-secret',
    roles: [
      {
        name: 'admin',
        permissions: ['read', 'write', 'delete'],
      },
      {
        name: 'user',
        permissions: ['read', 'write'],
      },
    ],
    protectedRoutes: ['/api/users', '/api/posts'],
  },
  files: [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: 'my-api-project',
          version: '1.0.0',
          scripts: {
            start: 'node dist/app.js',
            build: 'tsc',
            dev: 'ts-node src/app.ts',
          },
          dependencies: {
            express: '^4.18.0',
            jsonwebtoken: '^9.0.0',
            bcryptjs: '^2.4.3',
          },
          devDependencies: {
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
          },
        },
        null,
        2
      ),
      type: 'config',
      language: 'json',
    },
    {
      path: 'src/app.ts',
      content: `import express from 'express';
import { userRoutes } from './routes/userRoutes';
import { postRoutes } from './routes/postRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;`,
      type: 'source',
      language: 'typescript',
    },
  ],
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'My API Project',
      version: '1.0.0',
      description: 'Generated API with User and Post models',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {},
    },
  },
  generationOptions: {
    framework: 'express',
    database: 'postgresql',
    authentication: 'jwt',
    language: 'typescript',
    includeTests: true,
    includeDocumentation: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function DeploymentDemoPage() {
  const handleDeploymentComplete = (deployment: any) => {
    console.log('Deployment completed:', deployment);
    // You could show a success notification here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cloud Deployment Demo
          </h1>
          <p className="text-gray-600">
            Deploy your generated API project to popular cloud platforms with
            just a few clicks. This demo shows how you can configure and deploy
            to Vercel, Netlify, Heroku, AWS, GCP, and Azure.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Demo Project Details
          </h2>
          <div className="text-blue-700 space-y-1">
            <p>
              <strong>Project:</strong> {mockProject.name}
            </p>
            <p>
              <strong>Models:</strong>{' '}
              {mockProject.models.map((m) => m.name).join(', ')}
            </p>
            <p>
              <strong>Framework:</strong>{' '}
              {mockProject.generationOptions.framework}
            </p>
            <p>
              <strong>Database:</strong>{' '}
              {mockProject.generationOptions.database}
            </p>
            <p>
              <strong>Authentication:</strong>{' '}
              {mockProject.generationOptions.authentication}
            </p>
          </div>
        </div>

        <DeploymentManager
          project={mockProject}
          onDeploymentComplete={handleDeploymentComplete}
        />

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Vercel</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatic HTTPS & Global CDN</li>
                <li>• Serverless Functions</li>
                <li>• Preview Deployments</li>
                <li>• Custom Domains</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Netlify</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Continuous Deployment</li>
                <li>• Form Handling</li>
                <li>• Edge Functions</li>
                <li>• Split Testing</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Heroku</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Easy Git Deployment</li>
                <li>• Add-on Ecosystem</li>
                <li>• Automatic Scaling</li>
                <li>• Database Support</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">AWS</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ECS Fargate</li>
                <li>• Application Load Balancer</li>
                <li>• RDS Database</li>
                <li>• Auto Scaling</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Google Cloud</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• App Engine</li>
                <li>• Cloud Build</li>
                <li>• Cloud SQL</li>
                <li>• Load Balancing</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Microsoft Azure</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• App Service</li>
                <li>• Container Registry</li>
                <li>• SQL Database</li>
                <li>• Application Gateway</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
