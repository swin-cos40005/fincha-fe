import React, { useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { NodeFactory, DataTableType } from '@/lib/nodes/core';

interface NodeViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  nodes: Node[];
  edges: Edge[];
}

// View dialog wrapper component
const ViewDialogWrapper: React.FC<{
  nodeView: any;
  outputs: DataTableType[];
}> = ({ nodeView, outputs }) => {
  // If we have outputs but the view doesn't have loaded data, set it
  useEffect(() => {
    if (outputs && outputs.length > 0) {
      if (typeof nodeView.setLoadedData === 'function') {
        // Pass all outputs for nodes with multiple outputs (like partition node)
        if (outputs.length > 1) {
          nodeView.setLoadedData(outputs);
        } else {
          nodeView.setLoadedData(outputs[0]);
        }
      }
    }
  }, [nodeView, outputs]);

  // Create the view panel
  const viewPanel = nodeView.createViewPanel();

  return <>{viewPanel}</>;
};

export const NodeViewDialog: React.FC<NodeViewDialogProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodes,
  edges,
}) => {
  if (!nodeId) return null;

  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !node.data.executed || node.data.status === 'error') return null;

  const factory = node.data.factory as NodeFactory<any>;
  const nodeModel = factory.createNodeModel();

  // Load settings into the model
  nodeModel.loadSettings(node.data.settings || {});

  // Create node views
  const nodeViews = factory.createNodeViews(nodeModel);
  if (nodeViews.length === 0) return null;

  const nodeView = nodeViews[0];

  // Pass the loaded data to the view if available
  if (node.data.outputs && node.data.outputs.length > 0) {
    if (typeof (nodeView as any).setLoadedData === 'function') {
      // Pass all outputs for nodes with multiple outputs (like partition node)
      if (node.data.outputs.length > 1) {
        (nodeView as any).setLoadedData(node.data.outputs);
      } else {
        (nodeView as any).setLoadedData(node.data.outputs[0]);
      }
    }
  }

  // For nodes that need input data (like missing values), pass the input data too
  if (typeof (nodeView as any).setInputData === 'function') {
    // Get input data from connected source nodes
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    if (incomingEdges.length > 0) {
      const sourceEdge = incomingEdges[0]; // Get first input for now
      const sourceNode = nodes.find((n) => n.id === sourceEdge.source);
      if (sourceNode?.data.outputs && sourceNode.data.outputs.length > 0) {
        const sourcePortIndex = sourceEdge.sourceHandle
          ? Number.parseInt(sourceEdge.sourceHandle.split('-')[1])
          : 0;
        const inputData = sourceNode.data.outputs[sourcePortIndex];
        if (inputData) {
          (nodeView as any).setInputData(inputData);
        }
      }
    }
  }

  // Notify the view that the model has changed to ensure it shows current data
  nodeView.onModelChanged();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            View Results - {node.data.label}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-hidden">
          <ViewDialogWrapper
            nodeView={nodeView}
            outputs={node.data.outputs || []}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
