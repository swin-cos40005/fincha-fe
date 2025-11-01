import type { HeatmapChartConfig } from './HeatmapSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Heatmap Chart Data Processor
export function processHeatmapData(
  dataTable: DataTableType,
  config: HeatmapChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, yColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(xColumn) ||
    !headers.includes(yColumn) ||
    !headers.includes(valueColumn)
  )
    return [];

  return data
    .map((row) => ({
      x: cleanString(row[xColumn]) || 'unknown',
      y: cleanString(row[yColumn]) || 'unknown',
      v: toNumber(row[valueColumn]),
    }))
    .filter(
      (point) =>
        point.x !== 'unknown' &&
        point.y !== 'unknown' &&
        Number.isFinite(point.v),
    );
}

// Get required columns for heatmap chart
export function getRequiredColumns(config: HeatmapChartConfig): string[] {
  return [
    config.dataMapping.xColumn,
    config.dataMapping.yColumn,
    config.dataMapping.valueColumn,
  ];
}

// Validate DataTableType for heatmap chart
export function validateCsvForHeatmap(
  dataTable: DataTableType,
  config: HeatmapChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
