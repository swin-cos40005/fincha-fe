# Modular Chart System

A comprehensive, modular chart library built on top of Nivo that provides a scalable architecture for managing multiple chart types with simplified, reusable utilities.

## Architecture Overview

The chart system has been refactored to use a centralized utilities approach that eliminates code duplication and provides a single source of truth for shared functionality.

### Key Components

1. **Utils** (`utils.ts`) - Centralized utilities, schemas, and data processing functions
2. **Chart Modules** - Individual chart implementations in their own folders
3. **Unified Components** - Components that work with any chart type
4. **Type System** - Comprehensive TypeScript support for all chart types

### Simplified Folder Structure

```
lib/chart/
├── utils.ts                   # All shared utilities, schemas, and functions
├── types.ts                   # Chart type definitions and unions
├── index.ts                   # Main exports and backwards compatibility
├── UnifiedChartRenderer.tsx   # Dynamic renderer for any chart type
├── UnifiedChartConfig.tsx     # Dynamic configuration UI
├── UnifiedChartDataProcessor.ts # Unified data processing
├── scatter/                   # Scatter plot implementation
│   ├── ScatterSchema.ts       # Type definitions + DATA_MAPPING_EXAMPLE
│   ├── ScatterDataProcessor.ts # Data transformation logic
│   ├── ScatterRenderer.tsx    # React component
│   └── ScatterConfig.tsx      # Configuration UI
├── bar/                       # Bar chart implementation
├── line/                      # Line chart implementation
├── pie/                       # Pie chart implementation
├── heatmap/                   # Heatmap implementation
├── radar/                     # Radar chart implementation
├── areaBump/                  # Area bump implementation
├── [22 other chart types]/    # All chart types follow same pattern
└── README.md                  # This file
```

## Key Improvements

### 1. Centralized Utilities
- All shared schemas (`BaseChartConfig`, `AxisConfig`, `LegendConfig`) are now in `utils.ts`
- All data processing utilities (`parseDataTable`, `toNumber`, `cleanString`, etc.) are centralized
- Single import location for all shared functionality

### 2. Reusable Chart Creation Utilities
- `createChartDataProcessor()` - Factory for creating standardized processors
- `createChartRegistryEntry()` - Helper for creating chart registry entries
- `ChartRegistryEntry<T>` - Generic interface for chart implementations

### 3. Single Source of Truth for Data Mapping
- Each chart's `DATA_MAPPING_EXAMPLE` is defined in its schema file
- `getDataMappingExamples()` imports from individual schemas (no duplication)
- Automatic consistency between chart implementations and documentation

## Usage Examples

### Basic Usage

```typescript
import { 
  getAvailableChartTypes, 
  isChartTypeSupported,
  getDataMappingExamples 
} from '@/lib/chart/utils';

// Get all supported chart types
const chartTypes = getAvailableChartTypes();
console.log(chartTypes); // ['scatter', 'bar', 'line', ...23 total]

// Check if a chart type is supported
const isSupported = isChartTypeSupported('scatter');

// Get data mapping examples for all chart types
const examples = getDataMappingExamples();
```

### Using Unified Components

```tsx
import { UnifiedChartRenderer, UnifiedChartConfig } from '@/lib/chart';

function MyChart({ chartType, data, config, onConfigChange }) {
  return (
    <div>
      <UnifiedChartRenderer 
        chartType={chartType}
        data={data}
        config={config}
      />
      <UnifiedChartConfig
        chartType={chartType}
        config={config}
        onChange={onConfigChange}
      />
    </div>
  );
}
```

### Using Shared Utilities

```typescript
import { 
  parseDataTable, 
  toNumber, 
  cleanString, 
  validateDataTableColumns,
  createChartDataProcessor 
} from '@/lib/chart/utils';

// Parse DataTable to array of objects
const { headers, data } = parseDataTable(dataTable);

// Convert values safely
const numValue = toNumber('42.5'); // 42.5
const strValue = cleanString('  test  '); // 'test'

// Validate required columns
const validation = validateDataTableColumns(dataTable, ['col1', 'col2']);
```

