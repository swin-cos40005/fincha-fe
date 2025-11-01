'use client';

import React, { createElement, type ReactElement } from 'react';
import { NodeView } from '../core';
import { NormalizerNodeModel } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Settings } from 'lucide-react';

export class NormalizerNodeView extends NodeView<NormalizerNodeModel> {
  createViewPanel(): ReactElement {
    return createElement(NormalizerViewPanel, {
      nodeModel: this.nodeModel,
    });
  }

  onModelChanged(): void {
    // The view will automatically re-render when the model changes
    // since it's a React component
  }
}

interface NormalizerViewPanelProps {
  nodeModel: NormalizerNodeModel;
}

function NormalizerViewPanel(props: NormalizerViewPanelProps) {
  const { nodeModel } = props;

  const numberColumns = nodeModel.getNumberColumns();
  const normalizationMethod = nodeModel.getNormalizationMethod();
  const minValue = nodeModel.getMinValue();
  const maxValue = nodeModel.getMaxValue();

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case 'MIN_MAX':
        return 'Min-Max';
      case 'Z_SCORE':
        return 'Z-Score';
      case 'DECIMAL_SCALING':
        return 'Decimal Scaling';
      default:
        return method;
    }
  };

  const getMethodColor = (method: string): string => {
    switch (method) {
      case 'MIN_MAX':
        return 'bg-blue-100 text-blue-800';
      case 'Z_SCORE':
        return 'bg-green-100 text-green-800';
      case 'DECIMAL_SCALING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Normalizer</h3>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="size-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Method</div>
            <Badge className={getMethodColor(normalizationMethod)}>
              {getMethodLabel(normalizationMethod)}
            </Badge>
          </div>

          {normalizationMethod === 'MIN_MAX' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Target Range</div>
              <div className="text-sm">
                {minValue} to {maxValue}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-gray-600 mb-1">Selected Columns</div>
            {numberColumns.length === 0 ? (
              <div className="text-sm text-gray-500 italic">No columns selected</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {numberColumns.slice(0, 3).map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
                {numberColumns.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{numberColumns.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• {numberColumns.length} column(s) selected for normalization</div>
            <div>• Using {getMethodLabel(normalizationMethod).toLowerCase()} method</div>
            {normalizationMethod === 'MIN_MAX' && (
              <div>• Scaling to range [{minValue}, {maxValue}]</div>
            )}
            <div>• Non-numeric columns will remain unchanged</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}