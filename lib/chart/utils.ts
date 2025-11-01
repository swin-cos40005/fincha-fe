// Chart Library Utilities - Server-safe functions
// This file contains utility functions, shared schemas, and data processing utilities

import type { ChartType } from './types';
import type { DataTableType } from '../types';

// =============================================================================
// SHARED BASE SCHEMAS (moved from shared/BaseSchemas.ts)
// =============================================================================

export interface BaseChartConfig {
  // Chart identification
  title: string;
  description?: string;

  // Layout and dimensions
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };

  // Theme and styling
  theme?: 'light' | 'dark' | 'custom';
  colors?: {
    scheme?:
      | 'nivo'
      | 'category10'
      | 'accent'
      | 'dark2'
      | 'paired'
      | 'pastel1'
      | 'pastel2'
      | 'set1'
      | 'set2'
      | 'set3';
    customColors?: string[];
  };

  // Animation
  animate?: boolean;
  motionConfig?:
    | 'default'
    | 'gentle'
    | 'wobbly'
    | 'stiff'
    | 'slow'
    | 'molasses';
}

export interface AxisConfig {
  tickSize?: number; // 0 to 20
  tickPadding?: number; // 0 to 20
  tickRotation?: number; // -90 to 90
  legend?: string;
  legendPosition?: 'start' | 'middle' | 'end';
  legendOffset?: number; // -60 to 60
  truncateTickAt?: number; // 0 to 20
}

export interface LegendConfig {
  anchor:
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left'
    | 'top-left'
    | 'center';
  direction: 'row' | 'column';
  justify?: boolean;
  translateX?: number; // -200 to 200
  translateY?: number; // -200 to 200
  itemsSpacing?: number; // 0 to 60
  itemWidth?: number; // 10 to 200
  itemHeight?: number; // 10 to 200
  itemDirection?:
    | 'left-to-right'
    | 'right-to-left'
    | 'top-to-bottom'
    | 'bottom-to-top';
  itemOpacity?: number; // 0 to 1
  symbolSize?: number; // 2 to 60
  symbolShape?: 'circle' | 'diamond' | 'square' | 'triangle';
}

export interface DataTransformInstruction {
  chartType: string;
  mapping: Record<string, string>;
  description: string;
}

// =============================================================================
// SHARED DATA PROCESSING UTILITIES (moved from shared/DataTableUtils.ts)
// =============================================================================

// Convert DataTableType to array of objects for easy processing
export function parseDataTable(dataTable: DataTableType): {
  headers: string[];
  data: Record<string, any>[];
} {
  if (!dataTable || dataTable.size === 0) {
    return { headers: [], data: [] };
  }

  const spec = dataTable.spec;
  const headers = spec.columns.map((col) => col.name);
  const data: Record<string, any>[] = [];

  dataTable.forEach((row) => {
    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      const cell = row.cells[index];
      rowData[header] = cell ? cell.getValue() : null;
    });
    data.push(rowData);
  });

  return { headers, data };
}

// Get column headers from DataTableType
export function getDataTableHeaders(dataTable: DataTableType): string[] {
  if (!dataTable || dataTable.size === 0) {
    return [];
  }
  return dataTable.spec.columns.map((col) => col.name);
}

// Helper function to convert values to numbers
export function toNumber(value: any): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && !Number.isNaN(value) ? value : 0;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  const cleaned = String(value).trim();
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') {
    return 0;
  }
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) && !Number.isNaN(num) ? num : 0;
}

// Helper function to clean string values
export function cleanString(value: any): string {
  if (value === null || value === undefined) {
    return 'Unknown';
  }
  const cleaned = String(value).trim();
  return cleaned || 'Unknown';
}

// Helper function to convert values to Date for time scales
export function toDate(value: any): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const cleaned = String(value).trim();
  if (cleaned === '' || cleaned === 'null' || cleaned === 'undefined') {
    return null;
  }

  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Helper function to process X values based on scale type
export function processXValue(value: any, xScaleType?: string): any {
  if (xScaleType === 'time') {
    const date = toDate(value);
    return date || new Date();
  }

  if (xScaleType === 'linear') {
    const num = toNumber(value);
    return Number.isFinite(num) ? num : 0;
  }

  return cleanString(value);
}

/**
 * Configuration interface for chart data sorting
 */