## Adding a New Chart Type

The new system makes adding chart types much simpler and more consistent:

### 1. Create the Chart Schema

```typescript
// newChart/NewChartSchema.ts
import type { BaseChartConfig, LegendConfig } from '../utils';

export interface NewChartConfig extends BaseChartConfig {
  chartType: 'newChart';
  dataMapping: {
    xColumn: string;
    yColumn: string;
  };
  // Chart-specific properties
}

export const DATA_MAPPING_EXAMPLE = {
  description: "Description of what this chart does",
  example: {
    csvColumns: ["X_Value", "Y_Value"],
    dataMapping: {
      xColumn: "X_Value",
      yColumn: "Y_Value"
    },
    description: "Shows X vs Y relationship"
  }
};
```

### 2. Create Data Processor Using Utilities

```typescript
// newChart/NewChartDataProcessor.ts
import type { NewChartConfig } from './NewChartSchema';
import type { DataTable } from '../../types';
import { 
  parseDataTable, 
  toNumber, 
  cleanString, 
  validateDataTableColumns,
  createChartDataProcessor 
} from '../utils';

function processNewChartData(dataTable: DataTable, config: NewChartConfig): any[] {
  const { headers, data } = parseDataTable(dataTable);
  const { xColumn, yColumn } = config.dataMapping;

  return data.map(row => ({
    x: toNumber(row[xColumn]),
    y: toNumber(row[yColumn]),
  }));
}

function getRequiredColumns(config: NewChartConfig): string[] {
  return [config.dataMapping.xColumn, config.dataMapping.yColumn];
}

// Create standardized processor using utility
export const newChartProcessor = createChartDataProcessor(
  processNewChartData,
  getRequiredColumns
);

// Export individual functions for direct use
export { processNewChartData, getRequiredColumns };
export const validateCsvForNewChart = newChartProcessor.validate;
```

### 3. Create Renderer Component

```tsx
// newChart/NewChartRenderer.tsx
import React from 'react';
import type { NewChartConfig } from './NewChartSchema';

interface NewChartRendererProps {
  data: any[];
  config: NewChartConfig;
  theme?: any;
}

export const NewChartRenderer: React.FC<NewChartRendererProps> = ({
  data,
  config,
  theme
}) => {
  // Implement chart using Nivo or other library
  return <div>New Chart Implementation</div>;
};
```

### 4. Register in Main Files

Add to `types.ts`:
```typescript
export type ChartType = 
  | 'scatter'
  | 'bar'
  // ... existing types
  | 'newChart';

export type ChartConfig = 
  | BarChartConfig
  // ... existing configs  
  | NewChartConfig;
```

Add to `utils.ts`:
```typescript
export function getAvailableChartTypes(): ChartType[] {
  return [
    'scatter',
    'bar',
    // ... existing types
    'newChart',
  ];
}

// Import and add to getDataMappingExamples()
import { DATA_MAPPING_EXAMPLE as NewChartDataMappingExample } from './newChart/NewChartSchema';

export function getDataMappingExamples() {
  return {
    // ... existing examples
    newChart: NewChartDataMappingExample,
  };
}
```

## Benefits of the New Architecture

1. **Reduced Code Duplication**: Shared utilities are centralized in `utils.ts`
2. **Single Source of Truth**: Data mapping examples come from individual schemas
3. **Easier Maintenance**: Changes to shared functionality only need to be made in one place
4. **Better Type Safety**: Comprehensive TypeScript support with generic utilities
5. **Simplified Chart Creation**: Reusable factories and helpers for common patterns
6. **Backwards Compatibility**: All existing APIs still work as expected

## Currently Implemented Chart Types

All 23 chart types are fully implemented with the new architecture:

**Primary Charts**: scatter, bar, line, pie, heatmap, radar
**Specialized Charts**: areaBump, calendar, chord, circlePacking, sankey, boxplot, bump, bullet, funnel, stream, sunburst, waffle, network, radialbar, swarmplot, treemap, voronoi

Each chart type follows the same consistent pattern and uses the shared utilities for maximum code reuse and maintainability. 