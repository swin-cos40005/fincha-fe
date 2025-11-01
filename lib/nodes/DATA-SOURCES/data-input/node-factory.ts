import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../../core';
import { DataInputNodeModel } from './node-model';
import { DataInputNodeDialog } from './node-dialog';
import { DataInputNodeView } from './node-view';
import { NODE_DESCRIPTION, NODE_SCHEMA } from './node-description';
import { FileIcon } from '@/components/icons';

export class DataInputNodeFactory extends NodeFactory<DataInputNodeModel> {
  createNodeModel(): DataInputNodeModel {
    return new DataInputNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new DataInputNodeDialog();
  }

  createNodeViews(
    nodeModel: DataInputNodeModel,
  ): NodeView<DataInputNodeModel>[] {
    return [new DataInputNodeView(nodeModel)];
  }
  getNodeMetadata(): NodeMetadata {
    return {
      id: 'data_input',
      name: 'Data Input',
      category: 'Data Sources',
      icon: FileIcon,
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
   * Returns the configuration schema for AI agents
   */
  getNodeSchema() {
    return NODE_SCHEMA;
  }
}
