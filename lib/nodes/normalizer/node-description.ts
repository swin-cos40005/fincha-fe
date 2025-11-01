/**
 * Normalizer Node - Statistical Data Scaling
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Normalize numerical data using various scaling methods (min-max, z-score, decimal scaling) to standardize data ranges.',

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes: `
      The Normalizer node scales numerical data to a standardized range using various mathematical methods.
      It transforms raw numerical values into normalized values that are easier to compare and analyze.
      The node preserves the relative relationships between data points while adjusting their absolute values.
    `,

    whenToUse: `
      Use this node when you need to:
      • Prepare data for machine learning algorithms that are sensitive to feature scales
      • Compare variables with different units or ranges (e.g., age vs. salary)
      • Apply statistical analysis that requires standardized data
      • Create visualizations where consistent scales are important
      • Preprocess data for clustering or distance-based algorithms
      • Standardize features for neural networks or gradient-based optimization
      • Handle outliers by scaling data to a bounded range
      • Prepare data for principal component analysis (PCA) or other dimensionality reduction
    `,

    keyFeatures: [
      'Multiple normalization methods: min-max, z-score, decimal scaling',
      'Column-specific selection for targeted normalization',
      'Configurable range for min-max normalization',
      'Automatic detection of numerical columns',
      'Preservation of data relationships and patterns',
      'Progress tracking for large datasets',
      'Maintains original data structure and non-numeric columns',
      'Handles edge cases like constant columns and zero variance',
    ],

    normalizationMethods: {
      MIN_MAX: {
        description: 'Linear transformation scaling values to a specified range',
        formula: 'normalized = (value - min) / (max - min) * (new_max - new_min) + new_min',
        applicableTypes: ['number'],
        useCase: 'Good for algorithms that expect bounded inputs or when you want to preserve zero values',
        example: 'Scale age (0-100) to range (0-1) for neural network input',
        advantages: [
          'Bounded output range',
          'Preserves zero values',
          'Intuitive scaling',
          'Good for algorithms sensitive to input ranges',
        ],
        limitations: [
          'Sensitive to outliers',
          'Requires known min/max values',
          'May not work well with skewed distributions',
        ],
      },
      Z_SCORE: {
        description: 'Standardizes data to have mean=0 and standard deviation=1',
        formula: 'normalized = (value - mean) / standard_deviation',
        applicableTypes: ['number'],
        useCase: 'Good for statistical analysis and algorithms that assume normal distribution',
        example: 'Standardize test scores to compare performance across different tests',
        advantages: [
          'Handles outliers better than min-max',
          'Standard statistical measure',
          'Good for algorithms assuming normal distribution',
          'Useful for comparing variables with different units',
        ],
        limitations: [
          'Unbounded output range',
          'May not preserve zero values',
          'Assumes approximate normal distribution',
        ],
      },
      DECIMAL_SCALING: {
        description: 'Scales data by dividing by powers of 10 until maximum absolute value is ≤ 1',
        formula: 'normalized = value / (10^j) where j is the smallest integer making max|value|/10^j ≤ 1',
        applicableTypes: ['number'],
        useCase: 'Good for preserving the original data distribution while scaling to manageable ranges',
        example: 'Scale large financial values (e.g., 1,234,567) to range (-1, 1)',
        advantages: [
          'Preserves data distribution shape',
          'Handles very large or small numbers',
          'Maintains relative relationships',
          'Useful for financial or scientific data',
        ],
        limitations: [
          'May not work well with mixed positive/negative values',
          'Less intuitive than other methods',
          'May not achieve desired range for all datasets',
        ],
      },
    },

    dataFlow: [
      '1. Input data table is analyzed to identify numerical columns',
      '2. Selected columns are validated for numerical data type',
      '3. Statistical measures are computed (min, max, mean, std dev)',
      '4. Each selected column is normalized using the chosen method',
      '5. Non-selected columns remain unchanged',
      '6. Normalized data table is output with transformed values',
    ],

    useCases: [
      'Machine learning preprocessing: Scale features for algorithms like SVM, neural networks',
      'Financial analysis: Normalize different financial metrics for comparison',
      'Scientific research: Standardize measurements from different instruments',
      'Survey analysis: Normalize responses across different scales',
      'Image processing: Normalize pixel values for consistent processing',
      'Time series analysis: Scale different time series for pattern comparison',
      'Clustering: Prepare data for distance-based clustering algorithms',
      'Feature engineering: Create normalized features for predictive models',
    ],

    bestPractices: [
      'Use min-max normalization when you need bounded outputs (e.g., 0-1 range)',
      'Use z-score normalization for statistical analysis and algorithms assuming normal distribution',
      'Use decimal scaling for data with very large or small values',
      'Apply normalization only to numerical columns, leave categorical data unchanged',
      'Consider the impact of outliers on your chosen method',
      'Document your normalization choices for reproducibility',
      'Test normalization on a sample before applying to the full dataset',
      'Consider whether to normalize test data using training data statistics',
    ],

    limitations: [
      'Min-max normalization is sensitive to outliers',
      'Z-score assumes approximate normal distribution',
      'Decimal scaling may not achieve desired ranges for all datasets',
      'Normalization may not be appropriate for all data types or use cases',
      'Some algorithms may not require normalization or may prefer raw data',
    ],
  },
} as const;

export const NODE_SCHEMA = {
  type: 'object',
  description: 'Configuration schema for the Normalizer node',
  properties: {
    number_columns: {
      description: 'Select the numerical columns to normalize',
      type: 'array',
      items: {
        type: 'string'
      },
      purpose: 'Specifies which numeric columns should be normalized',
      required: true,
      minItems: 1
    },
    normalization_method: {
      description: 'The normalization method to use',
      type: 'string',
      enum: ['MIN_MAX', 'Z_SCORE', 'DECIMAL_SCALING'],
      purpose: 'Defines the mathematical approach for scaling the data',
      options: [
        'MIN_MAX - Linear transformation to specified range',
        'Z_SCORE - Gaussian distribution with mean=0, std=1',
        'DECIMAL_SCALING - Scale by powers of 10',
      ],
      default: 'MIN_MAX',
      required: true
    },
    min_value: {
      description: 'Specifies the new minimum for normalized columns (min-max only)',
      type: 'number',
      purpose: 'Target minimum value for min-max normalization',
      default: 0,
      required: false
    },
    max_value: {
      description: 'Specifies the new maximum for normalized columns (min-max only)',
      type: 'number',
      purpose: 'Target maximum value for min-max normalization',
      default: 1,
      required: false
    },
    inPorts: {
      description: 'Number of input connections (always 1)',
      type: 'number',
      purpose: 'Accepts one input data table with numerical columns to normalize',
      value: 1,
    },
    outPorts: {
      description: 'Number of output connections (always 1)',
      type: 'number',
      purpose: 'Outputs the data table with normalized numerical columns',
      value: 1,
    }
  },
  required: ['number_columns', 'normalization_method'],
  additionalProperties: false
};