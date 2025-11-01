// Choropleth Chart Renderer
import React from 'react';
import { ResponsiveChoropleth } from '@nivo/geo';
import type { ChoroplethChartConfig } from './ChoroplethSchema';
const world_countries_data = require('./world_countries.json');
const world_countries_features = world_countries_data.features;

interface ChoroplethRendererProps {
  data: any[];
  config: ChoroplethChartConfig;
  theme?: any;
}

export const ChoroplethRenderer: React.FC<ChoroplethRendererProps> = ({
  data,
  config,
  theme,
}) => {
  // Validate choropleth data
  const validChoroplethData = data.filter(
    (item) =>
      item &&
      typeof item.id === 'string' &&
      typeof item.value === 'number' &&
      Number.isFinite(item.value),
  );

  if (validChoroplethData.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          Choropleth chart requires valid geographic data with id and value
        </p>
      </div>
    );
  }

  // Extract configuration with defaults matching Nivo example
  const margin = config.margin || { top: 0, right: 0, bottom: 0, left: 0 };
  const colors = config.colors?.scheme || 'nivo';

  // Projection configuration matching Nivo example
  const projectionType = config.projectionType || 'equirectangular';
  const projectionTranslation = config.projectionTranslation || [0.5, 0.5];
  const projectionRotation = config.projectionRotation || [0, 0, 0];
  const projectionScale = config.projectionScale || 100;

  // Calculate domain from data if not provided
  const values = validChoroplethData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const domain = config.domain || [minValue, maxValue];
  const features = config.features || world_countries_features || [];

  // Ensure features is an array
  if (!Array.isArray(features)) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">
          Invalid geographic features data
        </p>
      </div>
    );
  }

  // Default legend configuration matching Nivo example
  const defaultLegends = [
    {
      anchor: 'bottom-right' as const,
      direction: 'column' as const,
      justify: true,
      translateX: 20,
      translateY: -20,
      itemsSpacing: 0,
      itemWidth: 94,
      itemHeight: 18,
      itemTextColor: '#ffffff',
      itemDirection: 'left-to-right' as const,
      itemOpacity: 0.85,
      symbolSize: 18,
      effects: [
        {
          on: 'hover' as const,
          style: {
            itemTextColor: '#ffffff',
            itemOpacity: 1,
          },
        },
      ],
    },
  ];

  return (
    <ResponsiveChoropleth
      data={validChoroplethData}
      features={features}
      margin={margin}
      colors={colors}
      domain={domain}
      unknownColor="#666666"
      label="properties.name"
      valueFormat=".2s"
      enableGraticule={true}
      graticuleLineColor="#dddddd"
      borderWidth={0.5}
      borderColor="#152538"
      legends={defaultLegends}
      projectionType={projectionType}
      projectionRotation={projectionRotation}
      projectionScale={projectionScale}
      projectionTranslation={projectionTranslation}
      tooltip={({ feature }) => (
          <div className="bg-background text-white p-2 border border-border rounded-md">
              <strong>{feature.label}</strong>
              <br />
              {feature.value !== undefined ? feature.value : 'No data'}
          </div>
      )}
    />
  );
}; 