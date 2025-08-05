'use client';

import { useState } from 'react';
import { ParsedModels, Suggestion, ValidationResult } from '../types';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onParsingComplete?: (
    result: ParsedModels & {
      validation: ValidationResult;
      improvements: Suggestion[];
    }
  ) => void;
  loading?: boolean;
  className?: string;
}

interface ParsePromptResponse {
  success: boolean;
  data: ParsedModels & {
    validation: ValidationResult;
    improvements: Suggestion[];
  };
  error?: string;
  message?: string;
  details?: any;
}

export default function PromptInput({
  onSubmit,
  onParsingComplete,
  loading = false,
  className = '',
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<
    | (ParsedModels & {
        validation: ValidationResult;
        improvements: Suggestion[];
      })
    | null
  >(null);

  // Character limits
  const MIN_LENGTH = 10;
  const MAX_LENGTH = 5000;

  // Validation
  const validatePrompt = (value: string): string[] => {
    const errors: string[] = [];

    if (value.trim().length === 0) {
      errors.push('Please enter a description of your API');
    } else if (value.trim().length < MIN_LENGTH) {
      errors.push(`Description must be at least ${MIN_LENGTH} characters`);
    } else if (value.length > MAX_LENGTH) {
      errors.push(`Description must be less than ${MAX_LENGTH} characters`);
    }

    return errors;
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setPrompt(value);
    setError(null);

    // Real-time validation
    const errors = validatePrompt(value);
    setValidationErrors(errors);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    const errors = validatePrompt(prompt);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setParseResult(null);

    try {
      // Call the onSubmit prop
      onSubmit(prompt);

      // Make API call to parse the prompt
      const response = await fetch('/api/parse-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data: ParsePromptResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to parse prompt');
      }

      if (!data.success) {
        throw new Error(data.error || 'Parsing failed');
      }

      // Set the result and call the callback
      setParseResult(data.data);
      onParsingComplete?.(data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error parsing prompt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setPrompt('');
    setError(null);
    setValidationErrors([]);
    setParseResult(null);
  };

  // Get character count color
  const getCharCountColor = () => {
    const length = prompt.length;
    if (length > MAX_LENGTH * 0.9) return 'text-red-500';
    if (length > MAX_LENGTH * 0.7) return 'text-yellow-500';
    return 'text-gray-500';
  };

  // Check if form is valid
  const isFormValid =
    validationErrors.length === 0 && prompt.trim().length >= MIN_LENGTH;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Describe Your API
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tell us about your application and we'll generate the data models
            and API structure for you.
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Describe your application... For example: 'I need a blog API with users who can create posts and comments. Users should have profiles with names and emails. Posts should have titles, content, and publication dates. Comments should be linked to posts and users.'"
            className={`w-full min-h-[200px] p-4 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              validationErrors.length > 0
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
            disabled={loading || isSubmitting}
            rows={8}
          />

          {/* Character count */}
          <div
            className={`absolute bottom-2 right-2 text-sm ${getCharCountColor()}`}
          >
            {prompt.length}/{MAX_LENGTH}
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <ul className="text-red-600 dark:text-red-400 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Parsing Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || isSubmitting || !prompt}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={loading || isSubmitting || !isFormValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {(loading || isSubmitting) && (
              <svg
                data-testid="loading-spinner"
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
            {loading || isSubmitting ? 'Parsing...' : 'Generate Models'}
          </button>
        </div>
      </form>

      {/* Example prompts */}
      {!prompt && !parseResult && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Example prompts to get you started:
          </h3>
          <div className="space-y-2">
            {[
              'I need an e-commerce API with products, categories, users, and orders. Users should be able to add products to cart and checkout.',
              'Create a social media API where users can create posts, follow other users, and like/comment on posts.',
              'I want a task management system with projects, tasks, and team members. Tasks should have priorities and due dates.',
              'Build a blog platform with authors, articles, categories, and comments. Articles should support tags and publishing status.',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => handleInputChange(example)}
                className="text-left w-full p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parsing Results */}
      {parseResult && (
        <div className="mt-8 space-y-6">
          {/* Success message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Models Generated Successfully
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Found {parseResult.models.length} model
                  {parseResult.models.length !== 1 ? 's' : ''} with{' '}
                  {Math.round(parseResult.confidence * 100)}% confidence
                </p>
              </div>
            </div>
          </div>

          {/* Models summary */}
          {parseResult.models.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Generated Models
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {parseResult.models.map((model) => (
                  <div
                    key={model.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {model.fields.length} field
                      {model.fields.length !== 1 ? 's' : ''}
                      {model.relationships.length > 0 &&
                        `, ${model.relationships.length} relationship${model.relationships.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions and improvements */}
          {(parseResult.suggestions.length > 0 ||
            parseResult.improvements.length > 0) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                Suggestions for Improvement
              </h3>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                {[...parseResult.suggestions, ...parseResult.improvements].map(
                  (suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 mt-1">•</span>
                      <span>{suggestion.message}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Ambiguities */}
          {parseResult.ambiguities.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                Areas that need clarification
              </h3>
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                {parseResult.ambiguities.map((ambiguity, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-1">•</span>
                    <div>
                      <span className="font-medium">"{ambiguity.text}"</span>
                      <div className="mt-1 text-xs">
                        Possible interpretations:{' '}
                        {ambiguity.possibleInterpretations.join(', ')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation errors */}
          {parseResult.validation && !parseResult.validation.isValid && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-3">
                Validation Issues
              </h3>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {parseResult.validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 mt-1">•</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
