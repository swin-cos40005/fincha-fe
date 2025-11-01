'use client';

import React, { useState } from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec } from '@/lib/types';
import { CodeEditor } from '@/components/code-editor';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export class PythonScriptNodeDialog extends NodeDialog {
  code: string = '';
  executionMode: 'local' | 'server' = 'local';

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.code = settings.getString('code', '') || '';
    this.executionMode = (settings.getString('executionMode', 'local') as 'local' | 'server') || 'local';
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('code', this.code);
    settings.set('executionMode', this.executionMode);
  }

  createDialogPanel(settings: SettingsObject, _specs: DataTableSpec[]) {
    const [code, setCode] = useState(this.code);
    const [executionMode, setExecutionMode] = useState<'local' | 'server'>(this.executionMode);

    return (
      <div className="flex flex-col gap-4 w-full">
        <div>
          <Label>Python Code</Label>
          <div className="mt-2">
            <CodeEditor
              content={code}
              onSaveContent={(updated, _debounce) => setCode(updated)}
              status="idle"
              suggestions={[]}
            />
          </div>
        </div>
        <div>
          <Label>Execution Mode</Label>
          <Select value={executionMode} onValueChange={(val) => setExecutionMode(val as 'local' | 'server')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (Browser)</SelectItem>
              <SelectItem value="server">Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }
}
