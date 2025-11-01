/**
 * Server-side workflow utilities for template processing
 */

import { NodeRegistry } from '@/lib/nodes/core';

/**
 * Reconstructs a workflow template on the server-side to ensure proper initialization
 * This applies the same logic as the client-side useWorkflowData hook
 */
export function reconstructWorkflowForStorage(templateData: any): any {
  if (!templateData.nodes || !templateData.edges) {
    return templateData;
  }

  const registry = NodeRegistry.getInstance();

  const reconstructedNodes = templateData.nodes
    .map((nodeData: any) => {
      const factoryId = nodeData.data?.factoryId || nodeData.factoryId || nodeData.id;
      
      const factory = registry.getFactory(factoryId);
      if (!factory) {
        console.warn(`Server-side reconstruction: Factory not found for ${factoryId}`);
        return nodeData; // Return original if factory not found
      }

      // Create the node model to trigger constructor (including configureDashboardOutput)
      const nodeModel = factory.createNodeModel();
      
      // Load saved settings if they exist
      const savedSettings = nodeData.data?.settings || nodeData.settings || {};
      if (Object.keys(savedSettings).length > 0) {
        const settingsForModel = {
          getString: (key: string, defaultValue?: string) => {
            if (key === 'dataMapping' && savedSettings.dataMapping) {
              if (typeof savedSettings.dataMapping === 'string') {
                return savedSettings.dataMapping;
              } else if (typeof savedSettings.dataMapping === 'object') {
                return JSON.stringify(savedSettings.dataMapping);
              }
            }
            return (savedSettings as any)[key] || defaultValue || '';
          },
          getNumber: (key: string, defaultValue?: number) => {
            const value = (savedSettings as any)[key];
            return typeof value === 'number' ? value : defaultValue || 0;
          },
          getBoolean: (key: string, defaultValue?: boolean) => {
            const value = (savedSettings as any)[key];
            return typeof value === 'boolean' ? value : defaultValue || false;
          },
          set: (key: string, value: any) => {
            (savedSettings as any)[key] = value;
          },
          // Also expose the raw settings for fallback reconstruction
          ...savedSettings,
        };

        // Load settings into the node model (this should NOT call configureDashboardOutput again)
        if (typeof nodeModel.loadSettings === 'function') {
          nodeModel.loadSettings(settingsForModel);
        }
      }

      // Get the metadata after construction
      const metadata = factory.getNodeMetadata();

      // Return the properly reconstructed node data
      return {
        id: nodeData.id,
        type: nodeData.type || 'customNode',
        position: nodeData.position,
        data: {
          label: metadata.name,
          factory, // Add factory reference for proper execution
          factoryId,
          settings: savedSettings,
          inputPorts: nodeModel.getInputPortCount(),
          outputPorts: nodeModel.getOutputPortCount(),
          // Preserve original execution state
          status: nodeData.data?.status || 'idle',
          executed: nodeData.data?.executed || false,
          outputs: nodeData.data?.outputs || undefined,
          error: nodeData.data?.error || undefined,
        },
      };
    })
    .filter(Boolean);

  // Return the reconstructed workflow data
  return {
    ...templateData,
    nodes: reconstructedNodes,
    edges: templateData.edges, // Edges don't need reconstruction
    metadata: {
      ...templateData.metadata,
      serverReconstructed: true,
      reconstructedAt: new Date().toISOString(),
    },
  };
}
