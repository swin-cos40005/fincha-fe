/**
 * Base Node - Template for All Nodes
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Abstract template that defines the standard structure for all data processing nodes.',

  /**
   * Configuration Attributes
   */
  configuration: {
    inPorts: {
      description: 'Number of input data connections',
      type: 'number',
      purpose: 'Defines how many data streams flow into this node',
    },

    outPorts: {
      description: 'Number of output data connections',
      type: 'number',
      purpose: 'Defines how many data streams this node outputs',
    },
  },

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes:
      'Serves as the foundational template for all data processing nodes in the system.',
    whenToUse: 'Used as a blueprint when developing new custom node types.',
    keyFeatures: [
      'Standardized input/output port system',
      'Configuration dialog framework',
      'Data visualization framework',
      'Settings persistence',
    ],
  },
} as const;

export const NODE_SCHEMA = 
/**
 * Node Schema for AI Agent Configuration
 */
{
  type: 'object',
  description: 'Base schema template - all nodes extend this with their specific properties',
  properties: {
    // Base properties that all nodes inherit
    nodeType: {
      type: 'string',
      description: 'Type identifier for the node',
      const: 'base'
    }
  },
  required: ['nodeType'],
  additionalProperties: true
}