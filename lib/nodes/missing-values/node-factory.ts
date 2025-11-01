import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { MissingValuesNodeModel } from './node-model';
import { MissingValuesNodeDialog } from './node-dialog';
import { MissingValuesNodeView } from './node-view';
import { NODE_DESCRIPTION } from './node-description';
import { MissingIcon } from '@/components/icons';

export class MissingValuesNodeFactory extends NodeFactory<MissingValuesNodeModel> {
  createNodeModel(): MissingValuesNodeModel {
    return new MissingValuesNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new MissingValuesNodeDialog();
  }

  createNodeViews(
    nodeModel: MissingValuesNodeModel,
  ): NodeView<MissingValuesNodeModel>[] {
    return [new MissingValuesNodeView(nodeModel)];
  }
  getNodeMetadata(): NodeMetadata {
    return {
      id: 'missing_values',
      name: 'Missing Values',
      category: 'Data Processing',
      keywords: [
        'missing',
        'null',
        'empty',
        'clean',
        'mean',
        'median',
        'frequent',
        'imputation',
      ],
      icon: MissingIcon,
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
