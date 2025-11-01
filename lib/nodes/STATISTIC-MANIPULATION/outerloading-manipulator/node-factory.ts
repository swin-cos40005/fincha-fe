import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { OuterLoadingManipulatorNodeModel } from './node-model';
import { OuterLoadingManipulatorNodeDialog } from './node-dialog';
import { OuterLoadingManipulatorNodeView } from './node-view';
import { ChartBarIcon } from '@/components/icons';
import { NODE_DESCRIPTION } from './node-description';

export class OuterLoadingManipulatorNodeFactory extends NodeFactory<OuterLoadingManipulatorNodeModel> {
  createNodeModel(): OuterLoadingManipulatorNodeModel {
    return new OuterLoadingManipulatorNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new OuterLoadingManipulatorNodeDialog(this.createNodeModel());
  }

  createNodeViews(
    nodeModel: OuterLoadingManipulatorNodeModel,
  ): NodeView<OuterLoadingManipulatorNodeModel>[] {
    return [new OuterLoadingManipulatorNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'outer_loading_manipulator',
      name: 'Outer Loading Manipulator',
      category: 'Statistic Manipulation',
      icon: ChartBarIcon,
      keywords: ['outer loading', 'PLS-SEM', 'structural equation modeling', 'factor analysis', 'statistics'],
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
}
