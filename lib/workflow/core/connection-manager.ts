/**
 * Centralized Connection Management
 * Consolidates all connection validation and creation logic
 */

import type { Node, Edge, Connection } from 'reactflow';
import { toast } from 'sonner';

/**
 * Connection validation result
 */
export interface ConnectionValidationResult {
  isValid: boolean;
  message?: string;
  shouldReplace?: boolean;
}

/**
 * Connection Manager
 * Handles all connection-related operations
 */
export class ConnectionManager {
  private nodes: Node[] = [];
  private edges: Edge[] = [];

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * Update the nodes and edges reference
   */
  update(nodes: Node[], edges: Edge[]): void {
    this.nodes = nodes;
    this.edges = edges;
  }

  /**
   * Validate a connection attempt
   */
  validateConnection(connection: Connection): ConnectionValidationResult {
    const sourceNode = this.nodes.find(n => n.id === connection.source);
    const targetNode = this.nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return { isValid: false, message: 'Invalid source or target node' };
    }

    // Prevent self-connection
    if (connection.source === connection.target) {
      return { isValid: false, message: 'Cannot connect a node to itself' };
    }

    // Check for cycles
    if (this.wouldCreateCycle(connection)) {
      return {
        isValid: false,
        message: 'Cannot create connection: would create a cycle in the workflow',
      };
    }

    // Check if target input already has a connection
    const existingConnection = this.edges.find(
      e => e.target === connection.target && e.targetHandle === connection.targetHandle
    );

    if (existingConnection) {
      return {
        isValid: true,
        message: 'Will replace existing connection',
        shouldReplace: true,
      };
    }

