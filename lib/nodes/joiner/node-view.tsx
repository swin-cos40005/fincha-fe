import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type JoinerNodeModel, JoinType } from './node-model';
import { NodeView } from '../base-node/node-view';
import type { DataTableSpec } from '../../types';

interface JoinerNodeViewProps {
  nodeModel: JoinerNodeModel;
  inputSpecs: DataTableSpec[];
}

export class JoinerNodeView extends NodeView<JoinerNodeModel> {
  private inputSpecs: DataTableSpec[] = [];

  // Method to set input specs from outside
  setInputSpecs(inputSpecs: DataTableSpec[]): void {
    this.inputSpecs = inputSpecs;
  }

  createViewPanel(): React.ReactElement {
    return (
      <JoinerViewComponent
        nodeModel={this.nodeModel}
        inputSpecs={this.inputSpecs}
      />
    );
  }

  onModelChanged(): void {
    // Handle model changes if needed
  }
}

function JoinerViewComponent({ nodeModel, inputSpecs }: JoinerNodeViewProps) {
  const join1_2 = nodeModel.getJoin1_2();
  const join1_3 = nodeModel.getJoin1_3();
  const prefixes = nodeModel.getColumnPrefixes();

  const hasTable3 = inputSpecs.length > 2;

  const getJoinTypeColor = (joinType: JoinType) => {
    switch (joinType) {
      case JoinType.INNER:
        return 'bg-blue-100 text-blue-800';
      case JoinType.LEFT:
        return 'bg-green-100 text-green-800';
      case JoinType.RIGHT:
        return 'bg-yellow-100 text-yellow-800';
      case JoinType.FULL:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJoinTypeLabel = (joinType: JoinType) => {
    switch (joinType) {
      case JoinType.INNER:
        return 'Inner';
      case JoinType.LEFT:
        return 'Left';
      case JoinType.RIGHT:
        return 'Right';
      case JoinType.FULL:
        return 'Full';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="text-sm font-medium text-gray-700">Table Joiner</div>

      {/* Join 1-2 Configuration */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Table 1 ↔ Table 2
            </span>
            <Badge className={getJoinTypeColor(join1_2.joinType)}>
              {getJoinTypeLabel(join1_2.joinType)}
            </Badge>
          </div>

          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Left:</span>
              <span className="font-mono">
                {join1_2.leftColumn || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Right:</span>
              <span className="font-mono">
                {join1_2.rightColumn || 'Not set'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join 1-3 Configuration (if Table 3 exists) */}
      {hasTable3 && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Result ↔ Table 3
              </span>
              <Badge className={getJoinTypeColor(join1_3.joinType)}>
                {getJoinTypeLabel(join1_3.joinType)}
              </Badge>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Result:</span>
                <span className="font-mono">
                  {join1_3.leftColumn || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table 3:</span>
                <span className="font-mono">
                  {join1_3.rightColumn || 'Not set'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Prefixes */}
      <Card>
        <CardContent className="p-3">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Column Prefixes
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">T1:</span>
              <span className="font-mono">{prefixes.prefix1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">T2:</span>
              <span className="font-mono">{prefixes.prefix2}</span>
            </div>
            {hasTable3 && (
              <div className="flex justify-between col-span-2">
                <span className="text-gray-500">T3:</span>
                <span className="font-mono">{prefixes.prefix3}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="text-xs text-center">
        <Badge variant="outline" className="text-xs">
          {inputSpecs.length} table(s) connected
        </Badge>
      </div>
    </div>
  );
}
