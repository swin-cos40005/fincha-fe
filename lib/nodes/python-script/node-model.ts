import { NodeModel, type ExecutionContext, type SettingsObject } from '@/lib/nodes/core';
import type { DataTableType, DataTableSpec } from '@/lib/types';

export type PythonScriptNodeSettings = {
  code: string;
  executionMode: 'local' | 'server';
};

export class PythonScriptNodeModel extends NodeModel {
  code: string = '';
  executionMode: 'local' | 'server' = 'local';

  constructor() {
    super(3, 1); // 3 input ports, 1 output port
  }

  async execute(inputs: DataTableType[], context: ExecutionContext): Promise<any[]> {
    // Choose execution mode
    if (this.executionMode === 'local') {
      // @ts-expect-error - loadPyodide is not defined
      const pyodide = await globalThis.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
      });
      // TODO: Pass input data to Python, run code, capture output
      // For now, just return a dummy table
      return inputs;
    } else {
      // Server execution (pseudo-code, replace with actual API call)
      const response = await fetch('/api/python-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: this.code, inputs }),
      });
      const result = await response.json();
      return [result];
    }
  }

  configure(inSpecs: DataTableSpec[]): DataTableSpec[] {
    // Output spec mirrors first input for now
    return inSpecs.length > 0 ? [inSpecs[0]] : [];
  }

  loadSettings(settings: SettingsObject): void {
    this.code = settings.getString('code', '') || '';
    this.executionMode = (settings.getString('executionMode', 'local') as 'local' | 'server') || 'local';
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('code', this.code);
    settings.set('executionMode', this.executionMode);
  }

  validateSettings(settings: SettingsObject): void {
    if (!settings.getString('code')) {
      throw new Error('Python code is required.');
    }
  }
}
