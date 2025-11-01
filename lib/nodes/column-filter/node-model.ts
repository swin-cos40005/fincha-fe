import { NodeModel } from '../base-node/node-model';
import type {
  ExecutionContext,
  DataTableType,
  DataTableSpec,
  SettingsObject,
  ColumnSpec,
} from '@/lib/types';

export enum ColumnFilterMode {
  KEEP = 'keep',
  EXCLUDE = 'exclude',
}

export class ColumnFilterNodeModel extends NodeModel {
  private selectedColumns: string[] = [];
  private filterMode: ColumnFilterMode = ColumnFilterMode.KEEP;

  constructor() {
    super(1, 1); // 1 input port, 1 output port
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (_inSpecs.length === 0) {
      return [];
    }

    const inputSpec = _inSpecs[0];
    let outputColumns: ColumnSpec[];

    if (this.filterMode === ColumnFilterMode.KEEP) {
      // Keep only selected columns
      outputColumns = inputSpec.columns.filter((col) =>
        this.selectedColumns.includes(col.name),
      );
    } else {
      // Exclude selected columns
      outputColumns = inputSpec.columns.filter(
        (col) => !this.selectedColumns.includes(col.name),
      );
    }

    if (outputColumns.length === 0) {
      throw new Error(
        'Column filter would result in no columns. Please adjust your selection.',
      );
    }

    return [
      {
        columns: outputColumns,
        findColumnIndex: (name: string) =>
          outputColumns.findIndex((col) => col.name === name),
      },
    ];
  }

  loadSettings(settings: SettingsObject): void {
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

    const columnCount = getNumber('selectedColumnCount', 0);
    this.selectedColumns = [];

    for (let i = 0; i < columnCount; i++) {
      const colName = getString(`selectedColumn_${i}`, '');
      if (colName) {
        this.selectedColumns.push(colName);
      }
    }

    this.filterMode = getString(
      'filterMode',
      ColumnFilterMode.KEEP,
    ) as ColumnFilterMode;
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('selectedColumnCount', this.selectedColumns.length);

    this.selectedColumns.forEach((column, i) => {
      settings.set(`selectedColumn_${i}`, column);
    });

    settings.set('filterMode', this.filterMode);
  }

  validateSettings(settings: SettingsObject): void {
    // Helper function with fallback logic
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };

    const columnCount = getNumber('selectedColumnCount', 0);
    if (columnCount === 0) {
      throw new Error('Please select at least one column');
    }
  }

  async execute(
    inputTable: DataTableType[],
    ctx: ExecutionContext,
  ): Promise<DataTableType[]> {
    if (inputTable.length === 0) {
      throw new Error('No input table provided');
    }

    const table = inputTable[0];
    const inputSpec = table.spec;

    // Determine which columns to keep based on mode
    let columnsToKeep: number[];
    if (this.filterMode === ColumnFilterMode.KEEP) {
      columnsToKeep = this.selectedColumns
        .map((colName) => inputSpec.findColumnIndex(colName))
        .filter((index) => index !== -1);
    } else {
      const selectedIndices = this.selectedColumns.map((colName) =>
        inputSpec.findColumnIndex(colName),
      );
      columnsToKeep = inputSpec.columns
        .map((_, index) => index)
        .filter((index) => !selectedIndices.includes(index));
    }

    if (columnsToKeep.length === 0) {
      throw new Error('No columns would remain after filtering');
    }

    // Create output spec with filtered columns
    const outputColumns = columnsToKeep.map(
      (index) => inputSpec.columns[index],
    );
    const outputSpec: DataTableSpec = {
      columns: outputColumns,
      findColumnIndex: (name: string) =>
        outputColumns.findIndex((col) => col.name === name),
    };

    const outputTable = ctx.createDataTable(outputSpec);

    let processedRows = 0;
    table.forEach((row) => {
      ctx.checkCanceled();

      // Create new row with only selected columns
      const filteredCells = columnsToKeep.map((index) => row.cells[index]);
      outputTable.addRow(row.key, filteredCells);

      processedRows++;
      if (processedRows % 100 === 0) {
        ctx.setProgress(
          processedRows / table.size,
          `Processed ${processedRows} of ${table.size} rows`,
        );
      }
    });

    ctx.setProgress(1, `Filtered to ${outputColumns.length} columns`);

    return [outputTable.close()];
  }

  getInputLabel(index: number): string | null {
    return index === 0 ? 'Data with columns to filter' : null;
  }

  getOutputLabel(index: number): string | null {
    return index === 0 ? 'Data with selected columns' : null;
  }
}
