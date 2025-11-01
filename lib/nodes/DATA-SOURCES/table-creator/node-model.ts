import type {
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
  DataValue,
  DataMatrix
} from '@/lib/types';
import { NodeModel } from '@/lib/nodes/core';
import { SimpleCell } from '../../../types';

// Interface for column header configuration (simplified)
export interface ColumnHeader {
  name: string;
  type: 'string' | 'number' | 'date';
  allowNull: boolean;
}

export class TableCreatorNodeModel extends NodeModel {
  private static HEADERS_KEY = 'headers';
  private static CELLS_KEY = 'cells';
  private static GRID_SIZE_KEY = 'gridSize';

  private headers: string[] = [];
  private cells: DataMatrix = [];
  private gridSize: { rows: number; cols: number } = { rows: 0, cols: 0 };

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(_inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    // Create output spec based on headers or detected column types
    const outputSpec = this.createOutputSpec();

    // Create output table
    const outputTable = context.createDataTable(outputSpec);

    // Add rows to output table
    const processedRows = this.getProcessedRows();
    processedRows.forEach((row, rowIndex) => {
      const cells = row.map((value, colIndex) => {
        const type = outputSpec.columns[colIndex]?.type || 'string';
        return new SimpleCell(type, value);
      });
      outputTable.addRow(`row-${rowIndex}`, cells);
    });

    return [outputTable.close()];
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    // Ensure headers is always an array
    if (!Array.isArray(this.headers)) {
      this.headers = [];
    }

    // If no headers defined, return empty spec
    if (this.headers.length === 0) {
      return [
        {
          columns: [],
          findColumnIndex: (_name: string) => -1,
        },
      ];
    }

    // Return a generic spec since we don't know types until execution
    return [
      {
        columns: this.headers.map((name) => ({
          name: name || '',
          type: 'string',
        })),
        findColumnIndex: (name: string) =>
          this.headers.findIndex((headerName) => headerName === name),
      },
    ];
  }

