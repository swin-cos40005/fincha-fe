import type { NodeMetadata } from '@/lib/types';
import { PostgresIcon } from '@/components/icons';

export const PostgresInputNodeDescription: NodeMetadata = {
  id: 'postgres-input',
  name: 'PostgreSQL Input',
  category: 'Data Sources',
  keywords: [
    'postgres',
    'postgresql',
    'database',
    'table',
    'data source',
    'input',
  ],
  icon: PostgresIcon
};

export const NODE_DESCRIPTION = {
  shortDescription: 'Loads data from PostgreSQL database tables with table selection interface',
  detailedDescription: {
    whatItDoes: 'The PostgreSQL Input node connects to a PostgreSQL database and allows users to browse and select tables to load data from. It provides a table selection interface similar to Supabase, showing table metadata and sample data.',
    whenToUse: [
      'Loading data from existing PostgreSQL databases',
      'Browsing database schema and table structures',
      'Selecting specific tables for data analysis',
      'Creating data pipelines from database sources',
      'Exploring database contents before processing'
    ],
    keyFeatures: [
      'Direct PostgreSQL database connection',
      'Table browsing and selection interface',
      'Table metadata display (columns, data types)',
      'Sample data preview with pagination',
      'SSL connection support',
      'Automatic data type detection'
    ],
    security: [
      'Credentials are stored securely in node settings',
      'SSL connections supported for encrypted data transfer',
      'Connection parameters are validated before execution',
      'Only SELECT operations are allowed for security'
    ],
    examples: [
      {
        title: 'Load user data',
        description: 'Select the "users" table to load user information'
      },
      {
        title: 'Load order data',
        description: 'Select the "orders" table to load order information'
      },
      {
        title: 'Load product catalog',
        description: 'Select the "products" table to load product information'
      }
    ]
  }
};

export const NODE_SCHEMA = {
  type: 'object',
  properties: {
    host: {
      type: 'string',
      description: 'PostgreSQL server hostname or IP address',
      examples: ['localhost', 'db.example.com', '192.168.1.100']
    },
    port: {
      type: 'number',
      description: 'PostgreSQL server port number',
      default: 5432,
      minimum: 1,
      maximum: 65535
    },
    database: {
      type: 'string',
      description: 'Name of the PostgreSQL database to connect to',
      examples: ['mydb', 'production', 'analytics']
    },
    username: {
      type: 'string',
      description: 'PostgreSQL username for authentication'
    },
    password: {
      type: 'string',
      description: 'PostgreSQL password for authentication'
    },
    ssl: {
      type: 'boolean',
      description: 'Whether to use SSL connection to PostgreSQL',
      default: false
    },
    selectedTable: {
      type: 'string',
      description: 'Name of the selected table to load data from',
      examples: ['users', 'orders', 'products']
    },
    tableSchema: {
      type: 'string',
      description: 'JSON string containing the selected table schema information',
      examples: ['{"name":"users","columns":[{"name":"id","dataType":"integer"}]}']
    },
    pageSize: {
      type: 'number',
      description: 'Number of rows to load from the selected table',
      default: 1000,
      minimum: 1,
      maximum: 10000
    }
  },
  required: ['host', 'database', 'username', 'password', 'selectedTable'],
  additionalProperties: false
};
