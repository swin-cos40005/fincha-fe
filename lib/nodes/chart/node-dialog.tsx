'use client';

import React, {
  useState,
  useEffect,
  createElement,
  type ReactElement,
} from 'react';
import type { DataTableSpec, SettingsObject } from '@/lib/types';
import { NodeDialog } from '../base-node/node-dialog';
import type { ChartType } from '@/lib/chart/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { BarChart3, Database, X } from 'lucide-react';

import {
  getAvailableChartTypes,
  getColumnMappingConfig as getChartColumnMappingConfig,
  isDataMappingProvided,
} from '@/lib/chart/utils';

interface ChartDialogState {
  chartType: ChartType;
  title: string;
  description: string;
  dataMapping: Record<string, string | string[]>; // Dynamic column mapping based on chart type
}

interface ChartNodeDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialChartType: ChartType;
  initialTitle: string;
  initialDescription: string;
  initialDataMapping: Record<string, string | string[]>;
  onChartTypeChange: (chartType: ChartType) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onDataMappingChange: (dataMapping: Record<string, string | string[]>) => void;
}

function ChartNodeDialogPanel(props: ChartNodeDialogPanelProps) {
  const [state, setState] = useState<ChartDialogState>(() => ({
    chartType: props.initialChartType,
    title: props.initialTitle,
    description: props.initialDescription,
    dataMapping: props.initialDataMapping,
  }));

  const availableColumns =
    props.specs.length > 0 ? props.specs[0].columns.map((col) => col.name) : [];

  // Sync local state when the incoming props (from settings) actually change.
  useEffect(() => {
    setState((prev) => {
      const sameChartType = prev.chartType === props.initialChartType;
      const sameTitle = prev.title === props.initialTitle;
      const sameDescription = prev.description === props.initialDescription;
      const sameMapping =
        JSON.stringify(prev.dataMapping) ===
        JSON.stringify(props.initialDataMapping);

      if (sameChartType && sameTitle && sameDescription && sameMapping) {
        return prev;
      }

      const newState = {
        chartType: props.initialChartType,
        title: props.initialTitle,
        description: props.initialDescription,
        dataMapping: props.initialDataMapping || {},
      } as ChartDialogState;
      
      return newState;
    });
    // We intentionally depend only on the props, not on state, to avoid resetting
    // immediately after a user-driven state change.
  }, [
    props.initialChartType,
    props.initialTitle,
    props.initialDescription,
    JSON.stringify(props.initialDataMapping), // Deep comparison trigger
  ]);

  // Update callbacks when state changes
  useEffect(() => {
    props.onChartTypeChange(state.chartType);
  }, [state.chartType, props]);

  useEffect(() => {
    props.onTitleChange(state.title);
  }, [state.title, props]);

  useEffect(() => {
    props.onDescriptionChange(state.description);
  }, [state.description, props]);

  useEffect(() => {
    props.onDataMappingChange(state.dataMapping);
  }, [state.dataMapping, props]);

  const updateState = (updates: Partial<ChartDialogState>) => {
    const newState = { ...state, ...updates };
    setState(newState);

    // Update the settings object for persistence
    props.settings.set?.('chartType', newState.chartType);
    props.settings.set?.('title', newState.title);
    props.settings.set?.('description', newState.description);
    
    // For dataMapping, save both the object (for workflow tools) and JSON string (for dialog persistence)
    if (updates.dataMapping !== undefined) {
      // Save as object for workflow tools to read
      (props.settings as any).dataMapping = newState.dataMapping;
      // Also save as JSON string for dialog persistence
      props.settings.set?.('dataMapping', JSON.stringify(newState.dataMapping));
    }
  };

  // Handle chart type change and reset data mapping
  const handleChartTypeChange = (newChartType: ChartType) => {
    const newDataMapping: Record<string, string | string[]> = {};
    updateState({
      chartType: newChartType,
      dataMapping: newDataMapping,
    });
  };

  // Get column mapping configuration for current chart type (delegated to utils)
  const getColumnMappingConfig = () => {
    const config = getChartColumnMappingConfig(state.chartType);
    return config;
  };

  // Update data mapping for single column
  const updateDataMapping = (field: string, value: string) => {
    const newDataMapping = { ...state.dataMapping, [field]: value };
    updateState({ dataMapping: newDataMapping });
  };

  // Update data mapping for multiple columns
  const updateMultipleDataMapping = (field: string, values: string[]) => {
    const newDataMapping = { ...state.dataMapping, [field]: values };
    updateState({ dataMapping: newDataMapping });
  };

  // Toggle column in multiple selection
  const toggleColumnInMultiple = (field: string, column: string) => {
    const currentValues = (state.dataMapping[field] as string[]) || [];
    const newValues = currentValues.includes(column)
      ? currentValues.filter((c) => c !== column)
      : [...currentValues, column];
    updateMultipleDataMapping(field, newValues);
  };

  // Remove column from multiple selection
  const removeColumnFromMultiple = (field: string, column: string) => {
    const currentValues = (state.dataMapping[field] as string[]) || [];
    const newValues = currentValues.filter((c) => c !== column);
    updateMultipleDataMapping(field, newValues);
  };

  // Check if configuration is valid
  const isConfigurationValid = () => {
    const mappingConfig = getColumnMappingConfig();

    // Simply rely on shared util – validates presence of any mapping value
    const anyMappingProvided = isDataMappingProvided(state.dataMapping);

    // If there are no known fields (edge-case) we still need at least one mapping value
    if (Object.keys(mappingConfig).length === 0) return anyMappingProvided;

    return anyMappingProvided;
  };

  // Inform the user when no columns are available, but still allow editing of
  // the current configuration so that chart settings can be prepared ahead of
  // time.
  const NoColumnsNotice = () => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-5 text-blue-500" />
          No Input Data Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Connect a data source to this chart node to see column suggestions.
          You can still type column names manually below – they will be
          validated once data is available.
        </p>
      </CardContent>
    </Card>
  );

  const isValid = isConfigurationValid();

  return (
    <div className="p-6 space-y-6">
      {/* Show notice when there are no input columns */}
      {availableColumns.length === 0 && <NoColumnsNotice />}

      {/* Chart Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-blue-500" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              placeholder="e.g., Sales Analysis, Customer Demographics"
              value={state.title}
              onChange={(e) => updateState({ title: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This title will appear in the dashboard and charts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chart-description">Description (Optional)</Label>
            <Textarea
              id="chart-description"
              placeholder="Describe what this chart shows..."
              value={state.description}
              onChange={(e) => updateState({ description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chart-type">Chart Type</Label>
            <Select
              value={state.chartType}
              onValueChange={handleChartTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableChartTypes().map((chartType) => (
                  <SelectItem key={chartType} value={chartType}>
                    {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5 text-green-500" />
            Column Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Available Columns
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map((column) => (
                <span
                  key={column}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs"
                >
                  {column}
                </span>
              ))}
            </div>
          </div>

          {/* Dynamic column mapping based on chart type */}
          {Object.entries(getColumnMappingConfig()).map(([field, config]) => {
            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={`chart-${field}`}>{config.label}</Label>

                {config.multiple ? (
                  <div className="space-y-3">
                    {/* Display selected columns */}
                    {Array.isArray(state.dataMapping[field]) &&
                      (state.dataMapping[field] as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(state.dataMapping[field] as string[]).map(
                            (column) => (
                              <Badge
                                key={column}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {column}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-4 p-0 hover:bg-transparent"
                                  onClick={() =>
                                    removeColumnFromMultiple(field, column)
                                  }
                                >
                                  <X className="size-3" />
                                </Button>
                              </Badge>
                            ),
                          )}
                        </div>
                      )}

                  {availableColumns.length > 0 ? (
                    /* Checkbox selector when columns are available */
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                      {availableColumns.map((column) => {
                        const isSelected =
                          Array.isArray(state.dataMapping[field]) &&
                          (state.dataMapping[field] as string[]).includes(column);
                        return (
                          <div
                            key={column}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${field}-${column}`}
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleColumnInMultiple(field, column)
                              }
                            />
                            <Label
                              htmlFor={`${field}-${column}`}
                              className="text-sm"
                            >
                              {column}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback text input when no columns are known */
                    <Textarea
                      placeholder="Comma separated column names (e.g. sales,profit)"
                      rows={2}
                      value={Array.isArray(state.dataMapping[field]) ? (state.dataMapping[field] as string[]).join(',') : ''}
                      onChange={(e) =>
                        updateMultipleDataMapping(
                          field,
                          e.target.value
                            .split(',')
                            .map((v) => v.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  )}
                </div>
              ) : (
                availableColumns.length > 0 ? (
                  <Select
                    value={(state.dataMapping[field] as string) || ''}
                    onValueChange={(value) => updateDataMapping(field, value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${config.label.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={config.label}
                    value={(state.dataMapping[field] as string) || ''}
                    onChange={(e) => updateDataMapping(field, e.target.value)}
                  />
                )
              )}
            </div>
          );
          })}

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Configuration Status</span>
              <span
                className={`text-xs px-2 py-1 rounded ${isValid ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}
              >
                {isValid ? 'Valid' : 'Incomplete'}
              </span>
            </div>
            {!isValid && (
              <p className="text-xs text-muted-foreground mt-2">
                Please configure all required column mappings for{' '}
                {state.chartType} chart.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export class ChartNodeDialog extends NodeDialog {
  private static CHART_TYPE_KEY = 'chartType';
  private static TITLE_KEY = 'title';
  private static DESCRIPTION_KEY = 'description';
  private static DATA_MAPPING_KEY = 'dataMapping';

  private chartType: ChartType = 'scatter';
  private title = 'Chart Visualization';
  private description = '';
  private dataMapping: Record<string, string | string[]> = {};

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): ReactElement {
    // Always load fresh settings to ensure AI agent changes are reflected
    this.loadSettings(settings, _specs);



    // Add a key that changes when settings change to force re-render
    const settingsKey = JSON.stringify([
      this.chartType,
      this.title,
      this.description,
      this.dataMapping
    ]);

    return createElement(ChartNodeDialogPanel, {
      key: settingsKey, // Force re-render when settings change
      settings,
      specs: _specs,
      initialChartType: this.chartType,
      initialTitle: this.title,
      initialDescription: this.description,
      initialDataMapping: this.dataMapping,
      onChartTypeChange: (chartType: ChartType) => {
        this.chartType = chartType;
        this.dataMapping = {}; // Reset mapping when chart type changes
        this.saveSettings(settings);
      },
      onTitleChange: (title: string) => {
        this.title = title;
        this.saveSettings(settings);
      },
      onDescriptionChange: (description: string) => {
        this.description = description;
        this.saveSettings(settings);
      },
      onDataMappingChange: (dataMapping: Record<string, string | string[]>) => {
        this.dataMapping = dataMapping;
        this.saveSettings(settings);
      },
    } as ChartNodeDialogPanelProps);
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(ChartNodeDialog.CHART_TYPE_KEY, this.chartType);
      settings.set(ChartNodeDialog.TITLE_KEY, this.title);
      settings.set(ChartNodeDialog.DESCRIPTION_KEY, this.description);
      settings.set(
        ChartNodeDialog.DATA_MAPPING_KEY,
        JSON.stringify(this.dataMapping),
      );
    } else {
      (settings as any)[ChartNodeDialog.CHART_TYPE_KEY] = this.chartType;
      (settings as any)[ChartNodeDialog.TITLE_KEY] = this.title;
      (settings as any)[ChartNodeDialog.DESCRIPTION_KEY] = this.description;
      (settings as any)[ChartNodeDialog.DATA_MAPPING_KEY] = JSON.stringify(
        this.dataMapping,
      );
    }
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    // --- simple getters ---
    const getString = (key: string, def = ''): string => {
      if (settings.getString) return settings.getString(key, def);
      return (settings as any)[key] ?? def;
    };

    // Chart type/title/description
    this.chartType = (getString(ChartNodeDialog.CHART_TYPE_KEY, 'scatter') as ChartType) || 'scatter';
    this.title = getString(ChartNodeDialog.TITLE_KEY, 'Chart Visualization');
    this.description = getString(ChartNodeDialog.DESCRIPTION_KEY, '');

    // Data mapping - improved handling for workflow tools
    let mapping: Record<string, any> = {};
    
    // First, try to get dataMapping directly as an object (from workflow tools)
    const directDataMapping = (settings as any).dataMapping;
    
    if (directDataMapping && typeof directDataMapping === 'object') {
      mapping = { ...directDataMapping };
    } else {
      // Fallback to string-based approach (from dialog saves)
      const rawString = getString(ChartNodeDialog.DATA_MAPPING_KEY, '');
      // Check if it's already an object (sometimes getString returns objects)
       if (typeof rawString === 'object' && rawString !== null) {
         mapping = rawString as Record<string, any>;
      } else if (typeof rawString === 'string' && rawString.trim() !== '' && rawString.trim() !== '{}') {
        try {
          mapping = JSON.parse(rawString);
        } catch (error) {
        }
      } else {
      }
    }

    this.dataMapping = mapping;
  }
}
