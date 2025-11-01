"use client";

import React, { useState, useEffect, createElement } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, TrashIcon } from '@/components/icons';
import { NodeDialog } from '../core';
import type { DataTableSpec, SettingsObject } from '../core';
import type { SorterNodeModel, SortColumn, SortDirection } from './node-model';

interface SorterNodeDialogProps {
  nodeModel: SorterNodeModel;
  inputSpecs: DataTableSpec[];
  onClose: () => void;
  onApply: () => void;
}

export class SorterNodeDialog extends NodeDialog {
  constructor(private nodeModel: SorterNodeModel) {
    super();
  }

  createDialogPanel(settings: SettingsObject, _specs: DataTableSpec[]): React.ReactElement {
    return createElement(SorterDialogContent, {
      nodeModel: this.nodeModel,
      inputSpecs: _specs,
      onClose: () => {},
      onApply: () => this.saveSettings(settings)
    });
  }

  saveSettings(settings: SettingsObject): void {
    this.nodeModel.saveSettings(settings);
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.nodeModel.loadSettings(settings);
  }
}

function SorterDialogContent({ nodeModel, inputSpecs, onApply }: SorterNodeDialogProps) {
  const [sortColumns, setSortColumns] = useState<SortColumn[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    // Load current sort columns
    setSortColumns(nodeModel.getSortColumns());
    
    // Get available columns from input
    if (inputSpecs && inputSpecs.length > 0) {
      const columnNames = inputSpecs[0].columns.map(col => col.name);
      setAvailableColumns(columnNames);
    }
  }, [nodeModel, inputSpecs]);

  const handleAddSortColumn = () => {
    if (availableColumns.length > 0) {
      const newSortColumn: SortColumn = {
        columnName: availableColumns[0],
        direction: 'ASC' as SortDirection
      };
      const updated = [...sortColumns, newSortColumn];
      setSortColumns(updated);
      // Save immediately
      nodeModel.setSortColumns(updated);
      onApply();
    }
  };

  const handleRemoveSortColumn = (index: number) => {
    const updated = sortColumns.filter((_, i) => i !== index);
    setSortColumns(updated);
    // Save immediately
    nodeModel.setSortColumns(updated);
    onApply();
  };

  const handleUpdateSortColumn = (index: number, field: keyof SortColumn, value: string) => {
    const updated = sortColumns.map((col, i) => 
      i === index ? { ...col, [field]: value } : col
    );
    setSortColumns(updated);
    // Save immediately
    nodeModel.setSortColumns(updated);
    onApply();
  };



  const getAvailableColumnsForIndex = (currentIndex: number) => {
    const usedColumns = sortColumns
      .map((col, index) => index !== currentIndex ? col.columnName : null)
      .filter(Boolean);
    return availableColumns.filter(col => !usedColumns.includes(col));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sort Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure how to sort the data by specifying columns and sort directions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Sort Columns</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSortColumn}
            disabled={availableColumns.length === 0 || sortColumns.length >= availableColumns.length}
            className="flex items-center gap-2"
          >
            <PlusIcon size={16} />
            Add Sort Column
          </Button>
        </div>

        {sortColumns.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No sort columns configured. Click &quot;Add Sort Column&quot; to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {sortColumns.map((sortCol, index) => (
              <div key={`${sortCol.columnName}-${sortCol.direction}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Column</Label>
                  <Select
                    value={sortCol.columnName}
                    onValueChange={(value) => handleUpdateSortColumn(index, 'columnName', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableColumnsForIndex(index).map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm font-medium">Direction</Label>
                  <Select
                    value={sortCol.direction}
                    onValueChange={(value) => handleUpdateSortColumn(index, 'direction', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASC">Ascending (A-Z, 1-9)</SelectItem>
                      <SelectItem value="DESC">Descending (Z-A, 9-1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSortColumn(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <TrashIcon size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortColumns.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Sort Order Priority:</div>
            <div className="flex flex-wrap gap-2">
              {sortColumns.map((sortCol, index) => (
                <Badge key={`sort-${sortCol.columnName}-${sortCol.direction}-${index}`} variant="secondary" className="text-xs">
                  {index + 1}. {sortCol.columnName} ({sortCol.direction === 'ASC' ? '↑' : '↓'})
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Data will be sorted first by column 1, then by column 2, and so on.
            </div>
          </div>
        )}
      </div>


    </div>
  );
} 