'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Field, Model } from '../types';
import FieldRow from './FieldRow';

interface ModelCardProps {
  model: Model;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Model>) => void;
  onDelete: () => void;
  onFieldAdd: () => void;
  onFieldUpdate: (fieldId: string, updates: Partial<Field>) => void;
  onFieldDelete: (fieldId: string) => void;
  onEditModel: () => void;
  onEditField: (fieldId: string) => void;
}

export default function ModelCard({
  model,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onFieldAdd,
  onFieldUpdate,
  onFieldDelete,
  onEditModel,
  onEditField,
}: ModelCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(model.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `model-${model.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== model.name) {
      onUpdate({ name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setEditName(model.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 border rounded-lg shadow-sm transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          {/* Model name */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyPress}
              className="text-lg font-semibold bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-white"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {model.name}
            </h3>
          )}

          {/* Model info */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{model.fields.length} fields</span>
            {model.relationships.length > 0 && (
              <>
                <span>•</span>
                <span>{model.relationships.length} relationships</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditModel();
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit model"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  `Are you sure you want to delete the "${model.name}" model?`
                )
              ) {
                onDelete();
              }
            }}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete model"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="p-4">
          {model.fields.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fields
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFieldAdd();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                >
                  <svg
                    className="w-3 h-3"
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
                  <span>Add Field</span>
                </button>
              </div>

              {model.fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onUpdate={(updates) => onFieldUpdate(field.id, updates)}
                  onDelete={() => onFieldDelete(field.id)}
                  onEdit={() => onEditField(field.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
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
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                No fields defined yet
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldAdd();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 mx-auto"
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
                <span>Add First Field</span>
              </button>
            </div>
          )}

          {/* Relationships */}
          {model.relationships.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Relationships
              </h4>
              <div className="space-y-2">
                {model.relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {relationship.type}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        → {relationship.targetModel}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // onEditRelationship(relationship.id);
                      }}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {(model.metadata.timestamps ||
            model.metadata.softDelete ||
            model.metadata.description) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {model.metadata.timestamps && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Timestamps
                  </span>
                )}
                {model.metadata.softDelete && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Soft Delete
                  </span>
                )}
                {model.metadata.tableName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Table: {model.metadata.tableName}
                  </span>
                )}
              </div>
              {model.metadata.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {model.metadata.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
