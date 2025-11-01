import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
  type DataRow,
} from '../core';

// Define sort direction
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

// Define sort configuration for a column
export interface SortColumn {
  columnName: string;
  direction: SortDirection;
}

/**
 * Node model that sorts data by specified columns
 */
export class SorterNodeModel extends NodeModel {
  // Settings keys
  private static SORT_COLUMNS_KEY = 'sort_columns';

  // Settings values
  private sortColumns: SortColumn[] = [];

  constructor() {
    // 1 input port, 1 output port
    super(1, 1);
  }

  /**
   * Main execution method - sorts data
   */
  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    const inputTable = inData[0];
    const inputSpec = inputTable.spec;

    // Create output container with same spec as input
    const container = context.createDataTable(inputSpec);

    // Get column indices for sorting
    const sortConfigs = this.sortColumns.map((sortCol) => ({
      colIndex: inputSpec.findColumnIndex(sortCol.columnName),
      direction: sortCol.direction,
      columnName: sortCol.columnName,
    }));

    // Validate all columns exist
    sortConfigs.forEach((config) => {
      if (config.colIndex < 0) {
        throw new Error(
          `Sort column '${config.columnName}' not found in input table`,
        );
      }
    });

    // Convert table to array for sorting
    const rows: DataRow[] = [];
    let rowCount = 0;

    context.setProgress(0, 'Loading data for sorting...');
    inputTable.forEach((row: DataRow) => {
      if (rowCount % 1000 === 0) {
        context.checkCanceled();
        context.setProgress(
          (rowCount / inputTable.size) * 0.3,
          `Loading row ${rowCount} of ${inputTable.size}`,
        );
      }
      rows.push(row);
      rowCount++;
    });

    context.setProgress(0.3, 'Sorting data...');
    context.checkCanceled();

    // Sort the rows
    rows.sort((a, b) => {
      for (const config of sortConfigs) {
        const aValue = a.cells[config.colIndex].getValue();
        const bValue = b.cells[config.colIndex].getValue();

        let comparison = this.compareValues(aValue, bValue);

        if (config.direction === SortDirection.DESC) {
          comparison = -comparison;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });

    context.setProgress(0.7, 'Writing sorted data...');

    // Add sorted rows to output
    rows.forEach((row, index) => {
      if (index % 1000 === 0) {
        context.checkCanceled();
        context.setProgress(
          0.7 + (index / rows.length) * 0.3,
          `Writing row ${index} of ${rows.length}`,
        );
      }

      container.addRow(row.key, row.cells);
    });

    context.setProgress(1.0, 'Sort complete');

    return [container.close()];
  }

  /**
   * Compares two values for sorting
   */
  private compareValues(a: any, b: any): number {
    // Handle null/undefined values
    if (a === null || a === undefined) {
      if (b === null || b === undefined) return 0;
      return -1;
    }
    if (b === null || b === undefined) {
      return 1;
    }

    // Convert to strings for comparison if they're different types
    if (typeof a !== typeof b) {
      const aStr = String(a);
      const bStr = String(b);
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    }

    // Numeric comparison
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // String comparison
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    if (aStr < bStr) return -1;
    if (aStr > bStr) return 1;
    return 0;
  }

  /**
   * Validates input and defines output structure
   */
  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    const inputSpec = _inSpecs[0];

    // Validate sort columns exist
    this.sortColumns.forEach((sortCol) => {
      const colIndex = inputSpec.findColumnIndex(sortCol.columnName);
      if (colIndex < 0) {
        throw new Error(
          `Sort column '${sortCol.columnName}' not found in input table`,
        );
      }
    });

    // Output spec is the same as input spec
    return [inputSpec];
  }

  /**
   * Load settings from the settings object
   */
  loadSettings(settings: SettingsObject): void {
    this.sortColumns = JSON.parse(
      settings.getString
        ? settings.getString(SorterNodeModel.SORT_COLUMNS_KEY, '[]')
        : (settings as any)[SorterNodeModel.SORT_COLUMNS_KEY] || '[]',
    );
  }

  /**
   * Save settings to the settings object
   */
  saveSettings(settings: SettingsObject): void {
    settings.set(
      SorterNodeModel.SORT_COLUMNS_KEY,
      JSON.stringify(this.sortColumns),
    );
  }

  /**
   * Validate settings
   */
  validateSettings(settings: SettingsObject): void {
    const sortCols = JSON.parse(
      settings.getString
        ? settings.getString(SorterNodeModel.SORT_COLUMNS_KEY, '[]')
        : (settings as any)[SorterNodeModel.SORT_COLUMNS_KEY] || '[]',
    );

    if (sortCols.length === 0) {
      throw new Error('At least one sort column must be specified');
    }

    // Validate sort column structure
    sortCols.forEach((sortCol: any) => {
      if (!sortCol.columnName || !sortCol.direction) {
        throw new Error(
          'Each sort column must specify columnName and direction',
        );
      }

      if (!Object.values(SortDirection).includes(sortCol.direction)) {
        throw new Error(`Invalid sort direction: ${sortCol.direction}`);
      }
    });
  }

  // Getters and setters for configuration
  getSortColumns(): SortColumn[] {
    return [...this.sortColumns];
  }

  setSortColumns(sortColumns: SortColumn[]): void {
    this.sortColumns = [...sortColumns];
  }
}
