'use client';

import { NodeDialog, type SettingsObject, type DataTableSpec } from '../core';
import { PartitionMode } from './node-model';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Dialog for the Partition Node
 */
export class PartitionNodeDialog extends NodeDialog {
  // Settings keys
  private static MODE_KEY = 'partition_mode';
  private static VALUE_KEY = 'partition_value';
  private static STRATIFIED_COLUMN_KEY = 'stratified_column';
  private static USE_RANDOM_SEED_KEY = 'use_random_seed';
  private static RANDOM_SEED_KEY = 'random_seed';

  // Current settings values
  private mode: PartitionMode = PartitionMode.RELATIVE;
  private value = 50;
  private stratifiedColumn = '';
  private useRandomSeed = false;
  private randomSeed = 12345;

  /**
   * Creates the React component for the dialog UI
   */
  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    // Load current settings first
    this.loadSettings(settings, _specs);

    return (
      <PartitionDialogPanel
        settings={settings}
        specs={_specs}
        initialMode={this.mode}
        initialValue={this.value}
        initialStratifiedColumn={this.stratifiedColumn}
        initialUseRandomSeed={this.useRandomSeed}
        initialRandomSeed={this.randomSeed}
        onSettingsChange={(
          mode,
          value,
          stratifiedColumn,
          useRandomSeed,
          randomSeed,
        ) => {
          this.mode = mode;
          this.value = value;
          this.stratifiedColumn = stratifiedColumn;
          this.useRandomSeed = useRandomSeed;
          this.randomSeed = randomSeed;
          // Save immediately
          this.saveSettings(settings);
        }}
      />
    );
  }

  /**
   * Load settings from the settings object
   */
  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.mode = settings.getString
      ? (settings.getString(
          PartitionNodeDialog.MODE_KEY,
          PartitionMode.RELATIVE,
        ) as PartitionMode)
      : (settings as any)[PartitionNodeDialog.MODE_KEY] ||
        PartitionMode.RELATIVE;

    this.value = settings.getNumber
      ? settings.getNumber(PartitionNodeDialog.VALUE_KEY, 50)
      : (settings as any)[PartitionNodeDialog.VALUE_KEY] || 50;

    this.stratifiedColumn = settings.getString
      ? settings.getString(PartitionNodeDialog.STRATIFIED_COLUMN_KEY, '')
      : (settings as any)[PartitionNodeDialog.STRATIFIED_COLUMN_KEY] || '';

    this.useRandomSeed = settings.getBoolean
      ? settings.getBoolean(PartitionNodeDialog.USE_RANDOM_SEED_KEY, false)
      : (settings as any)[PartitionNodeDialog.USE_RANDOM_SEED_KEY] || false;

    this.randomSeed = settings.getNumber
      ? settings.getNumber(PartitionNodeDialog.RANDOM_SEED_KEY, 12345)
      : (settings as any)[PartitionNodeDialog.RANDOM_SEED_KEY] || 12345;
  }

  /**
   * Save settings to the settings object
   */
  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(PartitionNodeDialog.MODE_KEY, this.mode);
      settings.set(PartitionNodeDialog.VALUE_KEY, this.value);
      settings.set(
        PartitionNodeDialog.STRATIFIED_COLUMN_KEY,
        this.stratifiedColumn,
      );
      settings.set(PartitionNodeDialog.USE_RANDOM_SEED_KEY, this.useRandomSeed);
      settings.set(PartitionNodeDialog.RANDOM_SEED_KEY, this.randomSeed);
    } else {
      (settings as any)[PartitionNodeDialog.MODE_KEY] = this.mode;
      (settings as any)[PartitionNodeDialog.VALUE_KEY] = this.value;
      (settings as any)[PartitionNodeDialog.STRATIFIED_COLUMN_KEY] =
        this.stratifiedColumn;
      (settings as any)[PartitionNodeDialog.USE_RANDOM_SEED_KEY] =
        this.useRandomSeed;
      (settings as any)[PartitionNodeDialog.RANDOM_SEED_KEY] = this.randomSeed;
    }
  }
}

/**
 * React component for the dialog UI
 */
interface PartitionDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialMode: PartitionMode;
  initialValue: number;
  initialStratifiedColumn: string;
  initialUseRandomSeed: boolean;
  initialRandomSeed: number;
  onSettingsChange: (
    mode: PartitionMode,
    value: number,
    stratifiedColumn: string,
    useRandomSeed: boolean,
    randomSeed: number,
  ) => void;
}

