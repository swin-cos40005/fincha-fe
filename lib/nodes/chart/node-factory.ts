import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../core';
import { ChartNodeModel } from './node-model';
import { ChartNodeDialog } from './node-dialog';
import { ChartNodeView } from './node-view';
import { NODE_DESCRIPTION, NODE_SCHEMA } from './node-description';
import { ChartBarIcon } from '@/components/icons';

export class ChartNodeFactory extends NodeFactory<ChartNodeModel> {
  createNodeModel(): ChartNodeModel {
    return new ChartNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new ChartNodeDialog();
  }

  createNodeViews(nodeModel: ChartNodeModel): NodeView<ChartNodeModel>[] {
    return [new ChartNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'chart',
      name: 'Chart',
      category: 'Visualization',
      icon: ChartBarIcon,
      toDashboard: true,
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

  /**
   * Returns the configuration schema for AI agents
   */
  getNodeSchema() {
    return NODE_SCHEMA;
  }
}
