'use client';

import React, { useState, useEffect, type ReactElement } from 'react';
import { NodeDialog } from '@/lib/nodes/core';
import type { SettingsObject, DataTableSpec } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, Info, Plus, Trash2 } from 'lucide-react';
import type { HTMTManipulatorNodeModel } from './node-model';

interface GroupStructure {
  name: string;
  variables: string[];
}

interface DialogState {
  sampleCount: number;
  maxHTMT: number;
  targetLoading: number;
  groupSizes: number[];
  customHeaders: string[];
  inputFileHeaders: string[];
  groupStructure: GroupStructure[];
  outputFormat: 'csv' | 'json' | 'both';
  includeCorrelationMatrix: boolean;
  includeRawData: boolean;
  outputFilename: string;
  enableBootstrap: boolean;
  bootstrapSamples: number;
}

export class HTMTManipulatorNodeDialog extends NodeDialog {
  private model: HTMTManipulatorNodeModel;
  private state: DialogState = {
    sampleCount: 200,
    maxHTMT: 0.85,
    targetLoading: 0.7,
    groupSizes: [4, 4, 4],
    customHeaders: [],
    inputFileHeaders: [],
    groupStructure: [
      { name: 'Group1', variables: [] },
      { name: 'Group2', variables: [] },
      { name: 'Group3', variables: [] }
    ],
    outputFormat: 'csv',
    includeCorrelationMatrix: true,
    includeRawData: true,
    outputFilename: '',
    enableBootstrap: false,
    bootstrapSamples: 1000
  };

