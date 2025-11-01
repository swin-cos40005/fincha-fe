// Scatter Chart Schema Definition
import type {
  BaseChartConfig,
  AxisConfig,
  LegendConfig,
} from '../utils';

export interface ScatterPlotConfig extends BaseChartConfig {
  chartType: 'scatter';

  // Data mapping - X/Y coordinates with grouping for different series
  dataMapping: {
    xColumn: string; // Column for X values (e.g., "height", "price")
    yColumn: string; // Column for Y values (e.g., "weight", "rating")
    seriesColumn?: string; // Column for grouping points into different series (e.g., "category", "species", "group")
    sizeColumn?: string; // Optional column for point size (e.g., "population", "sales")
  };

  // Scatter-specific properties
  nodeSize?: number | { from: number; to: number }; // 4 to 64 or dynamic range

  // Scales
  xScale?: {
    type: 'linear' | 'log' | 'symlog' | 'time';
    min?: number | 'auto';
    max?: number | 'auto';
  };
  yScale?: {
    type: 'linear' | 'log' | 'symlog' | 'time';
    min?: number | 'auto';
    max?: number | 'auto';
  };

  // Axes
  axisTop?: AxisConfig | null;
  axisRight?: AxisConfig | null;
  axisBottom?: AxisConfig | null;
  axisLeft?: AxisConfig | null;

  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;

  // Mesh (for better hover detection)
  useMesh?: boolean;
  debugMesh?: boolean;

  // Legends
  legends?: LegendConfig[];
}

export const DATA_MAPPING_EXAMPLE = {
  description:
    "For scatter plots, specify X and Y value columns. Use seriesColumn to create multiple series groups (like 'group A', 'group B', etc.)",
  example: {
    xColumn: 'x_value', // Use x_value for X-axis
    yColumn: 'y_value', // Use y_value for Y-axis
    seriesColumn: 'group_id', // Groups points into different series (e.g., "group A", "group B", "group C")
    sizeColumn: 'size_value', // Optional: make point size represent size_value
  },
};
