import type { Node, Edge, Connection } from 'reactflow';
import { toast } from 'sonner';
import { NodeRegistry } from '@/lib/nodes/node-registry';
import type { NodeData, WorkflowData } from '@/lib/types';

// Check if a connection would create a cycle
export const wouldCreateCycle = (
  connection: Connection,
  existingEdges: Edge[],
  nodes: Node[],
): boolean => {
  // Create a graph representation
  const graph = new Map<string, string[]>();

  // Add all nodes to the graph
  nodes.forEach((node) => {
    graph.set(node.id, []);
  });

  // Add existing edges
  existingEdges.forEach((edge) => {
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
};

// Validate a connection attempt
export const validateConnection = (
  connection: Connection,
  nodes: Node[],
  edges: Edge[],
): { isValid: boolean; message?: string } => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return { isValid: false, message: 'Invalid source or target node' };
  }

  // Prevent self-connection
  if (connection.source === connection.target) {
    return { isValid: false, message: 'Cannot connect a node to itself' };
  }

  // Check for cycles
  if (wouldCreateCycle(connection, edges, nodes)) {
    return {
      isValid: false,
      message: 'Cannot create connection: would create a cycle in the workflow',
    };
  }

  return { isValid: true };
};

// Handle connection creation with validation
export const handleConnection = (
  connection: Connection,
  nodes: Node[],
  edges: Edge[],
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  addEdge: (connection: Connection, edges: Edge[]) => Edge[],
) => {
  const validation = validateConnection(connection, nodes, edges);

  if (!validation.isValid) {
    toast.error(validation.message);
    return false;
  }

  // Check if target input already has a connection
  const existingEdges = edges.filter(
    (e) =>
      e.target === connection.target &&
      e.targetHandle === connection.targetHandle,
  );

  if (existingEdges.length > 0) {
    // Replace existing connection
    const updatedEdges = edges.filter(
      (e) =>
        !(
          e.target === connection.target &&
          e.targetHandle === connection.targetHandle
        ),
    );
    setEdges(addEdge(connection, updatedEdges));
    toast.info('Replaced existing connection');
  } else {
    // Add new connection
    setEdges(addEdge(connection, edges));
    toast.success('Connection created');
  }

  return true;
};

// Helper function to parse and visualize workflow structure
export function parseWorkflowStructure(content: string) {
  try {
    const workflow = JSON.parse(content);
    const { nodes = [], edges = [] } = workflow;

    // Create a map of node connections
    const connections: string[] = [];
    const nodeMap = new Map(nodes.map((node: any) => [node.id, node]));

    // Build connection strings using node labels and IDs
    edges.forEach((edge: any) => {
      const sourceNode = nodeMap.get(edge.source) as any;
      const targetNode = nodeMap.get(edge.target) as any;

      if (sourceNode && targetNode) {
        connections.push(
          `"${sourceNode.data?.label || 'Unknown'}" (${sourceNode.id}) -> "${targetNode.data?.label || 'Unknown'}" (${targetNode.id})`,
        );
      }
    });

    // Build settings summary with proper formatting
    const settings: string[] = [];
    nodes.forEach((node: any) => {
      if (node.data?.settings && Object.keys(node.data.settings).length > 0) {
        const settingsStr = Object.entries(node.data.settings)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        settings.push(
          `${node.data?.label || 'Unknown'} (${node.id}): ${settingsStr}`,
        );
      }
    });

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      connections:
        connections.length > 0 ? connections.join('\n') : 'No connections',
      settings:
        settings.length > 0 ? settings.join('\n') : 'No configured settings',
      structure: {
        nodes: nodes.map((node: any) => ({
          id: node.id,
          label: node.data?.label || 'Unknown',
          type: node.data?.factoryId || 'unknown',
          settings: node.data?.settings || {},
          position: node.position,
          status: node.data?.status || 'idle',
          executed: node.data?.executed || false,
          inputPorts: node.data?.inputPorts || 0,
          outputPorts: node.data?.outputPorts || 0,
        })),
        edges: edges.map((edge: any) => ({
          from: edge.source,
          to: edge.target,
          id: edge.id,
        })),
      },
    };
  } catch {
    return {
      nodeCount: 0,
      edgeCount: 0,
      connections: 'Failed to parse workflow structure',
      settings: 'Failed to parse workflow settings',
      structure: null,
    };
  }
}