export interface SortConfig {
  /** Whether sorting is enabled (default: true) */
  enabled?: boolean;
  /** Sort direction - ascending or descending (default: 'asc') */
  direction?: 'asc' | 'desc';
  /** Sort by index/category or by value (default: 'index') */
  sortBy?: 'index' | 'value';
  /** Specific value column to sort by when sortBy is 'value' */
  valueColumn?: string;
}

/**
 * Reusable sorting function for chart data
 * 
 * This function provides a unified way to sort chart data across different chart types.
 * It supports sorting by index/category (alphabetically, numerically, or by date) 
 * or by values (total or specific column).
 * 
 * @param data - Array of data objects to sort
 * @param config - Sorting configuration
 * @param options - Additional options for sorting behavior
 * @returns Sorted array of data objects
 * 
 * @example
 * // Sort by index (category) in ascending order
 * const sorted = sortChartData(data, {
 *   enabled: true,
 *   direction: 'asc',
 *   sortBy: 'index'
 * }, {
 *   indexColumn: 'x',
 *   xScaleType: 'linear'
 * });
 * 
 * @example
 * // Sort by value in descending order
 * const sorted = sortChartData(data, {
 *   enabled: true,
 *   direction: 'desc',
 *   sortBy: 'value'
 * }, {
 *   valueColumns: ['y1', 'y2']
 * });
 */
export function sortChartData<T extends Record<string, any>>(
  data: T[],
  config: SortConfig,
  options: {
    /** Scale type for x-axis ('time', 'linear', or undefined for string) */
    xScaleType?: string;
    /** Column name to use as index/category for sorting */
    indexColumn?: string;
    /** Array of value column names for value-based sorting */
    valueColumns?: string[];
  } = {}
): T[] {
  const {
    enabled = true,
    direction = 'asc',
    sortBy = 'index',
    valueColumn
  } = config;

  const { xScaleType, indexColumn, valueColumns = [] } = options;

  if (!enabled || data.length === 0) {
    return data;
  }

  return data.sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'value') {
      // Sort by total value or specific value column
      let valueA = 0;
      let valueB = 0;

      if (valueColumn && valueColumns.includes(valueColumn)) {
        // Sort by specific value column
        valueA = a[valueColumn] || 0;
        valueB = b[valueColumn] || 0;
      } else {
        // Sort by total of all value columns
        valueA = valueColumns.reduce((sum, col) => sum + (a[col] || 0), 0);
        valueB = valueColumns.reduce((sum, col) => sum + (b[col] || 0), 0);
      }

      comparison = valueA - valueB;
    } else {
      // Sort by index/category
      const keyA = indexColumn ? a[indexColumn] : Object.keys(a)[0];
      const keyB = indexColumn ? b[indexColumn] : Object.keys(b)[0];

      if (xScaleType === 'time') {
        // Sort dates
        const dateA = keyA instanceof Date ? keyA.getTime() : 0;
        const dateB = keyB instanceof Date ? keyB.getTime() : 0;
        comparison = dateA - dateB;
      } else if (xScaleType === 'linear') {
        // Sort numbers
        const numA = typeof keyA === 'number' ? keyA : 0;
        const numB = typeof keyB === 'number' ? keyB : 0;
        comparison = numA - numB;
      } else {
        // Sort strings alphabetically
        const strA = String(keyA).toLowerCase();
        const strB = String(keyB).toLowerCase();
        comparison = strA.localeCompare(strB);
      }
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}

// Validate that required columns exist in DataTableType
export function validateDataTableColumns(
  dataTable: DataTableType,
  requiredColumns: string[],
): {
  valid: boolean;
  missingColumns: string[];
  availableColumns: string[];
} {
  const headers = getDataTableHeaders(dataTable);
  const missingColumns = requiredColumns.filter(
    (col) => !headers.includes(col),
  );

  return {
    valid: missingColumns.length === 0,
    missingColumns,
    availableColumns: headers,
  };
}

// =============================================================================
// CHART TYPE UTILITIES
// =============================================================================

// Get available chart types (all converted chart types)
export function getAvailableChartTypes(): ChartType[] {
  return [
    'scatter',
    'bar',
    'line',
    'pie',
    'heatmap',
    'radar',
    'areaBump',
    'calendar',
    'chord',
    'circlePacking',
    'sankey',
    'boxplot',
    'bump',
    'bullet',
    'funnel',
    'stream',
    'sunburst',
    'waffle',
    'network',
    'radialbar',
    'swarmplot',
    'treemap',
    'voronoi',
    'choropleth',
    'geomap',
  ];
}

