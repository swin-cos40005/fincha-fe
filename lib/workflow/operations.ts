/**
 * Centralized workflow operations utilities
 * Handles common workflow operations like saving, resetting, and execution
 */

import type { Node, Edge } from 'reactflow';
import { serializeWorkflowForStorage } from './utils';
import { persistDashboardItems } from '@/lib/dashboard/utils';
import { createErrorResponse, createSuccessResponse, logError, logWarning } from '@/lib/utils';

export interface WorkflowSaveOptions {
  chatId: string;
  session: any;
  title?: string;
  upsertWorkflowByConversationId?: (args: any) => Promise<any>; // injected for server-only
}

export interface NodeResetOptions {
  nodeId: string;
  edges: Edge[];
  executionEngine: any;
}

/**
 * Saves workflow to database with proper error handling
 * NOTE: upsertWorkflowByConversationId must be injected from server-only code
 */
export async function saveWorkflowToDatabase(
  nodes: Node[],
  edges: Edge[],
  options: WorkflowSaveOptions
): Promise<{ success: boolean; error?: string }> {
  const { chatId, session, title = 'Workflow', upsertWorkflowByConversationId } = options;

  if (!chatId || !session?.user?.id) {
    return { success: false, error: 'Missing chatId or user session' };
  }
  if (!upsertWorkflowByConversationId) {
    return { success: false, error: 'Missing upsertWorkflowByConversationId (server-only) function' };
  }

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
          connectedInputs: node.data.connectedInputs || new Set(),
          connectedOutputs: node.data.connectedOutputs || new Set(),
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

    await upsertWorkflowByConversationId({
      title,
      content: JSON.stringify(serializeWorkflowForStorage(workflowData)),
      conversationId: chatId,
    });

    return { success: true };
  } catch (error) {
    logError('WorkflowOperations', error, { operation: 'saveWorkflow', chatId });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Resets a node and all its successors in the workflow
 */
export function resetNodeAndSuccessors(options: NodeResetOptions): void {
  const { nodeId, edges, executionEngine } = options;
  const visited = new Set<string>();

  function resetDFS(id: string) {
    if (visited.has(id)) return;
    visited.add(id);

    // Reset this node
    executionEngine.resetNode(id);

    // Find all successors
    const outgoingEdges = edges.filter((e) => e.source === id);
    const successors = outgoingEdges.map((e) => e.target);

    // Reset all successors
    successors.forEach(resetDFS);
  }

  resetDFS(nodeId);
}

/**
 * Processes execution results and saves dashboard items
 */
export async function processExecutionResults(
  executionResults: any[],
  workflowData: any,
  chatId: string
): Promise<void> {
  try {
    for (const result of executionResults) {
      if (result.status === 'success' && result.outputs && result.outputs.length > 0) {
        const node = workflowData.nodes.find((n: any) => n.id === result.nodeId);
        if (!node) continue;

        const factory = node.data.factory;
        if (!factory) continue;

        const nodeModel = factory.createNodeModel();
        if (typeof nodeModel.sendOutputsToDashboard === 'function') {
          try {
            const context = { nodeId: result.nodeId };
            const dashboardItems = await nodeModel.sendOutputsToDashboard(
              result.outputs, 
              context,
              result.nodeLabel || 'Unknown Node'
            );

            // Save dashboard items using centralized persistence
            if (dashboardItems && dashboardItems.length > 0) {
              await persistDashboardItems(dashboardItems, {
                chatId,
                nodeId: result.nodeId,
              });
            }
          } catch (dashboardError) {
            logWarning('WorkflowOperations', `Failed to generate dashboard items for node: ${result.nodeId}`, { error: dashboardError });
          }
        }
      }
    }
  } catch (error) {
    logWarning('WorkflowOperations', 'Dashboard item collection failed', { error });
  }
}

/**
 * Creates a standardized error response for workflow operations
 */
export function createWorkflowErrorResponse(error: unknown, operation: string) {
  return createErrorResponse(error, operation);
}

/**
 * Creates a standardized success response for workflow operations
 */
export function createWorkflowSuccessResponse(message: string, data?: any) {
  return createSuccessResponse(message, data);
} 