// Helper function to get available nodes from registry
export function getAvailableNodes() {
  const registry = NodeRegistry.getInstance();
  const factories = registry.getAllFactories();

  return factories.map((factory) => {
    const metadata = factory.getNodeMetadata();
    return {
      id: metadata.id,
      category: metadata.category,
      shortDescription: factory.getNodeShortDescription(),
    };
  });
}

// Helper function to create a new node in workflow format
export function createWorkflowNode(
  factoryId: string,
  position: { x: number; y: number },
) {
  const registry = NodeRegistry.getInstance();
  const factory = registry.getFactory(factoryId);

  if (!factory) {
    throw new Error(`Node factory not found for ID: ${factoryId}`);
  }

  const metadata = factory.getNodeMetadata();
  const nodeModel = factory.createNodeModel();

  return {
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'customNode',
    position,
    data: {
      label: metadata.name,
      factoryId: metadata.id,
      settings: {},
      inputPorts: nodeModel.getInputPortCount(),
      outputPorts: nodeModel.getOutputPortCount(),
      status: 'idle',
      executed: false,
      // Include factory reference for runtime operations (will be removed during serialization)
      factory,
    },
  };
}

// Helper function to create edge between nodes
export function createWorkflowEdge(
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort = 0,
  targetPort = 0,
) {
  return {
    source: sourceNodeId,
    sourceHandle: `source-${sourcePort}`,
    target: targetNodeId,
    targetHandle: `target-${targetPort}`,
    id: `reactflow__edge-${sourceNodeId}source-${sourcePort}-${targetNodeId}target-${targetPort}`,
  };
}

