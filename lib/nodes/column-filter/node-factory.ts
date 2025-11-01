import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { ColumnFilterNodeModel } from './node-model';
import { ColumnFilterNodeDialog } from './node-dialog';
import { ColumnFilterNodeView } from './node-view';
import { NODE_DESCRIPTION } from './node-description';
import { TableIcon } from '@/components/icons';

export class ColumnFilterNodeFactory extends NodeFactory<ColumnFilterNodeModel> {
  createNodeModel(): ColumnFilterNodeModel {
    return new ColumnFilterNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new ColumnFilterNodeDialog();
  }

  createNodeViews(
    nodeModel: ColumnFilterNodeModel,
  ): NodeView<ColumnFilterNodeModel>[] {
    return [new ColumnFilterNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'column_filter',
      name: 'Column Filter',
      category: 'Data Processing',
      keywords: [
        'column',
        'select',
        'exclude',
        'drop',
        'keep',
        'filter columns',
      ],
      icon: TableIcon,
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
