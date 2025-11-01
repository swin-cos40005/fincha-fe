import type { WorkflowTemplate } from '@/lib/types';

export const statisticalAnalysisTemplate: WorkflowTemplate = {
  id: 'sys-statistical-analysis',
  name: 'Statistical Analysis',
  description: 'Advanced statistical analysis workflow with correlation, regression, and hypothesis testing',
  useCase: 'Use this template for comprehensive statistical analysis of your data. Includes correlation analysis, regression modeling, and statistical validation. Ideal for research and data science projects.',
  categoryId: 'analytics',
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
        id: 'clean-1',
        type: 'customNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Missing Values',
          factoryId: 'missing-values',
          settings: {
            strategy: 'interpolate',
            method: 'linear'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'scorer-1',
        type: 'customNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Data Scorer',
          factoryId: 'data-scorer',
          settings: {
            includeStatistics: true,
            includeCorrelation: true,
            includeDistribution: true
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'regression-1',
        type: 'customNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Force Fit Regression',
          factoryId: 'force-fit-regression',
          settings: {
            regressionType: 'linear',
            targetColumn: '',
            includeResiduals: true
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'cronbach-1',
        type: 'customNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Cronbach Alpha',
          factoryId: 'cronbach-alpha-generator',
          settings: {
            selectedColumns: [],
            includeItemAnalysis: true
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
        position: { x: 700, y: 150 },
        data: {
          label: 'Statistical Charts',
          factoryId: 'chart',
          settings: {
            chartType: 'scatter',
            showTrendline: true,
            showCorrelation: true
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
        id: 'input-clean',
        source: 'input-1',
        target: 'clean-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'clean-scorer',
        source: 'clean-1',
        target: 'scorer-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'clean-regression',
        source: 'clean-1',
        target: 'regression-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'clean-cronbach',
        source: 'clean-1',
        target: 'cronbach-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'regression-chart',
        source: 'regression-1',
        target: 'chart-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      }
    ],
    metadata: {
      version: '1.0',
      templateType: 'system'
    }
  },
  tags: ['analytics', 'statistics', 'regression', 'correlation', 'advanced'],

  isPublic: true,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}; 