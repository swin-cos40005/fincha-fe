import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { SorterNodeModel } from './node-model';
import { SorterNodeDialog } from './node-dialog';
import { SorterNodeView } from './node-view';
import { FilterIcon } from '@/components/icons';

export class SorterNodeFactory extends NodeFactory<SorterNodeModel> {
  createNodeModel(): SorterNodeModel {
    return new SorterNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new SorterNodeDialog(this.createNodeModel());
  }

  createNodeViews(nodeModel: SorterNodeModel): NodeView<SorterNodeModel>[] {
    return [new SorterNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'sorter',
      name: 'Sorter',
      category: 'Data Processing',
      keywords: ['sort', 'order', 'arrange', 'ascending', 'descending', 'rank'],
      icon: FilterIcon,
    };
  }

  getNodeDetailedDescription(): string {
    return 'Sorts data by one or more columns in ascending or descending order. Configure multiple sort columns with priority order.';
  }

  getNodeShortDescription(): string {
    return 'Sort data by columns';
  }
}
