import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
  type DataRow,
} from '../core';
import { SimpleCell } from '../../types';

// Enum for missing value handling methods
export enum MissingValueMethod {
  MEAN = 'MEAN',
  MEDIAN = 'MEDIAN',
  MOST_FREQUENT = 'MOST_FREQUENT',
  REMOVE_ROWS = 'REMOVE_ROWS',
}

// Interface for column-specific handling
export interface ColumnMissingValueConfig {
  columnName: string;
  method: MissingValueMethod;
}

export class MissingValuesNodeModel extends NodeModel {
  private static COLUMN_CONFIGS_KEY = 'column_configs';
  private static DEFAULT_METHOD_KEY = 'default_method';

  private columnConfigs: ColumnMissingValueConfig[] = [];
  private defaultMethod: MissingValueMethod = MissingValueMethod.MOST_FREQUENT;
  constructor() {
    super(1, 1); // 1 input, 1 output

    // Ensure proper initialization of arrays
    this.columnConfigs = [];
    this.defaultMethod = MissingValueMethod.MOST_FREQUENT;
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

    context.setProgress(0.1, 'Analyzing missing values...');

    // Analyze missing values in the data
    const missingValueStats = this.analyzeMissingValues(inputTable, inputSpec);

    context.setProgress(0.3, 'Computing replacement values...');

    // Compute replacement values for each column
    const replacementValues = this.computeReplacementValues(
      inputTable,
      inputSpec,
      missingValueStats,
    );

    context.setProgress(0.5, 'Processing data...');

    // Create output table
    const outputSpec = { ...inputSpec };
    const output = context.createDataTable(outputSpec);

    // Process each row
    let processedRows = 0;
    const totalRows = inputTable.size;

    inputTable.forEach((row: DataRow) => {
      const shouldKeepRow = this.shouldKeepRow(row, inputSpec);

      if (shouldKeepRow) {
        const processedCells = inputSpec.columns.map((colSpec, colIndex) => {
          const cell = row.cells[colIndex];
          const value = cell.getValue();

          // Check if value is missing (null, undefined, empty string, or 'null' string)
          const isMissing =
            value === null ||
            value === undefined ||
            value === '' ||
            (typeof value === 'string' && value.toLowerCase() === 'null');

          if (isMissing) {
            const replacementValue = replacementValues.get(colSpec.name);
            return new SimpleCell(
              colSpec.type,
              replacementValue !== undefined ? replacementValue : value,
            );
          }

          return new SimpleCell(colSpec.type, value);
        });

        output.addRow(`processed-${processedRows}`, processedCells);
      }

      processedRows++;
      if (processedRows % 100 === 0) {
        context.setProgress(
          0.5 + (processedRows / totalRows) * 0.4,
          `Processing row ${processedRows} of ${totalRows}`,
        );
      }
    });

    context.setProgress(1.0, 'Missing value handling completed');
    return [output.close()];
  }

  private analyzeMissingValues(
    table: DataTableType,
    spec: DataTableSpec,
  ): Map<string, { count: number; total: number }> {
    const stats = new Map<string, { count: number; total: number }>();

    // Initialize stats for each column
    spec.columns.forEach((col) => {
      stats.set(col.name, { count: 0, total: 0 });
    });
    table.forEach((row: DataRow) => {
      spec.columns.forEach((colSpec, colIndex) => {
        const cell = row.cells[colIndex];
        const value = cell.getValue();
        const stat = stats.get(colSpec.name);
        if (!stat) return;

        stat.total++;

        // Check if value is missing
        const isMissing =
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.toLowerCase() === 'null');

        if (isMissing) {
          stat.count++;
        }
      });
    });

