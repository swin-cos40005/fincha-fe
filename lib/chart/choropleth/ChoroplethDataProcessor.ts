// Choropleth Chart Data Processor
import type { ChoroplethChartConfig } from './ChoroplethSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Choropleth Chart Data Processor
export function processChoroplethData(
  dataTable: DataTableType,
  config: ChoroplethChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn, labelColumn } = config.dataMapping;

  if (!data.length || !headers.includes(idColumn) || !headers.includes(valueColumn))
    return [];

  // Process data into the format expected by Nivo Choropleth
  const processedData = data
    .map((row) => {
      const id = cleanString(row[idColumn]);
      const value = toNumber(row[valueColumn]);

      if (!id || !Number.isFinite(value)) return null;

      const dataPoint: any = {
        id,
        value,
      };

      // Add label if available
      if (labelColumn && headers.includes(labelColumn)) {
        const label = cleanString(row[labelColumn]);
        if (label) {
          dataPoint.label = label;
        }
      }

      return dataPoint;
    })
    .filter(Boolean);

  return processedData;
}

// Utility function to get required columns for choropleth chart
export function getRequiredColumns(config: ChoroplethChartConfig): string[] {
  const columns: string[] = [];

  // ID and value columns are always required
  columns.push(config.dataMapping.idColumn);
  columns.push(config.dataMapping.valueColumn);

  // Label column is optional
  if (config.dataMapping.labelColumn) {
    columns.push(config.dataMapping.labelColumn);
  }

  return columns;
}

// Utility function to validate if DataTableType has required columns
export function validateCsvForChoropleth(
  dataTable: DataTableType,
  config: ChoroplethChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
} 