import type { LineChartConfig } from './LineSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  processXValue,
  validateDataTableColumns,
  sortChartData,
} from '../utils';

// Line Chart Data Processor
export function processLineData(
  dataTable: DataTableType,
  config: LineChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, yColumns, idColumn } = config.dataMapping;

  if (!data.length || !headers.includes(xColumn)) return [];

  const xScaleType = config.xScale?.type;
  const sortingEnabled = config.sorting?.enabled ?? true; // Default to enabled
  const sortDirection = config.sorting?.direction ?? 'asc'; // Default to ascending

  // If idColumn is specified, use it for series grouping
  if (idColumn && headers.includes(idColumn)) {
    return processLineDataWithIdColumn(dataTable, config);
  }

  // Original logic for multiple Y columns
  // Create a map to store all data points for sorting
  let allDataPoints: Array<{ x: any; yValues: Record<string, number> }> = [];

  // First pass: collect all unique x values and their corresponding y values
  data.forEach((row) => {
    const xValue = processXValue(row[xColumn], xScaleType);
    
    // Skip invalid x values
    if (
      xScaleType === 'time' &&
      xValue instanceof Date &&
      Number.isNaN(xValue.getTime())
    ) {
      return;
    }
    if (xScaleType === 'linear' && !Number.isFinite(xValue)) {
      return;
    }

    // Find existing data point or create new one
    let dataPoint = allDataPoints.find((point) => {
      if (xScaleType === 'time') {
        return point.x instanceof Date && xValue instanceof Date && 
               point.x.getTime() === xValue.getTime();
      }
      return point.x === xValue;
    });

    if (!dataPoint) {
      dataPoint = { x: xValue, yValues: {} };
      allDataPoints.push(dataPoint);
    }

    // Add y values for this x value
    yColumns.forEach((yCol) => {
      if (headers.includes(yCol)) {
        const yValue = toNumber(row[yCol]);
        if (Number.isFinite(yValue)) {
          dataPoint.yValues[yCol] = yValue;
        }
      }
    });
  });

  // Sort data points if enabled
  allDataPoints = sortChartData(allDataPoints, {
    enabled: sortingEnabled,
    direction: sortDirection,
    sortBy: 'index'
  }, {
    xScaleType,
    indexColumn: 'x'
  });

  // Convert to series format
  return yColumns
    .filter((col) => headers.includes(col))
    .map((yCol) => ({
      id: cleanString(yCol),
      data: allDataPoints
        .map((point) => {
          const yValue = point.yValues[yCol];
          if (yValue === undefined || !Number.isFinite(yValue)) {
            return null;
          }
          return {
            x: point.x,
            y: yValue,
          };
        })
        .filter((point) => point !== null),
    }))
    .filter((series) => series.data.length > 0);
}

// New function to handle data with idColumn
function processLineDataWithIdColumn(
  dataTable: DataTableType,
  config: LineChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, yColumns, idColumn } = config.dataMapping;

  if (!idColumn || !headers.includes(idColumn)) return [];

  const xScaleType = config.xScale?.type;
  const sortingEnabled = config.sorting?.enabled ?? true;
  const sortDirection = config.sorting?.direction ?? 'asc';

  // Group data by ID column
  const seriesMap = new Map<string, Array<{ x: any; y: number }>>();

  data.forEach((row) => {
    const idValue = cleanString(row[idColumn]);
    const xValue = processXValue(row[xColumn], xScaleType);
    
    // Skip invalid x values
    if (
      xScaleType === 'time' &&
      xValue instanceof Date &&
      Number.isNaN(xValue.getTime())
    ) {
      return;
    }
    if (xScaleType === 'linear' && !Number.isFinite(xValue)) {
      return;
    }

    // Process Y values (should be a single column when using idColumn)
    const yColumn = yColumns[0]; // Use first Y column when idColumn is specified
    if (headers.includes(yColumn)) {
      const yValue = toNumber(row[yColumn]);
      if (Number.isFinite(yValue)) {
        if (!seriesMap.has(idValue)) {
          seriesMap.set(idValue, []);
        }
        seriesMap.get(idValue)!.push({ x: xValue, y: yValue });
      }
    }
  });

  // Convert to series format and sort each series
  return Array.from(seriesMap.entries())
    .map(([id, dataPoints]) => {
      // Sort data points if enabled
      let sortedData = dataPoints;
      if (sortingEnabled) {
        sortedData = sortChartData(dataPoints, {
          enabled: sortingEnabled,
          direction: sortDirection,
          sortBy: 'index'
        }, {
          xScaleType,
          indexColumn: 'x'
        });
      }

      return {
        id,
        data: sortedData,
      };
    })
    .filter((series) => series.data.length > 0);
}

// Get required columns for line chart
export function getRequiredColumns(config: LineChartConfig): string[] {
  const columns = [config.dataMapping.xColumn];
  
  if (config.dataMapping.idColumn) {
    // When using idColumn, we need xColumn, idColumn, and one yColumn
    columns.push(config.dataMapping.idColumn);
    if (config.dataMapping.yColumns.length > 0) {
      columns.push(config.dataMapping.yColumns[0]);
    }
  } else {
    // Original logic: xColumn + all yColumns
    columns.push(...config.dataMapping.yColumns);
  }
  
  return columns;
}

// Validate DataTableType for line chart
export function validateCsvForLine(
  dataTable: DataTableType,
  config: LineChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
