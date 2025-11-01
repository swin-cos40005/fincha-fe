import type { BaseChartConfig, LegendConfig } from '../utils';
import type { GeoProjectionType } from '@nivo/geo';

// Choropleth Chart Configuration Interface
export interface ChoroplethChartConfig extends BaseChartConfig {
  chartType: 'choropleth';

  // Data mapping - Geographic data
  dataMapping: {
    idColumn: string; // Column for geographic IDs (e.g., "country_code", "state_id", "region")
    valueColumn: string; // Column for values to color-code (e.g., "population", "gdp", "cases")
    labelColumn?: string; // Optional column for labels
  };

  // Geographic properties
  features: any[]; // GeoJSON features for the map
  projectionType?: GeoProjectionType; // Default: 'equalEarth'
  projectionRotation?: [number, number, number]; // [lambda, phi, gamma] - Default: [0, 0, 0]
  projectionScale?: number; // Zoom level - Default: 147
  projectionTranslation?: [number, number]; // Translation - Default: [0, 0]
  
  // Choropleth-specific properties
  unknownColor?: string; // Color for missing/unknown data - Default: '#666666'
  domain?: [number, number]; // Value domain for color scale

  // Boundaries
  enableGraticule?: boolean; // Show latitude/longitude grid - Default: false
  borderWidth?: number; // 0 to 10 - Default: 0.5
  borderColor?: string; // Default: '#152538'

  // Legends
  legends?: LegendConfig[];
}

// Data mapping example for documentation
export const DATA_MAPPING_EXAMPLE = {
  description:
    'Choropleth charts display geographic data with regions colored by data values, perfect for showing spatial patterns and distributions. This implementation matches the Nivo example with optimized defaults.',
  example: {
    csvColumns: ['Country_Code', 'Population', 'Country_Name'],
    dataMapping: {
      idColumn: 'Country_Code',
      valueColumn: 'Population',
      labelColumn: 'Country_Name',
    },
    description: 'Shows population data colored by country on a world map with Equal Earth projection',
  },
  defaults: {
    projectionType: 'equalEarth',
    projectionScale: 147,
    borderWidth: 0.5,
    borderColor: '#152538',
    unknownColor: '#666666',
    enableGraticule: false,
  },
};
