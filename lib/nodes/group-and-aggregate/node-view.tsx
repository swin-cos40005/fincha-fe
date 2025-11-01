'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView, type DataTableType, type DataRow, type Cell } from '../core';
import {
  type GroupAndAggregateNodeModel,
  type ColumnAggregation,
} from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  LoaderIcon,
  ChartBarIcon,
  LineChartIcon,
  PieChartIcon,
} from '@/components/icons';
import { UnifiedChartRenderer } from '@/lib/chart/UnifiedChartRenderer';
import { DataTable } from '@/components/ui/data-table';
import type { ChartConfig, ChartType } from '@/lib/chart/types';
import { processChartData } from '@/lib/chart/UnifiedChartDataProcessor';

interface GroupAndAggregateNodeViewProps {
  groupColumns: string[];
  aggregations: ColumnAggregation[];
}

export class GroupAndAggregateNodeView extends NodeView<GroupAndAggregateNodeModel> {
  public outputTable: DataTableType | null = null;
  public data: Record<string, unknown>[] = [];
  public isLoading = true;
  public error: string | null = null;
  public groupColumns: string[] = [];
  public aggregations: ColumnAggregation[] = [];
  public forceUpdateCallback: (() => void) | null = null;

  public async fetchData() {
    try {
      const settings = await this.getNodeSettings();
      if (settings) {
        this.groupColumns = settings.groupColumns;
        this.aggregations = settings.aggregations;
        this.isLoading = false;
        this.error = null;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.isLoading = false;
    }

    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public async getNodeSettings(): Promise<GroupAndAggregateNodeViewProps> {
    return {
      groupColumns: this.nodeModel.groupColumns,
      aggregations: this.nodeModel.aggregations,
    };
  }

  public convertTableToViewData(table: DataTableType): Record<string, unknown>[] {
    if (!table) return [];
    
    const parsed: Record<string, unknown>[] = [];
    const columns = table.spec.columns.map(col => col.name);
    
    table.forEach((row: DataRow) => {
      const result: Record<string, unknown> = {};
      
      row.cells.forEach((cell: Cell, cellIdx: number) => {
        const colName = columns[cellIdx];
        result[colName] = cell.getValue();
      });
      
      parsed.push(result);
    });
    
    return parsed;
  }

  onModelChanged(): void {
    this.fetchData();
  }

  public setLoadedData(data: DataTableType | null): void {
    this.outputTable = data;
    if (data) {
      this.data = this.convertTableToViewData(data);
      this.isLoading = false;
      this.error = null;
    }
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public getLoadedData(): DataTableType | null {
    return this.outputTable;
  }

  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  createViewPanel(): ReactElement {
    return createElement(GroupAndAggregateViewPanelWrapper, {
      nodeView: this,
      onRefresh: () => this.fetchData(),
    });
  }
}

interface GroupAndAggregateViewPanelWrapperProps {
  nodeView: GroupAndAggregateNodeView;
  onRefresh: () => void;
}

const GroupAndAggregateViewPanelWrapper: React.FC<GroupAndAggregateViewPanelWrapperProps> = ({
  nodeView,
  onRefresh,
}) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    nodeView.setUpdateCallback(updateCallback);

    return () => {
      nodeView.setUpdateCallback(() => {});
    };
  }, [nodeView]);

  const loadedData = nodeView.getLoadedData();

  return createElement(GroupAndAggregateViewPanel, {
    outputTable: loadedData,
    data: nodeView.data,
    isLoading: nodeView.isLoading,
    error: nodeView.error,
    groupColumns: nodeView.groupColumns,
    aggregations: nodeView.aggregations,
    onRefresh,
  });
};

interface GroupAndAggregateViewPanelProps {
  outputTable: DataTableType | null;
  data: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;
  groupColumns: string[];
  aggregations: ColumnAggregation[];
  onRefresh: () => void;
}

const GroupAndAggregateViewPanel: React.FC<GroupAndAggregateViewPanelProps> = ({
  outputTable,
  data,
  isLoading,
  error,
  groupColumns,
  aggregations,
  onRefresh,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');

  useEffect(() => {
    if (aggregations.length > 0 && !selectedMetric) {
      const firstAgg = aggregations[0];
      if (firstAgg) {
        setSelectedMetric(firstAgg.newColumnName);
      }
    }
  }, [aggregations, selectedMetric]);

  const numericColumns = data.length > 0
    ? Object.keys(data[0]).filter(
        (key) => typeof data[0][key] === 'number'
      )
    : [];

  const chartConfig: ChartConfig = {
    chartType: chartType,
    title: "Chart Visualization",
    dataMapping: {
      xColumn: outputTable?.spec.columns[0].name || 'group',
      indexBy: outputTable?.spec.columns[0].name || 'group',
      idColumn: outputTable?.spec.columns[0].name || 'group',
      valueColumn: outputTable?.spec.columns[1].name || 'value',
      yColumns: [outputTable?.spec.columns[1].name || 'value'],
      valueColumns: [outputTable?.spec.columns[1].name || 'value'],
    },
    colors: {
      scheme: "nivo"
    },
    margin: {
      "top": 50,
      "right": 110,
      "bottom": 50,
      "left": 60
    },
  } as any;
  const chartData = processChartData(chartType, outputTable as DataTableType, chartConfig);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">
          <LoaderIcon size={24} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 font-semibold mb-2">
            Error Loading Data
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {error}
          </div>
          <Button onClick={onRefresh}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aggregation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Group By Columns:</div>
            <div className="flex flex-wrap gap-2">
              {groupColumns.map((col) => (
                <Badge key={col} variant="secondary">
                  {col}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-2">Aggregations:</div>
            <div className="flex flex-wrap gap-2">
              {aggregations.map((agg) => (
                <Badge key={agg.newColumnName} variant="outline">
                  {agg.columnName} ({agg.method})
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="text-sm">
            <strong>Total Groups:</strong> {data.length}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Data Table</TabsTrigger>
          <TabsTrigger value="chart" disabled={numericColumns.length === 0}>
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={outputTable?.spec.columns || []}
                rows={data}
                title="Aggregated Results"
                description={`Grouped and aggregated data with ${data.length} result rows`}
                rowsPerPage={10}
                emptyMessage="No aggregation results found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">
                  Select Metric to Visualize:
                </div>
                <div className="flex flex-wrap gap-2">
                  {numericColumns.map((col) => (
                    <Badge
                      key={col}
                      variant={selectedMetric === col ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedMetric(col)}
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Chart Type:</div>
                <div className="flex gap-2">
                  <Badge
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setChartType('bar')}
                  >
                    <ChartBarIcon size={12} />
                    Bar
                  </Badge>
                  <Badge
                    variant={chartType === 'line' ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setChartType('line')}
                  >
                    <LineChartIcon size={12} />
                    Line
                  </Badge>
                  <Badge
                    variant={chartType === 'pie' ? 'default' : 'outline'}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => setChartType('pie')}
                  >
                    <PieChartIcon size={12} />
                    Pie
                  </Badge>
                </div>
              </div>
              {selectedMetric && chartData.length > 0 && (
                <div className="h-[400px] w-full">
                  <UnifiedChartRenderer
                    chartType={chartType}
                    data={chartData}
                    config={chartConfig}
                  />
                </div>
              )}
              {data.length > 20 && (
                <div className="text-center text-xs text-muted-foreground">
                  Chart shows first 20 groups for better visualization
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};