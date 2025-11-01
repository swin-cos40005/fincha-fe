import { NodeFactory } from '../core';
import { JoinerNodeModel } from './node-model';
import { JoinerNodeDialog } from './node-dialog';
import { JoinerNodeView } from './node-view';
import { JoinerNodeDescription } from './node-description';

/**
 * Factory for creating Joiner node components
 */
export class JoinerNodeFactory extends NodeFactory<JoinerNodeModel> {
  createNodeModel(): JoinerNodeModel {
    return new JoinerNodeModel();
  }

  createNodeDialog(): JoinerNodeDialog {
    return new JoinerNodeDialog(this.createNodeModel());
  }

  createNodeViews(nodeModel: JoinerNodeModel): JoinerNodeView[] {
    return [new JoinerNodeView(nodeModel)];
  }

  getNodeMetadata() {
    return JoinerNodeDescription;
  }

  getNodeDetailedDescription(): string {
    return 'The Table Joiner node combines data from 2-3 tables using common columns. It supports various join types including inner, left, right, and full outer joins. Column prefixes can be added to avoid naming conflicts.';
  }

  getNodeShortDescription(): string {
    return 'Joins 2-3 tables based on common columns';
  }
}
