'use client';

import { NodeView, type DataTableType } from '../core';
import { type PartitionNodeModel, PartitionMode } from './node-model';
import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { RouteIcon } from '@/components/icons';
import { CheckCircle2, Info, Database, BarChart3 } from 'lucide-react';

/**
 * View component for the Partition Node
 */
export class PartitionNodeView extends NodeView<PartitionNodeModel> {
  private outputData: DataTableType[] = [];
  private forceUpdateCallback: (() => void) | null = null;

  /**
   * Creates the React component for the view UI
   */
  createViewPanel(): ReactElement {
    return createElement(PartitionNodeViewWrapper, {
      nodeView: this,
    });
  }

  /**
   * Called when the underlying model has changed
   */
  onModelChanged(): void {
    // Handle model changes if needed
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  /**
   * Method to set the loaded data (called by execution engine)
   * This will receive an array with both partition tables
   */
  public setLoadedData(data: DataTableType | DataTableType[] | null): void {
    if (Array.isArray(data)) {
      this.outputData = data;
    } else if (data) {
      this.outputData = [data];
    } else {
      this.outputData = [];
    }

    // Trigger re-render if callback is set
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  /**
   * Method to get the loaded data
   */
  public getLoadedData(): DataTableType[] {
    return this.outputData;
  }

  /**
   * Method to set update callback
   */
  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  /**
   * Updates the view with new output data (legacy method)
   */
  updateOutputData(outputData: DataTableType[]): void {
    this.setLoadedData(outputData);
  }
}

/**
 * Wrapper component for the Partition Node View
 */
interface PartitionNodeViewWrapperProps {
  nodeView: PartitionNodeView;
}

function PartitionNodeViewWrapper(props: PartitionNodeViewWrapperProps) {
  const [, forceUpdate] = useState({});

  // Set up the force update callback
  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  const outputData = props.nodeView.getLoadedData();
  const nodeModel = (props.nodeView as any).nodeModel;

  return createElement(PartitionNodeViewComponent, {
    nodeModel,
    outputData,
  });
}

/**
 * React component for displaying partition results
 */
interface PartitionNodeViewComponentProps {
  nodeModel: PartitionNodeModel;
  outputData: DataTableType[];
}

function PartitionNodeViewComponent({
  nodeModel,
  outputData,
}: PartitionNodeViewComponentProps) {
  const mode = nodeModel.getMode();
  const value = nodeModel.getValue();
  const stratifiedColumn = nodeModel.getStratifiedColumn();
  const useRandomSeed = nodeModel.getUseRandomSeed();
  const randomSeed = nodeModel.getRandomSeed();

  // Get data sizes
  const partition1 = outputData[0] || null;
  const partition2 = outputData[1] || null;
  const partition1Size = partition1?.size || 0;
  const partition2Size = partition2?.size || 0;
  const totalSize = partition1Size + partition2Size;

  // Calculate actual split percentage
  const actualPercentage =
    totalSize > 0 ? ((partition1Size / totalSize) * 100).toFixed(1) : '0';
  const secondPercentage =
    totalSize > 0 ? ((partition2Size / totalSize) * 100).toFixed(1) : '0';

  const getModeDisplayName = (mode: PartitionMode): string => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return 'Absolute';
      case PartitionMode.RELATIVE:
        return 'Relative';
      case PartitionMode.TAKE_FROM_TOP:
        return 'Take from Top';
      case PartitionMode.LINEAR_SAMPLING:
        return 'Linear Sampling';
      case PartitionMode.DRAW_RANDOMLY:
        return 'Random Sampling';
      case PartitionMode.STRATIFIED_SAMPLING:
        return 'Stratified Sampling';
      default:
        return 'Unknown';
    }
  };

