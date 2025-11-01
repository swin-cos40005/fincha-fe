'use client';

import React, { createElement, useState, useEffect, type ReactElement } from 'react';
import { NodeView } from '@/lib/nodes/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import type { EVAManipulatorNodeModel, AVEResults } from './node-model';

export class EVAManipulatorNodeView extends NodeView<EVAManipulatorNodeModel> {
  constructor(nodeModel: EVAManipulatorNodeModel) {
    super(nodeModel);
  }

  createViewPanel(): ReactElement {
    return createElement(EVAManipulatorViewPanelWrapper, {
      nodeView: this,
    });
  }

  getSize(): { width: number; height: number } {
    return { width: 450, height: 700 };
  }

  getTitle(): string {
    const method = this.nodeModel.getGenerationMethod();
    const methodMap = {
      ave: 'AVE Target',
      reliability: 'Reliability Target',
      both: 'AVE + Reliability'
    };
    return `EVA Manipulator - ${methodMap[method]}`;
  }

  getIcon(): string {
    return '📊';
  }

  canResize(): boolean {
    return true;
  }

  getMinSize(): { width: number; height: number } {
    return { width: 350, height: 500 };
  }

  getMaxSize(): { width: number; height: number } {
    return { width: 600, height: 1000 };
  }

  public getNodeModel(): EVAManipulatorNodeModel {
    return this.nodeModel;
  }

  onModelChanged(): void {
    // This method is called when the model changes
    // Implementation depends on the specific requirements of the view
  }
}

interface EVAManipulatorViewPanelWrapperProps {
  nodeView: EVAManipulatorNodeView;
}

