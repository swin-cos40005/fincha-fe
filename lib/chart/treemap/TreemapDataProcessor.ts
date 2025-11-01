import type { TreemapChartConfig } from './TreemapSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Build hierarchy for TreeMap
function buildTreemapHierarchy(data: any[], config: TreemapChartConfig): any {
  const { idColumn, parentColumn, valueColumn, labelColumn } =
    config.dataMapping;

  if (parentColumn) {
    // Hierarchical data with parent relationships
    const nodeMap = new Map<string, any>();
    const rootNodes: any[] = [];

    // First pass: create all nodes
    data.forEach((row) => {
      const id = cleanString(row[idColumn]);
      const parent = parentColumn ? cleanString(row[parentColumn]) : null;
      const value = toNumber(row[valueColumn]);

      const node: any = {
        id,
        name: labelColumn ? cleanString(row[labelColumn]) : id,
        value: value > 0 ? value : 0,
        children: [],
      };

      nodeMap.set(id, node);

      if (!parent || parent === '' || parent === 'null') {
        rootNodes.push(node);
      }
    });

    // Second pass: build parent-child relationships
    data.forEach((row) => {
      const id = cleanString(row[idColumn]);
      const parent = parentColumn ? cleanString(row[parentColumn]) : null;

      if (parent && parent !== '' && parent !== 'null') {
        const parentNode = nodeMap.get(parent);
        const childNode = nodeMap.get(id);

        if (parentNode && childNode) {
          parentNode.children.push(childNode);
        }
      }
    });

    // If there's only one root, return it; otherwise wrap in a container
    if (rootNodes.length === 1) {
      return rootNodes[0];
    } else {
      return {
        id: 'root',
        name: 'Root',
        children: rootNodes,
      };
    }
  } else {
    // Flat data - create a simple hierarchy
    const children = data
      .map((row, index) => ({
        id: cleanString(row[idColumn]) || `item-${index}`,
        name: labelColumn
          ? cleanString(row[labelColumn])
          : cleanString(row[idColumn]) || `item-${index}`,
        value: toNumber(row[valueColumn]),
      }))
      .filter((item) => item.value > 0);

    return {
      id: 'root',
      name: 'Root',
      children,
    };
  }
}

// TreeMap Chart Data Processor
export function processTreemapData(
  dataTable: DataTableType,
  config: TreemapChartConfig,
): any {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  ) {
    return { id: 'root', name: 'Root', children: [] };
  }

  return buildTreemapHierarchy(data, config);
}

// Get required columns for treemap chart
export function getRequiredColumns(config: TreemapChartConfig): string[] {
  const columns = [config.dataMapping.idColumn, config.dataMapping.valueColumn];

  if (config.dataMapping.parentColumn) {
    columns.push(config.dataMapping.parentColumn);
  }
  if (config.dataMapping.labelColumn) {
    columns.push(config.dataMapping.labelColumn);
  }

  return columns;
}

// Validate DataTableType for treemap chart
export function validateCsvForTreemap(
  dataTable: DataTableType,
  config: TreemapChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
