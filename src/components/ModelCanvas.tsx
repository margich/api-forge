'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Field, Model, Relationship } from '../types';
import ModelNode from './ModelNode';

interface ModelCanvasProps {
  models: Model[];
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
  onModelUpdate: (modelId: string, updates: Partial<Model>) => void;
  onModelDelete: (modelId: string) => void;
  onFieldAdd: (modelId: string) => void;
  onFieldUpdate: (
    modelId: string,
    fieldId: string,
    updates: Partial<Field>
  ) => void;
  onFieldDelete: (modelId: string, fieldId: string) => void;
  onRelationshipAdd: (sourceModelId: string, targetModelId: string) => void;
  onRelationshipUpdate: (
    modelId: string,
    relationshipId: string,
    updates: Partial<Relationship>
  ) => void;
  onRelationshipDelete: (modelId: string, relationshipId: string) => void;
  onEditModel: (modelId: string) => void;
  onEditField: (modelId: string, fieldId: string) => void;
  onEditRelationship: (modelId: string, relationshipId: string) => void;
}

const nodeTypes: NodeTypes = {
  modelNode: ModelNode,
};

export default function ModelCanvas({
  models,
  selectedModelId,
  onModelSelect,
  onModelUpdate,
  onModelDelete,
  onFieldAdd,
  onFieldUpdate,
  onFieldDelete,
  onRelationshipAdd,
  onRelationshipUpdate,
  onRelationshipDelete,
  onEditModel,
  onEditField,
  onEditRelationship,
}: ModelCanvasProps) {
  // Convert models to nodes
  const initialNodes: Node[] = useMemo(() => {
    return models.map((model, index) => ({
      id: model.id,
      type: 'modelNode',
      position: {
        x: (index % 3) * 350 + 50,
        y: Math.floor(index / 3) * 300 + 50,
      },
      data: {
        model,
        isSelected: selectedModelId === model.id,
        onSelect: () => onModelSelect(model.id),
        onUpdate: (updates: Partial<Model>) => onModelUpdate(model.id, updates),
        onDelete: () => onModelDelete(model.id),
        onFieldAdd: () => onFieldAdd(model.id),
        onFieldUpdate: (fieldId: string, updates: Partial<Field>) =>
          onFieldUpdate(model.id, fieldId, updates),
        onFieldDelete: (fieldId: string) => onFieldDelete(model.id, fieldId),
        onEditModel: () => onEditModel(model.id),
        onEditField: (fieldId: string) => onEditField(model.id, fieldId),
      },
      dragHandle: '.model-drag-handle',
    }));
  }, [
    models,
    selectedModelId,
    onModelSelect,
    onModelUpdate,
    onModelDelete,
    onFieldAdd,
    onFieldUpdate,
    onFieldDelete,
    onEditModel,
    onEditField,
  ]);

  // Convert relationships to edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    models.forEach((model) => {
      model.relationships.forEach((relationship) => {
        const targetModel = models.find(
          (m) => m.name === relationship.targetModel
        );
        if (targetModel) {
          edges.push({
            id: relationship.id,
            source: model.id,
            target: targetModel.id,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: getRelationshipColor(relationship.type),
              strokeWidth: 2,
            },
            markerEnd: {
              type: getMarkerType(relationship.type),
              color: getRelationshipColor(relationship.type),
            },
            label: relationship.type,
            labelStyle: {
              fontSize: 12,
              fontWeight: 500,
            },
            labelBgStyle: {
              fill: 'white',
              fillOpacity: 0.8,
            },
            data: {
              relationship,
              sourceModel: model,
              targetModel,
              onEdit: () => onEditRelationship(model.id, relationship.id),
              onDelete: () => onRelationshipDelete(model.id, relationship.id),
            },
          });
        }
      });
    });

    return edges;
  }, [models, onEditRelationship, onRelationshipDelete]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when models change
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when relationships change
  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        onRelationshipAdd(params.source, params.target);
      }
    },
    [onRelationshipAdd]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onModelSelect(node.id);
    },
    [onModelSelect]
  );

  const onPaneClick = useCallback(() => {
    onModelSelect(null);
  }, [onModelSelect]);

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionLineType="smoothstep"
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: '#3b82f6',
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          position="top-left"
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        />
        <MiniMap
          position="top-right"
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          nodeColor={(node) => {
            if (node.id === selectedModelId) return '#3b82f6';
            return '#6b7280';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e5e7eb"
          className="dark:opacity-20"
        />
      </ReactFlow>

      {/* Instructions */}
      {models.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Models Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first model to start building your API structure
            </p>
          </div>
        </div>
      )}

      {/* Connection instructions */}
      {models.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg max-w-xs">
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
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Create Relationships
              </p>
              <p>
                Drag from one model's connection point to another to create
                relationships between models.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRelationshipColor(type: Relationship['type']): string {
  switch (type) {
    case 'oneToOne':
      return '#10b981'; // green
    case 'oneToMany':
      return '#3b82f6'; // blue
    case 'manyToMany':
      return '#f59e0b'; // amber
    default:
      return '#6b7280'; // gray
  }
}

function getMarkerType(type: Relationship['type']): string {
  switch (type) {
    case 'oneToOne':
      return 'arrowclosed';
    case 'oneToMany':
      return 'arrowclosed';
    case 'manyToMany':
      return 'arrowclosed';
    default:
      return 'arrowclosed';
  }
}
