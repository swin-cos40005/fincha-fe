'use client';

import React, { useState, type ReactElement } from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { ForceRegressionNodeModel } from './node-model';

interface DialogState {
  sampleCount: number;
  predictorCount: number;
  targetR2: number;
  targetBeta: number[];
  targetCohenF2: number;
  targetQ2: number;
  targetType: 'r2' | 'beta' | 'cohenF2' | 'q2';
  customHeaders: string[];
  inputFileHeaders: string[];
  headerSource: 'auto' | 'custom' | 'file';
}

export class ForceRegressionNodeDialog extends NodeDialog {
  private model: ForceRegressionNodeModel;
  private state: DialogState = {
    sampleCount: 100,
    predictorCount: 3,
    targetR2: 0.8,
    targetBeta: [0.6, 0.2, 0.1],
    targetCohenF2: 0.25,
    targetQ2: 0.7,
    targetType: 'r2',
    customHeaders: [],
    inputFileHeaders: [],
    headerSource: 'auto'
  };

  constructor(model: ForceRegressionNodeModel) {
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

    const targetBetaStr = getString('targetBeta', '[0.6,0.2,0.1]');
    let targetBeta: number[];
    try {
      targetBeta = JSON.parse(targetBetaStr);
    } catch {
      targetBeta = [0.6, 0.2, 0.1];
    }

    this.state = {
      sampleCount: getNumber('sampleCount', 100),
      predictorCount: getNumber('predictorCount', 3),
      targetR2: getNumber('targetR2', 0.8),
      targetBeta,
      targetCohenF2: getNumber('targetCohenF2', 0.25),
      targetQ2: getNumber('targetQ2', 0.7),
      targetType: getString('targetType', 'r2') as 'r2' | 'beta' | 'cohenF2' | 'q2',
      customHeaders: JSON.parse(getString('customHeaders', '[]')),
      inputFileHeaders: JSON.parse(getString('inputFileHeaders', '[]')),
      headerSource: this.determineHeaderSource(settings)
    };
    
    // Load settings into the model as well
    this.model.loadSettings(settings);
  }

  private determineHeaderSource(settings: SettingsObject): 'auto' | 'custom' | 'file' {
    const getString = (key: string, defaultValue: string): string => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      return (settings as any)[key] || defaultValue;
    };

    const customHeaders = getString('customHeaders', '[]');
    const inputFileHeaders = getString('inputFileHeaders', '[]');
    
    try {
      const customParsed = JSON.parse(customHeaders);
      const fileParsed = JSON.parse(inputFileHeaders);
      
      if (fileParsed.length > 0) return 'file';
      if (customParsed.length > 0) return 'custom';
      return 'auto';
    } catch {
      return 'auto';
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('sampleCount', this.state.sampleCount);
    settings.set('predictorCount', this.state.predictorCount);
    settings.set('targetR2', this.state.targetR2);
    settings.set('targetBeta', JSON.stringify(this.state.targetBeta));
    settings.set('targetCohenF2', this.state.targetCohenF2);
    settings.set('targetQ2', this.state.targetQ2);
    settings.set('targetType', this.state.targetType);
    settings.set('customHeaders', JSON.stringify(this.state.customHeaders));
    settings.set('inputFileHeaders', JSON.stringify(this.state.inputFileHeaders));
    
    // Update model state
    this.model.setSampleCount(this.state.sampleCount);
    this.model.setPredictorCount(this.state.predictorCount);
    this.model.setTargetR2(this.state.targetR2);
    this.model.setTargetBeta(this.state.targetBeta);
    this.model.setTargetCohenF2(this.state.targetCohenF2);
    this.model.setTargetQ2(this.state.targetQ2);
    this.model.setTargetType(this.state.targetType);
    this.model.setCustomHeaders(this.state.customHeaders);
    this.model.setInputFileHeaders(this.state.inputFileHeaders);
  }

  validateSettings(): void {
    if (this.state.sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }
    
    if (this.state.predictorCount <= 0 || this.state.predictorCount > 10) {
      throw new Error('Predictor count must be between 1 and 10');
    }
    
    if (this.state.targetR2 < 0 || this.state.targetR2 > 1) {
      throw new Error('Target R² must be between 0 and 1');
    }
    
    if (this.state.targetCohenF2 < 0) {
      throw new Error('Target Cohen\'s f² must be non-negative');
    }
    
    if (this.state.targetQ2 < 0 || this.state.targetQ2 > 1) {
      throw new Error('Target Q² must be between 0 and 1');
    }
    
    if (this.state.targetBeta.length === 0) {
      throw new Error('Target beta must contain at least one value');
    }
    
    if (this.state.targetBeta.some(b => typeof b !== 'number' || !isFinite(b))) {
      throw new Error('All target beta values must be finite numbers');
    }
  }

  render(): ReactElement {
    return React.createElement(ForceRegressionConfigDialog, {
      state: this.state,
      onStateChange: (newState: DialogState) => {
        this.state = newState;
      },
      onLoadFile: (content: string) => this.handleFileLoad(content)
    });
  }

  createDialogPanel(): ReactElement {
    return this.render();
  }

