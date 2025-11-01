import {
  NodeFactory,
  type NodeDialog,
  type NodeMetadata,
  type NodeView,
} from '../core';
import { DataScorerNodeModel } from './node-model';
import { DataScorerNodeDialog } from './node-dialog';
import { DataScorerNodeView } from './node-view';
import { NODE_DESCRIPTION } from './node-description';

export class DataScorerNodeFactory extends NodeFactory<DataScorerNodeModel> {
  getNodeMetadata(): NodeMetadata {
    return {
      id: 'data_scorer',
      name: 'Data Quality Scorer',
      category: 'Data Quality',
      keywords: ['quality', 'score', 'missing', 'duplicates', 'assessment', 'validation'],
      toDashboard: true, // This node outputs to the dashboard
    };
  }

  createNodeModel(): DataScorerNodeModel {
    return new DataScorerNodeModel();
  }

  createNodeDialog(): NodeDialog | null {
    return new DataScorerNodeDialog();
  }

  createNodeViews(
    nodeModel: DataScorerNodeModel,
  ): NodeView<DataScorerNodeModel>[] {
    return [new DataScorerNodeView(nodeModel)];
  }

  getNodeShortDescription(): string {
    return NODE_DESCRIPTION.shortDescription;
  }

  getNodeDetailedDescription(): string {
    return NODE_DESCRIPTION.detailedDescription.whatItDoes;
  }
} 