export const NODE_DESCRIPTION = {
  shortDescription: 'Filters rows based on specified conditions',

  detailedDescription: {
    whatItDoes: `The Filter node selects rows from a data table based on one or more conditions. 
It allows you to create complex filters using multiple conditions combined with AND/OR logic. 
Common use cases include filtering sales data by date range, selecting customers from specific regions, 
or identifying records that meet certain criteria.`,

    howItWorks: `The node evaluates each row against the specified conditions:
    • For AND logic: All conditions must be true for a row to pass
    • For OR logic: At least one condition must be true for a row to pass
    • Supports various operators: equals, not equals, greater than, less than, contains, starts with, etc.
    • Can check for empty/null values
    • Automatically handles type conversions for comparisons`,

    inputsAndOutputs: {
      inputs: [
        {
          name: 'Data to filter',
          description: 'The input data table containing rows to be filtered',
        },
      ],
      outputs: [
        {
          name: 'Filtered data',
          description:
            'A new data table containing only rows that match the filter conditions',
        },
      ],
    },

    configuration: {
      conditions: {
        description: 'One or more filter conditions',
        options: [
          'Column: The column to evaluate',
          'Operator: The comparison operator (=, !=, >, <, contains, etc.)',
          'Value: The value to compare against (not needed for empty/not empty checks)',
        ],
      },
      logicalOperator: {
        description: 'How to combine multiple conditions',
        options: [
          'AND: All conditions must match',
          'OR: Any condition can match',
        ],
      },
    },

    examples: [
      {
        title: 'Filter sales above $1000',
        description: 'Column: amount, Operator: >, Value: 1000',
      },
      {
        title: 'Find customers from specific cities',
        description:
          'Column: city, Operator: =, Value: New York (with OR for multiple cities)',
      },
      {
        title: 'Remove rows with missing emails',
        description: 'Column: email, Operator: is not empty',
      },
    ],

    bestPractices: [
      'Use appropriate operators for the data type (numeric comparisons for numbers, contains for text)',
      'Be careful with case sensitivity in text comparisons',
      'Consider using "is empty" to find missing values before filtering',
      'Test filters with a small sample first to ensure expected results',
    ],
  },
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    conditionCount: {
      type: 'number',
      description: 'Number of filter conditions to apply',
      minimum: 1,
      default: 1
    },
    logicalOperator: {
      type: 'string',
      enum: ['AND', 'OR'],
      description: 'How to combine multiple filter conditions',
      default: 'AND'
    },
    conditions: {
      type: 'array',
      description: 'Array of filter conditions (dynamically generated based on conditionCount)',
      items: {
        type: 'object',
        properties: {
          column: {
            type: 'string',
            description: 'Column name to filter on'
          },
          operator: {
            type: 'string',
            enum: ['=', '!=', '>', '>=', '<', '<=', 'contains', 'not contains', 'starts with', 'ends with', 'is empty', 'is not empty'],
            description: 'Comparison operator for the filter condition'
          },
          value: {
            type: 'string',
            description: 'Value to compare against (not needed for empty/not empty checks)'
          }
        },
        required: ['column', 'operator']
      }
    }
  },
  required: ['conditionCount', 'logicalOperator'],
  additionalProperties: false
};