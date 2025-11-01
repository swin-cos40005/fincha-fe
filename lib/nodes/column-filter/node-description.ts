export const NODE_DESCRIPTION = {
  shortDescription: 'Selects or excludes specific columns from a data table',

  detailedDescription: {
    whatItDoes: `The Column Filter node allows you to select which columns to keep or exclude from your data table. 
This is useful for reducing data to only the relevant columns, removing sensitive information, 
or preparing data for specific analyses that require certain columns.`,

    howItWorks: `The node provides two filtering modes:
    • Keep mode: Only the selected columns will be retained in the output
    • Exclude mode: The selected columns will be removed from the output
    • All rows are preserved, only columns are filtered
    • Column order is maintained from the original table`,

    inputsAndOutputs: {
      inputs: [
        {
          name: 'Data with columns to filter',
          description: 'The input data table containing columns to be filtered',
        },
      ],
      outputs: [
        {
          name: 'Data with selected columns',
          description: 'A new data table containing only the filtered columns',
        },
      ],
    },

    configuration: {
      filterMode: {
        description: 'How to filter columns',
        options: [
          'Keep: Retain only selected columns',
          'Exclude: Remove selected columns',
        ],
      },
      columnSelection: {
        description: 'Columns to keep or exclude',
        options: [
          'Use checkboxes to select columns',
          'Select All button for convenience',
        ],
      },
    },

    examples: [
      {
        title: 'Keep only essential columns',
        description: 'Select customer_id, name, and email in Keep mode',
      },
      {
        title: 'Remove sensitive data',
        description: 'Select SSN, credit_card in Exclude mode',
      },
      {
        title: 'Prepare for analysis',
        description: 'Keep only numeric columns for statistical analysis',
      },
    ],

    bestPractices: [
      'Review column types before filtering to ensure you keep necessary data',
      'Use Exclude mode when you need most columns and want to remove a few',
      'Use Keep mode when you only need specific columns',
      'Remember that filtering columns can break relationships if key columns are removed',
    ],
  },
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    filterMode: {
      type: 'string',
      enum: ['keep', 'exclude'],
      description: 'How to filter columns - keep only selected or exclude selected',
      default: 'keep'
    },
    selectedColumnCount: {
      type: 'number',
      description: 'Number of selected columns',
      minimum: 1,
      default: 1
    },
    selectedColumns: {
      type: 'array',
      description: 'Array of column names to keep or exclude (dynamically generated based on selectedColumnCount)',
      items: {
        type: 'string',
        description: 'Name of the column to include in filtering'
      },
      minItems: 1
    }
  },
  required: ['filterMode', 'selectedColumnCount'],
  additionalProperties: false
};
