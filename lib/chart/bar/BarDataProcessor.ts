import type { BarChartConfig } from './BarSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
  sortChartData,
} from '../utils';

// Bar Chart Data Processor
export function processBarData(
  dataTable: DataTableType,
  config: BarChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { indexBy, valueColumns } = config.dataMapping;

  if (!data.length || !headers.includes(indexBy)) return [];

  const sortingEnabled = config.sorting?.enabled ?? true; // Default to enabled
  const sortDirection = config.sorting?.direction ?? 'asc'; // Default to ascending
  const sortBy = config.sorting?.sortBy ?? 'index'; // Default to sorting by index
  const sortValueColumn = config.sorting?.valueColumn;

  // Process data into bar format
  let barData = data
    .map((row, index) => {
      const result: any = {
        [indexBy]: cleanString(row[indexBy]) || `item-${index}`,
      };

      valueColumns.forEach((col) => {
        if (headers.includes(col)) {
          result[col] = toNumber(row[col]);
        }
      });

      return result;
    })
    .filter(
      (item) =>
        item && Object.values(item).some((v) => typeof v === 'number' && v > 0),
    );

  // Sort data if enabled
  barData = sortChartData(barData, {
    enabled: sortingEnabled,
    direction: sortDirection,
    sortBy,
    valueColumn: sortValueColumn
  }, {
    indexColumn: indexBy,
    valueColumns
  });

  return barData;
}

// Get required columns for bar chart
export function getRequiredColumns(config: BarChartConfig): string[] {
  const columns: string[] = [];
  columns.push(config.dataMapping.indexBy);
  columns.push(...config.dataMapping.valueColumns);
  return columns;
}

// Validate DataTableType for bar chart
export function validateCsvForBar(
  dataTable: DataTableType,
  config: BarChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
