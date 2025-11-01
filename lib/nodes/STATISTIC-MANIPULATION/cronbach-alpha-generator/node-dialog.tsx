'use client';

import React, { useState, useEffect, type ReactElement } from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { CronbachAlphaNodeModel } from './node-model';

interface OptionMapEntry {
  numOptions: number;
  count: number;
}

interface DialogState {
  sampleCount: number;
  targetAlpha: number;
  optionMap: OptionMapEntry[];
  customHeaders: string[];
  inputFileHeaders: string[];
  headerSource: 'auto' | 'custom' | 'file';
}

export class CronbachAlphaNodeDialog extends NodeDialog {
  private model: CronbachAlphaNodeModel;
  private state: DialogState = {
    sampleCount: 100,
    targetAlpha: 0.8,
    optionMap: [
      { numOptions: 2, count: 1 },
      { numOptions: 3, count: 15 },
      { numOptions: 5, count: 4 }
    ],
    customHeaders: [],
    inputFileHeaders: [],
    headerSource: 'auto'
  };

  constructor(model: CronbachAlphaNodeModel) {
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
      sampleCount: getNumber('sampleCount', 100),
      targetAlpha: getNumber('targetAlpha', 0.8),
      optionMap: this.parseOptionMap(getString('optionMap', '{"2":1,"3":15,"5":4}')),
      customHeaders: JSON.parse(getString('customHeaders', '[]')),
      inputFileHeaders: JSON.parse(getString('inputFileHeaders', '[]')),
      headerSource: this.determineHeaderSource(settings)
    };
    
    // Load settings into the model as well
    this.model.loadSettings(settings);
  }

  private parseOptionMap(optionMapStr: string): OptionMapEntry[] {
    try {
      const parsed = JSON.parse(optionMapStr);
      return Object.entries(parsed).map(([numOptions, count]) => ({
        numOptions: parseInt(numOptions),
        count: count as number
      }));
    } catch {
      return [
        { numOptions: 2, count: 1 },
        { numOptions: 3, count: 15 },
        { numOptions: 5, count: 4 }
      ];
    }
  }

  private determineHeaderSource(settings: SettingsObject): 'auto' | 'custom' | 'file' {
    const getString = (key: string, defaultValue: string): string => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      return (settings as any)[key] || defaultValue;
    };

    const customHeaders = JSON.parse(getString('customHeaders', '[]'));
    const inputFileHeaders = JSON.parse(getString('inputFileHeaders', '[]'));
    
    if (customHeaders.length > 0) return 'custom';
    if (inputFileHeaders.length > 0) return 'file';
    return 'auto';
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('sampleCount', this.state.sampleCount);
    settings.set('targetAlpha', this.state.targetAlpha);
    
    const optionMapObject: { [key: string]: number } = {};
    this.state.optionMap.forEach(entry => {
      optionMapObject[entry.numOptions.toString()] = entry.count;
    });
    settings.set('optionMap', JSON.stringify(optionMapObject));
    
    settings.set('customHeaders', JSON.stringify(this.state.customHeaders));
    settings.set('inputFileHeaders', JSON.stringify(this.state.inputFileHeaders));
    
    // Also save settings to the model
    this.model.saveSettings(settings);
  }

  createDialogPanel(
    settings: SettingsObject,
    specs: DataTableSpec[]
  ): ReactElement {
    this.loadSettings(settings, specs);

    return (
      <CronbachAlphaDialogComponent
        state={this.state}
        onSampleCountChange={(sampleCount) => {
          this.state.sampleCount = sampleCount;
          this.model.setSampleCount(sampleCount);
          this.saveSettings(settings);
        }}
        onTargetAlphaChange={(targetAlpha) => {
          this.state.targetAlpha = targetAlpha;
          this.model.setTargetAlpha(targetAlpha);
          this.saveSettings(settings);
        }}
        onOptionMapChange={(optionMap) => {
          this.state.optionMap = optionMap;
          const optionMapObject: { [key: string]: number } = {};
          optionMap.forEach(entry => {
            optionMapObject[entry.numOptions.toString()] = entry.count;
          });
          
          // Update model FIRST, then save settings
          this.model.setOptionMap(optionMapObject);
          this.saveSettings(settings);
        }}
        onCustomHeadersChange={(headers) => {
          this.state.customHeaders = headers;
          this.model.setCustomHeaders(headers);
          this.saveSettings(settings);
        }}
        onInputFileHeadersChange={(headers) => {
          this.state.inputFileHeaders = headers;
          this.model.setInputFileHeaders(headers);
          this.saveSettings(settings);
        }}
        onHeaderSourceChange={(source) => {
          this.state.headerSource = source;
          this.saveSettings(settings);
        }}
        onAnalyzeCSV={(csvContent) => {
          return this.model.analyzeCSVData(csvContent);
        }}
      />
    );
  }
}