  constructor(model: HTMTManipulatorNodeModel) {
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
    this.state.sampleCount = getNumber('sampleCount', 200);
    this.state.maxHTMT = getNumber('maxHTMT', 0.85);
    this.state.targetLoading = getNumber('targetLoading', 0.7);
    this.state.enableBootstrap = settings.getBoolean?.('enableBootstrap', false) ?? false;
    this.state.bootstrapSamples = getNumber('bootstrapSamples', 1000);
    this.state.outputFormat = getString('outputFormat', 'csv') as 'csv' | 'json' | 'both';
    this.state.outputFilename = getString('outputFilename', '');
    this.state.includeCorrelationMatrix = settings.getBoolean?.('includeCorrelationMatrix', true) ?? true;
    this.state.includeRawData = settings.getBoolean?.('includeRawData', true) ?? true;

    // Load group sizes
    const groupSizesStr = getString('groupSizes', '[4,4,4]');
    try {
      this.state.groupSizes = JSON.parse(groupSizesStr);
    } catch {
      this.state.groupSizes = [4, 4, 4];
    }

    // Load group structure
    const groupStructureStr = getString('groupStructure', '[]');
    try {
      const parsed = JSON.parse(groupStructureStr);
      this.state.groupStructure = parsed.length > 0 ? parsed : [
        { name: 'Group1', variables: [] },
        { name: 'Group2', variables: [] },
        { name: 'Group3', variables: [] }
      ];
    } catch {
      this.state.groupStructure = [
        { name: 'Group1', variables: [] },
        { name: 'Group2', variables: [] },
        { name: 'Group3', variables: [] }
      ];
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('sampleCount', this.state.sampleCount);
    settings.set('maxHTMT', this.state.maxHTMT);
    settings.set('targetLoading', this.state.targetLoading);
    settings.set('enableBootstrap', this.state.enableBootstrap);
    settings.set('bootstrapSamples', this.state.bootstrapSamples);
    settings.set('outputFormat', this.state.outputFormat);
    settings.set('outputFilename', this.state.outputFilename);
    settings.set('includeCorrelationMatrix', this.state.includeCorrelationMatrix);
    settings.set('includeRawData', this.state.includeRawData);
    settings.set('groupSizes', JSON.stringify(this.state.groupSizes));
    settings.set('groupStructure', JSON.stringify(this.state.groupStructure));
  }

  createDialogPanel(): ReactElement {
    return <HTMTManipulatorDialogPanel dialog={this} />;
  }

  // Public methods for the dialog panel
  getState(): DialogState {
    return { ...this.state };
  }

  updateState(updates: Partial<DialogState>): void {
    this.state = { ...this.state, ...updates };
  }
}

interface HTMTManipulatorDialogPanelProps {
  dialog: HTMTManipulatorNodeDialog;
}

function HTMTManipulatorDialogPanel({ dialog }: HTMTManipulatorDialogPanelProps) {
  const [state, setState] = useState<DialogState>(dialog.getState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update dialog state when local state changes
  useEffect(() => {
    dialog.updateState(state);
  }, [state, dialog]);

  // Validation function
  const validateSettings = (currentState: DialogState): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (currentState.sampleCount <= 0) {
      newErrors.sampleCount = 'Sample count must be positive';
    }
    if (currentState.sampleCount > 10000) {
      newErrors.sampleCount = 'Sample count should not exceed 10,000';
    }

    if (currentState.maxHTMT <= 0 || currentState.maxHTMT >= 1) {
      newErrors.maxHTMT = 'HTMT threshold must be between 0 and 1';
    }

    if (currentState.targetLoading <= 0 || currentState.targetLoading >= 1) {
      newErrors.targetLoading = 'Target loading must be between 0 and 1';
    }

    // Validate group structure
    if (currentState.groupStructure.length < 2) {
      newErrors.groupStructure = 'At least 2 groups are required for HTMT analysis';
    }

    currentState.groupStructure.forEach((group, index) => {
      if (!group.name.trim()) {
        newErrors[`group_${index}_name`] = 'Group name cannot be empty';
      }
      if (group.variables.length < 2) {
        newErrors[`group_${index}_variables`] = 'Each group must have at least 2 variables';
      }
    });

    return newErrors;
  };

  useEffect(() => {
    setErrors(validateSettings(state));
  }, [state]);

  const handleStateChange = (key: keyof DialogState, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const addGroup = () => {
    const newGroup = { name: `Group${state.groupStructure.length + 1}`, variables: [] };
    const newGroupStructure = [...state.groupStructure, newGroup];
    handleStateChange('groupStructure', newGroupStructure);
  };

  const removeGroup = (index: number) => {
    if (state.groupStructure.length > 2) {
      const newGroupStructure = state.groupStructure.filter((_, i) => i !== index);
      handleStateChange('groupStructure', newGroupStructure);
    }
  };

  const updateGroup = (index: number, field: 'name' | 'variables', value: string | string[]) => {
    const newGroupStructure = [...state.groupStructure];
    if (field === 'name') {
      newGroupStructure[index].name = value as string;
    } else {
      newGroupStructure[index].variables = value as string[];
    }
    handleStateChange('groupStructure', newGroupStructure);
  };

  const handleVariablesChange = (index: number, value: string) => {
    const variables = value.split(',').map(v => v.trim()).filter(v => v);
    updateGroup(index, 'variables', variables);
  };

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HTMT Manipulator Configuration</h2>
          <p className="text-muted-foreground">
            Configure Heterotrait-Monotrait (HTMT) ratio manipulation for discriminant validity analysis
          </p>
        </div>
        <Badge variant="secondary">Multi-Group Factor Analysis</Badge>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="groups">Group Structure</TabsTrigger>
          <TabsTrigger value="htmt">HTMT Configuration</TabsTrigger>
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
                Configure the fundamental parameters for HTMT manipulation
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
                    value={state.sampleCount}
                    onChange={(e) => handleStateChange('sampleCount', parseInt(e.target.value) || 200)}
                  />
                  {errors.sampleCount && (
                    <p className="text-sm text-destructive">{errors.sampleCount}</p>
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

              <div className="space-y-2">
                <Label htmlFor="max-htmt">Maximum HTMT Threshold</Label>
                <Input
                  id="max-htmt"
                  type="number"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  value={state.maxHTMT}
                  onChange={(e) => handleStateChange('maxHTMT', parseFloat(e.target.value) || 0.85)}
                />
                {errors.maxHTMT && (
                  <p className="text-sm text-destructive">{errors.maxHTMT}</p>
                )}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="size-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    HTMT values below 0.85 (conservative) or 0.90 (liberal) indicate discriminant validity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Group Structure Definition</span>
                <Button onClick={addGroup} size="sm" variant="outline">
                  <Plus className="size-4 mr-2" />
                  Add Group
                </Button>
              </CardTitle>
              <CardDescription>
                Define the factor groups for HTMT analysis. Each group should represent a distinct construct.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.groupStructure.map((group, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`group-name-${index}`}>Group {index + 1} Name</Label>
                      <Input
                        id={`group-name-${index}`}
                        value={group.name}
                        onChange={(e) => updateGroup(index, 'name', e.target.value)}
                        placeholder="Enter group name"
                      />
                      {errors[`group_${index}_name`] && (
                        <p className="text-sm text-destructive">{errors[`group_${index}_name`]}</p>
                      )}
                    </div>
                    {state.groupStructure.length > 2 && (
                      <Button
                        onClick={() => removeGroup(index)}
                        size="sm"
                        variant="outline"
                        className="ml-3"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`group-variables-${index}`}>Variables (comma-separated)</Label>
                    <Textarea
                      id={`group-variables-${index}`}
                      value={group.variables.join(', ')}
                      onChange={(e) => handleVariablesChange(index, e.target.value)}
                      placeholder="var1, var2, var3, ..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {group.variables.length} variables defined
                    </p>
                    {errors[`group_${index}_variables`] && (
                      <p className="text-sm text-destructive">{errors[`group_${index}_variables`]}</p>
                    )}
                  </div>
                </div>
              ))}
              {errors.groupStructure && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="size-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{errors.groupStructure}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="htmt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HTMT Analysis Options</CardTitle>
              <CardDescription>
                Configure advanced HTMT analysis and bootstrap options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label>Enable Bootstrap Confidence Intervals</Label>
                  <p className="text-sm text-muted-foreground">
                    Calculate bias-corrected bootstrap confidence intervals for HTMT
                  </p>
                </div>
                <Switch
                  checked={state.enableBootstrap}
                  onCheckedChange={(checked) => handleStateChange('enableBootstrap', checked)}
                />
              </div>

              {state.enableBootstrap && (
                <div className="space-y-2">
                  <Label htmlFor="bootstrap-samples">Bootstrap Samples</Label>
                  <Input
                    id="bootstrap-samples"
                    type="number"
                    min="100"
                    max="10000"
                    value={state.bootstrapSamples}
                    onChange={(e) => handleStateChange('bootstrapSamples', parseInt(e.target.value) || 1000)}
                  />
                  <p className="text-xs text-muted-foreground">
                    More samples provide better estimates but take longer to compute
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Output Configuration</CardTitle>
              <CardDescription>
                Configure output format and content options
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

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Include Correlation Matrix</Label>
                    <p className="text-sm text-muted-foreground">
                      Export the manipulated correlation matrix
                    </p>
                  </div>
                  <Switch
                    checked={state.includeCorrelationMatrix}
                    onCheckedChange={(checked) => handleStateChange('includeCorrelationMatrix', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Include Raw Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Export the generated/manipulated raw data
                    </p>
                  </div>
                  <Switch
                    checked={state.includeRawData}
                    onCheckedChange={(checked) => handleStateChange('includeRawData', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-filename">Output Filename (Optional)</Label>
                <Input
                  id="output-filename"
                  value={state.outputFilename}
                  onChange={(e) => handleStateChange('outputFilename', e.target.value)}
                  placeholder="htmt_analysis_results"
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