  const getModeColor = (mode: PartitionMode): string => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return 'bg-blue-100 text-blue-800';
      case PartitionMode.RELATIVE:
        return 'bg-green-100 text-green-800';
      case PartitionMode.TAKE_FROM_TOP:
        return 'bg-purple-100 text-purple-800';
      case PartitionMode.LINEAR_SAMPLING:
        return 'bg-orange-100 text-orange-800';
      case PartitionMode.DRAW_RANDOMLY:
        return 'bg-red-100 text-red-800';
      case PartitionMode.STRATIFIED_SAMPLING:
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValueDisplay = (): string => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return `${value} rows`;
      case PartitionMode.RELATIVE:
        return `${value}%`;
      case PartitionMode.TAKE_FROM_TOP:
        return `${value} top rows`;
      case PartitionMode.LINEAR_SAMPLING:
        return `${value} sample points`;
      case PartitionMode.DRAW_RANDOMLY:
        return `${value}% random`;
      case PartitionMode.STRATIFIED_SAMPLING:
        return `${value}% stratified`;
      default:
        return `${value}`;
    }
  };

  // No data loaded yet
  if (!partition1 && !partition2) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouteIcon size={20} />
              Data Partition Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ready" className="w-full">
              <TabsList className="flex w-full">
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="ready" className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="size-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-1">
                        Ready to Partition
                      </h4>
                      <p className="text-sm text-amber-700">
                        Execute the workflow to partition data according to the
                        configured settings.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Current Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getModeColor(mode)}>
                        {getModeDisplayName(mode)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {getValueDisplay()}
                      </span>
                    </div>

                    {mode === PartitionMode.STRATIFIED_SAMPLING && (
                      <div className="text-sm">
                        <span className="font-medium">Stratified Column:</span>
                        <span className="ml-2">
                          {stratifiedColumn || 'Not specified'}
                        </span>
                      </div>
                    )}

                    {(mode === PartitionMode.DRAW_RANDOMLY ||
                      mode === PartitionMode.STRATIFIED_SAMPLING) &&
                      useRandomSeed && (
                        <div className="text-sm">
                          <span className="font-medium">Random Seed:</span>
                          <span className="ml-2">{randomSeed}</span>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Partition preview will be available after execution
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

  // Data partitioned successfully - comprehensive tabbed view
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="size-5 text-green-600" />
        <h3 className="text-lg font-semibold">Data Partitioned Successfully</h3>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="first-partition">First Partition</TabsTrigger>
          <TabsTrigger value="second-partition">Second Partition</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RouteIcon size={20} />
                Partition Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Mode:</span>
                  <span className="ml-2">{getModeDisplayName(mode)}</span>
                </div>
                <div>
                  <span className="font-medium">Value:</span>
                  <span className="ml-2">{getValueDisplay()}</span>
                </div>

                {mode === PartitionMode.STRATIFIED_SAMPLING && (
                  <div className="col-span-2">
                    <span className="font-medium">Stratified Column:</span>
                    <span className="ml-2">
                      {stratifiedColumn || 'Not specified'}
                    </span>
                  </div>
                )}

                {(mode === PartitionMode.DRAW_RANDOMLY ||
                  mode === PartitionMode.STRATIFIED_SAMPLING) &&
                  useRandomSeed && (
                    <div className="col-span-2">
                      <span className="font-medium">Random Seed:</span>
                      <span className="ml-2">{randomSeed}</span>
                    </div>
                  )}
              </div>

              <div className="pt-2">
                <Badge className={getModeColor(mode)}>
                  {getModeDisplayName(mode)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Database className="size-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {totalSize.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {partition1Size.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">First Partition</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="size-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {partition2Size.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Second Partition
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partition Split Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Partition Split Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Split percentages */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>First Partition</span>
                    <span className="font-medium text-blue-600">
                      {actualPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${actualPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {partition1Size.toLocaleString()} rows
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Second Partition</span>
                    <span className="font-medium text-green-600">
                      {secondPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${secondPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {partition2Size.toLocaleString()} rows
                  </div>
                </div>
              </div>

              {/* Overall split visualization */}
              <div className="space-y-2">
                <div className="flex text-sm text-gray-600">
                  <span>
                    Overall Split: {actualPercentage}% / {secondPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="h-3 flex">
                    <div
                      className="bg-blue-500 transition-all duration-300"
                      style={{ width: `${actualPercentage}%` }}
                    />
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${secondPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>First: {partition1Size.toLocaleString()}</span>
                  <span>Second: {partition2Size.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schema Information */}
          {partition1 && partition1.spec.columns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Schema</CardTitle>
                <p className="text-sm text-gray-600">
                  Column structure is identical across both partitions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Columns:</span>
                    <span className="ml-2">
                      {partition1.spec.columns.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {partition1.spec.columns.slice(0, 8).map((col) => (
                      <Badge
                        key={col.name}
                        variant="outline"
                        className="text-xs"
                      >
                        {col.name} ({col.type})
                      </Badge>
                    ))}
                    {partition1.spec.columns.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{partition1.spec.columns.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="first-partition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-3 bg-blue-500 rounded-full" />
                First Partition Data
              </CardTitle>
              <p className="text-sm text-gray-600">
                Contains {partition1Size.toLocaleString()} rows (
                {actualPercentage}% of total data)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {partition1 ? (
                <DataTable
                  columns={partition1?.spec.columns || []}
                  rows={partition1?.rows || []}
                  title="First Partition"
                  description={`First partition with ${partition1Size.toLocaleString()} rows (${actualPercentage}% of total)`}
                  rowsPerPage={10}
                  emptyMessage="No data in first partition"
                />
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      First partition data not available
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="second-partition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-3 bg-green-500 rounded-full" />
                Second Partition Data
              </CardTitle>
              <p className="text-sm text-gray-600">
                Contains {partition2Size.toLocaleString()} rows (
                {secondPercentage}% of total data)
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {partition2 ? (
                <DataTable
                  columns={partition2?.spec.columns || []}
                  rows={partition2?.rows || []}
                  title="Second Partition"
                  description={`Second partition with ${partition2Size.toLocaleString()} rows (${secondPercentage}% of total)`}
                  rowsPerPage={10}
                  emptyMessage="No data in second partition"
                />
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      Second partition data not available
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { PartitionNodeViewComponent };
