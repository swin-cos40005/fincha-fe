/**
 * Missing Values Node - Data Cleaning and Imputation
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Handle missing values in data using statistical methods (mean, median, most frequent) or row removal strategies.',

  /**
   * Configuration Attributes
   */
  configuration: {
    default_method: {
      description:
        'Default method for handling missing values across all columns',
      type: 'MissingValueMethod',
      purpose:
        'Defines the fallback strategy when no column-specific configuration exists',
      options: [
        'MEAN - Replace with average (numbers only)',
        'MEDIAN - Replace with median value (numbers only)',
        'MOST_FREQUENT - Replace with most common value (all types)',
        'REMOVE_ROWS - Delete entire rows containing missing values',
      ],
      default: 'MOST_FREQUENT',
      required: true,
    },

    column_configs: {
      description: 'Column-specific missing value handling configurations',
      type: 'ColumnMissingValueConfig[]',
      purpose:
        'Override default method for specific columns based on their data type and characteristics',
      structure: {
        columnName: 'Name of the column to configure',
        method:
          'Specific method for this column (MEAN, MEDIAN, MOST_FREQUENT, REMOVE_ROWS)',
      },
      example:
        "Configure 'Age' column to use MEAN, 'Status' column to use MOST_FREQUENT",
      required: false,
    },

    inPorts: {
      description: 'Number of input connections (always 1)',
      type: 'number',
      purpose: 'Accepts one input data table that may contain missing values',
      value: 1,
    },

    outPorts: {
      description: 'Number of output connections (always 1)',
      type: 'number',
      purpose: 'Outputs the cleaned data table with missing values handled',
      value: 1,
    },
  },

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes: `
      The Missing Values node identifies and handles missing, null, empty, or undefined values in data tables.
      It provides multiple strategies for dealing with missing data including statistical imputation 
      (mean, median) and categorical imputation (most frequent value). It can also remove rows entirely
      if they contain missing values in critical columns.
    `,

    whenToUse: `
      Use this node when you need to:
      • Clean datasets that contain missing, null, or empty values
      • Prepare data for analysis that requires complete datasets
      • Apply different imputation strategies based on column types
      • Remove incomplete records from datasets
      • Standardize missing value handling across data pipelines
      • Improve data quality before feeding into machine learning models
      • Handle survey data with non-responses or incomplete entries
    `,

    keyFeatures: [
      'Multiple imputation methods: mean, median, most frequent, row removal',
      'Column-specific configuration for tailored handling',
      'Automatic detection of missing values (null, undefined, empty strings)',
      'Statistical methods for numeric columns (mean, median)',
      'Categorical imputation for text columns (most frequent)',
      'Flexible default method with column-specific overrides',
      'Progress tracking for large datasets',
      'Preservation of original data types and structure',
    ],

    imputationMethods: {
      MEAN: {
        description: 'Replaces missing values with the arithmetic average',
        applicableTypes: ['number'],
        useCase: 'Good for normally distributed numeric data without outliers',
        example: 'Missing ages replaced with average age (e.g., 32.5 years)',
      },
      MEDIAN: {
        description:
          'Replaces missing values with the middle value when sorted',
        applicableTypes: ['number'],
        useCase:
          'Better for numeric data with outliers or skewed distributions',
        example:
          'Missing salaries replaced with median salary (less affected by high earners)',
      },
      MOST_FREQUENT: {
        description: 'Replaces missing values with the most common value',
        applicableTypes: ['string', 'number', 'date'],
        useCase:
          'Good for categorical data or when preserving existing patterns',
        example: "Missing departments replaced with 'Sales' (if most common)",
      },
      REMOVE_ROWS: {
        description: 'Removes entire rows that contain missing values',
        applicableTypes: ['all'],
        useCase: 'When missing data indicates invalid or incomplete records',
        example:
          'Remove customer records missing essential information like email or ID',
      },
    },

    dataFlow: [
      '1. Input data table is analyzed for missing values',
      '2. Missing value patterns are identified by column',
      '3. Replacement values are computed using configured methods',
      '4. For each row, missing values are replaced or rows are removed',
      '5. Clean data table is output with consistent value handling',
    ],

    useCases: [
      'Survey data cleaning: Handle non-responses with appropriate defaults',
      'Customer database cleanup: Fill missing contact information strategically',
      'Sales data preparation: Handle missing transaction details for analysis',
      'Scientific dataset processing: Apply statistical imputation for measurements',
      'Financial data cleaning: Handle missing values in trading or accounting data',
      'IoT sensor data: Fill missing readings with interpolated or typical values',
      'Medical records: Handle missing test results or patient information',
      'E-commerce analytics: Clean product data with missing attributes',
    ],

    bestPractices: [
      'Use MEAN/MEDIAN for numeric data where statistical imputation makes sense',
      'Use MOST_FREQUENT for categorical data to preserve existing patterns',
      'Use REMOVE_ROWS for critical columns where missing data invalidates the record',
      'Configure different methods for different column types within the same dataset',
      'Consider the business meaning of missing values before choosing a method',
      'Document your imputation choices for data governance and reproducibility',
    ],

    limitations: [
      'Statistical methods (mean/median) only work with numeric columns',
      'Imputation may introduce bias depending on the missing data pattern',
      'Row removal can significantly reduce dataset size',
      'Most frequent imputation may not be appropriate for all categorical data',
    ],
  },
} as const;

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    default_method: {
      type: 'string',
      enum: ['MEAN', 'MEDIAN', 'MOST_FREQUENT', 'REMOVE_ROWS'],
      description: 'Default method for handling missing values across all columns',
      default: 'MOST_FREQUENT'
    },
    column_configs: {
      type: 'array',
      description: 'Column-specific missing value handling configurations',
      items: {
        type: 'object',
        properties: {
          columnName: {
            type: 'string',
            description: 'Name of the column to configure'
          },
          method: {
            type: 'string',
            enum: ['MEAN', 'MEDIAN', 'MOST_FREQUENT', 'REMOVE_ROWS'],
            description: 'Specific method for this column'
          }
        },
        required: ['columnName', 'method']
      }
    }
  },
  required: ['default_method'],
  additionalProperties: false
};
