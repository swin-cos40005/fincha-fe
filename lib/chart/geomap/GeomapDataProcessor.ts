// Geomap Chart Data Processor
import type { GeomapChartConfig } from './GeomapSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Geomap Chart Data Processor
export function processGeomapData(
  dataTable: DataTableType,
  config: GeomapChartConfig,
): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { latitudeColumn, longitudeColumn, valueColumn, labelColumn, colorColumn } = config.dataMapping;

  if (!data.length || !headers.includes(latitudeColumn) || !headers.includes(longitudeColumn))
    return [];

  // Process data into the format expected by Nivo Geomap
  const processedData = data
    .map((row) => {
      const lat = toNumber(row[latitudeColumn]);
      const lng = toNumber(row[longitudeColumn]);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const dataPoint: any = {
        lat,
        lng,
      };

      // Add value if available (for point size/color)
      if (valueColumn && headers.includes(valueColumn)) {
        const value = toNumber(row[valueColumn]);
        if (Number.isFinite(value)) {
          dataPoint.value = value;
        }
      }

      // Add label if available
      if (labelColumn && headers.includes(labelColumn)) {
        const label = cleanString(row[labelColumn]);
        if (label) {
          dataPoint.label = label;
        }
      }

      // Add color if available
      if (colorColumn && headers.includes(colorColumn)) {
        const color = cleanString(row[colorColumn]);
        if (color) {
          dataPoint.color = color;
        }
      }

      return dataPoint;
    })
    .filter(Boolean);

  return processedData;
}

// Utility function to get required columns for geomap chart
export function getRequiredColumns(config: GeomapChartConfig): string[] {
  const columns: string[] = [];

  // Latitude and longitude columns are always required
  columns.push(config.dataMapping.latitudeColumn);
  columns.push(config.dataMapping.longitudeColumn);

  // Optional columns
  if (config.dataMapping.valueColumn) {
    columns.push(config.dataMapping.valueColumn);
  }
  if (config.dataMapping.labelColumn) {
    columns.push(config.dataMapping.labelColumn);
  }
  if (config.dataMapping.colorColumn) {
    columns.push(config.dataMapping.colorColumn);
  }

  return columns;
}

// Utility function to validate if DataTableType has required columns
export function validateCsvForGeomap(
  dataTable: DataTableType,
  config: GeomapChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
} 