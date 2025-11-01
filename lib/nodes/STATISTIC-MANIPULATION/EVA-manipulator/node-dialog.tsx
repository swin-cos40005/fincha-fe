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
import type { EVAManipulatorNodeModel } from './node-model';

interface DialogState {
  sampleCount: number;
  numFactors: number;
  indicatorsPerFactor: number;
  targetAVE: number;
  targetReliability: number;
  generationMethod: 'ave' | 'reliability' | 'both';
  customHeaders: string[];
  inputFileHeaders: string[];
  headerSource: 'auto' | 'custom' | 'file';
}

export class EVAManipulatorNodeDialog extends NodeDialog {
  private model: EVAManipulatorNodeModel;
  private state: DialogState = {
    sampleCount: 200,
    numFactors: 3,
    indicatorsPerFactor: 4,
    targetAVE: 0.5,
    targetReliability: 0.7,
    generationMethod: 'ave',
    customHeaders: [],
    inputFileHeaders: [],
    headerSource: 'auto'
  };

  constructor(model: EVAManipulatorNodeModel) {
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

    this.state = {
      sampleCount: getNumber('sampleCount', 200),
      numFactors: getNumber('numFactors', 3),
      indicatorsPerFactor: getNumber('indicatorsPerFactor', 4),
      targetAVE: getNumber('targetAVE', 0.5),
      targetReliability: getNumber('targetReliability', 0.7),
      generationMethod: getString('generationMethod', 'ave') as 'ave' | 'reliability' | 'both',
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
    settings.set('numFactors', this.state.numFactors);
    settings.set('indicatorsPerFactor', this.state.indicatorsPerFactor);
    settings.set('targetAVE', this.state.targetAVE);
    settings.set('targetReliability', this.state.targetReliability);
    settings.set('generationMethod', this.state.generationMethod);
    settings.set('customHeaders', JSON.stringify(this.state.customHeaders));
    settings.set('inputFileHeaders', JSON.stringify(this.state.inputFileHeaders));
    
    // Update model state
    this.model.setSampleCount(this.state.sampleCount);
    this.model.setNumFactors(this.state.numFactors);
    this.model.setIndicatorsPerFactor(this.state.indicatorsPerFactor);
    this.model.setTargetAVE(this.state.targetAVE);
    this.model.setTargetReliability(this.state.targetReliability);
    this.model.setGenerationMethod(this.state.generationMethod);
    this.model.setCustomHeaders(this.state.customHeaders);
    this.model.setInputFileHeaders(this.state.inputFileHeaders);
  }

  validateSettings(): void {
    if (this.state.sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }
    
    if (this.state.numFactors <= 0 || this.state.numFactors > 10) {
      throw new Error('Number of factors must be between 1 and 10');
    }
    
    if (this.state.indicatorsPerFactor < 2 || this.state.indicatorsPerFactor > 20) {
      throw new Error('Indicators per factor must be between 2 and 20');
    }
    
    if (this.state.targetAVE < 0 || this.state.targetAVE > 1) {
      throw new Error('Target AVE must be between 0 and 1');
    }
    
    if (this.state.targetReliability < 0 || this.state.targetReliability > 1) {
      throw new Error('Target reliability must be between 0 and 1');
    }
  }

  createDialogPanel(): ReactElement {
    return React.createElement(EVAManipulatorConfigDialog, {
      state: this.state,
      onStateChange: (newState: DialogState) => {
        this.state = newState;
      },
      onLoadFile: (content: string) => this.handleFileLoad(content)
    });
  }

  private handleFileLoad(content: string): void {
    try {
      const analysis = this.model.analyzeCSVData(content);
      this.state = {
        ...this.state,
        inputFileHeaders: analysis.headers,
        numFactors: analysis.factors,
        indicatorsPerFactor: analysis.indicatorsPerFactor,
        headerSource: 'file'
      };
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

interface EVAManipulatorConfigDialogProps {
  state: DialogState;
  onStateChange: (state: DialogState) => void;
  onLoadFile: (content: string) => void;
}

function EVAManipulatorConfigDialog({ state, onStateChange, onLoadFile }: EVAManipulatorConfigDialogProps): ReactElement {
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

  const handleCustomHeaderChange = (index: number, value: string) => {
    const newHeaders = [...state.customHeaders];
    newHeaders[index] = value;
    updateState({ customHeaders: newHeaders });
  };

  const addCustomHeader = () => {
    updateState({ 
      customHeaders: [...state.customHeaders, `F${Math.ceil((state.customHeaders.length + 1) / state.indicatorsPerFactor)}_I${((state.customHeaders.length) % state.indicatorsPerFactor) + 1}`]
    });
  };

  const removeCustomHeader = (index: number) => {
    const newHeaders = state.customHeaders.filter((_, i) => i !== index);
    updateState({ customHeaders: newHeaders });
  };

  const totalIndicators = state.numFactors * state.indicatorsPerFactor;

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Factor Structure Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sampleCount">Sample Count</Label>
              <Input
                id="sampleCount"
                type="number"
                min="10"
                max="10000"
                value={state.sampleCount}
                onChange={(e) => updateState({ sampleCount: parseInt(e.target.value) || 200 })}
              />
            </div>
            <div>
              <Label htmlFor="numFactors">Number of Factors</Label>
              <Input
                id="numFactors"
                type="number"
                min="1"
                max="10"
                value={state.numFactors}
                onChange={(e) => updateState({ numFactors: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="indicatorsPerFactor">Indicators per Factor</Label>
              <Input
                id="indicatorsPerFactor"
                type="number"
                min="2"
                max="20"
                value={state.indicatorsPerFactor}
                onChange={(e) => updateState({ indicatorsPerFactor: parseInt(e.target.value) || 4 })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <span className="text-sm text-gray-600">
                Total Indicators: <strong>{totalIndicators}</strong>
              </span>
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
            <Label htmlFor="generationMethod">Generation Method</Label>
            <Select
              value={state.generationMethod}
              onValueChange={(value: 'ave' | 'reliability' | 'both') => updateState({ generationMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ave">Target AVE (Average Variance Extracted)</SelectItem>
                <SelectItem value="reliability">Target Composite Reliability</SelectItem>
                <SelectItem value="both">Both AVE and Reliability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(state.generationMethod === 'ave' || state.generationMethod === 'both') && (
            <div>
              <Label htmlFor="targetAVE">Target AVE</Label>
              <Input
                id="targetAVE"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={state.targetAVE}
                onChange={(e) => updateState({ targetAVE: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                AVE ≥ 0.5 indicates acceptable convergent validity
              </p>
            </div>
          )}

          {(state.generationMethod === 'reliability' || state.generationMethod === 'both') && (
            <div>
              <Label htmlFor="targetReliability">Target Composite Reliability</Label>
              <Input
                id="targetReliability"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={state.targetReliability}
                onChange={(e) => updateState({ targetReliability: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Reliability ≥ 0.7 indicates acceptable internal consistency
              </p>
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
                <SelectItem value="auto">Auto-generate (F1_I1, F1_I2, ...)</SelectItem>
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
                    <p className="text-sm font-medium">Detected Structure:</p>
                    <p className="text-sm text-gray-600">
                      {state.inputFileHeaders.length} indicators → {state.numFactors} factors × {state.indicatorsPerFactor} indicators
                    </p>
                    <p className="text-sm text-gray-600">
                      Headers: {state.inputFileHeaders.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {state.headerSource === 'custom' && (
            <div>
              <Label>Custom Headers ({state.customHeaders.length}/{totalIndicators} defined)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={header}
                      onChange={(e) => handleCustomHeaderChange(index, e.target.value)}
                      placeholder={`F${Math.ceil((index + 1) / state.indicatorsPerFactor)}_I${(index % state.indicatorsPerFactor) + 1}`}
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
                
                {state.customHeaders.length < totalIndicators && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomHeader}
                    className="w-full"
                  >
                    <Plus className="size-4 mr-2" />
                    Add Header ({state.customHeaders.length + 1}/{totalIndicators})
                  </Button>
                )}
              </div>
            </div>
          )}

          {state.headerSource === 'auto' && (
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium">Auto-generated Headers Preview:</p>
              <p className="text-sm text-gray-600">
                {Array.from({ length: Math.min(6, totalIndicators) }, (_, i) => {
                  const factor = Math.ceil((i + 1) / state.indicatorsPerFactor);
                  const indicator = (i % state.indicatorsPerFactor) + 1;
                  return `F${factor}_I${indicator}`;
                }).join(', ')}{totalIndicators > 6 ? ', ...' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Factor Structure Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Structure Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Factor Structure:</span>
              <p className="text-gray-600">{state.numFactors} factors × {state.indicatorsPerFactor} indicators</p>
            </div>
            <div>
              <span className="font-medium">Sample Size:</span>
              <p className="text-gray-600">{state.sampleCount} observations</p>
            </div>
            <div>
              <span className="font-medium">Generation Target:</span>
              <p className="text-gray-600">
                {state.generationMethod === 'ave' && `AVE ≥ ${state.targetAVE}`}
                {state.generationMethod === 'reliability' && `CR ≥ ${state.targetReliability}`}
                {state.generationMethod === 'both' && `AVE ≥ ${state.targetAVE} & CR ≥ ${state.targetReliability}`}
              </p>
            </div>
            <div>
              <span className="font-medium">Expected Output:</span>
              <p className="text-gray-600">{totalIndicators} indicator variables</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
