import React from 'react';
import type { Node, Edge } from 'reactflow';

// Basic Data Types
export type SimpleDataValue = string | number | boolean | null | undefined;
export type DataValue = SimpleDataValue | Record<string, SimpleDataValue> | SimpleDataValue[];
export type DataRecord = Record<string, DataValue>;
export type DataArray = DataValue[];
export type DataMatrix = DataValue[][];

// Generic Types
export type UnknownRecord = Record<string, unknown>;
export type DataValueRecord = Record<string, DataValue>;
export type SimpleFunction = (...args: unknown[]) => unknown;

// Node Types
export type NodeData = {
  id: string;
  type: string;
  label: string;
  settings?: Record<string, unknown>;
};

export type WorkflowData = {
  nodes: Node<NodeData>[];
  edges: Edge[];
};

// Settings Types
export interface SettingsObject {
  getString(key: string, defaultValue?: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  set(key: string, value: unknown): void;
}

// Table Types
export interface Cell {
  readonly type: string;
  getValue(): DataValue;
}

export interface DataRow {
  readonly key: string;
  getCell(index: number): Cell;
  readonly cells: Cell[];
}

export interface DataTableType {
  readonly spec: DataTableSpec;
  readonly rows: DataRow[];
  forEach(callback: (row: DataRow) => void): void;
  readonly size: number;
}

export interface ColumnSpec {
  readonly name: string;
  readonly type: string;
}

export interface DataTableSpec {
  readonly columns: ColumnSpec[];
  findColumnIndex(name: string): number;
}

export interface ExecutionContext {
  nodeId: string; // The ID of the node being executed
  createDataTable(spec: DataTableSpec): DataTableContainer;
  checkCanceled(): void;
  setProgress(progress: number, message?: string): void;
}

export interface DataTableContainer {
  addRow(key: string, cells: Cell[]): void;
  close(): DataTableType;
}

// Node Factory Types
export interface NodeMetadata {
  id: string;
  name: string;
  category: string;
  icon?: React.ElementType;
  image?: string;
  keywords?: string[];
  toDashboard?: boolean;
}

// Data Processing Types
export interface ProcessingStats {
  rowCount: number;
  columnStats: {
    [key: string]: {
      nullCount: number;
      distinctCount: number;
      min?: number;
      max?: number;
      mean?: number;
      mode?: DataValue;
    };
  };
}

export interface DataStats {
  columns: {
    name: string;
    type: string;
    nullCount: number;
    distinctCount: number;
    min?: number;
    max?: number;
    mean?: number;
    mode?: DataValue;
  }[];
  rowCount: number;
}

// Message Types
export type DataPart = { type: 'append-message'; message: string };

// Database Types
export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface QueryConfig {
  query: string;
  parameters?: Record<string, DataValue>;
}

// Database Result Types
export interface QueryResult {
  rows: DataValueRecord[];
  fields: ColumnSpec[];
  rowCount: number;
}

// Error Types
export interface ErrorWithMessage {
  message: string;
  [key: string]: unknown;
}

export class SimpleCell implements Cell {
  constructor(public readonly type: string, private value: DataValue) {}
  getValue(): DataValue { return this.value; }
}

// Template System Types
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isSystem: boolean;
  createdAt: Date;
}

export interface WorkflowTemplateData {
  nodes: any[];
  edges: any[];
  metadata?: {
    version?: string;
    [key: string]: any;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  useCase?: string;
  categoryId: string;
  category?: TemplateCategory;
  data: WorkflowTemplateData;
  tags: string[];
  isPublic: boolean;
  userId?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  useCase?: string;
  categoryId: string;
  data: WorkflowTemplateData;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  id: string;
}

export interface TemplateSearchFilters {
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
  search?: string;
}

export interface TemplateSearchResponse {
  templates: WorkflowTemplate[];
  categories: TemplateCategory[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TemplateDropData {
  type: 'template';
  templateId: string;
  templateName: string;
}
