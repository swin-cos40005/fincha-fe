import type {
  BaseChartConfig,
  AxisConfig,
  LegendConfig,
} from '../utils';

// Enhanced Bar Chart Configuration Interface based on Nivo's official types
export interface BarChartConfig extends BaseChartConfig {
  chartType: 'bar';

  // Data mapping - Categories with multiple values
  dataMapping: {
    indexBy: string; // Column for categories (e.g., "product", "month", "region")
    valueColumns: string[]; // Columns for numeric values (e.g., ["sales", "profit", "cost"])
  };

  // Sorting configuration
  sorting?: {
    enabled?: boolean; // Whether to auto-sort bars
    direction?: 'asc' | 'desc'; // Sort direction (default: 'asc')
    sortBy?: 'index' | 'value'; // Sort by category name or total value (default: 'index')
    valueColumn?: string; // Which value column to use when sortBy is 'value'
  };

  // Layout and grouping
  layout?: 'horizontal' | 'vertical';
  groupMode?: 'grouped' | 'stacked';
  reverse?: boolean; // Reverse the chart direction

  // Spacing and dimensions
  padding?: number; // 0 to 1 - spacing between groups
  innerPadding?: number; // 0 to 20 - spacing between bars in a group

  // Value scale configuration
  valueScale?: {
    type: 'linear' | 'symlog';
    min?: number | 'auto';
    max?: number | 'auto';
    stacked?: boolean;
    reverse?: boolean;
  };
  
  // Index scale configuration
  indexScale?: {
    type?: 'band';
    round?: boolean;
  };

  // Min/Max values (alternative to valueScale min/max)
  minValue?: 'auto' | number;
  maxValue?: 'auto' | number;

  // Bar styling
  borderRadius?: number; // 0 to 20 - corner radius of bars
  borderWidth?: number; // 0 to 10 - border thickness
  borderColor?: string | { from: string; modifiers?: any[] }; // Border color

  // Labels configuration
  enableLabel?: boolean;
  label?: 'value' | 'formattedValue' | string; // Label content
  labelPosition?: 'start' | 'middle' | 'end'; // Label position within bar
  labelOffset?: number; // -20 to 20 - label offset from position
  labelSkipWidth?: number; // 0 to 50 - skip labels if bar width < value
  labelSkipHeight?: number; // 0 to 50 - skip labels if bar height < value
  labelTextColor?: string
  labelFormat?: string; // Format string for labels

  // Grid lines
  enableGridX?: boolean;
  enableGridY?: boolean;
  gridXValues?: (string | number)[]; // Custom grid line positions
  gridYValues?: (string | number)[]; // Custom grid line positions

  // Axes configuration
  axisTop?: AxisConfig | null;
  axisRight?: AxisConfig | null;
  axisBottom?: AxisConfig | null;
  axisLeft?: AxisConfig | null;

  // Legends
  legends?: BarLegendConfig[];

  // Interactivity
  isInteractive?: boolean; // Enable/disable interactivity
  
  // Color configuration
  colorBy?: 'id' | 'indexValue'; // How to assign colors
  
  // Totals display
  enableTotals?: boolean; // Show total values on stacked bars
  totalsOffset?: number; // -50 to 50 - offset for total labels

  // Value formatting
  valueFormat?: string | ((value: number) => string); // Format function for values
  tooltipLabel?: string | ((datum: any) => string); // Tooltip label accessor
  legendLabel?: string | ((datum: any) => string); // Legend label accessor

  // Initial state
  initialHiddenIds?: (string | number)[]; // Initially hidden data series

  // Accessibility
  role?: string; // ARIA role
  ariaLabel?: string; // ARIA label
  ariaLabelledBy?: string; // ARIA labelledby
  ariaDescribedBy?: string; // ARIA describedby
  isFocusable?: boolean; // Whether chart is focusable
}

// Enhanced Legend Configuration for Bar Charts
export interface BarLegendConfig extends LegendConfig {
  dataFrom?: 'indexes' | 'keys'; // What data to use for legend
}

// Data mapping example for documentation
export const DATA_MAPPING_EXAMPLE = {
  description:
    'Bar charts display categorical data with rectangular bars. Each category (indexBy) can have multiple values (valueColumns) shown as grouped or stacked bars. Bars can be automatically sorted by category name or values.',
  example: {
    csvColumns: ['Product', 'Q1_Sales', 'Q2_Sales', 'Q3_Sales', 'Q4_Sales'],
    dataMapping: {
      indexBy: 'Product',
      valueColumns: ['Q1_Sales', 'Q2_Sales', 'Q3_Sales', 'Q4_Sales'],
    },
    sorting: {
      enabled: true,
      direction: 'desc', // 'asc' for ascending, 'desc' for descending
      sortBy: 'value', // 'index' for alphabetical, 'value' for by total sales
      valueColumn: 'Q4_Sales', // Optional: sort by specific quarter
    },
    description:
      'Shows quarterly sales by product, sorted by total sales in descending order',
  },
};
