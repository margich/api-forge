'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModelEditor } from '../../components';
import { ProjectService } from '../../services/projectService';
import { SessionService } from '../../services/sessionService';
import { Model, Project } from '../../types';

export default function ModelEditorPage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadCurrentProject();
  }, []);

  const loadCurrentProject = async () => {
    try {
      const sessionService = SessionService.getInstance();
      const projectService = ProjectService.getInstance();
      const currentProjectId = sessionService.getCurrentProjectId();

      if (!currentProjectId) {
        // No current project, redirect to home
        router.push('/');
        return;
      }

      const currentProject = await projectService.getProject(currentProjectId);
      if (!currentProject) {
        // Project not found, redirect to home
        router.push('/');
        return;
      }

      setProject(currentProject);
      setModels(currentProject.models);
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = async (updatedModels: Model[]) => {
    setModels(updatedModels);

    // Auto-save if enabled
    const sessionService = SessionService.getInstance();
    if (sessionService.isAutoSaveEnabled() && project) {
      await saveProject(updatedModels);
    }
  };

  const saveProject = async (modelsToSave?: Model[]) => {
    if (!project) return;

    setIsSaving(true);
    try {
      const projectService = ProjectService.getInstance();
      const updatedProject = await projectService.updateProject(project.id, {
        models: modelsToSave || models,
        status: (modelsToSave || models).length > 0 ? 'ready' : 'draft',
      });

      if (updatedProject) {
        setProject(updatedProject);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueToPreview = () => {
    if (models.length === 0) {
      alert('Please add at least one model before continuing.');
      return;
    }
    router.push('/api-preview');
  };

  const handleBackToPrompt = () => {
    router.push('/');
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
          No Project Selected
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please select a project or create a new one to continue.
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
            Model Editor
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Project: {project.name}</span>
            <span>•</span>
            <span>{models.length} models</span>
            {lastSaved && (
              <>
                <span>•</span>
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
            {isSaving && (
              <>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Saving...
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBackToPrompt}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Prompt
          </button>
          <button
            onClick={() => saveProject()}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Project'}
          </button>
          <button
            onClick={handleContinueToPreview}
            disabled={models.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Preview →
          </button>
        </div>
      </div>

      {/* Model Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <ModelEditor models={models} onModelChange={handleModelChange} />
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Model Editor Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-1">Adding Models</h4>
            <p>Click "Add Model" to create new data structures for your API</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Field Types</h4>
            <p>
              Choose appropriate field types: string, number, boolean, date,
              etc.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Relationships</h4>
            <p>
              Connect models with one-to-one, one-to-many, or many-to-many
              relationships
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Validation</h4>
            <p>Set field requirements, uniqueness, and validation rules</p>
          </div>
        </div>
      </div>
    </div>
  );
}
