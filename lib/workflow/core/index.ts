/**
 * Unified Workflow Core System
 * Single entry point for all workflow operations
 */

import type { Node, Edge, Connection } from 'reactflow';

// Import the classes for internal use
import { WorkflowManager, type WorkflowData, type NodeExecutionContext, type ExecutionCallback } from './workflow-manager';
import { DashboardManager, type DashboardItem } from './dashboard-manager';
import { ConnectionManager, type ConnectionValidationResult } from './connection-manager';
import { WorkflowStorageManager, type WorkflowStorageOptions, type WorkflowLoadOptions, type StorageResult } from './storage-manager';

// Export everything
export { WorkflowManager, UnifiedSettingsWrapper, UnifiedExecutionContext } from './workflow-manager';
export type { WorkflowData, NodeExecutionContext, ExecutionCallback } from './workflow-manager';

export { DashboardManager } from './dashboard-manager';
export type { DashboardItem, DashboardItemType, DashboardPersistenceOptions } from './dashboard-manager';

export { ConnectionManager } from './connection-manager';
export type { ConnectionValidationResult } from './connection-manager';

export { WorkflowStorageManager } from './storage-manager';
export type { WorkflowStorageOptions, WorkflowLoadOptions, StorageResult } from './storage-manager';

/**
 * Unified Workflow System
 * Main orchestrator that combines all managers
 */
export class UnifiedWorkflowSystem {
  public workflowManager: WorkflowManager;
  public dashboardManager: DashboardManager;
  public connectionManager: ConnectionManager;
  public storageManager: WorkflowStorageManager;

  constructor(chatId: string, executionCallback?: ExecutionCallback) {
    this.workflowManager = new WorkflowManager(executionCallback);
    this.dashboardManager = new DashboardManager(chatId);
    this.connectionManager = new ConnectionManager([], []);
    this.storageManager = new WorkflowStorageManager();
  }

  /**
   * Initialize system with workflow data
   */
  async initialize(workflowData: WorkflowData): Promise<void> {
    this.workflowManager.setWorkflow(workflowData);
    const nodes = this.workflowManager.getNodes();
    const edges = this.workflowManager.getEdges();
    this.connectionManager.update(nodes, edges);
  }

  /**
   * Create and add new node
   */
  createNode(factoryId: string, position: { x: number; y: number }, settings: any = {}): Node {
    const node = this.workflowManager.createNode(factoryId, position, settings);
    this.updateConnections();
    return node;
  }

  /**
   * Execute workflow with dashboard processing
   */
  async executeWorkflow(): Promise<void> {
    // Set up execution callback to handle dashboard items
    const originalCallback = this.workflowManager['executionCallback'];
    
    this.workflowManager['executionCallback'] = async (nodeId: string, context: NodeExecutionContext) => {
      // Call original callback
      if (originalCallback) {
        originalCallback(nodeId, context);
      }

      // Process dashboard items
      if (context.status === 'success' && context.outputs) {
        const node = this.workflowManager.getNode(nodeId);
        if (node) {
          const dashboardItems = await this.dashboardManager.processNodeOutputs(
            nodeId,
            node.data.label,
            context.outputs,
            context
          );

          // Persist dashboard items
          if (dashboardItems.length > 0) {
            await this.dashboardManager.persistItems(dashboardItems, {
              chatId: this.dashboardManager['chatId'],
              nodeId,
            });
          }
        }
      }
    };

    // Execute workflow
    await this.workflowManager.executeWorkflow();
    
    // Restore original callback
    this.workflowManager['executionCallback'] = originalCallback;
  }

  /**
   * Save workflow to storage
   */
  async saveWorkflow(options: WorkflowStorageOptions): Promise<StorageResult> {
    const workflowData = this.workflowManager.serialize();
    return await this.storageManager.saveWorkflow(workflowData, options);
  }

  /**
   * Load workflow from storage
   */
  async loadWorkflow(options: WorkflowLoadOptions): Promise<StorageResult> {
    const result = await this.storageManager.loadWorkflow(options);
    
    if (result.success && result.data) {
      await this.initialize(result.data);
    }
    
    return result;
  }

  /**
   * Validate connection
   */
  validateConnection(connection: Connection): ConnectionValidationResult {
    return this.connectionManager.validateConnection(connection);
  }

  /**
   * Handle connection with validation
   */
  handleConnection(
    connection: Connection,
    onEdgesChange: (edges: Edge[]) => void,
    addEdge: (connection: Connection, edges: Edge[]) => Edge[]
  ): boolean {
    const success = this.connectionManager.handleConnection(connection, onEdgesChange, addEdge);
    if (success) {
      this.updateConnections();
    }
    return success;
  }

  /**
   * Update connection manager with current state
   */
  private updateConnections(): void {
    const nodes = this.workflowManager.getNodes();
    const edges = this.workflowManager.getEdges();
    this.connectionManager.update(nodes, edges);
  }

  /**
   * Get workflow summary
   */
  getWorkflowSummary(): any {
    const workflowData = this.workflowManager.serialize();
    return this.storageManager.getWorkflowSummary(workflowData);
  }

  /**
   * Reset workflow
   */
  resetWorkflow(): void {
    const nodes = this.workflowManager.getNodes();
    nodes.forEach(node => {
      this.workflowManager.resetNode(node.id);
    });
    this.dashboardManager.clear();
  }

  /**
   * Get all dashboard items
   */
  getAllDashboardItems(): DashboardItem[] {
    return this.dashboardManager.getAllItems();
  }

  /**
   * Export workflow
   */
  exportWorkflow(): string {
    const workflowData = this.workflowManager.serialize();
    return this.storageManager.exportWorkflow(workflowData);
  }

  /**
   * Import workflow
   */
  importWorkflow(jsonData: string): StorageResult {
    const result = this.storageManager.importWorkflow(jsonData);
    
    if (result.success && result.data) {
      this.initialize(result.data);
    }
    
    return result;
  }
}

// Re-export types for convenience
export type { Node, Edge, Connection } from 'reactflow';