export function isChartTypeSupported(chartType: ChartType) {
  return getAvailableChartTypes().includes(chartType);
}

// =============================================================================
// DATA MAPPING EXAMPLES (using schema imports for single source of truth)
// =============================================================================

// Import data mapping examples from individual chart schemas
import { DATA_MAPPING_EXAMPLE as ScatterDataMappingExample } from './scatter/ScatterSchema';
import { DATA_MAPPING_EXAMPLE as BarDataMappingExample } from './bar/BarSchema';
import { DATA_MAPPING_EXAMPLE as LineDataMappingExample } from './line/LineSchema';
import { DATA_MAPPING_EXAMPLE as PieDataMappingExample } from './pie/PieSchema';
import { DATA_MAPPING_EXAMPLE as HeatmapDataMappingExample } from './heatmap/HeatmapSchema';
import { DATA_MAPPING_EXAMPLE as RadarDataMappingExample } from './radar/RadarSchema';
import { DATA_MAPPING_EXAMPLE as AreaBumpDataMappingExample } from './areaBump/AreaBumpSchema';
import { DATA_MAPPING_EXAMPLE as CalendarDataMappingExample } from './calendar/CalendarDataProcessor';
import { DATA_MAPPING_EXAMPLE as ChordDataMappingExample } from './chord/ChordSchema';
import { DATA_MAPPING_EXAMPLE as CirclePackingDataMappingExample } from './circlePacking/CirclePackingSchema';
import { DATA_MAPPING_EXAMPLE as SankeyDataMappingExample } from './sankey/SankeySchema';
import { DATA_MAPPING_EXAMPLE as BoxPlotDataMappingExample } from './boxplot/BoxPlotSchema';
import { DATA_MAPPING_EXAMPLE as BumpDataMappingExample } from './bump/BumpSchema';
import { DATA_MAPPING_EXAMPLE as BulletDataMappingExample } from './bullet/BulletSchema';
import { DATA_MAPPING_EXAMPLE as FunnelDataMappingExample } from './funnel/FunnelSchema';
import { DATA_MAPPING_EXAMPLE as StreamDataMappingExample } from './stream/StreamSchema';
import { DATA_MAPPING_EXAMPLE as SunburstDataMappingExample } from './sunburst/SunburstSchema';
import { DATA_MAPPING_EXAMPLE as WaffleDataMappingExample } from './waffle/WaffleSchema';
import { DATA_MAPPING_EXAMPLE as NetworkDataMappingExample } from './network/NetworkSchema';
import { DATA_MAPPING_EXAMPLE as RadialBarDataMappingExample } from './radialbar/RadialBarSchema';
import { DATA_MAPPING_EXAMPLE as SwarmplotDataMappingExample } from './swarmplot/SwarmplotSchema';
import { DATA_MAPPING_EXAMPLE as TreemapDataMappingExample } from './treemap/TreemapSchema';
import { DATA_MAPPING_EXAMPLE as VoronoiDataMappingExample } from './voronoi/VoronoiSchema';
import { DATA_MAPPING_EXAMPLE as ChoroplethDataMappingExample } from './choropleth/ChoroplethSchema';
import { DATA_MAPPING_EXAMPLE as GeomapDataMappingExample } from './geomap/GeomapSchema';

// Data mapping examples for each chart type - now sourced from individual schemas
export function getDataMappingExamples(): Record<
  string,
  { description: string; example: Record<string, any> }
> {
  return {
    scatter: ScatterDataMappingExample,
    bar: BarDataMappingExample,
    line: LineDataMappingExample,
    pie: PieDataMappingExample,
    heatmap: HeatmapDataMappingExample,
    radar: RadarDataMappingExample,
    areaBump: AreaBumpDataMappingExample,
    calendar: CalendarDataMappingExample,
    chord: ChordDataMappingExample,
    circlePacking: CirclePackingDataMappingExample,
    sankey: SankeyDataMappingExample,
    boxplot: BoxPlotDataMappingExample,
    bump: BumpDataMappingExample,
    bullet: BulletDataMappingExample,
    funnel: FunnelDataMappingExample,
    stream: StreamDataMappingExample,
    sunburst: SunburstDataMappingExample,
    waffle: WaffleDataMappingExample,
    network: NetworkDataMappingExample,
    radialbar: RadialBarDataMappingExample,
    swarmplot: SwarmplotDataMappingExample,
    treemap: TreemapDataMappingExample,
    voronoi: VoronoiDataMappingExample,
    choropleth: ChoroplethDataMappingExample,
    geomap: GeomapDataMappingExample,
  };
}

