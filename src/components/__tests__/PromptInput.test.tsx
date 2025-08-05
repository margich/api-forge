import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParsedModels, Suggestion, ValidationResult } from '../../types';
import PromptInput from '../PromptInput';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockParseResult: ParsedModels & {
  validation: ValidationResult;
  improvements: Suggestion[];
} = {
  models: [
    {
      id: '1',
      name: 'User',
      fields: [
        {
          id: '1',
          name: 'id',
          type: 'uuid',
          required: true,
          unique: true,
          validation: [],
        },
        {
          id: '2',
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
          validation: [],
        },
      ],
      relationships: [],
      metadata: {
        timestamps: true,
        softDelete: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  confidence: 0.9,
  suggestions: [
    {
      type: 'field',
      message: 'Consider adding a name field',
      severity: 'info',
    },
  ],
  ambiguities: [],
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  improvements: [
    {
      type: 'field',
      message: 'Add validation to email field',
      severity: 'info',
    },
  ],
};

describe('PromptInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnParsingComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<PromptInput onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Describe Your API')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Describe your application/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generate Models' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('shows example prompts when no input is provided', () => {
    render(<PromptInput onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText('Example prompts to get you started:')
    ).toBeInTheDocument();
    expect(screen.getByText(/e-commerce API/)).toBeInTheDocument();
    expect(screen.getByText(/social media API/)).toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    await user.clear(textarea);
    await user.type(textarea, 'Test prompt');

    expect(textarea).toHaveValue('Test prompt');
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    await user.clear(textarea);
    await user.type(textarea, 'Test');

    expect(screen.getByText(/4\/5000/)).toBeInTheDocument();
  });

  it('validates minimum length', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'Short');
    fireEvent.submit(submitButton.closest('form')!);

    expect(
      screen.getByText('Description must be at least 10 characters')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates maximum length', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);

    await user.clear(textarea);
    // Use a shorter string to avoid timeout
    const longText = 'a'.repeat(5001);
    fireEvent.change(textarea, { target: { value: longText } });

    await waitFor(() => {
      expect(
        screen.getByText('Description must be less than 5000 characters')
      ).toBeInTheDocument();
    });
  });

  it('validates empty input', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });
    fireEvent.submit(submitButton.closest('form')!);

    expect(
      screen.getByText('Please enter a description of your API')
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'Short');

    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');

    expect(submitButton).not.toBeDisabled();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    await user.clear(textarea);
    await user.type(textarea, 'Test prompt');
    expect(textarea).toHaveValue('Test prompt');

    await user.click(clearButton);
    expect(textarea).toHaveValue('');
  });

  it('fills input when example prompt is clicked', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const exampleButton = screen.getByText(/e-commerce API/);

    await user.click(exampleButton);

    expect(textarea.value).toContain('e-commerce API');
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    expect(screen.getByText('Parsing...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('makes API call on form submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParseResult,
      }),
    });

    render(
      <PromptInput
        onSubmit={mockOnSubmit}
        onParsingComplete={mockOnParsingComplete}
      />
    );

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    const prompt = 'This is a valid prompt with enough characters';
    await user.clear(textarea);
    await user.type(textarea, prompt);
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith('/api/parse-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(prompt);
  });

  it('calls onParsingComplete when API call succeeds', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParseResult,
      }),
    });

    render(
      <PromptInput
        onSubmit={mockOnSubmit}
        onParsingComplete={mockOnParsingComplete}
      />
    );

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnParsingComplete).toHaveBeenCalledWith(mockParseResult);
    });
  });

  it('displays parsing results on successful API call', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParseResult,
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Models Generated Successfully')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Found 1 model with 90% confidence')
      ).toBeInTheDocument();
      expect(screen.getByText('Generated Models')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('2 fields')).toBeInTheDocument();
    });
  });

  it('displays suggestions when provided', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParseResult,
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Suggestions for Improvement')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Consider adding a name field')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Add validation to email field')
      ).toBeInTheDocument();
    });
  });

  it('displays ambiguities when provided', async () => {
    const user = userEvent.setup();
    const resultWithAmbiguities = {
      ...mockParseResult,
      ambiguities: [
        {
          text: 'user profile',
          possibleInterpretations: [
            'User model',
            'Profile model',
            'UserProfile model',
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: resultWithAmbiguities,
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Areas that need clarification')
      ).toBeInTheDocument();
      expect(screen.getByText('"user profile"')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Possible interpretations: User model, Profile model, UserProfile model'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays validation errors when provided', async () => {
    const user = userEvent.setup();
    const resultWithValidationErrors = {
      ...mockParseResult,
      validation: {
        isValid: false,
        errors: [
          {
            field: 'models',
            message: 'Duplicate model names found',
            code: 'DUPLICATE_MODEL_NAMES',
          },
        ],
        warnings: [],
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: resultWithValidationErrors,
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Validation Issues')).toBeInTheDocument();
      expect(
        screen.getByText('Duplicate model names found')
      ).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Invalid request',
        message: 'Prompt too short',
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Parsing Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid request')).toBeInTheDocument();
    });
  });

  it('displays error message on network failure', async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Parsing Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles loading prop correctly', () => {
    render(<PromptInput onSubmit={mockOnSubmit} loading={true} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Parsing...',
    });
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PromptInput onSubmit={mockOnSubmit} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('clears results when clear button is clicked', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockParseResult,
      }),
    });

    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);
    const submitButton = screen.getByRole('button', {
      name: 'Generate Models',
    });

    // Submit and get results
    await user.clear(textarea);
    await user.type(textarea, 'This is a valid prompt with enough characters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Models Generated Successfully')
      ).toBeInTheDocument();
    });

    // Clear the form
    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);

    expect(
      screen.queryByText('Models Generated Successfully')
    ).not.toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('shows character count color based on length', async () => {
    const user = userEvent.setup();
    render(<PromptInput onSubmit={mockOnSubmit} />);

    const textarea = screen.getByPlaceholderText(/Describe your application/);

    // Normal length (gray)
    await user.clear(textarea);
    await user.type(textarea, 'Short text');
    expect(screen.getByText(/10\/5000/)).toHaveClass('text-gray-500');

    // Clear and type longer text (70% of max length)
    await user.clear(textarea);
    const longText = 'a'.repeat(3600);
    fireEvent.change(textarea, { target: { value: longText } });
    await waitFor(() => {
      expect(screen.getByText(/3600\/5000/)).toHaveClass('text-yellow-500');
    });

    // Clear and type very long text (90% of max length)
    await user.clear(textarea);
    const veryLongText = 'a'.repeat(4600);
    fireEvent.change(textarea, { target: { value: veryLongText } });
    await waitFor(() => {
      expect(screen.getByText(/4600\/5000/)).toHaveClass('text-red-500');
    });
  });
});
