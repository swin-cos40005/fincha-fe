import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
  type DataRow,
} from '../core';
import { SimpleCell } from '../../types';

// Enum for normalization methods
export enum NormalizationMethod {
  MIN_MAX = 'MIN_MAX',
  Z_SCORE = 'Z_SCORE',
  DECIMAL_SCALING = 'DECIMAL_SCALING',
}

export class NormalizerNodeModel extends NodeModel {
  private static NUMBER_COLUMNS_KEY = 'number_columns';
  private static NORMALIZATION_METHOD_KEY = 'normalization_method';
  private static MIN_VALUE_KEY = 'min_value';
  private static MAX_VALUE_KEY = 'max_value';

  private numberColumns: string[] = [];
  private normalizationMethod: NormalizationMethod = NormalizationMethod.MIN_MAX;
  private minValue: number = 0;
  private maxValue: number = 1;

  constructor() {
    super(1, 1); // 1 input, 1 output
  }

  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    if (!inData || inData.length === 0) {
      throw new Error('No input data provided. Please connect an input node.');
    }

    const inputTable = inData[0];
    if (!inputTable) {
      throw new Error('Input table is null or undefined.');
    }

    const inputSpec = inputTable.spec;
    if (!inputSpec) {
      throw new Error('Input table specification is missing.');
    }

    // Validate that selected columns exist and are numeric
    const availableNumericColumns = inputSpec.columns
      .filter(col => col.type === 'number')
      .map(col => col.name);

    if (availableNumericColumns.length === 0) {
      throw new Error('No numeric columns found in the input data.');
    }

    // Filter selected columns to only include available numeric columns
    const validSelectedColumns = this.numberColumns.filter(col => 
      availableNumericColumns.includes(col)
    );

    if (validSelectedColumns.length === 0) {
      throw new Error('No valid numeric columns selected for normalization. Available numeric columns: ' + 
        availableNumericColumns.join(', '));
    }

    context.setProgress(0.1, 'Analyzing data for normalization...');

    // Compute statistics for selected columns
    const columnStats = this.computeColumnStatistics(inputTable, inputSpec, validSelectedColumns);

    context.setProgress(0.3, 'Computing normalization parameters...');

    // Create output table with same spec
    const outputSpec = { ...inputSpec };
    const output = context.createDataTable(outputSpec);

    context.setProgress(0.5, 'Applying normalization...');

    // Process each row
    let processedRows = 0;
    const totalRows = inputTable.size;

    inputTable.forEach((row: DataRow) => {
      const processedCells = inputSpec.columns.map((colSpec, colIndex) => {
        const cell = row.cells[colIndex];
        const value = cell.getValue();

        // Only normalize if this column is selected and numeric
        if (validSelectedColumns.includes(colSpec.name) && colSpec.type === 'number') {
          const normalizedValue = this.normalizeValue(
            value,
            colSpec.name,
            columnStats,
            context
          );
          return new SimpleCell(colSpec.type, normalizedValue);
        }

        // Return original value for non-selected or non-numeric columns
        return new SimpleCell(colSpec.type, value);
      });

      output.addRow(`normalized-${processedRows}`, processedCells);
      processedRows++;

      if (processedRows % 100 === 0) {
        context.setProgress(
          0.5 + (processedRows / totalRows) * 0.4,
          `Processing row ${processedRows} of ${totalRows}`,
        );
      }
    });

