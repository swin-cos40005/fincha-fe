'use client';

import React, { useState, useEffect, createElement } from 'react';
import { NodeDialog } from '../base-node/node-dialog';
import type { DataTableSpec, SettingsObject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusIcon, TrashIcon } from '@/components/icons';
import type { FilterCondition, FilterOperator } from './node-model';

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'greater than or equal' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not contains', label: 'does not contain' },
  { value: 'starts with', label: 'starts with' },
  { value: 'ends with', label: 'ends with' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
];

export class FilterNodeDialog extends NodeDialog {
  private conditions: FilterCondition[] = [];
  private logicalOperator: 'AND' | 'OR' = 'AND';

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    this.loadSettings(settings, _specs);

    return createElement(FilterDialogPanel, {
      settings,
      specs: _specs,
      initialConditions: this.conditions,
      initialLogicalOperator: this.logicalOperator,
      onConditionsChange: (conditions: FilterCondition[]) => {
        this.conditions = conditions;
        this.saveSettings(settings);
      },
      onLogicalOperatorChange: (operator: 'AND' | 'OR') => {
        this.logicalOperator = operator;
        this.saveSettings(settings);
      },
    });
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

    const conditionCount = getNumber('conditionCount', 0);
    this.conditions = [];

    for (let i = 0; i < conditionCount; i++) {
      this.conditions.push({
        column: getString(`condition_${i}_column`, ''),
        operator: getString(
          `condition_${i}_operator`,
          '=',
        ) as FilterOperator,
        value: getString(`condition_${i}_value`, ''),
      });
    }

    this.logicalOperator = getString('logicalOperator', 'AND') as 'AND' | 'OR';
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('conditionCount', this.conditions.length);

    this.conditions.forEach((condition, i) => {
      settings.set(`condition_${i}_column`, condition.column);
      settings.set(`condition_${i}_operator`, condition.operator);
      settings.set(`condition_${i}_value`, condition.value);
    });

    settings.set('logicalOperator', this.logicalOperator);
  }
}

interface FilterDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialConditions: FilterCondition[];
  initialLogicalOperator: 'AND' | 'OR';
  onConditionsChange: (conditions: FilterCondition[]) => void;
  onLogicalOperatorChange: (operator: 'AND' | 'OR') => void;
}

function FilterDialogPanel({
  specs,
  initialConditions,
  initialLogicalOperator,
  onConditionsChange,
  onLogicalOperatorChange,
}: FilterDialogPanelProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(
    initialConditions.length > 0
      ? initialConditions
      : [{ column: '', operator: '=', value: '' }],
  );
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>(
    initialLogicalOperator,
  );

  useEffect(() => {
    onConditionsChange(conditions);
  }, [conditions, onConditionsChange]);

  useEffect(() => {
    onLogicalOperatorChange(logicalOperator);
  }, [logicalOperator, onLogicalOperatorChange]);

  const columns = specs?.[0]?.columns || [];

  const handleAddCondition = () => {
    setConditions([...conditions, { column: '', operator: '=', value: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (
    index: number,
    field: keyof FilterCondition,
    value: string,
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const needsValueInput = (operator: FilterOperator) => {
    return operator !== 'is empty' && operator !== 'is not empty';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Filter Configuration</h3>

        {conditions.length > 1 && (
          <div className="mb-4">
            <Label>Combine conditions with:</Label>
            <Select
              value={logicalOperator}
              onValueChange={(value) =>
                setLogicalOperator(value as 'AND' | 'OR')
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div
              key={`condition-${condition?.column || 'empty'}-${condition?.operator || 'eq'}-${index}`}
              className="flex items-end gap-2"
            >
              <div className="flex-1">
                <Label>Column</Label>
                <Select
                  value={condition.column}
                  onValueChange={(value) =>
                    handleConditionChange(index, 'column', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <Label>Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value) =>
                    handleConditionChange(index, 'operator', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsValueInput(condition.operator) && (
                <div className="flex-1">
                  <Label>Value</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) =>
                      handleConditionChange(index, 'value', e.target.value)
                    }
                    placeholder="Enter value"
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCondition(index)}
                disabled={conditions.length === 1}
              >
                <TrashIcon size={16} />
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCondition}
          className="mt-3"
        >
          <PlusIcon size={16} />
          Add Condition
        </Button>
      </div>
    </div>
  );
}
