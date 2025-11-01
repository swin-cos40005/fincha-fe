import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { EVAManipulatorNodeModel } from './node-model';
import { EVAManipulatorNodeDialog } from './node-dialog';
import { EVAManipulatorNodeView } from './node-view';
import { ChartBarIcon } from '@/components/icons';
import { NODE_DESCRIPTION } from './node-description';

export class EVAManipulatorNodeFactory extends NodeFactory<EVAManipulatorNodeModel> {
  createNodeModel(): EVAManipulatorNodeModel {
    return new EVAManipulatorNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new EVAManipulatorNodeDialog(this.createNodeModel());
  }

  createNodeViews(
    nodeModel: EVAManipulatorNodeModel,
  ): NodeView<EVAManipulatorNodeModel>[] {
    return [new EVAManipulatorNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'eva_manipulator',
      name: 'EVA Manipulator',
      category: 'Statistic Manipulation',
      icon: ChartBarIcon,
      keywords: ['eva', 'ave', 'factor', 'loadings', 'reliability', 'validity', 'cfa', 'sem', 'synthetic'],
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
   * Returns the category of the node
   */
  getNodeCategory(): string {
    return 'Statistic Manipulation';
  }
}
