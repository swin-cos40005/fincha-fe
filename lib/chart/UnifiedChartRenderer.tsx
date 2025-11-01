// Unified Chart Renderer
// Uses the chart registry to render any chart type dynamically

import React, { useState, useEffect, useMemo } from 'react';
import { CHART_RENDERERS } from './registry-components';

// Import chart config types
// Note: The individual chart config types have been removed in favour of a
// loose `any` cast when handing the `config` prop to the renderer. Keeping the
// import list here would result in a slew of unused-import linter warnings.

import type { UnifiedChartRendererProps } from './types';
import LoadingWrapper from '@/components/ui/loading-wrapper';
import { defaultTheme } from './default-chart-style';

export const UnifiedChartRenderer: React.FC<UnifiedChartRendererProps> = ({
  chartType,
  data,
  config,
  theme = defaultTheme,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Create a stable key for when chart should re-render
  const chartKey = useMemo(() => {
    return `${chartType}-${JSON.stringify(data?.slice(0, 3))}-${Object.keys(config || {}).length}`;
  }, [chartType, data, config]);

  // Reset loading state when chart inputs change
  useEffect(() => {
    setIsLoading(true);
    setRenderError(null);
  }, [chartKey]);

  // Data validation
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          No data available for this chart
        </p>
      </div>
    );
  }

  // Grab the renderer component from the registry.  If we do not yet support
  // the requested chart type we render a lightweight fallback.
  const RendererComponent = CHART_RENDERERS[chartType];

  if (!RendererComponent) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          Unsupported chart type: {chartType}
        </p>
      </div>
    );
  }

  const handleChartLoad = () => {
    setIsLoading(false);
  };

  const renderChart = () => {
    try {
      return (
        <LoadingWrapper onLoad={handleChartLoad}>
          <RendererComponent
            data={data}
            config={config as any}
            theme={theme}
          />
        </LoadingWrapper>
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error rendering chart';
      setRenderError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Show error state
  if (renderError) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          Error rendering {chartType} chart: {renderError}
        </p>
      </div>
    );
  }

  // Wrap chart in a container with explicit dimensions to fix Nivo rendering issues
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: 'var(--background)',
          }}
        >
          <div className="absolute flex size-full items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading {chartType} chart...</span>
          </div>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        {renderChart()}
      </div>
    </div>
  );
};