    return { isValid: true };
  }

  /**
   * Check if a connection would create a cycle
   */
  private wouldCreateCycle(connection: Connection): boolean {
    // Create a graph representation
    const graph = new Map<string, string[]>();

    // Add all nodes to the graph
    this.nodes.forEach(node => {
      graph.set(node.id, []);
    });

    // Add existing edges
    this.edges.forEach(edge => {
      const successors = graph.get(edge.source) || [];
      successors.push(edge.target);
      graph.set(edge.source, successors);
    });

    // Add the new connection
    if (connection.source && connection.target) {
      const successors = graph.get(connection.source) || [];
      successors.push(connection.target);
      graph.set(connection.source, successors);
    }

    // DFS to check for cycles
    const visited = new Set<string>();
    const path = new Set<string>();

    function hasCycle(node: string): boolean {
      if (path.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      path.add(node);

      const successors = graph.get(node) || [];
      for (const succ of successors) {
        if (hasCycle(succ)) return true;
      }

      path.delete(node);
      return false;
    }

    // Check for cycles from all nodes
    for (const node of graph.keys()) {
      if (!visited.has(node) && hasCycle(node)) return true;
    }

    return false;
  }

  /**
   * Create a new edge
   */
  createEdge(
    sourceNodeId: string,
    targetNodeId: string,
    sourcePort = 0,
    targetPort = 0
  ): Edge {
    return {
      id: `reactflow__edge-${sourceNodeId}source-${sourcePort}-${targetNodeId}target-${targetPort}`,
      source: sourceNodeId,
      sourceHandle: `source-${sourcePort}`,
      target: targetNodeId,
      targetHandle: `target-${targetPort}`,
    };
  }

  /**
   * Handle connection creation with validation and state updates
   */
  handleConnection(
    connection: Connection,
    onEdgesChange: (edges: Edge[]) => void,
    addEdge: (connection: Connection, edges: Edge[]) => Edge[]
  ): boolean {
    const validation = this.validateConnection(connection);

    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    if (validation.shouldReplace) {
      // Replace existing connection
      const updatedEdges = this.edges.filter(
        e => !(e.target === connection.target && e.targetHandle === connection.targetHandle)
      );
      onEdgesChange(addEdge(connection, updatedEdges));
      toast.info('Replaced existing connection');
    } else {
      // Add new connection
      onEdgesChange(addEdge(connection, this.edges));
      toast.success('Connection created');
    }

    return true;
  }

  /**
   * Find all nodes that would be affected by node deletion
   */
  findDependentNodes(nodeId: string): string[] {
    const dependents = new Set<string>();
    const toProcess = [nodeId];

    while (toProcess.length > 0) {
      const currentId = toProcess.pop();
      if (!currentId) continue;

      const outgoingEdges = this.edges.filter(e => e.source === currentId);
      for (const edge of outgoingEdges) {
        if (!dependents.has(edge.target)) {
          dependents.add(edge.target);
          toProcess.push(edge.target);
        }
      }
    }

    return Array.from(dependents);
  }

  /**
   * Find all predecessors of a node
   */
  findPredecessors(nodeId: string): string[] {
    const predecessors = new Set<string>();
    const toProcess = [nodeId];

    while (toProcess.length > 0) {
      const currentId = toProcess.pop();
      if (!currentId) continue;

      const incomingEdges = this.edges.filter(e => e.target === currentId);
      for (const edge of incomingEdges) {
        if (!predecessors.has(edge.source)) {
          predecessors.add(edge.source);
          toProcess.push(edge.source);
        }
      }
    }

    return Array.from(predecessors);
  }

  /**
   * Calculate execution order using topological sort
   */
  calculateExecutionOrder(): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    // Build graph
    this.edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find nodes with no incoming edges
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      result.push(current);

      adjList.get(current)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  /**
   * Get connected input/output port information for a node
   */
  getNodeConnectionInfo(nodeId: string): {
    connectedInputs: Set<string>;
    connectedOutputs: Set<string>;
  } {
    const connectedInputs = new Set<string>();
    const connectedOutputs = new Set<string>();

    this.edges.forEach(edge => {
      if (edge.target === nodeId && edge.targetHandle) {
        connectedInputs.add(edge.targetHandle);
      }
      if (edge.source === nodeId && edge.sourceHandle) {
        connectedOutputs.add(edge.sourceHandle);
      }
    });

    return { connectedInputs, connectedOutputs };
  }

  /**
   * Remove all edges connected to a node
   */
  removeNodeEdges(nodeId: string): Edge[] {
    return this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  }

  /**
   * Get root nodes (nodes with no incoming edges)
   */
  getRootNodes(): string[] {
    return this.nodes
      .filter(node => !this.edges.some(edge => edge.target === node.id))
      .map(node => node.id);
  }

  /**
   * Get leaf nodes (nodes with no outgoing edges)
   */
  getLeafNodes(): string[] {
    return this.nodes
      .filter(node => !this.edges.some(edge => edge.source === node.id))
      .map(node => node.id);
  }

  /**
   * Validate entire workflow structure
   */
  validateWorkflow(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for cycles
    const executionOrder = this.calculateExecutionOrder();
    if (executionOrder.length !== this.nodes.length) {
      errors.push('Workflow contains cycles');
    }

    // Check for disconnected nodes (optional warning)
    const rootNodes = this.getRootNodes();
    if (rootNodes.length === 0 && this.nodes.length > 0) {
      errors.push('No root nodes found - all nodes have incoming connections');
    }

    // Check for invalid connections
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);

      if (!sourceNode) {
        errors.push(`Invalid source node in edge: ${edge.source}`);
      }
      if (!targetNode) {
        errors.push(`Invalid target node in edge: ${edge.target}`);
      }

      // Check port bounds
      if (sourceNode && edge.sourceHandle) {
        const portIndex = parseInt(edge.sourceHandle.split('-')[1]);
        if (portIndex >= sourceNode.data.outputPorts) {
          errors.push(`Source port ${portIndex} out of bounds for node ${sourceNode.id}`);
        }
      }

      if (targetNode && edge.targetHandle) {
        const portIndex = parseInt(edge.targetHandle.split('-')[1]);
        if (portIndex >= targetNode.data.inputPorts) {
          errors.push(`Target port ${portIndex} out of bounds for node ${targetNode.id}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