    context.setProgress(1.0, 'Data normalization completed');
    return [output.close()];
  }

  private computeColumnStatistics(
    table: DataTableType,
    spec: DataTableSpec,
    selectedColumns: string[]
  ): Map<string, { min: number; max: number; mean: number; stdDev: number; maxAbs: number }> {
    const stats = new Map<string, { min: number; max: number; mean: number; stdDev: number; maxAbs: number }>();

    // Initialize stats for each selected column
    selectedColumns.forEach(colName => {
      const colIndex = spec.findColumnIndex(colName);
      if (colIndex === -1) return;

      const values: number[] = [];
      let min = Infinity;
      let max = -Infinity;
      let maxAbs = 0;
      let sum = 0;
      let count = 0;

      // Collect values and compute basic stats
      table.forEach((row: DataRow) => {
        const cell = row.cells[colIndex];
        const value = cell.getValue();

        // Skip null/undefined values
        if (value === null || value === undefined || value === '') {
          return;
        }

        const numValue = Number(value);
        if (Number.isNaN(numValue)) {
          return;
        }

        values.push(numValue);
        min = Math.min(min, numValue);
        max = Math.max(max, numValue);
        maxAbs = Math.max(maxAbs, Math.abs(numValue));
        sum += numValue;
        count++;
      });

      if (count === 0) {
        // No valid values found
        stats.set(colName, { min: 0, max: 0, mean: 0, stdDev: 0, maxAbs: 0 });
        return;
      }

      const mean = sum / count;

      // Compute standard deviation
      let variance = 0;
      values.forEach(val => {
        variance += Math.pow(val - mean, 2);
      });
      const stdDev = Math.sqrt(variance / count);

      stats.set(colName, { min, max, mean, stdDev, maxAbs });
    });

    return stats;
  }

  private normalizeValue(
    value: any,
    columnName: string,
    columnStats: Map<string, { min: number; max: number; mean: number; stdDev: number; maxAbs: number }>,
    context: ExecutionContext
  ): number {
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue)) {
      return 0;
    }

    const stats = columnStats.get(columnName);
    if (!stats) {
      return numValue; // Return original value if no stats available
    }

    // Handle edge cases
    if (stats.min === stats.max) {
      // Constant column - return the target range midpoint for min-max, 0 for z-score
      if (this.normalizationMethod === NormalizationMethod.MIN_MAX) {
        return (this.minValue + this.maxValue) / 2;
      } else if (this.normalizationMethod === NormalizationMethod.Z_SCORE) {
        return 0;
      } else {
        return numValue; // Keep original for decimal scaling
      }
    }

    if (stats.stdDev === 0) {
      // Zero variance - handle similar to constant column
      if (this.normalizationMethod === NormalizationMethod.Z_SCORE) {
        return 0;
      }
    }

    switch (this.normalizationMethod) {
      case NormalizationMethod.MIN_MAX: {
        const normalized = (numValue - stats.min) / (stats.max - stats.min);
        return normalized * (this.maxValue - this.minValue) + this.minValue;
      }

      case NormalizationMethod.Z_SCORE: {
        if (stats.stdDev === 0) {
          return 0; // All values are the same
        }
        return (numValue - stats.mean) / stats.stdDev;
      }

      case NormalizationMethod.DECIMAL_SCALING: {
        // Find the smallest j where maxAbs / 10^j <= 1
        let j = 0;
        let divisor = 1;
        while (stats.maxAbs / divisor > 1) {
          j++;
          divisor = Math.pow(10, j);
        }
        return numValue / divisor;
      }

      default:
        return numValue;
    }
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    // Output spec is the same as input spec
    return _inSpecs;
  }

  loadSettings(settings: SettingsObject): void {
    try {
      // Load number columns
      if (settings.getString) {
        const columnsStr = settings.getString(
          NormalizerNodeModel.NUMBER_COLUMNS_KEY,
          '[]'
        );
        this.numberColumns = JSON.parse(columnsStr);
      } else {
        this.numberColumns = (settings as any)[NormalizerNodeModel.NUMBER_COLUMNS_KEY] || [];
      }

      // Load normalization method
      if (settings.getString) {
        this.normalizationMethod = settings.getString(
          NormalizerNodeModel.NORMALIZATION_METHOD_KEY,
          NormalizationMethod.MIN_MAX
        ) as NormalizationMethod;
      } else {
        this.normalizationMethod = (settings as any)[NormalizerNodeModel.NORMALIZATION_METHOD_KEY] || 
          NormalizationMethod.MIN_MAX;
      }

      // Load min value
      if (settings.getNumber) {
        this.minValue = settings.getNumber(NormalizerNodeModel.MIN_VALUE_KEY, 0);
      } else {
        this.minValue = (settings as any)[NormalizerNodeModel.MIN_VALUE_KEY] || 0;
      }

      // Load max value
      if (settings.getNumber) {
        this.maxValue = settings.getNumber(NormalizerNodeModel.MAX_VALUE_KEY, 1);
      } else {
        this.maxValue = (settings as any)[NormalizerNodeModel.MAX_VALUE_KEY] || 1;
      }
    } catch (error) {
      console.error('Error loading Normalizer node settings:', error);
      // Fallback to defaults
      this.numberColumns = [];
      this.normalizationMethod = NormalizationMethod.MIN_MAX;
      this.minValue = 0;
      this.maxValue = 1;
    }
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(
        NormalizerNodeModel.NUMBER_COLUMNS_KEY,
        JSON.stringify(this.numberColumns)
      );
      settings.set(
        NormalizerNodeModel.NORMALIZATION_METHOD_KEY,
        this.normalizationMethod
      );
      settings.set(NormalizerNodeModel.MIN_VALUE_KEY, this.minValue);
      settings.set(NormalizerNodeModel.MAX_VALUE_KEY, this.maxValue);
    } else {
      (settings as any)[NormalizerNodeModel.NUMBER_COLUMNS_KEY] = this.numberColumns;
      (settings as any)[NormalizerNodeModel.NORMALIZATION_METHOD_KEY] = this.normalizationMethod;
      (settings as any)[NormalizerNodeModel.MIN_VALUE_KEY] = this.minValue;
      (settings as any)[NormalizerNodeModel.MAX_VALUE_KEY] = this.maxValue;
    }
  }

  validateSettings(_settings: SettingsObject): void {
    // Validate min and max values for min-max normalization
    if (this.normalizationMethod === NormalizationMethod.MIN_MAX) {
      if (this.minValue >= this.maxValue) {
        throw new Error('Minimum value must be less than maximum value for min-max normalization.');
      }
    }
  }

  // Public methods for dialog access
  getNumberColumns(): string[] {
    return [...this.numberColumns];
  }

  setNumberColumns(columns: string[]): void {
    this.numberColumns = [...columns];
  }

  getNormalizationMethod(): NormalizationMethod {
    return this.normalizationMethod;
  }

  setNormalizationMethod(method: NormalizationMethod): void {
    this.normalizationMethod = method;
  }

  getMinValue(): number {
    return this.minValue;
  }

  setMinValue(value: number): void {
    this.minValue = value;
  }

  getMaxValue(): number {
    return this.maxValue;
  }

  setMaxValue(value: number): void {
    this.maxValue = value;
  }
}