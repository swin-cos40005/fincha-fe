import type { NodeMetadata } from '../../types';
import { RouteIcon } from '@/components/icons';

export const JoinerNodeDescription: NodeMetadata = {
  id: 'joiner',
  name: 'Table Joiner',
  category: 'Data Processing',
  icon: RouteIcon,
  keywords: [
    'join',
    'merge',
    'combine',
    'table',
    'inner',
    'left',
    'right',
    'full',
  ],
};

export const NODE_DESCRIPTION = {
  shortDescription: 'Joins two or three data tables based on common columns using various join types',
  detailedDescription: {
    whatItDoes: 'The Table Joiner node combines data from multiple tables based on matching values in specified columns. It supports various join types and can handle up to three input tables.',
    joinTypes: {
      INNER: 'Only includes rows where join columns match in both tables',
      LEFT: 'Includes all rows from the left table, with matching rows from the right table',
      RIGHT: 'Includes all rows from the right table, with matching rows from the left table',
      FULL: 'Includes all rows from both tables, with nulls where there are no matches'
    },
    whenToUse: [
      'Combining customer data with order data',
      'Merging product information with sales records',
      'Linking employee data with department information',
      'Creating comprehensive datasets from multiple sources',
      'Building data warehouses from operational databases'
    ],
    keyFeatures: [
      'Support for 2-3 input tables',
      'Multiple join types (INNER, LEFT, RIGHT, FULL)',
      'Configurable column prefixes to avoid naming conflicts',
      'Efficient hash-based join algorithms',
      'Progress tracking for large datasets'
    ],
    examples: [
      {
        title: 'Inner join customers and orders',
        description: 'join_1_2: {leftColumn: "customer_id", rightColumn: "customer_id", joinType: "INNER"}'
      },
      {
        title: 'Left join with department info',
        description: 'join_1_2: {leftColumn: "dept_id", rightColumn: "id", joinType: "LEFT"}'
      }
    ]
  }
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    join_1_2: {
      type: 'object',
      description: 'Join configuration between first and second tables',
      properties: {
        leftColumn: {
          type: 'string',
          description: 'Column name from the first table for joining'
        },
        rightColumn: {
          type: 'string',
          description: 'Column name from the second table for joining'
        },
        joinType: {
          type: 'string',
          enum: ['INNER', 'LEFT', 'RIGHT', 'FULL'],
          description: 'Type of join to perform',
          default: 'INNER'
        }
      },
      required: ['leftColumn', 'rightColumn', 'joinType']
    },
    join_1_3: {
      type: 'object',
      description: 'Join configuration between first and third tables (optional)',
      properties: {
        leftColumn: {
          type: 'string',
          description: 'Column name from the first table for joining'
        },
        rightColumn: {
          type: 'string',
          description: 'Column name from the third table for joining'
        },
        joinType: {
          type: 'string',
          enum: ['INNER', 'LEFT', 'RIGHT', 'FULL'],
          description: 'Type of join to perform',
          default: 'INNER'
        }
      },
      required: ['leftColumn', 'rightColumn', 'joinType']
    },
    column_prefix_1: {
      type: 'string',
      description: 'Prefix for columns from the first table',
      default: 'T1_'
    },
    column_prefix_2: {
      type: 'string',
      description: 'Prefix for columns from the second table',
      default: 'T2_'
    },
    column_prefix_3: {
      type: 'string',
      description: 'Prefix for columns from the third table',
      default: 'T3_'
    }
  },
  required: ['join_1_2'],
  additionalProperties: false
};
