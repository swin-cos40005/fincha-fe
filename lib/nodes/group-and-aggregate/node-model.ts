import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
  type DataRow,
  type Cell,
  type ColumnSpec,
} from '../core';

// Define supported aggregation methods
export enum AggregationMethod {
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  MIN = 'MIN',
  MAX = 'MAX',
  COUNT = 'COUNT',
  FIRST = 'FIRST',
  LAST = 'LAST',
}

// Define column aggregation configuration
export interface ColumnAggregation {
  columnName: string;
  method: AggregationMethod;
  newColumnName: string;
}

/**
 * Node model that groups data by specified columns and aggregates other columns
 */
export class GroupAndAggregateNodeModel extends NodeModel {
  // Settings keys
  public static GROUP_COLUMNS_KEY = 'group_columns';
  public static AGGREGATIONS_KEY = 'aggregations';

  // Settings values
  public groupColumns: string[] = [];
  public aggregations: ColumnAggregation[] = [];

  constructor() {
    // 1 input port, 1 output port
    super(1, 1);

    // Configure dashboard output
    this.configureDashboardOutput([
      {
        portIndex: 0,
        outputType: 'table',
        title: 'Grouped and Aggregated Data',
        description: 'Data grouped by specified columns with aggregations applied',
      },
    ]);
  }

  /**
   * Main execution method - groups and aggregates data
   */
  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    const inputTable = inData[0];
    const inputSpec = inputTable.spec;

    // Create output spec based on group columns and aggregations
    const outputSpec = this.createOutputSpec(inputSpec);

    // Create output container
    const container = context.createDataTable(outputSpec);

    // Get column indices for grouping
    const groupIndices = this.groupColumns.map((col) =>
      inputSpec.findColumnIndex(col),
    );

    // Create groups map - key is the group values concatenated, value is aggregated data
    const groups = new Map<string, Map<number, any[]>>();

    // First pass: group the data
    let rowCount = 0;
    inputTable.forEach((row: DataRow) => {
      // Report progress
      if (rowCount % 100 === 0) {
        context.checkCanceled();
        context.setProgress(
          (rowCount / inputTable.size) * 0.5,
          `Grouping row ${rowCount} of ${inputTable.size}`,
        );
      }
      rowCount++;

      // Create group key from the group column values
      const groupKey = groupIndices
        .map((idx) => String(row.cells[idx].getValue()))
        .join('|');

      // Initialize group if it doesn't exist
      if (!groups.has(groupKey)) {
        groups.set(groupKey, new Map<number, any[]>());
      }

      // Add values to the group's aggregation collections
      const groupData = groups.get(groupKey)!;
      for (const agg of this.aggregations) {
        const colIndex = inputSpec.findColumnIndex(agg.columnName);
        const value = row.cells[colIndex].getValue();
        
        if (!groupData.has(colIndex)) {
          groupData.set(colIndex, []);
        }
        
        groupData.get(colIndex)!.push(value);
      }
    });

    // Second pass: compute aggregations and output results
    let groupCount = 0;
    const totalGroups = groups.size;

    for (const [groupKey, groupData] of groups.entries()) {
      // Report progress
      if (groupCount % 100 === 0) {
        context.checkCanceled();
        context.setProgress(
          0.5 + (groupCount / totalGroups) * 0.5,
          `Aggregating group ${groupCount} of ${totalGroups}`,
        );
      }
      groupCount++;

      // Extract group values
      const groupValues = groupKey.split('|');

      // Create cells array for the new row
      const cells: Cell[] = [];

      // Add group column cells
      groupValues.forEach((value, i) => {
        const originalColIndex = groupIndices[i];
        const colType = inputSpec.columns[originalColIndex].type;
        cells.push(this.createCell(value, colType));
      });

      // Add aggregation cells
      for (const agg of this.aggregations) {
        const colIndex = inputSpec.findColumnIndex(agg.columnName);
        const values = groupData.get(colIndex) || [];
        const aggregatedValue = this.computeAggregation(values, agg.method);
        const colType = this.getAggregatedType(
          agg.method,
          inputSpec.columns[colIndex].type,
        );
        cells.push(this.createCell(aggregatedValue, colType));
      }

      // Add row to output table
      container.addRow(`group_${groupCount}`, cells);
    }

