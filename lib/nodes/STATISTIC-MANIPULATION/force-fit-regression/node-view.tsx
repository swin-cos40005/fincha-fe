'use client';

import React, { createElement, useState, useEffect, type ReactElement } from 'react';
import { NodeView } from '@/lib/nodes/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import type { ForceRegressionNodeModel, RegressionStats } from './node-model';

export class ForceRegressionNodeView extends NodeView<ForceRegressionNodeModel> {
  constructor(nodeModel: ForceRegressionNodeModel) {
    super(nodeModel);
  }

  createViewPanel(): ReactElement {
    return createElement(ForceRegressionViewPanelWrapper, {
      nodeView: this,
    });
  }

  getSize(): { width: number; height: number } {
    return { width: 400, height: 600 };
  }

  getTitle(): string {
    const targetType = this.nodeModel.getTargetType();
    const targetMap = {
      r2: 'R²',
      beta: 'Beta',
      cohenF2: 'Cohen\'s f²',
      q2: 'Q²'
    };
    return `Force Regression - ${targetMap[targetType]} Target`;
  }

  getIcon(): string {
    return '📊';
  }

  canResize(): boolean {
    return true;
  }

  getMinSize(): { width: number; height: number } {
    return { width: 300, height: 400 };
  }

  getMaxSize(): { width: number; height: number } {
    return { width: 800, height: 1200 };
  }

  public getNodeModel(): ForceRegressionNodeModel {
    return this.nodeModel;
  }

  onModelChanged(): void {
    // This method is called when the model changes
    // In React-based views, we typically handle this through state management
    // The wrapper component already handles model updates via useEffect
  }
}

interface ForceRegressionViewPanelWrapperProps {
  nodeView: ForceRegressionNodeView;
}

