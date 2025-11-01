import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
  type DataRow,
} from '../core';
import { SimpleCell } from '../../types';

export enum PartitionMode {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  TAKE_FROM_TOP = 'take_from_top',
  LINEAR_SAMPLING = 'linear_sampling',
  DRAW_RANDOMLY = 'draw_randomly',
  STRATIFIED_SAMPLING = 'stratified_sampling',
}

export interface PartitionConfig {
  mode: PartitionMode;
  value: number;
  stratifiedColumn: string;
  useRandomSeed: boolean;
  randomSeed: number;
}

export class PartitionNodeModel extends NodeModel {
  private static MODE_KEY = 'partition_mode';
  private static VALUE_KEY = 'partition_value';
  private static STRATIFIED_COLUMN_KEY = 'stratified_column';
  private static USE_RANDOM_SEED_KEY = 'use_random_seed';
  private static RANDOM_SEED_KEY = 'random_seed';

  private config: PartitionConfig = {
    mode: PartitionMode.RELATIVE,
    value: 50, // Default to 50% for relative mode
    stratifiedColumn: '',
    useRandomSeed: false,
    randomSeed: 12345,
  };

  constructor() {
    super(1, 2); // 1 input, 2 outputs
  }

  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    if (inData.length === 0) {
      throw new Error('No input data provided');
    }

    const inputTable = inData[0];
    const totalRows = inputTable.size;

    if (totalRows === 0) {
      // Return two empty tables with same spec
      const spec = inputTable.spec;
      const table1 = context.createDataTable(spec);
      const table2 = context.createDataTable(spec);
      return [table1.close(), table2.close()];
    }

    context.setProgress(0.1, 'Analyzing input data...');

    // Convert to array for easier manipulation
    const allRows = Array.from(inputTable.rows);

    let firstPartitionIndices: number[] = [];

    context.setProgress(0.3, 'Determining partition strategy...');

    switch (this.config.mode) {
      case PartitionMode.ABSOLUTE:
        firstPartitionIndices = this.getAbsolutePartition(totalRows);
        break;

      case PartitionMode.RELATIVE:
        firstPartitionIndices = this.getRelativePartition(totalRows);
        break;

      case PartitionMode.TAKE_FROM_TOP:
        firstPartitionIndices = this.getTakeFromTopPartition(totalRows);
        break;

      case PartitionMode.LINEAR_SAMPLING:
        firstPartitionIndices = this.getLinearSamplingPartition(totalRows);
        break;

      case PartitionMode.DRAW_RANDOMLY:
        firstPartitionIndices = this.getRandomPartition(totalRows);
        break;

      case PartitionMode.STRATIFIED_SAMPLING:
        firstPartitionIndices = await this.getStratifiedPartition(
          inputTable,
          allRows,
        );
        break;

      default:
        throw new Error(`Unknown partition mode: ${this.config.mode}`);
    }

    context.setProgress(0.6, 'Creating output tables...');

    // Create output tables
    const spec = inputTable.spec;
    const table1 = context.createDataTable(spec);
    const table2 = context.createDataTable(spec);

    // Set to track which indices are in first partition
    const firstPartitionSet = new Set(firstPartitionIndices);

    context.setProgress(0.8, 'Populating partitions...');

    // Populate tables
    allRows.forEach((row, index) => {
      const cells = row.cells.map(
        (cell) => new SimpleCell(cell.type, cell.getValue()),
      );

      if (firstPartitionSet.has(index)) {
        table1.addRow(row.key, cells);
      } else {
        table2.addRow(row.key, cells);
      }
    });

