import type { NodeMetadata } from '@/lib/types';

export const SorterNodeDescription: NodeMetadata = {
  id: 'sorter',
  name: 'Sorter',
  category: 'Data Transformation',
  keywords: ['sort', 'order', 'arrange', 'ascending', 'descending', 'rank'],
  image: '/images/nodes/sorter.svg',
};

export const NODE_DESCRIPTION = {
  shortDescription: 'Sorts data rows by specified columns in ascending or descending order',

  /**
   * Node Schema for AI Agent Configuration
   */
  NODE_SCHEMA: {
    type: 'object',
    properties: {
      sort_columns: {
        type: 'array',
        description: 'Array of column sorting configurations',
        items: {
          type: 'object',
          properties: {
            columnName: {
              type: 'string',
              description: 'Name of the column to sort by'
            },
            direction: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              description: 'Sort direction (ascending or descending)'
            }
          },
          required: ['columnName', 'direction']
        },
        minItems: 1
      }
    },
    required: ['sort_columns'],
    additionalProperties: false
  },

  detailedDescription: {
    whatItDoes: 'The Sorter node arranges data rows in a specific order based on one or more columns. It supports both ascending and descending sort orders and can sort by multiple columns in sequence.',
    
    whenToUse: [
      'Organizing data for better readability and analysis',
      'Preparing data for time-series analysis',
      'Creating ranked lists or leaderboards',
      'Ensuring consistent data ordering for downstream processing',
      'Sorting by multiple criteria (e.g., department then salary)'
    ],

    keyFeatures: [
      'Multi-column sorting with priority order',
      'Ascending and descending sort options',
      'Automatic type-aware sorting (numbers, dates, strings)',
      'Handles null/undefined values gracefully',
      'Case-insensitive string sorting'
    ],

    examples: [
      {
        title: 'Sort by date ascending',
        description: 'sort_columns: [{columnName: "date", direction: "ASC"}]'
      },
      {
        title: 'Sort by department then salary descending',
        description: 'sort_columns: [{columnName: "department", direction: "ASC"}, {columnName: "salary", direction: "DESC"}]'
      }
    ]
  }
};
