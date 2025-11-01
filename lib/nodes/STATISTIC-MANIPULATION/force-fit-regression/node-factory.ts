import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { ForceRegressionNodeModel } from './node-model';
import { ForceRegressionNodeDialog } from './node-dialog';
import { ForceRegressionNodeView } from './node-view';
import { ChartBarIcon } from '@/components/icons';

const NODE_DESCRIPTION = {
  shortDescription: 'Generates synthetic regression data to meet specific statistical targets like R², beta coefficients, Cohen\'s f², or Q² values.',
  detailedDescription: {
    whatItDoes: 'The Force-Fit Regression Generator creates synthetic regression datasets that are optimized to achieve specific statistical targets. This powerful tool allows researchers and analysts to generate data with precise statistical properties for testing, validation, or educational purposes.'
  }
};

export class ForceRegressionNodeFactory extends NodeFactory<ForceRegressionNodeModel> {
  createNodeModel(): ForceRegressionNodeModel {
    return new ForceRegressionNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new ForceRegressionNodeDialog(this.createNodeModel());
  }

  createNodeViews(
    nodeModel: ForceRegressionNodeModel,
  ): NodeView<ForceRegressionNodeModel>[] {
    return [new ForceRegressionNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'force_regression_generator',
      name: 'Force-Fit Regression Generator',
      category: 'Statistic Manipulation',
      icon: ChartBarIcon,
      keywords: ['regression', 'force-fit', 'r-squared', 'beta', 'cohen', 'q-squared', 'synthetic', 'data', 'generation'],
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
