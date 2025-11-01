import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { NormalizerNodeModel } from './node-model';
import { NormalizerNodeDialog } from './node-dialog';
import { NormalizerNodeView } from './node-view';
import { NODE_DESCRIPTION, NODE_SCHEMA } from './node-description';
import { NormalizerIcon } from '@/components/icons';

export class NormalizerNodeFactory extends NodeFactory<NormalizerNodeModel> {
  createNodeModel(): NormalizerNodeModel {
    return new NormalizerNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new NormalizerNodeDialog();
  }

  createNodeViews(
    nodeModel: NormalizerNodeModel,
  ): NodeView<NormalizerNodeModel>[] {
    return [new NormalizerNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'normalizer',
      name: 'Normalizer',
      category: 'Data Processing',
      keywords: [
        'normalize',
        'scale',
        'standardize',
        'min-max',
        'z-score',
        'decimal',
        'scaling',
        'statistics',
        'machine learning',
        'preprocessing',
      ],
      icon: NormalizerIcon,
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
  getNodeSchema(): any {
    return NODE_SCHEMA;
  }
}