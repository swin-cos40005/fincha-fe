/**
 * Dashboard utilities for handling different node output types
 */

import type { DataTableType, ColumnSpec, DataRow, Cell } from '@/lib/types';
import type { NodeOutputType, StatisticsData, ColumnStatistics } from '@/lib/nodes/utils';
import { formatValue, logError, logWarning } from '@/lib/utils';

// Dashboard item types
export type DashboardItemType = 'chart' | 'table' | 'statistics';

// Base dashboard item interface
export interface BaseDashboardItem {
  id: string;
  type: DashboardItemType;
  title: string;
  description?: string;
  nodeId: string;
  nodeName: string;
  metadata?: {
    totalRows?: number;
    totalColumns?: number;
    processedAt: string;
    nodeLabel: string;
  };
}

// Chart dashboard item
export interface ChartDashboardItem extends BaseDashboardItem {
  type: 'chart';
  chartType: string;
  config: any;
  data?: any[];
}

// Table dashboard item
export interface TableDashboardItem extends BaseDashboardItem {
  type: 'table';
  columns: ColumnSpec[];
  rows: Record<string, any>[];
  statistics?: ColumnStatistics[];
}

// Statistics dashboard item
export interface StatisticsDashboardItem extends BaseDashboardItem {
  type: 'statistics';
  summary: string;
  metrics: Record<string, any>;
  details: Record<string, any>;
}

// Union type for all dashboard items
export type DashboardItem = ChartDashboardItem | TableDashboardItem | StatisticsDashboardItem;

/**
 * Converts node output to dashboard item format
 */
export function convertNodeOutputToDashboardItem(
  nodeId: string,
  nodeLabel: string,
  outputType: NodeOutputType,
  outputData: any,
  existingItem?: DashboardItem
): DashboardItem | null {
  const baseItem = {
    id: existingItem?.id || `${nodeId}-${Date.now()}`,
    nodeId,
    nodeName: nodeLabel,
    title: existingItem?.title || `${nodeLabel} Output`,
    description: existingItem?.description,
    metadata: {
      processedAt: new Date().toISOString(),
      nodeLabel,
    },
  };

  switch (outputType) {
    case 'chart': {
      // Handle chart output
      if (outputData.chartType) {
        return {
          ...baseItem,
          type: 'chart',
          chartType: outputData.chartType,
          config: outputData.config || {},
          data: outputData.data || [],
          metadata: {
            ...baseItem.metadata,
            totalRows: outputData.dataRows || 0,
            totalColumns: outputData.dataColumns || 0,
          },
        } as ChartDashboardItem;
      }
      break;
    }

    case 'table': {
      // Handle table output
      let tableData: DataTableType;
      
      if (Array.isArray(outputData) && outputData[0]?.spec && outputData[0]?.rows) {
        // It's an array of DataTables
        tableData = outputData[0];
      } else if (outputData.spec && outputData.rows) {
        // It's a single DataTable
        tableData = outputData;
      } else {
        return null;
      }

      // Convert DataTable to simple format for dashboard
      const columns = tableData.spec.columns;
      const rows: Record<string, any>[] = [];
      
      tableData.forEach((row: DataRow) => {
        if (row.cells && Array.isArray(row.cells)) {
          const rowObject: Record<string, any> = {};
          row.cells.forEach((cell: Cell, cellIndex: number) => {
            const columnName = columns[cellIndex]?.name || `column_${cellIndex}`;
            rowObject[columnName] = cell.getValue();
          });
          rows.push(rowObject);
        }
      });

      // Calculate statistics if not provided
      const statistics = outputData.statistics || calculateTableStatistics(columns, rows);

      return {
        ...baseItem,
        type: 'table',
        columns,
        rows,
        statistics,
        metadata: {
          ...baseItem.metadata,
          totalRows: rows.length,
          totalColumns: columns.length,
        },
      } as TableDashboardItem;
    }

    case 'statistics': {
      // Handle statistics output
      const statsData = outputData as StatisticsData;
      return {
        ...baseItem,
        type: 'statistics',
        summary: statsData.summary || 'Statistics',
        metrics: statsData.metrics || {},
        details: statsData.details || {},
        metadata: {
          ...baseItem.metadata,
          totalRows: Object.keys(statsData.metrics || {}).length + Object.keys(statsData.details || {}).length,
        },
      } as StatisticsDashboardItem;
    }

    default:
      return null;
  }
  
  return null; // Default return for cases where break is used
}

