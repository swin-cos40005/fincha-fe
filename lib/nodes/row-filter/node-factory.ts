import {
  NodeFactory,
  type NodeDialog,
  type NodeView,
  type NodeMetadata,
} from '../core';
import { FilterNodeModel } from './node-model';
import { FilterNodeDialog } from './node-dialog';
import { FilterNodeView } from './node-view';
import { NODE_DESCRIPTION, NODE_SCHEMA } from './node-description';
import { FilterIcon } from '@/components/icons';

export class FilterNodeFactory extends NodeFactory<FilterNodeModel> {
  createNodeModel(): FilterNodeModel {
    return new FilterNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new FilterNodeDialog();
  }

  createNodeViews(nodeModel: FilterNodeModel): NodeView<FilterNodeModel>[] {
    return [new FilterNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'filter',
      name: 'Row Filter',
      category: 'Data Processing',
      keywords: ['filter', 'where', 'condition', 'select', 'rows', 'subset'],
      icon: FilterIcon,
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
