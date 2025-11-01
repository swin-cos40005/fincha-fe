import type { SunburstChartConfig } from './SunburstSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Sunburst Chart Data Processor
export function processSunburstData(
  dataTable: DataTableType,
  config: SunburstChartConfig,
): any {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  ) {
    return { name: 'root', children: [] };
  }

  // For now, create a simple flat structure
  // TODO: Implement proper hierarchical structure based on parentColumn
  const children = data
    .map((row, index) => ({
      name: cleanString(row[idColumn]) || `item-${index}`,
      value: toNumber(row[valueColumn]),
    }))
    .filter((item) => item.value > 0);

  return {
    name: 'root',
    children,
  };
}

// Get required columns for sunburst chart
export function getRequiredColumns(config: SunburstChartConfig): string[] {
  const columns = [config.dataMapping.idColumn, config.dataMapping.valueColumn];

  if (config.dataMapping.parentColumn) {
    columns.push(config.dataMapping.parentColumn);
  }

  if (config.dataMapping.categoryColumn) {
    columns.push(config.dataMapping.categoryColumn);
  }

  return columns;
}

// Validate DataTableType for sunburst chart
export function validateCsvForSunburst(
  dataTable: DataTableType,
  config: SunburstChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
