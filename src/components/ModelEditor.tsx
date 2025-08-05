'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import { Field, Model, Relationship } from '../types';
import FieldEditor from './FieldEditor';
import ModelCanvas from './ModelCanvas';
import ModelCard from './ModelCard';
import RelationshipEditor from './RelationshipEditor';

interface ModelEditorProps {
  models: Model[];
  onModelChange: (models: Model[]) => void;
  className?: string;
}

interface EditingState {
  type: 'model' | 'field' | 'relationship' | null;
  modelId?: string;
  fieldId?: string;
  relationshipId?: string;
}

export default function ModelEditor({
  models,
  onModelChange,
  className = '',
}: ModelEditorProps) {
  const [editingState, setEditingState] = useState<EditingState>({
    type: null,
  });
  const [draggedItem, setDraggedItem] = useState<{
    type: 'model' | 'field';
    id: string;
    data: Model | Field;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get currently selected model
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) || null,
    [models, selectedModelId]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const [type, id] = active.id.toString().split('-');

      if (type === 'model') {
        const model = models.find((m) => m.id === id);
        if (model) {
          setDraggedItem({ type: 'model', id, data: model });
        }
      } else if (type === 'field') {
        const field = models.flatMap((m) => m.fields).find((f) => f.id === id);
        if (field) {
          setDraggedItem({ type: 'field', id, data: field });
        }
      }
    },
    [models]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedItem(null);

      if (!over) return;

      const [activeType, activeId] = active.id.toString().split('-');
      const [overType, overId] = over.id.toString().split('-');

      if (
        activeType === 'model' &&
        overType === 'model' &&
        activeId !== overId
      ) {
        // Reorder models
        const oldIndex = models.findIndex((m) => m.id === activeId);
        const newIndex = models.findIndex((m) => m.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedModels = arrayMove(models, oldIndex, newIndex);
          onModelChange(reorderedModels);
        }
      } else if (activeType === 'field' && overType === 'model') {
        // Move field to different model
        const sourceModel = models.find((m) =>
          m.fields.some((f) => f.id === activeId)
        );
        const targetModel = models.find((m) => m.id === overId);

        if (sourceModel && targetModel && sourceModel.id !== targetModel.id) {
          const field = sourceModel.fields.find((f) => f.id === activeId);
          if (field) {
            const updatedModels = models.map((model) => {
              if (model.id === sourceModel.id) {
                return {
                  ...model,
                  fields: model.fields.filter((f) => f.id !== activeId),
                  updatedAt: new Date(),
                };
              } else if (model.id === targetModel.id) {
                return {
                  ...model,
                  fields: [...model.fields, field],
                  updatedAt: new Date(),
                };
              }
              return model;
            });
            onModelChange(updatedModels);
          }
        }
      } else if (activeType === 'field' && overType === 'field') {
        // Reorder fields within the same model
        const sourceModel = models.find((m) =>
          m.fields.some((f) => f.id === activeId)
        );
        const targetModel = models.find((m) =>
          m.fields.some((f) => f.id === overId)
        );

        if (sourceModel && targetModel && sourceModel.id === targetModel.id) {
          const oldIndex = sourceModel.fields.findIndex(
            (f) => f.id === activeId
          );
          const newIndex = sourceModel.fields.findIndex((f) => f.id === overId);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedFields = arrayMove(
              sourceModel.fields,
              oldIndex,
              newIndex
            );
            const updatedModels = models.map((model) =>
              model.id === sourceModel.id
                ? { ...model, fields: reorderedFields, updatedAt: new Date() }
                : model
            );
            onModelChange(updatedModels);
          }
        }
      }
    },
    [models, onModelChange]
  );

  // Add new model
  const handleAddModel = useCallback(() => {
    const newModel: Model = {
      id: crypto.randomUUID(),
      name: `Model${models.length + 1}`,
      fields: [],
      relationships: [],
      metadata: {
        timestamps: true,
        softDelete: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onModelChange([...models, newModel]);
    setSelectedModelId(newModel.id);
    setEditingState({ type: 'model', modelId: newModel.id });
  }, [models, onModelChange]);

  // Update model
  const handleUpdateModel = useCallback(
    (modelId: string, updates: Partial<Model>) => {
      const updatedModels = models.map((model) =>
        model.id === modelId
          ? { ...model, ...updates, updatedAt: new Date() }
          : model
      );
      onModelChange(updatedModels);
    },
    [models, onModelChange]
  );

  // Delete model
  const handleDeleteModel = useCallback(
    (modelId: string) => {
      const updatedModels = models.filter((model) => model.id !== modelId);
      // Also remove any relationships that reference this model
      const cleanedModels = updatedModels.map((model) => ({
        ...model,
        relationships: model.relationships.filter(
          (rel) => rel.sourceModel !== modelId && rel.targetModel !== modelId
        ),
        updatedAt: new Date(),
      }));
      onModelChange(cleanedModels);

      if (selectedModelId === modelId) {
        setSelectedModelId(null);
      }
    },
    [models, onModelChange, selectedModelId]
  );

  // Add field to model
  const handleAddField = useCallback(
    (modelId: string) => {
      const newField: Field = {
        id: crypto.randomUUID(),
        name: 'newField',
        type: 'string',
        required: false,
        unique: false,
        validation: [],
      };

      const updatedModels = models.map((model) =>
        model.id === modelId
          ? {
              ...model,
              fields: [...model.fields, newField],
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
      setEditingState({ type: 'field', modelId, fieldId: newField.id });
    },
    [models, onModelChange]
  );

  // Update field
  const handleUpdateField = useCallback(
    (modelId: string, fieldId: string, updates: Partial<Field>) => {
      const updatedModels = models.map((model) =>
        model.id === modelId
          ? {
              ...model,
              fields: model.fields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
    },
    [models, onModelChange]
  );

  // Delete field
  const handleDeleteField = useCallback(
    (modelId: string, fieldId: string) => {
      const updatedModels = models.map((model) =>
        model.id === modelId
          ? {
              ...model,
              fields: model.fields.filter((field) => field.id !== fieldId),
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
    },
    [models, onModelChange]
  );

  // Add relationship
  const handleAddRelationship = useCallback(
    (sourceModelId: string, targetModelId: string) => {
      const newRelationship: Relationship = {
        id: crypto.randomUUID(),
        type: 'oneToMany',
        sourceModel: sourceModelId,
        targetModel: targetModelId,
        sourceField: 'id',
        targetField: 'id',
        cascadeDelete: false,
      };

      const updatedModels = models.map((model) =>
        model.id === sourceModelId
          ? {
              ...model,
              relationships: [...model.relationships, newRelationship],
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
      setEditingState({
        type: 'relationship',
        modelId: sourceModelId,
        relationshipId: newRelationship.id,
      });
    },
    [models, onModelChange]
  );

  // Update relationship
  const handleUpdateRelationship = useCallback(
    (
      modelId: string,
      relationshipId: string,
      updates: Partial<Relationship>
    ) => {
      const updatedModels = models.map((model) =>
        model.id === modelId
          ? {
              ...model,
              relationships: model.relationships.map((rel) =>
                rel.id === relationshipId ? { ...rel, ...updates } : rel
              ),
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
    },
    [models, onModelChange]
  );

  // Delete relationship
  const handleDeleteRelationship = useCallback(
    (modelId: string, relationshipId: string) => {
      const updatedModels = models.map((model) =>
        model.id === modelId
          ? {
              ...model,
              relationships: model.relationships.filter(
                (rel) => rel.id !== relationshipId
              ),
              updatedAt: new Date(),
            }
          : model
      );
      onModelChange(updatedModels);
    },
    [models, onModelChange]
  );

  // Close editing state
  const handleCloseEditor = useCallback(() => {
    setEditingState({ type: null });
  }, []);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Model Editor
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Canvas
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {models.length} model{models.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleAddModel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Model</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Models area */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'canvas' ? (
              <ModelCanvas
                models={models}
                selectedModelId={selectedModelId}
                onModelSelect={setSelectedModelId}
                onModelUpdate={handleUpdateModel}
                onModelDelete={handleDeleteModel}
                onFieldAdd={handleAddField}
                onFieldUpdate={handleUpdateField}
                onFieldDelete={handleDeleteField}
                onRelationshipAdd={handleAddRelationship}
                onRelationshipUpdate={handleUpdateRelationship}
                onRelationshipDelete={handleDeleteRelationship}
                onEditModel={(modelId) =>
                  setEditingState({ type: 'model', modelId })
                }
                onEditField={(modelId, fieldId) =>
                  setEditingState({ type: 'field', modelId, fieldId })
                }
                onEditRelationship={(modelId, relationshipId) =>
                  setEditingState({
                    type: 'relationship',
                    modelId,
                    relationshipId,
                  })
                }
              />
            ) : (
              <div className="p-4 space-y-4">
                <SortableContext
                  items={models.map((m) => `model-${m.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {models.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModelId === model.id}
                      onSelect={() => setSelectedModelId(model.id)}
                      onUpdate={(updates) =>
                        handleUpdateModel(model.id, updates)
                      }
                      onDelete={() => handleDeleteModel(model.id)}
                      onFieldAdd={() => handleAddField(model.id)}
                      onFieldUpdate={(fieldId, updates) =>
                        handleUpdateField(model.id, fieldId, updates)
                      }
                      onFieldDelete={(fieldId) =>
                        handleDeleteField(model.id, fieldId)
                      }
                      onEditModel={() =>
                        setEditingState({ type: 'model', modelId: model.id })
                      }
                      onEditField={(fieldId) =>
                        setEditingState({
                          type: 'field',
                          modelId: model.id,
                          fieldId,
                        })
                      }
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {draggedItem && draggedItem.type === 'model' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg opacity-90">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {(draggedItem.data as Model).name}
                </h3>
              </div>
            )}
            {draggedItem && draggedItem.type === 'field' && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 shadow-lg opacity-90">
                <span className="text-sm text-gray-900 dark:text-white">
                  {(draggedItem.data as Field).name}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Side panel for editing */}
        {editingState.type && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-auto">
            {editingState.type === 'field' &&
              editingState.modelId &&
              editingState.fieldId && (
                <FieldEditor
                  model={models.find((m) => m.id === editingState.modelId)!}
                  field={
                    models
                      .find((m) => m.id === editingState.modelId)
                      ?.fields.find((f) => f.id === editingState.fieldId)!
                  }
                  onUpdate={(updates) =>
                    handleUpdateField(
                      editingState.modelId!,
                      editingState.fieldId!,
                      updates
                    )
                  }
                  onDelete={() => {
                    handleDeleteField(
                      editingState.modelId!,
                      editingState.fieldId!
                    );
                    handleCloseEditor();
                  }}
                  onClose={handleCloseEditor}
                />
              )}

            {editingState.type === 'relationship' &&
              editingState.modelId &&
              editingState.relationshipId && (
                <RelationshipEditor
                  models={models}
                  relationship={
                    models
                      .find((m) => m.id === editingState.modelId)
                      ?.relationships.find(
                        (r) => r.id === editingState.relationshipId
                      )!
                  }
                  onUpdate={(updates) =>
                    handleUpdateRelationship(
                      editingState.modelId!,
                      editingState.relationshipId!,
                      updates
                    )
                  }
                  onDelete={() => {
                    handleDeleteRelationship(
                      editingState.modelId!,
                      editingState.relationshipId!
                    );
                    handleCloseEditor();
                  }}
                  onClose={handleCloseEditor}
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
