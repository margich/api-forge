'use client';

import { useState } from 'react';
import { PromptInput } from '../components';
import { ParsedModels, Suggestion, ValidationResult } from '../types';

export default function Home() {
  const [parseResult, setParseResult] = useState<
    | (ParsedModels & {
        validation: ValidationResult;
        improvements: Suggestion[];
      })
    | null
  >(null);

  const handlePromptSubmit = (prompt: string) => {
    console.log('Prompt submitted:', prompt);
  };

  const handleParsingComplete = (
    result: ParsedModels & {
      validation: ValidationResult;
      improvements: Suggestion[];
    }
  ) => {
    console.log('Parsing complete:', result);
    setParseResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            API Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transform your ideas into production-ready APIs with natural
            language descriptions
          </p>
        </div>

        <PromptInput
          onSubmit={handlePromptSubmit}
          onParsingComplete={handleParsingComplete}
          className="mb-8"
        />

        {parseResult && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Next Steps
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Great! We've analyzed your description and extracted{' '}
                {parseResult.models.length} model
                {parseResult.models.length !== 1 ? 's' : ''}. You can now
                proceed to the visual model editor to refine your data
                structure.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                  Open Model Editor
                </button>
                <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                  View Raw Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
