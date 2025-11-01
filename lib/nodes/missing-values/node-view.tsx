'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView, type DataTableType } from '../core';
import { type MissingValuesNodeModel, MissingValueMethod } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';

export class MissingValuesNodeView extends NodeView<MissingValuesNodeModel> {
  private inputData: DataTableType | null = null;
  private outputData: DataTableType | null = null;
  private processingStats: any = null;
  private forceUpdateCallback: (() => void) | null = null;

  createViewPanel(): ReactElement {
    return createElement(MissingValuesViewPanelWrapper, {
      nodeView: this,
      nodeModel: this.nodeModel,
    });
  }

  onModelChanged(): void {
    this.refreshData();
  }

  private refreshData(): void {
    // In a real implementation, this would get data from execution context
    // For now, we'll simulate the data processing stats
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }
  public setInputData(data: DataTableType | null): void {
    this.inputData = data;

    // Generate processing stats if both input and output data are available
    if (data && this.outputData) {
      this.generateProcessingStats(data, this.outputData);
    }

    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setOutputData(data: DataTableType | null): void {
    this.outputData = data;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }
  // Method to set the loaded data (called by execution engine)
  public setLoadedData(data: DataTableType | null): void {
    this.outputData = data;

    // Generate processing stats when output data is available
    if (data && this.inputData) {
      this.generateProcessingStats(this.inputData, data);
    }

    // Trigger re-render if callback is set
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  public getInputData(): DataTableType | null {
    return this.inputData;
  }

  public getOutputData(): DataTableType | null {
    return this.outputData;
  }

  public getProcessingStats(): any {
    return this.processingStats;
  }

  private generateProcessingStats(
    inputData: DataTableType,
    outputData: DataTableType,
  ): void {
    if (!inputData || !outputData) return;

    // Analyze input data for missing values
    const totalRows = inputData.size;
    let rowsWithMissingValues = 0;
    const missingValuesByColumn = new Map<string, number>();

    inputData.forEach((row) => {
      let rowHasMissing = false;
      row.cells.forEach((cell, colIndex) => {
        const colName =
          inputData.spec.columns[colIndex]?.name || `Column ${colIndex}`;
        const value = cell.getValue();
        const isMissing =
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.toLowerCase() === 'null');

        if (isMissing) {
          rowHasMissing = true;
          missingValuesByColumn.set(
            colName,
            (missingValuesByColumn.get(colName) || 0) + 1,
          );
        }
      });

      if (rowHasMissing) {
        rowsWithMissingValues++;
      }
    });

    // Calculate processing results
    const rowsRemoved = totalRows - outputData.size;
    const valuesImputed =
      Array.from(missingValuesByColumn.values()).reduce(
        (sum, count) => sum + count,
        0,
      ) -
      rowsRemoved * inputData.spec.columns.length;

    this.processingStats = {
      totalRows,
      rowsWithMissingValues,
      rowsRemoved,
      valuesImputed,
      outputRows: outputData.size,
      missingValuesByColumn: Object.fromEntries(missingValuesByColumn),
    };
  }
}

interface MissingValuesViewPanelWrapperProps {
  nodeView: MissingValuesNodeView;
  nodeModel: MissingValuesNodeModel;
}

function MissingValuesViewPanelWrapper(
  props: MissingValuesViewPanelWrapperProps,
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

  const inputData = props.nodeView.getInputData();
  const outputData = props.nodeView.getOutputData();
  const processingStats = props.nodeView.getProcessingStats();

  return createElement(MissingValuesViewPanel, {
    nodeModel: props.nodeModel,
    inputData,
    outputData,
    processingStats,
  });
}

interface MissingValuesViewPanelProps {
  nodeModel: MissingValuesNodeModel;
  inputData: DataTableType | null;
  outputData: DataTableType | null;
  processingStats: any;
}

function MissingValuesViewPanel(props: MissingValuesViewPanelProps) {
  const { nodeModel, inputData, outputData, processingStats } = props;
  const columnConfigs = nodeModel.getColumnConfigs();
  const defaultMethod = nodeModel.getDefaultMethod();

  const getMethodLabel = (method: MissingValueMethod): string => {
    switch (method) {
      case MissingValueMethod.MEAN:
        return 'Mean';
      case MissingValueMethod.MEDIAN:
        return 'Median';
      case MissingValueMethod.MOST_FREQUENT:
        return 'Most Frequent';
      case MissingValueMethod.REMOVE_ROWS:
        return 'Remove Rows';
      default:
        return method;
    }
  };

  const getMethodColor = (method: MissingValueMethod): string => {
    switch (method) {
      case MissingValueMethod.MEAN:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case MissingValueMethod.MEDIAN:
        return 'bg-green-100 text-green-800 border-green-200';
      case MissingValueMethod.MOST_FREQUENT:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case MissingValueMethod.REMOVE_ROWS:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodIcon = (method: MissingValueMethod) => {
    switch (method) {
      case MissingValueMethod.MEAN:
      case MissingValueMethod.MEDIAN:
        return <TrendingUp className="size-3" />;
      case MissingValueMethod.MOST_FREQUENT:
        return <CheckCircle2 className="size-3" />;
      case MissingValueMethod.REMOVE_ROWS:
        return <AlertTriangle className="size-3" />;
      default:
        return <Info className="size-3" />;
    }
  };
  // If no processing has been done yet (no output data)
  if (!outputData && !processingStats) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5 text-blue-500" />
              Missing Values Handler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="configuration" className="w-full">
              <TabsList className="flex w-full">
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
                <TabsTrigger value="input">Input Data</TabsTrigger>
                <TabsTrigger value="output">Output Data</TabsTrigger>
              </TabsList>

              <TabsContent value="configuration" className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="size-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">
                        Ready to Process
                      </h4>
                      <p className="text-sm text-blue-700">
                        Configure missing value handling methods for your data
                        columns. Default method:{' '}
                        <strong>{getMethodLabel(defaultMethod)}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Default Method Display */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Default Method:
                    </span>
                    <Badge
                      className={`${getMethodColor(defaultMethod)} flex items-center gap-1`}
                    >
                      {getMethodIcon(defaultMethod)}
                      {getMethodLabel(defaultMethod)}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="methods" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">
                    Available Methods:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 p-2 rounded border border-blue-200 bg-blue-50">
                      <TrendingUp className="size-4 text-blue-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm text-blue-900">
                          Mean/Median
                        </div>
                        <div className="text-xs text-blue-700">
                          For numerical data
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded border border-purple-200 bg-purple-50">
                      <CheckCircle2 className="size-4 text-purple-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm text-purple-900">
                          Most Frequent
                        </div>
                        <div className="text-xs text-purple-700">
                          For categorical data
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded border border-red-200 bg-red-50">
                      <AlertTriangle className="size-4 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm text-red-900">
                          Remove Rows
                        </div>
                        <div className="text-xs text-red-700">
                          Delete incomplete data
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="input" className="space-y-4">
                {inputData ? (
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 overflow-x-auto">
                      <div className="overflow-x-auto">
                        <DataTable
                          columns={inputData?.spec.columns || []}
                          rows={inputData?.rows || []}
                          title="Input Data"
                          description="Original data before missing value processing"
                          rowsPerPage={10}
                          emptyMessage="No input data available"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="size-4 text-amber-600" />
                      <span className="text-sm text-amber-800">
                        No input data available
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="output" className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Output data will be available after processing
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="size-5 text-green-600" />
        <h3 className="text-lg font-semibold">Missing Values Processing</h3>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="input-data">Input Data</TabsTrigger>
          <TabsTrigger value="output-data">Output Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {processingStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Processing Summary Cards */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {processingStats.totalRows}
                      </div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="size-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {processingStats.rowsWithMissingValues}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rows with Missing Values
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="size-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {processingStats.rowsProcessed}
                      </div>
                      <div className="text-sm text-gray-600">
                        Rows Processed
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Quality Insights */}
          {processingStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Quality Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Completeness</span>
                      <span className="font-medium">
                        {Math.round(
                          ((processingStats.totalRows -
                            processingStats.rowsWithMissingValues) /
                            processingStats.totalRows) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.round(((processingStats.totalRows - processingStats.rowsWithMissingValues) / processingStats.totalRows) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {processingStats.rowsRemoved > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Rows Retained</span>
                        <span className="font-medium">
                          {Math.round(
                            ((processingStats.totalRows -
                              processingStats.rowsRemoved) /
                              processingStats.totalRows) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.round(((processingStats.totalRows - processingStats.rowsRemoved) / processingStats.totalRows) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {processingStats.rowsRemoved > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {processingStats.rowsRemoved} rows were removed due to
                        missing values
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Method */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Default Method:
                </span>
                <Badge
                  className={`${getMethodColor(defaultMethod)} flex items-center gap-1`}
                >
                  {getMethodIcon(defaultMethod)}
                  {getMethodLabel(defaultMethod)}
                </Badge>
              </div>

              {/* Column-Specific Configurations */}
              {columnConfigs.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">
                    Column-Specific Methods:
                  </h4>
                  <div className="space-y-2">
                    {columnConfigs.map((config, index) => (
                      <div
                        key={`config-${index}-${config.columnName}`}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">
                          {config.columnName}
                        </span>
                        <Badge
                          className={`${getMethodColor(config.method)} flex items-center gap-1`}
                        >
                          {getMethodIcon(config.method)}
                          {getMethodLabel(config.method)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      All columns use the default method:{' '}
                      <strong>{getMethodLabel(defaultMethod)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input-data" className="space-y-4">
          {inputData ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <div className="overflow-x-auto">
                  <DataTable
                    columns={inputData?.spec.columns || []}
                    rows={inputData?.rows || []}
                    title="Input Data"
                    description="Original data before missing value processing"
                    rowsPerPage={10}
                    emptyMessage="No input data available"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Info className="size-12 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">No Input Data</h3>
                    <p className="text-sm text-gray-600">
                      Connect input data to see the original dataset
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="output-data" className="space-y-4">
          {outputData ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <div className="overflow-x-auto">
                  <DataTable
                    columns={outputData?.spec.columns || []}
                    rows={outputData?.rows || []}
                    title="Processed Data"
                    description="Data after missing value processing"
                    rowsPerPage={10}
                    emptyMessage="No processed data available"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Info className="size-12 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      No Processed Data
                    </h3>
                    <p className="text-sm text-gray-600">
                      Execute the workflow to see processed data
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
