/**
 * Group & Aggregate Node - Data Grouping and Aggregation
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Groups data by specified columns and performs aggregation operations (sum, average, count, min, max, first, last) on other columns.',

  /**
   * Node Schema for AI Agent Configuration
   */
  NODE_SCHEMA: {
    type: 'object',
    properties: {
      group_columns: {
        type: 'array',
        description: 'Array of column names to group data by',
        items: {
          type: 'string',
          description: 'Name of the column to group by'
        },
        minItems: 1
      },
      aggregations: {
        type: 'array',
        description: 'Array of aggregation operations to perform',
        items: {
          type: 'object',
          properties: {
            columnName: {
              type: 'string',
              description: 'Name of the column to aggregate'
            },
            method: {
              type: 'string',
              enum: ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'FIRST', 'LAST'],
              description: 'Aggregation method to apply'
            },
            newColumnName: {
              type: 'string',
              description: 'Name for the aggregated result column'
            }
          },
          required: ['columnName', 'method', 'newColumnName']
        },
        minItems: 1
      }
    },
    required: ['group_columns', 'aggregations'],
    additionalProperties: false
  },

  /**
   * Configuration Attributes
   */
  configuration: {
    group_columns: {
      description: 'List of column names to group data by',
      type: 'string[]',
      purpose:
        'Defines which columns are used to create groups (similar to SQL GROUP BY)',
      example:
        "['Department', 'Region'] - groups all rows with same department and region together",
      required: true,
    },

    aggregations: {
      description: 'List of aggregation operations to perform',
      type: 'ColumnAggregation[]',
      purpose: 'Specifies which columns to aggregate and how',
      structure: {
        columnName: 'Name of the column to aggregate',
        method:
          'Aggregation method (SUM, AVERAGE, MIN, MAX, COUNT, FIRST, LAST)',
        newColumnName: 'Name for the aggregated result column',
      },
      example:
        "Aggregate 'Sales' column using SUM method, output as 'Total_Sales'",
      required: true,
    },

    inPorts: {
      description: 'Number of input connections (always 1)',
      type: 'number',
      purpose: 'Accepts one input data table to group and aggregate',
      value: 1,
    },

    outPorts: {
      description: 'Number of output connections (always 1)',
      type: 'number',
      purpose: 'Outputs the grouped and aggregated data table',
      value: 1,
    },
  },

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes: `
      The Group & Aggregate node performs data grouping and statistical aggregation operations on tabular data. 
      It groups rows that have the same values in specified columns, then applies aggregation functions 
      (like sum, average, count) to other columns within each group. This is equivalent to SQL's GROUP BY functionality.
    `,

    whenToUse: `
      Use this node when you need to:
      • Calculate totals, averages, or counts by category
      • Summarize large datasets by grouping similar records
      • Create summary reports from detailed transaction data
      • Perform statistical analysis on grouped data
      • Reduce data volume by aggregating details into summaries
      • Calculate KPIs and metrics by dimensions (time, region, product, etc.)
    `,

    keyFeatures: [
      'Multiple aggregation methods: SUM, AVERAGE, MIN, MAX, COUNT, FIRST, LAST',
      'Support for multiple group-by columns',
      'Multiple aggregations can be performed simultaneously',
      'Custom naming for aggregated result columns',
      'Progress tracking for large datasets',
      'Automatic type handling for aggregated values',
      'Memory-efficient grouping algorithm',
    ],

    aggregationMethods: {
      SUM: 'Adds up all numeric values in the group',
      AVERAGE: 'Calculates the mean of all numeric values',
      MIN: 'Finds the minimum value in the group',
      MAX: 'Finds the maximum value in the group',
      COUNT: 'Counts the number of rows in each group',
      FIRST: 'Takes the first value encountered in the group',
      LAST: 'Takes the last value encountered in the group',
    },

    dataFlow: [
      '1. Input data table is received',
      '2. Data is grouped by specified columns',
      '3. For each group, aggregation functions are applied',
      '4. Results are collected into a new table',
      '5. Output table contains group columns + aggregated columns',
    ],

    useCases: [
      'Sales reporting: Total sales by region and product category',
      'Financial analysis: Average transaction amounts by customer type',
      'Website analytics: Page views count by day and traffic source',
      'Inventory management: Stock levels by warehouse and product',
      'Survey analysis: Response counts by demographics',
      'Performance metrics: Min/Max/Average response times by service',
      'Data summarization: Converting detailed logs to summary statistics',
    ],

    examples: [
      {
        scenario: 'Sales Summary',
        groupBy: "['Region', 'Product']",
        aggregations:
          'Sales → SUM (Total_Sales), Quantity → COUNT (Orders_Count)',
        result:
          'Summary showing total sales and order count for each region-product combination',
      },
      {
        scenario: 'Customer Analytics',
        groupBy: "['Customer_Type']",
        aggregations:
          'Purchase_Amount → AVERAGE (Avg_Purchase), Customer_ID → COUNT (Customer_Count)',
        result: 'Average purchase amount and customer count by customer type',
      },
    ],
  },
} as const;
