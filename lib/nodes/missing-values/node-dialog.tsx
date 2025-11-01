'use client';

import React, { useState, useEffect, createElement } from 'react';
import { NodeDialog, type SettingsObject, type DataTableSpec } from '../core';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import {
  MissingValueMethod,
  type ColumnMissingValueConfig,
} from './node-model';

export class MissingValuesNodeDialog extends NodeDialog {
  private static COLUMN_CONFIGS_KEY = 'column_configs';
  private static DEFAULT_METHOD_KEY = 'default_method';

  private columnConfigs: ColumnMissingValueConfig[] = [];
  private defaultMethod: MissingValueMethod = MissingValueMethod.MOST_FREQUENT;
  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    // Load current settings first
    this.loadSettings(settings, _specs);

    return createElement(MissingValuesDialogPanel, {
      settings,
      specs: _specs,
      initialColumnConfigs: this.columnConfigs,
      initialDefaultMethod: this.defaultMethod,
      onColumnConfigsChange: (configs: ColumnMissingValueConfig[]) => {
        this.columnConfigs = configs;
        this.saveSettings(settings);
      },
      onDefaultMethodChange: (method: MissingValueMethod) => {
        this.defaultMethod = method;
        this.saveSettings(settings);
      },
    });
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.columnConfigs = settings.getString
      ? JSON.parse(
          settings.getString(MissingValuesNodeDialog.COLUMN_CONFIGS_KEY, '[]'),
        )
      : (settings as any)[MissingValuesNodeDialog.COLUMN_CONFIGS_KEY] || [];

    this.defaultMethod = settings.getString
      ? (settings.getString(
          MissingValuesNodeDialog.DEFAULT_METHOD_KEY,
          MissingValueMethod.MOST_FREQUENT,
        ) as MissingValueMethod)
      : (settings as any)[MissingValuesNodeDialog.DEFAULT_METHOD_KEY] ||
        MissingValueMethod.MOST_FREQUENT;
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(
        MissingValuesNodeDialog.COLUMN_CONFIGS_KEY,
        JSON.stringify(this.columnConfigs),
      );
      settings.set(
        MissingValuesNodeDialog.DEFAULT_METHOD_KEY,
        this.defaultMethod,
      );
    } else {
      (settings as any)[MissingValuesNodeDialog.COLUMN_CONFIGS_KEY] =
        this.columnConfigs;
      (settings as any)[MissingValuesNodeDialog.DEFAULT_METHOD_KEY] =
        this.defaultMethod;
    }
  }
}

interface MissingValuesDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialColumnConfigs: ColumnMissingValueConfig[];
  initialDefaultMethod: MissingValueMethod;
  onColumnConfigsChange: (configs: ColumnMissingValueConfig[]) => void;
  onDefaultMethodChange: (method: MissingValueMethod) => void;
}

