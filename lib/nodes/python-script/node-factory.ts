import { NodeFactory, type NodeDialog, type NodeMetadata, type NodeView } from '@/lib/nodes/core';
import { PythonScriptNodeModel } from './node-model';
import { PythonScriptNodeDialog } from './node-dialog';
import { PythonScriptNodeView } from './node-view';
import { NODE_SCHEMA, NODE_DESCRIPTION } from './node-description';
import { PythonIcon } from '@/components/icons';

export class PythonScriptNodeFactory extends NodeFactory<PythonScriptNodeModel> {
  createNodeModel(): PythonScriptNodeModel {
    return new PythonScriptNodeModel();
  }

  createNodeDialog(): NodeDialog {
    return new PythonScriptNodeDialog();
  }

  createNodeViews(nodeModel: PythonScriptNodeModel): NodeView<PythonScriptNodeModel>[] {
    return [new PythonScriptNodeView(nodeModel)];
  }

  getNodeMetadata(): NodeMetadata {
    return {
      id: 'python_script',
      name: 'Python Script',
      category: 'Code',
      icon: PythonIcon,
      keywords: ['python', 'script', 'code', 'custom'],
      toDashboard: true,
    };
  }

  getNodeDetailedDescription(): string {
    return NODE_DESCRIPTION.detailedDescription.whatItDoes;
  }

  getNodeShortDescription(): string {
    return NODE_DESCRIPTION.shortDescription;
  }

  getNodeSchema() {
    return NODE_SCHEMA;
  }
}
