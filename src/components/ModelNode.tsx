'use client';

import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Field, Model } from '../types';

interface ModelNodeData {
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

function ModelNode({ data, selected }: NodeProps<ModelNodeData>) {
  const {
    model,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onFieldAdd,
    onEditModel,
    onEditField,
  } = data;

  const getFieldTypeColor = (type: string) => {
    const colors = {
      string: 'text-green-600 dark:text-green-400',
      number: 'text-blue-600 dark:text-blue-400',
      integer: 'text-blue-600 dark:text-blue-400',
      float: 'text-blue-600 dark:text-blue-400',
      decimal: 'text-blue-600 dark:text-blue-400',
      boolean: 'text-purple-600 dark:text-purple-400',
      date: 'text-orange-600 dark:text-orange-400',
      email: 'text-pink-600 dark:text-pink-400',
      url: 'text-indigo-600 dark:text-indigo-400',
      uuid: 'text-gray-600 dark:text-gray-400',
      json: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-green-600 dark:text-green-400',
    };
    return (
      colors[type as keyof typeof colors] || 'text-gray-600 dark:text-gray-400'
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg min-w-[280px] max-w-[320px] transition-all ${
        isSelected || selected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800"
      />

      {/* Header */}
      <div className="model-drag-handle flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-move">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {model.name}
          </h3>
        </div>

        <div className="flex items-center space-x-1">
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
              className="w-3 h-3"
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
      <div className="p-3">
        {model.fields.length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {model.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditField(field.id);
                }}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {field.name}
                  </span>
                  <span
                    className={`text-xs font-mono ${getFieldTypeColor(field.type)}`}
                  >
                    {field.type}
                  </span>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {field.required && (
                    <span
                      className="w-1.5 h-1.5 bg-red-500 rounded-full"
                      title="Required"
                    />
                  )}
                  {field.unique && (
                    <span
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      title="Unique"
                    />
                  )}
                  {field.defaultValue !== undefined && (
                    <span
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full"
                      title="Has default value"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <svg
                className="w-6 h-6 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              No fields
            </p>
          </div>
        )}

        {/* Add field button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFieldAdd();
          }}
          className="w-full mt-2 p-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-dashed border-blue-300 dark:border-blue-600 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex items-center justify-center space-x-1"
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

      {/* Footer with metadata */}
      {(model.relationships.length > 0 ||
        model.metadata.timestamps ||
        model.metadata.softDelete) && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-1">
            {model.relationships.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {model.relationships.length} rel
              </span>
            )}
            {model.metadata.timestamps && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                TS
              </span>
            )}
            {model.metadata.softDelete && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                SD
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ModelNode);
