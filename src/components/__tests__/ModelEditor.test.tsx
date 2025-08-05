import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Model } from '../../types';
import ModelEditor from '../ModelEditor';

// Mock ReactFlow
vi.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Background: () => <div data-testid="background" />,
  BackgroundVariant: { Dots: 'dots' },
  Position: { Left: 'left', Right: 'right' },
  Handle: () => <div data-testid="handle" />,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: vi.fn((array, oldIndex, newIndex) => {
    const result = [...array];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  }),
  verticalListSortingStrategy: 'vertical',
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

const mockModels: Model[] = [
  {
    id: 'model-1',
    name: 'User',
    fields: [
      {
        id: 'field-1',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        validation: [],
      },
      {
        id: 'field-2',
        name: 'name',
        type: 'string',
        required: true,
        unique: false,
        validation: [],
      },
    ],
    relationships: [],
    metadata: {
      timestamps: true,
      softDelete: false,
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'model-2',
    name: 'Post',
    fields: [
      {
        id: 'field-3',
        name: 'title',
        type: 'string',
        required: true,
        unique: false,
        validation: [],
      },
    ],
    relationships: [
      {
        id: 'rel-1',
        type: 'oneToMany',
        sourceModel: 'User',
        targetModel: 'Post',
        sourceField: 'id',
        targetField: 'userId',
        cascadeDelete: false,
      },
    ],
    metadata: {
      timestamps: true,
      softDelete: false,
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
];

describe('ModelEditor', () => {
  const mockOnModelChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with models', () => {
    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    expect(screen.getByText('Model Editor')).toBeInTheDocument();
    expect(screen.getByText('2 models')).toBeInTheDocument();
    expect(screen.getByText('Add Model')).toBeInTheDocument();
  });

  it('renders empty state when no models', () => {
    render(<ModelEditor models={[]} onModelChange={mockOnModelChange} />);

    expect(screen.getByText('0 models')).toBeInTheDocument();
  });

  it('switches between canvas and list view', async () => {
    const user = userEvent.setup();

    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    // Should start in canvas view
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // Switch to list view
    await user.click(screen.getByText('List'));

    // Canvas should be hidden, list should be visible
    expect(screen.queryByTestId('react-flow')).not.toBeInTheDocument();
  });

  it('adds a new model', async () => {
    const user = userEvent.setup();

    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    await user.click(screen.getByText('Add Model'));

    expect(mockOnModelChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockModels,
        expect.objectContaining({
          name: 'Model3',
          fields: [],
          relationships: [],
        }),
      ])
    );
  });

  it('handles model updates', () => {
    const { rerender } = render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    // Simulate a model update by re-rendering with updated models
    const updatedModels = [
      { ...mockModels[0], name: 'UpdatedUser' },
      mockModels[1],
    ];

    rerender(
      <ModelEditor models={updatedModels} onModelChange={mockOnModelChange} />
    );

    // The component should handle the updated models
    expect(screen.getByText('2 models')).toBeInTheDocument();
  });

  it('handles drag and drop operations', () => {
    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    // The DnD context should be rendered
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  it('shows model count correctly', () => {
    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    expect(screen.getByText('2 models')).toBeInTheDocument();
  });

  it('shows singular model count', () => {
    render(
      <ModelEditor models={[mockModels[0]]} onModelChange={mockOnModelChange} />
    );

    expect(screen.getByText('1 model')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ModelEditor
        models={mockModels}
        onModelChange={mockOnModelChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles view mode state correctly', async () => {
    const user = userEvent.setup();

    render(
      <ModelEditor models={mockModels} onModelChange={mockOnModelChange} />
    );

    // Canvas button should be active initially
    const canvasButton = screen.getByText('Canvas');
    const listButton = screen.getByText('List');

    expect(canvasButton).toHaveClass('bg-blue-100');
    expect(listButton).not.toHaveClass('bg-blue-100');

    // Switch to list view
    await user.click(listButton);

    expect(listButton).toHaveClass('bg-blue-100');
    expect(canvasButton).not.toHaveClass('bg-blue-100');
  });

  it('handles empty models array', () => {
    render(<ModelEditor models={[]} onModelChange={mockOnModelChange} />);

    expect(screen.getByText('0 models')).toBeInTheDocument();
    expect(screen.getByText('Add Model')).toBeInTheDocument();
  });

  it('maintains component structure with complex models', () => {
    const complexModel: Model = {
      id: 'complex-model',
      name: 'ComplexModel',
      fields: Array.from({ length: 10 }, (_, i) => ({
        id: `field-${i}`,
        name: `field${i}`,
        type: 'string' as const,
        required: i % 2 === 0,
        unique: i % 3 === 0,
        validation: [],
      })),
      relationships: [
        {
          id: 'rel-complex',
          type: 'manyToMany',
          sourceModel: 'ComplexModel',
          targetModel: 'User',
          sourceField: 'id',
          targetField: 'id',
          cascadeDelete: true,
        },
      ],
      metadata: {
        timestamps: true,
        softDelete: true,
        description: 'A complex model for testing',
        tableName: 'complex_models',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(
      <ModelEditor models={[complexModel]} onModelChange={mockOnModelChange} />
    );

    expect(screen.getByText('Model Editor')).toBeInTheDocument();
    expect(screen.getByText('1 model')).toBeInTheDocument();
  });
});
