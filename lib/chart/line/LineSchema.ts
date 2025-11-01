import type {
  BaseChartConfig,
  AxisConfig,
  LegendConfig,
} from '../utils';

// Line Chart Configuration Interface
export interface LineChartConfig extends BaseChartConfig {
  chartType: 'line';

  // Data mapping - X values with multiple Y series
  dataMapping: {
    xColumn: string; // Column for X-axis values (e.g., "date", "time", "category")
    yColumns: string[]; // Columns for Y values/lines (e.g., ["sales", "profit", "revenue"])
    idColumn?: string; // Optional column for series IDs (e.g., "country", "region")
  };

  // Sorting configuration
  sorting?: {
    enabled?: boolean; // Whether to auto-sort data points
    direction?: 'asc' | 'desc'; // Sort direction (default: 'asc')
  };

  // Line-specific properties
  curve?:
    | 'basis'
    | 'cardinal'
    | 'catmullRom'
    | 'linear'
    | 'monotoneX'
    | 'monotoneY'
    | 'natural'
    | 'step'
    | 'stepAfter'
    | 'stepBefore';
  lineWidth?: number; // 1 to 10

  // Scales
  xScale?:
    | {
        type: 'linear';
        min?: number | 'auto';
        max?: number | 'auto';
        stacked?: boolean;
        reverse?: boolean;
      }
    | {
        type: 'point';
        padding?: number;
        reverse?: boolean;
      }
    | {
        type: 'time';
        min?: Date | 'auto';
        max?: Date | 'auto';
        useUTC?: boolean;
        precision?:
          | 'millisecond'
          | 'second'
          | 'minute'
          | 'hour'
          | 'day'
          | 'month'
          | 'year';
      };
  yScale?: {
    type: 'linear' | 'symlog';
    min?: number | 'auto';
    max?: number | 'auto';
    stacked?: boolean;
    reverse?: boolean;
  };

  // Points
  enablePoints?: boolean;
  pointSize?: number; // 4 to 20
  pointColor?: string;
  pointBorderWidth?: number; // 0 to 10
  pointBorderColor?: string;
  enablePointLabel?: boolean;
  pointLabel?: string;
  pointLabelYOffset?: number; // -12 to 12

  // Area under line
  enableArea?: boolean;
  areaOpacity?: number; // 0 to 1
  areaBaselineValue?: number; // Baseline for area fill

  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;
  gridXValues?: number[] | string[]; // Custom grid values
  gridYValues?: number[]; // Custom grid values

  // Crosshair
  enableCrosshair?: boolean;
  crosshairType?:
    | 'bottom-left'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'x'
    | 'y'
    | 'cross';
  enableTouchCrosshair?: boolean;

  // Axes
  axisTop?: AxisConfig | null;
  axisRight?: AxisConfig | null;
  axisBottom?: AxisConfig | null;
  axisLeft?: AxisConfig | null;

  // Legends
  legends?: LegendConfig[];

  // Layout and Performance
  layers?: string[]; // Chart layers to render
  pixelRatio?: number; // For canvas rendering
  renderWrapper?: boolean;

  // Interactivity
  isInteractive?: boolean;
  enableSlices?: 'x' | 'y' | false;
  debugSlices?: boolean;
  useMesh?: boolean;
  debugMesh?: boolean;

  // Animation and Motion
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow' | 'molasses';

  // Accessibility
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  isFocusable?: boolean;
  pointAriaLabel?: string;
  pointAriaLabelledBy?: string;
  pointAriaDescribedBy?: string;
  pointAriaHidden?: boolean;
  pointAriaDisabled?: boolean;

  // Tooltips
  tooltip?: {
    custom?: boolean;
    format?: string;
    render?: (point: any) => React.ReactNode;
  };

  // Markers
  markers?: Array<{
    axis: 'x' | 'y';
    value: number | string | Date;
    lineStyle?: {
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: string;
    };
    legend?: string;
  }>;

  // Initial state
  initialHiddenIds?: string[]; // Series IDs to hide initially

  // Real-time optimizations
  enableOptimizations?: boolean;
  skipAnimation?: boolean;
  reduceMotion?: boolean;
}

// Data mapping example for documentation
export const DATA_MAPPING_EXAMPLE = {
  description:
    'Line charts show trends over time or sequential data. Supports two data mapping approaches: 1) Multiple Y columns become separate line series, 2) Single Y column with ID column for series grouping.',
  example: {
    csvColumns: ['Month', 'Sales', 'Profit', 'Revenue', 'Costs', 'Country', 'Value'],
    dataMapping: {
      xColumn: 'Month',
      yColumns: ['Sales', 'Profit', 'Revenue'],
      idColumn: 'Country', // Optional: for grouped data
    },
    sorting: {
      enabled: true,
      direction: 'asc', // 'asc' for ascending, 'desc' for descending
    },
    description: 'Shows sales, profit, and revenue trends over months, or transportation values by country when using idColumn',
  },
};
