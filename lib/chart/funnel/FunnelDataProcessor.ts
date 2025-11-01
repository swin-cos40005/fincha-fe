import type { FunnelChartConfig } from './FunnelSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Funnel Chart Data Processor
export function processFunnelData(
  dataTable: DataTableType,
  config: FunnelChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn, labelColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  )
    return [];

  return data
    .map((row) => ({
      id: cleanString(row[idColumn]),
      label:
        labelColumn && headers.includes(labelColumn)
          ? cleanString(row[labelColumn])
          : cleanString(row[idColumn]),
      value: toNumber(row[valueColumn]),
    }))
    .filter((item) => item.value > 0) // Filter out non-positive values
    .sort((a, b) => b.value - a.value); // Sort descending by value for funnel effect
}

// Get required columns for funnel chart
export function getRequiredColumns(config: FunnelChartConfig): string[] {
  const columns = [config.dataMapping.idColumn, config.dataMapping.valueColumn];
  if (config.dataMapping.labelColumn) {
    columns.push(config.dataMapping.labelColumn);
  }
  return columns;
}

// Validate DataTableType for funnel chart
export function validateCsvForFunnel(
  dataTable: DataTableType,
  config: FunnelChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
