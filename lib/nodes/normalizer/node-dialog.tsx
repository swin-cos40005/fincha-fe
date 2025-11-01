'use client';

import React, { useState, useEffect, createElement } from 'react';
import { NodeDialog, type SettingsObject, type DataTableSpec } from '../core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Info, AlertCircle } from 'lucide-react';
import { NormalizationMethod } from './node-model';

export class NormalizerNodeDialog extends NodeDialog {
  private static NUMBER_COLUMNS_KEY = 'number_columns';
  private static NORMALIZATION_METHOD_KEY = 'normalization_method';
  private static MIN_VALUE_KEY = 'min_value';
  private static MAX_VALUE_KEY = 'max_value';

  private numberColumns: string[] = [];
  private normalizationMethod: NormalizationMethod = NormalizationMethod.MIN_MAX;
  private minValue: number = 0;
  private maxValue: number = 1;

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    // Load current settings first
    this.loadSettings(settings, _specs);

    return createElement(NormalizerDialogPanel, {
      settings,
      specs: _specs,
      initialNumberColumns: this.numberColumns,
      initialNormalizationMethod: this.normalizationMethod,
      initialMinValue: this.minValue,
      initialMaxValue: this.maxValue,
      onNumberColumnsChange: (columns: string[]) => {
        this.numberColumns = columns;
        this.saveSettings(settings);
      },
      onNormalizationMethodChange: (method: NormalizationMethod) => {
        this.normalizationMethod = method;
        this.saveSettings(settings);
      },
      onMinValueChange: (value: number) => {
        this.minValue = value;
        this.saveSettings(settings);
      },
      onMaxValueChange: (value: number) => {
        this.maxValue = value;
        this.saveSettings(settings);
      },
    });
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.numberColumns = settings.getString
      ? JSON.parse(
          settings.getString(NormalizerNodeDialog.NUMBER_COLUMNS_KEY, '[]'),
        )
      : (settings as any)[NormalizerNodeDialog.NUMBER_COLUMNS_KEY] || [];

    this.normalizationMethod = settings.getString
      ? (settings.getString(
          NormalizerNodeDialog.NORMALIZATION_METHOD_KEY,
          NormalizationMethod.MIN_MAX,
        ) as NormalizationMethod)
      : (settings as any)[NormalizerNodeDialog.NORMALIZATION_METHOD_KEY] ||
        NormalizationMethod.MIN_MAX;

    this.minValue = settings.getNumber
      ? settings.getNumber(NormalizerNodeDialog.MIN_VALUE_KEY, 0)
      : (settings as any)[NormalizerNodeDialog.MIN_VALUE_KEY] || 0;

    this.maxValue = settings.getNumber
      ? settings.getNumber(NormalizerNodeDialog.MAX_VALUE_KEY, 1)
      : (settings as any)[NormalizerNodeDialog.MAX_VALUE_KEY] || 1;
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(
        NormalizerNodeDialog.NUMBER_COLUMNS_KEY,
        JSON.stringify(this.numberColumns),
      );
      settings.set(
        NormalizerNodeDialog.NORMALIZATION_METHOD_KEY,
        this.normalizationMethod,
      );
      settings.set(NormalizerNodeDialog.MIN_VALUE_KEY, this.minValue);
      settings.set(NormalizerNodeDialog.MAX_VALUE_KEY, this.maxValue);
    } else {
      (settings as any)[NormalizerNodeDialog.NUMBER_COLUMNS_KEY] =
        this.numberColumns;
      (settings as any)[NormalizerNodeDialog.NORMALIZATION_METHOD_KEY] =
        this.normalizationMethod;
      (settings as any)[NormalizerNodeDialog.MIN_VALUE_KEY] = this.minValue;
      (settings as any)[NormalizerNodeDialog.MAX_VALUE_KEY] = this.maxValue;
    }
  }
}

interface NormalizerDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialNumberColumns: string[];
  initialNormalizationMethod: NormalizationMethod;
  initialMinValue: number;
  initialMaxValue: number;
  onNumberColumnsChange: (columns: string[]) => void;
  onNormalizationMethodChange: (method: NormalizationMethod) => void;
  onMinValueChange: (value: number) => void;
  onMaxValueChange: (value: number) => void;
}

