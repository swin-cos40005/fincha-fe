// Unified Chart Configuration Component
// Dynamically renders the appropriate configuration UI based on chart type

import React from 'react';
import { CHART_CONFIG_COMPONENTS } from './registry-components';

import type { UnifiedChartConfigProps } from './types';

export const UnifiedChartConfig: React.FC<UnifiedChartConfigProps> = ({
  chartType,
  config,
  onChange,
}) => {
  try {
    const ConfigComponent = CHART_CONFIG_COMPONENTS[chartType];

    if (ConfigComponent) {
      return (
        <ConfigComponent config={config as any} onChange={onChange as any} />
      );
    }

    // Fallback for chart types without a dedicated config panel.
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Configuration panel for {chartType} charts is not yet implemented.
          The chart will use default settings.
        </p>
      </div>
    );
  } catch (error) {
    console.error('Error rendering chart configuration:', error);
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Error loading configuration for {chartType} chart
        </p>
      </div>
    );
  }
};
