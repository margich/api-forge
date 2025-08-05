'use client';

import { useEffect, useState } from 'react';
import {
  Model,
  Relationship,
  RelationshipType,
  RelationshipTypes,
} from '../types';

interface RelationshipEditorProps {
  models: Model[];
  relationship: Relationship;
  onUpdate: (updates: Partial<Relationship>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function RelationshipEditor({
  models,
  relationship,
  onUpdate,
  onDelete,
  onClose,
}: RelationshipEditorProps) {
  const [formData, setFormData] = useState({
    type: relationship.type,
    sourceModel: relationship.sourceModel,
    targetModel: relationship.targetModel,
    sourceField: relationship.sourceField,
    targetField: relationship.targetField,
    cascadeDelete: relationship.cascadeDelete,
  });

  // Update form when relationship changes
  useEffect(() => {
    setFormData({
      type: relationship.type,
      sourceModel: relationship.sourceModel,
      targetModel: relationship.targetModel,
      sourceField: relationship.sourceField,
      targetField: relationship.targetField,
      cascadeDelete: relationship.cascadeDelete,
    });
  }, [relationship]);

  const handleFormChange = (key: keyof typeof formData, value: any) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // Auto-save changes
    onUpdate({ [key]: value });
  };

  const sourceModel = models.find((m) => m.name === formData.sourceModel);
  const targetModel = models.find((m) => m.name === formData.targetModel);

  const getRelationshipDescription = () => {
    switch (formData.type) {
      case 'oneToOne':
        return 'Each record in the source model is related to exactly one record in the target model, and vice versa.';
      case 'oneToMany':
        return 'Each record in the source model can be related to multiple records in the target model, but each target record relates to only one source record.';
      case 'manyToMany':
        return 'Records in both models can be related to multiple records in the other model. This typically requires a junction table.';
      default:
        return '';
    }
  };

  const getFieldOptions = (model: Model | undefined) => {
    if (!model) return [];
    return model.fields.map((field) => ({
      value: field.name,
      label: `${field.name} (${field.type})`,
    }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Relationship
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formData.sourceModel} → {formData.targetModel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Relationship Type */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Relationship Type
          </h4>

          <div className="space-y-3">
            {RelationshipTypes.map((type) => (
              <label
                key={type}
                className="flex items-start space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="relationshipType"
                  value={type}
                  checked={formData.type === type}
                  onChange={(e) =>
                    handleFormChange('type', e.target.value as RelationshipType)
                  }
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {type === 'oneToOne' && 'One-to-One'}
                    {type === 'oneToMany' && 'One-to-Many'}
                    {type === 'manyToMany' && 'Many-to-Many'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {type === formData.type && getRelationshipDescription()}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Models */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Models
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Source Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Model
              </label>
              <select
                value={formData.sourceModel}
                onChange={(e) =>
                  handleFormChange('sourceModel', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Model
              </label>
              <select
                value={formData.targetModel}
                onChange={(e) =>
                  handleFormChange('targetModel', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {models
                  .filter((model) => model.name !== formData.sourceModel)
                  .map((model) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Relationship Fields
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Source Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Field
              </label>
              <select
                value={formData.sourceField}
                onChange={(e) =>
                  handleFormChange('sourceField', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={!sourceModel}
              >
                {getFieldOptions(sourceModel).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!sourceModel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a source model first
                </p>
              )}
            </div>

            {/* Target Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Field
              </label>
              <select
                value={formData.targetField}
                onChange={(e) =>
                  handleFormChange('targetField', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={!targetModel}
              >
                {getFieldOptions(targetModel).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!targetModel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a target model first
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Field Selection Guide:</p>
                <ul className="space-y-1">
                  <li>
                    • <strong>One-to-One:</strong> Usually use primary keys (id
                    fields)
                  </li>
                  <li>
                    • <strong>One-to-Many:</strong> Source uses primary key,
                    target uses foreign key
                  </li>
                  <li>
                    • <strong>Many-to-Many:</strong> Both typically use primary
                    keys (junction table created automatically)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Options
          </h4>

          {/* Cascade Delete */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="cascadeDelete"
              checked={formData.cascadeDelete}
              onChange={(e) =>
                handleFormChange('cascadeDelete', e.target.checked)
              }
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <div className="flex-1">
              <label
                htmlFor="cascadeDelete"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cascade Delete
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                When a source record is deleted, automatically delete related
                target records. Use with caution as this can result in data
                loss.
              </p>
            </div>
          </div>
        </div>

        {/* Relationship Preview */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Relationship Preview
          </h4>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="w-16 h-12 bg-blue-100 dark:bg-blue-900 rounded border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    {formData.sourceModel}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formData.sourceField}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-1">
                  {formData.type === 'oneToOne' && (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-8 h-0.5 bg-gray-400"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </>
                  )}
                  {formData.type === 'oneToMany' && (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-8 h-0.5 bg-gray-400"></div>
                      <div className="flex flex-col space-y-0.5">
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                      </div>
                    </>
                  )}
                  {formData.type === 'manyToMany' && (
                    <>
                      <div className="flex flex-col space-y-0.5">
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                      </div>
                      <div className="w-8 h-0.5 bg-gray-400"></div>
                      <div className="flex flex-col space-y-0.5">
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                        <div className="w-2 h-0.5 bg-gray-400"></div>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formData.type}
                </div>
              </div>

              <div className="text-center">
                <div className="w-16 h-12 bg-green-100 dark:bg-green-900 rounded border-2 border-green-300 dark:border-green-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-green-800 dark:text-green-200">
                    {formData.targetModel}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formData.targetField}
                </div>
              </div>
            </div>

            {formData.cascadeDelete && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span>Cascade delete enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (
                confirm('Are you sure you want to delete this relationship?')
              ) {
                onDelete();
              }
            }}
            className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            Delete Relationship
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
