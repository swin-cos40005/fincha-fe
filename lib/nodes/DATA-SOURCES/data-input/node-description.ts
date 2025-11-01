/**
 * Data Input Node - CSV Data Source
 */

export const NODE_DESCRIPTION = {
  /**
   * Short Description
   */
  shortDescription:
    'Loads CSV data from various sources including URLs, file uploads, or conversation context.',

  /**
   * Configuration Attributes
   */
  configuration: {
    csv_url: {
      description: 'URL of the CSV file to load',
      type: 'string',
      purpose: 'Points to the location of your CSV data source',
      example: 'https://example.com/data.csv or file:///path/to/local.csv',
      required: true,
    },

    inPorts: {
      description: 'Number of input connections (always 0)',
      type: 'number',
      purpose: "This is a source node - it doesn't accept input data",
      value: 0,
    },

    outPorts: {
      description: 'Number of output connections (always 1)',
      type: 'number',
      purpose: 'Outputs the loaded CSV data as a table',
      value: 1,
    },
  },

  /**
   * Detailed Description
   */
  detailedDescription: {
    whatItDoes: `The Data Input Node is the primary entry point for loading CSV data into the workflow system. It supports multiple data sources and provides flexible configuration options for data ingestion.

Key Features:
• Load CSV data from URLs (public or authenticated endpoints)
• Support for file uploads with drag-and-drop interface
• Integration with conversation context for dynamic data loading
• Automatic CSV parsing and validation
• Configurable data source types and options
• Error handling for invalid or inaccessible data sources

Input Requirements:
• No input ports required - this is a source node
• Valid CSV URL, file upload, or conversation context data

Configuration Options:
• CSV URL or file path specification
• Data source type selection (URL, upload, conversation)
• File name and display options
• Error handling preferences
• Data validation settings

Output:
• Structured DataTable with parsed CSV content
• Column specifications and data types
• Row data ready for downstream processing

Use Cases:
• Loading datasets from public repositories
• Importing local CSV files for analysis
• Dynamic data loading based on conversation context
• Batch processing of multiple data sources
• Data pipeline initialization`,

    inputsAndOutputs: `
**Input Ports:**
- No input ports (source node)

**Output Port:**
- **Port 1**: DataTable containing the loaded CSV data

**Data Flow:**
1. User configures data source (URL, file, or conversation)
2. System fetches and validates CSV data
3. Data is parsed into structured format
4. Output DataTable is provided to connected nodes`,

    configurationInstructions: `
**Basic Configuration:**
1. Select the data source type (URL, upload, or conversation)
2. Provide the CSV URL or upload the file
3. Configure any additional options (file name, validation)
4. Test the connection to ensure data accessibility

**URL Configuration:**
- Enter the complete URL to the CSV file
- Ensure the URL is publicly accessible or properly authenticated
- Test the URL to verify data format and accessibility

**File Upload Configuration:**
- Use the file upload interface to select local CSV files
- Ensure the file is in valid CSV format
- Set an appropriate display name for the dataset

**Conversation Context Configuration:**
- Reference data from the current conversation
- Ensure the conversation contains valid CSV data
- Configure parsing options for the context data`,

    examples: `
**Example 1: Public Dataset Loading**
- Configuration: URL source with https://example.com/sales-data.csv
- Result: Loads sales data from public repository for analysis

**Example 2: Local File Import**
- Configuration: File upload with "customer_survey.csv"
- Result: Imports local customer survey data for processing

**Example 3: Dynamic Data Loading**
- Configuration: Conversation context with CSV data
- Result: Loads data mentioned in the conversation for immediate analysis

**Example 4: Multiple Source Workflow**
- Configuration: Multiple data input nodes with different sources
- Result: Creates a workflow that combines data from various sources`,
  },
} as const;

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    csv_url: {
      type: 'string',
      description: 'URL or path to the CSV file',
      format: 'uri'
    },
    csv_source_type: {
      type: 'string',
      enum: ['url'],
      description: 'Source type of the CSV file (currently only URL is supported)',
      default: 'url'
    },
    csv_file_name: {
      type: 'string',
      description: 'Display name for the CSV file',
      default: 'CSV Data'
    }
  },
  required: ['csv_url'],
  additionalProperties: false
} as const;
