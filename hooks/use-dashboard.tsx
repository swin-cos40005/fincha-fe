'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DashboardState } from '@/components/dashboard';
import type { DashboardItem } from '@/lib/dashboard/utils';

// For backward compatibility, keep NodeChartConfig as alias
interface NodeChartConfig {
  id: string;
  title: string;
  description?: string;
  chartType:
    | 'scatter'
    | 'bar'
    | 'line'
    | 'pie'
    | 'heatmap'
    | 'radar'
    | 'areaBump'
    | 'calendar'
    | 'chord'
    | 'circlePacking'
    | 'sankey'
    | 'boxplot'
    | 'bump'
    | 'bullet'
    | 'funnel'
    | 'stream'
    | 'sunburst'
    | 'waffle'
    | 'network'
    | 'radialbar'
    | 'swarmplot'
    | 'treemap'
    | 'voronoi';
  config: any;
  nodeId: string;
  nodeName: string;
  data?: any[];
  metadata?: {
    totalRows: number;
    totalColumns: number;
    processedAt: string;
    nodeLabel: string;
  };
}

interface DashboardContextType {
  dashboard: DashboardState;
  setDashboard: React.Dispatch<React.SetStateAction<DashboardState>>;
  // Legacy methods for backward compatibility
  addNodeChart: (nodeChart: NodeChartConfig) => void;
  updateNodeChartData: (
    chartId: string,
    data: any[],
    nodeLabel?: string,
  ) => void;
  removeNodeChart: (chartId: string) => void;
  getNodeCharts: () => NodeChartConfig[];
  // New unified methods
  addDashboardItem: (item: DashboardItem) => void;
  updateDashboardItem: (itemId: string, updates: Partial<DashboardItem>) => void;
  removeDashboardItem: (itemId: string) => void;
  getDashboardItems: () => DashboardItem[];
  // Load dashboard items from database
  loadDashboardItems: (chatId: string) => Promise<void>;
  // Clear all dashboard items
  clearDashboardItems: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dashboard, setDashboard] = useState<DashboardState>({
    isVisible: false,
    boundingBox: { top: 0, left: 0, width: 0, height: 0 },
  });

  // Internal state for all dashboard items
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  
  // Legacy state for backward compatibility
  const [nodeCharts, setNodeCharts] = useState<NodeChartConfig[]>([]);

  const addNodeChart = useCallback(
    (nodeChart: NodeChartConfig) => {
      try {
        setNodeCharts((prev) => {
          // Check if chart already exists to prevent duplicates
          const existingIndex = prev.findIndex((c) => c.id === nodeChart.id);
          if (existingIndex >= 0) {
            // Update existing chart
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...nodeChart,
            };
            return updated;
          } else {
            // Add new chart
            const newCharts = [...prev, nodeChart];
            return newCharts;
          }
        });

        // Update dashboard data using the current state
        setDashboard((prev) => ({
          ...prev,
          dashboardData: {
            metadata: {
              createdAt: new Date().toISOString(),
              analysisType: 'node-based',
            },
          },
        }));
      } catch (error) {
        console.error('Error adding node chart:', error);
      }
    },
    [], // Remove nodeCharts dependency to prevent infinite re-renders
  );

  const updateNodeChartData = useCallback(
    (chartId: string, data: any[], nodeLabel?: string) => {
      try {
        setNodeCharts((prev) => {
          const updated = prev.map((chart) => {
            if (chart.id === chartId) {
              const updatedChart = {
                ...chart,
                data,
                nodeName: nodeLabel || chart.nodeName,
                metadata: {
                  ...chart.metadata,
                  totalRows: Array.isArray(data) ? data.length : 0,
                  totalColumns:
                    Array.isArray(data) && data.length > 0
                      ? Object.keys(data[0]).length
                      : 0,
                  processedAt: new Date().toISOString(),
                  nodeLabel:
                    nodeLabel || chart.metadata?.nodeLabel || chart.nodeName,
                },
              };
              return updatedChart;
            }
            return chart;
          });
          return updated;
        });

        // Update dashboard data - we don't need to update this here since nodeCharts are the source of truth
        // The dashboard will get the latest nodeCharts from getNodeCharts()
      } catch (error) {
        console.error('Error updating node chart data:', error);
      }
    },
    [], // Remove nodeCharts dependency to prevent infinite re-renders
  );

  const removeNodeChart = useCallback(
    (chartId: string) => {
      try {
        setNodeCharts((prev) => prev.filter((chart) => chart.id !== chartId));

        // Update dashboard data - we don't need to update this here since nodeCharts are the source of truth
        // The dashboard will get the latest nodeCharts from getNodeCharts()
      } catch (error) {
        console.error('Error removing node chart:', error);
      }
    },
    [], // Remove nodeCharts dependency to prevent infinite re-renders
  );

  const getNodeCharts = useCallback(() => {
    return nodeCharts;
  }, [nodeCharts]);

  // New unified methods for all dashboard item types
  const addDashboardItem = useCallback((item: DashboardItem) => {
    setDashboardItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }
      return [...prev, item];
    });

    // Also update legacy nodeCharts if it's a chart
    if (item.type === 'chart') {
      addNodeChart({
        id: item.id,
        title: item.title,
        description: item.description,
        chartType: item.chartType as any,
        config: item.config,
        nodeId: item.nodeId,
        nodeName: item.nodeName,
        data: item.data,
        metadata: item.metadata as any,
      });
    }
  }, [addNodeChart]);

  const updateDashboardItem = useCallback((itemId: string, updates: Partial<DashboardItem>) => {
    setDashboardItems((prev) => {
      return prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, ...updates } as DashboardItem;
        }
        return item;
      });
    });
  }, []);

  const removeDashboardItem = useCallback((itemId: string) => {
    setDashboardItems((prev) => prev.filter((item) => item.id !== itemId));
    
    // Also remove from legacy nodeCharts if needed
    removeNodeChart(itemId);
  }, [removeNodeChart]);

  const getDashboardItems = useCallback(() => {
    return dashboardItems;
  }, [dashboardItems]);

  // Load dashboard items from database
  const loadDashboardItems = useCallback(async (chatId: string) => {
    try {
      const dashboardResponse = await fetch(`/api/dashboard/items?chatId=${chatId}`);
      if (dashboardResponse.ok) {
        const { items } = await dashboardResponse.json();
        
        // Convert database format to dashboard item format and add to state
        items.forEach((item: any) => {
          const baseItem = {
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            nodeId: item.nodeId,
            nodeName: item.nodeId, // Use nodeId as nodeName fallback
            metadata: {
              processedAt: item.updatedAt,
              nodeLabel: item.nodeId,
              totalRows: item.data?.totalRows,
              totalColumns: item.data?.columns?.length,
            },
          };

          let dashboardItem: any;

          // Create type-specific dashboard items
          if (item.type === 'table') {
            dashboardItem = {
              ...baseItem,
              columns: item.data.columns || [],
              rows: item.data.rows || [],
              statistics: item.data.statistics || [],
            };
          } else if (item.type === 'statistics') {
            dashboardItem = {
              ...baseItem,
              summary: item.data.summary || '',
              metrics: item.data.metrics || {},
              details: item.data.details || {},
            };
          } else if (item.type === 'chart') {
            dashboardItem = {
              ...baseItem,
              chartType: item.data.chartType || 'unknown',
              config: item.data.config || {},
              data: item.data.dataSnapshot ? JSON.parse(item.data.dataSnapshot) : [],
            };
          } else {
            // Fallback for unknown types
            dashboardItem = {
              ...baseItem,
              data: item.data,
            };
          }
          
          addDashboardItem(dashboardItem);
        });
      } else {
        console.warn('⚠️ [Dashboard] Failed to load dashboard items:', dashboardResponse.status);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Failed to load data from database:', error);
    }
  }, [addDashboardItem]);

  // Clear all dashboard items
  const clearDashboardItems = useCallback(() => {
    setDashboardItems([]);
    setNodeCharts([]);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        dashboard,
        setDashboard,
        addNodeChart,
        updateNodeChartData,
        removeNodeChart,
        getNodeCharts,
        addDashboardItem,
        updateDashboardItem,
        removeDashboardItem,
        getDashboardItems,
        loadDashboardItems,
        clearDashboardItems,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
