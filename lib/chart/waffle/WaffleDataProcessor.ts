import type { WaffleChartConfig } from './WaffleSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Waffle Chart Data Processor
export function processWaffleData(
  dataTable: DataTableType,
  config: WaffleChartConfig,
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
      label: cleanString(row[idColumn]) || `category-${index}`,
      value: toNumber(row[valueColumn]),
    }))
    .filter((item) => item.value > 0); // Only include positive values
}

// Get required columns for waffle chart
export function getRequiredColumns(config: WaffleChartConfig): string[] {
  return [config.dataMapping.idColumn, config.dataMapping.valueColumn];
}

// Validate DataTableType for waffle chart
export function validateCsvForWaffle(
  dataTable: DataTableType,
  config: WaffleChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
