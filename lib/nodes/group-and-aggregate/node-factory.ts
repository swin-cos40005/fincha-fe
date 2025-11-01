import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { GroupAndAggregateNodeModel } from './node-model';
import { GroupAndAggregateNodeDialog } from './node-dialog';
import { GroupAndAggregateNodeView } from './node-view';
import { NODE_DESCRIPTION } from './node-description';
import { Columns3Cog } from 'lucide-react';

/**
 * Factory for the Group and Aggregate Node
 */
export class GroupAndAggregateNodeFactory extends NodeFactory<GroupAndAggregateNodeModel> {
  /**
   * Creates a new node model instance
   */
  createNodeModel(): GroupAndAggregateNodeModel {
    return new GroupAndAggregateNodeModel();
  }

  /**
   * Creates the node dialog for configuration
   */
  createNodeDialog(): NodeDialog {
    return new GroupAndAggregateNodeDialog();
  }

  /**
   * Creates node views for visualization
   */
  createNodeViews(
    nodeModel: GroupAndAggregateNodeModel,
  ): NodeView<GroupAndAggregateNodeModel>[] {
    return [new GroupAndAggregateNodeView(nodeModel)];
  }
  /**
   * Returns metadata about the node
   */
  getNodeMetadata(): NodeMetadata {
    return {
      id: 'group_and_aggregate',
      name: 'Group and Aggregate',
      category: 'Data Processing',
      keywords: ['group', 'aggregate', 'sum', 'average', 'count', 'groupby'],
      icon: Columns3Cog,
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
