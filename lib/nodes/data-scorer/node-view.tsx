import React from 'react';
import { NodeView } from '../core';
import type { DataScorerNodeModel } from './node-model';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export class DataScorerNodeView extends NodeView<DataScorerNodeModel> {

  createViewPanel(): React.ReactElement {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Data Quality Scorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Missing Values Weight</div>
              <Badge variant="secondary">
                {(this.nodeModel.getWeightMissing() * 100).toFixed(0)}%
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Duplicates Weight</div>
              <Badge variant="secondary">
                {(this.nodeModel.getWeightDuplicates() * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Include Recommendations</span>
            <Badge variant={this.nodeModel.getIncludeRecommendations() ? "default" : "secondary"}>
              {this.nodeModel.getIncludeRecommendations() ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Analyzes data quality based on missing values and duplicate rows.
            Outputs quality scores and recommendations.
          </div>
        </CardContent>
      </Card>
    );
  }

  onModelChanged(): void {
    // Force re-render when model changes
    // In a real implementation, this might trigger a state update
  }
} 