'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView, type DataTableType } from '@/lib/nodes/core';
import type { DataInputNodeModel } from './node-model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export class DataInputNodeView extends NodeView<DataInputNodeModel> {
  private loadedData: DataTableType | null = null;
  private dataStats: any = null;
  private loadingState: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  private errorMessage: string | null = null;
  private forceUpdateCallback: (() => void) | null = null;
  private instanceId: string;

  constructor(nodeModel: DataInputNodeModel) {
    super(nodeModel);
    this.instanceId = Math.random().toString(36).substr(2, 9);
  }

  createViewPanel(): ReactElement {
    return createElement(DataInputViewPanelWrapper, {
      nodeView: this,
      onRefresh: () => this.refreshData(),
    });
  }

  onModelChanged(): void {
    // Handle model changes - try to get the loaded data
    this.refreshData();
    // Trigger re-render to update the view with new model values
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  private refreshData(): void {
    // Try to get the actual execution results from the model
    if (this.nodeModel.getCsvUrl()) {
      // The execution results will be set via setLoadedData when node executes
      // For now just maintain current state
      if (this.forceUpdateCallback) {
        this.forceUpdateCallback();
      }
    } else {
      this.loadedData = null;
      this.dataStats = null;
      this.loadingState = 'idle';
    }
  }

  private generateRealStats(): void {
    if (this.loadedData) {
      const spec = this.loadedData.spec;
      const rows = this.loadedData.rows;
      
      // Calculate real statistics from the actual data
      const columnStats = spec.columns.map(column => {
        const columnIndex = spec.findColumnIndex(column.name);
        let nullCount = 0;
        const uniqueValues = new Set();
        
        rows.forEach(row => {
          const cell = row.cells[columnIndex];
          const value = cell?.getValue();
          
          if (value === null || value === undefined || value === '') {
            nullCount++;
          } else {
            uniqueValues.add(value);
          }
        });
        
        return {
          name: column.name,
          type: column.type,
          nullCount,
          uniqueCount: uniqueValues.size
        };
      });
      
      // Calculate overall quality metrics
      const totalCells = rows.length * spec.columns.length;
      const totalNulls = columnStats.reduce((sum, col) => sum + col.nullCount, 0);
      const completeness = totalCells > 0 ? ((totalCells - totalNulls) / totalCells) * 100 : 0;
      const qualityScore = Math.min(95, completeness + 5); // Simple quality score
      
      this.dataStats = {
        totalRows: rows.length,
        totalColumns: spec.columns.length,
        dataSize: this.formatDataSize(rows.length * spec.columns.length * 10), // Rough estimate
        lastModified: new Date().toISOString(),
        columns: columnStats,
        qualityScore: Math.round(qualityScore),
        completeness: Math.round(completeness * 10) / 10
      };
    }
  }
  
  private formatDataSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  // Method to set the loaded data (called by execution engine)
  public setLoadedData(data: DataTableType | null): void {
    
    this.loadedData = data;
    this.loadingState = data ? 'success' : 'idle';
    this.generateRealStats();
    // Trigger re-render if callback is set
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  public setLoadingState(
    state: 'idle' | 'loading' | 'success' | 'error',
    error?: string,
  ): void {
    this.loadingState = state;
    this.errorMessage = error || null;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }
  // Method to get the loaded data
  public getLoadedData():DataTableType| null {
    return this.loadedData;
  }

  public getDataStats(): any {
    return this.dataStats;
  }

  public getLoadingState(): 'idle' | 'loading' | 'success' | 'error' {
    return this.loadingState;
  }
  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  // Method to set update callback
  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  // Public getter for current model state
  public getNodeModel(): DataInputNodeModel {
    return this.nodeModel;
  }
}

interface DataInputViewPanelWrapperProps {
  nodeView: DataInputNodeView;
  onRefresh: () => void;
}

function DataInputViewPanelWrapper(props: DataInputViewPanelWrapperProps) {
  const [, forceUpdate] = useState({});

  // Set up the force update callback
  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  // Get current values from the node model (these will update when the model changes)
  const model = props.nodeView.getNodeModel();
  const csvUrl = model.getCsvUrl();
  const csvFileName = model.getCsvFileName();
  const loadedData = props.nodeView.getLoadedData();
  const dataStats = props.nodeView.getDataStats();
  const loadingState = props.nodeView.getLoadingState();
  const errorMessage = props.nodeView.getErrorMessage();

  return createElement(DataInputViewPanel, {
    csvUrl,
    csvFileName,
    loadedData,
    dataStats,
    loadingState,
    errorMessage,
    onRefresh: props.onRefresh,
    nodeView: props.nodeView,
  });
}

interface DataInputViewPanelProps {
  csvUrl: string;
  csvFileName: string;
  loadedData:DataTableType| null;
  dataStats: any;
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
  onRefresh: () => void;
  nodeView?: DataInputNodeView;
}

function DataInputViewPanel(props: DataInputViewPanelProps) {
  const {
    csvUrl,
    csvFileName,
    loadedData,
    dataStats,
    loadingState,
    errorMessage,
  } = props;

  const formatDataSource = () => {
    if (csvUrl?.startsWith('http')) {
      return `URL: ${csvUrl.substring(0, 50)}${csvUrl.length > 50 ? '...' : ''}`;
    } else if (csvFileName) {
      return `File: ${csvFileName}`;
    } else {
      return 'Not configured';
    }
  };

  const getSourceTypeDisplay = () => {
    if (csvUrl?.startsWith('http')) {
      return 'URL';
    } else if (csvFileName) {
      return 'File Upload';
    } else if (csvUrl) {
      return 'Conversation CSV';
    } else {
      return 'None';
    }
  };

  const currentSource = formatDataSource();
  const sourceType = getSourceTypeDisplay();

  // Convert DataTableType rows to the format expected by DataTable component
  const convertRowsForDataTable = (dataTable: DataTableType) => {
    if (!dataTable?.rows || !dataTable?.spec?.columns) {
      return [];
    }

    return dataTable.rows.map((row) => {
      const convertedRow: { [key: string]: any } = {};
      
      dataTable.spec.columns.forEach((column, index) => {
        const cell = row.cells[index];
        convertedRow[column.name] = cell?.getValue() || '';
      });
      
      return convertedRow;
    });
  };

  return (
    <div className="size-full overflow-auto">
      <Tabs defaultValue="data" className="size-full flex flex-col">
        <TabsList className="flex w-full">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="size-4" />
            Data Preview
            {dataStats && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {dataStats.totalRows?.toLocaleString()} rows
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="size-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Data Quality
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="data" className="space-y-4 p-4">
            <Card>
              <CardContent className="p-0">
                {loadingState === 'loading' && (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-4" />
                    <div className="text-muted-foreground">Loading data...</div>
                  </div>
                )}

                {loadingState === 'error' && (
                  <div className="p-8 text-center">
                    <AlertCircle className="size-12 mx-auto mb-4 text-destructive opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      Failed to load data
                    </div>
                    <div className="text-sm text-destructive">
                      {errorMessage}
                    </div>
                    <Button
                      variant="outline"
                      onClick={props.onRefresh}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {loadingState === 'success' && loadedData && (
                  <DataTable
                    columns={loadedData?.spec.columns || []}
                    rows={convertRowsForDataTable(loadedData)}
                    title="Data Preview"
                    description={`Showing preview of loaded CSV data (${dataStats?.totalRows?.toLocaleString() || 'Unknown'} rows total)`}
                    rowsPerPage={10}
                    emptyMessage="No data rows found"
                  />
                )}

                {loadingState === 'idle' && !loadedData && (
                  <div className="p-8 text-center">
                    <FileText className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      No data loaded
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Configure a CSV data source and execute the node to see
                      data preview
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-5 text-blue-500" />
                  Data Source Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Source Type</div>
                    <div className="text-sm text-muted-foreground">
                      {sourceType}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Source</div>
                    <div className="text-sm text-muted-foreground break-all">
                      {currentSource}
                    </div>
                  </div>

                  {dataStats && (
                    <>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Rows</div>
                        <div className="text-sm text-muted-foreground">
                          {dataStats.totalRows?.toLocaleString()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Columns</div>
                        <div className="text-sm text-muted-foreground">
                          {dataStats.totalColumns}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Data Size</div>
                        <div className="text-sm text-muted-foreground">
                          {dataStats.dataSize}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Last Modified</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(dataStats.lastModified).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!loadedData && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No data loaded. Execute the node to load data and see
                      detailed information.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {dataStats?.columns && (
              <Card>
                <CardHeader>
                  <CardTitle>Column Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataStats.columns.map((column: any, _index: number) => (
                      <div
                        key={column.name}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{column.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Type: {column.type} | Unique:{' '}
                            {column.uniqueCount?.toLocaleString()} | Nulls:{' '}
                            {column.nullCount?.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline">{column.type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  Data Quality Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataStats ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Overall Quality Score
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-2xl font-bold ${dataStats.qualityScore >= 90 ? 'text-green-600' : dataStats.qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {dataStats.qualityScore}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dataStats.qualityScore >= 90
                              ? 'Excellent'
                              : dataStats.qualityScore >= 70
                                ? 'Good'
                                : 'Needs Improvement'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Data Completeness
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-2xl font-bold ${dataStats.completeness >= 95 ? 'text-green-600' : dataStats.completeness >= 85 ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {dataStats.completeness}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dataStats.completeness >= 95
                              ? 'Excellent'
                              : dataStats.completeness >= 85
                                ? 'Good'
                                : 'Needs Review'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Quality Insights
                      </div>
                      <div className="space-y-2">
                        {dataStats.qualityScore >= 90 && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-green-800 dark:text-green-200">
                              ✅ High quality data with minimal issues detected
                            </div>
                          </div>
                        )}

                        {dataStats.columns.some(
                          (col: any) => col.nullCount > 0,
                        ) && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                              ⚠️ Some columns contain null values - consider data
                              cleaning
                            </div>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Total unique values:{' '}
                            {dataStats.columns
                              .reduce(
                                (sum: number, col: any) =>
                                  sum + (col.uniqueCount || 0),
                                0,
                              )
                              .toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      No quality analysis available
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Execute the node to load data and see quality metrics
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
