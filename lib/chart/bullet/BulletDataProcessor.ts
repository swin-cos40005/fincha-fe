import type { BulletChartConfig } from './BulletSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Bullet Chart Data Processor
export function processBulletData(
  dataTable: DataTableType,
  config: BulletChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, actualColumn, targetColumn, rangeColumns } =
    config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(actualColumn)
  )
    return [];

  return data
    .map((row, index) => {
      const bullet: any = {
        id: cleanString(row[idColumn]) || `metric-${index}`,
        measures: [toNumber(row[actualColumn])],
      };

      // Add target marker if column exists
      if (targetColumn && headers.includes(targetColumn)) {
        const target = toNumber(row[targetColumn]);
        if (target > 0) {
          bullet.markers = [target];
        }
      }

      // Add qualitative ranges if columns exist
      if (rangeColumns && rangeColumns.length > 0) {
        const ranges: number[] = [];
        rangeColumns.forEach((col) => {
          if (headers.includes(col)) {
            const value = toNumber(row[col]);
            if (value > 0) {
              ranges.push(value);
            }
          }
        });
        if (ranges.length > 0) {
          bullet.ranges = ranges;
        }
      }

      return bullet;
    })
    .filter((item) => item.measures[0] > 0); // Only include items with positive actual values
}

// Get required columns for bullet chart
export function getRequiredColumns(config: BulletChartConfig): string[] {
  const columns = [
    config.dataMapping.idColumn,
    config.dataMapping.actualColumn,
  ];

  if (config.dataMapping.targetColumn) {
    columns.push(config.dataMapping.targetColumn);
  }

  if (config.dataMapping.rangeColumns) {
    columns.push(...config.dataMapping.rangeColumns);
  }

  return columns;
}

// Validate DataTableType for bullet chart
export function validateCsvForBullet(
  dataTable: DataTableType,
  config: BulletChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
