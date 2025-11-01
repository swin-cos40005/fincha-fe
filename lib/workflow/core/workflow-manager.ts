/**
 * Centralized Workflow Management System
 * Consolidates all workflow operations into a single, coherent interface
 */

import type { Node, Edge } from 'reactflow';
import type { DataTableType, ExecutionContext, SettingsObject, DataValue } from '@/lib/types';
import { NodeRegistry } from '@/lib/nodes/core';
import { logError } from '@/lib/utils';

// Centralized workflow data interface
export interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    lastSaved?: string;
    version?: string;
    [key: string]: any;
  };
}

// Node execution context
export interface NodeExecutionContext {
  nodeId: string;
  status: 'idle' | 'executing' | 'success' | 'error';
  outputs?: DataTableType[];
  error?: string;
  dashboardItems?: any[];
}

// Execution callback interface
export interface ExecutionCallback {
  (nodeId: string, context: NodeExecutionContext): void;
}

// Settings wrapper for consistent node configuration
export class UnifiedSettingsWrapper implements SettingsObject {
  constructor(private settings: Record<string, DataValue>) {}

  getString(key: string, defaultValue = ''): string {
    const value = this.settings[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return defaultValue;
  }

  getNumber(key: string, defaultValue = 0): number {
    const value = this.settings[key];
    return typeof value === 'number' ? value : defaultValue;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.settings[key];
    return typeof value === 'boolean' ? value : defaultValue;
  }

  set(key: string, value: DataValue): void {
    this.settings[key] = value;
  }

  getRaw(): Record<string, DataValue> {
    return { ...this.settings };
  }
}

// Execution context implementation
export class UnifiedExecutionContext implements ExecutionContext {
  public readonly nodeId: string;
  public dashboardItems: any[] = [];

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  createDataTable(spec: any): any {
    // Implementation here...
    return {
      addRow: (_key: string, _cells: any[]) => {},
      close: () => ({ spec, rows: [], forEach: () => {}, size: 0 }),
    };
  }

  checkCanceled(): void {}

  setProgress(_progress: number, _message?: string): void {}

  // Add dashboard item to context
  addDashboardItem(item: any): void {
    this.dashboardItems.push(item);
  }
}

/**
 * Centralized Workflow Manager
 * Handles all workflow operations through a single interface
 */
export class WorkflowManager {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];
  private registry = NodeRegistry.getInstance();
  private executionCallback?: ExecutionCallback;

  constructor(executionCallback?: ExecutionCallback) {
    this.executionCallback = executionCallback;
  }

  /**
   * Load workflow data
   */
  setWorkflow(workflowData: WorkflowData): void {
    this.nodes.clear();
    this.edges = [];
    
    // Reconstruct nodes with proper factory references
    workflowData.nodes.forEach(nodeData => {
      const reconstructedNode = this.reconstructNode(nodeData);
      if (reconstructedNode) {
        this.nodes.set(reconstructedNode.id, reconstructedNode);
      }
    });

    this.edges = [...workflowData.edges];
  }

  /**
   * Create a new node with proper factory setup
   */
  createNode(factoryId: string, position: { x: number; y: number }, settings: any = {}): Node {
    const factory = this.registry.getFactory(factoryId);
    if (!factory) {
      throw new Error(`Node factory not found: ${factoryId}`);
    }

    const metadata = factory.getNodeMetadata();
    const nodeModel = factory.createNodeModel();

    const node: Node = {
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
        inputPorts: nodeModel.getInputPortCount(),
        outputPorts: nodeModel.getOutputPortCount(),
        settings: { ...settings },
        outputs: undefined,
        error: undefined,
      },
    };

