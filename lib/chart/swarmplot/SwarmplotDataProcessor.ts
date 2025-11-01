import type { SwarmplotChartConfig } from './SwarmplotSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Swarmplot Chart Data Processor
export function processSwarmplotData(
  dataTable: DataTableType,
  config: SwarmplotChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { groupBy, value, size } = config.dataMapping;

  if (!data.length || !headers.includes(groupBy) || !headers.includes(value))
    return [];

  return data
    .map((row, index) => {
      const point: any = {
        id:
          config.dataMapping.id && headers.includes(config.dataMapping.id)
            ? cleanString(row[config.dataMapping.id])
            : `point-${index}`,
        group: cleanString(row[groupBy]),
        value: toNumber(row[value]),
      };

      if (size && headers.includes(size)) {
        point.volume = toNumber(row[size]);
      }

      return point;
    })
    .filter((point) => Number.isFinite(point.value));
}

// Get required columns for swarmplot chart
export function getRequiredColumns(config: SwarmplotChartConfig): string[] {
  const columns = [config.dataMapping.groupBy, config.dataMapping.value];

  if (config.dataMapping.size) {
    columns.push(config.dataMapping.size);
  }
  if (config.dataMapping.id) {
    columns.push(config.dataMapping.id);
  }

  return columns;
}

// Validate DataTableType for swarmplot chart
export function validateCsvForSwarmplot(
  dataTable: DataTableType,
  config: SwarmplotChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