function PartitionDialogPanel(props: PartitionDialogPanelProps) {
  const [mode, setMode] = useState<PartitionMode>(props.initialMode);
  const [value, setValue] = useState<number>(props.initialValue);
  const [stratifiedColumn, setStratifiedColumn] = useState<string>(
    props.initialStratifiedColumn,
  );
  const [useRandomSeed, setUseRandomSeed] = useState<boolean>(
    props.initialUseRandomSeed,
  );
  const [randomSeed, setRandomSeed] = useState<number>(props.initialRandomSeed);

  // Get all columns from specs
  const allColumns = props.specs[0]?.columns.map((col) => col.name) || [];

  // Notify parent of changes
  useEffect(() => {
    props.onSettingsChange(
      mode,
      value,
      stratifiedColumn,
      useRandomSeed,
      randomSeed,
    );
  }, [mode, value, stratifiedColumn, useRandomSeed, randomSeed, props]);

  // Get the appropriate label and placeholder for the value input
  const getValueLabel = () => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return 'Number of rows';
      case PartitionMode.RELATIVE:
        return 'Percentage (0-100)';
      case PartitionMode.TAKE_FROM_TOP:
        return 'Number of top rows';
      case PartitionMode.LINEAR_SAMPLING:
        return 'Number of sample points';
      case PartitionMode.DRAW_RANDOMLY:
        return 'Percentage (0-100)';
      case PartitionMode.STRATIFIED_SAMPLING:
        return 'Percentage (0-100)';
      default:
        return 'Value';
    }
  };

  const getValuePlaceholder = () => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return 'Enter number of rows for first partition';
      case PartitionMode.RELATIVE:
        return 'Enter percentage (e.g., 50 for 50%)';
      case PartitionMode.TAKE_FROM_TOP:
        return 'Enter number of top-most rows';
      case PartitionMode.LINEAR_SAMPLING:
        return 'Enter number of linearly sampled points';
      case PartitionMode.DRAW_RANDOMLY:
        return 'Enter percentage for random sampling';
      case PartitionMode.STRATIFIED_SAMPLING:
        return 'Enter percentage for stratified sampling';
      default:
        return 'Enter value';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case PartitionMode.ABSOLUTE:
        return 'Specify the absolute number of rows in the first partition. If there are fewer rows than specified, all rows go to the first table.';
      case PartitionMode.RELATIVE:
        return 'The percentage of rows in the input table that go to the first partition. Must be between 0 and 100.';
      case PartitionMode.TAKE_FROM_TOP:
        return 'Put the specified number of top-most rows into the first output table, with the remainder in the second table.';
      case PartitionMode.LINEAR_SAMPLING:
        return 'Always includes the first and last row and selects remaining rows linearly over the whole table. Useful for downsampling while maintaining min/max values.';
      case PartitionMode.DRAW_RANDOMLY:
        return 'Random sampling of all rows. You may optionally specify a fixed seed for reproducible results.';
      case PartitionMode.STRATIFIED_SAMPLING:
        return 'The distribution of values in the selected column is approximately retained in the output tables. Requires selecting a column for stratification.';
      default:
        return '';
    }
  };

  const needsRandomSeed =
    mode === PartitionMode.DRAW_RANDOMLY ||
    mode === PartitionMode.STRATIFIED_SAMPLING;
  const needsStratifiedColumn = mode === PartitionMode.STRATIFIED_SAMPLING;

  return (
    <div className="space-y-6 p-6">
      {/* Partition Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Partition Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as PartitionMode)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PartitionMode.ABSOLUTE} id="absolute" />
              <Label htmlFor="absolute">Absolute</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PartitionMode.RELATIVE} id="relative" />
              <Label htmlFor="relative">Relative</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={PartitionMode.TAKE_FROM_TOP}
                id="take-from-top"
              />
              <Label htmlFor="take-from-top">Take from top</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={PartitionMode.LINEAR_SAMPLING}
                id="linear-sampling"
              />
              <Label htmlFor="linear-sampling">Linear sampling</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={PartitionMode.DRAW_RANDOMLY}
                id="draw-randomly"
              />
              <Label htmlFor="draw-randomly">Draw randomly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={PartitionMode.STRATIFIED_SAMPLING}
                id="stratified-sampling"
              />
              <Label htmlFor="stratified-sampling">Stratified sampling</Label>
            </div>
          </RadioGroup>

          {/* Mode Description */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{getModeDescription()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Value Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value-input">{getValueLabel()}</Label>
            <Input
              id="value-input"
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              placeholder={getValuePlaceholder()}
              min={0}
              max={
                mode === PartitionMode.RELATIVE ||
                mode === PartitionMode.DRAW_RANDOMLY ||
                mode === PartitionMode.STRATIFIED_SAMPLING
                  ? 100
                  : undefined
              }
            />
          </div>

          {/* Stratified Column Selection */}
          {needsStratifiedColumn && (
            <div className="space-y-2">
              <Label htmlFor="stratified-column">Stratification Column</Label>
              <Select
                value={stratifiedColumn}
                onValueChange={setStratifiedColumn}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column for stratification" />
                </SelectTrigger>
                <SelectContent>
                  {allColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!stratifiedColumn && (
                <p className="text-sm text-red-600">
                  Please select a column for stratification
                </p>
              )}
            </div>
          )}

          {/* Random Seed Configuration */}
          {needsRandomSeed && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-random-seed"
                  checked={useRandomSeed}
                  onCheckedChange={(checked) =>
                    setUseRandomSeed(checked === true)
                  }
                />
                <Label htmlFor="use-random-seed">Use random seed</Label>
              </div>

              {useRandomSeed && (
                <div className="space-y-2">
                  <Label htmlFor="random-seed">Random Seed</Label>
                  <Input
                    id="random-seed"
                    type="number"
                    value={randomSeed}
                    onChange={(e) => setRandomSeed(Number(e.target.value))}
                    placeholder="Enter seed for reproducible results"
                  />
                  <p className="text-sm text-gray-600">
                    Using a seed ensures the same rows will be selected each
                    time the node runs.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Mode:</strong>{' '}
              {mode.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
            <p>
              <strong>Value:</strong> {value}
              {mode === PartitionMode.RELATIVE ||
              mode === PartitionMode.DRAW_RANDOMLY ||
              mode === PartitionMode.STRATIFIED_SAMPLING
                ? '%'
                : ''}
            </p>
            {needsStratifiedColumn && (
              <p>
                <strong>Stratification Column:</strong>{' '}
                {stratifiedColumn || 'Not selected'}
              </p>
            )}
            {needsRandomSeed && useRandomSeed && (
              <p>
                <strong>Random Seed:</strong> {randomSeed}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { PartitionDialogPanel };