function ForceRegressionViewPanelWrapper(props: ForceRegressionViewPanelWrapperProps) {
  const [nodeModel, setNodeModel] = useState<ForceRegressionNodeModel>(props.nodeView.getNodeModel());
  const [generatedData, setGeneratedData] = useState<{ X: number[][], y: number[], stats: RegressionStats } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // Refresh data when nodeModel changes
  useEffect(() => {
    const model = props.nodeView.getNodeModel();
    setNodeModel(model);
    setGeneratedData(model.getGeneratedData());
  }, [props.nodeView]);

  // Subscribe to node model changes
  useEffect(() => {
    const handleModelChange = () => {
      const model = props.nodeView.getNodeModel();
      setNodeModel(model);
      setGeneratedData(model.getGeneratedData());
    };

    // Note: In a real implementation, you'd want to subscribe to model changes
    // For now, we'll just update when the component mounts
    handleModelChange();
  }, [props.nodeView]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Trigger data generation by executing the node
      // In a real implementation, this would be handled by the workflow engine
      // For now, we'll just update the view
      const data = nodeModel.getGeneratedData();
      setGeneratedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedData) return;

    const headers = nodeModel.getColumnHeaders();
    const { X, y } = generatedData;
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    for (let i = 0; i < X.length; i++) {
      const row = [...X[i], y[i]];
      csvContent += row.map(val => val.toFixed(6)).join(',') + '\n';
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `force_regression_${nodeModel.getTargetType()}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return createElement(ForceRegressionViewPanel, {
    nodeModel,
    generatedData,
    isGenerating,
    error,
    onGenerate: handleGenerate,
    onDownload: handleDownload,
  });
}

interface ForceRegressionViewPanelProps {
  nodeModel: ForceRegressionNodeModel;
  generatedData: { X: number[][], y: number[], stats: RegressionStats } | null;
  isGenerating: boolean;
  error: string;
  onGenerate: () => void;
  onDownload: () => void;
}

function ForceRegressionViewPanel({
  nodeModel,
  generatedData,
  isGenerating,
  error,
  onGenerate,
  onDownload,
}: ForceRegressionViewPanelProps): ReactElement {
  const targetType = nodeModel.getTargetType();
  const sampleCount = nodeModel.getSampleCount();
  const predictorCount = nodeModel.getPredictorCount();

  const getTargetInfo = () => {
    switch (targetType) {
      case 'r2':
        return {
          label: 'Target R²',
          value: nodeModel.getTargetR2().toFixed(3),
          achieved: generatedData?.stats.r2adj.toFixed(3)
        };
      case 'beta':
        return {
          label: 'Target Beta',
          value: nodeModel.getTargetBeta().map(b => b.toFixed(3)).join(', '),
          achieved: generatedData?.stats.beta.map(b => b.toFixed(3)).join(', ')
        };
      case 'cohenF2':
        return {
          label: 'Target Cohen\'s f²',
          value: nodeModel.getTargetCohenF2().toFixed(3),
          achieved: generatedData?.stats.cohenF2[0]?.toFixed(3)
        };
      case 'q2':
        return {
          label: 'Target Q²',
          value: nodeModel.getTargetQ2().toFixed(3),
          achieved: generatedData?.stats.q2.toFixed(3)
        };
      default:
        return { label: 'Unknown', value: 'N/A', achieved: 'N/A' };
    }
  };

  const targetInfo = getTargetInfo();

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Sample Count:</span>
              <Badge variant="secondary" className="ml-2">{sampleCount}</Badge>
            </div>
            <div>
              <span className="font-medium">Predictors:</span>
              <Badge variant="secondary" className="ml-2">{predictorCount}</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{targetInfo.label}:</span>
              <Badge variant="outline" className="ml-2">{targetInfo.value}</Badge>
            </div>
            
            {generatedData && targetInfo.achieved && (
              <div className="text-sm">
                <span className="font-medium">Achieved:</span>
                <Badge variant="default" className="ml-2">{targetInfo.achieved}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="size-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="size-4 mr-2" />
              Generate Data
            </>
          )}
        </Button>
        
        {generatedData && (
          <Button onClick={onDownload} variant="outline">
            <Download className="size-4 mr-2" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Display */}
      {generatedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regression Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Adjusted R²:</span>
                <Badge variant="secondary" className="ml-2">
                  {generatedData.stats.r2adj.toFixed(4)}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Q²:</span>
                <Badge variant="secondary" className="ml-2">
                  {generatedData.stats.q2.toFixed(4)}
                </Badge>
              </div>
            </div>

            <div>
              <span className="font-medium text-sm">Beta Coefficients:</span>
              <div className="mt-2 space-y-1">
                {generatedData.stats.beta.map((beta, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>X{index + 1}:</span>
                    <Badge variant="outline">{beta.toFixed(4)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-medium text-sm">T-Values:</span>
              <div className="mt-2 space-y-1">
                {generatedData.stats.t.map((t, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>X{index + 1}:</span>
                    <Badge variant="outline">{t.toFixed(4)}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-medium text-sm">P-Values:</span>
              <div className="mt-2 space-y-1">
                {generatedData.stats.p.map((p, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>X{index + 1}:</span>
                    <Badge variant={p < 0.05 ? "default" : "secondary"}>
                      {p.toFixed(4)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-medium text-sm">Cohen&apos;s f²:</span>
              <div className="mt-2 space-y-1">
                {generatedData.stats.cohenF2.map((f2, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>X{index + 1}:</span>
                    <Badge variant="outline">{f2.toFixed(4)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {generatedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="font-medium">Data Shape:</span>
                  <Badge variant="secondary" className="ml-2">
                    {generatedData.X.length} × {generatedData.X[0].length + 1}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Headers:</span>
                  <Badge variant="outline" className="ml-2">
                    {nodeModel.getColumnHeaders().length} columns
                  </Badge>
                </div>
              </div>
              
              <div className="text-xs">
                <p className="font-medium mb-2">Column Headers:</p>
                <p className="text-gray-600">
                  {nodeModel.getColumnHeaders().join(', ')}
                </p>
              </div>
              
              <div className="text-xs mt-3">
                <p className="font-medium mb-2">Sample Data (first 3 rows):</p>
                <div className="font-mono bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                  {generatedData.X.slice(0, 3).map((row, idx) => (
                    <div key={idx}>
                      {[...row.map(val => val.toFixed(3)), generatedData.y[idx].toFixed(3)].join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
