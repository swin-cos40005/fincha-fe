import { NodeModel } from '../base-node/node-model';
import type {
  ExecutionContext,
  DataTableType,
  DataTableSpec,
  SettingsObject,
} from '@/lib/types';

export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains'
  | 'not contains'
  | 'starts with'
  | 'ends with'
  | 'is empty'
  | 'is not empty';

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string;
}

export class FilterNodeModel extends NodeModel {
  private conditions: FilterCondition[] = [];
  private logicalOperator: 'AND' | 'OR' = 'AND';

  constructor() {
    super(1, 1); // 1 input port, 1 output port
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (_inSpecs.length === 0) {
      return [];
    }
    return [_inSpecs[0]]; // Output has same spec as input
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

    this.conditions = [];
    const conditionCount = getNumber('conditionCount', 0);

    for (let i = 0; i < conditionCount; i++) {
      const condition: FilterCondition = {
        column: getString(`condition_${i}_column`, ''),
        operator: getString(
          `condition_${i}_operator`,
          '=',
        ) as FilterOperator,
        value: getString(`condition_${i}_value`, ''),
      };

      if (condition.column) {
        this.conditions.push(condition);
      }
    }

    this.logicalOperator = getString('logicalOperator', 'AND') as
      | 'AND'
      | 'OR';
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

  validateSettings(settings: SettingsObject): void {
    // Helper function with fallback logic
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };

    const conditionCount = getNumber('conditionCount', 0);
    if (conditionCount === 0) {
      throw new Error('At least one filter condition is required');
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
    const outputSpec = table.spec;
    const outputTable = ctx.createDataTable(outputSpec);

    let processedRows = 0;
    let filteredRows = 0;

    table.forEach((row) => {
      ctx.checkCanceled();

      if (this.matchesConditions(row, table)) {
        outputTable.addRow(row.key, row.cells);
        filteredRows++;
      }

      processedRows++;
      if (processedRows % 100 === 0) {
        ctx.setProgress(
          processedRows / table.size,
          `Filtered ${filteredRows} of ${processedRows} rows`,
        );
      }
    });

    ctx.setProgress(1, `Filtered ${filteredRows} of ${table.size} rows`);

    return [outputTable.close()];
  }

  private matchesConditions(row: any, table: DataTableType): boolean {
    if (this.conditions.length === 0) {
      return true;
    }

    const results = this.conditions.map((condition) =>
      this.evaluateCondition(row, table, condition),
    );

    return this.logicalOperator === 'AND'
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  private evaluateCondition(
    row: any,
    table: DataTableType,
    condition: FilterCondition,
  ): boolean {
    const columnIndex = table.spec.findColumnIndex(condition.column);
    if (columnIndex === -1) {
      return false;
    }

    const cell = row.cells[columnIndex];
    const cellValue = cell.getValue();

    // Handle empty/null checks
    if (condition.operator === 'is empty') {
      return cellValue === null || cellValue === undefined || cellValue === '';
    }
    if (condition.operator === 'is not empty') {
      return cellValue !== null && cellValue !== undefined && cellValue !== '';
    }

    // Convert values for comparison
    const compareValue = this.parseValue(condition.value, cell.type);

    switch (condition.operator) {
      case '=':
        return cellValue === compareValue;
      case '!=':
        return cellValue !== compareValue;
      case '>':
        return Number(cellValue) > Number(compareValue);
      case '>=':
        return Number(cellValue) >= Number(compareValue);
      case '<':
        return Number(cellValue) < Number(compareValue);
      case '<=':
        return Number(cellValue) <= Number(compareValue);
      case 'contains':
        return String(cellValue)
          .toLowerCase()
          .includes(String(compareValue).toLowerCase());
      case 'not contains':
        return !String(cellValue)
          .toLowerCase()
          .includes(String(compareValue).toLowerCase());
      case 'starts with':
        return String(cellValue)
          .toLowerCase()
          .startsWith(String(compareValue).toLowerCase());
      case 'ends with':
        return String(cellValue)
          .toLowerCase()
          .endsWith(String(compareValue).toLowerCase());
      default:
        return false;
    }
  }

  private parseValue(value: string, cellType: string): any {
    if (cellType === 'number') {
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    }
    if (cellType === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    return value;
  }

  getInputLabel(index: number): string | null {
    return index === 0 ? 'Data to filter' : null;
  }

  getOutputLabel(index: number): string | null {
    return index === 0 ? 'Filtered data' : null;
  }
}
