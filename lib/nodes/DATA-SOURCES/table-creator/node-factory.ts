import type { Node } from 'reactflow';
import {
  type NodeData,
  type NodeMetadata,
  type NodeView,
  NodeFactory
} from '@/lib/nodes/core';
import { TableCreatorNodeModel } from './node-model';
import { TableCreatorNodeDialog } from './node-dialog';
import { TableIcon } from '@/components/icons';
import { NODE_DESCRIPTION } from './node-description';

export class TableCreatorNodeFactory extends NodeFactory<TableCreatorNodeModel> {
  createNode(id: string): Node<NodeData> {
    return {
      id,
      type: 'customNode',
      data: {
        id,
        type: 'table_creator',
        label: 'Table Creator',
        settings: {}
      },
      position: { x: 0, y: 0 }
    };
  }

  createNodeModel(): TableCreatorNodeModel {
    return new TableCreatorNodeModel();
  }

  createNodeDialog(): TableCreatorNodeDialog | null {
    return new TableCreatorNodeDialog(this.createNodeModel());
  }

  createNodeViews(_nodeModel: TableCreatorNodeModel): NodeView<TableCreatorNodeModel>[] {
    return [];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'table_creator',
      name: 'Table Creator',
      category: 'Data Sources',
      icon: TableIcon,
      keywords: ['table', 'data', 'input', 'create']
    };
  }

  /**
   * Returns detailed description about the node
   */
  getNodeDetailedDescription(): string {
    return NODE_DESCRIPTION.detailedDescription.whatItDoes;
  }

  /**
   * Returns short description about the node
   */
  getNodeShortDescription(): string {
    return NODE_DESCRIPTION.shortDescription;
  }
}
