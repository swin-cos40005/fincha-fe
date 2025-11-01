export const NODE_DESCRIPTION = {
  shortDescription: 'Generates synthetic factor structure data with targeted Average Variance Extracted (AVE) and composite reliability values for structural equation modeling research.',
  
  detailedDescription: {
    whatItDoes: `The EVA (Average Variance Extracted) Manipulator creates synthetic confirmatory factor analysis (CFA) data with precisely controlled psychometric properties. This advanced tool generates factor structures that meet specific validity and reliability criteria, making it invaluable for structural equation modeling research, scale development, and methodological studies.

**Key Features:**
- **Multiple Target Options**: Generate data to meet AVE targets, composite reliability targets, or both simultaneously
- **Flexible Factor Structure**: Configure any number of factors (1-10) with customizable indicators per factor (2-20)
- **Psychometric Precision**: Creates factor loadings that achieve exact statistical targets through iterative optimization
- **Comprehensive Diagnostics**: Provides detailed factor analysis results including discriminant validity assessment
- **Research-Ready Output**: Exports both indicator data and factor loading matrices for immediate use

**Use Cases:**
- **Scale Development**: Create test datasets with known psychometric properties for validation studies
- **SEM Research**: Generate data with specific factor structures for testing structural equation models
- **Methodological Studies**: Compare analysis techniques using controlled datasets with known properties
- **Education & Training**: Teach factor analysis concepts with datasets having clear, interpretable structures
- **Power Analysis**: Generate data with varying effect sizes for sample size planning in CFA studies

**Psychometric Background:**
The node implements sophisticated algorithms based on factor analysis theory:
- **AVE Calculation**: Computes average variance extracted as the mean of squared factor loadings
- **Composite Reliability**: Calculates internal consistency using the composite reliability formula
- **Loading Optimization**: Iteratively adjusts factor loadings to meet psychometric targets
- **Discriminant Validity**: Assesses whether factors are sufficiently distinct from each other

**Factor Model Implementation:**
Generated data follows the classical factor model: **X = Λf + ε**
- **X**: Observed indicator variables (output data)
- **Λ**: Factor loading matrix (optimized to meet targets)
- **f**: Latent factor scores (generated as standard normal)
- **ε**: Measurement error terms (adjusted for target reliability)

**Quality Metrics:**
Each generated dataset includes comprehensive psychometric evaluation:
- Average Variance Extracted (AVE) for convergent validity
- Composite Reliability (CR) for internal consistency
- Factor loadings with strength indicators
- Discriminant validity assessment using Fornell-Larcker criterion`,

    inputsAndOutputs: {
      inputs: [
        {
          name: 'None',
          description: 'This node generates factor structure data from scratch and does not require input data.',
          type: 'N/A'
        }
      ],
      outputs: [
        {
          name: 'Factor Structure Data',
          description: 'A table containing generated indicator variables that follow the specified factor structure with targeted psychometric properties.',
          type: 'DataTableType'
        }
      ]
    },

    parameters: [
      {
        name: 'Sample Count',
        description: 'Number of observations to generate (10-10,000)',
        type: 'number',
        defaultValue: 200
      },
      {
        name: 'Number of Factors',
        description: 'Number of latent factors in the model (1-10)',
        type: 'number',
        defaultValue: 3
      },
      {
        name: 'Indicators per Factor',
        description: 'Number of observed indicators for each factor (2-20)',
        type: 'number',
        defaultValue: 4
      },
      {
        name: 'Generation Method',
        description: 'Target optimization approach: AVE only, Composite Reliability only, or both',
        type: 'selection',
        options: ['AVE Target', 'Reliability Target', 'Both Targets'],
        defaultValue: 'AVE Target'
      },
      {
        name: 'Target AVE',
        description: 'Desired Average Variance Extracted (0.0-1.0). Values ≥ 0.5 indicate good convergent validity',
        type: 'number',
        defaultValue: 0.5
      },
      {
        name: 'Target Composite Reliability',
        description: 'Desired composite reliability (0.0-1.0). Values ≥ 0.7 indicate acceptable internal consistency',
        type: 'number',
        defaultValue: 0.7
      },
      {
        name: 'Column Headers',
        description: 'Source for indicator variable names: auto-generated, custom, or from uploaded CSV file',
        type: 'selection',
        options: ['Auto-generate', 'Custom', 'From File'],
        defaultValue: 'Auto-generate'
      }
    ],

    technicalDetails: {
      algorithm: 'Iterative factor loading optimization with Fornell-Larcker discriminant validity assessment',
      complexity: 'O(n × f × i) where n is sample size, f is factors, and i is indicators per factor',
      limitations: [
        'Maximum 10 factors to ensure model identification',
        'Extreme target combinations may require multiple optimization attempts',
        'Generated factor structure assumes simple structure (no cross-loadings)',
        'Composite reliability calculation assumes tau-equivalent measurement model'
      ],
      validityChecks: [
        'AVE ≥ 0.5 for convergent validity',
        'Composite Reliability ≥ 0.7 for internal consistency',
        'Factor loadings ≥ 0.7 for strong indicator relationships',
        'Discriminant validity via Fornell-Larcker criterion'
      ]
    }
  }
};
