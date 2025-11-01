import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarChartConfig } from './BarSchema';
import { defaultLegend } from '../default-chart-style';

interface BarRendererProps {
  data: any[];
  config: BarChartConfig;
  theme?: any;
}

export const BarRenderer: React.FC<BarRendererProps> = ({
  data,
  config,
  theme,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-muted-foreground">
        No data available for bar chart
      </div>
    );
  }

  const keys = config.dataMapping.valueColumns;

  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={config.dataMapping.indexBy}
      
      // Layout and dimensions
      margin={config.margin || { top: 50, right: 130, bottom: 50, left: 60 }}
      layout={config.layout || 'vertical'}
      reverse={config.reverse || false}
      
      // Spacing
      padding={config.padding || 0.3}
      innerPadding={config.innerPadding || 0}
      
      // Grouping
      groupMode={config.groupMode || 'grouped'}
      
      // Scales
      valueScale={config.valueScale || { type: 'linear' }}
      indexScale={{ type: 'band', round: config.indexScale?.round || true }}
      minValue={config.minValue || 'auto'}
      maxValue={config.maxValue || 'auto'}
      
      // Colors
      colors={
        config.colors?.scheme
          ? { scheme: config.colors.scheme }
          : { scheme: 'nivo' }
      }
      colorBy={config.colorBy || 'id'}
      
      // Bar styling
      borderRadius={config.borderRadius || 0}
      borderWidth={config.borderWidth || 0}
      borderColor={
        typeof config.borderColor === 'string' 
          ? config.borderColor 
          : { from: 'color' }
      }
      
      // Labels
      enableLabel={config.enableLabel || false}
      label={config.label || 'value'}
      labelPosition={config.labelPosition || 'middle'}
      labelOffset={config.labelOffset || 0}
      labelSkipWidth={config.labelSkipWidth || 12}
      labelSkipHeight={config.labelSkipHeight || 12}
      labelTextColor={
        typeof config.labelTextColor === 'string' 
          ? config.labelTextColor 
          : { from: 'color' }
      }
      labelFormat={config.labelFormat}
      
      // Grid
      enableGridX={config.enableGridX || false}
      enableGridY={config.enableGridY !== false}
      gridXValues={config.gridXValues as any}
      gridYValues={config.gridYValues as any}
      
      // Axes
      axisTop={config.axisTop}
      axisRight={config.axisRight}
      axisBottom={
        config.axisBottom || {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: config.dataMapping.indexBy,
          legendPosition: 'middle',
          legendOffset: 32,
        }
      }
      axisLeft={
        config.axisLeft || {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Value',
          legendPosition: 'middle',
          legendOffset: -40,
        }
      }
      
      // Legends
      legends={
        (config.legends?.map((legend) => ({
          dataFrom: legend.dataFrom || 'keys',
          anchor: legend.anchor,
          direction: legend.direction,
          justify: legend.justify || false,
          translateX: legend.translateX || 0,
          translateY: legend.translateY || 0,
          itemsSpacing: legend.itemsSpacing || 0,
          itemWidth: legend.itemWidth || 100,
          itemHeight: legend.itemHeight || 18,
          itemDirection: legend.itemDirection || 'left-to-right',
          itemOpacity: legend.itemOpacity || 1,
          symbolSize: legend.symbolSize || 12,
          symbolShape: legend.symbolShape || 'square',
        })) || [defaultLegend]) as any
      }
      
      // Totals
      enableTotals={config.enableTotals || false}
      totalsOffset={config.totalsOffset || 10}
      
      // Formatting
      valueFormat={config.valueFormat}
      tooltipLabel={config.tooltipLabel}
      legendLabel={config.legendLabel}
      
      // Interactivity
      isInteractive={config.isInteractive !== false}
      
      // Initial state
      initialHiddenIds={config.initialHiddenIds || []}
      
      // Accessibility
      role={config.role || 'img'}
      ariaLabel={config.ariaLabel}
      ariaLabelledBy={config.ariaLabelledBy}
      ariaDescribedBy={config.ariaDescribedBy}
      isFocusable={config.isFocusable !== false}
      
      // Animation
      animate={config.animate !== false}
      
      // Theme
      theme={theme}
    />
  );
};
