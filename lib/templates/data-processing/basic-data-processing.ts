import type { WorkflowTemplate } from '@/lib/types';

export const basicDataProcessingTemplate: WorkflowTemplate = {
  id: 'sys-basic-data-processing',
  name: 'Basic Data Processing',
  description: 'A fundamental data processing workflow that loads, cleans, and filters data',
  useCase: 'Use this template when you need to perform basic data cleaning and filtering operations on your dataset. Perfect for preprocessing data before analysis.',
  categoryId: 'data-processing',
  data: {
    nodes: [
      {
        id: 'input-1',
        type: 'customNode',
        position: { x: 100, y: 100 },
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
        id: 'filter-1',
        type: 'customNode',
        position: { x: 300, y: 100 },
        data: {
          label: 'Row Filter',
          factoryId: 'row-filter',
          settings: {
            filterType: 'include',
            condition: 'notEmpty'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'missing-1',
        type: 'customNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Missing Values',
          factoryId: 'missing-values',
          settings: {
            strategy: 'remove',
            columns: []
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
        id: 'input-filter',
        source: 'input-1',
        target: 'filter-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      },
      {
        id: 'filter-missing',
        source: 'filter-1',
        target: 'missing-1',
        sourceHandle: 'source-0',
        targetHandle: 'target-0'
      }
    ],
    metadata: {
      version: '1.0',
      templateType: 'system'
    }
  },
  tags: ['data-processing', 'cleaning', 'filtering', 'beginner'],
  isPublic: true,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}; 