import { tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import {
  upsertWorkflowByConversationId,
  getWorkflowById,
  ensureChatAndWorkflowExist,
} from '@/lib/db/queries';
import { NodeRegistry } from '@/lib/nodes/node-registry';
import { createWorkflowNode, createWorkflowEdge, validateSettingsAgainstSchema, getNodeConfigurationSchema, serializeWorkflowForStorage } from '@/lib/workflow/utils';
import { WorkflowExecutionEngine } from '@/lib/workflow/execution-engine';
import { createWorkflowErrorResponse, createWorkflowSuccessResponse } from '@/lib/workflow/operations';
import { getDashboardItems } from '@/lib/db/dashboard-operations';
import { persistNodeDashboardItems } from '@/lib/dashboard/utils';

import { saveDashboardItem } from '@/lib/db/dashboard-operations';

// Tool 1: View Available Categories
export const viewAvailableCategories = () =>
  tool({
    description: 'View all available node categories in the workflow system.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const registry = NodeRegistry.getInstance();
        const factories = registry.getAllFactories();

        // Get unique categories
        const categories = [
          ...new Set(
            factories.map((factory) => factory.getNodeMetadata().category),
          ),
        ];

        let message = `📂 **Available Node Categories**\n\n`;
        categories.forEach((category) => {
          const nodeCount = factories.filter(
            (f) => f.getNodeMetadata().category === category,
          ).length;
          message += `• **${category}** (${nodeCount} nodes)\n`;
        });

        message += `\n💡 Use \`viewAvailableNodes\` with a category to see nodes in that category.`;

        return createWorkflowSuccessResponse(message, { categories });
      } catch (error) {
        return createWorkflowErrorResponse(error, 'Get categories');
      }
    },
  });

