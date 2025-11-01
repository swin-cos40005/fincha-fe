import React from 'react';
import type { DataTableType } from '@/lib/types';
import { NodeView } from '@/lib/nodes/core';
import type { TableCreatorNodeModel } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableIcon } from '@/components/icons';

export class TableCreatorNodeView extends NodeView<TableCreatorNodeModel> {
  private data: DataTableType[] = [];

  show(data: DataTableType[]): void {
    this.data = data;
  }

  createViewPanel(): React.ReactElement {
    const headers = this.nodeModel.getHeaders();
    const rows = this.nodeModel.getProcessedRows();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon size={20} />
            Table Creator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={`header-${header}`} className="border p-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}-${row.join('-')}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}-${headers[cellIndex]}`} className="border p-2">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  onModelChanged(): void {
    // Refresh view when model changes
    this.show(this.data);
  }
}
