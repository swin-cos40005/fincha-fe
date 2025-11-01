
import React, { createElement, type ReactElement } from 'react';
import { NodeView } from '@/lib/nodes/core';
import { PythonScriptNodeModel } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeEditor } from '@/components/code-editor';

export class PythonScriptNodeView extends NodeView<PythonScriptNodeModel> {
  createViewPanel(): ReactElement {
    return createElement(PythonScriptNodeViewPanel, { nodeView: this });
  }

  onModelChanged(): void {
    // Could trigger re-render if needed
  }

  public getNodeModel(): PythonScriptNodeModel {
    return this.nodeModel;
  }
}

function PythonScriptNodeViewPanel({ nodeView }: { nodeView: PythonScriptNodeView }) {
  const model = nodeView.getNodeModel();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Python Script</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <CodeEditor
            content={model.code}
            onSaveContent={() => {}}
            status="idle"
            suggestions={[]}
          />
        </div>
        <div>
          <strong>Execution Mode:</strong> {model.executionMode}
        </div>
      </CardContent>
    </Card>
  );
}
