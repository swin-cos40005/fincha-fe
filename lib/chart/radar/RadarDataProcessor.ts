import type { RadarChartConfig } from './RadarSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Radar Chart Data Processor
export function processRadarData(
  dataTable: DataTableType,
  config: RadarChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { indexBy, valueColumns } = config.dataMapping;

  if (!data.length || !headers.includes(indexBy)) return [];

  return data
    .map((row, index) => {
      const result: any = {
        [indexBy]: cleanString(row[indexBy]) || `item-${index}`,
      };

      valueColumns.forEach((col) => {
        if (headers.includes(col)) {
          result[col] = toNumber(row[col]);
        }
      });

      return result;
    })
    .filter(
      (item) =>
        item && Object.values(item).some((v) => typeof v === 'number' && v > 0),
    );
}

// Get required columns for radar chart
export function getRequiredColumns(config: RadarChartConfig): string[] {
  return [config.dataMapping.indexBy, ...config.dataMapping.valueColumns];
}

// Validate DataTableType for radar chart
export function validateCsvForRadar(
  dataTable: DataTableType,
  config: RadarChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