function NormalizerDialogPanel(props: NormalizerDialogPanelProps) {
  const [numberColumns, setNumberColumns] = useState<string[]>(
    props.initialNumberColumns,
  );
  const [normalizationMethod, setNormalizationMethod] = useState<NormalizationMethod>(
    props.initialNormalizationMethod,
  );
  const [minValue, setMinValue] = useState<number>(props.initialMinValue);
  const [maxValue, setMaxValue] = useState<number>(props.initialMaxValue);

  const inputSpec = props.specs[0];
  const availableNumericColumns = inputSpec?.columns
    .filter(col => col.type === 'number')
    .map(col => col.name) || [];

  useEffect(() => {
    props.onNumberColumnsChange(numberColumns);
  }, [numberColumns, props]);

  useEffect(() => {
    props.onNormalizationMethodChange(normalizationMethod);
  }, [normalizationMethod, props]);

  useEffect(() => {
    props.onMinValueChange(minValue);
  }, [minValue, props]);

  useEffect(() => {
    props.onMaxValueChange(maxValue);
  }, [maxValue, props]);

  const getMethodLabel = (method: NormalizationMethod): string => {
    switch (method) {
      case NormalizationMethod.MIN_MAX:
        return 'Min-Max';
      case NormalizationMethod.Z_SCORE:
        return 'Z-Score';
      case NormalizationMethod.DECIMAL_SCALING:
        return 'Decimal Scaling';
      default:
        return method;
    }
  };

  const getMethodDescription = (method: NormalizationMethod): string => {
    switch (method) {
      case NormalizationMethod.MIN_MAX:
        return 'Linear transformation to specified range (e.g., 0-1)';
      case NormalizationMethod.Z_SCORE:
        return 'Standardize to mean=0, standard deviation=1';
      case NormalizationMethod.DECIMAL_SCALING:
        return 'Scale by powers of 10 until max absolute value ≤ 1';
      default:
        return '';
    }
  };

  const handleColumnToggle = (columnName: string) => {
    if (numberColumns.includes(columnName)) {
      setNumberColumns(numberColumns.filter(col => col !== columnName));
    } else {
      setNumberColumns([...numberColumns, columnName]);
    }
  };

  const handleSelectAll = () => {
    setNumberColumns([...availableNumericColumns]);
  };

  const handleDeselectAll = () => {
    setNumberColumns([]);
  };

  const isMinMaxMethod = normalizationMethod === NormalizationMethod.MIN_MAX;
  const hasValidRange = minValue < maxValue;

  return (
    <div className="space-y-6 p-4">
      {!inputSpec && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Connect an input to see available numeric columns for normalization.
          </p>
        </div>
      )}

      {inputSpec && (
        <>
          {/* Normalization Method */}
          <Card>
            <CardHeader>
              <CardTitle>Normalization Method</CardTitle>
              <p className="text-sm text-gray-600">
                Choose the mathematical approach for scaling your data
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="normalizationMethod">Method</Label>
                <Select
                  value={normalizationMethod}
                  onValueChange={(value: NormalizationMethod) =>
                    setNormalizationMethod(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NormalizationMethod.MIN_MAX}>
                      {getMethodLabel(NormalizationMethod.MIN_MAX)}
                    </SelectItem>
                    <SelectItem value={NormalizationMethod.Z_SCORE}>
                      {getMethodLabel(NormalizationMethod.Z_SCORE)}
                    </SelectItem>
                    <SelectItem value={NormalizationMethod.DECIMAL_SCALING}>
                      {getMethodLabel(NormalizationMethod.DECIMAL_SCALING)}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {getMethodDescription(normalizationMethod)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Min-Max Range Configuration */}
          {isMinMaxMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Target Range</CardTitle>
                <p className="text-sm text-gray-600">
                  Specify the new minimum and maximum values for normalized data
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minValue">Minimum</Label>
                    <Input
                      id="minValue"
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(Number(e.target.value))}
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxValue">Maximum</Label>
                    <Input
                      id="maxValue"
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(Number(e.target.value))}
                      step="any"
                    />
                  </div>
                </div>
                {!hasValidRange && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="size-4" />
                    <span>Minimum must be less than maximum</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Number Columns</CardTitle>
              <p className="text-sm text-gray-600">
                Select the numerical columns to normalize
              </p>
            </CardHeader>
            <CardContent>
              {availableNumericColumns.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No numeric columns found in the input data.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {availableNumericColumns.map((columnName) => (
                      <div
                        key={columnName}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={columnName}
                          checked={numberColumns.includes(columnName)}
                          onCheckedChange={() => handleColumnToggle(columnName)}
                        />
                        <Label
                          htmlFor={columnName}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {columnName}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {numberColumns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm text-gray-600">Selected:</span>
                      {numberColumns.map((col) => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Method Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4" />
                Method Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Min-Max Normalization</h4>
                  <p className="text-sm text-gray-600">
                    Scales data linearly to a specified range. Formula: (value - min) / (max - min) × (new_max - new_min) + new_min
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Best for: Algorithms requiring bounded inputs, preserving zero values
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Z-Score Normalization</h4>
                  <p className="text-sm text-gray-600">
                    Standardizes data to have mean=0 and standard deviation=1. Formula: (value - mean) / standard_deviation
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Best for: Statistical analysis, algorithms assuming normal distribution
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Decimal Scaling</h4>
                  <p className="text-sm text-gray-600">
                    Scales data by dividing by powers of 10 until maximum absolute value ≤ 1
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Best for: Preserving data distribution shape, handling very large/small numbers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Columns Info */}
          <Card>
            <CardHeader>
              <CardTitle>Input Table Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total columns:</span> {inputSpec.columns.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Numeric columns:</span> {availableNumericColumns.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Selected for normalization:</span> {numberColumns.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}