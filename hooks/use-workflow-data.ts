import { useCallback, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import { NodeRegistry, type DataTableSpec } from '@/lib/nodes/core';
import { serializeWorkflowForStorage } from '@/lib/workflow/utils';

interface UseWorkflowDataProps {
  chatId?: string;
  session?: any;
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setShouldSave: (should: boolean) => void;
  readonly?: boolean;
  initialWorkflow?: {
    title: string;
    content: string;
    createdAt: string;
    sharedId?: string;
  };
  nodeCallbacks: {
    onConfigure: (id: string) => void;
    onViewResult: (id: string) => void;
    onExecute: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
  };
  workflowData?: any;
}

export const useWorkflowData = ({
  chatId,
  session,
  setNodes,
  setEdges,
  setShouldSave,
  readonly = false,
  initialWorkflow,
  nodeCallbacks,
  workflowData,
}: UseWorkflowDataProps) => {
  const registry = NodeRegistry.getInstance();
  
  // Create a ref to store the latest callbacks without causing re-renders
  const nodeCallbacksRef = useRef(nodeCallbacks);
  nodeCallbacksRef.current = nodeCallbacks;
  
  // Function to reconstruct nodes from saved workflow data
  const reconstructNodesFromData = useCallback(
    (workflowData: any, callbacks?: any) => {
      if (!workflowData.nodes || !workflowData.edges) {
        return { nodes: [], edges: [] };
      }

      const reconstructedNodes = workflowData.nodes
        .map((nodeData: any, index: number) => {
          const factoryId =
            nodeData.data?.factoryId || nodeData.factoryId || nodeData.id;

          const factory = registry.getFactory(factoryId);
          if (!factory) {
            return null;
          }

          const metadata = factory.getNodeMetadata();
          const nodeModel = factory.createNodeModel();

          // Load saved settings into the node model
          const savedSettings =
            nodeData.data?.settings || nodeData.settings || {};
          if (Object.keys(savedSettings).length > 0) {
            // For chart nodes, we need to handle the dataMapping properly and ensure it's preserved
            const settingsForModel = {
              getString: (key: string, defaultValue?: string) => {
                if (key === 'dataMapping' && savedSettings.dataMapping) {
                  // Handle both string and object formats
                  if (typeof savedSettings.dataMapping === 'string') {
                    return savedSettings.dataMapping;
                  } else if (typeof savedSettings.dataMapping === 'object') {
                    return JSON.stringify(savedSettings.dataMapping);
                  }
                }
                return (savedSettings as any)[key] || defaultValue || '';
              },
              getNumber: (key: string, defaultValue?: number) => {
                const value = (savedSettings as any)[key];
                return typeof value === 'number' ? value : defaultValue || 0;
              },
              set: (key: string, value: any) => {
                (savedSettings as any)[key] = value;
              },
              // Also expose the raw settings for fallback reconstruction
              ...savedSettings,
            };

            // Load settings into the node model
            if (typeof nodeModel.loadSettings === 'function') {
              nodeModel.loadSettings(settingsForModel);
            }
          }

          const reconstructedNode = {
            id: nodeData.id,
            type: nodeData.type || 'customNode',
            position: nodeData.position,
            data: {
              label: metadata.name,
              factory,
              factoryId,
              icon: metadata.icon,
              image: metadata.image,
              // Preserve execution state if available, otherwise default to idle
              status: nodeData.data?.status || 'idle',
              executed: nodeData.data?.executed || false,
              inputPorts: nodeModel.getInputPortCount(),
              outputPorts: nodeModel.getOutputPortCount(),
              settings: savedSettings,
              // Preserve outputs and error state from the workflow data
              outputs: nodeData.data?.outputs || undefined,
              error: nodeData.data?.error || undefined,
              // Use passed callbacks or empty functions as fallback
              onConfigure: callbacks?.onConfigure || (() => {}),
              onViewResult: callbacks?.onViewResult || (() => {}),
              onExecute: callbacks?.onExecute || (() => {}),
              onDuplicate: callbacks?.onDuplicate || (() => {}),
              onDelete: callbacks?.onDelete || (() => {}),
            },
          };

          return reconstructedNode;
        })
        .filter(Boolean);

      // Also reconstruct edges to ensure they have proper ReactFlow format
      const reconstructedEdges = (workflowData.edges || []).map(
        (edgeData: any, index: number) => {
          // If it's already a ReactFlow edge format, return as-is
          if (edgeData.source && edgeData.target && edgeData.id) {
            return edgeData;
          }

          // If it's a simplified format, convert it
          if (edgeData.from && edgeData.to) {
            return {
              id:
                edgeData.id ||
                `reactflow__edge-${edgeData.from}source-0-${edgeData.to}target-0`,
              source: edgeData.from,
              sourceHandle: 'source-0',
              target: edgeData.to,
              targetHandle: 'target-0',
            };
          }

          return edgeData;
        },
      );

      return {
        nodes: reconstructedNodes,
        edges: reconstructedEdges,
      };
    },
    [registry],
  );
  // Load workflow from database
  const loadWorkflowFromDB = useCallback(async () => {
    // If workflowData is provided directly, use it
    if (workflowData) {
      try {
        const { nodes: reconstructedNodes, edges: reconstructedEdges } =
          reconstructNodesFromData(workflowData, nodeCallbacksRef.current);

        if (reconstructedNodes.length > 0) {
          setNodes(reconstructedNodes);
          setEdges(reconstructedEdges);
        }
      } catch (error) {
        console.error('Failed to load direct workflow data:', error);
        throw error;
      }
      return;
    }

    // If readonly with initial workflow, load from initialWorkflow
    if (readonly && initialWorkflow) {
      try {
        const workflowData = JSON.parse(initialWorkflow.content);
        const { nodes: reconstructedNodes, edges: reconstructedEdges } =
          reconstructNodesFromData(workflowData, nodeCallbacksRef.current);

        if (reconstructedNodes.length > 0) {
          setNodes(reconstructedNodes);
          setEdges(reconstructedEdges);
        }
      } catch (error) {
        console.error('Failed to load initial workflow:', error);
        throw error;
      }
      return;
    }

    if (!chatId) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows?conversationId=${chatId}`);
      if (!response.ok) {
        throw new Error('Failed to load workflow');
      }

      const { workflow } = await response.json();
      if (!workflow?.content) {
        return;
      }

      const workflowData = JSON.parse(workflow.content);
      const { nodes: reconstructedNodes, edges: reconstructedEdges } =
        reconstructNodesFromData(workflowData, nodeCallbacksRef.current);

      if (reconstructedNodes.length > 0) {
        setNodes(reconstructedNodes);
        setEdges(reconstructedEdges);
      }
    } catch (error) {
      console.error('Failed to load workflow from DB:', error);
      throw error;
    }
  }, [chatId, readonly, initialWorkflow, workflowData, reconstructNodesFromData, setNodes, setEdges]);
  // Save workflow to database using API route instead of server function
  const saveWorkflowToDB = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      // Don't save in readonly mode
      if (readonly) {
        return;
      }

      if (!chatId || !session?.user?.id) {
        return;
      }

      try {
        const workflowData = serializeWorkflowForStorage({ nodes, edges });
        
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: chatId,
            title: `Workflow for Chat ${chatId}`,
            content: JSON.stringify(workflowData),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save workflow');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save workflow');
      }
    },
    [chatId, session, readonly],
  );

  // Get input specs for a node based on its connections
  const getNodeInputSpecs = useCallback(
    (nodeId: string, nodes: Node[], edges: Edge[]): DataTableSpec[] => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return [];

      const incomingEdges = edges.filter((e) => e.target === nodeId);
      return Array(node.data.inputPorts)
        .fill(null)
        .map((_, portIndex) => {
          // Find the edge connected to this input port
          const edge = incomingEdges.find((e) => {
            const targetPortIndex = e.targetHandle
              ? Number.parseInt(e.targetHandle.split('-')[1])
              : 0;
            return targetPortIndex === portIndex;
          });

          if (edge) {
            // Get the source node and its output spec
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (
              sourceNode?.data.outputs &&
              sourceNode.data.outputs.length > 0
            ) {
              const sourcePortIndex = edge.sourceHandle
                ? Number.parseInt(edge.sourceHandle.split('-')[1])
                : 0;
              const output = sourceNode.data.outputs[sourcePortIndex];
              if (output?.spec) {
                return output.spec;
              }
            }
          }

          // Default empty spec
          return { columns: [], findColumnIndex: () => -1 };
        });
    },
    [],
  );
  // Create a new node
  const createNode = useCallback(
    (factoryId: string, position: { x: number; y: number }) => {
      const factory = registry.getFactory(factoryId);
      if (!factory) {
        throw new Error(`Node type '${factoryId}' not found in registry.`);
      }

      const metadata = factory.getNodeMetadata();
      const nodeModel = factory.createNodeModel();
      const inputPorts = nodeModel.getInputPortCount();
      const outputPorts = nodeModel.getOutputPortCount();

      return {
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'customNode',
        position,
        data: {
          label: metadata.name,
          factory,
          factoryId,
          icon: metadata.icon,
          image: metadata.image,
          status: 'idle',
          executed: false,
          inputPorts,
          outputPorts,
          settings: {},
          onConfigure: nodeCallbacksRef.current.onConfigure,
          onViewResult: nodeCallbacksRef.current.onViewResult,
          onExecute: nodeCallbacksRef.current.onExecute,
          onDuplicate: nodeCallbacksRef.current.onDuplicate,
          onDelete: nodeCallbacksRef.current.onDelete,
        },
      };
    },
    [registry],
  );

  return {
    loadWorkflowFromDB,
    saveWorkflowToDB,
    getNodeInputSpecs,
    createNode,
    reconstructNodesFromData,
  };
};
