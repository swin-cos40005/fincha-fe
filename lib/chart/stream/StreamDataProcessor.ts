import type { StreamChartConfig } from './StreamSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Stream Chart Data Processor
export function processStreamData(
  dataTable: DataTableType,
  config: StreamChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, valueColumns } = config.dataMapping;

  if (!data.length || !headers.includes(xColumn)) return [];

  // Convert to stream format: array of objects with x and multiple y values
  return data
    .map((row) => {
      const streamPoint: any = {
        [xColumn]: cleanString(row[xColumn]) || 'unknown',
      };

      valueColumns
        .filter((col: string) => headers.includes(col))
        .forEach((col: string) => {
          streamPoint[col] = toNumber(row[col]);
        });

      return streamPoint;
    })
    .filter(
      (point) =>
        point[xColumn] !== 'unknown' &&
        valueColumns.some(
          (col: string) => Number.isFinite(point[col]) && point[col] >= 0,
        ),
    );
}

// Get required columns for stream chart
export function getRequiredColumns(config: StreamChartConfig): string[] {
  return [config.dataMapping.xColumn, ...config.dataMapping.valueColumns];
}

// Validate DataTableType for stream chart
export function validateCsvForStream(
  dataTable: DataTableType,
  config: StreamChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
