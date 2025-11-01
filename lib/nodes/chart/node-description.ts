export const NODE_DESCRIPTION = {
  shortDescription:
    'Creates interactive charts from data tables with customizable styling and configuration options.',

  detailedDescription: {
    whatItDoes: `The Chart Node is a powerful visualization component that transforms tabular data into interactive charts. It accepts a DataTable as input and provides extensive configuration options for creating professional charts suitable for dashboards and reports.

Key Features:
• Support for multiple chart types (bar, line, scatter, pie, heatmap, radar, etc.)
• Interactive column mapping with dropdown selection
• Real-time chart preview during configuration
• Extensive styling and customization options
• Dashboard integration for displaying charts
• Data processing options (sorting, filtering, limiting)
• Export capabilities for charts

Input Requirements:
• One DataTable input containing the data to visualize
• Data should have at least one column for meaningful visualization

Configuration Options:
• Chart type selection (scatter, bar, line, pie, heatmap, radar, etc.)
• Column mapping for X-axis, Y-axis, and series grouping
• Chart title and description
• Color schemes and styling options
• Axis configuration and labels
• Legend positioning and formatting
• Data processing options (sort, limit, filter)

Output:
• Configured chart visualization ready for dashboard display
• Chart configuration metadata for persistence
• Processed data optimized for the selected chart type

Use Cases:
• Creating business intelligence dashboards
• Data exploration and analysis
• Report generation with visual components
• Interactive data presentations
• Monitoring and KPI visualization`,

    inputsAndOutputs: `
**Input Port:**
- **Port 1**: DataTable containing the data to be visualized

**Output:**
- Chart visualization component ready for dashboard display
- Chart configuration metadata
- Processed chart data

**Data Flow:**
1. Receives DataTable input
2. User configures chart type and column mappings
3. Processes data according to chart requirements
4. Generates chart visualization
5. Outputs chart to dashboard system`,

    configurationInstructions: `
**Basic Configuration:**
1. Select the desired chart type from the dropdown
2. Map data columns to chart axes (X, Y, Series)
3. Configure chart title and description
4. Preview the chart in real-time

**Advanced Configuration:**
1. Customize colors and styling
2. Configure axes properties (labels, scales, formatting)
3. Set up legends and tooltips
4. Apply data processing options (sorting, filtering)
5. Configure interactive features

**Column Mapping:**
- **X-axis Column**: The independent variable or category column
- **Y-axis Column**: The dependent variable or value column (usually numeric)
- **Series Column**: Optional grouping column for multiple data series

**Chart Types:**
- **Bar Chart**: Compare categories or show distributions
- **Line Chart**: Show trends over time or continuous data
- **Scatter Plot**: Show correlations between two variables
- **Pie Chart**: Show proportions or percentages
- **Heatmap**: Show data density or correlation matrices
- **Radar Chart**: Compare multiple variables across categories`,

    examples: `
**Example 1: Sales Performance Chart**
- Input: Sales data with columns: Month, Revenue, Product_Category
- Configuration: Line chart with Month (X-axis), Revenue (Y-axis), Product_Category (Series)
- Result: Multi-line chart showing revenue trends by product category

**Example 2: Customer Demographics**
- Input: Customer data with columns: Age_Group, Count, Gender
- Configuration: Bar chart with Age_Group (X-axis), Count (Y-axis), Gender (Series)
- Result: Grouped bar chart showing customer distribution

**Example 3: Performance Correlation**
- Input: Performance metrics with columns: Score_A, Score_B, Department
- Configuration: Scatter plot with Score_A (X-axis), Score_B (Y-axis), Department (Series)
- Result: Scatter plot showing correlation between two performance metrics

**Example 4: Market Share Analysis**
- Input: Market data with columns: Company, Market_Share
- Configuration: Pie chart with Company (Category), Market_Share (Value)
- Result: Pie chart showing market share distribution`,
  },
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    chartType: {
      type: 'string',
      enum: [
        'scatter', 'bar', 'line', 'pie', 'heatmap', 'radar', 'areaBump', 
        'calendar', 'chord', 'circlePacking', 'sankey', 'boxplot', 'bump', 
        'bullet', 'funnel', 'stream', 'sunburst', 'waffle', 'network', 
        'radialbar', 'swarmplot', 'treemap', 'voronoi'
      ],
      description: 'Type of chart to create',
      default: 'scatter'
    },
    title: {
      type: 'string',
      description: 'Chart title displayed above the visualization',
      default: 'Chart Visualization'
    },
    description: {
      type: 'string',
      description: 'Optional description for the chart',
      default: ''
    },
    dataMapping: {
      type: 'object',
      description: 'Column mapping configuration for the chart',
      properties: {
        // Primary data columns - most common mappings
        xColumn: {
          type: 'string',
          description: 'Column for X-axis values (categories, time, numeric) (for scatter, line, heatmap, areaBump, bump, stream, voronoi)'
        },
        yColumn: {
          type: 'string', 
          description: 'Column for Y-axis values (usually numeric) (for scatter, heatmap, voronoi)'
        },
        yColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple columns for Y-axis values (multiple series) (for line)'
        },
        
        // Alternative naming patterns for different chart types
        indexBy: {
          type: 'string',
          description: 'Column for categories/labels (for bar, radar)'
        },
        valueColumn: {
          type: 'string',
          description: 'Column for values (for pie, heatmap, calendar, bar, radar, sankey, chord, circlePacking, sunburst, treemap, waffle, voronoi)'
        },
        valueColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple value columns (for bar, radar, stream, bump)'
        },
        
        // Grouping and series
        seriesColumn: {
          type: 'string',
          description: 'Column for grouping data into series (for scatter)'
        },
        seriesColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Multiple series columns (for bump, areaBump)'
        },
        groupBy: {
          type: 'string',
          description: 'Column for grouping data (for boxplot, swarmplot)'
        },
        
        // Categorical data
        idColumn: {
          type: 'string',
          description: 'Column for identifiers/labels (for pie, treemap, bullet, waffle, sunburst, circlePacking, voronoi)'
        },
        categoryColumn: {
          type: 'string',
          description: 'Column for categories (for circlePacking, sunburst)'
        },
        
        // Relationship data (network charts)
        sourceColumn: {
          type: 'string',
          description: 'Column for source nodes (for sankey, chord, network)'
        },
        targetColumn: {
          type: 'string',
          description: 'Column for target nodes (for sankey, chord, network) or target values (for bullet)'
        },
        
        // Hierarchical data
        parentColumn: {
          type: 'string',
          description: 'Column for parent relationships (for treemap, sunburst, circlePacking)'
        },
        
        // Time-based data
        dateColumn: {
          type: 'string',
          description: 'Column containing dates (for calendar)'
        },
        
        // Special purpose columns
        sizeColumn: {
          type: 'string',
          description: 'Column for sizing elements (for scatter, swarmplot, network)'
        },
        
        // Bullet chart specific
        actualColumn: {
          type: 'string',
          description: 'Column for actual values (for bullet)'
        },
        rangeColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns for range values (for bullet)'
        }
      },
      additionalProperties: false
    },
    processingOptions: {
      type: 'object',
      properties: {
        sortBy: {
          type: 'string',
          description: 'Column name to sort data by before visualization'
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order for data processing',
          default: 'asc'
        },
        limitRows: {
          type: 'number',
          description: 'Maximum number of rows to process',
          default: 1000,
          minimum: 1
        }
      }
    },
  },
  required: ['chartType'],
  additionalProperties: false
} as const;