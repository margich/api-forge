import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Field, Model } from '../../types';
import FieldEditor from '../FieldEditor';

const mockModel: Model = {
  id: 'model-1',
  name: 'User',
  fields: [],
  relationships: [],
  metadata: {
    timestamps: true,
    softDelete: false,
  },
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
};

const mockField: Field = {
  id: 'field-1',
  name: 'email',
  type: 'email',
  required: true,
  unique: false,
  validation: [
    {
      type: 'minLength',
      value: 5,
      message: 'Email must be at least 5 characters',
    },
  ],
  description: 'User email address',
  defaultValue: 'user@example.com',
};

describe('FieldEditor', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders field editor with field data', () => {
    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Field')).toBeInTheDocument();
    expect(screen.getByText('User.email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User email address')).toBeInTheDocument();
  });

  it('updates field name', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const nameInput = screen.getByDisplayValue('email');
    await user.clear(nameInput);
    await user.type(nameInput, 'username');

    expect(mockOnUpdate).toHaveBeenCalledWith({ name: 'username' });
  });

  it('updates field type', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const typeSelect = screen.getByDisplayValue('email');
    await user.selectOptions(typeSelect, 'string');

    expect(mockOnUpdate).toHaveBeenCalledWith({ type: 'string' });
  });

  it('toggles required constraint', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const requiredCheckbox = screen.getByLabelText('Required field');
    expect(requiredCheckbox).toBeChecked();

    await user.click(requiredCheckbox);

    expect(mockOnUpdate).toHaveBeenCalledWith({ required: false });
  });

  it('toggles unique constraint', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const uniqueCheckbox = screen.getByLabelText('Unique constraint');
    expect(uniqueCheckbox).not.toBeChecked();

    await user.click(uniqueCheckbox);

    expect(mockOnUpdate).toHaveBeenCalledWith({ unique: true });
  });

  it('updates description', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const descriptionInput = screen.getByDisplayValue('User email address');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description');

    expect(mockOnUpdate).toHaveBeenCalledWith({
      description: 'Updated description',
    });
  });

  it('updates default value for string field', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const defaultValueInput = screen.getByDisplayValue('user@example.com');
    await user.clear(defaultValueInput);
    await user.type(defaultValueInput, 'new@example.com');

    expect(mockOnUpdate).toHaveBeenCalledWith({
      defaultValue: 'new@example.com',
    });
  });

  it('handles boolean default value', () => {
    const booleanField: Field = {
      ...mockField,
      type: 'boolean',
      defaultValue: true,
    };

    render(
      <FieldEditor
        model={mockModel}
        field={booleanField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('true')).toBeInTheDocument();
  });

  it('handles number default value', async () => {
    const user = userEvent.setup();
    const numberField: Field = {
      ...mockField,
      type: 'number',
      defaultValue: 42,
    };

    render(
      <FieldEditor
        model={mockModel}
        field={numberField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const defaultValueInput = screen.getByDisplayValue('42');
    await user.clear(defaultValueInput);
    await user.type(defaultValueInput, '100');

    expect(mockOnUpdate).toHaveBeenCalledWith({ defaultValue: '100' });
  });

  it('displays existing validation rules', () => {
    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('minLength')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(
      screen.getByText('Email must be at least 5 characters')
    ).toBeInTheDocument();
  });

  it('adds new validation rule', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Find the value input for new rule
    const valueInputs = screen.getAllByPlaceholderText('Enter value');
    const newRuleValueInput = valueInputs[valueInputs.length - 1];

    await user.type(newRuleValueInput, '10');

    const addRuleButton = screen.getByText('Add Rule');
    await user.click(addRuleButton);

    expect(mockOnUpdate).toHaveBeenCalledWith({
      validation: [
        ...mockField.validation,
        {
          type: 'minLength',
          value: 10,
        },
      ],
    });
  });

  it('removes validation rule', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    // Find the delete button for validation rule (not the main delete button)
    const validationDeleteButton = deleteButtons.find((button) =>
      button.closest('.bg-gray-50, .dark\\:bg-gray-700')
    );

    if (validationDeleteButton) {
      await user.click(validationDeleteButton);
    }

    expect(mockOnUpdate).toHaveBeenCalledWith({ validation: [] });
  });

  it('shows appropriate validation options for string fields', () => {
    render(
      <FieldEditor
        model={mockModel}
        field={{ ...mockField, type: 'string' }}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Check that string-specific validation options are available
    expect(screen.getByText('Minimum Length')).toBeInTheDocument();
    expect(screen.getByText('Maximum Length')).toBeInTheDocument();
    expect(screen.getByText('Pattern (Regex)')).toBeInTheDocument();
  });

  it('shows appropriate validation options for number fields', () => {
    render(
      <FieldEditor
        model={mockModel}
        field={{ ...mockField, type: 'number' }}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Check that number-specific validation options are available
    expect(screen.getByText('Minimum Value')).toBeInTheDocument();
    expect(screen.getByText('Maximum Value')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('Delete Field');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete the "email" field?'
    );
    expect(mockOnDelete).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();

    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByText('Delete Field');
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const closeButtons = screen.getAllByText('Done');
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={mockField}
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

  it('handles empty default value correctly', async () => {
    const user = userEvent.setup();

    render(
      <FieldEditor
        model={mockModel}
        field={{ ...mockField, defaultValue: undefined }}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const defaultValueInput = screen.getByPlaceholderText(
      'Enter default value'
    );
    await user.type(defaultValueInput, 'test');

    expect(mockOnUpdate).toHaveBeenCalledWith({ defaultValue: 'test' });
  });

  it('updates form data when field prop changes', () => {
    const { rerender } = render(
      <FieldEditor
        model={mockModel}
        field={mockField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const updatedField = { ...mockField, name: 'username' };

    rerender(
      <FieldEditor
        model={mockModel}
        field={updatedField}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('username')).toBeInTheDocument();
  });
});