// Tool 2: View Available Nodes
export const viewAvailableNodes = () =>
  tool({
    description:
      'View available workflow nodes of multiple categories with detailed information including ports, settings schema, and configuration examples. Optionally filtered by category.',
    parameters: z.object({
      category: z
        .array(z.string())
        .optional()
        .describe(
          'Filter by category (e.g., "Data Processing", "Data Sources")',
        ),
    }),
    execute: async ({ category }) => {
      try {
        const registry = NodeRegistry.getInstance();
        const factories = registry.getAllFactories();

        // Show list of nodes with detailed information
        const filteredFactories = category && category.length > 0
          ? factories.filter((f) => category.includes(f.getNodeMetadata().category))
          : factories;

        if (filteredFactories.length === 0) {
          return createWorkflowErrorResponse(
            new Error(category && category.length > 0
              ? `No nodes found in categories: ${category.join(', ')}`
              : 'No workflow nodes available'),
            'Get nodes'
          );
        }

        // Group by category and include detailed schema information
        const nodesByCategory = filteredFactories.reduce(
          (acc, factory) => {
            const metadata = factory.getNodeMetadata();
            const nodeModel = factory.createNodeModel();
            const inputPorts = nodeModel.getInputPortCount();
            const outputPorts = nodeModel.getOutputPortCount();
            const schema = getNodeConfigurationSchema(metadata.id);

            if (!acc[metadata.category]) {
              acc[metadata.category] = [];
            }
            acc[metadata.category].push({
              id: metadata.id,
              name: metadata.name,
              shortDescription: factory.getNodeShortDescription(),
              detailedDescription: factory.getNodeDetailedDescription(),
              inputPorts,
              outputPorts,
              keywords: metadata.keywords || [],
              configurationSchema: schema,
              factory,
            });
            return acc;
          },
          {} as Record<string, any[]>,
        );

        let message = `📋 **Available Nodes with Detailed Schemas** ${category && category.length > 0 ? `(Categories: ${category.join(', ')})` : ''}\n\n`;

        Object.entries(nodesByCategory).forEach(([cat, nodes]) => {
          message += `**${cat}:**\n\n`;
          
          nodes.forEach((node) => {
            message += `### \`${node.id}\`: ${node.name}\n`;
            message += `**Description:** ${node.detailedDescription}\n`;
            message += `**Ports:** ${node.inputPorts} input, ${node.outputPorts} output\n`;
            
            if (node.keywords && node.keywords.length > 0) {
              message += `**Keywords:** ${node.keywords.join(', ')}\n`;
            }

            // Port Information
            message += `**Port Information:**\n`;
            if (node.inputPorts > 0) {
              message += `• Input ports (0 to ${Math.max(0, node.inputPorts - 1)}): Accept data from other nodes\n`;
            } else {
              message += `• No input ports - this is a source node\n`;
            }
            if (node.outputPorts > 0) {
              message += `• Output ports (0 to ${Math.max(0, node.outputPorts - 1)}): Provide data to other nodes\n`;
            } else {
              message += `• No output ports - this is a sink node\n`;
            }

            // Add detailed configuration schema
            if (node.configurationSchema) {
              message += `\n**Configuration Schema:**\n`;
              message += `${node.configurationSchema.description}\n\n`;

              if (node.configurationSchema.properties) {
                message += `**Required Settings:**\n`;
                if (node.configurationSchema.required && node.configurationSchema.required.length > 0) {
                  node.configurationSchema.required.forEach((prop: string) => {
                    const propSchema = node.configurationSchema.properties[prop];
                    message += `• \`${prop}\`: ${propSchema.description}\n`;
                    if (propSchema.enum) {
                      message += `  Valid values: ${propSchema.enum.join(', ')}\n`;
                    }
                  });
                } else {
                  message += `• No required settings\n`;
                }

                message += `\n**Optional Settings:**\n`;
                const optionalProps = Object.keys(node.configurationSchema.properties).filter(
                  (prop: string) => !node.configurationSchema.required?.includes(prop),
                );
                if (optionalProps.length > 0) {
                  optionalProps.forEach((prop: string) => {
                    const propSchema = node.configurationSchema.properties[prop];
                    message += `• \`${prop}\`: ${propSchema.description}\n`;
                    if (propSchema.enum) {
                      message += `  Valid values: ${propSchema.enum.join(', ')}\n`;
                    }
                  });
                } else {
                  message += `• No optional settings\n`;
                }
              }

              // Special handling for chart node examples - show all chart type schemas
              if (node.id === 'chart' && node.configurationSchema.examples) {
                message += `\n**Chart Type Examples:**\n`;
                node.configurationSchema.examples.forEach((example: any) => {
                  message += `\n**${example.chartType.toUpperCase()} Chart:**\n`;
                  message += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n`;
                });
              }
            } else {
              message += `\n**Configuration:** No specific configuration required\n`;
            }

            message += `\n---\n\n`;
          });
        });

        message += `💡 Use \`modifyWorkflow\` to add and configure any of these nodes in your workflow.`;

        const nodeData = filteredFactories.map((f) => {
          const metadata = f.getNodeMetadata();
          const nodeModel = f.createNodeModel();
          return {
            id: metadata.id,
            name: metadata.name,
            category: metadata.category,
            shortDescription: f.getNodeShortDescription(),
            detailedDescription: f.getNodeDetailedDescription(),
            inputPorts: nodeModel.getInputPortCount(),
            outputPorts: nodeModel.getOutputPortCount(),
            keywords: metadata.keywords || [],
            configurationSchema: getNodeConfigurationSchema(metadata.id),
          };
        });

        return createWorkflowSuccessResponse(message, { nodes: nodeData });
      } catch (error) {
        return createWorkflowErrorResponse(error, 'Get nodes');
      }
    },
  });

// Tool 3: Modify Workflow (consolidated tool)
export const modifyWorkflow = (
  session: Session,
  dataStream?: any,
  conversationId?: string,
) =>
  tool({
    description:
      'Comprehensive workflow modification tool that can add/update multiple nodes and edges in a single operation.',
    parameters: z.object({
      nodes: z
        .array(
          z.object({
            id: z
              .string()
              .optional()
              .describe(
                'Node ID (required only when updating existing node)',
              ),
            nodeType: z
              .string()
              .optional()
              .describe(
                'Node type ID (e.g., "data_input", "chart")',
              ),
            position: z
              .object({
                x: z.number().describe('X coordinate (pixels)'),
                y: z.number().describe('Y coordinate (pixels)'),
              })
              .optional()
              .describe('Position for the node (will use default position if not provided)'),
            settings: z
              .any()
              .optional()
              .describe(
                'Node configuration settings based on the node type schema',
              ),
          }),
        )
        .optional()
        .describe('Nodes to add or update'),
      edges: z
        .array(
          z.object({
            sourceNodeId: z
              .string()
              .describe('ID of the source node (data flows from)'),
            targetNodeId: z
              .string()
              .describe('ID of the target node (data flows to)'),
            sourcePort: z
              .number()
              .default(0)
              .describe('Output port number of source node (0-based)'),
            targetPort: z
              .number()
              .default(0)
              .describe('Input port number of target node (0-based)'),
          }),
        )
        .optional()
        .describe('Edges to add between nodes'),
      removeNodes: z
        .array(z.string())
        .optional()
        .describe('Node IDs to remove'),
      removeEdges: z
        .array(z.string())
        .optional()
        .describe('Edge IDs to remove'),
    }),
    execute: async ({
      nodes = [],
      edges = [],
      removeNodes = [],
      removeEdges = [],
    }) => {      
      try {
        if (!conversationId || !session?.user?.id) {
          return createWorkflowErrorResponse(
            new Error('Missing context'),
            'Modify workflow'
          );
        }

        // Get or create workflow using direct database operations (server-side)
        let workflow = await getWorkflowById({ chatId: conversationId });
        if (!workflow) {
          await ensureChatAndWorkflowExist({
            chatId: conversationId,
            userId: session.user.id,
          });
          workflow = await getWorkflowById({ chatId: conversationId });
        }

        const operationResults: string[] = [];
        const createdNodes: { id: string; label: string; type: string }[] = [];
        const createdEdges: { id: string; source: string; target: string }[] = [];

        // This workflow variable will be used for the final save operation

        let workflowData: { nodes: any[]; edges: any[] } = {
          nodes: [],
          edges: [],
        };
        if (workflow?.content) {
          try {
            workflowData = JSON.parse(workflow.content);
          } catch (error) {
            // console.error('Failed to parse workflow content:', error);
          }
        }

        const registry = NodeRegistry.getInstance();

        // Remove nodes first
        if (removeNodes.length > 0) {
          const removedCount = workflowData.nodes.length;
          workflowData.nodes = workflowData.nodes.filter(
            (node: any) => !removeNodes.includes(node.id),
          );
          workflowData.edges = workflowData.edges.filter(
            (edge: any) =>
              !removeNodes.includes(edge.source) &&
              !removeNodes.includes(edge.target),
          );
          const actualRemoved = removedCount - workflowData.nodes.length;
          operationResults.push(`🗑️ Removed ${actualRemoved} nodes`);
        }

        // Remove edges
        if (removeEdges.length > 0) {
          const removedCount = workflowData.edges.length;
          workflowData.edges = workflowData.edges.filter(
            (edge: any) => !removeEdges.includes(edge.id),
          );
          const actualRemoved = removedCount - workflowData.edges.length;
          operationResults.push(`🗑️ Removed ${actualRemoved} edges`);
        }
        // Add or update nodes
        for (const nodeSpec of nodes) {
          // Validate nodeType is provided for new nodes
          if (!nodeSpec.nodeType && !nodeSpec.id) {
            operationResults.push(
              `❌ Failed to create node: nodeType is required for new nodes`,
            );
            continue;
          }
          
          // For updates, get nodeType from existing node if not provided
          let nodeType = nodeSpec.nodeType;
          if (!nodeType && nodeSpec.id) {
            const existingNode = workflowData.nodes.find((n) => n.id === nodeSpec.id);
            if (existingNode) {
              nodeType = existingNode.data?.factoryId || existingNode.data?.factory?.getNodeMetadata()?.id;
            }
            if (!nodeType) {
              operationResults.push(
                `❌ Failed to update node: Could not determine nodeType for node "${nodeSpec.id}"`,
              );
              continue;
            }
          }
          
          // At this point, nodeType should be defined
          if (!nodeType) {
            operationResults.push(
              `❌ Failed to process node: nodeType is undefined`,
            );
            continue;
          }
          
          // TypeScript doesn't know that nodeType is defined here, so we assert it
          const validatedNodeType = nodeType as string;
          const factory = registry.getFactory(validatedNodeType);
                      if (!factory) {
              operationResults.push(
                `❌ Failed to create node: "${validatedNodeType}" not found`,
              );
              continue;
            }
          
          // Check if updating existing node
          const existingNodeIndex = nodeSpec.id
            ? workflowData.nodes.findIndex((n) => n.id === nodeSpec.id)
            : -1;
          if (existingNodeIndex >= 0) {
            // Update existing node
            const existingNode = workflowData.nodes[existingNodeIndex];
            let nodeWasConfigured = false;
            
            // Log detailed node configuration for chart nodes
            if (validatedNodeType === 'chart' && nodeSpec.settings) {
              
              // Log current settings before update
              
              // Log incoming settings
              
              // Log each setting property in detail
              
              // Special focus on dataMapping if present
              if (nodeSpec.settings.dataMapping) {
                
                
                if (typeof nodeSpec.settings.dataMapping === 'object') {
                  Object.entries(nodeSpec.settings.dataMapping).forEach(([key, value]) => {
                    
                  });
                }
              }
            }
            
            if (nodeSpec.position) {
              existingNode.position = nodeSpec.position;
            }
            
            if (
              nodeSpec.settings &&
              Object.keys(nodeSpec.settings).length > 0
            ) {
              // Log validation attempt for chart nodes
              if (validatedNodeType === 'chart') {
                
              }
              
              // Validate settings against schema
              try {
                validateSettingsAgainstSchema(validatedNodeType, nodeSpec.settings);
                if (validatedNodeType === 'chart') {
                  
                }
              } catch (validationError) {
                if (validatedNodeType === 'chart') {
                  
                }
                throw validationError;
              }
              
              // Ensure data property exists
              if (!existingNode.data) {
                existingNode.data = {};
              }
              
              // Log before settings replacement for chart nodes
              if (validatedNodeType === 'chart') {
                
              }
              
              // Completely replace settings instead of merge to avoid stale data
              existingNode.data.settings = nodeSpec.settings;
              nodeWasConfigured = true;
              // Ensure factory reference exists (restore if missing after deserialization)
              if (!existingNode.data.factory) {
                const factory = registry.getFactory(validatedNodeType);
                if (factory) {
                  existingNode.data.factory = factory;
                }
              }

              // Add configuration summary to results
              const settingKeys = Object.keys(nodeSpec.settings);
              operationResults.push(
                `  ⚙️ Configured ${settingKeys.length} settings: ${settingKeys.join(', ')}`
              );
              
              // Add detailed chart configuration to results
              if (nodeSpec.nodeType === 'chart') {
                const chartSettings = nodeSpec.settings;
                operationResults.push(
                  `  📊 Chart Type: ${chartSettings.chartType || 'not set'}`
                );
                operationResults.push(
                  `  📝 Title: ${chartSettings.title || 'not set'}`
                );
                if (chartSettings.dataMapping) {
                  operationResults.push(
                    `  🗺️ Data Mapping: ${JSON.stringify(chartSettings.dataMapping)}`
                  );
                } else {
                  operationResults.push(
                    `  🗺️ Data Mapping: not set`
                  );
                }
              }
            }

            operationResults.push(
              `🔄 Updated node "${existingNode.data.label}" (${existingNode.id})`,
            );

            // Emit specific node configuration event if this was a configuration update
            if (nodeWasConfigured && dataStream) {
              dataStream.writeData({
                type: 'workflow-structure-update',
                content: {
                  type: 'node-configured',
                  conversationId,
                  nodeId: existingNode.id,
                  workflowData: serializeWorkflowForStorage(workflowData),
                },
              });
            }
          } else {
            // Provide default position if not specified (AI tools may not always provide position)
            const defaultPosition = { x: 100, y: 100 };
            const position = nodeSpec.position || defaultPosition;
            
            const newNode = createWorkflowNode(
              validatedNodeType,
              position,
            );

            // Log new chart node creation
            if (validatedNodeType === 'chart' && nodeSpec.settings) {
              
            }

            if (
              nodeSpec.settings &&
              Object.keys(nodeSpec.settings).length > 0
            ) {
              // Validate settings against schema
              validateSettingsAgainstSchema(validatedNodeType, nodeSpec.settings);
              
              newNode.data.settings = nodeSpec.settings;
              
              // Log new chart node final state
              if (validatedNodeType === 'chart') {
                
              }
              
              // Add configuration summary to results
              const settingKeys = Object.keys(nodeSpec.settings);
              operationResults.push(
                `  ⚙️ Configured ${settingKeys.length} settings: ${settingKeys.join(', ')}`
              );
            }

            workflowData.nodes.push(newNode);
            createdNodes.push({
              id: newNode.id,
              label: newNode.data.label,
              type: validatedNodeType,
            });
            operationResults.push(
              `✅ Added node "${newNode.data.label}" (${newNode.id})`,
            );
          }
        }

        // Add edges
        for (const edgeSpec of edges) {
          // Verify nodes exist
          const sourceNode = workflowData.nodes.find(
            (n) => n.id === edgeSpec.sourceNodeId,
          );
          const targetNode = workflowData.nodes.find(
            (n) => n.id === edgeSpec.targetNodeId,
          );

          if (!sourceNode || !targetNode) {
            operationResults.push(
              `❌ Failed to create edge: ${!sourceNode ? `Source "${edgeSpec.sourceNodeId}"` : `Target "${edgeSpec.targetNodeId}"`} not found`,
            );
            continue;
          }

          // Validate port numbers
          if (
            edgeSpec.sourcePort >= sourceNode.data.outputPorts ||
            edgeSpec.sourcePort < 0
          ) {
            operationResults.push(
              `❌ Invalid source port ${edgeSpec.sourcePort} for node "${sourceNode.data.label}" (has ${sourceNode.data.outputPorts} output ports)`,
            );
            continue;
          }

          if (
            edgeSpec.targetPort >= targetNode.data.inputPorts ||
            edgeSpec.targetPort < 0
          ) {
            operationResults.push(
              `❌ Invalid target port ${edgeSpec.targetPort} for node "${targetNode.data.label}" (has ${targetNode.data.inputPorts} input ports)`,
            );
            continue;
          }

          // Create edge
          const newEdge = createWorkflowEdge(
            edgeSpec.sourceNodeId,
            edgeSpec.targetNodeId,
            edgeSpec.sourcePort,
            edgeSpec.targetPort,
          );

          // Check for duplicate
          const edgeExists = workflowData.edges.some(
            (edge) =>
              edge.source === edgeSpec.sourceNodeId &&
              edge.target === edgeSpec.targetNodeId &&
              edge.sourceHandle === newEdge.sourceHandle &&
              edge.targetHandle === newEdge.targetHandle,
          );

          if (edgeExists) {
            operationResults.push(
              `⚠️ Edge already exists between "${sourceNode.data.label}" port ${edgeSpec.sourcePort} and "${targetNode.data.label}" port ${edgeSpec.targetPort}`,
            );
            continue;
          }

          workflowData.edges.push(newEdge);
          createdEdges.push({
            id: newEdge.id,
            source: sourceNode.data.label,
            target: targetNode.data.label,
          });
          operationResults.push(
            `🔗 Connected "${sourceNode.data.label}" → "${targetNode.data.label}"`,
          );
        }
        await upsertWorkflowByConversationId({
          title: workflow?.title || 'Workflow',
          content: JSON.stringify(serializeWorkflowForStorage(workflowData)),
          conversationId,
        });
        // Emit update event
        if (dataStream) {
          dataStream.writeData({
            type: 'workflow-structure-update',
            content: {
              type: 'workflow-modified',
              conversationId,
              operations: operationResults,
              workflowData: serializeWorkflowForStorage(workflowData),
            },
          });
        }

        // Build result message
        let message = `✅ **Workflow Modified Successfully!**\n\n`;
        if (operationResults.length > 0) {
          message += `**Operations:**\n`;
          operationResults.forEach((result) => {
            message += `${result}\n`;
          });
        }

        if (createdNodes.length > 0) {
          message += `\n**New Nodes:**\n`;
          createdNodes.forEach((node) => {
            message += `• ${node.label} (${node.type}) - ID: \`${node.id}\`\n`;
          });
        }

        if (createdEdges.length > 0) {
          message += `\n**New Connections:**\n`;
          createdEdges.forEach((edge) => {
            message += `• ${edge.source} → ${edge.target}\n`;
          });
        }

        message += `\n💡 Use \`executeWorkflow\` to run the workflow.`;

        return {
          success: true,
          message,
          operations: operationResults,
          createdNodes,
          createdEdges,
          totalNodes: workflowData.nodes.length,
          totalEdges: workflowData.edges.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `❌ **Failed to modify workflow:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

// Tool 4: Execute Workflow
export const executeWorkflow = (
  session: Session,
  dataStream?: any,
  conversationId?: string,
) =>
  tool({
    description:
      'Execute the entire workflow or specific nodes. This will run the actual data processing.',
    parameters: z.object({
      nodeIds: z
        .array(z.string())
        .optional()
        .describe(
          'Specific node IDs to execute (if empty, executes entire workflow)',
        ),
    }),
    execute: async ({ nodeIds }) => {
      try {
        if (!conversationId || !session?.user?.id) {
          return {
            success: false,
            error: 'Missing context',
            message: '❌ **No conversation context or user authentication**',
          };
        }

        // Get workflow from database (server-side)
        const workflow = await getWorkflowById({ chatId: conversationId });
        if (!workflow?.content) {
          return {
            success: false,
            error: 'No workflow found',
            message: '❌ **No workflow found**',
          };
        }

        let workflowData: any;
        try {
          workflowData = JSON.parse(workflow.content);
        } catch {
          return {
            success: false,
            error: 'Invalid workflow data',
            message: '❌ **Invalid workflow data**',
          };
        }

        if (workflowData.nodes.length === 0) {
          return {
            success: false,
            error: 'Empty workflow',
            message: '❌ **No nodes in workflow** - Add nodes first',
          };
        }

        // Reconstruct factory instances for nodes for execution
        const registry = NodeRegistry.getInstance();
        workflowData.nodes = workflowData.nodes.map((node: any) => {
          const factoryId = node.data?.factoryId || node.factoryId;
          if (!factoryId) {
            throw new Error(`Node ${node.id} is missing factoryId`);
          }

          const factory = registry.getFactory(factoryId);
          if (!factory) {
            throw new Error(`Factory not found for node type: ${factoryId}`);
          }

          const nodeModel = factory.createNodeModel();

          return {
            ...node,
            data: {
              ...node.data,
              factory,
              factoryId,
              inputPorts: node.data.inputPorts || nodeModel.getInputPortCount(),
              outputPorts: node.data.outputPorts || nodeModel.getOutputPortCount(),
              // Reset execution state for fresh execution
              status: 'idle',
              executed: false,
              outputs: undefined,
              error: undefined,
            },
          };
        });

        const executedNodes: string[] = [];
        const executionResults: any[] = [];

        const nodes = workflowData.nodes;
        if (nodes.length === 0) {
          return {
            success: false,
            error: 'Empty workflow',
            message: '❌ **No nodes in workflow** - Add nodes first',
          };
        }

        // Send execution start event
        if (dataStream) {
          dataStream.writeData({
            type: 'workflow-execution-update',
            content: {
              conversationId,
              type: 'start',
              targetNodes: nodeIds
                ? nodes
                    .filter((n: any) => nodeIds.includes(n.id))
                    .map((n: any) => ({ id: n.id, label: n.data.label }))
                : nodes.map((n: any) => ({
                    id: n.id,
                    label: n.data.label,
                  })),
              executeAll: !nodeIds,
            },
          });
        }
        // Create execution engine with dashboard persistence
        const executionEngine = new WorkflowExecutionEngine(
          async (nodeId: string, status: string, outputs?: any[], error?: string, context?: any) => {
            // Update workflow data
            workflowData.nodes = workflowData.nodes.map((node: any) => {
              if (node.id === nodeId) {
                const updatedNode = {
                  ...node,
                  data: {
                    ...node.data,
                    status,
                    executed: status !== 'idle' && status !== 'reset',
                    outputs,
                    error,
                  },
                };

                if (status === 'success' || status === 'error') {
                  const existingResult = executionResults.find(
                    (r: any) => r.nodeId === nodeId,
                  );
                  if (!existingResult) {
                    executionResults.push({
                      nodeId,
                      nodeLabel: node.data.label,
                      status,
                      outputs,
                      error,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                return updatedNode;
              }
              return node;
            });

            // Handle dashboard persistence using unified function
            if (status === 'success' && context && conversationId) {
              executedNodes.push(nodeId);
              try {
                for (const dashboardItem of context.dashboardItems || []) {
                  await saveDashboardItem(conversationId, nodeId, dashboardItem);
                }
              } catch (dashboardError) {
                // console.error('❌ [Execution] Dashboard persistence error:', {
                //   nodeId,
                //   error: dashboardError instanceof Error ? dashboardError.message : String(dashboardError),
                // });
              }
            }
            // Send real-time update
            if (dataStream) {
              const currentNode = workflowData.nodes.find(
                (n: any) => n.id === nodeId,
              );
              dataStream.writeData({
                type: 'workflow-execution-update',
                content: {
                  conversationId,
                  type: 'node-update',
                  nodeId,
                  nodeLabel: currentNode?.data.label,
                  status,
                  outputs,
                  error,
                  timestamp: new Date().toISOString(),
                },
              });
            }
          },
        );

        // Set up and execute workflow
        executionEngine.setWorkflow(workflowData.nodes, workflowData.edges);

        if (nodeIds && nodeIds.length > 0) {
          // Execute specific nodes
          for (const nodeId of nodeIds) {
            const node = workflowData.nodes.find((n: any) => n.id === nodeId);
            if (!node) {
              return {
                success: false,
                error: 'Node not found',
                message: `❌ **Node not found:** "${nodeId}"`,
              };
            }
            await executionEngine.executeNodeWithDependencies(nodeId);
          }
        } else {
          // Execute entire workflow
          await executionEngine.executeWorkflow();
        }

        // Note: Dashboard items are now persisted during execution via the callback
        // No need for separate processExecutionResults call

        // Save updated workflow
        await upsertWorkflowByConversationId({
          title: workflow.title,
          content: JSON.stringify(serializeWorkflowForStorage(workflowData)),
          conversationId,
        });

        // Send completion event
        if (dataStream) {
          dataStream.writeData({
            type: 'workflow-execution-update',
            content: {
              conversationId,
              type: 'complete',
              executedNodes,
              executionResults,
              executeAll: !nodeIds,
              success: true,
            },
          });
        }

        const successCount = executionResults.filter(
          (r) => r.status === 'success',
        ).length;
        const errorCount = executionResults.filter(
          (r) => r.status === 'error',
        ).length;

        // Build detailed results message
        let detailedResults = '';
        if (executionResults.length > 0) {
          detailedResults = '\n\n**Execution Results:**\n\n';
          executionResults.forEach((result) => {
            detailedResults += `**${result.nodeLabel}** (${result.status === 'success' ? '✅' : '❌'})\n`;
            if (result.error) {
              detailedResults += `Error: ${result.error}\n\n`;
            }
          });
        }

        return createWorkflowSuccessResponse(
          `✅ **Execution Complete!**\n\n**Target:** ${nodeIds ? `${nodeIds.length} specific nodes` : 'Entire workflow'}\n**Successful:** ${successCount} nodes\n**Failed:** ${errorCount} nodes${detailedResults}💡 Check the workflow editor to see execution results and data.`,
          {
            executedNodes,
            executionResults,
            successCount,
            errorCount,
          }
        );
      } catch (error) {
        return createWorkflowErrorResponse(error, 'Execution');
      }
    },
  });

// Tool 5: Read Dashboard Data
export const readDashboardData = (
  session: Session,
  conversationId?: string,
) =>
  tool({
    description:
      'Read dashboard data stored in the database.',
    parameters: z.object({
      itemIds: z
        .array(z.string())
        .optional()
        .describe(
          'Specific dashboard item IDs to read. Leave empty to read all items.',
        ),
      itemTypes: z
        .array(z.enum(['chart', 'table', 'statistics', 'all']))
        .describe(
          'Filter by item types. Use "all" to read all types.',
        ),
    }),
    execute: async ({ itemIds, itemTypes }) => {
      try {
        if (!conversationId || !session?.user?.id) {
          return {
            success: false,
            error: 'Missing context',
            message: '❌ **No conversation context or user authentication**',
          };
        }
        // Get all dashboard items for this chat
        const allItems = await getDashboardItems(conversationId);
        // Filter items based on parameters
        let filteredItems = allItems;
        if (!itemTypes.includes('all')) {
          if (itemIds && itemIds.length > 0) {
            filteredItems = filteredItems.filter(item => itemIds.includes(item.id));
          }
          
          if (itemTypes && itemTypes.length > 0) {
            filteredItems = filteredItems.filter(item => itemTypes.includes(item.type as any));
          }
        }

        if (filteredItems.length === 0) {
          return {
            success: true,
            message: '📊 **No Dashboard Data Found**\n\nNo dashboard items match the specified criteria. Execute workflow nodes to generate data.',
            items: [],
            totalItems: 0,
            itemsByType: {
              table: 0,
              statistics: 0,
              chart: 0,
            },
          };
        }

        // Format the data for AI consumption
        let message = `📊 **Dashboard Data Summary**\n\n`;
        message += `Found **${filteredItems.length}** dashboard items:\n\n`;

        const formattedItems = filteredItems.map(item => {
          // Log item being processed
          
          const baseInfo = {
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            nodeId: item.nodeId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };

          switch (item.type) {
            case 'table': {
              const tableData = item.data as any;
              message += `📋 **${item.title}** (Table)\n`;
              message += `- Item id: ${item.id}\n`;
              message += `- Node id: ${item.nodeId}\n`;
              message += `- Columns: ${tableData.columns?.length || 0}\n`;
              message += `- Sample Rows: ${tableData.rows?.length || 0} (showing first 5)\n`;
              message += `- Total Rows: ${tableData.totalRows || 'unknown'}\n`;
              
              if (tableData.columns && tableData.rows) {
                if (tableData.rows.length > 0) {
                  message += `- Sample Data (first row): ${JSON.stringify(tableData.rows[0])}\n`;
                }
              }
              message += '\n';
              
              return {
                ...baseInfo,
                data: {
                  columns: tableData.columns || [],
                  rows: tableData.rows || [], // Only first 5 rows as per storage rules
                  totalRows: tableData.totalRows || tableData.rows?.length || 0,
                },
                summary: `Table with ${tableData.columns?.length || 0} columns and ${tableData.totalRows || tableData.rows?.length || 0} total rows`,
              };
            }

            case 'statistics': {
              const statsData = item.data as any;
              message += `🔢 **${item.title}** (Statistics)\n`;
              message += `- Item Id: ${item.id}\n`;
              message += `- Node: ${item.nodeId}\n`;
              message += `- Summary: ${statsData.summary || 'N/A'}\n`;
              
              const metricCount = Object.keys(statsData.metrics || {}).length;
              const detailCount = Object.keys(statsData.details || {}).length;
              
              message += `- Metrics: ${metricCount} items\n`;
              message += `- Details: ${detailCount} items\n`;
              
              if (metricCount > 0) {
                const firstMetric = Object.entries(statsData.metrics)[0];
                message += `- Sample Metric: ${firstMetric[0]} = ${firstMetric[1]}\n`;
              }
              message += '\n';
              
              return {
                ...baseInfo,
                data: {
                  summary: statsData.summary || '',
                  metrics: statsData.metrics || {}, // Metric-value pairs
                  details: statsData.details || {},
                },
                summary: `Statistics with ${metricCount} metrics and ${detailCount} detail items`,
              };
            }

            case 'chart': {
              const chartData = item.data as any;
              message += `📊 **${item.title}** (Chart)\n`;
              message += `- Item Id: ${item.id}\n`;
              message += `- Node: ${item.nodeId}\n`;
              message += `- Chart Type: ${chartData.chartType || 'unknown'}\n`;
              message += `- Description: ${item.description || 'No description'}\n`;
              message += `- Data Snapshot: ${chartData.dataSnapshot ? 'Available' : 'No data'}\n`;
              
              if (chartData.config) {
                const configKeys = Object.keys(chartData.config);
                message += `- Configuration: ${configKeys.join(', ')}\n`;
              }
              message += '\n';
              
              return {
                ...baseInfo,
                data: {
                  chartType: chartData.chartType || 'unknown',
                  title: item.title,
                  description: item.description || '',
                  id: item.id,
                  // Only include basic metadata for charts as per requirements
                },
                summary: `${chartData.chartType || 'Chart'} visualization: ${item.title}`,
              };
            }

            default:
              message += `❓ **${item.title}** (${item.type})\n`;
              message += `- Node: ${item.nodeId}\n`;
              message += `- Data: Available\n\n`;
              
              return {
                ...baseInfo,
                data: item.data,
                summary: `${item.type} data item`,
              };
          }
        });
        message += `💡 **Usage Notes:**\n`;
        message += `• Table data shows only first 5 rows for storage efficiency\n`;
        message += `• Statistics show metric-value pairs for analysis\n`;
        message += `• Chart data includes type, config, and data snapshots\n`;
        message += `• Use this data to generate insights and recommendations\n`;

        return {
          success: true,
          message,
          items: formattedItems,
          totalItems: filteredItems.length,
          itemsByType: {
            table: filteredItems.filter(i => i.type === 'table').length,
            statistics: filteredItems.filter(i => i.type === 'statistics').length,
            chart: filteredItems.filter(i => i.type === 'chart').length,
          },
        };

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `❌ **Failed to read dashboard data:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });
