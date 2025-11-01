// Geomap Chart Renderer
import React from 'react';
import { ResponsiveGeoMap } from '@nivo/geo';
import type { GeomapChartConfig } from './GeomapSchema';
const world_countries_features = require('@/lib/chart/choropleth/world_countries.json');

interface GeomapRendererProps {
  data: any[];
  config: GeomapChartConfig;
  theme?: any;
}

export const GeomapRenderer: React.FC<GeomapRendererProps> = ({
  data,
  config,
  theme,
}) => {
  // Extract configuration with defaults
  const margin = config.margin || { top: 0, right: 0, bottom: 0, left: 0 };

  // Projection configuration
  const projectionType = config.projectionType || 'mercator';
  const projectionRotation = config.projectionRotation || [0, 0, 0];
  const projectionScale = config.projectionScale || 1;
  const projectionCenter = config.projectionCenter || [0, 0];

  // Check if we have features to render
  if (!config.features || config.features.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          Geomap chart requires geographic features (map boundaries) to render
        </p>
      </div>
    );
  }

  return (
    <ResponsiveGeoMap
      features={world_countries_features}
      margin={margin}
      projectionType={projectionType}
      projectionRotation={projectionRotation}
      projectionScale={projectionScale}
      projectionTranslation={projectionCenter}
      fillColor={config.unknownColor || '#666666'}
      borderWidth={config.borderWidth || 0.5}
      borderColor={config.borderColor || '#152538'}
      enableGraticule={config.enableGraticule || false}
      graticuleLineColor="#dddddd"
      theme={theme}
    />
  );
}; 