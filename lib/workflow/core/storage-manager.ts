/**
 * Centralized Workflow Storage Manager
 * Consolidates all workflow persistence operations
 */

import type { WorkflowData } from './workflow-manager';
import { logError, logSuccess } from '@/lib/utils';

// Storage options
export interface WorkflowStorageOptions {
  chatId: string;
  userId: string;
  title?: string;
}

// Load options
export interface WorkflowLoadOptions {
  chatId: string;
  userId: string;
}

// Storage result
export interface StorageResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Centralized Workflow Storage Manager
 * Handles all workflow storage operations through a single interface
 */
export class WorkflowStorageManager {
  /**
   * Save workflow to database
   */
  async saveWorkflow(
    workflowData: WorkflowData,
    options: WorkflowStorageOptions
  ): Promise<StorageResult> {
    const { chatId, userId, title = 'Workflow' } = options;

    if (!chatId || !userId) {
      return { success: false, error: 'Missing chatId or userId' };
    }

    try {
      // Serialize workflow data for storage
      const serializedData = this.serializeForStorage(workflowData);

      // Make API call to save
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: chatId,
          title,
          content: JSON.stringify(serializedData),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      const result = await response.json();
      logSuccess('WorkflowStorage', `Workflow saved successfully`, { chatId, title });
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('WorkflowStorage', error, { operation: 'save', chatId, title });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Load workflow from database
   */
  async loadWorkflow(options: WorkflowLoadOptions): Promise<StorageResult> {
    const { chatId, userId } = options;

    if (!chatId || !userId) {
      return { success: false, error: 'Missing chatId or userId' };
    }

    try {
      const response = await fetch(`/api/workflows?conversationId=${chatId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No workflow found - this is normal for new conversations
          return { success: true, data: null };
        }
        throw new Error('Failed to load workflow');
      }

      const { workflow } = await response.json();
      
      if (!workflow?.content) {
        return { success: true, data: null };
      }

      // Deserialize workflow data
      const workflowData = this.deserializeFromStorage(workflow.content);
      logSuccess('WorkflowStorage', `Workflow loaded successfully`, { chatId });
      
      return { success: true, data: workflowData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('WorkflowStorage', error, { operation: 'load', chatId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete workflow from database
   */
  async deleteWorkflow(options: WorkflowLoadOptions): Promise<StorageResult> {
    const { chatId, userId } = options;

    if (!chatId || !userId) {
      return { success: false, error: 'Missing chatId or userId' };
    }

    try {
      const response = await fetch(`/api/workflows?conversationId=${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      logSuccess('WorkflowStorage', `Workflow deleted successfully`, { chatId });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('WorkflowStorage', error, { operation: 'delete', chatId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Export workflow to JSON
   */
  exportWorkflow(workflowData: WorkflowData): string {
    const exportData = {
      ...workflowData,
      metadata: {
        ...workflowData.metadata,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import workflow from JSON
   */
  importWorkflow(jsonData: string): StorageResult {
    try {
      const workflowData = JSON.parse(jsonData);
      
      // Validate structure
      if (!workflowData.nodes || !workflowData.edges) {
        throw new Error('Invalid workflow format: missing nodes or edges');
      }

      // Ensure nodes have required structure
      const validatedNodes = workflowData.nodes.map((node: any) => ({
        id: node.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: node.type || 'customNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.data?.label || 'Unknown Node',
          factoryId: node.data?.factoryId || node.data?.type || 'unknown',
          settings: node.data?.settings || {},
          inputPorts: node.data?.inputPorts || 0,
          outputPorts: node.data?.outputPorts || 0,
          status: 'idle',
          executed: false,
          outputs: undefined,
          error: undefined,
        },
      }));

      // Ensure edges have required structure
      const validatedEdges = workflowData.edges.map((edge: any) => ({
        id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: edge.source || edge.from,
        target: edge.target || edge.to,
        sourceHandle: edge.sourceHandle || 'source-0',
        targetHandle: edge.targetHandle || 'target-0',
      }));

      const validatedWorkflow: WorkflowData = {
        nodes: validatedNodes,
        edges: validatedEdges,
        metadata: {
          importedAt: new Date().toISOString(),
          version: '1.0',
        },
      };

      return { success: true, data: validatedWorkflow };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      logError('WorkflowStorage', error, { operation: 'import' });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if workflow exists
   */
  async workflowExists(options: WorkflowLoadOptions): Promise<boolean> {
    const result = await this.loadWorkflow(options);
    return result.success && result.data !== null;
  }

  /**
   * Serialize workflow for storage (remove runtime-only fields)
   */
  private serializeForStorage(workflowData: WorkflowData): WorkflowData {
    return {
      nodes: workflowData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          // Remove factory reference for serialization
          factory: undefined,
          // Keep settings as-is
          settings: { ...(node.data.settings || {}) },
        },
      })),
      edges: workflowData.edges.map(edge => ({ ...edge })),
      metadata: {
        ...workflowData.metadata,
        savedAt: new Date().toISOString(),
        version: '1.0',
      },
    };
  }

  /**
   * Deserialize workflow from storage
   */
  private deserializeFromStorage(content: string): WorkflowData {
    try {
      const data = JSON.parse(content);
      
      // Ensure proper structure
      return {
        nodes: data.nodes || [],
        edges: data.edges || [],
        metadata: data.metadata || {},
      };
    } catch (error) {
      logError('WorkflowStorage', error, { operation: 'deserialize' });
      throw new Error('Failed to deserialize workflow data');
    }
  }

  /**
   * Get workflow summary/statistics
   */
  getWorkflowSummary(workflowData: WorkflowData): {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
    executedNodes: number;
    errorNodes: number;
  } {
    const nodeTypes: Record<string, number> = {};
    let executedNodes = 0;
    let errorNodes = 0;

    workflowData.nodes.forEach(node => {
      const factoryId = node.data.factoryId || 'unknown';
      nodeTypes[factoryId] = (nodeTypes[factoryId] || 0) + 1;
      
      if (node.data.executed) {
        executedNodes++;
      }
      if (node.data.status === 'error') {
        errorNodes++;
      }
    });

    return {
      nodeCount: workflowData.nodes.length,
      edgeCount: workflowData.edges.length,
      nodeTypes,
      executedNodes,
      errorNodes,
    };
  }

  /**
   * Validate workflow structure
   */
  validateWorkflowStructure(workflowData: WorkflowData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check nodes
    if (!Array.isArray(workflowData.nodes)) {
      errors.push('Nodes must be an array');
    } else {
      workflowData.nodes.forEach((node, index) => {
        if (!node.id) {
          errors.push(`Node at index ${index} is missing id`);
        }
        if (!node.data?.factoryId) {
          errors.push(`Node ${node.id} is missing factoryId`);
        }
        if (!node.position) {
          errors.push(`Node ${node.id} is missing position`);
        }
      });
    }

    // Check edges
    if (!Array.isArray(workflowData.edges)) {
      errors.push('Edges must be an array');
    } else {
      workflowData.edges.forEach((edge, index) => {
        if (!edge.id) {
          errors.push(`Edge at index ${index} is missing id`);
        }
        if (!edge.source) {
          errors.push(`Edge ${edge.id} is missing source`);
        }
        if (!edge.target) {
          errors.push(`Edge ${edge.id} is missing target`);
        }
        
        // Check if referenced nodes exist
        const sourceExists = workflowData.nodes.some(n => n.id === edge.source);
        const targetExists = workflowData.nodes.some(n => n.id === edge.target);
        
        if (!sourceExists) {
          errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
        }
        if (!targetExists) {
          errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
