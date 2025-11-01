'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView } from '@/lib/nodes/core';
import type { ChartNodeModel } from './node-model';
import type { DataTableType } from '@/lib/types';
import type { ChartConfig } from '@/lib/chart/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartBarIcon, TableIcon } from '@/components/icons';
import { UnifiedChartRenderer } from '@/lib/chart/UnifiedChartRenderer';
import { processChartData } from '@/lib/chart/UnifiedChartDataProcessor';

export interface IChartNodeView {
  updateChart(config: ChartConfig): void;
  updateData(data: DataTableType): void;
  setUpdateCallback(callback: () => void): void;
  getNodeModel(): ChartNodeModel;
  getInputData(): DataTableType[];
}

export class ChartNodeView extends NodeView<ChartNodeModel> implements IChartNodeView {
  private chartConfig: ChartConfig | null = null;
  private data: DataTableType | null = null;
  private inputData: DataTableType[] = [];
  private forceUpdateCallback: (() => void) | null = null;

  constructor(nodeModel: ChartNodeModel) {
    super(nodeModel);
    // Register this view with the model
    nodeModel.registerNodeView(this);
  }

  createViewPanel(): ReactElement {
    return createElement(ChartNodeVisualizationWrapper, {
      nodeView: this,
    });
  }

  onModelChanged(): void {
    // Trigger re-render when model changes
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to set input data (called by execution engine or connections)
  public setInputData(data: DataTableType[] | DataTableType): void {
    // Handle both single table and array formats
    if (Array.isArray(data)) {
      this.inputData = data;
    } else if (data) {
      this.inputData = [data];
    } else {
      this.inputData = [];
    }

    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to get current input data
  public getInputData(): DataTableType[] {
    return this.inputData;
  }

  // Method to set update callback
  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  // Getter for nodeModel (needed by wrapper component)
  public getNodeModel(): ChartNodeModel {
    return this.nodeModel;
  }

  // Clean up when view is closed
  onClose(): void {
    this.nodeModel.unregisterNodeView(this);
    super.onClose();
  }

  updateChart(config: ChartConfig): void {
    this.chartConfig = config;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  updateData(data: DataTableType): void {
    this.data = data;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }
}

interface ChartNodeVisualizationWrapperProps {
  nodeView: ChartNodeView;
}

function ChartNodeVisualizationWrapper(
  props: ChartNodeVisualizationWrapperProps,
) {
  const [, forceUpdate] = useState({});

  // Set up the force update callback
  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  return createElement(ChartNodeVisualization, {
    nodeModel: props.nodeView.getNodeModel(),
    inputData: props.nodeView.getInputData(),
  });
}

interface ChartNodeVisualizationProps {
  nodeModel: ChartNodeModel;
  inputData: DataTableType[];
}

function ChartNodeVisualization({
  nodeModel,
  inputData,
}: ChartNodeVisualizationProps) {
  // Get configuration from the model
  const chartType = nodeModel.getChartType();
  const title = nodeModel.getTitle();
  const dataMapping = nodeModel.getDataMapping();

  // Check if chart is properly configured
  const mappedColumns = Object.values(dataMapping).filter((column) => {
    if (Array.isArray(column)) {
      return column.length > 0;
    }
    return column && column.trim().length > 0;
  });
  const hasValidConfiguration = mappedColumns.length > 0;

  // Check if there's input data
  const hasInputData = inputData && inputData.length > 0 && inputData[0];

  // If no input data, show connection prompt
  if (!hasInputData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon size={20} />
            No Input Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground mb-2">
              This chart node requires input data to visualize.
            </div>
            <div className="text-sm text-muted-foreground">
              Connect a data source and execute the workflow to see the chart.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataStats = {
    totalRows: inputData[0].size,
    totalColumns: inputData[0].spec.columns.length,
  };

  // If not configured, show configuration prompt
  if (!hasValidConfiguration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon size={20} />
            Chart Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-muted-foreground mb-2">
              Chart is connected to data ({dataStats.totalRows} rows) but needs
              column mapping.
            </div>
            <div className="text-sm text-muted-foreground">
              Open node settings to configure column mappings for {chartType}{' '}
              chart.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Available Columns:</div>
              <div className="text-muted-foreground">
                {inputData[0].spec.columns.map((col) => col.name).join(', ')}
              </div>
            </div>
            <div>
              <div className="font-medium">Chart Type:</div>
              <div className="text-muted-foreground">{chartType}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate chart data
  let chartData = null;
  let error = null;

  try {
    const chartConfig = nodeModel.getChartConfig();
    chartData = processChartData(chartType, inputData[0], chartConfig);
  } catch (err) {
    error =
      err instanceof Error ? err.message : 'Unknown error generating chart';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBarIcon size={20} />
          {title || 'Chart Visualization'}
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            {chartType}
          </Badge>
          <Badge variant="secondary">{dataStats.totalRows} rows</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              Error generating chart: {error}
            </div>
          </div>
        ) : chartData ? (
          <div style={{ height: '400px', width: '100%' }}>
            <UnifiedChartRenderer
              chartType={chartType}
              data={chartData}
              config={nodeModel.getChartConfig()}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border border-dashed rounded">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          {Object.entries(dataMapping)
            .map(([field, column]) => {
              if (!column) return null;
              if (Array.isArray(column)) {
                return `${field}: [${column.join(', ')}]`;
              }
              return `${field}: ${column}`;
            })
            .filter(Boolean)
            .join(' • ')}
        </div>
      </CardContent>
    </Card>
  );
}