// Helper function to calculate execution order
export function calculateExecutionOrder(nodes: Node<NodeData>[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });

  // Build graph
  edges.forEach((edge) => {
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

    adjList.get(current)?.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

// Helper function to generate system prompt from workflow data
export function generateWorkflowSystemPrompt(workflowData: WorkflowData): string {
  const { nodes, edges } = workflowData;
  let prompt = 'Workflow Structure:\n\n';

  // Add node information
  nodes.forEach((node) => {
    prompt += `Node "${node.data?.label}" (${node.id}):\n`;
    prompt += `  Type: ${node.data?.type}\n`;
    if (node.data?.settings) {
      prompt += '  Settings:\n';
      Object.entries(node.data.settings).forEach(([key, value]) => {
        prompt += `    ${key}: ${JSON.stringify(value)}\n`;
      });
    }
    prompt += '\n';
  });

  // Add edge information
  edges.forEach((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    prompt += `Connection: "${sourceNode?.data?.label}" -> "${targetNode?.data?.label}"\n`;
  });

  return prompt;
}

/**
 * Validates a node's settings object against its schema (required fields, allowed fields, enum values).
 * Throws an error if validation fails.
 */
export function validateSettingsAgainstSchema(
  nodeType: string,
  settings: Record<string, any>
): void {
  const registry = NodeRegistry.getInstance();
  const factory = registry.getFactory(nodeType);

  if (!factory) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }

  const schema = factory.getNodeSchema();
  if (!schema) {
    // No schema defined, skip validation
    return;
  }

  const requiredFields = schema.required || [];
  const properties = schema.properties || {};

  // Check for missing required fields
  for (const field of requiredFields) {
    if (!(field in settings) || settings[field] === undefined || settings[field] === null || settings[field] === '') {
      throw new Error(`Missing required setting '${field}' for node type '${nodeType}'. Expected fields: ${requiredFields.join(', ')}`);
    }
  }

  // Check for invalid fields (not in schema)
  for (const settingKey of Object.keys(settings)) {
    if (!(settingKey in properties)) {
      const validFields = Object.keys(properties);
      throw new Error(`Invalid setting '${settingKey}' for node type '${nodeType}'. Valid settings are: ${validFields.join(', ')}`);
    }
  }

  // Validate enum values if specified
  for (const [key, value] of Object.entries(settings)) {
    const property = properties[key];
    if (property && property.enum && !property.enum.includes(value)) {
      throw new Error(`Invalid value '${value}' for setting '${key}' in node type '${nodeType}'. Valid values are: ${property.enum.join(', ')}`);
    }
  }

  // Enhanced validation for complex objects (like dataMapping with oneOf)
  for (const [key, value] of Object.entries(settings)) {
    const property = properties[key];
    if (property && typeof value === 'object' && value !== null) {
      validateComplexProperty(key, value, property, nodeType);
    }
  }
}

/**
 * Validates complex properties that may have oneOf, nested objects, etc.
 */
function validateComplexProperty(
  propertyName: string,
  value: any,
  propertySchema: any,
  nodeType: string
): void {
  // Handle oneOf validation (used by dataMapping)
  if (propertySchema.oneOf && Array.isArray(propertySchema.oneOf)) {
    let validationPassed = false;
    let lastError = '';

    for (const oneOfSchema of propertySchema.oneOf) {
      try {
        validateObjectAgainstSchema(value, oneOfSchema);
        validationPassed = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown validation error';
      }
    }

    if (!validationPassed) {
      throw new Error(`Invalid ${propertyName} configuration for node type '${nodeType}'. ${lastError}`);
    }
  }
  // Handle regular object validation
  else if (propertySchema.type === 'object' && propertySchema.properties) {
    validateObjectAgainstSchema(value, propertySchema);
  }
}

/**
 * Validates an object against a schema with properties and required fields
 */
function validateObjectAgainstSchema(obj: any, schema: any): void {
  const required = schema.required || [];
  const properties = schema.properties || {};

  // Check required fields
  for (const field of required) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new Error(`Missing required field '${field}' in object`);
    }
  }

  // Check for invalid fields (if additionalProperties is false)
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(obj)) {
      if (!(key in properties)) {
        const validFields = Object.keys(properties);
        throw new Error(`Invalid field '${key}' in object. Valid fields are: ${validFields.join(', ')}`);
      }
    }
  }

  // Validate field types and enums
  for (const [key, value] of Object.entries(obj)) {
    const fieldSchema = properties[key];
    if (fieldSchema) {
      // Validate enum values
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        throw new Error(`Invalid value '${value}' for field '${key}'. Valid values are: ${fieldSchema.enum.join(', ')}`);
      }

      // Validate array types
      if (fieldSchema.type === 'array' && Array.isArray(value)) {
        if (fieldSchema.items && fieldSchema.items.type === 'string') {
          for (const item of value) {
            if (typeof item !== 'string') {
              throw new Error(`Array field '${key}' must contain only strings`);
            }
          }
        }
      }

      // Validate basic types
      if (fieldSchema.type && typeof value !== fieldSchema.type && fieldSchema.type !== 'array') {
        throw new Error(`Field '${key}' must be of type ${fieldSchema.type}, got ${typeof value}`);
      }
    }
  }
}

/**
 * Gets the configuration schema for a node type from the registry, with a fallback.
 */
export function getNodeConfigurationSchema(factoryId: string): any {
  const registry = NodeRegistry.getInstance();
  const factory = registry.getFactory(factoryId);

  if (!factory) {
    return null;
  }

  // Use the factory's schema method if available
  const schema = factory.getNodeSchema();
  if (schema) {
    return schema;
  }

  // Fallback to hardcoded schemas for backward compatibility
  const metadata = factory.getNodeMetadata();
  const fallbackSchema: any = {
    type: 'object',
    properties: {},
    required: [],
    description: `Configuration schema for ${metadata.name}`,
  };

  return fallbackSchema;
}

/**
 * Serializes workflow data for storage, stripping runtime-only fields (like factory instances).
 * Accepts either a workflow object ({nodes, edges}) or nodes/edges arrays directly.
 */
export function serializeWorkflowForStorage(
  workflowOrNodes: any,
  maybeEdges?: any[]
) {
  let nodes: any[];
  let edges: any[];
  if (Array.isArray(workflowOrNodes)) {
    nodes = workflowOrNodes;
    edges = maybeEdges || [];
  } else {
    nodes = workflowOrNodes.nodes || [];
    edges = workflowOrNodes.edges || [];
  }
  return {
    nodes: nodes.map((node: any) => ({
      ...node,
      data: {
        ...node.data,
        factory: undefined,
        // Deep copy settings
        settings: { ...(node.data?.settings || {}) },
      },
    })),
    edges: edges.map((edge: any) => ({ ...edge })),
  };
}
