import type { WorkflowTemplate, TemplateCategory } from '@/lib/types';

// System template categories
export const SYSTEM_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'data-processing',
    name: 'Data Processing',
    description: 'Templates for common data processing workflows',
    displayOrder: 1,
    isSystem: true,
    createdAt: new Date(),
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Templates for data analysis and reporting',
    displayOrder: 2,
    isSystem: true,
    createdAt: new Date(),
  },
  {
    id: 'visualization',
    name: 'Visualization',
    description: 'Templates focused on data visualization',
    displayOrder: 3,
    isSystem: true,
    createdAt: new Date(),
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    description: 'Templates for ML and statistical analysis workflows',
    displayOrder: 4,
    isSystem: true,
    createdAt: new Date(),
  },
  {
    id: 'utility',
    name: 'Utility',
    description: 'General purpose utility templates',
    displayOrder: 5,
    isSystem: true,
    createdAt: new Date(),
  },
];

// Import system templates
import { basicDataProcessingTemplate } from './data-processing/basic-data-processing';
import { csvAnalysisTemplate } from './analytics/csv-analysis';
import { dataVisualizationTemplate } from './visualization/data-visualization';
import { statisticalAnalysisTemplate } from './analytics/statistical-analysis';
import { oecdAnalysisTemplate } from './analytics/oecd-analysis';

// All system templates
export const SYSTEM_TEMPLATES: WorkflowTemplate[] = [
  basicDataProcessingTemplate,
  csvAnalysisTemplate,
  dataVisualizationTemplate,
  statisticalAnalysisTemplate,
  oecdAnalysisTemplate,
];

/**
 * Get all system template categories
 */
export function getSystemTemplateCategories(): TemplateCategory[] {
  return SYSTEM_TEMPLATE_CATEGORIES;
}

/**
 * Get all system templates
 */
export function getSystemTemplates(): WorkflowTemplate[] {
  return SYSTEM_TEMPLATES;
}

/**
 * Get system templates by category
 */
export function getSystemTemplatesByCategory(categoryId: string): WorkflowTemplate[] {
  return SYSTEM_TEMPLATES.filter(template => template.categoryId === categoryId);
}

/**
 * Get a system template by ID
 */
export function getSystemTemplateById(id: string): WorkflowTemplate | undefined {
  return SYSTEM_TEMPLATES.find(template => template.id === id);
} 