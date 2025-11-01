import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { PartitionNodeModel } from './node-model';
import { PartitionNodeDialog } from './node-dialog';
import { PartitionNodeView } from './node-view';
import { NODE_DESCRIPTION } from './node-description';
import { RouteIcon } from '@/components/icons';

export class PartitionNodeFactory extends NodeFactory<PartitionNodeModel> {
  createNodeModel(): PartitionNodeModel {
    return new PartitionNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new PartitionNodeDialog();
  }

  createNodeViews(
    nodeModel: PartitionNodeModel,
  ): NodeView<PartitionNodeModel>[] {
    return [new PartitionNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'partition',
      name: 'Partition',
      category: 'Data Processing',
      icon: RouteIcon,
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
