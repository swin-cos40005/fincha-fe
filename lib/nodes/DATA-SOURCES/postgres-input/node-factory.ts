import { NodeFactory } from '@/lib/nodes/core';
import { PostgresInputNodeModel } from './node-model';
import { PostgresInputNodeDialog } from './node-dialog';
import { PostgresInputNodeView } from './node-view';
import { PostgresInputNodeDescription } from './node-description';

/**
 * Factory for creating PostgreSQL Input node components
 */
export class PostgresInputNodeFactory extends NodeFactory<PostgresInputNodeModel> {
  createNodeModel(): PostgresInputNodeModel {
    return new PostgresInputNodeModel();
  }

  createNodeDialog(): PostgresInputNodeDialog {
    return new PostgresInputNodeDialog(this.createNodeModel());
  }

  createNodeViews(nodeModel: PostgresInputNodeModel): PostgresInputNodeView[] {
    return [new PostgresInputNodeView(nodeModel)];
  }

  getNodeMetadata() {
    return PostgresInputNodeDescription;
  }

  getNodeDetailedDescription(): string {
    return 'The PostgreSQL Input node connects to a PostgreSQL database and executes SQL queries to retrieve data. It supports parameterized queries and SSL connections. Mock data is provided for demonstration purposes.';
  }

  getNodeShortDescription(): string {
    return 'Queries PostgreSQL databases to retrieve data';
  }
}
