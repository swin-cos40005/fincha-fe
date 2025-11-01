import type { Node, Edge } from 'reactflow';
import type {
  DataTableType,
  DataTableSpec,
  Cell,
  SettingsObject,
  ExecutionContext,
  DataValue
} from '@/lib/types';
import type {
  NodeFactory,
  DataTableContainer,
} from '@/lib/nodes/core';

export class WorkflowExecutionEngine {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];
  private executed: Set<string> = new Set();
  private executing: Set<string> = new Set();
  private nodeOutputs: Map<string, DataTableType[]> = new Map();
  private onNodeStatusChange: (
    nodeId: string,
    status: string,
    outputs?: DataTableType[],
    error?: string,
    context?: any,
  ) => void;

  constructor(
    onNodeStatusChange: (
      nodeId: string,
      status: string,
      outputs?: DataTableType[],
      error?: string,
      context?: any,
    ) => void,
  ) {
    this.onNodeStatusChange = onNodeStatusChange;
  }

  setWorkflow(nodes: Node[], edges: Edge[]) {
    this.nodes.clear();
    nodes.forEach((node) => this.nodes.set(node.id, node));
    this.edges = [...edges];
    this.executed.clear();
    this.executing.clear();
    this.nodeOutputs.clear();
  }

  async executeWorkflow() {
    // Reset execution state
    this.executed.clear();
    this.executing.clear();
    this.nodeOutputs.clear();

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = Array.from(this.nodes.values()).filter(
      (node) => !this.edges.some((edge) => edge.target === node.id),
    );

    // Execute root nodes first
    const promises = rootNodes.map((node) => this.executeNode(node.id));
    await Promise.all(promises);
  }

  private async executeNode(nodeId: string) {
    // Skip if already executed or executing
    if (this.executed.has(nodeId) || this.executing.has(nodeId)) {
      return;
    }

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Check if all predecessors have been executed
    const incomingEdges = this.edges.filter((edge) => edge.target === nodeId);
    const predecessors = incomingEdges.map((edge) => edge.source);

    if (predecessors.some((predId) => !this.executed.has(predId))) {
      // Wait for predecessors to complete
      const predPromises = predecessors
        .filter((predId) => !this.executed.has(predId))
        .map((predId) => this.executeNode(predId));
      await Promise.all(predPromises);
    }

    // Start execution
    this.executing.add(nodeId);
    this.onNodeStatusChange(nodeId, 'executing');

    try {
      // Get input data from predecessors
      const inputs: DataTableType[] = [];

      // Group incoming edges by target handle (input port)
      const inputsByPort = new Map<string, DataTableType>();

      incomingEdges.forEach((edge) => {
        const sourceNode = this.nodes.get(edge.source);
        if (!sourceNode) return;
        const sourceOutputs = this.nodeOutputs.get(edge.source) || [];
        // Extract port indices from handles
        const sourcePort = this.getPortIndex(edge.sourceHandle || null);
        const targetPort = this.getPortIndex(edge.targetHandle || null);

        if (
          sourcePort !== null &&
          targetPort !== null &&
          sourceOutputs[sourcePort]
        ) {
          inputsByPort.set(`${targetPort}`, sourceOutputs[sourcePort]);
        }
      });

      // Sort inputs by port index and initialize inputs array properly
      Array.from(inputsByPort.keys()).map((p) => Number.parseInt(p, 10));

      // Initialize inputs array with proper size based on node's input port count
      const inputPortCount = node.data.inputPorts || 0;
      for (let i = 0; i < inputPortCount; i++) {
        inputs[i] = inputsByPort.get(`${i}`) || this.createEmptyTable();
      }

      // Execute the node
      const factory = node.data.factory as NodeFactory<any>;
      if (!factory) {
        throw new Error(`No factory found for node ${nodeId} (factoryId: ${node.data.factoryId})`);
      }
      const nodeModel = factory.createNodeModel();

      // Load settings with enhanced handling for different node types
      const nodeSettings = node.data.settings || {};
      if (Object.keys(nodeSettings).length > 0) {
        // Create a settings object that handles different formats properly
        const settingsForModel = new ExecutionSettingsWrapper(nodeSettings);

        nodeModel.loadSettings(settingsForModel);
      } else {
        // Fallback to direct settings object if no enhanced handling needed
        nodeModel.loadSettings(nodeSettings);
      }

      // Create execution context
      const context = new ExecutionContextImpl(nodeId);

      // Execute the node
      const outputs = await nodeModel.execute(inputs, context);

      // Generate dashboard items if the node supports it
      if (typeof nodeModel.sendOutputsToDashboard === 'function') {
        try {
          const dashboardItems = await nodeModel.sendOutputsToDashboard(
            outputs,
            context,
            node.data.label
          );
          if (dashboardItems && dashboardItems.length > 0) {
            context.dashboardItems = dashboardItems;
          }
        } catch (dashboardError) {
          console.error('❌ [Execution] Error generating dashboard items:', dashboardError);
        }
      }

      // Store outputs
      this.nodeOutputs.set(nodeId, outputs);

      // Mark as executed
      this.executing.delete(nodeId);
      this.executed.add(nodeId);
      
      this.onNodeStatusChange(nodeId, 'success', outputs, undefined, context);

      // Execute successors
      const outgoingEdges = this.edges.filter((edge) => edge.source === nodeId);
      const successors = [...new Set(outgoingEdges.map((edge) => edge.target))];

      const successorPromises = successors.map((succId) =>
        this.executeNode(succId),
      );
      await Promise.all(successorPromises);
    } catch (error) {
      // Handle execution error
      this.executing.delete(nodeId);
      this.executed.add(nodeId); // Mark as executed even if failed
      this.onNodeStatusChange(
        nodeId,
        'error',
        undefined,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Helper method to extract port index from handle
  private getPortIndex(handle: string | null): number | null {
    if (!handle) return 0; // Default to port 0 if no handle specified
    const match = handle.match(/-(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  // Create an empty table for missing inputs
  private createEmptyTable(): DataTableType {
    return {
      spec: { columns: [], findColumnIndex: () => -1 },
      rows: [],
      forEach: () => {},
      size: 0,
    };
  }

  // Reset the execution state of a node
  resetNode(nodeId: string) {
    this.executed.delete(nodeId);
    this.executing.delete(nodeId);
    this.nodeOutputs.delete(nodeId);
    this.onNodeStatusChange(nodeId, 'reset');
  }

  // Reset the entire workflow
  resetWorkflow() {
    this.executed.clear();
    this.executing.clear();
    this.nodeOutputs.clear();
    this.nodes.forEach((node) => {
      this.onNodeStatusChange(node.id, 'reset');
    });
  }

  // Execute a node and its dependencies
  public async executeNodeWithDependencies(nodeId: string) {
    // Skip if already executed or executing
    if (this.executed.has(nodeId) || this.executing.has(nodeId)) {
      return;
    }

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Find all incoming edges (dependencies)
    const incomingEdges = this.edges.filter((edge) => edge.target === nodeId);
    const dependencies = [...new Set(incomingEdges.map((edge) => edge.source))];

    // Execute all dependencies first
    for (const depId of dependencies) {
      if (!this.executed.has(depId)) {
        await this.executeNodeWithDependencies(depId);
      }
    }

    // Now execute this node
    await this.executeNodeOnly(nodeId);
  }

  // Execute only the specified node without executing successors
  private async executeNodeOnly(nodeId: string) {
    // Skip if already executing
    if (this.executing.has(nodeId)) {
      return;
    }

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Start execution
    this.executing.add(nodeId);
    this.onNodeStatusChange(nodeId, 'executing');

    try {
      // Get input data from predecessors (only from already executed nodes)
      const inputs: DataTableType[] = [];
      const incomingEdges = this.edges.filter((edge) => edge.target === nodeId);

      // Group incoming edges by target handle (input port)
      const inputsByPort = new Map<string, DataTableType>();

      incomingEdges.forEach((edge) => {
        const sourceNode = this.nodes.get(edge.source);
        if (!sourceNode) return;

        // Get outputs from already executed source nodes
        const sourceOutputs = this.nodeOutputs.get(edge.source) || [];
        if (sourceOutputs.length === 0) {
          return;
        }

        // Extract port indices from handles
        const sourcePort = this.getPortIndex(edge.sourceHandle || null);
        const targetPort = this.getPortIndex(edge.targetHandle || null);

        if (
          sourcePort !== null &&
          targetPort !== null &&
          sourceOutputs[sourcePort]
        ) {
          inputsByPort.set(`${targetPort}`, sourceOutputs[sourcePort]);
        }
      });

      // Sort inputs by port index and initialize inputs array properly
      Array.from(inputsByPort.keys()).map((p) => Number.parseInt(p, 10));

      // Initialize inputs array with proper size based on node's input port count
      const inputPortCount = node.data.inputPorts || 0;
      for (let i = 0; i < inputPortCount; i++) {
        inputs[i] = inputsByPort.get(`${i}`) || this.createEmptyTable();
      }

      // Execute the node
      const factory = node.data.factory as NodeFactory<any>;
      const nodeModel = factory.createNodeModel();

      // Load settings with enhanced handling for different node types
      const nodeSettings = node.data.settings || {};
      if (Object.keys(nodeSettings).length > 0) {
        // Create a settings object that handles different formats properly
        const settingsForModel = new ExecutionSettingsWrapper(nodeSettings);

        nodeModel.loadSettings(settingsForModel);
      } else {
        // Fallback to direct settings object if no enhanced handling needed
        nodeModel.loadSettings(nodeSettings);
      }

      // Create execution context
      const context = new ExecutionContextImpl(nodeId);

      // Execute the node
      const outputs = await nodeModel.execute(inputs, context);

      // Generate dashboard items if the node supports it
      if (typeof nodeModel.sendOutputsToDashboard === 'function') {
        try {
          const dashboardItems = await nodeModel.sendOutputsToDashboard(
            outputs,
            context,
            node.data.label
          );
          if (dashboardItems && dashboardItems.length > 0) {
            context.dashboardItems = dashboardItems;
          }
        } catch (dashboardError) {
          console.error('❌ [ExecuteOnly] Error generating dashboard items:', dashboardError);
        }
      }

      // Store outputs
      this.nodeOutputs.set(nodeId, outputs);

      // Mark as executed
      this.executing.delete(nodeId);
      this.executed.add(nodeId);
      
      this.onNodeStatusChange(nodeId, 'success', outputs, undefined, context);

      // NOTE: We intentionally DO NOT execute successors for individual node execution
    } catch (error) {
      // Handle execution error
      this.executing.delete(nodeId);
      this.executed.add(nodeId); // Mark as executed even if failed
      this.onNodeStatusChange(
        nodeId,
        'error',
        undefined,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

class ExecutionSettingsWrapper implements SettingsObject {
  private settings: Record<string, DataValue>;

  constructor(settings: Record<string, DataValue>) {
    this.settings = settings;
  }

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
}

class ExecutionContextImpl implements ExecutionContext {
  private tables: DataTableType[] = [];
  public readonly nodeId: string;
  public dashboardItems: any[] = [];

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  createDataTable(spec: DataTableSpec): DataTableContainer {
    const rows: Cell[][] = [];

    const container: DataTableContainer = {
      addRow(key: string, cells: Cell[]): void {
        rows.push(cells);
      },
      close(): DataTableType {
        return {
          spec,
          rows: rows.map((cells, index) => ({
            key: `row-${index}`,
            cells,
            getCell(cellIndex: number) {
              return cells[cellIndex];
            }
          })),
          forEach(callback) {
            this.rows.forEach(callback);
          },
          get size() {
            return rows.length;
          }
        };
      }
    };

    return container;
  }

  checkCanceled(): void {
    // Implementation for cancellation check
  }

  setProgress(_progress: number, _message?: string): void {
    // Implementation for progress updates
  }

  // Add dashboard item to context
  addDashboardItem(item: any): void {
    this.dashboardItems.push(item);
  }
}
