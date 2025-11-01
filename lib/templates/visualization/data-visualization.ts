import type { WorkflowTemplate } from '@/lib/types';

export const dataVisualizationTemplate: WorkflowTemplate = {
  id: 'sys-data-visualization',
  name: 'Data Visualization Dashboard',
  description: 'Create multiple visualizations from your dataset including charts, graphs, and statistical plots',
  useCase: 'Use this template to create comprehensive visualizations of your data. Perfect for creating dashboards or presentation-ready charts.',
  categoryId: 'visualization',
  data: {
    nodes: [
      {
        id: 'input-1',
        type: 'customNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Data Input',
          factoryId: 'data-input',
          settings: {},
          inputPorts: 0,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-bar',
        type: 'customNode',
        position: { x: 350, y: 100 },
        data: {
          label: 'Bar Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'bar',
            title: 'Bar Chart'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-line',
        type: 'customNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Line Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'line',
            title: 'Trend Analysis'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-pie',
        type: 'customNode',
        position: { x: 350, y: 300 },
        data: {
          label: 'Pie Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'pie',
            title: 'Distribution'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-scatter',
        type: 'customNode',
        position: { x: 600, y: 150 },
        data: {
          label: 'Scatter Plot',
          factoryId: 'chart',
          settings: {
            chartType: 'scatter',
            title: 'Correlation Analysis'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-heatmap',
        type: 'customNode',
        position: { x: 600, y: 250 },
        data: {
          label: 'Heatmap',
          factoryId: 'chart',
          settings: {
            chartType: 'heatmap',
            title: 'Data Heatmap'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      }
    ],
    edges: [
      {
        id: 'input-bar',
        source: 'input-1',
        target: 'chart-bar',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-line',
        source: 'input-1',
        target: 'chart-line',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-pie',
        source: 'input-1',
        target: 'chart-pie',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-scatter',
        source: 'input-1',
        target: 'chart-scatter',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-heatmap',
        source: 'input-1',
        target: 'chart-heatmap',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      }
    ],
    metadata: {
      version: '1.0',
      templateType: 'system'
    }
  },
  tags: ['visualization', 'charts', 'dashboard', 'presentation', 'intermediate'],
  isPublic: true,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}; 