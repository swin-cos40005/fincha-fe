import type { SankeyChartConfig } from './SankeySchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Convert data to Sankey nodes and links format
function buildSankeyData(
  data: any[],
  config: SankeyChartConfig,
): { nodes: any[]; links: any[] } {
  const { sourceColumn, targetColumn, valueColumn } = config.dataMapping;

  const nodeSet = new Set<string>();
  const links: any[] = [];

  // Process each row to create links and collect unique nodes
  data.forEach((row) => {
    const source = cleanString(row[sourceColumn]);
    const target = cleanString(row[targetColumn]);
    const value = toNumber(row[valueColumn]);

    if (source !== 'unknown' && target !== 'unknown' && value > 0) {
      nodeSet.add(source);
      nodeSet.add(target);

      links.push({
        source,
        target,
        value,
      });
    }
  });

  // Create nodes array
  const nodes = Array.from(nodeSet).map((id) => ({
    id,
    nodeColor: 'hsl(206, 70%, 50%)', // Default color, can be customized
  }));

  return { nodes, links };
}

// Sankey Chart Data Processor
export function processSankeyData(
  dataTable: DataTableType,
  config: SankeyChartConfig,
): any {
  const { headers, data } = parseDataTable(dataTable);
  const { sourceColumn, targetColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(sourceColumn) ||
    !headers.includes(targetColumn) ||
    !headers.includes(valueColumn)
  ) {
    return { nodes: [], links: [] };
  }

  // Filter out invalid data
  const validData = data.filter((item: any) => {
    const source = cleanString(item[sourceColumn]);
    const target = cleanString(item[targetColumn]);
    const value = toNumber(item[valueColumn]);
    return source !== 'unknown' && target !== 'unknown' && value > 0;
  });

  if (validData.length === 0) {
    return { nodes: [], links: [] };
  }

  return buildSankeyData(validData, config);
}

// Get required columns for sankey chart
export function getRequiredColumns(config: SankeyChartConfig): string[] {
  return [
    config.dataMapping.sourceColumn,
    config.dataMapping.targetColumn,
    config.dataMapping.valueColumn,
  ];
}

// Validate DataTableType for sankey chart
export function validateCsvForSankey(
  dataTable: DataTableType,
  config: SankeyChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
