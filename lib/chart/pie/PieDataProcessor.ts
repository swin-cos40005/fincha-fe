import type { PieChartConfig } from './PieSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
  sortChartData,
} from '../utils';

// Pie Chart Data Processor
export function processPieData(
  dataTable: DataTableType,
  config: PieChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  )
    return [];

  let processedData = data
    .map((row, index) => ({
      id: cleanString(row[idColumn]) || `item-${index}`,
      label: cleanString(row[idColumn]) || `item-${index}`,
      value: toNumber(row[valueColumn]),
    }))
    .filter((item) => item.value > 0);

  // Sort by value if specified
  processedData = sortChartData(processedData, {
    enabled: config.sortByValue,
    direction: 'desc',
    sortBy: 'value'
  }, {
    valueColumns: ['value']
  });

  return processedData;
}

// Get required columns for pie chart
export function getRequiredColumns(config: PieChartConfig): string[] {
  return [config.dataMapping.idColumn, config.dataMapping.valueColumn];
}

// Validate DataTableType for pie chart
export function validateCsvForPie(
  dataTable: DataTableType,
  config: PieChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
