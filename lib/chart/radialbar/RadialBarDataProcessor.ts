import type { RadialBarChartConfig } from './RadialBarSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Radial Bar Chart Data Processor
export function processRadialBarData(
  dataTable: DataTableType,
  config: RadialBarChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  )
    return [];

  return data
    .map((row, index) => ({
      id: cleanString(row[idColumn]) || `category-${index}`,
      value: toNumber(row[valueColumn]),
    }))
    .filter((item) => item.value > 0); // Only include positive values
}

// Get required columns for radial bar chart
export function getRequiredColumns(config: RadialBarChartConfig): string[] {
  return [config.dataMapping.idColumn, config.dataMapping.valueColumn];
}

// Validate DataTableType for radial bar chart
export function validateCsvForRadialBar(
  dataTable: DataTableType,
  config: RadialBarChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
