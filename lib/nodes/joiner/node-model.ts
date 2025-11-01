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

// Define join types
export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
}

// Define join configuration for a pair of tables
export interface JoinConfiguration {
  leftColumn: string;
  rightColumn: string;
  joinType: JoinType;
}

/**
 * Node model that joins 2-3 tables based on common columns
 */
export class JoinerNodeModel extends NodeModel {
  // Settings keys
  private static JOIN_1_2_KEY = 'join_1_2';
  private static JOIN_1_3_KEY = 'join_1_3';
  private static COLUMN_PREFIX_1_KEY = 'column_prefix_1';
  private static COLUMN_PREFIX_2_KEY = 'column_prefix_2';
  private static COLUMN_PREFIX_3_KEY = 'column_prefix_3';

  // Settings values
  private join1_2: JoinConfiguration = {
    leftColumn: '',
    rightColumn: '',
    joinType: JoinType.INNER,
  };
  private join1_3: JoinConfiguration = {
    leftColumn: '',
    rightColumn: '',
    joinType: JoinType.INNER,
  };
  private columnPrefix1 = 'T1_';
  private columnPrefix2 = 'T2_';
  private columnPrefix3 = 'T3_';

  constructor() {
    // 2-3 input ports, 1 output port
    super(3, 1);
  }

  /**
   * Main execution method - joins tables
   */
  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    const table1 = inData[0];
    const table2 = inData[1];
    const table3 = inData.length > 2 ? inData[2] : null;

    context.setProgress(0, 'Starting table join...');

    // First join table1 and table2
    const intermediateResult = await this.joinTwoTables(
      table1,
      table2,
      this.join1_2,
      this.columnPrefix1,
      this.columnPrefix2,
      context,
    );

    // If there's a third table, join the result with table3
    if (table3) {
      context.setProgress(0.6, 'Joining with third table...');
      return [
        await this.joinWithThirdTable(
          intermediateResult,
          table3,
          this.join1_3,
          this.columnPrefix3,
          context,
        ),
      ];
    }

