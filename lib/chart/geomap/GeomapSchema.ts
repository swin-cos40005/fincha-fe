import type { BaseChartConfig, LegendConfig } from '../utils';
import type { GeoProjectionType } from '@nivo/geo';
// Geomap Chart Configuration Interface
export interface GeomapChartConfig extends BaseChartConfig {
  chartType: 'geomap';

  // Data mapping - Geographic point data
  dataMapping: {
    latitudeColumn: string; // Column for latitude values (e.g., "lat", "latitude")
    longitudeColumn: string; // Column for longitude values (e.g., "lng", "longitude")
    valueColumn?: string; // Optional column for point size/color values (e.g., "population", "magnitude")
    labelColumn?: string; // Optional column for point labels
    colorColumn?: string; // Optional column for point colors
  };

  // Geographic properties
  features: any[]; // GeoJSON features for the map background
  projectionType?: GeoProjectionType;
  projectionRotation?: [number, number, number]; // [lambda, phi, gamma]
  projectionScale?: number; // Zoom level
  projectionCenter?: [number, number]; // [longitude, latitude]

  // Point properties
  pointSize?: number | { from: number; to: number }; // 4 to 64 or dynamic range
  pointColor?: string; // Default point color
  pointBorderWidth?: number; // 0 to 10
  pointBorderColor?: string;

  // Map properties
  unknownColor?: string; // Color for missing/unknown data
  domain?: [number, number]; // Value domain for color scale

  // Boundaries
  enableGraticule?: boolean; // Show latitude/longitude grid
  borderWidth?: number; // 0 to 10
  borderColor?: string;

  // Legends
  legends?: LegendConfig[];
}

// Data mapping example for documentation
export const DATA_MAPPING_EXAMPLE = {
  description:
    'Geomap charts display geographic point data on a map, perfect for showing locations, events, or spatial distributions.',
  example: {
    csvColumns: ['Latitude', 'Longitude', 'Population', 'City_Name'],
    dataMapping: {
      latitudeColumn: 'Latitude',
      longitudeColumn: 'Longitude',
      valueColumn: 'Population',
      labelColumn: 'City_Name',
    },
    description: 'Shows cities as points on a world map with size representing population',
  },
}; 