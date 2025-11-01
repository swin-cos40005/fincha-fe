import type { WorkflowTemplate } from '@/lib/types';

export const csvAnalysisTemplate: WorkflowTemplate = {
  id: 'sys-csv-analysis',
  name: 'CSV Analysis',
  description: 'Complete workflow for analyzing CSV data with statistics and visualizations',
  useCase: 'Use this template to quickly analyze CSV files, generate descriptive statistics, and create basic visualizations. Ideal for exploratory data analysis.',
  categoryId: 'analytics',
  data: {
    nodes: [
      {
        id: 'input-1',
        type: 'customNode',
        position: { x: 100, y: 150 },
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
        id: 'scorer-1',
        type: 'customNode',
        position: { x: 300, y: 50 },
        data: {
          label: 'Data Scorer',
          factoryId: 'data-scorer',
          settings: {
            includeStatistics: true,
            includeCorrelation: true
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'chart-1',
        type: 'customNode',
        position: { x: 300, y: 250 },
        data: {
          label: 'Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'bar',
            autoDetectColumns: true
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'aggregate-1',
        type: 'customNode',
        position: { x: 500, y: 150 },
        data: {
          label: 'Group & Aggregate',
          factoryId: 'group-and-aggregate',
          settings: {
            groupBy: [],
            aggregations: []
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
        id: 'input-scorer',
        source: 'input-1',
        target: 'scorer-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-chart',
        source: 'input-1',
        target: 'chart-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'input-aggregate',
        source: 'input-1',
        target: 'aggregate-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      }
    ],
    metadata: {
      version: '1.0',
      templateType: 'system'
    }
  },
  tags: ['analytics', 'csv', 'statistics', 'visualization', 'intermediate'],

  isPublic: true,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}; 