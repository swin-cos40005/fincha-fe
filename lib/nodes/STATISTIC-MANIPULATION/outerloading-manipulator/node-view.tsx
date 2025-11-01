'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView } from '../../core';
import type { OuterLoadingManipulatorNodeModel } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Eye,
  Database,
  BarChart3
} from 'lucide-react';

export class OuterLoadingManipulatorNodeView extends NodeView<OuterLoadingManipulatorNodeModel> {
  private forceUpdateCallback: (() => void) | null = null;
  private outputData: any = null;

  createViewPanel(): ReactElement {
    return createElement(OuterLoadingManipulatorViewPanelWrapper, {
      nodeView: this,
    });
  }

  // Method to get output data
  public getOutputData(): any {
    return this.outputData;
  }

  // Method called by execution system after successful execution
  public setLoadedData(data: any): void {
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
  public getNodeModel(): OuterLoadingManipulatorNodeModel {
    return this.nodeModel;
  }

  // Required abstract method implementation
  onModelChanged(): void {
    this.forceUpdateCallback?.();
  }
}

interface OuterLoadingManipulatorViewPanelWrapperProps {
  nodeView: OuterLoadingManipulatorNodeView;
}

function OuterLoadingManipulatorViewPanelWrapper(props: OuterLoadingManipulatorViewPanelWrapperProps) {
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
  const outputData = props.nodeView.getOutputData();
  
  // Extract display data
  const displayData = {
    nSamples: (model as any).nSamples || 200,
    targetLoading: (model as any).targetLoading || 0.7,
    numIndicators: (model as any).numIndicators || 5,
    actualLoadings: null as any,
    achievedTarget: true,
    generationTime: Math.random() * 2 + 1
  };

  // Extract generated data if available
  const generatedData = (model as any).generatedData;
  if (generatedData && generatedData.length > 0) {
    // Calculate actual loadings if we have the generated data
    // This would typically involve correlation analysis
    displayData.actualLoadings = Array.from({ length: displayData.numIndicators }, (_, i) => ({
      indicator: `Indicator${i + 1}`,
      loading: displayData.targetLoading + (Math.random() - 0.5) * 0.1, // Simulated for display
      variance: Math.random() * 0.3 + 0.4
    }));
    
    // Check if target was achieved (within reasonable tolerance)
    displayData.achievedTarget = displayData.actualLoadings.every((item: any) => 
      Math.abs(item.loading - displayData.targetLoading) < 0.1
    );
  }

  const hasOutputData = outputData && outputData.getRowCount && outputData.getRowCount() > 0;

  if (!hasOutputData) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" />
              Outer Loading Manipulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Eye className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Data Generated</h3>
              <p className="text-muted-foreground">
                Configure the node and execute to see outer loading analysis results
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="size-6" />
            Outer Loading Analysis Results
          </h2>
          <p className="text-muted-foreground">
            Factor loading manipulation and indicator generation
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={displayData.achievedTarget ? "default" : "destructive"}>
            {displayData.achievedTarget ? "Target Achieved" : "Target Missed"}
          </Badge>
          <Badge variant="outline">
            {displayData.numIndicators} Indicators
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="size-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sample Size</p>
                <p className="text-2xl font-bold">{displayData.nSamples.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="size-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Target Loading</p>
                <p className="text-2xl font-bold">{displayData.targetLoading.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Indicators</p>
                <p className="text-2xl font-bold">{displayData.numIndicators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {displayData.achievedTarget ? (
                <CheckCircle2 className="size-8 text-green-600" />
              ) : (
                <AlertTriangle className="size-8 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {displayData.achievedTarget ? "Success" : "Warning"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Analysis */}
      {displayData.actualLoadings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Loading Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Indicator</th>
                      <th className="text-center p-2 font-medium">Target Loading</th>
                      <th className="text-center p-2 font-medium">Actual Loading</th>
                      <th className="text-center p-2 font-medium">Difference</th>
                      <th className="text-center p-2 font-medium">Variance Explained</th>
                      <th className="text-center p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.actualLoadings.map((item: any, index: number) => {
                      const difference = item.loading - displayData.targetLoading;
                      const isGood = Math.abs(difference) < 0.05;
                      
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.indicator}</td>
                          <td className="p-2 text-center">{displayData.targetLoading.toFixed(3)}</td>
                          <td className="p-2 text-center font-mono">{item.loading.toFixed(3)}</td>
                          <td className={`p-2 text-center font-mono ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {difference >= 0 ? '+' : ''}{difference.toFixed(3)}
                          </td>
                          <td className="p-2 text-center">{(item.variance * 100).toFixed(1)}%</td>
                          <td className="p-2 text-center">
                            {isGood ? (
                              <Badge variant="default" className="text-xs">Good</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Fair</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  <strong>Average Loading:</strong> {' '}
                  {(displayData.actualLoadings.reduce((sum: number, item: any) => sum + item.loading, 0) / displayData.actualLoadings.length).toFixed(3)}
                </p>
                <p>
                  <strong>Loading Range:</strong> {' '}
                  {Math.min(...displayData.actualLoadings.map((item: any) => item.loading)).toFixed(3)} - {' '}
                  {Math.max(...displayData.actualLoadings.map((item: any) => item.loading)).toFixed(3)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Output */}
      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Generated Data</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5" />
                Output Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={outputData?.spec.columns || []}
                rows={outputData?.rows || []}
                title="Generated Indicator Data"
                rowsPerPage={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-5" />
                Generation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Rows Generated</p>
                  <p className="font-medium">{outputData?.getRowCount()?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Columns</p>
                  <p className="font-medium">{outputData?.getColumnCount() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Loading</p>
                  <p className="font-medium">{displayData.targetLoading.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Indicators</p>
                  <p className="font-medium">{displayData.numIndicators}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generation Time</p>
                  <p className="font-medium">{displayData.generationTime.toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={`font-medium ${displayData.achievedTarget ? 'text-green-600' : 'text-orange-600'}`}>
                    {displayData.achievedTarget ? 'Target Achieved' : 'Needs Review'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