interface CronbachAlphaDialogComponentProps {
  state: DialogState;
  onSampleCountChange: (sampleCount: number) => void;
  onTargetAlphaChange: (targetAlpha: number) => void;
  onOptionMapChange: (optionMap: OptionMapEntry[]) => void;
  onCustomHeadersChange: (headers: string[]) => void;
  onInputFileHeadersChange: (headers: string[]) => void;
  onHeaderSourceChange: (source: 'auto' | 'custom' | 'file') => void;
  onAnalyzeCSV?: (csvContent: string) => { headers: string[], optionMap: { [numOptions: number]: number } };
}

function CronbachAlphaDialogComponent({ 
  state, 
  onSampleCountChange,
  onTargetAlphaChange,
  onOptionMapChange,
  onCustomHeadersChange,
  onInputFileHeadersChange,
  onHeaderSourceChange,
  onAnalyzeCSV
}: CronbachAlphaDialogComponentProps) {
  const [localState, setLocalState] = useState<DialogState>(state);
  const [csvAnalysisResult, setCsvAnalysisResult] = useState<string | null>(null);

  // Sync callbacks when local state changes
  useEffect(() => {
    onSampleCountChange(localState.sampleCount);
  }, [localState.sampleCount, onSampleCountChange]);

  useEffect(() => {
    onTargetAlphaChange(localState.targetAlpha);
  }, [localState.targetAlpha, onTargetAlphaChange]);

  useEffect(() => {
    onOptionMapChange(localState.optionMap);
  }, [localState.optionMap, onOptionMapChange]);

  useEffect(() => {
    onCustomHeadersChange(localState.customHeaders);
  }, [localState.customHeaders, onCustomHeadersChange]);

  useEffect(() => {
    onInputFileHeadersChange(localState.inputFileHeaders);
  }, [localState.inputFileHeaders, onInputFileHeadersChange]);

  useEffect(() => {
    onHeaderSourceChange(localState.headerSource);
  }, [localState.headerSource, onHeaderSourceChange]);

  // Clear CSV analysis result when option map changes manually
  useEffect(() => {
    if (csvAnalysisResult) {
      setCsvAnalysisResult(null);
    }
  }, [localState.optionMap.length]);

  // Auto-adjust headers when option map changes (if using auto headers)
  useEffect(() => {
    const totalQuestions = localState.optionMap.reduce((sum, entry) => sum + entry.count, 0);
    
    // Only auto-adjust if we're using auto-generated headers
    if (localState.headerSource === 'auto') {
      // Clear any custom headers that might have been set previously
      if (localState.customHeaders.length > 0) {
        setLocalState(prev => ({
          ...prev,
          customHeaders: []
        }));
      }
    }
    
    // If custom headers exist but don't match the expected count, 
    // auto-adjust them by padding/trimming
    if (localState.headerSource === 'custom' && 
        localState.customHeaders.length > 0 && 
        localState.customHeaders.length !== totalQuestions) {
      // Auto-adjust by padding/trimming
      const adjustedHeaders = [...localState.customHeaders];
      
      if (adjustedHeaders.length < totalQuestions) {
        // Add missing headers
        for (let i = adjustedHeaders.length; i < totalQuestions; i++) {
          adjustedHeaders.push(`Q${i + 1}`);
        }
      } else if (adjustedHeaders.length > totalQuestions) {
        // Remove excess headers
        adjustedHeaders.splice(totalQuestions);
      }
      
      setLocalState(prev => ({
        ...prev,
        customHeaders: adjustedHeaders
      }));
    }
    
    // If file headers don't match and we don't have a recent CSV analysis,
    // automatically switch to auto headers
    if (localState.headerSource === 'file' && 
        localState.inputFileHeaders.length > 0 && 
        localState.inputFileHeaders.length !== totalQuestions &&
        !csvAnalysisResult) {
      setLocalState(prev => ({
        ...prev,
        headerSource: 'auto',
        inputFileHeaders: [] // Clear file headers since they don't match
      }));
    }
  }, [localState.optionMap, csvAnalysisResult]);

  const updateOptionMapEntry = (index: number, field: 'numOptions' | 'count', value: number) => {
    const newOptionMap = [...localState.optionMap];
    newOptionMap[index] = { ...newOptionMap[index], [field]: value };
    setLocalState({ ...localState, optionMap: newOptionMap });
  };

  const addOptionMapEntry = () => {
    setLocalState({
      ...localState,
      optionMap: [...localState.optionMap, { numOptions: 2, count: 1 }]
    });
  };

  const removeOptionMapEntry = (index: number) => {
    const newOptionMap = localState.optionMap.filter((_, i) => i !== index);
    setLocalState({ ...localState, optionMap: newOptionMap });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, analyzeData: boolean = false) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        
        if (analyzeData) {
          // Full CSV analysis - extract headers AND analyze response scales
          try {
            if (onAnalyzeCSV) {
              const analysis = onAnalyzeCSV(csv);
              const newOptionMap = Object.entries(analysis.optionMap).map(([numOptions, count]) => ({
                numOptions: parseInt(numOptions),
                count: count as number
              }));
              
              // Calculate the new total questions
              const newTotalQuestions = Object.values(analysis.optionMap).reduce((sum, count) => sum + count, 0);
              
              // If the analysis produces headers that match the total questions exactly,
              // use them as file headers. Otherwise, switch to auto-generated headers.
              const useFileHeaders = analysis.headers.length === newTotalQuestions;
              
              setLocalState({
                ...localState,
                inputFileHeaders: useFileHeaders ? analysis.headers : [],
                headerSource: useFileHeaders ? 'file' : 'auto',
                optionMap: newOptionMap,
                customHeaders: [] // Clear custom headers when analyzing CSV
              });

              // Set success message
              const scales = Object.entries(analysis.optionMap).map(([scale, count]) => `${count} × ${scale}-point`).join(', ');
              const headerMessage = useFileHeaders 
                ? `Using ${analysis.headers.length} headers from file.`
                : `Generated ${newTotalQuestions} auto headers (file had ${analysis.headers.length} headers).`;
              setCsvAnalysisResult(`✅ Successfully analyzed! Found ${newTotalQuestions} questions with scales: ${scales}. ${headerMessage}`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setCsvAnalysisResult(`❌ Error: ${errorMessage}`);
          }
        } else {
          // Headers only - just extract the first row
          const lines = csv.split('\n');
          if (lines.length > 0) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            setLocalState({
              ...localState,
              inputFileHeaders: headers,
              headerSource: 'file'
            });
          }
        }
      };
      reader.readAsText(file);
    }
    // Clear the file input to allow re-uploading the same file
    event.target.value = '';
  };

  const handleAnalyzeCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event, true);
  };

  const updateCustomHeader = (index: number, value: string) => {
    const newHeaders = [...localState.customHeaders];
    newHeaders[index] = value;
    setLocalState({ ...localState, customHeaders: newHeaders });
  };

  const addCustomHeader = () => {
    setLocalState({
      ...localState,
      customHeaders: [...localState.customHeaders, '']
    });
  };

  const removeCustomHeader = (index: number) => {
    const newHeaders = localState.customHeaders.filter((_, i) => i !== index);
    setLocalState({ ...localState, customHeaders: newHeaders });
  };

  const getTotalQuestions = () => {
    return localState.optionMap.reduce((sum, entry) => sum + entry.count, 0);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Data Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sampleCount">Sample Count</Label>
              <Input
                id="sampleCount"
                type="number"
                min="1"
                value={localState.sampleCount}
                onChange={(e) => setLocalState({
                  ...localState,
                  sampleCount: parseInt(e.target.value) || 100
                })}
              />
            </div>
            <div>
              <Label htmlFor="targetAlpha">Target Alpha</Label>
              <Input
                id="targetAlpha"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={localState.targetAlpha}
                onChange={(e) => setLocalState({
                  ...localState,
                  targetAlpha: parseFloat(e.target.value) || 0.8
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Question Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total questions: {getTotalQuestions()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {localState.optionMap.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <Label className="text-xs">Options per question</Label>
                <Input
                  type="number"
                  min="2"
                  value={entry.numOptions}
                  onChange={(e) => updateOptionMapEntry(
                    index,
                    'numOptions',
                    parseInt(e.target.value) || 2
                  )}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Number of questions</Label>
                <Input
                  type="number"
                  min="1"
                  value={entry.count}
                  onChange={(e) => updateOptionMapEntry(
                    index,
                    'count',
                    parseInt(e.target.value) || 1
                  )}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeOptionMapEntry(index)}
                disabled={localState.optionMap.length === 1}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addOptionMapEntry}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Add Question Type
          </Button>
        </CardContent>
      </Card>

      {/* Header Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Column Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="headerAuto"
                name="headerSource"
                checked={localState.headerSource === 'auto'}
                onChange={() => setLocalState({ ...localState, headerSource: 'auto' })}
              />
              <Label htmlFor="headerAuto">Auto-generate headers (Q1_2opt, Q2_3opt, etc.)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="headerFile"
                name="headerSource"
                checked={localState.headerSource === 'file'}
                onChange={() => setLocalState({ ...localState, headerSource: 'file' })}
              />
              <Label htmlFor="headerFile">Use headers from CSV file</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="headerCustom"
                name="headerSource"
                checked={localState.headerSource === 'custom'}
                onChange={() => setLocalState({ ...localState, headerSource: 'custom' })}
              />
              <Label htmlFor="headerCustom">Custom headers</Label>
            </div>
          </div>

          {localState.headerSource === 'file' && (
            <div>
                <Label htmlFor="csvAnalyze">Analyze CSV File</Label>
                <input
                id="csvAnalyze"
                type="file"
                accept=".csv,text/csv"
                onChange={handleAnalyzeCSV}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                <strong>Full Analysis:</strong> Extracts headers AND automatically detects response scales (2-point, 3-point, 5-point, etc.) by analyzing the actual data values in each column.
                </p>
                {csvAnalysisResult && (
                <div className={`mt-2 p-2 rounded text-sm ${
                    csvAnalysisResult.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {csvAnalysisResult}
                </div>
                )}
                {localState.inputFileHeaders.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Loaded {localState.inputFileHeaders.length} headers from file.
                      Expected: {getTotalQuestions()}
                    </p>
                    {localState.inputFileHeaders.length !== getTotalQuestions() && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm mt-1">
                        <span className="text-yellow-800">
                          ⚠️ Header count mismatch: File has {localState.inputFileHeaders.length} headers but you configured {getTotalQuestions()} questions. 
                          The system will auto-switch to generated headers when you change the question configuration.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {localState.inputFileHeaders.length === 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      No file uploaded. Upload a CSV file to extract headers, or switch to auto-generated headers for {getTotalQuestions()} questions.
                    </p>
                  </div>
                )}
            </div>
          )}

          {localState.headerSource === 'custom' && (
            <div className="space-y-2">
              {localState.customHeaders.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Header ${index + 1}`}
                    value={header}
                    onChange={(e) => updateCustomHeader(index, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCustomHeader(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCustomHeader}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Header
              </Button>
              <p className="text-sm text-muted-foreground">
                You need {getTotalQuestions()} headers for all questions.
                Current: {localState.customHeaders.length}
              </p>
              {localState.customHeaders.length !== getTotalQuestions() && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <span className="text-yellow-800">
                    ⚠️ Header count mismatch: You have {localState.customHeaders.length} headers but need {getTotalQuestions()} to match your question configuration.
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
