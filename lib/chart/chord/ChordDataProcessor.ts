import type { ChordChartConfig } from './ChordSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Helper function to convert tabular data to adjacency matrix
function csvToMatrix(
  dataTable: DataTableType,
  config: ChordChartConfig,
): { matrix: number[][]; keys: string[] } {
  const { headers, data } = parseDataTable(dataTable);
  const { fromColumn, toColumn, valueColumn } = config.dataMapping;

  if (
    !fromColumn ||
    !toColumn ||
    !valueColumn ||
    !headers.includes(fromColumn) ||
    !headers.includes(toColumn) ||
    !headers.includes(valueColumn)
  ) {
    return { matrix: [], keys: [] };
  }

  // Get unique nodes
  const nodesSet = new Set<string>();
  data.forEach((row) => {
    const from = cleanString(row[fromColumn]);
    const to = cleanString(row[toColumn]);
    if (from !== 'unknown' && to !== 'unknown') {
      nodesSet.add(from);
      nodesSet.add(to);
    }
  });

  const nodes = Array.from(nodesSet).sort();
  const nodeIndex = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIndex.set(node, index);
  });

  // Initialize matrix
  const matrix: number[][] = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(0));

  // Fill matrix with data
  data.forEach((row) => {
    const from = cleanString(row[fromColumn]);
    const to = cleanString(row[toColumn]);
    const value = toNumber(row[valueColumn]);

    if (from !== 'unknown' && to !== 'unknown' && Number.isFinite(value)) {
      const fromIndex = nodeIndex.get(from);
      const toIndex = nodeIndex.get(to);

      if (fromIndex !== undefined && toIndex !== undefined) {
        matrix[fromIndex][toIndex] = value;
      }
    }
  });

  return { matrix, keys: nodes };
}

// Chord Chart Data Processor
export function processChordData(
  dataTable: DataTableType,
  config: ChordChartConfig,
): any {
  // If matrix is provided directly in config, use it
  if (config.dataMapping.matrix && config.dataMapping.matrix.length > 0) {
    return {
      matrix: config.dataMapping.matrix,
      keys:
        config.dataMapping.keys ||
        config.dataMapping.matrix.map((_, i) => `Node ${i + 1}`),
    };
  }

  // Otherwise convert DataTable to matrix
  const { matrix, keys } = csvToMatrix(dataTable, config);

  if (matrix.length === 0) {
    return { matrix: [], keys: [] };
  }

  return { matrix, keys };
}

// Get required columns for chord chart
export function getRequiredColumns(config: ChordChartConfig): string[] {
  // If matrix is provided directly, no columns are required
  if (config.dataMapping.matrix && config.dataMapping.matrix.length > 0) {
    return [];
  }

  const columns: string[] = [];
  if (config.dataMapping.fromColumn) {
    columns.push(config.dataMapping.fromColumn);
  }
  if (config.dataMapping.toColumn) {
    columns.push(config.dataMapping.toColumn);
  }
  if (config.dataMapping.valueColumn) {
    columns.push(config.dataMapping.valueColumn);
  }

  return columns;
}

// Validate DataTableType for chord chart
export function validateCsvForChord(
  dataTable: DataTableType,
  config: ChordChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
