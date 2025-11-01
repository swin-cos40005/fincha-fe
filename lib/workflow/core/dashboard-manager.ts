/**
 * Centralized Dashboard Manager
 * Consolidates all dashboard operations and eliminates duplication
 */

import type { DataTableType } from '@/lib/types';
import { logError, logSuccess, logWarning } from '@/lib/utils';

// Dashboard item types
export type DashboardItemType = 'chart' | 'table' | 'statistics';

// Base dashboard item interface
export interface DashboardItem {
  id: string;
  type: DashboardItemType;
  title: string;
  description?: string;
  nodeId: string;
  nodeName: string;
  data: any;
  metadata: {
    totalRows?: number;
    totalColumns?: number;
    processedAt: string;
    nodeLabel: string;
  };
}

// Dashboard persistence options
export interface DashboardPersistenceOptions {
  chatId: string;
  nodeId: string;
  addToLocalState?: (item: DashboardItem) => void;
}

/**
 * Centralized Dashboard Manager
 * Handles all dashboard operations through a single interface
 */
export class DashboardManager {
  private items: Map<string, DashboardItem> = new Map();
  private chatId: string;

  constructor(chatId: string) {
    this.chatId = chatId;
  }

  /**
   * Process node outputs and convert to dashboard items
   */
  async processNodeOutputs(
    nodeId: string,
    nodeLabel: string,
    outputs: DataTableType[],
    context: any
  ): Promise<DashboardItem[]> {
    const items: DashboardItem[] = [];

    // Check if node has dashboard items in context
    if (context?.dashboardItems && Array.isArray(context.dashboardItems)) {
      for (const contextItem of context.dashboardItems) {
        const item = this.createDashboardItem(nodeId, nodeLabel, contextItem);
        if (item) {
          items.push(item);
          this.items.set(item.id, item);
        }
      }
    }

    // Process outputs if no context items
    if (items.length === 0 && outputs && outputs.length > 0) {
      for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];
        const item = this.createTableDashboardItem(nodeId, nodeLabel, output, i);
        if (item) {
          items.push(item);
          this.items.set(item.id, item);
        }
      }
    }

    return items;
  }

  /**
   * Create dashboard item from context item
   */
  private createDashboardItem(
    nodeId: string,
    nodeLabel: string,
    contextItem: any
  ): DashboardItem | null {
    const baseItem = {
      id: contextItem.id || `${nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      nodeId,
      nodeName: nodeLabel,
      title: contextItem.title || `${nodeLabel} Output`,
      description: contextItem.description,
      metadata: {
        processedAt: new Date().toISOString(),
        nodeLabel,
      },
    };

    // Handle different types
    switch (contextItem.type) {
      case 'chart':
        return {
          ...baseItem,
          type: 'chart',
          data: {
            chartType: contextItem.chartType,
            config: contextItem.config || {},
            data: contextItem.data || [],
          },
          metadata: {
            ...baseItem.metadata,
            totalRows: contextItem.data?.length || 0,
          },
        };

      case 'table':
        return {
          ...baseItem,
          type: 'table',
          data: {
            columns: contextItem.columns || [],
            rows: contextItem.rows || [],
            statistics: contextItem.statistics || [],
          },
          metadata: {
            ...baseItem.metadata,
            totalRows: contextItem.rows?.length || 0,
            totalColumns: contextItem.columns?.length || 0,
          },
        };

      case 'statistics':
        return {
          ...baseItem,
          type: 'statistics',
          data: {
            summary: contextItem.summary || 'Statistics',
            metrics: contextItem.metrics || {},
            details: contextItem.details || {},
          },
          metadata: {
            ...baseItem.metadata,
            totalRows: Object.keys(contextItem.metrics || {}).length + 
                      Object.keys(contextItem.details || {}).length,
          },
        };

      default:
        logWarning('DashboardManager', `Unknown dashboard item type: ${contextItem.type}`);
        return null;
    }
  }

  /**
   * Create table dashboard item from DataTable output
   */
  private createTableDashboardItem(
    nodeId: string,
    nodeLabel: string,
    output: DataTableType,
    index: number
  ): DashboardItem | null {
    if (!output.spec || !output.rows) {
      return null;
    }

    const rows: Record<string, any>[] = [];
    
    // Convert DataTable to simple format
    output.forEach((row: any) => {
      if (row.cells && Array.isArray(row.cells)) {
        const rowObject: Record<string, any> = {};
        row.cells.forEach((cell: any, cellIndex: number) => {
          const columnName = output.spec.columns[cellIndex]?.name || `column_${cellIndex}`;
          rowObject[columnName] = cell.getValue();
        });
        rows.push(rowObject);
      }
    });

    return {
      id: `${nodeId}-table-${index}-${Date.now()}`,
      type: 'table',
      title: `${nodeLabel} - Table ${index + 1}`,
      nodeId,
      nodeName: nodeLabel,
      data: {
        columns: output.spec.columns,
        rows,
        statistics: this.calculateTableStatistics(output.spec.columns, rows),
      },
      metadata: {
        processedAt: new Date().toISOString(),
        nodeLabel,
        totalRows: rows.length,
        totalColumns: output.spec.columns.length,
      },
    };
  }

  /**
   * Calculate statistics for table columns
   */
  private calculateTableStatistics(columns: any[], rows: Record<string, any>[]): any[] {
    return columns.map(column => {
      const values = rows.map(row => row[column.name]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      const stat: any = {
        columnName: column.name,
        type: column.type,
        count: values.length,
        nullCount: values.length - nonNullValues.length,
        uniqueCount: new Set(nonNullValues).size,
      };

      // Calculate numeric statistics
      if (column.type === 'number' && nonNullValues.length > 0) {
        const numericValues = nonNullValues
          .map(v => Number(v))
          .filter(v => !Number.isNaN(v));
        
        if (numericValues.length > 0) {
          stat.min = Math.min(...numericValues);
          stat.max = Math.max(...numericValues);
          stat.mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          
          // Calculate median
          const sorted = [...numericValues].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          stat.median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        }
      }

      return stat;
    });
  }

  /**
   * Persist dashboard items to database
   */
  async persistItems(
    items: DashboardItem[],
    options: DashboardPersistenceOptions
  ): Promise<{ success: boolean; savedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let savedCount = 0;

    if (!items || items.length === 0) {
      return { success: true, savedCount: 0, errors: [] };
    }

    logSuccess('DashboardManager', `Persisting ${items.length} dashboard items`, { 
      chatId: this.chatId,
      nodeId: options.nodeId 
    });

    for (const item of items) {
      try {
        // Save to database
        const response = await fetch('/api/dashboard/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: this.chatId,
            nodeId: options.nodeId,
            item: item,
          }),
        });

        if (response.ok) {
          savedCount++;
          logSuccess('DashboardManager', `Persisted dashboard item: ${item.id}`);

          // Add to local state if callback provided
          if (options.addToLocalState) {
            options.addToLocalState(item);
          }
        } else {
          const errorText = await response.text();
          const errorMsg = `Failed to persist item ${item.id}: ${response.status} ${response.statusText}`;
          logError('DashboardManager', new Error(errorMsg), { errorText });
          errors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Exception persisting item ${item.id}: ${error instanceof Error ? error.message : String(error)}`;
        logError('DashboardManager', new Error(errorMsg));
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      savedCount,
      errors,
    };
  }

  /**
   * Get dashboard items for a node
   */
  getNodeItems(nodeId: string): DashboardItem[] {
    return Array.from(this.items.values()).filter(item => item.nodeId === nodeId);
  }

  /**
   * Get all dashboard items
   */
  getAllItems(): DashboardItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Export item to CSV
   */
  exportItemToCSV(item: DashboardItem): string {
    switch (item.type) {
      case 'table': {
        const headers = item.data.columns.map((c: any) => c.name).join(',');
        const rows = item.data.rows.map((row: any) => 
          item.data.columns.map((col: any) => {
            const value = String(row[col.name] || '');
            // Escape values containing commas or quotes
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        );
        return [headers, ...rows].join('\n');
      }

      case 'statistics': {
        const rows: string[] = ['Metric,Value'];
        
        // Add metrics
        Object.entries(item.data.metrics).forEach(([key, value]) => {
          rows.push(`"${key}","${value}"`);
        });
        
        // Add details
        Object.entries(item.data.details).forEach(([key, value]) => {
          rows.push(`"${key}","${value}"`);
        });
        
        return rows.join('\n');
      }

      case 'chart': {
        // For charts, export the underlying data if available
        if (item.data.data && item.data.data.length > 0) {
          const flatData = item.data.data;
          const headers = Object.keys(flatData[0]);
          const csv = [headers.join(',')];
          flatData.forEach((row: any) => {
            csv.push(headers.map(h => String(row[h] || '')).join(','));
          });
          return csv.join('\n');
        }
        return 'No data available for export';
      }

      default:
        return 'Unsupported format for CSV export';
    }
  }
}
