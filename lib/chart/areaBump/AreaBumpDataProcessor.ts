import type { AreaBumpChartConfig } from './AreaBumpSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Area Bump Chart Data Processor
export function processAreaBumpData(
  dataTable: DataTableType,
  config: AreaBumpChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, seriesColumns } = config.dataMapping;

  if (!data.length || !headers.includes(xColumn)) return [];

  return seriesColumns
    .filter((col) => headers.includes(col))
    .map((seriesCol) => ({
      id: cleanString(seriesCol),
      data: data
        .map((row) => ({
          x: cleanString(row[xColumn]) || 'unknown',
          y: toNumber(row[seriesCol]),
        }))
        .filter(
          (point) =>
            point.x !== 'unknown' && Number.isFinite(point.y) && point.y >= 0, // Area bump requires non-negative values
        ),
    }))
    .filter((series) => series.data.length > 0);
}

// Get required columns for area bump chart
export function getRequiredColumns(config: AreaBumpChartConfig): string[] {
  return [config.dataMapping.xColumn, ...config.dataMapping.seriesColumns];
}

// Validate DataTableType for area bump chart
export function validateCsvForAreaBump(
  dataTable: DataTableType,
  config: AreaBumpChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