function EVAManipulatorViewPanelWrapper(props: EVAManipulatorViewPanelWrapperProps) {
  const [nodeModel, setNodeModel] = useState<EVAManipulatorNodeModel>(props.nodeView.getNodeModel());
  const [generatedData, setGeneratedData] = useState<{ loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } | null>(null);
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

    handleModelChange();
  }, [props.nodeView]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
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
    const { indicatorData } = generatedData;
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    for (let i = 0; i < indicatorData.length; i++) {
      csvContent += indicatorData[i].map(val => val.toFixed(6)).join(',') + '\n';
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eva_manipulator_${nodeModel.getGenerationMethod()}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLoadings = () => {
    if (!generatedData) return;

    const { loadings } = generatedData;
    
    // Create loadings matrix CSV
    let csvContent = 'Factor,Indicator,Loading\n';
    loadings.forEach((factorLoadings, factorIndex) => {
      factorLoadings.forEach((loading, indicatorIndex) => {
        csvContent += `F${factorIndex + 1},I${indicatorIndex + 1},${loading.toFixed(6)}\n`;
      });
    });

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eva_manipulator_loadings.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return createElement(EVAManipulatorViewPanel, {
    nodeModel,
    generatedData,
    isGenerating,
    error,
    onGenerate: handleGenerate,
    onDownload: handleDownload,
    onDownloadLoadings: handleDownloadLoadings,
  });
}

interface EVAManipulatorViewPanelProps {
  nodeModel: EVAManipulatorNodeModel;
  generatedData: { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } | null;
  isGenerating: boolean;
  error: string;
  onGenerate: () => void;
  onDownload: () => void;
  onDownloadLoadings: () => void;
}

function EVAManipulatorViewPanel({
  nodeModel,
  generatedData,
  isGenerating,
  error,
  onGenerate,
  onDownload,
  onDownloadLoadings,
}: EVAManipulatorViewPanelProps): ReactElement {
  const generationMethod = nodeModel.getGenerationMethod();
  const sampleCount = nodeModel.getSampleCount();
  const numFactors = nodeModel.getNumFactors();
  const indicatorsPerFactor = nodeModel.getIndicatorsPerFactor();

  const getTargetInfo = () => {
    switch (generationMethod) {
      case 'ave':
        return {
          label: 'Target AVE',
          value: nodeModel.getTargetAVE().toFixed(3),
          achieved: generatedData?.results.ave.toFixed(3),
          description: 'Average Variance Extracted'
        };
      case 'reliability':
        return {
          label: 'Target Reliability',
          value: nodeModel.getTargetReliability().toFixed(3),
          achieved: generatedData?.results.reliability.toFixed(3),
          description: 'Composite Reliability'
        };
      case 'both':
        return {
          label: 'Dual Targets',
          value: `AVE: ${nodeModel.getTargetAVE().toFixed(3)}, CR: ${nodeModel.getTargetReliability().toFixed(3)}`,
          achieved: generatedData ? `AVE: ${generatedData.results.ave.toFixed(3)}, CR: ${generatedData.results.reliability.toFixed(3)}` : undefined,
          description: 'AVE + Composite Reliability'
        };
      default:
        return { label: 'Unknown', value: 'N/A', achieved: 'N/A', description: 'Unknown method' };
    }
  };

  const targetInfo = getTargetInfo();

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factor Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Sample Count:</span>
              <Badge variant="secondary" className="ml-2">{sampleCount}</Badge>
            </div>
            <div>
              <span className="font-medium">Factors:</span>
              <Badge variant="secondary" className="ml-2">{numFactors}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Indicators/Factor:</span>
              <Badge variant="secondary" className="ml-2">{indicatorsPerFactor}</Badge>
            </div>
            <div>
              <span className="font-medium">Total Indicators:</span>
              <Badge variant="secondary" className="ml-2">{numFactors * indicatorsPerFactor}</Badge>
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
      </div>

      {generatedData && (
        <div className="flex gap-2">
          <Button onClick={onDownload} variant="outline" className="flex-1">
            <Download className="size-4 mr-2" />
            Download Data
          </Button>
          <Button onClick={onDownloadLoadings} variant="outline" className="flex-1">
            <BarChart3 className="size-4 mr-2" />
            Download Loadings
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Factor Analysis Results */}
      {generatedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Factor Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Overall AVE:</span>
                <Badge variant="secondary" className="ml-2">
                  {generatedData.results.ave.toFixed(4)}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Composite Reliability:</span>
                <Badge variant="secondary" className="ml-2">
                  {generatedData.results.reliability.toFixed(4)}
                </Badge>
              </div>
            </div>

            <div>
              <span className="font-medium">Discriminant Validity:</span>
              <Badge variant="outline" className="ml-2">
                {generatedData.results.discriminantValidity.toFixed(4)}
              </Badge>
            </div>

            {/* Factor-specific statistics */}
            <div>
              <span className="font-medium text-sm">Factor-Specific Results:</span>
              <div className="mt-2 space-y-3">
                {generatedData.results.loadings.map((factorLoadings, factorIndex) => {
                  const factorAVE = nodeModel.computeAVE(factorLoadings);
                  const factorReliability = nodeModel.computeCompositeReliability ? nodeModel.computeCompositeReliability(factorLoadings) : 0;
                  
                  return (
                    <div key={factorIndex} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">Factor {factorIndex + 1}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            AVE: {factorAVE.toFixed(3)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            CR: {factorReliability.toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <span className="font-medium">Loadings:</span>
                        <div className="grid grid-cols-2 gap-1">
                          {factorLoadings.map((loading, indicatorIndex) => (
                            <div key={indicatorIndex} className="flex justify-between">
                              <span>I{indicatorIndex + 1}:</span>
                              <Badge variant={loading >= 0.7 ? "default" : "secondary"} className="text-xs">
                                {loading.toFixed(3)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    {generatedData.indicatorData.length} × {generatedData.indicatorData[0].length}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Headers:</span>
                  <Badge variant="outline" className="ml-2">
                    {nodeModel.getColumnHeaders().length} indicators
                  </Badge>
                </div>
              </div>
              
              <div className="text-xs">
                <p className="font-medium mb-2">Indicator Names:</p>
                <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                  {nodeModel.getColumnHeaders().join(', ')}
                </div>
              </div>
              
              <div className="text-xs mt-3">
                <p className="font-medium mb-2">Sample Data (first 3 observations):</p>
                <div className="font-mono bg-gray-50 p-2 rounded text-xs overflow-auto max-h-24">
                  {generatedData.indicatorData.slice(0, 3).map((row, idx) => (
                    <div key={idx} className="truncate">
                      {row.map(val => val.toFixed(3)).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interpretation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interpretation Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <span className="font-medium">AVE (Average Variance Extracted):</span>
            <p className="text-gray-600">≥ 0.5 indicates good convergent validity</p>
          </div>
          <div>
            <span className="font-medium">Composite Reliability:</span>
            <p className="text-gray-600">≥ 0.7 indicates acceptable internal consistency</p>
          </div>
          <div>
            <span className="font-medium">Factor Loadings:</span>
            <p className="text-gray-600">≥ 0.7 indicates strong indicator-factor relationship</p>
          </div>
          <div>
            <span className="font-medium">Discriminant Validity:</span>
            <p className="text-gray-600">√AVE should exceed inter-factor correlations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