  loadSettings(settings: SettingsObject): void {
    // Load headers
    let headersData;
    if (settings.getString) {
      headersData = settings.getString('headers', '');
    } else {
      headersData = (settings as any)['headers'] || '';
    }
    
    if (headersData) {
      if (Array.isArray(headersData)) {
        this.headers = headersData;
      } else if (typeof headersData === 'string') {
        try {
          this.headers = JSON.parse(headersData);
        } catch {
          this.headers = [];
        }
      } else {
        this.headers = [];
      }
    }

    // Load cells
    let cellsData;
    if (settings.getString) {
      cellsData = settings.getString('cells', '');
    } else {
      cellsData = (settings as any)['cells'] || '';
    }
    
    if (cellsData) {
      if (Array.isArray(cellsData)) {
        this.cells = cellsData;
      } else if (typeof cellsData === 'string') {
        try {
          const parsedCells = JSON.parse(cellsData);
          if (Array.isArray(parsedCells)) {
            this.cells = parsedCells;
          }
        } catch {
          this.cells = [];
        }
      } else {
        this.cells = [];
      }
    }

    // Load grid size
    let gridSizeData;
    if (settings.getString) {
      gridSizeData = settings.getString('gridSize', '');
    } else {
      gridSizeData = (settings as any)['gridSize'] || '';
    }
    
    if (gridSizeData) {
      if (typeof gridSizeData === 'object' && !Array.isArray(gridSizeData)) {
        this.gridSize = gridSizeData;
      } else if (typeof gridSizeData === 'string') {
        try {
          this.gridSize = JSON.parse(gridSizeData);
        } catch {
          this.gridSize = { rows: 0, cols: 0 };
        }
      } else {
        this.gridSize = { rows: 0, cols: 0 };
      }
    }
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(
        TableCreatorNodeModel.HEADERS_KEY,
        JSON.stringify(this.headers),
      );
      settings.set(
        TableCreatorNodeModel.CELLS_KEY,
        JSON.stringify(this.cells),
      );
      settings.set(
        TableCreatorNodeModel.GRID_SIZE_KEY,
        JSON.stringify(this.gridSize),
      );
    } else {
      (settings as any)[TableCreatorNodeModel.HEADERS_KEY] = this.headers;
      (settings as any)[TableCreatorNodeModel.CELLS_KEY] = this.cells;
      (settings as any)[TableCreatorNodeModel.GRID_SIZE_KEY] = this.gridSize;
    }
  }

  validateSettings(settings: SettingsObject): void {
    // Handle headers safely
    let headersData;
    if (settings.getString) {
      headersData = settings.getString(TableCreatorNodeModel.HEADERS_KEY, '[]');
    } else {
      headersData = (settings as any)[TableCreatorNodeModel.HEADERS_KEY] || '[]';
    }
    
    const headers = Array.isArray(headersData) 
      ? headersData 
      : typeof headersData === 'string' 
        ? JSON.parse(headersData) 
        : [];

    if (!Array.isArray(headers) || headers.length === 0) {
      throw new Error('At least one column header must be defined');
    }

    // Validate header names are unique and not empty (headers are strings, not objects)
    const headerNames = headers.filter((name: string) => name?.trim());
    const uniqueNames = new Set(headerNames);
    if (uniqueNames.size !== headerNames.length && headerNames.length > 0) {
      throw new Error('Column names must be unique and not empty');
    }
  }

  private createOutputSpec(): DataTableSpec {
    const rows = this.getProcessedRowsInternal();
    const columnTypes = this.detectColumnTypes(rows);

    return {
      columns: columnTypes,
      findColumnIndex(name: string): number {
        return columnTypes.findIndex(col => col.name === name);
      }
    };
  }

  private getProcessedRowsInternal(): DataMatrix {
    const rows: DataMatrix = [];
    const { rows: numRows, cols: numCols } = this.gridSize;

    // Use headers if available, otherwise use default column names
    const effectiveHeaders = this.headers.length > 0
      ? this.headers
      : Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);

    // Add header row
    rows.push(effectiveHeaders);

    // Add data rows
    for (let i = 0; i < numRows; i++) {
      const rowData: DataValue[] = [];
      for (let j = 0; j < numCols; j++) {
        rowData.push(this.cells[i]?.[j] ?? '');
      }
      rows.push(rowData);
    }

    return rows;
  }

  private detectColumnTypes(rows: DataMatrix): { name: string; type: string }[] {
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    return headers.map((header, colIndex) => {
      const columnValues = dataRows.map(row => row[colIndex]);
      const type = this.inferColumnType(columnValues);
      return {
        name: String(header),
        type
      };
    });
  }

  private inferColumnType(values: DataValue[]): string {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) {
      return 'string';
    }

    const allNumbers = nonNullValues.every(v => !Number.isNaN(Number(v)));
    if (allNumbers) {
      return 'number';
    }

    const allBooleans = nonNullValues.every(v => 
      typeof v === 'boolean' || v === 'true' || v === 'false'
    );
    if (allBooleans) {
      return 'boolean';
    }

    return 'string';
  }

  private getProcessedRowsData(): DataMatrix {
    const rows: DataMatrix = [];
    const { rows: numRows, cols: numCols } = this.gridSize;

    for (let i = 0; i < numRows; i++) {
      const rowData: DataValue[] = [];
      for (let j = 0; j < numCols; j++) {
        rowData.push(this.cells[i]?.[j] ?? '');
      }
      rows.push(rowData);
    }

    return rows;
  }

  private processValue(
    value: DataValue,
    type: string
  ): DataValue {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    switch (type) {
      case 'number': {
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
      }
      case 'boolean':
        return String(value).toLowerCase() === 'true';
      default:
        return String(value);
    }
  }

  getProcessedRows(): DataMatrix {
    return this.getProcessedRowsData();
  }

  getCellValue(row: number, col: number): DataValue {
    return this.cells[row]?.[col] ?? '';
  }

  setCellValue(row: number, col: number, value: DataValue): void {
    if (!this.cells[row]) {
      this.cells[row] = [];
    }
    this.cells[row][col] = value;
  }

  getHeaders(): string[] {
    return [...this.headers];
  }

  setHeaders(headers: string[]): void {
    this.headers = [...headers];
  }

  getGridSize(): { rows: number; cols: number } {
    return { ...this.gridSize };
  }

  setGridSize(rows: number, cols: number): void {
    this.gridSize = { rows: Math.max(10, rows), cols: Math.max(1, cols) };
  }

  getAllCells(): Record<string, { type: string; value: DataValue }[]> {
    const result: Record<string, { type: string; value: DataValue }[]> = {};
    this.cells.forEach((row, rowIndex) => {
      result[`row-${rowIndex}`] = row.map((value, colIndex) => ({
        type: this.headers[colIndex] || 'string',
        value,
      }));
    });
    return result;
  }

  setAllCells(cells: Record<string, { type: string; value: DataValue }[]>): void {
    this.cells = Object.values(cells).map(row =>
      row.map(({ type, value }) => this.processValue(value, type))
    );
  }
}