  private handleFileLoad(content: string): void {
    try {
      const analysis = this.model.analyzeCSVData(content);
      this.state = {
        ...this.state,
        inputFileHeaders: analysis.headers,
        predictorCount: analysis.predictorCount,
        headerSource: 'file'
      };
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

interface ForceRegressionConfigDialogProps {
  state: DialogState;
  onStateChange: (state: DialogState) => void;
  onLoadFile: (content: string) => void;
}

function ForceRegressionConfigDialog({ state, onStateChange, onLoadFile }: ForceRegressionConfigDialogProps): ReactElement {
  const [fileError, setFileError] = useState<string>('');

  const updateState = (updates: Partial<DialogState>) => {
    onStateChange({ ...state, ...updates });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onLoadFile(content);
        setFileError('');
      } catch (error) {
        setFileError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    reader.readAsText(file);
  };

  const handleTargetBetaChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const newBeta = [...state.targetBeta];
    newBeta[index] = numValue;
    updateState({ targetBeta: newBeta });
  };

  const addBetaValue = () => {
    updateState({ 
      targetBeta: [...state.targetBeta, 0.1],
      predictorCount: state.targetBeta.length + 1
    });
  };

  const removeBetaValue = (index: number) => {
    if (state.targetBeta.length <= 1) return;
    
    const newBeta = state.targetBeta.filter((_, i) => i !== index);
    updateState({ 
      targetBeta: newBeta,
      predictorCount: newBeta.length
    });
  };

  const handleCustomHeaderChange = (index: number, value: string) => {
    const newHeaders = [...state.customHeaders];
    newHeaders[index] = value;
    updateState({ customHeaders: newHeaders });
  };

  const addCustomHeader = () => {
    updateState({ 
      customHeaders: [...state.customHeaders, `Header${state.customHeaders.length + 1}`]
    });
  };

  const removeCustomHeader = (index: number) => {
    const newHeaders = state.customHeaders.filter((_, i) => i !== index);
    updateState({ customHeaders: newHeaders });
  };

  // Update predictor count when it changes
  const handlePredictorCountChange = (value: string) => {
    const count = parseInt(value);
    if (isNaN(count) || count < 1) return;
    
    let newBeta = [...state.targetBeta];
    if (newBeta.length < count) {
      // Add more beta values
      for (let i = newBeta.length; i < count; i++) {
        newBeta.push(Math.max(0.1, 0.8 - (i * 0.2)));
      }
    } else if (newBeta.length > count) {
      // Remove excess beta values
      newBeta = newBeta.slice(0, count);
    }
    
    updateState({ 
      predictorCount: count,
      targetBeta: newBeta
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sampleCount">Sample Count</Label>
              <Input
                id="sampleCount"
                type="number"
                min="1"
                max="10000"
                value={state.sampleCount}
                onChange={(e) => updateState({ sampleCount: parseInt(e.target.value) || 100 })}
              />
            </div>
            <div>
              <Label htmlFor="predictorCount">Number of Predictors</Label>
              <Input
                id="predictorCount"
                type="number"
                min="1"
                max="10"
                value={state.predictorCount}
                onChange={(e) => handlePredictorCountChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Target Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetType">Target Type</Label>
            <Select
              value={state.targetType}
              onValueChange={(value: 'r2' | 'beta' | 'cohenF2' | 'q2') => updateState({ targetType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="r2">R² (Coefficient of Determination)</SelectItem>
                <SelectItem value="beta">Beta Coefficients</SelectItem>
                <SelectItem value="cohenF2">Cohen&apos;s f²</SelectItem>
                <SelectItem value="q2">Q² (Predictive Relevance)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.targetType === 'r2' && (
            <div>
              <Label htmlFor="targetR2">Target R²</Label>
              <Input
                id="targetR2"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={state.targetR2}
                onChange={(e) => updateState({ targetR2: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}

          {state.targetType === 'beta' && (
            <div>
              <Label>Target Beta Coefficients</Label>
              <div className="space-y-2">
                {state.targetBeta.map((beta, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="number"
                      step="0.01"
                      value={beta}
                      onChange={(e) => handleTargetBetaChange(index, e.target.value)}
                      placeholder={`Beta ${index + 1}`}
                    />
                    {state.targetBeta.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBetaValue(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBetaValue}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Add Beta Coefficient
                </Button>
              </div>
            </div>
          )}

          {state.targetType === 'cohenF2' && (
            <div>
              <Label htmlFor="targetCohenF2">Target Cohen&apos;s f²</Label>
              <Input
                id="targetCohenF2"
                type="number"
                min="0"
                step="0.01"
                value={state.targetCohenF2}
                onChange={(e) => updateState({ targetCohenF2: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}

          {state.targetType === 'q2' && (
            <div>
              <Label htmlFor="targetQ2">Target Q²</Label>
              <Input
                id="targetQ2"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={state.targetQ2}
                onChange={(e) => updateState({ targetQ2: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headers Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Column Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headerSource">Header Source</Label>
            <Select
              value={state.headerSource}
              onValueChange={(value: 'auto' | 'custom' | 'file') => updateState({ headerSource: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-generate (X1, X2, ..., Y)</SelectItem>
                <SelectItem value="custom">Custom Headers</SelectItem>
                <SelectItem value="file">From CSV File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.headerSource === 'file' && (
            <div>
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <div className="space-y-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                {fileError && (
                  <p className="text-sm text-red-600">{fileError}</p>
                )}
                {state.inputFileHeaders.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Detected Headers:</p>
                    <p className="text-sm text-gray-600">{state.inputFileHeaders.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {state.headerSource === 'custom' && (
            <div>
              <Label>Custom Headers</Label>
              <div className="space-y-2">
                {state.customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={header}
                      onChange={(e) => handleCustomHeaderChange(index, e.target.value)}
                      placeholder={`Header ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomHeader(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomHeader}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Add Header
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
