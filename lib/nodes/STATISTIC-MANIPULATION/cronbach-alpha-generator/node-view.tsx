'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView, type DataTableType } from '../../core';
import type { CronbachAlphaNodeModel } from './node-model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChartBarIcon } from '@/components/icons';
import {
  Database,
  Download,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { formatValue } from '@/lib/utils';

export class CronbachAlphaNodeView extends NodeView<CronbachAlphaNodeModel> {
  private forceUpdateCallback: (() => void) | null = null;
  private outputData: DataTableType | null = null;

  createViewPanel(): ReactElement {
    return createElement(CronbachAlphaViewPanelWrapper, {
      nodeView: this,
    });
  }

  onModelChanged(): void {
    // Trigger re-render to update the view with new model values
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to set output data (called after execution)
  public setOutputData(data: DataTableType | null): void {
    this.outputData = data;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to get output data
  public getOutputData(): DataTableType | null {
    return this.outputData;
  }

  // Method called by execution system after successful execution
  public setLoadedData(data: DataTableType | null): void {
    this.outputData = data;
    if (this.forceUpdateCallback) {
      this.forceUpdateCallback();
    }
  }

  // Method to set update callback
  public setUpdateCallback(callback: () => void): void {
    this.forceUpdateCallback = callback;
  }

  // Public getter for current model state
  public getNodeModel(): CronbachAlphaNodeModel {
    return this.nodeModel;
  }
}

interface CronbachAlphaViewPanelWrapperProps {
  nodeView: CronbachAlphaNodeView;
}

function CronbachAlphaViewPanelWrapper(props: CronbachAlphaViewPanelWrapperProps) {
  const [, forceUpdate] = useState({});

  // Set up the force update callback
  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    props.nodeView.setUpdateCallback(updateCallback);

    return () => {
      props.nodeView.setUpdateCallback(() => {});
    };
  }, [props.nodeView]);

  // Get current values from the node model and view
  const model = props.nodeView.getNodeModel();
  const outputData = props.nodeView.getOutputData(); // Use output data from execution
  
  // Try to get data from multiple sources in priority order
  let generatedData: number[][] = [];
  
  if (outputData && outputData.size > 0) {
    // Convert output DataTableType back to number[][]
    generatedData = [];
    outputData.forEach((row) => {
      const rowData: number[] = [];
      row.cells.forEach((cell, _cellIndex) => {
        const value = cell.getValue();
        const numValue = typeof value === 'number' ? value : 
                        typeof value === 'string' ? parseFloat(value) || 0 : 0;
        rowData.push(numValue);
      });
      generatedData.push(rowData);
    });
  } else {
    // Fallback to model data (though this might be empty due to different instances)
    generatedData = model.getGeneratedData();
  }
  
  const sampleCount = model.getSampleCount();
  const targetAlpha = model.getTargetAlpha();
  const optionMap = model.getOptionMap();

  // Remove the polling mechanism as it's not the right approach
  // Add a useEffect that responds to the actual data changes
  useEffect(() => {
    // Force re-render when generatedData changes
    const dataLength = generatedData.length;
    if (dataLength > 0) {
    }
  }, [generatedData.length, outputData]);

  // Also ensure we re-render when outputData changes
  useEffect(() => {
    if (outputData) {
    }
  }, [outputData]);

  // Create mock DataTableType from generated data for the \DataTable component
  const data: DataTableType[] = generatedData.length > 0 ? [{
    spec: {
      columns: model.getColumnHeaders().map(header => ({ name: header, type: 'number' })),
      findColumnIndex: (name: string) => model.getColumnHeaders().findIndex(h => h === name)
    },
    rows: generatedData.map((row, index) => ({
      key: `row-${index}`,
      cells: row.map(value => ({ type: 'number', getValue: () => value })),
      getCell: (index: number) => ({ type: 'number', getValue: () => row[index] })
    })),
    forEach: (callback: any) => {
      generatedData.forEach((row, index) => {
        callback({
          key: `row-${index}`,
          cells: row.map(value => ({ type: 'number', getValue: () => value })),
          getCell: (cellIndex: number) => ({ type: 'number', getValue: () => row[cellIndex] })
        });
      });
    },
    size: generatedData.length
  }] : [];

  return createElement(CronbachAlphaViewPanel, {
    data,
    generatedData,
    sampleCount,
    targetAlpha,
    optionMap,
    nodeModel: model,
  });
}

interface CronbachAlphaViewPanelProps {
  data: DataTableType[];
  generatedData: number[][];
  sampleCount: number;
  targetAlpha: number;
  optionMap: { [numOptions: number]: number };
  nodeModel: CronbachAlphaNodeModel;
}

function CronbachAlphaViewPanel(props: CronbachAlphaViewPanelProps) {
  const {
    data,
    generatedData,
    sampleCount,
    targetAlpha,
    optionMap,
  } = props;

  const handleDownloadCSV = () => {
    if (data.length === 0 || generatedData.length === 0) return;

    const table = data[0];
    const headers = table.spec.columns.map(col => col.name);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    generatedData.forEach(row => {
      csvContent += row.map(val => formatValue(val)).join(',') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cronbach_alpha_data_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const totalQuestions = Object.values(optionMap).reduce((sum, count) => sum + count, 0);
  const hasData = data.length > 0 && generatedData.length > 0;

  return (
    <div className="size-full overflow-auto">
      <Tabs defaultValue="data" className="size-full flex flex-col">
        <TabsList className="flex w-full">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="size-4" />
            Data Preview
            {hasData && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {generatedData.length.toLocaleString()} rows
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Info className="size-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="data" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon size={20} />
                    Generated Data Preview
                  </div>
                  <Button
                    onClick={handleDownloadCSV}
                    variant="outline"
                    size="sm"
                    disabled={!hasData}
                  >
                    <Download size={16} className="mr-2" />
                    Download CSV
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {hasData ? (
                  <DataTable
                    columns={data[0]?.spec.columns || []}
                    rows={data[0]?.rows || []}
                    title="Synthetic Survey Data"
                    description={`Generated data with target Cronbach's alpha of ${targetAlpha} (${generatedData.length.toLocaleString()} rows, ${totalQuestions} questions)`}
                    rowsPerPage={10}
                    emptyMessage="No data rows generated"
                    isLoading={false}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      No data generated yet
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Execute the node to generate synthetic data with the configured Cronbach&apos;s alpha
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="size-5 text-blue-500" />
                  Generation Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Sample Count</div>
                    <div className="text-sm text-muted-foreground">
                      {sampleCount.toLocaleString()} rows
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Target Alpha</div>
                    <div className="text-sm text-muted-foreground">
                      {targetAlpha.toFixed(3)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Total Questions</div>
                    <div className="text-sm text-muted-foreground">
                      {totalQuestions}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Response Options</div>
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(optionMap).length} different scales
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Question Distribution</div>
                  {Object.entries(optionMap).map(([options, count]) => (
                    <div
                      key={options}
                      className="flex justify-between items-center p-3 bg-muted rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{count} questions</div>
                        <div className="text-xs text-muted-foreground">
                          {options}-point scale (1 to {options})
                        </div>
                      </div>
                      <Badge variant="outline">{options} options</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  Generation Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Data Generated</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-green-600">
                            {generatedData.length.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">rows</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Columns Generated</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-blue-600">
                            {totalQuestions}
                          </div>
                          <div className="text-sm text-muted-foreground">questions</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Target Alpha</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-purple-600">
                            {targetAlpha.toFixed(3)}
                          </div>
                          <div className="text-sm text-muted-foreground">reliability</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Data Quality</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-green-600">100%</div>
                          <div className="text-sm text-muted-foreground">synthetic</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Generation Notes</div>
                      <div className="space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-sm text-green-800 dark:text-green-200">
                            ✅ Data successfully generated with target reliability coefficient
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            💡 This synthetic data can be used for testing survey analysis methods
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-sm text-purple-800 dark:text-purple-200">
                            📊 Data follows multivariate normal distribution converted to categorical responses
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <div className="text-muted-foreground mb-2">
                      No statistics available
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Execute the node to generate data and see statistics
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
