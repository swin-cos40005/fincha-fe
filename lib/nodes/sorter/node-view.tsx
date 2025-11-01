import React from 'react';
import { Badge } from '@/components/ui/badge';
import { NodeView } from '../core';
import type { SorterNodeModel } from './node-model';

interface SorterNodeViewProps {
  nodeModel: SorterNodeModel;
}

export class SorterNodeView extends NodeView<SorterNodeModel> {
  createViewPanel(): React.ReactElement {
    return <SorterViewContent nodeModel={this.nodeModel} />;
  }

  onModelChanged(): void {
    // Handle model changes if needed
  }
}

function SorterViewContent({ nodeModel }: SorterNodeViewProps) {
  const sortColumns = nodeModel.getSortColumns();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-muted-foreground">SORT</div>
      </div>

      {sortColumns.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No sort configuration
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Sort by {sortColumns.length} column
            {sortColumns.length !== 1 ? 's' : ''}:
          </div>
          <div className="flex flex-wrap gap-1">
            {sortColumns.map((sortCol, index) => (
              <Badge
                key={`${sortCol.columnName}-${sortCol.direction}-${index}`}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {index + 1}. {sortCol.columnName}{' '}
                {sortCol.direction === 'ASC' ? '↑' : '↓'}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