    return [intermediateResult];
  }

  /**
   * Joins two tables based on join configuration
   */
  private async joinTwoTables(
    leftTable: DataTableType,
    rightTable: DataTableType,
    joinConfig: JoinConfiguration,
    leftPrefix: string,
    rightPrefix: string,
    context: ExecutionContext,
  ): Promise<DataTableType> {
    const leftSpec = leftTable.spec;
    const rightSpec = rightTable.spec;

    // Get column indices
    const leftJoinIndex = leftSpec.findColumnIndex(joinConfig.leftColumn);
    const rightJoinIndex = rightSpec.findColumnIndex(joinConfig.rightColumn);

    if (leftJoinIndex < 0) {
      throw new Error(`Left join column '${joinConfig.leftColumn}' not found`);
    }
    if (rightJoinIndex < 0) {
      throw new Error(
        `Right join column '${joinConfig.rightColumn}' not found`,
      );
    }

    // Create output spec
    const outputSpec = this.createJoinedSpec(
      leftSpec,
      rightSpec,
      leftPrefix,
      rightPrefix,
      joinConfig,
    );
    const container = context.createDataTable(outputSpec);

    // Build hash map for right table for efficient joins
    context.setProgress(0.1, 'Building join index...');
    const rightMap = new Map<string, DataRow[]>();
    let rightRowCount = 0;

    rightTable.forEach((row: DataRow) => {
      if (rightRowCount % 1000 === 0) {
        context.checkCanceled();
      }

      const joinValue = String(row.cells[rightJoinIndex].getValue());
      if (!rightMap.has(joinValue)) {
        rightMap.set(joinValue, []);
      }
      rightMap.get(joinValue)?.push(row);
      rightRowCount++;
    });

    // Perform the join
    context.setProgress(0.3, 'Performing join...');
    let joinedRowCount = 0;
    let leftRowCount = 0;
    const usedRightRows = new Set<string>();

    leftTable.forEach((leftRow: DataRow) => {
      if (leftRowCount % 100 === 0) {
        context.checkCanceled();
        context.setProgress(
          0.3 + (leftRowCount / leftTable.size) * 0.3,
          `Processing left row ${leftRowCount} of ${leftTable.size}`,
        );
      }
      leftRowCount++;

      const leftJoinValue = String(leftRow.cells[leftJoinIndex].getValue());
      const rightMatches = rightMap.get(leftJoinValue) || [];

      if (rightMatches.length > 0) {
        // Inner join case - create row for each match
        rightMatches.forEach((rightRow, matchIndex) => {
          const joinedCells = this.createJoinedRow(
            leftRow,
            rightRow,
            leftSpec,
            rightSpec,
            leftPrefix,
            rightPrefix,
            joinConfig,
          );
          container.addRow(`joined_${joinedRowCount++}`, joinedCells);
          usedRightRows.add(`${leftJoinValue}_${matchIndex}`);
        });
      } else if (
        joinConfig.joinType === JoinType.LEFT ||
        joinConfig.joinType === JoinType.FULL
      ) {
        // Left join case - create row with nulls for right side
        const joinedCells = this.createJoinedRow(
          leftRow,
          null,
          leftSpec,
          rightSpec,
          leftPrefix,
          rightPrefix,
          joinConfig,
        );
        container.addRow(`joined_${joinedRowCount++}`, joinedCells);
      }
    });

    // For right and full joins, add unmatched right rows
    if (
      joinConfig.joinType === JoinType.RIGHT ||
      joinConfig.joinType === JoinType.FULL
    ) {
      context.setProgress(0.7, 'Adding unmatched right rows...');

      rightMap.forEach((rightRows, joinValue) => {
        rightRows.forEach((rightRow, matchIndex) => {
          const rowKey = `${joinValue}_${matchIndex}`;
          if (!usedRightRows.has(rowKey)) {
            const joinedCells = this.createJoinedRow(
              null,
              rightRow,
              leftSpec,
              rightSpec,
              leftPrefix,
              rightPrefix,
              joinConfig,
            );
            container.addRow(`joined_${joinedRowCount++}`, joinedCells);
          }
        });
      });
    }

    context.setProgress(0.9, 'Finalizing join...');
    return container.close();
  }

  /**
   * Joins the intermediate result with the third table
   */
  private async joinWithThirdTable(
    intermediateTable: DataTableType,
    table3: DataTableType,
    joinConfig: JoinConfiguration,
    table3Prefix: string,
    context: ExecutionContext,
  ): Promise<DataTableType> {
    const intermediateSpec = intermediateTable.spec;
    const table3Spec = table3.spec;

    // Find join columns
    const intermediateJoinIndex = intermediateSpec.findColumnIndex(
      joinConfig.leftColumn,
    );
    const table3JoinIndex = table3Spec.findColumnIndex(joinConfig.rightColumn);

    if (intermediateJoinIndex < 0) {
      throw new Error(
        `Intermediate join column '${joinConfig.leftColumn}' not found`,
      );
    }
    if (table3JoinIndex < 0) {
      throw new Error(
        `Third table join column '${joinConfig.rightColumn}' not found`,
      );
    }

    // Create final output spec
    const finalColumns: ColumnSpec[] = [...intermediateSpec.columns];

    // Add table3 columns (excluding join column to avoid duplication)
    table3Spec.columns.forEach((col, index) => {
      if (index !== table3JoinIndex) {
        finalColumns.push({
          name: `${table3Prefix}${col.name}`,
          type: col.type,
        });
      }
    });

    const finalSpec: DataTableSpec = {
      columns: finalColumns,
      findColumnIndex: (name: string): number => {
        return finalColumns.findIndex((col) => col.name === name);
      },
    };

    const container = context.createDataTable(finalSpec);

    // Build hash map for table3
    const table3Map = new Map<string, DataRow[]>();
    table3.forEach((row: DataRow) => {
      const joinValue = String(row.cells[table3JoinIndex].getValue());
      if (!table3Map.has(joinValue)) {
        table3Map.set(joinValue, []);
      }
      table3Map.get(joinValue)?.push(row);
    });

    // Perform second join
    let finalRowCount = 0;
    let intermediateRowCount = 0;

    intermediateTable.forEach((intermediateRow: DataRow) => {
      if (intermediateRowCount % 100 === 0) {
        context.checkCanceled();
        context.setProgress(
          0.6 + (intermediateRowCount / intermediateTable.size) * 0.3,
          `Processing intermediate row ${intermediateRowCount} of ${intermediateTable.size}`,
        );
      }
      intermediateRowCount++;

      const joinValue = String(
        intermediateRow.cells[intermediateJoinIndex].getValue(),
      );
      const table3Matches = table3Map.get(joinValue) || [];

      if (table3Matches.length > 0) {
        table3Matches.forEach((table3Row) => {
          const finalCells = [...intermediateRow.cells];

          // Add table3 columns (excluding join column)
          table3Row.cells.forEach((cell, index) => {
            if (index !== table3JoinIndex) {
              finalCells.push(cell);
            }
          });

          container.addRow(`final_${finalRowCount++}`, finalCells);
        });
      } else if (
        joinConfig.joinType === JoinType.LEFT ||
        joinConfig.joinType === JoinType.FULL
      ) {
        // Add row with nulls for table3 columns
        const finalCells = [...intermediateRow.cells];

        table3Spec.columns.forEach((col, index) => {
          if (index !== table3JoinIndex) {
            finalCells.push({ type: col.type, getValue: () => null });
          }
        });

        container.addRow(`final_${finalRowCount++}`, finalCells);
      }
    });

    return container.close();
  }

  /**
   * Creates joined row cells
   */
  private createJoinedRow(
    leftRow: DataRow | null,
    rightRow: DataRow | null,
    leftSpec: DataTableSpec,
    rightSpec: DataTableSpec,
    leftPrefix: string,
    rightPrefix: string,
    joinConfig: JoinConfiguration,
  ): Cell[] {
    const cells: Cell[] = [];

    // Add left table columns
    if (leftRow) {
      cells.push(...leftRow.cells);
    } else {
      // Add null cells for left table
      leftSpec.columns.forEach((col) => {
        cells.push({ type: col.type, getValue: () => null });
      });
    }

    // Add right table columns (excluding join column to avoid duplication)
    const rightJoinIndex = rightSpec.findColumnIndex(joinConfig.rightColumn);

    if (rightRow) {
      rightRow.cells.forEach((cell, index) => {
        if (index !== rightJoinIndex) {
          cells.push(cell);
        }
      });
    } else {
      // Add null cells for right table (excluding join column)
      rightSpec.columns.forEach((col, index) => {
        if (index !== rightJoinIndex) {
          cells.push({ type: col.type, getValue: () => null });
        }
      });
    }

    return cells;
  }

  /**
   * Creates the joined table specification
   */
  private createJoinedSpec(
    leftSpec: DataTableSpec,
    rightSpec: DataTableSpec,
    leftPrefix: string,
    rightPrefix: string,
    joinConfig: JoinConfiguration,
  ): DataTableSpec {
    const columns: ColumnSpec[] = [];

    // Add left table columns with prefix
    leftSpec.columns.forEach((col) => {
      columns.push({
        name: `${leftPrefix}${col.name}`,
        type: col.type,
      });
    });

    // Add right table columns with prefix (excluding join column to avoid duplication)
    const rightJoinIndex = rightSpec.findColumnIndex(joinConfig.rightColumn);
    rightSpec.columns.forEach((col, index) => {
      if (index !== rightJoinIndex) {
        columns.push({
          name: `${rightPrefix}${col.name}`,
          type: col.type,
        });
      }
    });

    return {
      columns,
      findColumnIndex: (name: string): number => {
        return columns.findIndex((col) => col.name === name);
      },
    };
  }

  /**
   * Validates input and defines output structure
   */
  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (_inSpecs.length < 2) {
      throw new Error('Joiner requires at least 2 input tables');
    }

    // Validate first join
    if (this.join1_2.leftColumn && this.join1_2.rightColumn) {
      const leftIndex = _inSpecs[0].findColumnIndex(this.join1_2.leftColumn);
      const rightIndex = _inSpecs[1].findColumnIndex(this.join1_2.rightColumn);

      if (leftIndex < 0) {
        throw new Error(
          `Left join column '${this.join1_2.leftColumn}' not found in first table`,
        );
      }
      if (rightIndex < 0) {
        throw new Error(
          `Right join column '${this.join1_2.rightColumn}' not found in second table`,
        );
      }
    }

    // Validate second join if third table exists
    if (
      _inSpecs.length > 2 &&
      this.join1_3.leftColumn &&
      this.join1_3.rightColumn
    ) {
      // Note: For 3-table join, leftColumn refers to a column from the intermediate result
      const table3Index = _inSpecs[2].findColumnIndex(this.join1_3.rightColumn);

      if (table3Index < 0) {
        throw new Error(
          `Third table join column '${this.join1_3.rightColumn}' not found in third table`,
        );
      }
    }

    // Create joined spec
    let outputSpec = this.createJoinedSpec(
      _inSpecs[0],
      _inSpecs[1],
      this.columnPrefix1,
      this.columnPrefix2,
      this.join1_2,
    );

    // If there's a third table, extend the spec
    if (_inSpecs.length > 2) {
      const finalColumns: ColumnSpec[] = [...outputSpec.columns];

      // Add table3 columns
      const table3JoinIndex = _inSpecs[2].findColumnIndex(
        this.join1_3.rightColumn,
      );
      _inSpecs[2].columns.forEach((col, index) => {
        if (index !== table3JoinIndex) {
          finalColumns.push({
            name: `${this.columnPrefix3}${col.name}`,
            type: col.type,
          });
        }
      });

      outputSpec = {
        columns: finalColumns,
        findColumnIndex: (name: string): number => {
          return finalColumns.findIndex((col) => col.name === name);
        },
      };
    }

    return [outputSpec];
  }

  /**
   * Load settings from the settings object
   */
  loadSettings(settings: SettingsObject): void {
    this.join1_2 = JSON.parse(
      settings.getString
        ? settings.getString(
            JoinerNodeModel.JOIN_1_2_KEY,
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
          )
        : (settings as any)[JoinerNodeModel.JOIN_1_2_KEY] ||
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
    );

    this.join1_3 = JSON.parse(
      settings.getString
        ? settings.getString(
            JoinerNodeModel.JOIN_1_3_KEY,
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
          )
        : (settings as any)[JoinerNodeModel.JOIN_1_3_KEY] ||
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
    );

    this.columnPrefix1 = settings.getString
      ? settings.getString(JoinerNodeModel.COLUMN_PREFIX_1_KEY, 'T1_')
      : (settings as any)[JoinerNodeModel.COLUMN_PREFIX_1_KEY] || 'T1_';

    this.columnPrefix2 = settings.getString
      ? settings.getString(JoinerNodeModel.COLUMN_PREFIX_2_KEY, 'T2_')
      : (settings as any)[JoinerNodeModel.COLUMN_PREFIX_2_KEY] || 'T2_';

    this.columnPrefix3 = settings.getString
      ? settings.getString(JoinerNodeModel.COLUMN_PREFIX_3_KEY, 'T3_')
      : (settings as any)[JoinerNodeModel.COLUMN_PREFIX_3_KEY] || 'T3_';
  }

  /**
   * Save settings to the settings object
   */
  saveSettings(settings: SettingsObject): void {
    settings.set(JoinerNodeModel.JOIN_1_2_KEY, JSON.stringify(this.join1_2));
    settings.set(JoinerNodeModel.JOIN_1_3_KEY, JSON.stringify(this.join1_3));
    settings.set(JoinerNodeModel.COLUMN_PREFIX_1_KEY, this.columnPrefix1);
    settings.set(JoinerNodeModel.COLUMN_PREFIX_2_KEY, this.columnPrefix2);
    settings.set(JoinerNodeModel.COLUMN_PREFIX_3_KEY, this.columnPrefix3);
  }

  /**
   * Validate settings
   */
  validateSettings(settings: SettingsObject): void {
    const join1_2 = JSON.parse(
      settings.getString
        ? settings.getString(
            JoinerNodeModel.JOIN_1_2_KEY,
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
          )
        : (settings as any)[JoinerNodeModel.JOIN_1_2_KEY] ||
            '{"leftColumn":"","rightColumn":"","joinType":"INNER"}',
    );

    if (!join1_2.leftColumn || !join1_2.rightColumn) {
      throw new Error('Join columns must be specified for the first join');
    }

    if (!Object.values(JoinType).includes(join1_2.joinType)) {
      throw new Error(`Invalid join type: ${join1_2.joinType}`);
    }
  }

  // Getters and setters
  getJoin1_2(): JoinConfiguration {
    return { ...this.join1_2 };
  }

  setJoin1_2(join: JoinConfiguration): void {
    this.join1_2 = { ...join };
  }

  getJoin1_3(): JoinConfiguration {
    return { ...this.join1_3 };
  }

  setJoin1_3(join: JoinConfiguration): void {
    this.join1_3 = { ...join };
  }

  getColumnPrefixes(): { prefix1: string; prefix2: string; prefix3: string } {
    return {
      prefix1: this.columnPrefix1,
      prefix2: this.columnPrefix2,
      prefix3: this.columnPrefix3,
    };
  }

  setColumnPrefixes(prefix1: string, prefix2: string, prefix3: string): void {
    this.columnPrefix1 = prefix1;
    this.columnPrefix2 = prefix2;
    this.columnPrefix3 = prefix3;
  }
}
