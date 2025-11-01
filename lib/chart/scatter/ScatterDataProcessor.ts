// Scatter Plot Data Processor
import type { ScatterPlotConfig } from './ScatterSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Scatter Plot Data Processor
export function processScatterData(
  dataTable: DataTableType,
  config: ScatterPlotConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { seriesColumn, xColumn, yColumn, sizeColumn } = config.dataMapping;

  if (!data.length || !headers.includes(xColumn) || !headers.includes(yColumn))
    return [];

  // If no series column, create a single series
  if (!seriesColumn || !headers.includes(seriesColumn)) {
    const points = data
      .map((row) => {
        const x = toNumber(row[xColumn]);
        const y = toNumber(row[yColumn]);

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const point: any = { x, y };

        if (sizeColumn && headers.includes(sizeColumn)) {
          const size = toNumber(row[sizeColumn]);
          if (Number.isFinite(size) && size > 0) {
            point.size = size;
          }
        }

        return point;
      })
      .filter(Boolean);

    return points.length > 0
      ? [
          {
            id: 'data',
            data: points,
          },
        ]
      : [];
  }

  // Group by series column - this is the main fix
  const seriesMap: Record<string, any[]> = {};

  data.forEach((row) => {
    const seriesId = cleanString(row[seriesColumn]) || 'default';
    const x = toNumber(row[xColumn]);
    const y = toNumber(row[yColumn]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    if (!seriesMap[seriesId]) {
      seriesMap[seriesId] = [];
    }

    const point: any = { x, y };

    if (sizeColumn && headers.includes(sizeColumn)) {
      const size = toNumber(row[sizeColumn]);
      if (Number.isFinite(size) && size > 0) {
        point.size = size;
      }
    }

    seriesMap[seriesId].push(point);
  });

  // Convert to the required format: array of { id: string, data: Array<{x, y}> }
  return Object.entries(seriesMap)
    .filter(([, points]) => points.length > 0)
    .map(([seriesId, points]) => ({
      id: seriesId,
      data: points,
    }));
}

// Utility function to get required columns for scatter plot
export function getRequiredColumns(config: ScatterPlotConfig): string[] {
  const columns: string[] = [];

  // X and Y columns are always required
  columns.push(config.dataMapping.xColumn);
  columns.push(config.dataMapping.yColumn);

  // Series column is required for proper grouping
  if (config.dataMapping.seriesColumn) {
    columns.push(config.dataMapping.seriesColumn);
  }

  // Size column is optional
  if (config.dataMapping.sizeColumn) {
    columns.push(config.dataMapping.sizeColumn);
  }

  return columns;
}

// Utility function to validate if DataTableType has required columns
export function validateCsvForScatter(
  dataTable: DataTableType,
  config: ScatterPlotConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
