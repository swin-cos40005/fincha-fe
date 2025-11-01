'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import { NodeView } from '../../core';
import type { HTMTManipulatorNodeModel } from './node-model';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Eye,
  Database,
} from 'lucide-react';

export class HTMTManipulatorNodeView extends NodeView<HTMTManipulatorNodeModel> {
  private forceUpdateCallback: (() => void) | null = null;
  private outputData: any = null;

  createViewPanel(): ReactElement {
    return createElement(HTMTManipulatorViewPanelWrapper, {
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
  public getNodeModel(): HTMTManipulatorNodeModel {
    return this.nodeModel;
  }

  // Required abstract method implementation
  onModelChanged(): void {
    this.forceUpdateCallback?.();
  }
}

interface HTMTManipulatorViewPanelWrapperProps {
  nodeView: HTMTManipulatorNodeView;
}

function HTMTManipulatorViewPanelWrapper(props: HTMTManipulatorViewPanelWrapperProps) {
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
    sampleCount: (model as any).sampleCount || 200,
    maxHTMT: (model as any).maxHTMT || 0.85,
    targetLoading: (model as any).targetLoading || 0.7,
    groupCount: (model as any).groupSizes?.length || 3,
    discriminantValidity: true,
    generationTime: Math.random() * 2 + 1,
    groupStats: null as any,
    htmtMatrix: null as any
  };

  // Extract generated data if available
  const generatedData = (model as any).generatedData;
  if (generatedData?.groupStats) {
    displayData.groupStats = generatedData.groupStats.map((stat: any, index: number) => ({
      groupIndex: index,
      groupName: `Group ${index + 1}`,
      size: stat.size || 4,
      avgLoading: stat.avgLoading || 0.7,
      varianceExplained: stat.varianceExplained || 0.5
    }));
  }

  if (generatedData?.htmtMatrix) {
    displayData.htmtMatrix = generatedData.htmtMatrix;
    // Check discriminant validity
    const maxHTMTValue = Math.max(
      ...generatedData.htmtMatrix.flat().filter((val: number) => val < 1.0)
    );
    displayData.discriminantValidity = maxHTMTValue < displayData.maxHTMT;
  }

  const hasOutputData = outputData && outputData.getRowCount && outputData.getRowCount() > 0;

  if (!hasOutputData) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              HTMT Manipulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Eye className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Data Generated</h3>
              <p className="text-muted-foreground">
                Configure the node and execute to see HTMT analysis results
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
            <BarChart3 className="size-6" />
            HTMT Analysis Results
          </h2>
          <p className="text-muted-foreground">
            Heterotrait-Monotrait discriminant validity assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={displayData.discriminantValidity ? "default" : "destructive"}>
            {displayData.discriminantValidity ? "Valid" : "Invalid"} Discriminant Validity
          </Badge>
          <Badge variant="outline">
            {displayData.groupCount} Groups
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
                <p className="text-2xl font-bold">{displayData.sampleCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="size-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Max HTMT</p>
                <p className="text-2xl font-bold">{displayData.maxHTMT.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-8 text-green-600" />
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
              {displayData.discriminantValidity ? (
                <CheckCircle2 className="size-8 text-green-600" />
              ) : (
                <AlertTriangle className="size-8 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Validity</p>
                <p className="text-2xl font-bold">
                  {displayData.discriminantValidity ? "Pass" : "Fail"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Output */}
      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Generated Data</TabsTrigger>
          <TabsTrigger value="analysis">HTMT Analysis</TabsTrigger>
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
                title="Generated HTMT Data"
                rowsPerPage={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-5" />
                Analysis Summary
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
                  <p className="text-muted-foreground">HTMT Threshold</p>
                  <p className="font-medium">{displayData.maxHTMT.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Loading</p>
                  <p className="font-medium">{displayData.targetLoading.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Groups Count</p>
                  <p className="font-medium">{displayData.groupCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discriminant Validity</p>
                  <p className={`font-medium ${displayData.discriminantValidity ? 'text-green-600' : 'text-red-600'}`}>
                    {displayData.discriminantValidity ? 'Valid' : 'Invalid'}
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
