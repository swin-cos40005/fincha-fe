'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  PostgresIcon,
  CheckCircleFillIcon,
  WarningIcon,
  InfoIcon,
  TableIcon,
  BoxIcon,
} from '@/components/icons';
import {
  Database,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { NodeView } from '@/lib/nodes/core';
import type { PostgresInputNodeModel } from './node-model';
import type { DataTableType } from '@/lib/types';

export class PostgresInputNodeView extends NodeView<PostgresInputNodeModel> {
  private connectionStatus: 'untested' | 'success' | 'error' = 'untested';
  private connectionError: string | null = null;
  private selectedTableData: any = null;
  private dataStats: any = null;
  private forceUpdateCallback: (() => void) | null = null;
  private hasCachedData: boolean = false;
  private outputData: DataTableType | null = null; // Add output data storage

  createViewPanel(): ReactElement {
    return createElement(PostgresViewPanelWrapper, {
      nodeView: this,
    });
  }

  onModelChanged(): void {
    // Handle model changes - update view based on current model state
    this.updateViewFromModel();
    // Trigger re-render to update the view with new model values
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method called by execution system after successful execution
  public setLoadedData(data: DataTableType | null): void {
    this.outputData = data;
    // Update view to reflect the loaded output data
    this.updateViewFromOutputData();
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to get output data
  public getOutputData(): DataTableType | null {
    return this.outputData;
  }

  private updateViewFromModel(): void {
    const connection = this.nodeModel.getConnection();
    const tableConfig = this.nodeModel.getTableConfig();

    // Determine connection status based on configuration
    if (connection.host && connection.database && connection.username && connection.password) {
      this.connectionStatus = 'success';
      this.connectionError = null;
    } else {
      this.connectionStatus = 'error';
      this.connectionError = 'Missing required connection parameters';
    }

    // First check if we have output data from execution
    if (this.outputData) {
      this.updateViewFromOutputData();
      return;
    }

    // Check if we have cached data for the selected table
    if (tableConfig.selectedTable && this.nodeModel.hasCachedData(tableConfig.selectedTable)) {
      const cachedData = this.nodeModel.getCachedData();
      this.selectedTableData = {
        rows: cachedData.rows.slice(0, 50), // Show first 50 rows for preview
        fields: cachedData.fields.map((field: any) => ({
          name: field.name,
          dataType: field.dataType || 'unknown'
        })),
        totalRows: cachedData.rows.length,
        rowCount: Math.min(50, cachedData.rows.length)
      };
      this.hasCachedData = true;
      this.generateDataStats();
    } else if (tableConfig.selectedTable) {
      // Table is selected but no cached data
      this.selectedTableData = null;
      this.hasCachedData = false;
      this.dataStats = null;
    } else {
      // No table selected
      this.selectedTableData = null;
      this.hasCachedData = false;
      this.dataStats = null;
    }
  }

  private updateViewFromOutputData(): void {
    if (this.outputData) {
      // Convert DataTableType to the format expected by the view
      const rows: any[] = [];
      const fields: any[] = [];
      
      // Extract column information
      if (this.outputData.spec && this.outputData.spec.columns) {
        this.outputData.spec.columns.forEach((col: any) => {
          fields.push({
            name: col.name,
            dataType: col.type || 'unknown'
          });
        });
      }

      // Extract row data
      this.outputData.forEach((row: any) => {
        const rowData: any = {};
        if (row.cells && Array.isArray(row.cells)) {
          row.cells.forEach((cell: any, cellIndex: number) => {
            const columnName = fields[cellIndex]?.name || `column_${cellIndex}`;
            rowData[columnName] = cell.getValue();
          });
        }
        rows.push(rowData);
      });

      this.selectedTableData = {
        rows: rows.slice(0, 50), // Show first 50 rows for preview
        fields: fields,
        totalRows: rows.length,
        rowCount: Math.min(50, rows.length)
      };
      this.hasCachedData = false; // This is execution output, not cached
      this.generateDataStats();
    }
  }

  private generateDataStats(): void {
    if (this.selectedTableData?.rows && this.selectedTableData?.fields) {
      const fields = this.selectedTableData.fields;
      const rows = this.selectedTableData.rows;
      
      // Calculate statistics from the actual data
      const columnStats = fields.map((field: any) => {
        let nullCount = 0;
        const uniqueValues = new Set();
        
        rows.forEach((row: any) => {
          const value = row[field.name];
          
          if (value === null || value === undefined || value === '') {
            nullCount++;
          } else {
            uniqueValues.add(value);
          }
        });
        
        return {
          name: field.name,
          type: field.dataType || 'unknown',
          nullCount,
          uniqueCount: uniqueValues.size
        };
      });
      
      // Calculate overall quality metrics
      const totalCells = rows.length * fields.length;
      const totalNulls = columnStats.reduce((sum: number, col: any) => sum + col.nullCount, 0);
      const completeness = totalCells > 0 ? ((totalCells - totalNulls) / totalCells) * 100 : 0;
      const qualityScore = Math.min(95, completeness + 5); // Simple quality score
      
      this.dataStats = {
        totalRows: this.selectedTableData.totalRows || rows.length,
        totalColumns: fields.length,
        dataSize: this.formatDataSize(rows.length * fields.length * 10), // Rough estimate
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

  // Method to set update callback
  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  // Public getters for current state
  public getConnectionStatus(): 'untested' | 'success' | 'error' {
    return this.connectionStatus;
  }

  public getConnectionError(): string | null {
    return this.connectionError;
  }

  public getSelectedTableData(): any {
    return this.selectedTableData;
  }

  public getDataStats(): any {
    return this.dataStats;
  }

  public getHasCachedData(): boolean {
    return this.hasCachedData;
  }

  // Public getter for current model state
  public getNodeModel(): PostgresInputNodeModel {
    return this.nodeModel;
  }

  // Method to update view when execution completes and data is cached
  public updateAfterExecution(): void {
    this.updateViewFromModel();
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }
}

interface PostgresViewPanelWrapperProps {
  nodeView: PostgresInputNodeView;
}

function PostgresViewPanelWrapper(props: PostgresViewPanelWrapperProps) {
  const [, forceUpdate] = useState({});

  // Set up the force update callback
  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  // Get current values from the node model
  const model = props.nodeView.getNodeModel();
  const connection = model.getConnection();
  const tableConfig = model.getTableConfig();
  const connectionStatus = props.nodeView.getConnectionStatus();
  const connectionError = props.nodeView.getConnectionError();
  const selectedTableData = props.nodeView.getSelectedTableData();
  const dataStats = props.nodeView.getDataStats();
  const hasCachedData = props.nodeView.getHasCachedData();
  const outputData = props.nodeView.getOutputData();

  return createElement(PostgresViewPanel, {
    connection,
    tableConfig,
    connectionStatus,
    connectionError,
    selectedTableData,
    dataStats,
    hasCachedData,
    outputData,
    nodeView: props.nodeView,
  });
}

interface PostgresViewPanelProps {
  connection: any;
  tableConfig: any;
  connectionStatus: 'untested' | 'success' | 'error';
  connectionError: string | null;
  selectedTableData: any;
  dataStats: any;
  hasCachedData: boolean;
  outputData: DataTableType | null;
  nodeView?: PostgresInputNodeView;
}

function PostgresViewPanel(props: PostgresViewPanelProps) {
  const {
    connection,
    tableConfig,
    connectionStatus,
    connectionError,
    selectedTableData,
    dataStats,
    hasCachedData,
    outputData,
  } = props;

  const formatConnectionString = () => {
    if (connection.host && connection.database) {
      return `${connection.database}@${connection.host}:${connection.port}`;
    }
    return 'Not configured';
  };

  const getStatusDisplay = () => {
    if (connectionError) {
      return {
        status: 'Error',
        color: 'destructive' as const,
        icon: WarningIcon,
      };
    } else if (connectionStatus === 'success') {
      return {
        status: 'Configured',
        color: 'default' as const,
        icon: CheckCircleFillIcon,
      };
    } else {
      return {
        status: 'Not configured',
        color: 'secondary' as const,
        icon: WarningIcon,
      };
    }
  };

  // Convert PostgreSQL data to DataTable format
  const convertRowsForDataTable = (data: any) => {
    if (!data?.rows || !data?.fields) {
      return { columns: [], rows: [] };
    }

    const columns = data.fields.map((field: any) => ({
      name: field.name,
      type: field.dataType || 'unknown'
    }));

    const rows = data.rows.map((row: any) => {
      const convertedRow: { [key: string]: any } = {};
      data.fields.forEach((field: any) => {
        convertedRow[field.name] = row[field.name] || '';
      });
      return convertedRow;
    });

    return { columns, rows };
  };

  // Convert DataTableType to display format
  const convertOutputDataForDisplay = (data: DataTableType | null) => {
    if (!data) {
      return { columns: [], rows: [] };
    }

    const columns = data.spec?.columns?.map((col: any) => ({
      name: col.name,
      type: col.type || 'unknown'
    })) || [];

    const rows: any[] = [];
    data.forEach((row: any) => {
      const rowData: { [key: string]: any } = {};
      if (row.cells && Array.isArray(row.cells)) {
        row.cells.forEach((cell: any, cellIndex: number) => {
          const columnName = columns[cellIndex]?.name || `column_${cellIndex}`;
          rowData[columnName] = cell.getValue();
        });
      }
      rows.push(rowData);
    });

    return { columns, rows };
  };

  const statusInfo = getStatusDisplay();
  const tableData = convertRowsForDataTable(selectedTableData);
  const outputTableData = convertOutputDataForDisplay(outputData);

  // Determine which data to show - prioritize output data over cached data
  const displayData = outputData ? outputTableData : tableData;
  const hasData = outputData || selectedTableData;
  const isFromExecution = !!outputData;

  return (
    <div className="size-full overflow-auto" data-testid="postgres-node-view">
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
            <InfoIcon size={16} />
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
                {connectionStatus === 'error' && (
                  <div className="p-8 text-center">
                    <AlertCircle className="size-12 mx-auto mb-4 text-destructive opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      Configuration Error
                    </div>
                    <div className="text-sm text-destructive">
                      {connectionError}
                    </div>
                  </div>
                )}

                {connectionStatus === 'success' && !tableConfig.selectedTable && (
                  <div className="p-8 text-center">
                    <TableIcon size={48} />
                    <div className="text-muted-foreground mb-2">
                      No table selected
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Configure the node to select a table for data preview
                    </div>
                  </div>
                )}

                {connectionStatus === 'success' && tableConfig.selectedTable && !hasData && (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full size-8 border-b-2 border-primary mx-auto mb-4" />
                    <div className="text-muted-foreground">No data available</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Execute the node to load table data
                    </div>
                  </div>
                )}

                {connectionStatus === 'success' && tableConfig.selectedTable && hasData && (
                  <div>
                    {isFromExecution && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">
                        <div className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          <CheckCircleFillIcon size={14} />
                          Showing execution output data
                        </div>
                      </div>
                    )}
                    {hasCachedData && !isFromExecution && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border-b">
                        <div className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                          <CheckCircleFillIcon size={14} />
                          Using cached data (no API call needed)
                        </div>
                      </div>
                    )}
                    <DataTable
                      columns={displayData.columns}
                      rows={displayData.rows}
                      title="Table Data Preview"
                      description={`Showing preview of ${tableConfig.selectedTable} (${dataStats?.totalRows?.toLocaleString() || 'Unknown'} rows total)`}
                      rowsPerPage={10}
                      emptyMessage="No data rows found"
                    />
                  </div>
                )}

                {connectionStatus === 'untested' && (
                  <div className="p-8 text-center">
                    <PostgresIcon size={48} />
                    <div className="text-muted-foreground mb-2">
                      Not configured
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Configure database connection to see data preview
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
                  <PostgresIcon size={20} />
                  PostgreSQL Connection Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Connection Status</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusInfo.color} className="text-xs">
                        <statusInfo.icon size={12} />
                        {statusInfo.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Database</div>
                    <div className="text-sm text-muted-foreground break-all">
                      {formatConnectionString()}
                    </div>
                  </div>

                  {tableConfig.selectedTable && (
                    <>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Selected Table</div>
                        <div className="text-sm text-muted-foreground">
                          {tableConfig.selectedTable}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Page Size</div>
                        <div className="text-sm text-muted-foreground">
                          {tableConfig.pageSize} rows
                        </div>
                      </div>
                    </>
                  )}

                  {dataStats && (
                    <>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Total Rows</div>
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

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Data Source</div>
                        <div className="text-sm text-muted-foreground">
                          {isFromExecution ? 'Execution Output' : 'Cached Data'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!selectedTableData && connectionStatus === 'success' && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No data loaded. Select a table and execute the node to see detailed information.
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
                            Type: {column.type} | Unique: {column.uniqueCount?.toLocaleString()} | Nulls: {column.nullCount?.toLocaleString()}
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
                              ⚠️ Some columns contain null values - consider data cleaning
                            </div>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            💡 Total unique values: {dataStats.columns
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
                      Select a table and execute the node to see quality metrics
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