// Dashboard persistence utilities
export interface DashboardPersistenceOptions {
  chatId: string;
  nodeId: string;
  addDashboardItem?: (item: any) => void;
}

/**
 * Saves dashboard items to database and optionally adds to local state
 */
export async function persistDashboardItems(
  items: any[],
  options: DashboardPersistenceOptions
): Promise<{ success: boolean; savedCount: number; errors: string[] }> {
  const { chatId, nodeId, addDashboardItem } = options;
  const errors: string[] = [];
  let savedCount = 0;

  // Check if we have a valid session before attempting to save
  // For URL template imports, wait a bit for the session to be established
  let sessionRetries = 0;
  const maxSessionRetries = 3;
  let sessionValid = false;

  while (!sessionValid && sessionRetries < maxSessionRetries) {
    try {
      const sessionCheckResponse = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Important for session cookies
      });
      


      if (sessionCheckResponse.ok) {
        const sessionData = await sessionCheckResponse.json();

        sessionValid = true;
      } else {
        console.error('❌ [DashboardPersistence] Session check failed:', {
          status: sessionCheckResponse.status,
          statusText: sessionCheckResponse.statusText,
          attempt: sessionRetries + 1
        });
        
        // Wait before retrying if session isn't ready
        if (sessionRetries < maxSessionRetries - 1) {

          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
    } catch (sessionError) {
      console.error('❌ [DashboardPersistence] Session check error:', sessionError);
      if (sessionRetries < maxSessionRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
    }
    
    sessionRetries++;
  }

  if (!sessionValid) {
    console.error('🚨 [DashboardPersistence] Failed to establish valid session after retries');
    return {
      success: false,
      savedCount: 0,
      errors: ['Session not established - authentication failed']
    };
  }

  if (!items || items.length === 0) {

    return { success: true, savedCount: 0, errors: [] };
  }

  for (const item of items) {
    try {


      // Client-side: Use fetch API
      let response;
      try {
        response = await fetch('/api/dashboard/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest', // Anti-CSRF header
          },
          credentials: 'include', // Ensure session cookies are included
          cache: 'no-store', // Prevent any caching
          body: JSON.stringify({
            chatId: chatId,
            nodeId: nodeId,
            item: item,
            timestamp: Date.now(), // Ensure unique requests
          }),
        });


      } catch (fetchError) {
        console.error('❌ [DashboardPersistence] Network error during fetch:', {
          itemId: item.id,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }

      // Validate that this is a real server response, not a fake/cached one
      if (response.ok) {
        try {
          const responseData = await response.json();

          
          // Server should return {success: true} for valid saves
          if (responseData.success) {
            savedCount++;

          } else {
            console.error('❌ [DashboardPersistence] Server returned success=false:', {
              itemId: item.id,
              responseData
            });
            throw new Error(`Server returned success=false: ${JSON.stringify(responseData)}`);
          }
        } catch (jsonError) {
          console.error('❌ [DashboardPersistence] Failed to parse response JSON:', {
            itemId: item.id,
            error: jsonError instanceof Error ? jsonError.message : String(jsonError)
          });
          throw new Error(`Invalid response format: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [DashboardPersistence] Failed to save item:', {
          itemId: item.id,
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // If it's a 401 error, this is likely the auth issue we're tracking
        if (response.status === 401) {
          console.error('🚨 [DashboardPersistence] Authentication issue detected!', {
            itemId: item.id,
            chatId,
            nodeId,
            error: errorText
          });
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Add to local state if callback provided (both server and client side)
      if (addDashboardItem) {
        addDashboardItem(item);
      }
    } catch (error) {
      const errorMsg = `Exception saving dashboard item ${item.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌ [DashboardPersistence] Exception:', errorMsg);
      logError('DashboardPersistence', new Error(errorMsg), { itemId: item.id });
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
 * Unified dashboard persistence function for both workflow editor and AI tools
 * Saves to database and emits refresh events for consistent behavior
 */
export async function persistNodeDashboardItems(
  nodeId: string,
  status: string,
  outputs: any[],
  context: any,
  options: {
    chatId: string;
    nodeId: string;
    nodeLabel?: string;
    dataStream?: any; // For AI tools to emit events
  }
): Promise<{ success: boolean; itemCount: number }> {
  if (status !== 'success') {
    return { success: true, itemCount: 0 };
  }

  if (!context?.dashboardItems) {
    return { success: true, itemCount: 0 };
  }

  if (context.dashboardItems.length === 0) {
    return { success: true, itemCount: 0 };
  }

  try {
    // Save to database only (no local state updates)
    const result = await persistDashboardItems(context.dashboardItems, {
      chatId: options.chatId,
      nodeId: options.nodeId,
      // No addDashboardItem callback - database only
    });

    // Emit dashboard refresh event if dataStream is available (for AI tools)
    if (options.dataStream && result.success && result.savedCount > 0) {
      options.dataStream.writeData({
        type: 'dashboard-refresh',
        content: {
          conversationId: options.chatId,
          nodeId: options.nodeId,
          nodeLabel: options.nodeLabel,
          dashboardItemsCount: result.savedCount,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return { 
      success: result.success, 
      itemCount: result.savedCount 
    };
  } catch (error) {
    logError('DashboardPersistence', error instanceof Error ? error : new Error(String(error)), {
      nodeId: options.nodeId,
      chatId: options.chatId,
    });
    return { success: false, itemCount: 0 };
  }
}

/**
 * Calculate basic statistics for table columns
 */
function calculateTableStatistics(columns: ColumnSpec[], rows: Record<string, any>[]): ColumnStatistics[] {
  return columns.map((column) => {
    const values = rows.map(row => row[column.name]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    const stat: ColumnStatistics = {
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
 * Convert dashboard item data to CSV format
 */
export function convertDashboardItemToCSV(item: DashboardItem): string {
  switch (item.type) {
    case 'table': {
      const headers = item.columns.map(c => c.name).join(',');
      const rows = item.rows.map(row => 
        item.columns.map(col => {
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
      Object.entries(item.metrics).forEach(([key, value]) => {
        rows.push(`"${key}","${formatValue(value)}"`);
      });
      
      // Add details
      Object.entries(item.details).forEach(([key, value]) => {
        rows.push(`"${key}","${formatValue(value)}"`);
      });
      
      return rows.join('\n');
    }

    case 'chart': {
      // For charts, export the underlying data if available
      if (item.data && item.data.length > 0) {
        // Handle different chart data formats
        if (item.data[0] && typeof item.data[0] === 'object' && 'id' in item.data[0] && 'data' in item.data[0]) {
          // Scatter/line chart format
          const flatData: any[] = [];
          item.data.forEach((series: any) => {
            if (series.data && Array.isArray(series.data)) {
              series.data.forEach((point: any) => {
                flatData.push({ series: series.id, ...point });
              });
            }
          });
          
          if (flatData.length > 0) {
            const headers = Object.keys(flatData[0]);
            const csv = [headers.join(',')];
            flatData.forEach(row => {
              csv.push(headers.map(h => formatValue(row[h])).join(','));
            });
            return csv.join('\n');
          }
        } else {
          // Regular flat data
          const headers = Object.keys(item.data[0]);
          const csv = [headers.join(',')];
          item.data.forEach(row => {
            csv.push(headers.map(h => formatValue(row[h])).join(','));
          });
          return csv.join('\n');
        }
      }
      return 'No data available for export';
    }

    default:
      return 'Unsupported format for CSV export';
  }
}

/**
 * Helper function to emit dashboard refresh events
 * Can be used by components that need to trigger dashboard refresh
 * Includes retry logic to handle cases where dashboard isn't ready yet
 */
export function emitDashboardRefreshEvent(chatId: string, nodeId?: string, nodeLabel?: string): void {
  const emitEvent = () => {
    const event = new CustomEvent('dashboardRefreshEvent', {
      detail: {
        conversationId: chatId,
        nodeId,
        nodeLabel,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  };

  // Emit immediately
  emitEvent();
  
  // Also emit after a delay to catch cases where dashboard loads later
  // This helps with URL template imports where dashboard may not be ready yet
  setTimeout(emitEvent, 500);
  setTimeout(emitEvent, 1500);
} 