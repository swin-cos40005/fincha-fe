'use client';

import React, { useState, useEffect, createElement } from 'react';
import { NodeDialog } from '../base-node/node-dialog';
import type { DataTableSpec, SettingsObject } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColumnFilterMode } from './node-model';

export class ColumnFilterNodeDialog extends NodeDialog {
  private selectedColumns: string[] = [];
  private filterMode: ColumnFilterMode = ColumnFilterMode.KEEP;

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    this.loadSettings(settings, _specs);

    return createElement(ColumnFilterDialogPanel, {
      settings,
      specs: _specs,
      initialSelectedColumns: this.selectedColumns,
      initialFilterMode: this.filterMode,
      onSelectedColumnsChange: (columns: string[]) => {
        this.selectedColumns = columns;
        this.saveSettings(settings);
      },
      onFilterModeChange: (mode: ColumnFilterMode) => {
        this.filterMode = mode;
        this.saveSettings(settings);
      },
    });
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    const columnCount = settings.getNumber
      ? settings.getNumber('selectedColumnCount', 0)
      : 0;
    this.selectedColumns = [];

    for (let i = 0; i < columnCount; i++) {
      const colName = settings.getString(`selectedColumn_${i}`, '');
      if (colName) {
        this.selectedColumns.push(colName);
      }
    }

    this.filterMode = settings.getString
      ? (settings.getString(
          'filterMode',
          ColumnFilterMode.KEEP,
        ) as ColumnFilterMode)
      : ColumnFilterMode.KEEP;
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('selectedColumnCount', this.selectedColumns.length);

    this.selectedColumns.forEach((column, i) => {
      settings.set(`selectedColumn_${i}`, column);
    });

    settings.set('filterMode', this.filterMode);
  }
}

interface ColumnFilterDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialSelectedColumns: string[];
  initialFilterMode: ColumnFilterMode;
  onSelectedColumnsChange: (columns: string[]) => void;
  onFilterModeChange: (mode: ColumnFilterMode) => void;
}

function ColumnFilterDialogPanel({
  specs,
  initialSelectedColumns,
  initialFilterMode,
  onSelectedColumnsChange,
  onFilterModeChange,
}: ColumnFilterDialogPanelProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    initialSelectedColumns,
  );
  const [filterMode, setFilterMode] =
    useState<ColumnFilterMode>(initialFilterMode);
  const [selectAll, setSelectAll] = useState(false);

  const columns = specs?.[0]?.columns || [];

  useEffect(() => {
    onSelectedColumnsChange(selectedColumns);
  }, [selectedColumns, onSelectedColumnsChange]);

  useEffect(() => {
    onFilterModeChange(filterMode);
  }, [filterMode, onFilterModeChange]);

  useEffect(() => {
    setSelectAll(selectedColumns.length === columns.length);
  }, [selectedColumns, columns.length]);

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((col) => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map((col) => col.name));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Column Filter Configuration
        </h3>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Filter Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={filterMode}
              onValueChange={(value) =>
                setFilterMode(value as ColumnFilterMode)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ColumnFilterMode.KEEP} id="keep" />
                <Label htmlFor="keep" className="font-normal">
                  Keep selected columns
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ColumnFilterMode.EXCLUDE} id="exclude" />
                <Label htmlFor="exclude" className="font-normal">
                  Exclude selected columns
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Select Columns</span>
              <Badge variant="secondary">
                {selectedColumns.length} / {columns.length} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2 pb-3 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All
              </Label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {columns.map((col) => (
                <div key={col.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={col.name}
                    checked={selectedColumns.includes(col.name)}
                    onCheckedChange={() => handleColumnToggle(col.name)}
                  />
                  <Label htmlFor={col.name} className="font-normal flex-1">
                    <span className="font-medium">{col.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({col.type})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {columns.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Connect an input to see available columns for filtering.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
