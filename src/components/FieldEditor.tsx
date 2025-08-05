'use client';

import { useEffect, useState } from 'react';
import { Field, FieldType, FieldTypes, Model, ValidationRule } from '../types';

interface FieldEditorProps {
  model: Model;
  field: Field;
  onUpdate: (updates: Partial<Field>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FieldEditor({
  model,
  field,
  onUpdate,
  onDelete,
  onClose,
}: FieldEditorProps) {
  const [formData, setFormData] = useState({
    name: field.name,
    type: field.type,
    required: field.required,
    unique: field.unique,
    defaultValue: field.defaultValue || '',
    description: field.description || '',
  });
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(
    field.validation || []
  );
  const [newRule, setNewRule] = useState({
    type: 'minLength' as ValidationRule['type'],
    value: '',
    message: '',
  });

  // Update form when field changes
  useEffect(() => {
    setFormData({
      name: field.name,
      type: field.type,
      required: field.required,
      unique: field.unique,
      defaultValue: field.defaultValue || '',
      description: field.description || '',
    });
    setValidationRules(field.validation || []);
  }, [field]);

  const handleFormChange = (key: keyof typeof formData, value: any) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // Auto-save changes
    const updates: Partial<Field> = {
      [key]: value,
    };

    // Handle default value conversion based on type
    if (key === 'defaultValue') {
      if (value === '') {
        updates.defaultValue = undefined;
      } else {
        switch (formData.type) {
          case 'number':
          case 'integer':
          case 'float':
          case 'decimal':
            updates.defaultValue = Number(value) || 0;
            break;
          case 'boolean':
            updates.defaultValue = value === 'true';
            break;
          default:
            updates.defaultValue = value;
        }
      }
    }

    onUpdate(updates);
  };

  const handleValidationChange = (updatedRules: ValidationRule[]) => {
    setValidationRules(updatedRules);
    onUpdate({ validation: updatedRules });
  };

  const addValidationRule = () => {
    if (!newRule.value.trim()) return;

    const rule: ValidationRule = {
      type: newRule.type,
      value:
        newRule.type === 'minLength' ||
        newRule.type === 'maxLength' ||
        newRule.type === 'min' ||
        newRule.type === 'max'
          ? Number(newRule.value)
          : newRule.value,
      message: newRule.message.trim() || undefined,
    };

    const updatedRules = [...validationRules, rule];
    handleValidationChange(updatedRules);

    setNewRule({
      type: 'minLength',
      value: '',
      message: '',
    });
  };

  const removeValidationRule = (index: number) => {
    const updatedRules = validationRules.filter((_, i) => i !== index);
    handleValidationChange(updatedRules);
  };

  const getValidationRuleOptions = () => {
    const baseOptions = [{ value: 'custom', label: 'Custom' }];

    switch (formData.type) {
      case 'string':
      case 'text':
      case 'email':
      case 'url':
        return [
          { value: 'minLength', label: 'Minimum Length' },
          { value: 'maxLength', label: 'Maximum Length' },
          { value: 'pattern', label: 'Pattern (Regex)' },
          ...baseOptions,
        ];
      case 'number':
      case 'integer':
      case 'float':
      case 'decimal':
        return [
          { value: 'min', label: 'Minimum Value' },
          { value: 'max', label: 'Maximum Value' },
          ...baseOptions,
        ];
      default:
        return baseOptions;
    }
  };

  const getDefaultValueInput = () => {
    switch (formData.type) {
      case 'boolean':
        return (
          <select
            value={formData.defaultValue?.toString() || ''}
            onChange={(e) => handleFormChange('defaultValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">No default</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'number':
      case 'integer':
      case 'float':
      case 'decimal':
        return (
          <input
            type="number"
            value={formData.defaultValue}
            onChange={(e) => handleFormChange('defaultValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter default value"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={formData.defaultValue}
            onChange={(e) => handleFormChange('defaultValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        );
      case 'text':
        return (
          <textarea
            value={formData.defaultValue}
            onChange={(e) => handleFormChange('defaultValue', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            placeholder="Enter default value"
          />
        );
      default:
        return (
          <input
            type="text"
            value={formData.defaultValue}
            onChange={(e) => handleFormChange('defaultValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter default value"
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Field
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {model.name}.{field.name}
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
        {/* Basic Properties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Basic Properties
          </h4>

          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Enter field name"
            />
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                handleFormChange('type', e.target.value as FieldType)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {FieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Optional field description"
            />
          </div>
        </div>

        {/* Constraints */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Constraints
          </h4>

          {/* Required */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={formData.required}
              onChange={(e) => handleFormChange('required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label
              htmlFor="required"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Required field
            </label>
          </div>

          {/* Unique */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="unique"
              checked={formData.unique}
              onChange={(e) => handleFormChange('unique', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label
              htmlFor="unique"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Unique constraint
            </label>
          </div>
        </div>

        {/* Default Value */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Default Value
          </h4>
          {getDefaultValueInput()}
        </div>

        {/* Validation Rules */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Validation Rules
          </h4>

          {/* Existing rules */}
          {validationRules.length > 0 && (
            <div className="space-y-2">
              {validationRules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {rule.type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.value}
                      </span>
                    </div>
                    {rule.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {rule.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeValidationRule(index)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
              ))}
            </div>
          )}

          {/* Add new rule */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Type
                </label>
                <select
                  value={newRule.type}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      type: e.target.value as ValidationRule['type'],
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {getValidationRuleOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type={
                    newRule.type === 'minLength' ||
                    newRule.type === 'maxLength' ||
                    newRule.type === 'min' ||
                    newRule.type === 'max'
                      ? 'number'
                      : 'text'
                  }
                  value={newRule.value}
                  onChange={(e) =>
                    setNewRule({ ...newRule, value: e.target.value })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter value"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Error Message (Optional)
              </label>
              <input
                type="text"
                value={newRule.message}
                onChange={(e) =>
                  setNewRule({ ...newRule, message: e.target.value })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Custom error message"
              />
            </div>
            <button
              onClick={addValidationRule}
              disabled={!newRule.value.trim()}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Rule
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (
                confirm(
                  `Are you sure you want to delete the "${field.name}" field?`
                )
              ) {
                onDelete();
              }
            }}
            className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            Delete Field
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