    return stats;
  }
  private computeReplacementValues(
    table: DataTableType,
    spec: DataTableSpec,
    _stats: Map<string, { count: number; total: number }>,
  ): Map<string, any> {
    const replacements = new Map<string, any>();

    // Ensure columnConfigs is an array
    if (!Array.isArray(this.columnConfigs)) {
      console.warn('columnConfigs is not an array, using empty array');
      this.columnConfigs = [];
    }

    spec.columns.forEach((colSpec, colIndex) => {
      const config = this.columnConfigs.find(
        (c) => c.columnName === colSpec.name,
      );
      const method = config?.method || this.defaultMethod;

      // Skip if method is REMOVE_ROWS
      if (method === MissingValueMethod.REMOVE_ROWS) {
        return;
      }

      const values: any[] = [];
      // Collect non-missing values
      table.forEach((row: DataRow) => {
        const cell = row.cells[colIndex];
        const value = cell.getValue();

        const isMissing =
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.toLowerCase() === 'null');

        if (!isMissing) {
          values.push(value);
        }
      });

      if (values.length === 0) {
        // No valid values found, use default based on type
        if (colSpec.type === 'number') {
          replacements.set(colSpec.name, 0);
        } else {
          replacements.set(colSpec.name, '');
        }
        return;
      }

      let replacement: any;

      switch (method) {
        case MissingValueMethod.MEAN:
          if (colSpec.type === 'number') {
            const numValues = values
              .map((v) => Number(v))
              .filter((v) => !Number.isNaN(v));
            replacement =
              numValues.length > 0
                ? numValues.reduce((a, b) => a + b, 0) / numValues.length
                : 0;
          } else {
            // Fall back to most frequent for non-numeric
            replacement = this.getMostFrequent(values);
          }
          break;

        case MissingValueMethod.MEDIAN:
          if (colSpec.type === 'number') {
            const numValues = values
              .map((v) => Number(v))
              .filter((v) => !Number.isNaN(v))
              .sort((a, b) => a - b);
            if (numValues.length > 0) {
              const mid = Math.floor(numValues.length / 2);
              replacement =
                numValues.length % 2 === 0
                  ? (numValues[mid - 1] + numValues[mid]) / 2
                  : numValues[mid];
            } else {
              replacement = 0;
            }
          } else {
            // Fall back to most frequent for non-numeric
            replacement = this.getMostFrequent(values);
          }
          break;

        case MissingValueMethod.MOST_FREQUENT:
        default:
          replacement = this.getMostFrequent(values);
          break;
      }

      replacements.set(colSpec.name, replacement);
    });

    return replacements;
  }

  private getMostFrequent(values: any[]): any {
    const frequency = new Map<any, number>();

    values.forEach((value) => {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });

    let mostFrequent = values[0];
    let maxCount = 0;

    frequency.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = value;
      }
    });

    return mostFrequent;
  }
  private shouldKeepRow(row: DataRow, spec: DataTableSpec): boolean {
    // Ensure columnConfigs is an array
    if (!Array.isArray(this.columnConfigs)) {
      console.warn(
        'columnConfigs is not an array in shouldKeepRow, using empty array',
      );
      this.columnConfigs = [];
    }

    // Check if any column is configured to remove rows with missing values
    for (let colIndex = 0; colIndex < spec.columns.length; colIndex++) {
      const colSpec = spec.columns[colIndex];
      const config = this.columnConfigs.find(
        (c) => c.columnName === colSpec.name,
      );
      const method = config?.method || this.defaultMethod;
      if (method === MissingValueMethod.REMOVE_ROWS) {
        const cell = row.cells[colIndex];
        const value = cell.getValue();

        const isMissing =
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.toLowerCase() === 'null');

        if (isMissing) {
          return false; // Remove this row
        }
      }
    }

    return true; // Keep this row
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    // Output spec is the same as input spec
    return _inSpecs;
  }
  loadSettings(settings: SettingsObject): void {
    try {
      // Handle column configs
      let configs: ColumnMissingValueConfig[] = [];
      if (settings.getString) {
        const configStr = settings.getString(
          MissingValuesNodeModel.COLUMN_CONFIGS_KEY,
          '[]',
        );
        configs = JSON.parse(configStr);
      } else {
        configs =
          (settings as any)[MissingValuesNodeModel.COLUMN_CONFIGS_KEY] || [];
      }

      // Ensure it's an array
      this.columnConfigs = Array.isArray(configs) ? configs : [];

      // Handle default method
      if (settings.getString) {
        this.defaultMethod = settings.getString(
          MissingValuesNodeModel.DEFAULT_METHOD_KEY,
          MissingValueMethod.MOST_FREQUENT,
        ) as MissingValueMethod;
      } else {
        this.defaultMethod =
          (settings as any)[MissingValuesNodeModel.DEFAULT_METHOD_KEY] ||
          MissingValueMethod.MOST_FREQUENT;
      }
    } catch (error) {
      console.error('Error loading Missing Values node settings:', error);
      // Fallback to defaults
      this.columnConfigs = [];
      this.defaultMethod = MissingValueMethod.MOST_FREQUENT;
    }
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(
        MissingValuesNodeModel.COLUMN_CONFIGS_KEY,
        JSON.stringify(this.columnConfigs),
      );
      settings.set(
        MissingValuesNodeModel.DEFAULT_METHOD_KEY,
        this.defaultMethod,
      );
    } else {
      (settings as any)[MissingValuesNodeModel.COLUMN_CONFIGS_KEY] =
        this.columnConfigs;
      (settings as any)[MissingValuesNodeModel.DEFAULT_METHOD_KEY] =
        this.defaultMethod;
    }
  }

  validateSettings(_settings: SettingsObject): void {
    // Settings are optional - node can work with defaults
  }

  // Public methods for dialog access
  getColumnConfigs(): ColumnMissingValueConfig[] {
    return [...this.columnConfigs];
  }

  setColumnConfigs(configs: ColumnMissingValueConfig[]): void {
    this.columnConfigs = [...configs];
  }

  getDefaultMethod(): MissingValueMethod {
    return this.defaultMethod;
  }

  setDefaultMethod(method: MissingValueMethod): void {
    this.defaultMethod = method;
  }
}
