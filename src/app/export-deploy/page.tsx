'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeploymentManager, ProjectExport } from '../../components';
import { ProjectService } from '../../services/projectService';
import { SessionService } from '../../services/sessionService';
import { Project } from '../../types';

export default function ExportDeployPage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'export' | 'deploy'>('export');

  useEffect(() => {
    loadCurrentProject();
  }, []);

  const loadCurrentProject = async () => {
    try {
      const sessionService = SessionService.getInstance();
      const projectService = ProjectService.getInstance();
      const currentProjectId = sessionService.getCurrentProjectId();

      if (!currentProjectId) {
        router.push('/');
        return;
      }

      const currentProject = await projectService.getProject(currentProjectId);
      if (!currentProject) {
        router.push('/');
        return;
      }

      if (currentProject.models.length === 0) {
        router.push('/model-editor');
        return;
      }

      setProject(currentProject);
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPreview = () => {
    router.push('/api-preview');
  };

  const handleProjectComplete = () => {
    // Mark project as completed and redirect to projects page
    router.push('/projects');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Project Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please select a project to continue.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Export & Deploy
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Project: {project.name}</span>
            <span>•</span>
            <span>{project.models.length} models</span>
            <span>•</span>
            <span className="capitalize">{project.status} status</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBackToPreview}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Preview
          </button>
          <button
            onClick={handleProjectComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Complete Project
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📦 Export Project
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deploy'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🚀 Deploy to Cloud
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {activeTab === 'export' ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Export Your Project
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Download your complete API project as a zip file with all source
                code, configuration files, and documentation.
              </p>
            </div>
            <ProjectExport projectId={project.id} />
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Deploy to Cloud
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Deploy your API directly to popular cloud platforms with
                automatic configuration and setup.
              </p>
            </div>
            <DeploymentManager projectId={project.id} />
          </div>
        )}
      </div>

      {/* Success Tips */}
      <div className="mt-8 bg-purple-50 dark:bg-purple-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
          🎯 Success Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
          <div>
            <h4 className="font-medium mb-1">After Export</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Review the README.md for setup instructions</li>
              <li>Install dependencies with npm/yarn</li>
              <li>Configure environment variables</li>
              <li>Run database migrations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">After Deployment</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Test your API endpoints</li>
              <li>Set up monitoring and logging</li>
              <li>Configure custom domains</li>
              <li>Set up CI/CD pipelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
