/**
 * Utility functions for handling node icons and images
 */

/**
 * Helper function to create image metadata for nodes
 * @param imagePath - Path to the image (relative to public folder or absolute URL)
 * @returns Image path that can be used in NodeMetadata
 */
export function createNodeImage(imagePath: string): string {
  // If it's already a full URL or data URL, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's a relative path, assume it's in the public folder
  if (!imagePath.startsWith('/')) {
    return `/images/nodes/${imagePath}`;
  }

  return imagePath;
}

/**
 * Helper function to create a data URL from SVG content
 * @param svgContent - SVG content as string
 * @returns Data URL that can be used as image source
 */
export function createSvgDataUrl(svgContent: string): string {
  const base64 = btoa(svgContent);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Common image formats supported for node icons
 */
export const SUPPORTED_IMAGE_FORMATS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp',
  '.gif',
] as const;

/**
 * Validates if a file extension is supported for node images
 */
export function isSupportedImageFormat(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_IMAGE_FORMATS.includes(extension as any);
}

// Enhanced utilities for AI agent data processing

import type { DataTableType, DataRow, ColumnSpec } from '@/lib/types';

/**
 * Types for different node output data
 */
export type NodeOutputType =
  | 'table'
  | 'statistics'
  | 'chart'
  | 'image'
  | 'text'
  | 'error';

export interface NodeExecutionResult {
  type: NodeOutputType;
  data: any;
  summary: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
}

export interface ColumnStatistics {
  columnName: string;
  type: string;
  count: number;
  nullCount: number;
  uniqueCount?: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  mode?: any;
}

export interface StatisticsData {
  summary: string;
  metrics: Record<string, any>;
  details: Record<string, any>;
}

/**
 * Samples random rows from a DataTableType for AI agent consumption
 * @param dataTable - The DataTableType to sample from
 * @param maxRows - Maximum number of rows to sample (default: 10)
 * @returns Sampled data with metadata
 */
export function sampleTableData(dataTable: DataTableType, maxRows = 10) {
  const totalRows = dataTable.size;
  const sampleSize = Math.min(maxRows, totalRows);

  // Get column specs
  const columns = dataTable.spec.columns;

  // Sample rows randomly
  const allRows = Array.from(dataTable.rows);
  const sampledRows: DataRow[] = [];

  if (sampleSize >= totalRows) {
    // Take all rows if sample size is larger than total
    sampledRows.push(...allRows);
  } else {
    // Random sampling without replacement
    const indices = new Set<number>();
    while (indices.size < sampleSize) {
      indices.add(Math.floor(Math.random() * totalRows));
    }

    for (const index of indices) {
      sampledRows.push(allRows[index]);
    }
  }

  // Convert to simple array format
  const rows = sampledRows.map((row) =>
    row.cells.map((cell) => cell.getValue()),
  );

  // Calculate basic statistics for numeric columns
  const statistics = calculateColumnStatistics(dataTable);

  return {
    columns,
    rows,
    totalRows,
    sampleSize: sampledRows.length,
    statistics,
  };
}

/**
 * Calculates basic statistics for all columns in a DataTableType
 */
export function calculateColumnStatistics(
  dataTable: DataTableType,
): ColumnStatistics[] {
  const columns = dataTable.spec.columns;
  const statistics: ColumnStatistics[] = [];

  columns.forEach((column, colIndex) => {
    const values: any[] = [];
    const nonNullValues: any[] = [];

    dataTable.forEach((row) => {
      const value = row.cells[colIndex].getValue();
      values.push(value);
      if (value !== null && value !== undefined && value !== '') {
        nonNullValues.push(value);
      }
    });

    const stat: ColumnStatistics = {
      columnName: column.name,
      type: column.type,
      count: values.length,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: new Set(nonNullValues).size,
    };

    // Calculate numeric statistics for number columns
    if (column.type === 'number' && nonNullValues.length > 0) {
      const numericValues = nonNullValues
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v));
      if (numericValues.length > 0) {
        stat.min = Math.min(...numericValues);
        stat.max = Math.max(...numericValues);
        stat.mean =
          numericValues.reduce((sum, val) => sum + val, 0) /
          numericValues.length;

        // Calculate median
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stat.median =
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
      }
    }

    // Calculate mode for categorical data
    if (column.type === 'string' && nonNullValues.length > 0) {
      const frequency = new Map<any, number>();
      nonNullValues.forEach((value) => {
        frequency.set(value, (frequency.get(value) || 0) + 1);
      });

      let maxFreq = 0;
      let mode = null;
      for (const [value, freq] of frequency.entries()) {
        if (freq > maxFreq) {
          maxFreq = freq;
          mode = value;
        }
      }
      stat.mode = mode;
    }

    statistics.push(stat);
  });

  return statistics;
}

/**
 * Formats statistics data for AI agent consumption
 */
export function formatStatisticsForAgent(stats: StatisticsData): string {
  let formatted = `📊 **Statistics Summary**\n${stats.summary}\n\n`;

  if (Object.keys(stats.metrics).length > 0) {
    formatted += `**Key Metrics:**\n`;
    Object.entries(stats.metrics).forEach(([_key, value]) => {
      formatted += `• ${_key}: ${formatValue(value)}\n`;
    });
    formatted += '\n';
  }

  if (Object.keys(stats.details).length > 0) {
    formatted += `**Detailed Information:**\n`;
    Object.entries(stats.details).forEach(([_key, value]) => {
      formatted += `• ${_key}: ${formatValue(value)}\n`;
    });
  }

  return formatted;
}

/**
 * Formats table data for AI agent consumption
 */