// =============================================================================
// REUSABLE CHART PROCESSING UTILITIES
// =============================================================================

// Generic data processor factory - creates a standardized processor for any chart type
export function createChartDataProcessor<TConfig extends BaseChartConfig>(
  processFn: (dataTable: DataTableType, config: TConfig) => any[],
  getRequiredColumnsFn: (config: TConfig) => string[],
) {
  return {
    process: processFn,
    getRequiredColumns: getRequiredColumnsFn,
    validate: (dataTable: DataTableType, config: TConfig) => {
      const requiredColumns = getRequiredColumnsFn(config);
      return validateDataTableColumns(dataTable, requiredColumns);
    },
  };
}

// Generic chart registry entry type
export interface ChartRegistryEntry<TConfig extends BaseChartConfig> {
  chartType: ChartType;
  process: (dataTable: DataTableType, config: TConfig) => any[];
  validate: (dataTable: DataTableType, config: TConfig) => {
    valid: boolean;
    missingColumns: string[];
    availableColumns: string[];
  };
  getRequiredColumns: (config: TConfig) => string[];
  dataMappingExample: {
    description: string;
    example: Record<string, any>;
  };
}

// Helper to create a standardized chart registry entry
export function createChartRegistryEntry<TConfig extends BaseChartConfig>(
  chartType: ChartType,
  processFn: (dataTable: DataTableType, config: TConfig) => any[],
  getRequiredColumnsFn: (config: TConfig) => string[],
  dataMappingExample: { description: string; example: Record<string, any> },
): ChartRegistryEntry<TConfig> {
  const processor = createChartDataProcessor(processFn, getRequiredColumnsFn);
  
  return {
    chartType,
    process: processor.process,
    validate: processor.validate,
    getRequiredColumns: processor.getRequiredColumns,
    dataMappingExample,
  };
}

// =============================================================================
// COLUMN-MAPPING UTILITIES (shared with node dialogs, processors, etc.)
// =============================================================================

export interface ColumnConfigMinimal {
  /** Human-readable label generated from the field name. */
  label: string;
  /** Whether the field expects multiple columns (array) rather than a single column string. */
  multiple?: boolean;
}

export type ChartColumnMappings = {
  [K in ChartType]: Record<string, ColumnConfigMinimal>;
};

// Build column-mapping definitions from the DATA_MAPPING_EXAMPLE objects so we
// only have a single source of truth. The examples already list every expected
// key that the chart's processors expect.
const CHART_COLUMN_MAPPINGS: ChartColumnMappings = (() => {
  const examples = getDataMappingExamples();
  const result: Partial<ChartColumnMappings> = {};

  (Object.keys(examples) as ChartType[]).forEach((chartType) => {
    const ex = examples[chartType];
    if (!ex) return;

    // Some examples nest the mapping under `dataMapping`.
    const exampleMapping: Record<string, any> =
      (ex.example as any).dataMapping ?? (ex.example as any);

    if (!exampleMapping || typeof exampleMapping !== 'object') return;

    const fieldConfigs: Record<string, ColumnConfigMinimal> = {};

    Object.entries(exampleMapping).forEach(([key, value]) => {
      fieldConfigs[key] = {
        label: key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (c) => c.toUpperCase()),
        multiple: Array.isArray(value),
      };
    });

    result[chartType] = fieldConfigs;
  });

  return result as ChartColumnMappings;
})();

// Public helpers -------------------------------------------------------------

/**
 * Retrieve the mapping definition for a specific chart type.
 */
export function getColumnMappingConfig(
  chartType: ChartType,
): Record<string, ColumnConfigMinimal> {
  return CHART_COLUMN_MAPPINGS[chartType] || {};
}

/**
 * Very light validation — ensures at least one mapping entry has a non-empty
 * value. More sophisticated validation (e.g. required fields) should live in
 * the individual chart processors.
 */
export function isDataMappingProvided(
  dataMapping: Record<string, string | string[]>,
): boolean {
  return Object.values(dataMapping).some((val) =>
    Array.isArray(val) ? val.length > 0 : typeof val === 'string' && val.length > 0,
  );
}
