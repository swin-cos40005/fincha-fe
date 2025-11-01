import type { BoxPlotChartConfig } from './BoxPlotSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Helper function to calculate box plot statistics
function calculateStats(values: number[]): any | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const median =
    sorted.length % 2 === 0
      ? (sorted[Math.floor(sorted.length / 2) - 1] +
          sorted[Math.floor(sorted.length / 2)]) /
        2
      : sorted[Math.floor(sorted.length / 2)];

  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const min = Math.max(sorted[0], q1 - 1.5 * iqr);
  const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr);

  // Outliers are values outside 1.5 * IQR
  const outliers = sorted.filter((v) => v < min || v > max);

  return {
    min,
    q1,
    median,
    q3,
    max,
    outliers: outliers.length > 0 ? outliers : undefined,
  };
}

// Box Plot Chart Data Processor
export function processBoxPlotData(
  dataTable: DataTableType,
  config: BoxPlotChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { groupBy, value, subGroup } = config.dataMapping;

  if (!data.length || !headers.includes(groupBy) || !headers.includes(value))
    return [];

  // Group data by groupBy column and optionally by subGroup
  const groupedData: Record<string, number[]> = {};

  data.forEach((row) => {
    const groupKey = cleanString(row[groupBy]);
    const valueNum = toNumber(row[value]);

    if (Number.isFinite(valueNum)) {
      const finalKey =
        subGroup && headers.includes(subGroup)
          ? `${groupKey} - ${cleanString(row[subGroup])}`
          : groupKey;

      if (!groupedData[finalKey]) {
        groupedData[finalKey] = [];
      }
      groupedData[finalKey].push(valueNum);
    }
  });

  // Calculate statistics for each group
  return Object.entries(groupedData)
    .map(([group, values]) => {
      const stats = calculateStats(values);
      if (!stats) return null;

      return {
        group,
        ...stats,
      };
    })
    .filter(Boolean);
}

// Get required columns for box plot chart
export function getRequiredColumns(config: BoxPlotChartConfig): string[] {
  const columns = [config.dataMapping.groupBy, config.dataMapping.value];
  if (config.dataMapping.subGroup) {
    columns.push(config.dataMapping.subGroup);
  }
  return columns;
}

// Validate DataTableType for box plot chart
export function validateCsvForBoxPlot(
  dataTable: DataTableType,
  config: BoxPlotChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