export function formatTableDataForAgent(sample: {
  columns: ColumnSpec[];
  rows: any[][];
  totalRows: number;
  sampleSize: number;
  statistics?: ColumnStatistics[];
}): string {
  let formatted = `📋 **Table Data (${sample.sampleSize} of ${sample.totalRows} rows)**\n\n`;

  // Add column information
  formatted += `**Columns (${sample.columns.length}):**\n`;
  sample.columns.forEach((col: ColumnSpec) => {
    formatted += `• ${col.name} (${col.type})\n`;
  });
  formatted += '\n';

  // Add sample rows in a formatted table
  if (sample.rows.length > 0) {
    formatted += `**Sample Data:**\n`;

    // Create header row
    const headers = sample.columns.map((col: ColumnSpec) => col.name);
    formatted += `| ${headers.join(' | ')} |\n`;
    formatted += `|${headers.map(() => '---').join('|')}|\n`;

    // Add data rows (limit to prevent overwhelming output)
    const displayRows = sample.rows.slice(0, 5);
    displayRows.forEach((row: any[]) => {
      const formattedRow = row.map((cell: any) => formatCellValue(cell));
      formatted += `| ${formattedRow.join(' | ')} |\n`;
    });

    if (sample.rows.length > 5) {
      formatted += `... and ${sample.rows.length - 5} more rows\n`;
    }
  }

  // Add basic statistics if available
  if (sample.statistics && sample.statistics.length > 0) {
    formatted += '\n**Column Statistics:**\n';
    sample.statistics.forEach((stat: ColumnStatistics) => {
      formatted += `• **${stat.columnName}**: ${stat.count} values, ${stat.nullCount} nulls`;
      if (stat.uniqueCount !== undefined) {
        formatted += `, ${stat.uniqueCount} unique`;
      }
      if (stat.mean !== undefined) {
        formatted += `, avg: ${stat.mean.toFixed(2)}`;
      }
      if (stat.min !== undefined && stat.max !== undefined) {
        formatted += `, range: ${stat.min} - ${stat.max}`;
      }
      formatted += '\n';
    });
  }

  return formatted;
}

/**
 * Creates a screenshot placeholder for chart/image data
 */
export function createImagePlaceholderForAgent(
  nodeId: string,
  imageType: string,
): string {
  return `🖼️ **${imageType} Generated** (Node: ${nodeId})\n\nA ${imageType.toLowerCase()} has been generated and is visible in the workflow editor. The image contains visual data that cannot be directly transmitted to this chat interface.\n\n💡 To view the ${imageType.toLowerCase()}, check the workflow editor interface.`;
}

/**
 * Formats any value for display
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number') {
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Formats a cell value for table display (truncates long strings)
 */
function formatCellValue(value: any): string {
  const str = formatValue(value);
  return str.length > 20 ? `${str.substring(0, 17)}...` : str;
}

/**
 * Determines the output type of node execution result
 */
export function determineOutputType(output: any): NodeOutputType {
  if (!output || (Array.isArray(output) && output.length === 0)) {
    return 'text';
  }

  // Check if it's a DataTableType
  if (output.spec && output.rows && typeof output.size === 'number') {
    return 'table';
  }

  // Check if it's an array of DataTableTypes
  if (
    Array.isArray(output) &&
    output.length > 0 &&
    output[0].spec &&
    output[0].rows
  ) {
    return 'table';
  }

  // Check if it's statistics data
  if (
    typeof output === 'object' &&
    (output.summary || output.metrics || output.statistics)
  ) {
    return 'statistics';
  }

  // Check if it's image/chart data
  if (
    typeof output === 'object' &&
    (output.chartType || output.imageData || output.chart)
  ) {
    return 'chart';
  }

  // Check if it's an error
  if (output instanceof Error || (typeof output === 'object' && output.error)) {
    return 'error';
  }

  return 'text';
}

/**
 * Creates a standardized execution result for AI agent consumption
 */
export function createExecutionResultForAgent(
  nodeId: string,
  nodeLabel: string,
  output: any,
  error?: Error,
): NodeExecutionResult {
  const timestamp = new Date().toISOString();

  if (error) {
    return {
      type: 'error',
      data: { error: error.message, stack: error.stack },
      summary: `❌ **Execution Failed**: ${error.message}`,
      timestamp,
      nodeId,
      nodeLabel,
    };
  }

  const outputType = determineOutputType(output);

  let data: any;
  let summary: string;

  switch (outputType) {
    case 'table': {
      const tables = Array.isArray(output) ? output : [output];
      const samples = tables.map((table) => sampleTableData(table));
      data = samples;
      summary = `📋 **Table Data Generated**: ${samples.length} table(s) with ${samples.map((s) => `${s.totalRows} rows`).join(', ')}`;
      break;
    }

    case 'statistics':
      data = output;
      summary =
        typeof output.summary === 'string'
          ? output.summary
          : '📊 **Statistics Calculated**';
      break;

    case 'chart':
      // Include actual chart data instead of placeholder
      data = output;
      summary = `📊 **Chart Generated**: ${output.chartType || 'Chart'} visualization created with ${output.dataRows || 0} data points`;
      break;

    case 'image':
      data = { type: 'image', placeholder: true };
      summary = createImagePlaceholderForAgent(nodeId, 'Image');
      break;

    default:
      data = output;
      summary = `✅ **Processing Complete**: ${typeof output === 'string' ? output : 'Data processed successfully'}`;
  }

  return {
    type: outputType,
    data,
    summary,
    timestamp,
    nodeId,
    nodeLabel,
  };
}
