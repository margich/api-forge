'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Field, FieldType, FieldTypes } from '../types';

interface FieldRowProps {
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function FieldRow({
  field,
  onUpdate,
  onDelete,
  onEdit,
}: FieldRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(field.name);
  const [editType, setEditType] = useState(field.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `field-${field.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (
      editName.trim() &&
      (editName !== field.name || editType !== field.type)
    ) {
      onUpdate({
        name: editName.trim(),
        type: editType,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(field.name);
    setEditType(field.type);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getTypeColor = (type: FieldType) => {
    const colors = {
      string:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      number: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      integer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      float: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      decimal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      boolean:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      date: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      email: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      url: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      uuid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      json: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      text: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return (
      colors[type] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all ${
        isDragging ? 'shadow-lg border-blue-300 dark:border-blue-600' : ''
      }`}
    >
      <div className="flex items-center space-x-3 flex-1">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        {/* Field content */}
        {isEditing ? (
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Field name"
              autoFocus
            />
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as FieldType)}
              className="px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                title="Save"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Cancel"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center space-x-3 flex-1 cursor-pointer"
            onDoubleClick={() => setIsEditing(true)}
          >
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {field.name}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                  field.type
                )}`}
              >
                {field.type}
              </span>
            </div>

            {/* Field attributes */}
            <div className="flex items-center space-x-1">
              {field.required && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  title="Required"
                >
                  *
                </span>
              )}
              {field.unique && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  title="Unique"
                >
                  U
                </span>
              )}
              {field.defaultValue !== undefined && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  title={`Default: ${field.defaultValue}`}
                >
                  D
                </span>
              )}
              {field.validation.length > 0 && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  title={`${field.validation.length} validation rule${
                    field.validation.length !== 1 ? 's' : ''
                  }`}
                >
                  V
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ required: !field.required });
            }}
            className={`p-1 rounded transition-colors ${
              field.required
                ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
            title={field.required ? 'Make optional' : 'Make required'}
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
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ unique: !field.unique });
            }}
            className={`p-1 rounded transition-colors ${
              field.unique
                ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title={field.unique ? 'Remove unique constraint' : 'Make unique'}
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
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Edit field"
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  `Are you sure you want to delete the "${field.name}" field?`
                )
              ) {
                onDelete();
              }
            }}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete field"
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
      )}
    </div>
  );
}
