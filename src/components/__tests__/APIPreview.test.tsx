import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthConfig, Endpoint, Model } from '../../types';
import APIPreview from '../APIPreview';

// Mock data
const mockModels: Model[] = [
  {
    id: '1',
    name: 'User',
    fields: [
      {
        id: 'field-1',
        name: 'name',
        type: 'string',
        required: true,
        unique: false,
        validation: [],
      },
      {
        id: 'field-2',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        validation: [],
      },
      {
        id: 'field-3',
        name: 'age',
        type: 'integer',
        required: false,
        unique: false,
        validation: [],
      },
    ],
    relationships: [],
    metadata: {
      timestamps: true,
      softDelete: false,
      requiresAuth: true,
      allowedRoles: ['admin', 'user'],
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    name: 'Post',
    fields: [
      {
        id: 'field-4',
        name: 'title',
        type: 'string',
        required: true,
        unique: false,
        validation: [],
      },
      {
        id: 'field-5',
        name: 'content',
        type: 'text',
        required: true,
        unique: false,
        validation: [],
      },
      {
        id: 'field-6',
        name: 'published',
        type: 'boolean',
        required: false,
        unique: false,
        validation: [],
        defaultValue: false,
      },
    ],
    relationships: [],
    metadata: {
      timestamps: true,
      softDelete: false,
      requiresAuth: false,
      allowedRoles: [],
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
];

const mockEndpoints: Endpoint[] = [
  {
    id: 'endpoint-1',
    path: '/users',
    method: 'GET',
    modelName: 'User',
    operation: 'list',
    authenticated: true,
    roles: ['admin'],
    description: 'Get all users',
  },
  {
    id: 'endpoint-2',
    path: '/users',
    method: 'POST',
    modelName: 'User',
    operation: 'create',
    authenticated: true,
    roles: ['admin'],
    description: 'Create a new user',
  },
];

const mockAuthConfig: AuthConfig = {
  type: 'jwt',
  roles: [
    { name: 'admin', permissions: ['read', 'write', 'delete'] },
    { name: 'user', permissions: ['read'] },
  ],
  protectedRoutes: ['/users'],
};

describe('APIPreview', () => {
  const mockOnEndpointTest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<APIPreview models={mockModels} />);

    expect(screen.getByText('API Preview')).toBeInTheDocument();
    expect(screen.getByText('Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Schemas')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  it('displays endpoint count correctly', () => {
    render(<APIPreview models={mockModels} />);

    // Should show generated endpoints (5 per model * 2 models = 10 endpoints)
    expect(screen.getByText('10 endpoints')).toBeInTheDocument();
  });

  it('displays endpoint count correctly with custom endpoints', () => {
    render(<APIPreview models={mockModels} endpoints={mockEndpoints} />);

    expect(screen.getByText('2 endpoints')).toBeInTheDocument();
  });

  it('generates endpoints from models when none provided', () => {
    render(<APIPreview models={mockModels} />);

    // Should generate CRUD endpoints for each model
    expect(screen.getByText('User (5)')).toBeInTheDocument();
    expect(screen.getByText('Post (5)')).toBeInTheDocument();
  });

  it('switches between view modes', () => {
    render(<APIPreview models={mockModels} />);

    // Default is endpoints view
    expect(screen.getByText('User (5)')).toBeInTheDocument();

    // Switch to schemas view
    fireEvent.click(screen.getByText('Schemas'));
    expect(screen.getByText('Data Schemas')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));
    expect(screen.getByText('Interactive Testing')).toBeInTheDocument();
  });

  it('expands and collapses endpoint groups', () => {
    render(<APIPreview models={mockModels} />);

    // Groups should be collapsed by default, expand User group first
    fireEvent.click(screen.getByText('User (5)'));
    expect(screen.getAllByText('/users')[0]).toBeInTheDocument();

    // Collapse User group
    fireEvent.click(screen.getByText('User (5)'));

    // Should not show endpoints anymore
    expect(screen.queryByText('/users')).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(screen.getByText('User (5)'));
    expect(screen.getAllByText('/users')[0]).toBeInTheDocument();
  });

  it('selects and displays endpoint details', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group first
    fireEvent.click(screen.getByText('User (5)'));

    // Click on an endpoint
    const getEndpoint = screen.getAllByText('/users')[0];
    fireEvent.click(getEndpoint);

    // Should show endpoint details
    expect(screen.getByText('Sample Response')).toBeInTheDocument();
  });

  it('shows authentication indicators', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group to see endpoints
    fireEvent.click(screen.getByText('User (5)'));

    // Should show lock icons for authenticated endpoints (SVG elements)
    const lockIcons = document.querySelectorAll(
      'svg[class*="text-yellow-500"]'
    );
    expect(lockIcons.length).toBeGreaterThan(0);
  });

  it('displays sample request data for POST/PUT endpoints', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group first
    fireEvent.click(screen.getByText('User (5)'));

    // Find and click a POST endpoint
    const postButtons = screen.getAllByText('POST');
    fireEvent.click(postButtons[0].closest('button')!);

    // Should show sample request body
    expect(screen.getByText('Sample Request Body')).toBeInTheDocument();
  });

  it('displays sample response data', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group first
    fireEvent.click(screen.getByText('User (5)'));

    // Click on any endpoint
    const getEndpoint = screen.getAllByText('/users')[0];
    fireEvent.click(getEndpoint);

    // Should show sample response
    expect(screen.getByText('Sample Response')).toBeInTheDocument();
  });

  it('shows schemas view with model fields', () => {
    render(<APIPreview models={mockModels} />);

    // Switch to schemas view
    fireEvent.click(screen.getByText('Schemas'));

    // Should show model fields - use getAllByText for fields that appear multiple times
    expect(screen.getAllByText('name')[0]).toBeInTheDocument();
    expect(screen.getAllByText('email')[0]).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();

    // Should show field types
    expect(screen.getAllByText('string')[0]).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('integer')).toBeInTheDocument();
  });

  it('shows required field indicators in schemas', () => {
    render(<APIPreview models={mockModels} />);

    // Switch to schemas view
    fireEvent.click(screen.getByText('Schemas'));

    // Should show Yes/No for required fields
    const yesTexts = screen.getAllByText('Yes');
    const noTexts = screen.getAllByText('No');

    expect(yesTexts.length).toBeGreaterThan(0);
    expect(noTexts.length).toBeGreaterThan(0);
  });

  it('handles endpoint testing', async () => {
    const mockTestResponse = {
      success: true,
      data: { id: '1', name: 'Test User' },
    };
    mockOnEndpointTest.mockResolvedValue(mockTestResponse);

    render(
      <APIPreview models={mockModels} onEndpointTest={mockOnEndpointTest} />
    );

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Find and click a test button
    const testButtons = screen.getAllByText('Test');
    fireEvent.click(testButtons[0]);

    // Should show loading state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Wait for test to complete
    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument();
    });

    // Should call the test function
    expect(mockOnEndpointTest).toHaveBeenCalled();
  });

  it('handles endpoint testing errors', async () => {
    mockOnEndpointTest.mockRejectedValue(new Error('Test error'));

    render(
      <APIPreview models={mockModels} onEndpointTest={mockOnEndpointTest} />
    );

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Find and click a test button
    const testButtons = screen.getAllByText('Test');
    fireEvent.click(testButtons[0]);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('allows editing request data for POST/PUT endpoints', () => {
    render(<APIPreview models={mockModels} />);

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Find a POST endpoint's request body textarea
    const textareas = screen.getAllByPlaceholderText('Request body JSON');
    expect(textareas.length).toBeGreaterThan(0);

    // Should be able to edit the JSON
    const textarea = textareas[0];
    fireEvent.change(textarea, {
      target: {
        value: '{"name": "Updated Name", "email": "updated@example.com"}',
      },
    });

    expect(textarea.value).toContain('Updated Name');
  });

  it('simulates API calls when no test function provided', async () => {
    render(<APIPreview models={mockModels} />);

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Find and click a test button
    const testButtons = screen.getAllByText('Test');
    fireEvent.click(testButtons[0]);

    // Should show loading state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Wait for simulated response
    await waitFor(
      () => {
        expect(screen.getByText('Response')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('displays HTTP method colors correctly', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group to see method badges
    fireEvent.click(screen.getByText('User (5)'));

    // Should show different colored method badges
    const getMethods = screen.getAllByText('GET');
    const postMethods = screen.getAllByText('POST');
    const putMethods = screen.getAllByText('PUT');
    const deleteMethods = screen.getAllByText('DELETE');

    expect(getMethods.length).toBeGreaterThan(0);
    expect(postMethods.length).toBeGreaterThan(0);
    expect(putMethods.length).toBeGreaterThan(0);
    expect(deleteMethods.length).toBeGreaterThan(0);
  });

  it('shows authentication requirements in endpoint details', () => {
    render(<APIPreview models={mockModels} />);

    // Expand User group first
    fireEvent.click(screen.getByText('User (5)'));

    // Click on an authenticated endpoint
    const userEndpoints = screen.getAllByText('/users');
    fireEvent.click(userEndpoints[0]);

    // Should show authentication required message
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
  });

  it('handles empty models gracefully', () => {
    render(<APIPreview models={[]} />);

    expect(screen.getByText('API Preview')).toBeInTheDocument();
    expect(screen.getByText('0 endpoints')).toBeInTheDocument();
  });

  it('updates when models change', () => {
    const { rerender } = render(<APIPreview models={[mockModels[0]]} />);

    expect(screen.getByText('5 endpoints')).toBeInTheDocument();

    // Update with more models
    rerender(<APIPreview models={mockModels} />);

    expect(screen.getByText('10 endpoints')).toBeInTheDocument();
  });

  it('shows response time in test results', async () => {
    const mockTestResponse = { success: true, data: { id: '1' } };
    mockOnEndpointTest.mockResolvedValue(mockTestResponse);

    render(
      <APIPreview models={mockModels} onEndpointTest={mockOnEndpointTest} />
    );

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Test an endpoint
    const testButtons = screen.getAllByText('Test');
    fireEvent.click(testButtons[0]);

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
    });
  });

  it('shows status codes in test results', async () => {
    const mockTestResponse = { success: true, data: { id: '1' } };
    mockOnEndpointTest.mockResolvedValue(mockTestResponse);

    render(
      <APIPreview models={mockModels} onEndpointTest={mockOnEndpointTest} />
    );

    // Switch to testing view
    fireEvent.click(screen.getByText('Testing'));

    // Test an endpoint
    const testButtons = screen.getAllByText('Test');
    fireEvent.click(testButtons[0]);

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });
});
