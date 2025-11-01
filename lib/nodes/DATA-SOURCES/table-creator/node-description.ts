/**
 * Table Creator Node - Manual Table Creation
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Create tables manually by defining columns and entering data row by row through an interactive interface.',

  /**
   * Configuration Attributes
   */
  configuration: {
    columns: {
      description: 'List of column definitions for the table',
      type: 'ColumnDefinition[]',
      purpose:
        'Defines the structure of your table with column names and data types',
      structure: {
        name: 'Column name (must be unique)',
        type: "Data type: 'string', 'number', or 'date'",
      },
      example: 'Name (string), Age (number), Birth Date (date)',
      required: true,
    },

    rows: {
      description: 'Array of data rows with values for each column',
      type: 'RowData[]',
      purpose: 'Contains the actual data values for your table',
      example: "{'Name': 'John', 'Age': 25, 'Birth Date': '1998-01-15'}",
      required: false,
    },

    inPorts: {
      description: 'Number of input connections (always 0)',
      type: 'number',
      purpose: 'This is a source node - creates data from user input',
      value: 0,
    },

    outPorts: {
      description: 'Number of output connections (always 1)',
      type: 'number',
      purpose: 'Outputs the manually created table',
      value: 1,
    },
  },

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes: `
      The Table Creator node allows users to manually create structured data tables through an interactive interface.
      Users can define columns with specific data types (text, numbers, dates) and then enter data row by row.
      This is perfect for creating small datasets, test data, or when you need to input data that doesn't exist in files.
    `,

    whenToUse: `
      Use this node when you need to:
      • Create small datasets manually for testing or demonstrations
      • Input reference data that doesn't exist in external files
      • Create lookup tables or configuration data
      • Build sample datasets for prototyping workflows
      • Enter survey responses or form data manually
      • Create master data tables (categories, regions, etc.)
      • Input data that needs to be typed in manually
    `,

    keyFeatures: [
      'Interactive column definition with data type selection',
      'Support for text, number, and date column types',
      'Row-by-row data entry with appropriate input controls',
      'Real-time preview of the table structure and data',
      'Add/remove columns and rows dynamically',
      'Data type validation and conversion',
      'Unique column name validation',
      'Export data as structured DataTableType for other nodes',
    ],

    dataTypes: {
      string: 'Text values - names, descriptions, categories, etc.',
      number: 'Numeric values - quantities, amounts, scores, measurements',
      date: 'Date values - timestamps, birth dates, deadlines, etc.',
    },

    userInterface: [
      'Column Definition Section: Add columns with names and types',
      'Data Entry Grid: Interactive table for entering row data',
      'Column Management: Add/remove columns with data preservation',
      'Row Management: Add/remove individual rows',
      'Live Preview: See your table structure as you build it',
    ],

    dataFlow: [
      '1. User defines table columns with names and data types',
      '2. User enters data row by row through the interface',
      '3. Data is validated according to column types',
      '4. Table structure and data are saved to node settings',
      '5. Structured DataTableType is output for downstream processing',
    ],

    useCases: [
      'Product catalog creation for small inventories',
      'Employee directory for small teams',
      'Configuration tables for application settings',
      'Test data creation for development and QA',
      'Survey response collection for small studies',
      'Reference data creation (country codes, categories)',
      'Price lists and rate tables',
      'Contact lists and directory information',
      'Status tracking tables for project management',
    ],

    tips: [
      'Define all columns before entering data to avoid restructuring',
      'Use descriptive column names that clearly indicate the data purpose',
      'Choose appropriate data types to enable proper downstream processing',
      'For dates, use standard formats (YYYY-MM-DD) for consistency',
      'Keep table size reasonable - use CSV import for large datasets',
    ],
  },
} as const;

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    headers: {
      type: 'array',
      description: 'Array of column names for the table',
      items: {
        type: 'string',
        description: 'Name of the column'
      },
      minItems: 1
    },
    cells: {
      type: 'array',
      description: '2D array of cell values (rows x columns)',
      items: {
        type: 'array',
        items: {
          oneOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'null' }
          ]
        }
      }
    },
    gridSize: {
      type: 'object',
      description: 'Grid dimensions for the table',
      properties: {
        rows: {
          type: 'number',
          description: 'Number of rows in the grid',
          minimum: 0
        },
        cols: {
          type: 'number',
          description: 'Number of columns in the grid',
          minimum: 0
        }
      },
      required: ['rows', 'cols']
    }
  },
  required: ['headers'],
  additionalProperties: false
};
