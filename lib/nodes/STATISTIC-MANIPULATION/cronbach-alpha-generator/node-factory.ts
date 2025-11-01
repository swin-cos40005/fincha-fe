import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { CronbachAlphaNodeModel } from './node-model';
import { CronbachAlphaNodeDialog } from './node-dialog';
import { CronbachAlphaNodeView } from './node-view';
import { ChartBarIcon } from '@/components/icons';
import { NODE_DESCRIPTION } from './node-description';

export class CronbachAlphaNodeFactory extends NodeFactory<CronbachAlphaNodeModel> {
  createNodeModel(): CronbachAlphaNodeModel {
    return new CronbachAlphaNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new CronbachAlphaNodeDialog(this.createNodeModel());
  }

  createNodeViews(
    nodeModel: CronbachAlphaNodeModel,
  ): NodeView<CronbachAlphaNodeModel>[] {
    return [new CronbachAlphaNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'cronbach_alpha_generator',
      name: 'Cronbach Alpha Generator',
      category: 'Statistic Manipulation',
      icon: ChartBarIcon,
      keywords: ['cronbach', 'alpha', 'reliability', 'synthetic', 'data', 'generation', 'survey'],
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
