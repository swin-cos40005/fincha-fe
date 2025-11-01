import type { VoronoiChartConfig } from './VoronoiSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Voronoi Chart Data Processor
export function processVoronoiData(
  dataTable: DataTableType,
  config: VoronoiChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, yColumn, idColumn } = config.dataMapping;

  if (!data.length || !headers.includes(xColumn) || !headers.includes(yColumn))
    return [];

  return data
    .map((row, index) => ({
      id:
        idColumn && headers.includes(idColumn)
          ? cleanString(row[idColumn])
          : `point-${index}`,
      x: toNumber(row[xColumn]),
      y: toNumber(row[yColumn]),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

// Get required columns for voronoi chart
export function getRequiredColumns(config: VoronoiChartConfig): string[] {
  const columns = [config.dataMapping.xColumn, config.dataMapping.yColumn];
  if (config.dataMapping.idColumn) {
    columns.push(config.dataMapping.idColumn);
  }
  return columns;
}

// Validate DataTableType for voronoi chart
export function validateCsvForVoronoi(
  dataTable: DataTableType,
  config: VoronoiChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
