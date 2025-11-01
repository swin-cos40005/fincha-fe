export const NODE_DESCRIPTION = {
  shortDescription: "Generates synthetic survey data with a target Cronbach's alpha reliability coefficient",

  /**
   * Node Schema for AI Agent Configuration
   */
  NODE_SCHEMA: {
    type: 'object',
    properties: {
      sampleCount: {
        type: 'number',
        description: 'Number of respondents to simulate',
        minimum: 1,
        default: 100
      },
      targetAlpha: {
        type: 'number',
        description: 'Target Cronbach\'s alpha reliability coefficient',
        minimum: 0.0,
        maximum: 1.0,
        default: 0.8
      },
      optionMap: {
        type: 'object',
        description: 'Mapping of answer options to question counts',
        additionalProperties: {
          type: 'number',
          minimum: 1
        },
        examples: [
          { '2': 1, '3': 15, '5': 4 },
          { '2': 5, '4': 10, '7': 3 }
        ]
      },
      customHeaders: {
        type: 'array',
        description: 'Custom column headers for the generated data',
        items: {
          type: 'string'
        }
      },
      inputFileHeaders: {
        type: 'array',
        description: 'Headers imported from existing CSV files',
        items: {
          type: 'string'
        }
      }
    },
    required: ['sampleCount', 'targetAlpha', 'optionMap'],
    additionalProperties: false
  },

  detailedDescription: {
    whatItDoes: `
The Cronbach Alpha Generator creates synthetic survey response data that meets a specified reliability target (Cronbach's alpha coefficient). This is useful for:

• Testing statistical analyses with controlled reliability
• Creating sample datasets for educational purposes
• Simulating survey responses with known psychometric properties
• Generating data for reliability analysis demonstrations

**Key Features:**
- Specify target Cronbach's alpha (0-1)
- Configure multiple question types with different response scales
- Customize column headers or use auto-generated names
- Import headers from existing CSV files
- Export generated data as CSV

**Configuration Options:**
- Sample count: Number of respondents to simulate
- Target alpha: Desired reliability coefficient (typically 0.7-0.9 for good reliability)
- Question configuration: Define questions with different numbers of response options (e.g., 2-point, 5-point scales)
- Column headers: Auto-generate, use custom names, or import from CSV file

**Technical Details:**
The algorithm uses correlation matrix manipulation and Cholesky decomposition to generate correlated normal data, which is then transformed to categorical responses while maintaining the target reliability level.
    `,
  },
};
