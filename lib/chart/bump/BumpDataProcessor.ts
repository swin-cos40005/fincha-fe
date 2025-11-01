import type { BumpChartConfig } from './BumpSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Bump Chart Data Processor
export function processBumpData(
  dataTable: DataTableType,
  config: BumpChartConfig,
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
            point.x !== 'unknown' && Number.isFinite(point.y) && point.y > 0, // Bump charts typically show rankings starting from 1
        ),
    }))
    .filter((series) => series.data.length > 0);
}

// Get required columns for bump chart
export function getRequiredColumns(config: BumpChartConfig): string[] {
  return [config.dataMapping.xColumn, ...config.dataMapping.seriesColumns];
}

// Validate DataTable for bump chart
export function validateCsvForBump(
  dataTable: DataTableType,
  config: BumpChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
