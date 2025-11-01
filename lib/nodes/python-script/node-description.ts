export const NODE_DESCRIPTION = {
  shortDescription: 'Run custom Python code on your data. Choose between local (browser) or server execution.',
  detailedDescription: {
    whatItDoes: `The Python Script node allows you to write and execute custom Python code directly within your workflow. You can process input data tables, statistics, or chart data, and output any of these types. Choose to run your code locally in the browser (using Pyodide) or on the server for more resources or compatibility.`,
    inputs: [
      'Data Table (optional): Input tabular data for your script.',
      'Statistics (optional): Input statistics object for your script.',
      'Chart/Image (optional): Input chart or image data for your script.'
    ],
    outputs: [
      'Data Table: Output tabular data.',
      'Statistics: Output statistics object.',
      'Chart/Image: Output chart or image data.'
    ],
    usage: `1. Double-click the node to open the editor dialog.\n2. Write your Python code in the editor. Use provided variables for input data.\n3. Select execution mode: Local (browser) or Server.\n4. Save and run the node to process your data.`
  }
};
export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      title: 'Python Code',
      description: 'The Python code to execute.'
    },
    executionMode: {
      type: 'string',
      enum: ['local', 'server'],
      title: 'Execution Mode',
      description: 'Choose whether to run the code in the browser or on the server.'
    }
  },
  required: ['code'],
};