function MissingValuesDialogPanel(props: MissingValuesDialogPanelProps) {
  const [columnConfigs, setColumnConfigs] = useState<
    ColumnMissingValueConfig[]
  >(props.initialColumnConfigs);
  const [defaultMethod, setDefaultMethod] = useState<MissingValueMethod>(
    props.initialDefaultMethod,
  );
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<MissingValueMethod>(
    MissingValueMethod.MOST_FREQUENT,
  );

  const inputSpec = props.specs[0];
  const availableColumns = inputSpec?.columns || [];

  useEffect(() => {
    props.onColumnConfigsChange(columnConfigs);
  }, [columnConfigs, props]);

  useEffect(() => {
    props.onDefaultMethodChange(defaultMethod);
  }, [defaultMethod, props]);

  const getMethodLabel = (method: MissingValueMethod): string => {
    switch (method) {
      case MissingValueMethod.MEAN:
        return 'Mean (Average)';
      case MissingValueMethod.MEDIAN:
        return 'Median';
      case MissingValueMethod.MOST_FREQUENT:
        return 'Most Frequent';
      case MissingValueMethod.REMOVE_ROWS:
        return 'Remove Rows';
      default:
        return method;
    }
  };

  const getMethodDescription = (method: MissingValueMethod): string => {
    switch (method) {
      case MissingValueMethod.MEAN:
        return 'Replace with average value (numbers only)';
      case MissingValueMethod.MEDIAN:
        return 'Replace with median value (numbers only)';
      case MissingValueMethod.MOST_FREQUENT:
        return 'Replace with most common value (all types)';
      case MissingValueMethod.REMOVE_ROWS:
        return 'Remove entire rows with missing values';
      default:
        return '';
    }
  };

  const isMethodValidForColumn = (
    method: MissingValueMethod,
    columnType: string,
  ): boolean => {
    if (
      method === MissingValueMethod.MEAN ||
      method === MissingValueMethod.MEDIAN
    ) {
      return columnType === 'number';
    }
    return true;
  };

  const addColumnConfig = () => {
    if (!selectedColumn) return;

    // Check if column already configured
    if (columnConfigs.find((c) => c.columnName === selectedColumn)) return;

    const newConfig: ColumnMissingValueConfig = {
      columnName: selectedColumn,
      method: selectedMethod,
    };

    setColumnConfigs([...columnConfigs, newConfig]);
    setSelectedColumn('');
    setSelectedMethod(MissingValueMethod.MOST_FREQUENT);
  };

  const removeColumnConfig = (index: number) => {
    setColumnConfigs(columnConfigs.filter((_, i) => i !== index));
  };

  const availableColumnsForSelection = availableColumns.filter(
    (col) => !columnConfigs.find((config) => config.columnName === col.name),
  );

  return (
    <div className="space-y-6 p-4">
      {!inputSpec && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Connect an input to see available columns for configuration.
          </p>
        </div>
      )}

      {inputSpec && (
        <>
          {/* Default Method */}
          <Card>
            <CardHeader>
              <CardTitle>Default Missing Value Handling</CardTitle>
              <p className="text-sm text-gray-600">
                Method used for columns not specifically configured below
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="defaultMethod">Default Method</Label>
                <Select
                  value={defaultMethod}
                  onValueChange={(value: MissingValueMethod) =>
                    setDefaultMethod(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MissingValueMethod.MOST_FREQUENT}>
                      {getMethodLabel(MissingValueMethod.MOST_FREQUENT)}
                    </SelectItem>
                    <SelectItem value={MissingValueMethod.MEAN}>
                      {getMethodLabel(MissingValueMethod.MEAN)}
                    </SelectItem>
                    <SelectItem value={MissingValueMethod.MEDIAN}>
                      {getMethodLabel(MissingValueMethod.MEDIAN)}
                    </SelectItem>
                    <SelectItem value={MissingValueMethod.REMOVE_ROWS}>
                      {getMethodLabel(MissingValueMethod.REMOVE_ROWS)}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {getMethodDescription(defaultMethod)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Column-Specific Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Column-Specific Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Override the default method for specific columns
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Column Config */}
              {availableColumnsForSelection.length > 0 && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="column">Column</Label>
                    <Select
                      value={selectedColumn}
                      onValueChange={setSelectedColumn}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumnsForSelection.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="method">Method</Label>
                    <Select
                      value={selectedMethod}
                      onValueChange={(value: MissingValueMethod) =>
                        setSelectedMethod(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MissingValueMethod).map((method) => {
                          const selectedCol = availableColumns.find(
                            (col) => col.name === selectedColumn,
                          );
                          const isValid =
                            !selectedCol ||
                            isMethodValidForColumn(method, selectedCol.type);

                          return (
                            <SelectItem
                              key={method}
                              value={method}
                              disabled={!isValid}
                            >
                              {getMethodLabel(method)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addColumnConfig} disabled={!selectedColumn}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}

              {/* Configured Columns */}
              {columnConfigs.length > 0 && (
                <div className="space-y-2">
                  <Label>Column Configurations:</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {columnConfigs.map((config, index) => {
                        const column = availableColumns.find(
                          (col) => col.name === config.columnName,
                        );
                        return (
                          <TableRow
                            key={`config-${config.columnName}-${index}`}
                          >
                            <TableCell>{config.columnName}</TableCell>
                            <TableCell className="capitalize">
                              {column?.type || 'unknown'}
                            </TableCell>
                            <TableCell>
                              {getMethodLabel(config.method)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeColumnConfig(index)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {columnConfigs.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No column-specific configurations. All columns will use the
                  default method.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Columns Info */}
          <Card>
            <CardHeader>
              <CardTitle>Input Table Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Available Methods</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableColumns.map((col) => (
                    <TableRow key={col.name}>
                      <TableCell>{col.name}</TableCell>
                      <TableCell className="capitalize">{col.type}</TableCell>
                      <TableCell className="text-sm">
                        {col.type === 'number'
                          ? 'Mean, Median, Most Frequent, Remove Rows'
                          : 'Most Frequent, Remove Rows'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
