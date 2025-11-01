import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { HTMTManipulatorNodeModel } from './node-model';
import { HTMTManipulatorNodeDialog } from './node-dialog';
import { HTMTManipulatorNodeView } from './node-view';
import { ChartBarIcon } from '@/components/icons';
import { NODE_DESCRIPTION } from './node-description';

export class HTMTManipulatorNodeFactory extends NodeFactory<HTMTManipulatorNodeModel> {
  createNodeModel(): HTMTManipulatorNodeModel {
    return new HTMTManipulatorNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new HTMTManipulatorNodeDialog(this.createNodeModel());
  }

  createNodeViews(
    nodeModel: HTMTManipulatorNodeModel,
  ): NodeView<HTMTManipulatorNodeModel>[] {
    return [new HTMTManipulatorNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'htmt_manipulator',
      name: 'HTMT Manipulator',
      category: 'Statistic Manipulation',
      icon: ChartBarIcon,
      keywords: ['htmt', 'discriminant', 'validity', 'factor', 'analysis', 'sem', 'reliability', 'multi-group'],
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
