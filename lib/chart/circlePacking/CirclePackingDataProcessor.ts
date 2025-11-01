import type { CirclePackingChartConfig } from './CirclePackingSchema';
import type { DataTableType } from '../../types';
import {
  parseDataTable,
  toNumber,
  cleanString,
  validateDataTableColumns,
} from '../utils';

// Helper function to build hierarchy from flat data
function buildHierarchy(
  data: Record<string, any>[],
  config: CirclePackingChartConfig,
): any {
  const { idColumn, valueColumn, parentColumn } = config.dataMapping;

  // Create a map of all items
  const itemMap = new Map();
  const rootChildren: any[] = [];

  // First pass: create all items
  data.forEach((row) => {
    const id = cleanString(row[idColumn]) || 'unknown';
    const value = toNumber(row[valueColumn]);
    const parent = parentColumn ? cleanString(row[parentColumn]) : null;

    if (id === 'unknown' || !Number.isFinite(value)) return;

    const item: any = {
      id,
      name: id,
      value,
      parent,
    };

    itemMap.set(id, item);
  });

  // Second pass: build hierarchy
  itemMap.forEach((item) => {
    if (
      !item.parent ||
      item.parent === 'unknown' ||
      !itemMap.has(item.parent)
    ) {
      // Root level item
      rootChildren.push(item);
    } else {
      // Child item
      const parent = itemMap.get(item.parent);
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }
  });

  // If we have multiple root items, wrap them in a single root
  if (rootChildren.length === 1 && rootChildren[0].children) {
    return rootChildren[0];
  }

  return {
    id: 'root',
    name: 'Root',
    children: rootChildren,
  };
}

// Circle Packing Chart Data Processor
export function processCirclePackingData(
  dataTable: DataTableType,
  config: CirclePackingChartConfig,
): any {
  const { headers, data } = parseDataTable(dataTable);
  const { idColumn, valueColumn, parentColumn } = config.dataMapping;

  if (
    !data.length ||
    !headers.includes(idColumn) ||
    !headers.includes(valueColumn)
  ) {
    return { id: 'root', name: 'Root', children: [] };
  }

  // If no parent column, create flat structure
  if (!parentColumn || !headers.includes(parentColumn)) {
    const children = data
      .map((row, index) => ({
        id: cleanString(row[idColumn]) || `item-${index}`,
        name: cleanString(row[idColumn]) || `item-${index}`,
        value: toNumber(row[valueColumn]),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);

    return {
      id: 'root',
      name: 'Root',
      children,
    };
  }

  // Build hierarchical structure
  return buildHierarchy(data, config);
}

// Get required columns for circle packing chart
export function getRequiredColumns(config: CirclePackingChartConfig): string[] {
  const columns = [config.dataMapping.idColumn, config.dataMapping.valueColumn];
  if (config.dataMapping.parentColumn) {
    columns.push(config.dataMapping.parentColumn);
  }
  return columns;
}

// Validate DataTableType for circle packing chart
export function validateCsvForCirclePacking(
  dataTable: DataTableType,
  config: CirclePackingChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const requiredColumns = getRequiredColumns(config);
  return validateDataTableColumns(dataTable, requiredColumns);
}
