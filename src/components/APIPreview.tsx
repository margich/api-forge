'use client';

import { useCallback, useMemo, useState } from 'react';
import { AuthConfig, Endpoint, Model, OpenAPISpec } from '../types';

interface APIPreviewProps {
  models: Model[];
  endpoints?: Endpoint[];
  authConfig?: AuthConfig;
  openAPISpec?: OpenAPISpec;
  onEndpointTest?: (endpoint: Endpoint, requestData: any) => Promise<any>;
  className?: string;
}

interface EndpointTestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime?: number;
}

interface TestRequest {
  endpointId: string;
  loading: boolean;
  result?: EndpointTestResult;
}

export default function APIPreview({
  models,
  endpoints = [],
  authConfig,
  openAPISpec,
  onEndpointTest,
  className = '',
}: APIPreviewProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null
  );
  const [testRequests, setTestRequests] = useState<Map<string, TestRequest>>(
    new Map()
  );
  const [requestData, setRequestData] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'endpoints' | 'schemas' | 'testing'>(
    'endpoints'
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Generate endpoints from models if not provided
  const generatedEndpoints = useMemo(() => {
    if (endpoints.length > 0) return endpoints;

    const generated: Endpoint[] = [];

    models.forEach((model) => {
      const modelName = model.name;
      const basePath = `/${modelName.toLowerCase()}s`;

      // List endpoint
      generated.push({
        id: `${model.id}-list`,
        path: basePath,
        method: 'GET',
        modelName,
        operation: 'list',
        authenticated: model.metadata.requiresAuth,
        roles: model.metadata.allowedRoles,
        description: `Get all ${modelName} records`,
      });

      // Create endpoint
      generated.push({
        id: `${model.id}-create`,
        path: basePath,
        method: 'POST',
        modelName,
        operation: 'create',
        authenticated: model.metadata.requiresAuth,
        roles: model.metadata.allowedRoles,
        description: `Create a new ${modelName}`,
      });

      // Read endpoint
      generated.push({
        id: `${model.id}-read`,
        path: `${basePath}/:id`,
        method: 'GET',
        modelName,
        operation: 'read',
        authenticated: model.metadata.requiresAuth,
        roles: model.metadata.allowedRoles,
        description: `Get a specific ${modelName} by ID`,
      });

      // Update endpoint
      generated.push({
        id: `${model.id}-update`,
        path: `${basePath}/:id`,
        method: 'PUT',
        modelName,
        operation: 'update',
        authenticated: model.metadata.requiresAuth,
        roles: model.metadata.allowedRoles,
        description: `Update a specific ${modelName}`,
      });

      // Delete endpoint
      generated.push({
        id: `${model.id}-delete`,
        path: `${basePath}/:id`,
        method: 'DELETE',
        modelName,
        operation: 'delete',
        authenticated: model.metadata.requiresAuth,
        roles: model.metadata.allowedRoles,
        description: `Delete a specific ${modelName}`,
      });
    });

    return generated;
  }, [models, endpoints]);

  // Group endpoints by model
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};

    generatedEndpoints.forEach((endpoint) => {
      if (!groups[endpoint.modelName]) {
        groups[endpoint.modelName] = [];
      }
      groups[endpoint.modelName].push(endpoint);
    });

    return groups;
  }, [generatedEndpoints]);

  // Generate sample request data for an endpoint
  const generateSampleRequestData = useCallback(
    (endpoint: Endpoint): any => {
      const model = models.find((m) => m.name === endpoint.modelName);
      if (!model) return {};

      const sampleData: any = {};

      if (endpoint.operation === 'create' || endpoint.operation === 'update') {
        model.fields.forEach((field) => {
          switch (field.type) {
            case 'string':
            case 'text':
              sampleData[field.name] = `Sample ${field.name}`;
              break;
            case 'email':
              sampleData[field.name] = 'user@example.com';
              break;
            case 'url':
              sampleData[field.name] = 'https://example.com';
              break;
            case 'uuid':
              sampleData[field.name] = '123e4567-e89b-12d3-a456-426614174000';
              break;
            case 'number':
            case 'integer':
              sampleData[field.name] = 42;
              break;
            case 'float':
            case 'decimal':
              sampleData[field.name] = 3.14;
              break;
            case 'boolean':
              sampleData[field.name] = true;
              break;
            case 'date':
              sampleData[field.name] = new Date().toISOString();
              break;
            case 'json':
              sampleData[field.name] = { key: 'value' };
              break;
            default:
              sampleData[field.name] = `Sample ${field.name}`;
          }
        });
      }

      return sampleData;
    },
    [models]
  );

  // Generate sample response data for an endpoint
  const generateSampleResponseData = useCallback(
    (endpoint: Endpoint): any => {
      const model = models.find((m) => m.name === endpoint.modelName);
      if (!model) return {};

      const sampleRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...generateSampleRequestData(endpoint),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      switch (endpoint.operation) {
        case 'list':
          return {
            success: true,
            data: [sampleRecord],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              pages: 1,
            },
          };
        case 'create':
        case 'read':
        case 'update':
          return {
            success: true,
            data: sampleRecord,
          };
        case 'delete':
          return {
            success: true,
            message: `${endpoint.modelName} deleted successfully`,
          };
        default:
          return { success: true };
      }
    },
    [models, generateSampleRequestData]
  );

  // Handle endpoint testing
  const handleTestEndpoint = useCallback(
    async (endpoint: Endpoint) => {
      const testId = endpoint.id;

      // Set loading state
      setTestRequests(
        (prev) =>
          new Map(
            prev.set(testId, {
              endpointId: testId,
              loading: true,
            })
          )
      );

      const startTime = Date.now();

      try {
        let result: EndpointTestResult;

        if (onEndpointTest) {
          // Use provided test function
          const testData =
            requestData[testId] || generateSampleRequestData(endpoint);
          const response = await onEndpointTest(endpoint, testData);
          result = {
            success: true,
            status: 200,
            data: response,
            responseTime: Date.now() - startTime,
          };
        } else {
          // Simulate API call
          await new Promise((resolve) =>
            setTimeout(resolve, 500 + Math.random() * 1000)
          );

          const shouldSucceed = Math.random() > 0.1; // 90% success rate

          if (shouldSucceed) {
            result = {
              success: true,
              status:
                endpoint.operation === 'create'
                  ? 201
                  : endpoint.operation === 'delete'
                    ? 204
                    : 200,
              data: generateSampleResponseData(endpoint),
              responseTime: Date.now() - startTime,
            };
          } else {
            result = {
              success: false,
              status: 400,
              error: 'Validation error: Sample error message',
              responseTime: Date.now() - startTime,
            };
          }
        }

        // Update test result
        setTestRequests(
          (prev) =>
            new Map(
              prev.set(testId, {
                endpointId: testId,
                loading: false,
                result,
              })
            )
        );
      } catch (error) {
        // Handle test error
        setTestRequests(
          (prev) =>
            new Map(
              prev.set(testId, {
                endpointId: testId,
                loading: false,
                result: {
                  success: false,
                  status: 500,
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  responseTime: Date.now() - startTime,
                },
              })
            )
        );
      }
    },
    [
      onEndpointTest,
      requestData,
      generateSampleRequestData,
      generateSampleResponseData,
    ]
  );

  // Handle request data change
  const handleRequestDataChange = useCallback(
    (endpointId: string, data: any) => {
      setRequestData((prev) => ({
        ...prev,
        [endpointId]: data,
      }));
    },
    []
  );

  // Toggle group expansion
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  // Get HTTP method color
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-green-600 dark:text-green-400';
    } else if (status >= 400 && status < 500) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else if (status >= 500) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            API Preview
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('endpoints')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'endpoints'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Endpoints
            </button>
            <button
              onClick={() => setViewMode('schemas')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'schemas'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Schemas
            </button>
            <button
              onClick={() => setViewMode('testing')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'testing'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Testing
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {generatedEndpoints.length} endpoint
            {generatedEndpoints.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'endpoints' && (
          <div className="h-full flex">
            {/* Endpoints list */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-auto">
              <div className="p-4 space-y-4">
                {Object.entries(groupedEndpoints).map(
                  ([modelName, modelEndpoints]) => (
                    <div
                      key={modelName}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <button
                        onClick={() => toggleGroup(modelName)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {modelName} ({modelEndpoints.length})
                        </h3>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            expandedGroups.has(modelName) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      {expandedGroups.has(modelName) && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {modelEndpoints.map((endpoint) => (
                            <button
                              key={endpoint.id}
                              onClick={() => setSelectedEndpoint(endpoint)}
                              className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                selectedEndpoint?.id === endpoint.id
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}
                                >
                                  {endpoint.method}
                                </span>
                                <span className="text-sm font-mono text-gray-900 dark:text-white">
                                  {endpoint.path}
                                </span>
                              </div>
                              {endpoint.authenticated && (
                                <svg
                                  className="w-4 h-4 text-yellow-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Endpoint details */}
            <div className="w-1/2 overflow-auto">
              {selectedEndpoint ? (
                <div className="p-4 space-y-6">
                  {/* Endpoint header */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded ${getMethodColor(selectedEndpoint.method)}`}
                      >
                        {selectedEndpoint.method}
                      </span>
                      <span className="text-lg font-mono text-gray-900 dark:text-white">
                        {selectedEndpoint.path}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedEndpoint.description}
                    </p>
                  </div>

                  {/* Authentication */}
                  {selectedEndpoint.authenticated && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Authentication Required
                        </span>
                      </div>
                      {selectedEndpoint.roles &&
                        selectedEndpoint.roles.length > 0 && (
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Roles: {selectedEndpoint.roles.join(', ')}
                          </p>
                        )}
                    </div>
                  )}

                  {/* Sample request */}
                  {(selectedEndpoint.method === 'POST' ||
                    selectedEndpoint.method === 'PUT') && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Sample Request Body
                      </h4>
                      <pre className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm overflow-x-auto">
                        <code className="text-gray-900 dark:text-white">
                          {JSON.stringify(
                            generateSampleRequestData(selectedEndpoint),
                            null,
                            2
                          )}
                        </code>
                      </pre>
                    </div>
                  )}

                  {/* Sample response */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Sample Response
                    </h4>
                    <pre className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm overflow-x-auto">
                      <code className="text-gray-900 dark:text-white">
                        {JSON.stringify(
                          generateSampleResponseData(selectedEndpoint),
                          null,
                          2
                        )}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p>Select an endpoint to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'schemas' && (
          <div className="p-4 space-y-6 overflow-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Data Schemas
            </h3>

            {models.map((model) => (
              <div
                key={model.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  {model.name}
                </h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Required
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          id
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          uuid
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Yes
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Unique identifier
                        </td>
                      </tr>
                      {model.fields.map((field) => (
                        <tr key={field.id}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                            {field.name}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {field.type}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {field.required ? 'Yes' : 'No'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {field.description || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          createdAt
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          date-time
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Yes
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Creation timestamp
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          updatedAt
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          date-time
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Yes
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Last update timestamp
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'testing' && (
          <div className="p-4 space-y-6 overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Interactive Testing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test your API endpoints with sample data
              </p>
            </div>

            {generatedEndpoints.map((endpoint) => {
              const testRequest = testRequests.get(endpoint.id);
              const currentRequestData =
                requestData[endpoint.id] || generateSampleRequestData(endpoint);

              return (
                <div
                  key={endpoint.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded ${getMethodColor(endpoint.method)}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {endpoint.path}
                      </span>
                    </div>
                    <button
                      onClick={() => handleTestEndpoint(endpoint)}
                      disabled={testRequest?.loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {testRequest?.loading && (
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      <span>
                        {testRequest?.loading ? 'Testing...' : 'Test'}
                      </span>
                    </button>
                  </div>

                  {/* Request body editor for POST/PUT */}
                  {(endpoint.method === 'POST' ||
                    endpoint.method === 'PUT') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Request Body
                      </label>
                      <textarea
                        value={JSON.stringify(currentRequestData, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handleRequestDataChange(endpoint.id, parsed);
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="Request body JSON"
                      />
                    </div>
                  )}

                  {/* Test result */}
                  {testRequest?.result && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          Response
                        </h5>
                        <div className="flex items-center space-x-4 text-sm">
                          <span
                            className={`font-medium ${getStatusColor(testRequest.result.status)}`}
                          >
                            {testRequest.result.status}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {testRequest.result.responseTime}ms
                          </span>
                        </div>
                      </div>

                      <pre
                        className={`p-3 rounded-lg text-sm overflow-x-auto ${
                          testRequest.result.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <code
                          className={
                            testRequest.result.success
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-red-900 dark:text-red-100'
                          }
                        >
                          {testRequest.result.error
                            ? testRequest.result.error
                            : JSON.stringify(testRequest.result.data, null, 2)}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
