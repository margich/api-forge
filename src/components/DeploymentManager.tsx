'use client';

import { useEffect, useState } from 'react';
import { GeneratedProject } from '../types';

interface DeploymentPlatform {
  id: string;
  name: string;
  description: string;
  features: string[];
  regions: string[];
}

interface DeploymentStatus {
  id: string;
  projectId: string;
  platform: string;
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  url?: string;
  logs: DeploymentLog[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface DeploymentLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

interface DeploymentOptions {
  platform: string;
  region?: string;
  environment: 'development' | 'staging' | 'production';
  environmentVariables: Record<string, string>;
  customDomain?: string;
}

interface DeploymentManagerProps {
  project: GeneratedProject;
  onDeploymentComplete?: (deployment: DeploymentStatus) => void;
}

export default function DeploymentManager({
  project,
  onDeploymentComplete,
}: DeploymentManagerProps) {
  const [platforms, setPlatforms] = useState<DeploymentPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [deploymentOptions, setDeploymentOptions] = useState<DeploymentOptions>(
    {
      platform: '',
      environment: 'production',
      environmentVariables: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    }
  );
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available platforms
  useEffect(() => {
    loadPlatforms();
    loadDeployments();
  }, []);

  // Poll deployment status for active deployments
  useEffect(() => {
    const activeDeployments = deployments.filter(
      (d) => d.status === 'pending' || d.status === 'deploying'
    );

    if (activeDeployments.length > 0) {
      const interval = setInterval(() => {
        activeDeployments.forEach((deployment) => {
          updateDeploymentStatus(deployment.id);
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [deployments]);

  const loadPlatforms = async () => {
    try {
      const response = await fetch('/api/deployment/platforms');
      if (!response.ok) throw new Error('Failed to load platforms');

      const platformData = await response.json();
      setPlatforms(platformData);

      if (platformData.length > 0) {
        setSelectedPlatform(platformData[0].id);
        setDeploymentOptions((prev) => ({
          ...prev,
          platform: platformData[0].id,
        }));
      }
    } catch (err) {
      setError('Failed to load deployment platforms');
      console.error('Error loading platforms:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeployments = async () => {
    try {
      const response = await fetch('/api/deployment');
      if (!response.ok) throw new Error('Failed to load deployments');

      const deploymentData = await response.json();
      setDeployments(deploymentData);
    } catch (err) {
      console.error('Error loading deployments:', err);
    }
  };

  const updateDeploymentStatus = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployment/${deploymentId}`);
      if (!response.ok) return;

      const updatedDeployment = await response.json();
      setDeployments((prev) =>
        prev.map((d) => (d.id === deploymentId ? updatedDeployment : d))
      );

      // Notify parent if deployment completed
      if (updatedDeployment.status === 'success' && onDeploymentComplete) {
        onDeploymentComplete(updatedDeployment);
      }
    } catch (err) {
      console.error('Error updating deployment status:', err);
    }
  };

  const handleDeploy = async () => {
    if (!selectedPlatform) {
      setError('Please select a deployment platform');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const response = await fetch('/api/deployment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          options: deploymentOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deployment failed');
      }

      const deployment = await response.json();
      setDeployments((prev) => [deployment, ...prev]);

      // Reset form
      setDeploymentOptions((prev) => ({
        ...prev,
        environmentVariables: {
          NODE_ENV: prev.environment,
          PORT: '3000',
        },
        customDomain: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCancelDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployment/${deploymentId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to cancel deployment');

      await updateDeploymentStatus(deploymentId);
    } catch (err) {
      console.error('Error cancelling deployment:', err);
    }
  };

  const handleDeleteDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployment/${deploymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete deployment');

      setDeployments((prev) => prev.filter((d) => d.id !== deploymentId));
    } catch (err) {
      console.error('Error deleting deployment:', err);
    }
  };

  const selectedPlatformInfo = platforms.find((p) => p.id === selectedPlatform);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading deployment platforms...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Deploy {project.name}</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Platform Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deployment Platform
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlatform === platform.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedPlatform(platform.id);
                  setDeploymentOptions((prev) => ({
                    ...prev,
                    platform: platform.id,
                  }));
                }}
              >
                <h3 className="font-semibold text-lg">{platform.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {platform.description}
                </p>
                <div className="mt-2">
                  {platform.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-xs px-2 py-1 rounded mr-1 mb-1"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Configuration */}
        {selectedPlatformInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  value={deploymentOptions.environment}
                  onChange={(e) =>
                    setDeploymentOptions((prev) => ({
                      ...prev,
                      environment: e.target.value as any,
                      environmentVariables: {
                        ...prev.environmentVariables,
                        NODE_ENV: e.target.value,
                      },
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              {selectedPlatformInfo.regions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <select
                    value={deploymentOptions.region || ''}
                    onChange={(e) =>
                      setDeploymentOptions((prev) => ({
                        ...prev,
                        region: e.target.value || undefined,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Default Region</option>
                    {selectedPlatformInfo.regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Domain (optional)
                  </label>
                  <input
                    type="text"
                    value={deploymentOptions.customDomain || ''}
                    onChange={(e) =>
                      setDeploymentOptions((prev) => ({
                        ...prev,
                        customDomain: e.target.value || undefined,
                      }))
                    }
                    placeholder="example.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Environment Variables
                  </label>
                  <div className="space-y-2">
                    {Object.entries(deploymentOptions.environmentVariables).map(
                      ([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const newKey = e.target.value;
                              const newVars = {
                                ...deploymentOptions.environmentVariables,
                              };
                              delete newVars[key];
                              newVars[newKey] = value;
                              setDeploymentOptions((prev) => ({
                                ...prev,
                                environmentVariables: newVars,
                              }));
                            }}
                            placeholder="Variable name"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              setDeploymentOptions((prev) => ({
                                ...prev,
                                environmentVariables: {
                                  ...prev.environmentVariables,
                                  [key]: e.target.value,
                                },
                              }))
                            }
                            placeholder="Variable value"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newVars = {
                                ...deploymentOptions.environmentVariables,
                              };
                              delete newVars[key];
                              setDeploymentOptions((prev) => ({
                                ...prev,
                                environmentVariables: newVars,
                              }));
                            }}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setDeploymentOptions((prev) => ({
                          ...prev,
                          environmentVariables: {
                            ...prev.environmentVariables,
                            '': '',
                          },
                        }))
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Add Variable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <div className="flex justify-end">
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !selectedPlatform}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeploying && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isDeploying ? 'Deploying...' : 'Deploy Project'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deployment History */}
      {deployments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Deployment History</h3>
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <DeploymentCard
                key={deployment.id}
                deployment={deployment}
                onCancel={handleCancelDeployment}
                onDelete={handleDeleteDeployment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DeploymentCardProps {
  deployment: DeploymentStatus;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

function DeploymentCard({
  deployment,
  onCancel,
  onDelete,
}: DeploymentCardProps) {
  const [showLogs, setShowLogs] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'deploying':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              deployment.status
            )}`}
          >
            {deployment.status.toUpperCase()}
          </span>
          <span className="font-medium">{deployment.platform}</span>
          <span className="text-sm text-gray-500">
            {new Date(deployment.startedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex space-x-2">
          {deployment.status === 'deploying' && (
            <button
              onClick={() => onCancel(deployment.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Cancel
            </button>
          )}
          {(deployment.status === 'success' ||
            deployment.status === 'failed' ||
            deployment.status === 'cancelled') && (
            <button
              onClick={() => onDelete(deployment.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-gray-600">{deployment.message}</div>
        {deployment.status === 'deploying' && (
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${deployment.progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {deployment.progress}% complete
            </div>
          </div>
        )}
        {deployment.url && (
          <div className="mt-2">
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View Deployment →
            </a>
          </div>
        )}
        {deployment.error && (
          <div className="mt-2 text-sm text-red-600">{deployment.error}</div>
        )}
      </div>

      {showLogs && (
        <div className="mt-4 bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium mb-2">Deployment Logs</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {deployment.logs.map((log, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`ml-2 ${
                    log.level === 'error'
                      ? 'text-red-600'
                      : log.level === 'warn'
                        ? 'text-yellow-600'
                        : 'text-gray-700'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
