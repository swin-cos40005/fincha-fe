import type { WorkflowTemplate } from '@/lib/types';

export const oecdAnalysisTemplate: WorkflowTemplate = {
  id: 'sys-oecd-analysis',
  name: 'OECD Analysis',
  description: 'Comprehensive workflow for analyzing OECD environmental and agricultural data with multiple data sources and visualizations',
  useCase: 'Use this template to analyze OECD environmental indicators, agricultural land data, and country demographics with advanced filtering and visualization capabilities.',
  categoryId: 'analytics',
  data: {
    nodes: [
      {
        id: 'node-1754003013547-rzcxra5u2',
        type: 'customNode',
        position: { x: 540, y: 120 },
        data: {
          label: 'PostgreSQL Input',
          factoryId: 'postgres-input',
          settings: {
            host: 'aws-0-ap-southeast-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            username: 'postgres.qrzezqneeuzrxzbfrftt',
            password: 'YfLYdS0YpMHhII8p',
            ssl: false,
            selectedTable: 'oecd',
            tableSchema: '{"name":"oecd","type":"BASE TABLE","columns":[{"name":"ref_area","dataType":"character varying","isNullable":false,"defaultValue":null,"maxLength":10,"numericPrecision":null,"numericScale":null},{"name":"measure","dataType":"USER-DEFINED","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"erosion_risk_level","dataType":"USER-DEFINED","isNullable":true,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"water_type","dataType":"USER-DEFINED","isNullable":true,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"nutrients","dataType":"USER-DEFINED","isNullable":true,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"unit_of_measure","dataType":"USER-DEFINED","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"time_period","dataType":"smallint","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":16,"numericScale":0},{"name":"obs_value","dataType":"numeric","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":15,"numericScale":2},{"name":"id","dataType":"integer","isNullable":false,"defaultValue":"nextval(\'oecd_id_seq\'::regclass)","maxLength":null,"numericPrecision":32,"numericScale":0}]}',
            pageSize: 1000
          },
          inputPorts: 0,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-v2pqk94ec',
        type: 'customNode',
        position: { x: 540, y: 400 },
        data: {
          label: 'PostgreSQL Input',
          factoryId: 'postgres-input',
          settings: {
            host: 'aws-0-ap-southeast-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            username: 'postgres.qrzezqneeuzrxzbfrftt',
            password: 'YfLYdS0YpMHhII8p',
            ssl: false,
            selectedTable: 'oecd_agricultural_land_area',
            tableSchema: '{"name":"oecd_agricultural_land_area","type":"BASE TABLE","columns":[{"name":"ref_area","dataType":"character varying","isNullable":false,"defaultValue":null,"maxLength":10,"numericPrecision":null,"numericScale":null},{"name":"time_period","dataType":"smallint","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":16,"numericScale":0},{"name":"obs_value","dataType":"numeric","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":15,"numericScale":2},{"name":"id","dataType":"integer","isNullable":false,"defaultValue":"nextval(\'oced_agricultural_land_area_id_seq\'::regclass)","maxLength":null,"numericPrecision":32,"numericScale":0}]}',
            pageSize: 1000
          },
          inputPorts: 0,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-8nnzlou62',
        type: 'customNode',
        position: { x: 540, y: 260 },
        data: {
          label: 'PostgreSQL Input',
          factoryId: 'postgres-input',
          settings: {
            host: 'aws-0-ap-southeast-1.pooler.supabase.com',
            port: 6543,
            database: 'postgres',
            username: 'postgres.qrzezqneeuzrxzbfrftt',
            password: 'YfLYdS0YpMHhII8p',
            ssl: false,
            selectedTable: 'countries',
            tableSchema: '{"name":"countries","type":"BASE TABLE","columns":[{"name":"ref_area","dataType":"character varying","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"population","dataType":"integer","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":32,"numericScale":0},{"name":"area_km2","dataType":"numeric","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null},{"name":"reference_area","dataType":"text","isNullable":false,"defaultValue":null,"maxLength":null,"numericPrecision":null,"numericScale":null}]}',
            pageSize: 1000
          },
          inputPorts: 0,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-g2r83kwiq',
        type: 'customNode',
        position: { x: 860, y: 120 },
        data: {
          label: 'Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'choropleth',
            title: 'Chart Visualization',
            description: '',
            dataMapping: '{"idColumn":"ref_area","valueColumn":"obs_value"}'
          },
          inputPorts: 1,
          outputPorts: 0,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-9w1s1zc7v',
        type: 'customNode',
        position: { x: 700, y: 260 },
        data: {
          label: 'Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'choropleth',
            title: 'Chart Visualization',
            description: '',
            dataMapping: '{"idColumn":"ref_area","valueColumn":"population","labelColumn":"area_km2"}'
          },
          inputPorts: 1,
          outputPorts: 0,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-qxnzhx3pm',
        type: 'customNode',
        position: { x: 700, y: 400 },
        data: {
          label: 'Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'choropleth',
            title: 'Chart Visualization',
            description: '',
            dataMapping: '{"idColumn":"ref_area","valueColumn":"obs_value"}'
          },
          inputPorts: 1,
          outputPorts: 0,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-95219nwnk',
        type: 'customNode',
        position: { x: 700, y: 500 },
        data: {
          label: 'Row Filter',
          factoryId: 'filter',
          settings: {
            conditions: [
              {
                value: 'USA',
                column: 'ref_area',
                operator: '='
              },
              {
                value: 'CHN',
                column: 'ref_area',
                operator: '='
              }
            ],
            logicalOperator: 'OR',
            conditionCount: 2
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-zaa2nk22l',
        type: 'customNode',
        position: { x: 920, y: 500 },
        data: {
          label: 'Chart',
          factoryId: 'chart',
          settings: {
            chartType: 'line',
            title: 'Chart Visualization',
            description: '',
            dataMapping: '{"xColumn":"time_period","yColumns":["obs_value"],"idColumn":"ref_area"}'
          },
          inputPorts: 1,
          outputPorts: 0,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-xnjl7qrrd',
        type: 'customNode',
        position: { x: 700, y: 120 },
        data: {
          label: 'Column Filter',
          factoryId: 'column_filter',
          settings: {
            selectedColumnCount: 4,
            filterMode: 'keep',
            selectedColumn_2: 'unit_of_measure',
            selectedColumn_3: 'obs_value',
            selectedColumn_1: 'ref_area',
            selectedColumn_0: 'measure'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-zl7ys1zha',
        type: 'customNode',
        position: { x: 860, y: 220 },
        data: {
          label: 'Row Filter',
          factoryId: 'filter',
          settings: {
            conditions: [
              {
                operator: '=',
                value: 'CHN',
                column: 'ref_area'
              },
              {
                operator: '=',
                value: 'Agricultural ammonia (NH3)',
                column: 'measure'
              }
            ],
            conditionCount: 2,
            logicalOperator: 'AND',
            condition_0_column: 'ref_area',
            condition_0_operator: '=',
            condition_0_value: 'CHN',
            condition_1_column: 'measure',
            condition_1_operator: '=',
            condition_1_value: 'Total Carbone dioxide (CO2)'
          },
          inputPorts: 1,
          outputPorts: 1,
          status: 'idle',
          executed: false
        }
      },
      {
        id: 'node-1754003013547-7ek5gv0ce',
        type: 'customNode',
        position: { x: 940, y: 220 },
        data: {
          label: 'Group and Aggregate',
          factoryId: 'group_and_aggregate',
          settings: {
            group_columns: '["ref_area","measure","unit_of_measure"]',
            aggregations: '[{"columnName":"obs_value","method":"SUM","newColumnName":"obs_value_sum"}]'
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
        source: 'node-1754003013547-8nnzlou62',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-9w1s1zc7v',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-453pwxk2j'
      },
      {
        source: 'node-1754003013547-95219nwnk',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-zaa2nk22l',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-lemhs7142'
      },
      {
        source: 'node-1754003013547-v2pqk94ec',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-qxnzhx3pm',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-t7juqoop3'
      },
      {
        source: 'node-1754003013547-v2pqk94ec',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-95219nwnk',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-d5wk4l4nn'
      },
      {
        source: 'node-1754003013547-rzcxra5u2',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-xnjl7qrrd',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-xg8fyp2j0'
      },
      {
        source: 'node-1754003013547-xnjl7qrrd',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-g2r83kwiq',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-m1e7k9b80'
      },
      {
        source: 'node-1754003013547-xnjl7qrrd',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-zl7ys1zha',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-8uy29v2b9'
      },
      {
        source: 'node-1754003013547-zl7ys1zha',
        sourceHandle: 'source-0',
        target: 'node-1754003013547-7ek5gv0ce',
        targetHandle: 'target-0',
        id: 'edge-1754003013547-zebc65slx'
      }
    ],
    metadata: {
      exportedAt: '2025-08-01T02:55:15.236Z',
      version: '1.0',
      title: 'Workflow for Chat 45f851c8-a282-47f9-8e88-fac68c5eeecb'
    }
  },
  tags: ['analytics', 'oecd', 'economics', 'statistics', 'country-data', 'environmental', 'agricultural', 'advanced'],
  isPublic: true,
  usageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}; 