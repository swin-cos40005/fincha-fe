/**
 * Refactored Workflow Editor
 * Restored functionality from the old version while maintaining improvements
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  type Connection,
  type Node,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';

import { Node as WorkflowNode } from './workflow/node';
import { NodeConfigDialog } from './workflow/node-config-dialog';
import { TabbedPalette } from './workflow/tabbed-palette';
import { WorkflowToolbar } from './workflow/workflow-toolbar';
import { NodeViewDialog } from './workflow/node-view-dialog';
import { SaveTemplateDialog } from './workflow/save-template-dialog';

import { WorkflowExecutionEngine, handleConnection } from '@/lib/workflow';
import { useWorkflowData } from '@/hooks/use-workflow-data';
import { persistNodeDashboardItems, emitDashboardRefreshEvent } from '@/lib/dashboard/utils';
import { resetNodeAndSuccessors as resetNodeAndSuccessorsUtil } from '@/lib/workflow/operations';
import { getSystemTemplateById } from '@/lib/templates';

import type { NodeData as WorkflowNodeData } from './workflow/node';
import type { WorkflowTemplate } from '@/lib/types';

// Custom node component
const CustomNode: React.FC<{ id: string; data: WorkflowNodeData; selected: boolean }> = ({ id, data, selected }) => {
  return <WorkflowNode id={id} data={data} selected={selected} />;
};

interface WorkflowEditorProps {
  chatId?: string;
  session?: any;
  readonly?: boolean;
  initialWorkflow?: {
    title: string;
    content: string;
    createdAt: string;
    sharedId?: string;
  };
  workflowData?: any;
  onWorkflowUpdate?: (workflowData: any) => void;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  chatId,
  session,
  readonly = false,
  initialWorkflow,
  workflowData,
  onWorkflowUpdate,
}) => {
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // UI state
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeToConfig, setNodeToConfig] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViewNode, setSelectedViewNode] = useState<string | null>(null);
  const [shouldSave, setShouldSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);

  // References
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Dashboard persistence handler using unified function (database only)
  const handleDashboardPersistence = useCallback(async (
    nodeId: string, 
    status: string, 
    outputs: any[], 
    context: any,
    nodeLabel?: string
  ) => {
    if (chatId) {
      return await persistNodeDashboardItems(nodeId, status, outputs, context, {
        chatId,
        nodeId,
        nodeLabel,
        // No dataStream for workflow editor - will rely on dashboard refresh events
      });
    }
    return { success: true, itemCount: 0 };
  }, [chatId]);

  // Execution engine with dashboard persistence
  const executionEngineRef = useRef<WorkflowExecutionEngine>(
    new WorkflowExecutionEngine((nodeId, status, outputs, error, context) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  status,
                  outputs,
                  error,
                  executed: status !== 'reset',
                },
              }
            : node,
        ),
      );

      // Handle dashboard persistence for successful executions
      if (status === 'success' && context) {
        const currentNode = nodes.find(n => n.id === nodeId);
        
        // Handle dashboard persistence asynchronously
        (async () => {
          try {
            const result = await handleDashboardPersistence(nodeId, status, outputs || [], context, currentNode?.data?.label);
            
            // Emit refresh event if dashboard items were saved
            if (result && result.success && result.itemCount > 0 && chatId) {
              emitDashboardRefreshEvent(chatId, nodeId, currentNode?.data?.label);
            }
          } catch (error) {
            console.error('Dashboard persistence error:', error);
          }
        })();
      }
    }),
  );

  // Update execution engine when nodes or edges change
  useEffect(() => {
    executionEngineRef.current.setWorkflow(nodes, edges);
  }, [nodes, edges]);

  // Memoized ReactFlow props
  const deleteKeyCode = useMemo(() => (readonly ? [] : ['Backspace', 'Delete']), [readonly]);
  const multiSelectionKeyCode = useMemo(() => (readonly ? [] : ['Meta', 'Ctrl']), [readonly]);
  const snapGrid = useMemo(() => [20, 20] as [number, number], []);
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);
  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  // Node action handlers
  const handleNodeConfigure = useCallback((id: string) => {
    if (readonly) return;
    setNodeToConfig(id);
    setDialogOpen(true);
  }, [readonly]);

  const handleNodeViewResult = useCallback((id: string) => {
    setSelectedViewNode(id);
    setViewDialogOpen(true);
  }, []);

  const handleNodeExecute = useCallback(async (id: string) => {
    if (readonly) return;
    try {
      await executionEngineRef.current.executeNodeWithDependencies(id);
    } catch {
      // Error handling in engine
    }
  }, [readonly]);

  const handleNodeDuplicate = useCallback((id: string) => {
    if (readonly) return;
    const nodeToDuplicate = nodes.find((n) => n.id === id);
    if (!nodeToDuplicate) return;

    const newNode = {
      ...nodeToDuplicate,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: nodeToDuplicate.position.x + 100,
        y: nodeToDuplicate.position.y + 100,
      },
      data: {
        ...nodeToDuplicate.data,
        status: 'idle',
        executed: false,
        outputs: undefined,
        error: undefined,
      },
    };

    setNodes((nodes) => [...nodes, newNode]);
    setShouldSave(true);
    toast.success(`Duplicated ${newNode.data.label} node`);
  }, [readonly, nodes]);

  const handleNodeDelete = useCallback((id: string) => {
    if (readonly) return;
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    setEdges((edges) =>
      edges.filter((e) => e.source !== id && e.target !== id),
    );
    setShouldSave(true);
    toast.success('Node deleted');
  }, [readonly]);

  // Create forward references for the callbacks to avoid circular dependencies
  const handleNodeDuplicateRef = useRef<(id: string) => void>(() => {});
  const handleNodeDeleteRef = useRef<(id: string) => void>(() => {});
  const handleNodeConfigureRef = useRef<(id: string) => void>(() => {});
  const handleNodeViewResultRef = useRef<(id: string) => void>(() => {});
  const handleNodeExecuteRef = useRef<(id: string) => void>(() => {});

  // Update refs when callbacks change
  handleNodeDuplicateRef.current = handleNodeDuplicate;
  handleNodeDeleteRef.current = handleNodeDelete;
  handleNodeConfigureRef.current = handleNodeConfigure;
  handleNodeViewResultRef.current = handleNodeViewResult;
  handleNodeExecuteRef.current = handleNodeExecute;

  // Memoized node callbacks to prevent infinite re-renders
  const nodeCallbacks = useMemo(() => {
    return {
      onConfigure: (id: string) => handleNodeConfigureRef.current(id),
      onViewResult: (id: string) => handleNodeViewResultRef.current(id),
      onExecute: (id: string) => handleNodeExecuteRef.current(id),
      onDuplicate: (id: string) => handleNodeDuplicateRef.current(id),
      onDelete: (id: string) => handleNodeDeleteRef.current(id),
    };
  }, []); // No dependencies needed since we use refs

  // Use workflow data hook
  const {
    loadWorkflowFromDB,
    saveWorkflowToDB,
    getNodeInputSpecs,
    createNode,
    reconstructNodesFromData,
  } = useWorkflowData({
    chatId,
    session,
    setNodes,
    setEdges,
    setShouldSave,
    readonly,
    initialWorkflow,
    nodeCallbacks,
    workflowData: workflowData,
  });

  // Connection handler
  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return;
      const success = handleConnection(
        connection,
        nodes,
        edges,
        setEdges,
        addEdge,
      );
      if (success && connection.target) {
        resetNodeAndSuccessors(connection.target);
      }
      setShouldSave(true);
    },
    [nodes, edges, setEdges, readonly],
  );

  // Reset a node and all its successors using centralized utility
  const resetNodeAndSuccessors = useCallback(
    (nodeId: string) => {
      resetNodeAndSuccessorsUtil({
        nodeId,
        edges,
        executionEngine: executionEngineRef.current,
      });
    },
    [edges],
  );

  // Custom node change handler to detect deletions
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      if (readonly) return;
      // Check if any changes are node removals
      const hasRemovals = changes.some((change) => change.type === 'remove');

      // Apply the changes
      onNodesChange(changes);

      // If nodes were removed, trigger save
      if (hasRemovals) {
        setShouldSave(true);
      }
    },
    [onNodesChange, readonly],
  );

  // Update node connection data when edges change
  useEffect(() => {
    // Skip updates during initial load to prevent infinite loops
    if (isInitialLoad) {
      return;
    }

    setNodes((currentNodes) => {
      let hasChanges = false;
      const updatedNodes = currentNodes.map((node) => {
        const connectedInputs = new Set<string>();
        const connectedOutputs = new Set<string>();

        // Find all edges connected to this node
        edges.forEach((edge) => {
          if (edge.target === node.id && edge.targetHandle) {
            connectedInputs.add(edge.targetHandle);
          }
          if (edge.source === node.id && edge.sourceHandle) {
            connectedOutputs.add(edge.sourceHandle);
          }
        });

        // Only update if connection data has changed
        const currentConnectedInputs = node.data.connectedInputs || new Set();
        const currentConnectedOutputs = node.data.connectedOutputs || new Set();

        const inputsChanged =
          connectedInputs.size !== currentConnectedInputs.size ||
          [...connectedInputs].some((input) => !currentConnectedInputs.has(input));
        const outputsChanged =
          connectedOutputs.size !== currentConnectedOutputs.size ||
          [...connectedOutputs].some((output) => !currentConnectedOutputs.has(output));

        if (!inputsChanged && !outputsChanged) {
          return node; // No changes, return the same node reference
        }

        hasChanges = true;
        return {
          ...node,
          data: {
            ...node.data,
            connectedInputs,
            connectedOutputs,
          },
        };
      });

      return hasChanges ? updatedNodes : currentNodes;
    });
  }, [edges, isInitialLoad]);

  // Handle node deletion via ReactFlow
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (readonly) return;
      deletedNodes.forEach((node) => {
        // Remove connected edges
        setEdges((edges) =>
          edges.filter((e) => e.source !== node.id && e.target !== node.id),
        );
        toast.success(`Deleted ${node.data.label} node`);
      });
      setShouldSave(true);
    },
    [setEdges, setShouldSave, readonly],
  );

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    try {
      await executionEngineRef.current.executeWorkflow();
      toast.success('Workflow executed successfully');
    } catch (error) {
      toast.error(
        `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, []);

  // Reset workflow
  const resetWorkflow = useCallback(() => {
    executionEngineRef.current.resetWorkflow();
    toast.info('Workflow reset');
  }, []);

  // Export workflow function
  const exportWorkflow = useCallback(() => {
    try {
      const workflowData = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data.label,
            factoryId: node.data.factory?.getNodeMetadata().id || node.data.factoryId,
            settings: node.data.settings || {},
            inputPorts: node.data.inputPorts,
            outputPorts: node.data.outputPorts,
            // Don't include runtime-only data
            status: 'idle',
            executed: false,
            outputs: undefined,
            error: undefined
          },
        })),
        edges: edges.map(edge => ({
          ...edge,
          data: edge.data ? { ...edge.data } : undefined
        })),
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          title: chatId ? `Workflow for Chat ${chatId}` : 'Exported Workflow'
        }
      };

      const jsonString = JSON.stringify(workflowData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Workflow exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export workflow');
    }
  }, [nodes, edges, chatId]);

  // Handle template usage
  const handleTemplateUse = useCallback((template: WorkflowTemplate) => {
    try {
      // Validate template structure
      if (!template) {
        throw new Error('Template is undefined');
      }
      if (!template.data) {
        throw new Error('Template data is missing');
      }
      if (!template.data.nodes || !Array.isArray(template.data.nodes)) {
        throw new Error('Template nodes are missing or invalid');
      }
      if (!template.data.edges || !Array.isArray(template.data.edges)) {
        throw new Error('Template edges are missing or invalid');
      }

      // Generate new IDs for template nodes and edges to avoid conflicts
      const idMapping = new Map<string, string>();
      
      const templateNodes = template.data.nodes.map((node: any) => {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMapping.set(node.id, newId);
        
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 100, // Offset to avoid overlap
            y: node.position.y + 100
          },
          data: {
            ...node.data,
            status: 'idle',
            executed: false,
            outputs: undefined,
            error: undefined,
            // The factory will be reconstructed when the workflow loads
            factory: undefined
          }
        };
      });

      const templateEdges = template.data.edges.map((edge: any) => {
        const newId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...edge,
          id: newId,
          source: idMapping.get(edge.source) || edge.source,
          target: idMapping.get(edge.target) || edge.target
        };
      });

      // Reconstruct nodes with factories
      const { nodes: reconstructedNodes, edges: reconstructedEdges } = 
        reconstructNodesFromData({ nodes: templateNodes, edges: templateEdges }, nodeCallbacks);

      // Add to existing workflow
      setNodes((currentNodes) => [...currentNodes, ...reconstructedNodes]);
      setEdges((currentEdges) => [...currentEdges, ...reconstructedEdges]);
      
      setShouldSave(true);
      toast.success(`Added template: ${template.name}`);
    } catch (error) {
      console.error('Template usage error:', error);
      toast.error(`Failed to use template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [reconstructNodesFromData, nodeCallbacks]);

  // Import workflow function
  const importWorkflow = useCallback((workflowData: any) => {
    try {
      // Validate the imported data
      if (!workflowData.nodes || !workflowData.edges) {
        throw new Error('Invalid workflow format: missing nodes or edges');
      }

      // Generate new IDs for imported nodes and edges to avoid conflicts
      const idMapping = new Map<string, string>();
      
      const importedNodes = workflowData.nodes.map((node: any) => {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMapping.set(node.id, newId);
        
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 100, // Offset to avoid overlap
            y: node.position.y + 100
          },
          data: {
            ...node.data,
            status: 'idle',
            executed: false,
            outputs: undefined,
            error: undefined,
            // The factory will be reconstructed when the workflow loads
            factory: undefined
          }
        };
      });

      const importedEdges = workflowData.edges.map((edge: any) => {
        const newId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
          ...edge,
          id: newId,
          source: idMapping.get(edge.source) || edge.source,
          target: idMapping.get(edge.target) || edge.target
        };
      });

      // Reconstruct nodes with factories
      const { nodes: reconstructedNodes, edges: reconstructedEdges } = 
        reconstructNodesFromData({ nodes: importedNodes, edges: importedEdges }, nodeCallbacks);

      // Add to existing workflow
      setNodes((currentNodes) => [...currentNodes, ...reconstructedNodes]);
      setEdges((currentEdges) => [...currentEdges, ...reconstructedEdges]);
      
      setShouldSave(true);
      toast.success(`Imported ${importedNodes.length} nodes and ${importedEdges.length} connections`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [reconstructNodesFromData, nodeCallbacks]);

  // Drag & drop handlers
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (readonly) return;
    event.preventDefault();
    // Support both move and copy operations
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'copy' ? 'copy' : 'move';
  }, [readonly]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (readonly) return;
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        toast.error(
          'Workflow editor not ready. Please wait a moment and try again.',
        );
        return;
      }

      const dragData = event.dataTransfer.getData('application/reactflow');

      if (!dragData) {
        toast.error('Invalid drag data. Please try dragging the item again.');
        return;
      }

      // Get position to place the item
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      try {
        // Check if it's a template (starts with "template:")
        if (dragData.startsWith('template:')) {
          // Handle template drop
          const templateId = dragData.replace('template:', '');
          
          // First try to get from system templates
          let template = getSystemTemplateById(templateId);
          
          if (!template) {
            // If not found in system templates, try to fetch from API
            fetch(`/api/templates/${templateId}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
              })
              .then(data => {
                // The API returns { template: ... } structure
                const fetchedTemplate = data.template;
                if (fetchedTemplate && fetchedTemplate.data && fetchedTemplate.data.nodes) {
                  // Adjust position for template nodes
                  const adjustedTemplate = {
                    ...fetchedTemplate,
                    data: {
                      ...fetchedTemplate.data,
                      nodes: fetchedTemplate.data.nodes.map((node: any) => ({
                        ...node,
                        position: {
                          x: node.position.x + position.x,
                          y: node.position.y + position.y
                        }
                      }))
                    }
                  };
                  handleTemplateUse(adjustedTemplate);
                } else {
                  throw new Error('Invalid template data structure');
                }
              })
              .catch(error => {
                console.error('Failed to fetch template:', error);
                toast.error(`Failed to load template: ${error.message || templateId}`);
              });
          } else {
            // Validate system template structure before using
            if (template && template.data && template.data.nodes && Array.isArray(template.data.nodes)) {
              // Adjust position for template nodes
              const adjustedTemplate = {
                ...template,
                data: {
                  ...template.data,
                  nodes: template.data.nodes.map((node: any) => ({
                    ...node,
                    position: {
                      x: node.position.x + position.x,
                      y: node.position.y + position.y
                    }
                  }))
                }
              };
              handleTemplateUse(adjustedTemplate);
            } else {
              console.error('Invalid system template structure:', template);
              toast.error(`Invalid system template: ${templateId}`);
            }
          }
        } else {
          // Handle node drop (factoryId)
          const factoryId = dragData;
          const newNode = createNode(factoryId, position);

          setNodes((nds) => nds.concat(newNode));
          toast.success(`Added ${newNode.data.label} node to workflow`);

          // Trigger save since we added a new node
          setShouldSave(true);
        }
      } catch (error) {
        console.error('Drop error:', error);
        toast.error(error instanceof Error ? error.message : String(error));
      }
    },
    [
      reactFlowInstance,
      createNode,
      readonly,
      handleTemplateUse,
    ],
  );

  // Save node configuration
  const saveNodeConfiguration = useCallback(
    (settings: any) => {
      if (!nodeToConfig) return;

      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === nodeToConfig
            ? {
                ...n,
                data: {
                  ...n.data,
                  settings,
                },
              }
            : n,
        ),
      );

      // Reset node and successors when configuration changes
      resetNodeAndSuccessors(nodeToConfig);

      // Trigger save since we updated node configuration
      setShouldSave(true);
    },
    [nodeToConfig, resetNodeAndSuccessors],
  );

  // Create a stable reference to loadWorkflowFromDB
  const loadWorkflowRef = useRef(loadWorkflowFromDB);
  loadWorkflowRef.current = loadWorkflowFromDB;

  // Initial load effect - only load if workflowData is not provided
  useEffect(() => {
    if (workflowData) {
      // If workflowData is already provided, use it directly
      try {
        const { nodes: reconstructedNodes, edges: reconstructedEdges } =
          reconstructNodesFromData(workflowData, nodeCallbacks);
        
        if (reconstructedNodes.length > 0 || reconstructedEdges.length > 0) {
          setNodes(reconstructedNodes);
          setEdges(reconstructedEdges);
        }
      } catch (error) {
        console.error('WorkflowEditor: Failed to load provided workflow data:', error);
      } finally {
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    } else if (loadWorkflowRef.current) {
      // Only load from database if no workflowData is provided
      loadWorkflowRef.current().finally(() => {
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      });
    }
  }, [chatId, isInitialLoad, workflowData, nodeCallbacks, reconstructNodesFromData]);

  // Save workflow to database when shouldSave flag is set
  useEffect(() => {
    if (shouldSave) {
      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          // Create the workflow data object
          const newWorkflowData = {
            nodes: nodes.map((node) => ({
              id: node.id,
              type: node.type,
              position: node.position,
              data: {
                label: node.data.label,
                factoryId: node.data.factory?.getNodeMetadata().id || node.data.factoryId,
                settings: node.data.settings || {},
                inputPorts: node.data.inputPorts,
                outputPorts: node.data.outputPorts,
                connectedInputs: node.data.connectedInputs || new Set(),
                connectedOutputs: node.data.connectedOutputs || new Set(),
                // Keep the current execution state for the workflow data (don't reset to idle)
                status: node.data.status || 'idle',
                executed: node.data.executed || false,
                outputs: node.data.outputs || undefined,
                error: node.data.error || undefined
              },
            })),
            edges: edges.map(edge => ({
              ...edge,
              data: edge.data ? { ...edge.data } : undefined
            })),
            metadata: {
              lastSaved: new Date().toISOString(),
              version: '1.0'
            }
          };

          // Update parent component with new workflow data
          onWorkflowUpdate?.(newWorkflowData);
          
          // Save to database
          await saveWorkflowToDB(nodes, edges);
          toast.success('Workflow saved successfully');
        } catch (err) {
          console.error('Failed to save workflow:', err);
          toast.error('Failed to save workflow');
        } finally {
          setShouldSave(false);
          setIsSaving(false);
        }
      }, 1000); // Debounce by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [shouldSave, saveWorkflowToDB, nodes, edges, onWorkflowUpdate]);

  // Ensure loaded nodes have callbacks after initial load
  useEffect(() => {
    if (!isInitialLoad && nodes.length > 0) {
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onConfigure: node.data.onConfigure || ((id: string) => handleNodeConfigureRef.current(id)),
            onViewResult: node.data.onViewResult || ((id: string) => handleNodeViewResultRef.current(id)),
            onExecute: node.data.onExecute || ((id: string) => handleNodeExecuteRef.current(id)),
            onDuplicate: node.data.onDuplicate || ((id: string) => handleNodeDuplicateRef.current(id)),
            onDelete: node.data.onDelete || ((id: string) => handleNodeDeleteRef.current(id)),
          },
        })),
      );
    }
  }, [isInitialLoad, nodes.length]);

  // Listen for workflow execution events from the AI agent
  useEffect(() => {
    if (readonly) return;

    const handleWorkflowExecutionEvent = (event: CustomEvent) => {
      const { type, conversationId, nodeId, status, outputs, error } =
        event.detail;

      // Only handle events for this conversation
      if (conversationId !== chatId) return;

      if (type === 'node-update' && nodeId) {
        // Update the specific node's status
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status,
                    outputs,
                    error,
                    executed: status !== 'idle' && status !== 'reset',
                  },
                }
              : node,
          ),
        );

        // Show toast notification
        if (status === 'success') {
          toast.success(
            `Node executed successfully: ${event.detail.nodeLabel}`,
          );
        } else if (status === 'error') {
          toast.error(`Node execution failed: ${event.detail.nodeLabel}`);
        }
      } else if (type === 'complete') {
        toast.success('Workflow execution completed');
      }
    };

    const handleWorkflowStructureUpdate = (event: CustomEvent) => {
      const { type, conversationId, workflowData } = event.detail;

      // Only handle events for this conversation
      if (conversationId !== chatId) {
        return;
      }
      
      // Handle immediate node configuration updates
      if (type === 'node-configured' && event.detail.nodeId && workflowData) {
        const updatedNode = workflowData.nodes?.find(
          (n: any) => n.id === event.detail.nodeId,
        );
        if (updatedNode) {
          setNodes((currentNodes) =>
            currentNodes.map((node) =>
              node.id === event.detail.nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      // Use deep copy to avoid reference issues
                      settings: { ...(updatedNode.data?.settings || {}) },
                      // Reset execution state when configuration changes
                      status: 'idle',
                      executed: false,
                      outputs: undefined,
                      error: undefined,
                    },
                  }
                : node,
            ),
          );

          // Reset node and its successors since configuration changed
          resetNodeAndSuccessors(event.detail.nodeId);

          // If the dialog is open for this node, close and reopen it to refresh with new settings
          if (nodeToConfig === event.detail.nodeId && dialogOpen) {
            setDialogOpen(false);
            setTimeout(() => {
              setDialogOpen(true);
            }, 100); // Small delay to ensure the dialog re-renders with new settings
          }

          toast.info(
            `Node "${updatedNode.data?.label || 'Node'}" configured by AI agent`,
          );
          return; // Don't proceed to full reload
        }
      }

      // Handle workflow modification events with immediate UI updates
      if (
        (type === 'workflow-modified' || 
         type === 'node-added' ||
         type === 'edge-added' ||
         type === 'workflow-updated') && 
        workflowData
      ) {
        try {
          // Directly update the UI using the provided workflow data
          const { nodes: reconstructedNodes, edges: reconstructedEdges } =
            reconstructNodesFromData(workflowData, nodeCallbacks);

          // Update the UI immediately
          if (reconstructedNodes.length > 0 || reconstructedEdges.length > 0) {
            setNodes(reconstructedNodes);
            setEdges(reconstructedEdges);
            
            // Update parent component with new workflow data
            onWorkflowUpdate?.(workflowData);
            
            toast.info('Workflow updated by AI agent');
          }
        } catch (error) {
          console.error('WorkflowEditor: Failed to apply workflow update:', error);
          // Fallback to database reload only if direct update fails
          setTimeout(async () => {
            try {
              await loadWorkflowRef.current();
              toast.info('Workflow reloaded from database');
            } catch (reloadError) {
              console.error('WorkflowEditor: Failed to reload workflow:', reloadError);
              toast.error('Failed to update workflow');
            }
          }, 500);
        }
      }
    };

    window.addEventListener(
      'workflowExecutionEvent',
      handleWorkflowExecutionEvent as EventListener,
    );
    window.addEventListener(
      'workflowStructureUpdate',
      handleWorkflowStructureUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        'workflowExecutionEvent',
        handleWorkflowExecutionEvent as EventListener,
      );
      window.removeEventListener(
        'workflowStructureUpdate',
        handleWorkflowStructureUpdate as EventListener,
      );
    };
  }, [
    chatId,
    readonly,
    resetNodeAndSuccessors,
    nodeToConfig,
    dialogOpen,
    nodeCallbacks,
    onWorkflowUpdate,
    reconstructNodesFromData,
  ]);

  return (
    <div className="flex h-full">
      <TabbedPalette
        isOpen={drawerOpen && !readonly}
        onClose={() => setDrawerOpen(false)}
        onTemplateUse={handleTemplateUse}
      />
      
      <div className="flex-1 flex flex-col">
        <WorkflowToolbar
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(true)}
          onExecuteWorkflow={executeWorkflow}
          onResetWorkflow={resetWorkflow}
          onExportWorkflow={exportWorkflow}
          onImportWorkflow={importWorkflow}
          onSaveTemplate={() => setSaveTemplateDialogOpen(true)}
          isSaving={isSaving}
          shouldSave={shouldSave}
          readonly={readonly}
        />
        
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              connectionLineType={ConnectionLineType.SmoothStep}
              snapToGrid={true}
              snapGrid={snapGrid}
              defaultViewport={defaultViewport}
              minZoom={0.2}
              maxZoom={2}
              deleteKeyCode={deleteKeyCode}
              multiSelectionKeyCode={multiSelectionKeyCode}
              panOnDrag={true}
              selectionOnDrag={false}
              panOnScroll={false}
              zoomOnScroll={true}
              zoomOnPinch={true}
              preventScrolling={true}
              nodesDraggable={!readonly}
              nodesConnectable={!readonly}
              elementsSelectable={!readonly}
            >
              <Controls />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
      
      <NodeConfigDialog
        isOpen={dialogOpen && !readonly}
        onClose={() => setDialogOpen(false)}
        node={
          nodeToConfig
            ? nodes.find((n) => n.id === nodeToConfig) || null
            : null
        }
        inputSpecs={
          nodeToConfig ? getNodeInputSpecs(nodeToConfig, nodes, edges) : []
        }
        onSave={saveNodeConfiguration}
      />
      
      <NodeViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        nodeId={selectedViewNode}
        nodes={nodes}
        edges={edges}
      />
      
      <SaveTemplateDialog
        isOpen={saveTemplateDialogOpen}
        onClose={() => setSaveTemplateDialogOpen(false)}
        workflowData={{ nodes, edges }}
        onTemplateSaved={(templateId) => {
          toast.success('Template saved successfully!');
          setSaveTemplateDialogOpen(false);
        }}
      />
    </div>
  );
};
