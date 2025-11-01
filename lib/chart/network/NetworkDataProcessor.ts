import type { NetworkChartConfig } from './NetworkSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Network Chart Data Processor
export function processNetworkData(
  dataTable: DataTableType,
  config: NetworkChartConfig,
): { nodes: any[]; links: any[] } {
  const { headers, data } = parseDataTable(dataTable);
  const {
    linkSourceColumn,
    linkTargetColumn,
    linkValueColumn,
    nodeIdColumn,
    nodeGroupColumn,
    nodeSizeColumn,
  } = config.dataMapping;

  if (!data.length || !headers.includes(nodeIdColumn)) {
    return { nodes: [], links: [] };
  }

  // Build nodes from data
  const nodeMap = new Map<string, any>();
  const links: any[] = [];

  data.forEach((row) => {
    const nodeId = cleanString(row[nodeIdColumn]);

    if (!nodeMap.has(nodeId)) {
      const node: any = {
        id: nodeId,
        radius:
          nodeSizeColumn && headers.includes(nodeSizeColumn)
            ? toNumber(row[nodeSizeColumn])
            : 8,
      };

      if (nodeGroupColumn && headers.includes(nodeGroupColumn)) {
        node.group = cleanString(row[nodeGroupColumn]);
      }

      nodeMap.set(nodeId, node);
    }

    // Process links if columns are available
    if (
      linkSourceColumn &&
      linkTargetColumn &&
      headers.includes(linkSourceColumn) &&
      headers.includes(linkTargetColumn)
    ) {
      const source = cleanString(row[linkSourceColumn]);
      const target = cleanString(row[linkTargetColumn]);

      if (source && target && source !== target) {
        const link: any = {
          source,
          target,
          distance:
            linkValueColumn && headers.includes(linkValueColumn)
              ? toNumber(row[linkValueColumn])
              : 100,
        };

        links.push(link);

        // Ensure both source and target nodes exist
        if (!nodeMap.has(source)) {
          nodeMap.set(source, { id: source, radius: 8 });
        }
        if (!nodeMap.has(target)) {
          nodeMap.set(target, { id: target, radius: 8 });
        }
      }
    }
  });

  const nodes = Array.from(nodeMap.values());

  return { nodes, links };
}

// Get required columns for network chart
export function getRequiredColumns(config: NetworkChartConfig): string[] {
  const columns = [config.dataMapping.nodeIdColumn];

  if (config.dataMapping.nodeGroupColumn) {
    columns.push(config.dataMapping.nodeGroupColumn);
  }
  if (config.dataMapping.nodeSizeColumn) {
    columns.push(config.dataMapping.nodeSizeColumn);
  }
  if (config.dataMapping.linkSourceColumn) {
    columns.push(config.dataMapping.linkSourceColumn);
  }
  if (config.dataMapping.linkTargetColumn) {
    columns.push(config.dataMapping.linkTargetColumn);
  }
  if (config.dataMapping.linkValueColumn) {
    columns.push(config.dataMapping.linkValueColumn);
  }

  return columns;
}

// Validate DataTableType for network chart
export function validateCsvForNetwork(
  dataTable: DataTableType,
  config: NetworkChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
