'use client';

import React, { useState, useEffect, type ReactElement } from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, Info, Target } from 'lucide-react';
import type { OuterLoadingManipulatorNodeModel } from './node-model';

interface DialogState {
  nSamples: number;
  targetLoading: number;
  numIndicators: number;
  outputFormat: 'csv' | 'json' | 'both';
  outputFilename: string;
  includeStatistics: boolean;
}

export class OuterLoadingManipulatorNodeDialog extends NodeDialog {
  private model: OuterLoadingManipulatorNodeModel;
  private state: DialogState = {
    nSamples: 200,
    targetLoading: 0.7,
    numIndicators: 5,
    outputFormat: 'csv',
    outputFilename: '',
    includeStatistics: true
  };

  constructor(model: OuterLoadingManipulatorNodeModel) {
    super();
    this.model = model;
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    // Helper functions with fallback logic
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };

    const getString = (key: string, defaultValue: string): string => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'string' ? value : defaultValue;
    };

    // Load basic settings
    this.state.nSamples = getNumber('nSamples', 200);
    this.state.targetLoading = getNumber('targetLoading', 0.7);
    this.state.numIndicators = getNumber('numIndicators', 5);
    this.state.includeStatistics = settings.getBoolean?.('includeStatistics', true) ?? true;
    this.state.outputFormat = getString('outputFormat', 'csv') as 'csv' | 'json' | 'both';
    this.state.outputFilename = getString('outputFilename', '');
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('nSamples', this.state.nSamples);
    settings.set('targetLoading', this.state.targetLoading);
    settings.set('numIndicators', this.state.numIndicators);
    settings.set('includeStatistics', this.state.includeStatistics);
    settings.set('outputFormat', this.state.outputFormat);
    settings.set('outputFilename', this.state.outputFilename);
  }

  createDialogPanel(): ReactElement {
    return <OuterLoadingManipulatorDialogPanel dialog={this} />;
  }

  // Public methods for the dialog panel
  getState(): DialogState {
    return { ...this.state };
  }

  updateState(updates: Partial<DialogState>): void {
    this.state = { ...this.state, ...updates };
  }
}

interface OuterLoadingManipulatorDialogPanelProps {
  dialog: OuterLoadingManipulatorNodeDialog;
}

function OuterLoadingManipulatorDialogPanel({ dialog }: OuterLoadingManipulatorDialogPanelProps) {
  const [state, setState] = useState<DialogState>(dialog.getState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update dialog state when local state changes
  useEffect(() => {
    dialog.updateState(state);
  }, [state, dialog]);

  // Validation function
  const validateSettings = (currentState: DialogState): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (currentState.nSamples <= 0) {
      newErrors.nSamples = 'Sample count must be positive';
    }
    if (currentState.nSamples > 10000) {
      newErrors.nSamples = 'Sample count should not exceed 10,000';
    }

    if (currentState.targetLoading <= 0 || currentState.targetLoading >= 1) {
      newErrors.targetLoading = 'Target loading must be between 0 and 1';
    }

    if (currentState.numIndicators < 2) {
      newErrors.numIndicators = 'Number of indicators must be at least 2';
    }
    if (currentState.numIndicators > 20) {
      newErrors.numIndicators = 'Number of indicators should not exceed 20';
    }

    return newErrors;
  };

  useEffect(() => {
    setErrors(validateSettings(state));
  }, [state]);

  const handleStateChange = (key: keyof DialogState, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Outer Loading Manipulator Configuration</h2>
          <p className="text-muted-foreground">
            Generate synthetic indicator data with specific outer loadings for factor analysis
          </p>
        </div>
        <Badge variant="secondary">Factor Analysis</Badge>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="output">Output Options</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Basic Configuration
              </CardTitle>
              <CardDescription>
                Configure the fundamental parameters for outer loading manipulation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-count">Sample Count</Label>
                  <Input
                    id="sample-count"
                    type="number"
                    min="50"
                    max="10000"
                    value={state.nSamples}
                    onChange={(e) => handleStateChange('nSamples', parseInt(e.target.value) || 200)}
                  />
                  {errors.nSamples && (
                    <p className="text-sm text-destructive">{errors.nSamples}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-loading">Target Loading</Label>
                  <Input
                    id="target-loading"
                    type="number"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={state.targetLoading}
                    onChange={(e) => handleStateChange('targetLoading', parseFloat(e.target.value) || 0.7)}
                  />
                  {errors.targetLoading && (
                    <p className="text-sm text-destructive">{errors.targetLoading}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="size-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Outer Loading Guidelines:</p>
                  <ul className="space-y-1">
                    <li>• 0.70 or higher: Good reliability and validity</li>
                    <li>• 0.60-0.69: Acceptable for exploratory research</li>
                    <li>• Below 0.60: Consider removal or improvement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Indicator Configuration
              </CardTitle>
              <CardDescription>
                Configure the number and properties of indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="num-indicators">Number of Indicators</Label>
                <Input
                  id="num-indicators"
                  type="number"
                  min="2"
                  max="20"
                  value={state.numIndicators}
                  onChange={(e) => handleStateChange('numIndicators', parseInt(e.target.value) || 5)}
                />
                {errors.numIndicators && (
                  <p className="text-sm text-destructive">{errors.numIndicators}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of indicator variables to generate for the latent construct
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Generated Structure Preview</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Latent Factor: 1 construct</p>
                  <p>• Indicators: {state.numIndicators} variables (Indicator1 to Indicator{state.numIndicators})</p>
                  <p>• Target Loading: {state.targetLoading.toFixed(2)} for each indicator</p>
                  <p>• Sample Size: {state.nSamples.toLocaleString()} observations</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="size-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Technical Note:</p>
                  <p>
                    The algorithm generates correlated data using iterative correlation adjustment 
                    to achieve the target outer loading between each indicator and the latent construct.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Output Configuration</CardTitle>
              <CardDescription>
                Configure output format and additional statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Output Format</Label>
                <Select
                  value={state.outputFormat}
                  onValueChange={(value: 'csv' | 'json' | 'both') => handleStateChange('outputFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Only</SelectItem>
                    <SelectItem value="json">JSON Only</SelectItem>
                    <SelectItem value="both">Both CSV and JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label>Include Loading Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Include correlation matrix and loading analysis in output
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={state.includeStatistics}
                  onChange={(e) => handleStateChange('includeStatistics', e.target.checked)}
                  className="rounded"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-filename">Output Filename (Optional)</Label>
                <Input
                  id="output-filename"
                  value={state.outputFilename}
                  onChange={(e) => handleStateChange('outputFilename', e.target.value)}
                  placeholder="outer_loading_data"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {!isFormValid && (
            <>
              <AlertCircle className="size-4 text-destructive" />
              Please fix validation errors before proceeding
            </>
          )}
        </p>
      </div>
    </div>
  );
}