    // Finish output table
    const result = [container.close()];
    
    // Generate dashboard items (WorkflowEditor will handle persistence)
    const nodeLabel = `Group and Aggregate (${this.groupColumns.join(', ')})`;
    const dashboardItems = await this.sendOutputsToDashboard(result, context, nodeLabel);
    
    // Store dashboard items in context for WorkflowEditor to access
    (context as any).dashboardItems = dashboardItems;
    
    return result;
  }

  /**
   * Creates the output table specification
   */
  public createOutputSpec(inputSpec: DataTableSpec): DataTableSpec {
    const columns: ColumnSpec[] = [];

    // Add group columns
    this.groupColumns.forEach((colName) => {
      const colIndex = inputSpec.findColumnIndex(colName);
      columns.push({...inputSpec.columns[colIndex]});
    });
    
    // Add aggregation columns
    this.aggregations.forEach((agg) => {
      const origColIndex = inputSpec.findColumnIndex(agg.columnName);
      const origType = inputSpec.columns[origColIndex].type;
      const newType = this.getAggregatedType(agg.method, origType);
      
      columns.push({
        name: agg.newColumnName,
        type: newType,
      });
    });
    
    return {
      columns,
      findColumnIndex: (name: string): number => {
        return columns.findIndex((col) => col.name === name);
      },
    };
  }

  /**
   * Computes aggregation on a set of values
   */
  public computeAggregation(values: any[], method: AggregationMethod): any {
    if (values.length === 0) return null;

    switch (method) {
      case AggregationMethod.SUM:
        return values.reduce((sum, val) => {
          const num = Math.round(Number(val));
          return isNaN(num) ? sum : sum + num;
        }, 0);

      case AggregationMethod.AVERAGE: {
        const { sum, count } = values.reduce((acc, val) => {
          const num = Math.round(Number(val));
          if (!isNaN(num)) {
            acc.sum += num;
            acc.count++;
          }
          return acc;
        }, { sum: 0, count: 0 });
        
        return count > 0 ? sum / count : null;
      }

      case AggregationMethod.MIN: {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length > 0 ? Math.min(...nums) : null;
      }

      case AggregationMethod.MAX: {
        const nums = values.map(Number).filter(n => !isNaN(n));
        return nums.length > 0 ? Math.max(...nums) : null;
      }

      case AggregationMethod.COUNT:
        return values.length;

      case AggregationMethod.FIRST:
        return values[0];

      case AggregationMethod.LAST:
        return values[values.length - 1];

      default:
        return null;
    }
  }

  /**
   * Determines the resulting data type after aggregation
   */
  public getAggregatedType(
    method: AggregationMethod,
    originalType: string,
  ): string {
    switch (method) {
      case AggregationMethod.COUNT:
        return 'number';

      case AggregationMethod.SUM:
      case AggregationMethod.AVERAGE:
      case AggregationMethod.MIN:
      case AggregationMethod.MAX:
        return 'number';

      case AggregationMethod.FIRST:
      case AggregationMethod.LAST:
        return originalType;

      default:
        return 'string';
    }
  }

  /**
   * Creates a cell with the appropriate type
   */
  public createCell(value: any, type: string): Cell {
    return {
      type,
      getValue: () => value,
    };
  }

  /**
   * Validates input and defines output structure
   */
  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    const inputSpec = _inSpecs[0];

    // Validate group columns
    this.groupColumns.forEach((colName) => {
      if (inputSpec.findColumnIndex(colName) < 0) {
        throw new Error(`Group column '${colName}' not found in input table`);
      }
    });

    // Validate aggregation columns
    this.aggregations.forEach((agg) => {
      const colIndex = inputSpec.findColumnIndex(agg.columnName);
      if (colIndex < 0) {
        throw new Error(
          `Aggregation column '${agg.columnName}' not found in input table`,
        );
      }

      // Validate numeric columns for numeric aggregations
      const colType = inputSpec.columns[colIndex].type;
      if (
        [
          AggregationMethod.SUM,
          AggregationMethod.AVERAGE,
          AggregationMethod.MIN,
          AggregationMethod.MAX,
        ].includes(agg.method) &&
        colType !== 'number'
      ) {
        throw new Error(
          `Column '${agg.columnName}' must be numeric for ${agg.method} aggregation`,
        );
      }
    });

    // Create output spec
    return [this.createOutputSpec(inputSpec)];
  }

  /**
   * Load settings from the settings object
   */
  loadSettings(settings: SettingsObject): void {
    // Handle group columns
    let groupColumnsData: any;
    if (typeof settings.getString === 'function') {
      groupColumnsData = settings.getString(
        GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY, 
        '[]'
      );
    } else {
      groupColumnsData = (settings as any)[GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY] || '[]';
    }

    // Parse group columns
    if (Array.isArray(groupColumnsData)) {
      this.groupColumns = groupColumnsData;
    } else if (typeof groupColumnsData === 'string') {
      try {
        this.groupColumns = JSON.parse(groupColumnsData);
      } catch {
        this.groupColumns = [];
      }
    } else {
      this.groupColumns = [];
    }

    // Handle aggregations
    let aggregationsData: any;
    if (typeof settings.getString === 'function') {
      aggregationsData = settings.getString(
        GroupAndAggregateNodeModel.AGGREGATIONS_KEY, 
        '[]'
      );
    } else {
      aggregationsData = (settings as any)[GroupAndAggregateNodeModel.AGGREGATIONS_KEY] || '[]';
    }

    // Parse aggregations
    if (Array.isArray(aggregationsData)) {
      this.aggregations = aggregationsData;
    } else if (typeof aggregationsData === 'string') {
      try {
        this.aggregations = JSON.parse(aggregationsData);
      } catch {
        this.aggregations = [];
      }
    } else {
      this.aggregations = [];
    }
  }

  /**
   * Save settings to the settings object
   */
  saveSettings(settings: SettingsObject): void {
    const groupColumnsStr = JSON.stringify(this.groupColumns);
    const aggregationsStr = JSON.stringify(this.aggregations);

    if (typeof settings.set === 'function') {
      settings.set(GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY, groupColumnsStr);
      settings.set(GroupAndAggregateNodeModel.AGGREGATIONS_KEY, aggregationsStr);
    } else {
      (settings as any)[GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY] = groupColumnsStr;
      (settings as any)[GroupAndAggregateNodeModel.AGGREGATIONS_KEY] = aggregationsStr;
    }
  }

  /**
   * Validate settings
   */
  validateSettings(settings: SettingsObject): void {
    // Get group columns
    let groupColumnsData: any;
    if (typeof settings.getString === 'function') {
      groupColumnsData = settings.getString(
        GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY, 
        '[]'
      );
    } else {
      groupColumnsData = (settings as any)[GroupAndAggregateNodeModel.GROUP_COLUMNS_KEY] || '[]';
    }

    // Parse group columns
    let groupCols: string[];
    if (Array.isArray(groupColumnsData)) {
      groupCols = groupColumnsData;
    } else if (typeof groupColumnsData === 'string') {
      try {
        groupCols = JSON.parse(groupColumnsData);
      } catch {
        groupCols = [];
      }
    } else {
      groupCols = [];
    }

    // Get aggregations
    let aggregationsData: any;
    if (typeof settings.getString === 'function') {
      aggregationsData = settings.getString(
        GroupAndAggregateNodeModel.AGGREGATIONS_KEY, 
        '[]'
      );
    } else {
      aggregationsData = (settings as any)[GroupAndAggregateNodeModel.AGGREGATIONS_KEY] || '[]';
    }

    // Parse aggregations
    let aggregations: ColumnAggregation[];
    if (Array.isArray(aggregationsData)) {
      aggregations = aggregationsData;
    } else if (typeof aggregationsData === 'string') {
      try {
        aggregations = JSON.parse(aggregationsData);
      } catch {
        aggregations = [];
      }
    } else {
      aggregations = [];
    }

    // Validate
    if (groupCols.length === 0) {
      throw new Error('At least one group column must be specified');
    }

    if (aggregations.length === 0) {
      throw new Error('At least one aggregation must be specified');
    }

    aggregations.forEach((agg) => {
      if (!agg.columnName || !agg.method || !agg.newColumnName) {
        throw new Error(
          'Each aggregation must specify columnName, method, and newColumnName',
        );
      }

      if (!Object.values(AggregationMethod).includes(agg.method)) {
        throw new Error(`Invalid aggregation method: ${agg.method}`);
      }
    });
  }
}