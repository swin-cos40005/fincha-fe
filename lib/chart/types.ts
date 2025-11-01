import type { DataValue } from '../types';

// Import chart config types
import type { BarChartConfig } from './bar/BarSchema';
import type { LineChartConfig } from './line/LineSchema';
import type { PieChartConfig } from './pie/PieSchema';
import type { HeatmapChartConfig } from './heatmap/HeatmapSchema';
import type { RadarChartConfig } from './radar/RadarSchema';
import type { ScatterPlotConfig } from './scatter/ScatterSchema';
import type { AreaBumpChartConfig } from './areaBump/AreaBumpSchema';
import type { CalendarChartConfig } from './calendar/CalendarSchema';
import type { ChordChartConfig } from './chord/ChordSchema';
import type { CirclePackingChartConfig } from './circlePacking/CirclePackingSchema';
import type { SankeyChartConfig } from './sankey/SankeySchema';
import type { BoxPlotChartConfig } from './boxplot/BoxPlotSchema';
import type { BumpChartConfig } from './bump/BumpSchema';
import type { BulletChartConfig } from './bullet/BulletSchema';
import type { FunnelChartConfig } from './funnel/FunnelSchema';
import type { StreamChartConfig } from './stream/StreamSchema';
import type { SunburstChartConfig } from './sunburst/SunburstSchema';
import type { WaffleChartConfig } from './waffle/WaffleSchema';
import type { NetworkChartConfig } from './network/NetworkSchema';
import type { RadialBarChartConfig } from './radialbar/RadialBarSchema';
import type { SwarmplotChartConfig } from './swarmplot/SwarmplotSchema';
import type { TreemapChartConfig } from './treemap/TreemapSchema';
import type { VoronoiChartConfig } from './voronoi/VoronoiSchema';
import type { ChoroplethChartConfig } from './choropleth/ChoroplethSchema';
import type { GeomapChartConfig } from './geomap/GeomapSchema';

export type ChartType =
  | 'scatter'
  | 'bar'
  | 'line'
  | 'pie'
  | 'heatmap'
  | 'radar'
  | 'areaBump'
  | 'calendar'
  | 'chord'
  | 'circlePacking'
  | 'sankey'
  | 'boxplot'
  | 'bump'
  | 'bullet'
  | 'funnel'
  | 'stream'
  | 'sunburst'
  | 'waffle'
  | 'network'
  | 'radialbar'
  | 'swarmplot'
  | 'treemap'
  | 'voronoi'
  | 'choropleth'
  | 'geomap';

export type ChartDataPoint = {
  x: number | string;
  y: number | string;
  [key: string]: DataValue;
};

export type ChartData = {
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string;
  series?: string;
};

export type ChartConfig =
  | BarChartConfig
  | LineChartConfig
  | PieChartConfig
  | HeatmapChartConfig
  | RadarChartConfig
  | ScatterPlotConfig
  | AreaBumpChartConfig
  | CalendarChartConfig
  | ChordChartConfig
  | CirclePackingChartConfig
  | SankeyChartConfig
  | BoxPlotChartConfig
  | BumpChartConfig
  | BulletChartConfig
  | FunnelChartConfig
  | StreamChartConfig
  | SunburstChartConfig
  | WaffleChartConfig
  | NetworkChartConfig
  | RadialBarChartConfig
  | SwarmplotChartConfig
  | TreemapChartConfig
  | VoronoiChartConfig
  | ChoroplethChartConfig
  | GeomapChartConfig;

export interface ChartProps {
  data: ChartData;
  config: ChartConfig;
  width?: number;
  height?: number;
  className?: string;
}

export interface ChartRendererProps extends ChartProps {
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export interface UnifiedChartRendererProps {
  chartType: ChartType;
  data: any[];
  config: ChartConfig;
  theme?: any;
}

export interface UnifiedChartConfigProps {
  chartType: ChartType;
  config: ChartConfig;
  onChange: (updates: Partial<ChartConfig>) => void;
} 