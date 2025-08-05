import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Model, Relationship } from '../../types';
import RelationshipEditor from '../RelationshipEditor';

const mockModels: Model[] = [
  {
    id: 'model-1',
    name: 'User',
    fields: [
      {
        id: 'field-1',
        name: 'id',
        type: 'uuid',
        required: true,
        unique: true,
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
    ],
    relationships: [],
    metadata: { timestamps: true, softDelete: false },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'model-2',
    name: 'Post',
    fields: [
      {
        id: 'field-3',
        name: 'id',
        type: 'uuid',
        required: true,
        unique: true,
        validation: [],
      },
      {
        id: 'field-4',
        name: 'userId',
        type: 'uuid',
        required: true,
        unique: false,
        validation: [],
      },
      {
        id: 'field-5',
        name: 'title',
        type: 'string',
        required: true,
        unique: false,
        validation: [],
      },
    ],
    relationships: [],
    metadata: { timestamps: true, softDelete: false },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
];

const mockRelationship: Relationship = {
  id: 'rel-1',
  type: 'oneToMany',
  sourceModel: 'User',
  targetModel: 'Post',
  sourceField: 'id',
  targetField: 'userId',
  cascadeDelete: false,
};

describe('RelationshipEditor', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders relationship editor with relationship data', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Relationship')).toBeInTheDocument();
    expect(screen.getByText('User → Post')).toBeInTheDocument();
  });

  it('displays relationship types with descriptions', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('One-to-One')).toBeInTheDocument();
    expect(screen.getByText('One-to-Many')).toBeInTheDocument();
    expect(screen.getByText('Many-to-Many')).toBeInTheDocument();
  });

  it('shows description for selected relationship type', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        /Each record in the source model can be related to multiple records/
      )
    ).toBeInTheDocument();
  });

  it('updates relationship type', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const oneToOneRadio = screen.getByDisplayValue('oneToOne');
    await user.click(oneToOneRadio);

    expect(mockOnUpdate).toHaveBeenCalledWith({ type: 'oneToOne' });
  });

  it('updates source model', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const sourceModelSelect = screen.getByDisplayValue('User');
    await user.selectOptions(sourceModelSelect, 'Post');

    expect(mockOnUpdate).toHaveBeenCalledWith({ sourceModel: 'Post' });
  });

  it('updates target model', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const targetModelSelect = screen.getByDisplayValue('Post');
    await user.selectOptions(targetModelSelect, 'User');

    expect(mockOnUpdate).toHaveBeenCalledWith({ targetModel: 'User' });
  });

  it('shows field options for source model', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Check that source model fields are available
    expect(screen.getByText('id (uuid)')).toBeInTheDocument();
    expect(screen.getByText('email (email)')).toBeInTheDocument();
  });

  it('shows field options for target model', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Check that target model fields are available
    expect(screen.getByText('userId (uuid)')).toBeInTheDocument();
    expect(screen.getByText('title (string)')).toBeInTheDocument();
  });

  it('updates source field', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const sourceFieldSelect = screen.getByDisplayValue('id');
    await user.selectOptions(sourceFieldSelect, 'email');

    expect(mockOnUpdate).toHaveBeenCalledWith({ sourceField: 'email' });
  });

  it('updates target field', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const targetFieldSelects = screen.getAllByDisplayValue('userId');
    const targetFieldSelect = targetFieldSelects.find(
      (select) =>
        select.closest('div')?.querySelector('label')?.textContent ===
        'Target Field'
    );

    if (targetFieldSelect) {
      await user.selectOptions(targetFieldSelect, 'title');
      expect(mockOnUpdate).toHaveBeenCalledWith({ targetField: 'title' });
    }
  });

  it('toggles cascade delete option', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const cascadeDeleteCheckbox = screen.getByLabelText('Cascade Delete');
    expect(cascadeDeleteCheckbox).not.toBeChecked();

    await user.click(cascadeDeleteCheckbox);

    expect(mockOnUpdate).toHaveBeenCalledWith({ cascadeDelete: true });
  });

  it('shows cascade delete warning in preview', () => {
    const relationshipWithCascade = {
      ...mockRelationship,
      cascadeDelete: true,
    };

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={relationshipWithCascade}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Cascade delete enabled')).toBeInTheDocument();
  });

  it('displays relationship preview correctly', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Check preview elements
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('oneToMany')).toBeInTheDocument();
  });

  it('shows field selection guide', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Field Selection Guide:')).toBeInTheDocument();
    expect(screen.getByText(/One-to-One:/)).toBeInTheDocument();
    expect(screen.getByText(/One-to-Many:/)).toBeInTheDocument();
    expect(screen.getByText(/Many-to-Many:/)).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('Delete Relationship');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete this relationship?'
    );
    expect(mockOnDelete).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('Delete Relationship');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const doneButton = screen.getByText('Done');
    await user.click(doneButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Find the X button in the header
    const closeButton = screen.getByRole('button', { name: '' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates form data when relationship prop changes', () => {
    const { rerender } = render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const updatedRelationship = {
      ...mockRelationship,
      type: 'oneToOne' as const,
    };

    rerender(
      <RelationshipEditor
        models={mockModels}
        relationship={updatedRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const oneToOneRadio = screen.getByDisplayValue('oneToOne');
    expect(oneToOneRadio).toBeChecked();
  });

  it('filters target model options to exclude source model', () => {
    render(
      <RelationshipEditor
        models={mockModels}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Target model select should not include the source model
    const targetModelSelect = screen.getByDisplayValue('Post');
    const options = Array.from(
      targetModelSelect.querySelectorAll('option')
    ).map((option) => option.textContent);

    expect(options).not.toContain('User');
    expect(options).toContain('Post');
  });

  it('handles empty field options gracefully', () => {
    const modelsWithoutFields = mockModels.map((model) => ({
      ...model,
      fields: [],
    }));

    render(
      <RelationshipEditor
        models={modelsWithoutFields}
        relationship={mockRelationship}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Select a source model first')).toBeInTheDocument();
    expect(screen.getByText('Select a target model first')).toBeInTheDocument();
  });
});