    context.setProgress(1.0, 'Partition complete');
    return [table1.close(), table2.close()];
  }

  private getAbsolutePartition(totalRows: number): number[] {
    const count = Math.min(Math.max(0, Math.floor(this.config.value)), totalRows);
    return Array.from({ length: count }, (_, i) => i);
  }

  private getRelativePartition(totalRows: number): number[] {
    const percentage = Math.max(0, Math.min(100, this.config.value));
    const count = Math.floor((percentage / 100) * totalRows);
    return Array.from({ length: count }, (_, i) => i);
  }

  private getTakeFromTopPartition(totalRows: number): number[] {
    const count = Math.min(Math.max(0, Math.floor(this.config.value)), totalRows);
    return Array.from({ length: count }, (_, i) => i);
  }

  private getLinearSamplingPartition(totalRows: number): number[] {
    if (totalRows <= 2) {
      return Array.from({ length: totalRows }, (_, i) => i);
    }

    const targetCount = Math.min(
      Math.max(2, Math.floor(this.config.value)),
      totalRows,
    );

    if (targetCount >= totalRows) {
      return Array.from({ length: totalRows }, (_, i) => i);
    }

    const indices: number[] = [];

    // Always include first and last
    indices.push(0);
    if (targetCount > 1) {
      indices.push(totalRows - 1);
    }

    // Add intermediate points linearly
    if (targetCount > 2) {
      const step = (totalRows - 1) / (targetCount - 1);
      for (let i = 1; i < targetCount - 1; i++) {
        const index = Math.round(step * i);
        if (!indices.includes(index)) {
          indices.push(index);
        }
      }
    }

    return indices.sort((a, b) => a - b);
  }

  private getRandomPartition(totalRows: number): number[] {
    const percentage = Math.max(0, Math.min(100, this.config.value));
    const count = Math.floor((percentage / 100) * totalRows);

    // Use seeded random if specified
    const random = this.config.useRandomSeed
      ? this.seededRandom(this.config.randomSeed)
      : Math.random;

    const indices: number[] = [];
    const available = Array.from({ length: totalRows }, (_, i) => i);

    while (indices.length < count && available.length > 0) {
      const randomIndex = Math.floor(random() * available.length);
      indices.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }

    return indices.sort((a, b) => a - b);
  }

  private async getStratifiedPartition(
    inputTable: DataTableType,
    allRows: DataRow[],
  ): Promise<number[]> {
    const columnIndex = inputTable.spec.findColumnIndex(this.config.stratifiedColumn);
    if (columnIndex < 0) {
      throw new Error(`Stratified column '${this.config.stratifiedColumn}' not found`);
    }

    // Group rows by stratification value
    const stratifiedGroups = new Map<string, number[]>();
    allRows.forEach((row, index) => {
      const stratValue = String(row.cells[columnIndex].getValue());
      if (!stratifiedGroups.has(stratValue)) {
        stratifiedGroups.set(stratValue, []);
      }
      stratifiedGroups.get(stratValue)?.push(index);
    });

    const percentage = Math.max(0, Math.min(100, this.config.value));
    const indices: number[] = [];

    // Sample from each group proportionally
    stratifiedGroups.forEach((groupIndices) => {
      const groupCount = Math.floor((percentage / 100) * groupIndices.length);
      const random = this.config.useRandomSeed
        ? this.seededRandom(this.config.randomSeed)
        : Math.random;

      // Randomly sample from this group
      const available = [...groupIndices];
      while (indices.length < groupCount && available.length > 0) {
        const randomIndex = Math.floor(random() * available.length);
        indices.push(available[randomIndex]);
        available.splice(randomIndex, 1);
      }
    });

    return indices.sort((a, b) => a - b);
  }

  private seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  configure(inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (inSpecs.length === 0) {
      throw new Error('No input specification provided');
    }

    // For stratified sampling, validate the stratification column exists
    if (
      this.config.mode === PartitionMode.STRATIFIED_SAMPLING &&
      this.config.stratifiedColumn
    ) {
      const columnIndex = inSpecs[0].findColumnIndex(this.config.stratifiedColumn);
      if (columnIndex < 0) {
        throw new Error(
          `Stratified column '${this.config.stratifiedColumn}' not found`,
        );
      }
    }

    // Both output ports have same spec as input
    return [inSpecs[0], inSpecs[0]];
  }

  loadSettings(settings: SettingsObject): void {
    const mode = settings.getString(PartitionNodeModel.MODE_KEY, PartitionMode.RELATIVE);
    const value = settings.getNumber(PartitionNodeModel.VALUE_KEY, 50);
    const stratifiedColumn = settings.getString(PartitionNodeModel.STRATIFIED_COLUMN_KEY, '');
    const useRandomSeed = settings.getBoolean(PartitionNodeModel.USE_RANDOM_SEED_KEY, false);
    const randomSeed = settings.getNumber(PartitionNodeModel.RANDOM_SEED_KEY, 12345);

    this.config = {
      mode: mode as PartitionMode,
      value,
      stratifiedColumn,
      useRandomSeed,
      randomSeed,
    };
  }

  saveSettings(settings: SettingsObject): void {
    settings.set(PartitionNodeModel.MODE_KEY, this.config.mode);
    settings.set(PartitionNodeModel.VALUE_KEY, this.config.value);
    settings.set(PartitionNodeModel.STRATIFIED_COLUMN_KEY, this.config.stratifiedColumn);
    settings.set(PartitionNodeModel.USE_RANDOM_SEED_KEY, this.config.useRandomSeed);
    settings.set(PartitionNodeModel.RANDOM_SEED_KEY, this.config.randomSeed);
  }

  validateSettings(settings: SettingsObject): void {
    const mode = settings.getString(PartitionNodeModel.MODE_KEY, '');
    const value = settings.getNumber(PartitionNodeModel.VALUE_KEY, -1);

    if (!Object.values(PartitionMode).includes(mode as PartitionMode)) {
      throw new Error(`Invalid partition mode: ${mode}`);
    }

    if (value < 0) {
      throw new Error('Partition value must be non-negative');
    }

    if (mode === PartitionMode.RELATIVE && (value < 0 || value > 100)) {
      throw new Error('Relative partition value must be between 0 and 100');
    }

    if (mode === PartitionMode.STRATIFIED_SAMPLING) {
      const stratifiedColumn = settings.getString(PartitionNodeModel.STRATIFIED_COLUMN_KEY, '');
      if (!stratifiedColumn) {
        throw new Error('Stratified column must be specified for stratified sampling');
      }
    }
  }

  // Getters and setters
  getConfig(): PartitionConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PartitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Getter methods for individual config properties
  getMode(): PartitionMode {
    return this.config.mode;
  }

  getValue(): number {
    return this.config.value;
  }

  getStratifiedColumn(): string {
    return this.config.stratifiedColumn;
  }

  getUseRandomSeed(): boolean {
    return this.config.useRandomSeed;
  }

  getRandomSeed(): number {
    return this.config.randomSeed;
  }
}
