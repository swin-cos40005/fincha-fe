export const NODE_DESCRIPTION = {
  shortDescription: 'Generates synthetic regression data to meet specific statistical targets like R², beta coefficients, Cohen\'s f², or Q² values.',
  
  detailedDescription: {
    whatItDoes: `The Force-Fit Regression Generator creates synthetic regression datasets that are optimized to achieve specific statistical targets. This powerful tool allows researchers and analysts to generate data with precise statistical properties for testing, validation, or educational purposes.

**Key Features:**
- **Multiple Target Types**: Generate data to meet R² (coefficient of determination), specific beta coefficients, Cohen's f² (effect size), or Q² (predictive relevance) targets
- **Configurable Design**: Set sample size, number of predictors, and target values with flexible parameter controls
- **Statistical Accuracy**: Uses iterative optimization to ensure generated data meets the specified statistical criteria
- **Comprehensive Output**: Provides detailed regression statistics including t-values, p-values, and effect sizes
- **Data Export**: Download generated datasets as CSV files for use in other applications

**Use Cases:**
- **Statistical Education**: Create datasets with known properties for teaching regression concepts
- **Method Validation**: Generate test data with specific characteristics to validate statistical procedures
- **Power Analysis**: Create datasets with varying effect sizes for power and sample size calculations
- **Algorithm Testing**: Generate controlled datasets for testing machine learning and statistical algorithms
- **Research Planning**: Simulate expected data characteristics for study design and analysis planning

**Statistical Background:**
The node employs sophisticated algorithms to generate correlated data that meets statistical targets:
- **R² Targeting**: Iteratively adjusts predictor correlations to achieve the desired explained variance
- **Beta Targeting**: Directly controls regression coefficients while maintaining realistic data distributions
- **Cohen's f² Targeting**: Converts effect size measures to R² equivalents for data generation
- **Q² Targeting**: Optimizes for predictive relevance using cross-validation principles

**Output Statistics:**
Each generated dataset includes comprehensive regression diagnostics:
- Adjusted R² (coefficient of determination)
- Beta coefficients with standard errors
- T-statistics and p-values for significance testing
- Cohen's f² for effect size assessment
- Q² for predictive validity evaluation`,

    inputsAndOutputs: {
      inputs: [
        {
          name: 'None',
          description: 'This node generates data from scratch and does not require input data.',
          type: 'N/A'
        }
      ],
      outputs: [
        {
          name: 'Generated Regression Data',
          description: 'A table containing the generated predictor variables (X1, X2, ...) and outcome variable (Y) with the specified statistical properties.',
          type: 'DataTableType'
        }
      ]
    },

    parameters: [
      {
        name: 'Sample Count',
        description: 'Number of observations to generate (1-10,000)',
        type: 'number',
        defaultValue: 100
      },
      {
        name: 'Predictor Count',
        description: 'Number of predictor variables (1-10)',
        type: 'number',
        defaultValue: 3
      },
      {
        name: 'Target Type',
        description: 'Statistical measure to optimize: R² (explained variance), Beta (coefficients), Cohen\'s f² (effect size), or Q² (predictive relevance)',
        type: 'selection',
        options: ['R²', 'Beta Coefficients', 'Cohen\'s f²', 'Q²'],
        defaultValue: 'R²'
      },
      {
        name: 'Target R²',
        description: 'Desired R² value (0.0-1.0) when using R² targeting',
        type: 'number',
        defaultValue: 0.8
      },
      {
        name: 'Target Beta',
        description: 'Desired beta coefficients when using beta targeting',
        type: 'array',
        defaultValue: '[0.6, 0.2, 0.1]'
      },
      {
        name: 'Target Cohen\'s f²',
        description: 'Desired Cohen\'s f² effect size (≥0) when using effect size targeting',
        type: 'number',
        defaultValue: 0.25
      },
      {
        name: 'Target Q²',
        description: 'Desired Q² predictive relevance (0.0-1.0) when using Q² targeting',
        type: 'number',
        defaultValue: 0.7
      },
      {
        name: 'Column Headers',
        description: 'Source for column names: auto-generated, custom, or from uploaded CSV file',
        type: 'selection',
        options: ['Auto-generate', 'Custom', 'From File'],
        defaultValue: 'Auto-generate'
      }
    ],

    technicalDetails: {
      algorithm: 'Iterative correlation matrix optimization with Cholesky decomposition for multivariate normal generation',
      complexity: 'O(n × k²) where n is sample size and k is number of predictors',
      limitations: [
        'Maximum 10 predictors to ensure computational efficiency',
        'Some extreme target combinations may not be achievable',
        'Generated data assumes linear relationships',
        'Q² targeting may require multiple attempts for very high values'
      ]
    }
  }
};
