export const NODE_DESCRIPTION = {
  shortDescription: 'Evaluates data quality by analyzing missing values and duplicate rows',
  
  detailedDescription: {
    whatItDoes: `The Data Quality Scorer node provides comprehensive data quality assessment by analyzing missing values and duplicate rows in your dataset. It generates quality scores, grades, and actionable recommendations for data improvement.`,
    
    keyFeatures: [
      'Missing value analysis across all columns',
      'Duplicate row detection and counting',
      'Configurable scoring weights for different quality factors',
      'Quality grades (A-F) based on overall score',
      'Actionable recommendations for data improvement',
      'Passthrough output for continued processing',
    ],
    
    scoringMethod: [
      'Missing values: -2 points per 1% missing data',
      'Duplicate rows: -3 points per 1% duplicates',
      'Weighted combination based on user preferences',
      'Final grade: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)',
    ],
    
    useCases: [
      'Data quality assessment before analysis',
      'Monitoring data quality across different sources',
      'Identifying data cleaning priorities',
      'Validating data preparation steps',
      'Quality control in data pipelines',
    ],
    
    inputOutput: {
      inputs: [
        'Data table to be analyzed for quality',
      ],
      outputs: [
        'Quality score table with metrics and recommendations',
        'Original data table (passthrough for continued processing)',
      ],
    },
    
    configuration: {
      weightMissing: 'Weight for missing values impact (0.0-1.0, default: 0.6)',
      weightDuplicates: 'Weight for duplicate rows impact (0.0-1.0, default: 0.4)',
      includeRecommendations: 'Include actionable recommendations in output (default: true)',
    },
  },
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    weight_missing: {
      type: 'number',
      description: 'Weight for missing values impact on overall quality score',
      minimum: 0.0,
      maximum: 1.0,
      default: 0.6
    },
    weight_duplicates: {
      type: 'number',
      description: 'Weight for duplicate rows impact on overall quality score',
      minimum: 0.0,
      maximum: 1.0,
      default: 0.4
    },
    include_recommendations: {
      type: 'boolean',
      description: 'Whether to include actionable recommendations in the output',
      default: true
    }
  },
  required: ['weight_missing', 'weight_duplicates', 'include_recommendations'],
  additionalProperties: false
}; 