    return node;
  }

  /**
   * Reconstruct node from saved data
   */
  private reconstructNode(nodeData: any): Node | null {
    const factoryId = nodeData.data?.factoryId || nodeData.factoryId;
    const factory = this.registry.getFactory(factoryId);
    
    if (!factory) {
      logError('WorkflowManager', new Error(`Factory not found: ${factoryId}`));
      return null;
    }

    const metadata = factory.getNodeMetadata();
    const nodeModel = factory.createNodeModel();

    // Load settings if available
    const savedSettings = nodeData.data?.settings || {};
    if (Object.keys(savedSettings).length > 0) {
      const settingsWrapper = new UnifiedSettingsWrapper(savedSettings);
      if (typeof nodeModel.loadSettings === 'function') {
        nodeModel.loadSettings(settingsWrapper);
      }
    }

    return {
      ...nodeData,
      data: {
        ...nodeData.data,
        label: metadata.name,
        factory,
        factoryId,
        icon: metadata.icon,
        image: metadata.image,
        inputPorts: nodeModel.getInputPortCount(),
        outputPorts: nodeModel.getOutputPortCount(),
        settings: savedSettings,
        // Preserve execution state
        status: nodeData.data?.status || 'idle',
        executed: nodeData.data?.executed || false,
        outputs: nodeData.data?.outputs,
        error: nodeData.data?.error,
      },
    };
  }

  /**
   * Execute single node with unified logic
   */
  async executeNode(nodeId: string, includeDependencies = false): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Execute dependencies if requested
    if (includeDependencies) {
      await this.executeDependencies(nodeId);
    }

    // Execute this node
    await this.executeNodeCore(nodeId);
  }

  /**
   * Execute entire workflow
   */
  async executeWorkflow(): Promise<void> {
    // Find root nodes
    const rootNodes = Array.from(this.nodes.values()).filter(
      node => !this.edges.some(edge => edge.target === node.id)
    );

    // Execute all root nodes
    const promises = rootNodes.map(node => this.executeNode(node.id));
    await Promise.all(promises);
  }

  /**
   * Core node execution logic (no duplicates)
   */
  private async executeNodeCore(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const context = new UnifiedExecutionContext(nodeId);
    
    // Notify execution start
    this.notifyExecution(nodeId, { nodeId, status: 'executing' });

    try {
      // Prepare inputs
      const inputs = this.prepareNodeInputs(nodeId);
      
      // Setup node model
      const factory = node.data.factory;
      const nodeModel = factory.createNodeModel();
      
      // Load settings
      const settings = new UnifiedSettingsWrapper(node.data.settings || {});
      if (typeof nodeModel.loadSettings === 'function') {
        nodeModel.loadSettings(settings);
      }

      // Execute
      const outputs = await nodeModel.execute(inputs, context);

      // Generate dashboard items if supported
      if (typeof nodeModel.sendOutputsToDashboard === 'function') {
        const dashboardItems = await nodeModel.sendOutputsToDashboard(
          outputs,
          context,
          node.data.label
        );
        context.dashboardItems = dashboardItems || [];
      }

      // Update node state
      node.data.status = 'success';
      node.data.executed = true;
      node.data.outputs = outputs;
      node.data.error = undefined;

      // Notify success
      this.notifyExecution(nodeId, {
        nodeId,
        status: 'success',
        outputs,
        dashboardItems: context.dashboardItems,
      });

      // Execute successors
      await this.executeSuccessors(nodeId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update node state
      node.data.status = 'error';
      node.data.executed = true;
      node.data.error = errorMessage;
      node.data.outputs = undefined;

      // Notify error
      this.notifyExecution(nodeId, {
        nodeId,
        status: 'error',
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Prepare inputs for node execution
   */
  private prepareNodeInputs(nodeId: string): DataTableType[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const inputs: DataTableType[] = [];
    const incomingEdges = this.edges.filter(edge => edge.target === nodeId);
    const inputsByPort = new Map<string, DataTableType>();

    // Collect inputs from connected nodes
    incomingEdges.forEach(edge => {
      const sourceNode = this.nodes.get(edge.source);
      if (!sourceNode?.data.outputs) return;

      const sourcePort = this.getPortIndex(edge.sourceHandle || null);
      const targetPort = this.getPortIndex(edge.targetHandle || null);

      if (sourcePort !== null && targetPort !== null) {
        const sourceOutput = sourceNode.data.outputs[sourcePort];
        if (sourceOutput) {
          inputsByPort.set(`${targetPort}`, sourceOutput);
        }
      }
    });

    // Initialize input array
    const inputPortCount = node.data.inputPorts || 0;
    for (let i = 0; i < inputPortCount; i++) {
      inputs[i] = inputsByPort.get(`${i}`) || this.createEmptyTable();
    }

    return inputs;
  }

  /**
   * Execute node dependencies
   */
  private async executeDependencies(nodeId: string): Promise<void> {
    const incomingEdges = this.edges.filter(edge => edge.target === nodeId);
    const dependencies = [...new Set(incomingEdges.map(edge => edge.source))];

    for (const depId of dependencies) {
      const depNode = this.nodes.get(depId);
      if (depNode && !depNode.data.executed) {
        await this.executeNode(depId, true); // Recursive dependency execution
      }
    }
  }

  /**
   * Execute node successors
   */
  private async executeSuccessors(nodeId: string): Promise<void> {
    const outgoingEdges = this.edges.filter(edge => edge.source === nodeId);
    const successors = [...new Set(outgoingEdges.map(edge => edge.target))];

    const promises = successors.map(succId => this.executeNode(succId));
    await Promise.all(promises);
  }

  /**
   * Reset node execution state
   */
  resetNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.data.status = 'idle';
      node.data.executed = false;
      node.data.outputs = undefined;
      node.data.error = undefined;
    }
  }

  /**
   * Serialize workflow for storage
   */
  serialize(): WorkflowData {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      ...node,
      data: {
        ...node.data,
        // Remove factory reference for serialization
        factory: undefined,
      },
    }));

    return {
      nodes,
      edges: [...this.edges],
      metadata: {
        lastSaved: new Date().toISOString(),
        version: '1.0',
      },
    };
  }

  /**
   * Utility methods
   */
  private getPortIndex(handle: string | null): number | null {
    if (!handle) return 0;
    const match = handle.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private createEmptyTable(): DataTableType {
    return {
      spec: { columns: [], findColumnIndex: () => -1 },
      rows: [],
      forEach: () => {},
      size: 0,
    };
  }

  private notifyExecution(nodeId: string, context: NodeExecutionContext): void {
    if (this.executionCallback) {
      this.executionCallback(nodeId, context);
    }
  }

  // Public getters for external access
  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): Edge[] {
    return [...this.edges];
  }

  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }
}
