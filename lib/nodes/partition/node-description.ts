/**
 * Description and documentation for the Partition Node
 */
export const NODE_DESCRIPTION = {
  shortDescription:
    'Divide data into two partitions using various splitting strategies',

  detailedDescription: {
    whatItDoes: `The Partition node splits incoming data into two separate output tables based on different partitioning strategies:

**Partitioning Modes:**

• **Absolute**: Specify the absolute number of rows for the first partition. If there are fewer rows than specified, all rows go to the first table.

• **Relative**: Set the percentage (0-100) of rows that go to the first partition.

• **Take from Top**: Put the specified number of top-most rows into the first output table, with the remainder in the second table.

• **Linear Sampling**: Always includes the first and last row and selects remaining rows linearly over the whole table. Useful for downsampling while maintaining minimum and maximum values.

• **Draw Randomly**: Random sampling of all rows. You can optionally specify a fixed seed for reproducible results.

• **Stratified Sampling**: The distribution of values in the selected column is approximately retained in both output tables. Requires selecting a column for stratification.

**Random Seed**: For random and stratified sampling modes, you can specify a fixed seed to ensure reproducible results. The same seed will always produce the same partition.

**Use Cases:**
- Train/test data splitting for machine learning
- Creating representative samples from large datasets  
- Stratified sampling to maintain class distributions
- Time series data splitting (using "Take from Top")
- Quality assurance sampling with linear sampling`,

    inputs: [
      {
        name: 'Input Data',
        description: 'Any data table to be partitioned',
      },
    ],

    outputs: [
      {
        name: 'First Partition',
        description:
          'First subset of the input data based on the selected partition strategy',
      },
      {
        name: 'Second Partition',
        description:
          'Remaining rows that were not included in the first partition',
      },
    ],

    configuration: [
      {
        name: 'Partition Mode',
        description:
          'Strategy for splitting the data (Absolute, Relative, Take from Top, Linear Sampling, Draw Randomly, Stratified Sampling)',
      },
      {
        name: 'Value',
        description: 'Number or percentage depending on the selected mode',
      },
      {
        name: 'Stratification Column',
        description:
          'Column to use for stratified sampling (only for Stratified Sampling mode)',
      },
      {
        name: 'Random Seed',
        description:
          'Optional seed for reproducible random and stratified sampling',
      },
    ],
  },
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    partition_mode: {
      type: 'string',
      enum: ['absolute', 'relative', 'take_from_top', 'linear_sampling', 'draw_randomly', 'stratified_sampling'],
      description: 'Strategy for splitting the data into two partitions',
      default: 'relative'
    },
    partition_value: {
      type: 'number',
      description: 'Value for partitioning (varies by mode: count, percentage, etc.)',
      minimum: 0,
      default: 50
    },
    stratified_column: {
      type: 'string',
      description: 'Column name for stratified sampling (only used in stratified_sampling mode)',
      default: ''
    },
    use_random_seed: {
      type: 'boolean',
      description: 'Whether to use a fixed random seed for reproducible results',
      default: false
    },
    random_seed: {
      type: 'number',
      description: 'Fixed seed value for random and stratified sampling',
      default: 12345
    }
  },
  required: ['partition_mode', 'partition_value'],
  additionalProperties: false
};
