'use client';

// Chart Components Registry (Client-Only)
// -----------------------------------------------------------------------------
// This file contains React components that should ONLY be imported on the
// client side. Server-side code should use registry-processors.ts instead.
// -----------------------------------------------------------------------------

import type { ChartType } from './types';
import React from 'react';

// Renderer components
import { BarRenderer } from './bar/BarRenderer';
import { LineRenderer } from './line/LineRenderer';
import { PieRenderer } from './pie/PieRenderer';
import { HeatmapRenderer } from './heatmap/HeatmapRenderer';
import { RadarRenderer } from './radar/RadarRenderer';
import { ScatterRenderer } from './scatter/ScatterRenderer';
import { AreaBumpRenderer } from './areaBump/AreaBumpRenderer';
import { CalendarRenderer } from './calendar/CalendarRenderer';
import { ChordRenderer } from './chord/ChordRenderer';
import { CirclePackingRenderer } from './circlePacking/CirclePackingRenderer';
import { SankeyRenderer } from './sankey/SankeyRenderer';
import { BoxPlotRenderer } from './boxplot/BoxPlotRenderer';
import { BumpRenderer } from './bump/BumpRenderer';
import { BulletRenderer } from './bullet/BulletRenderer';
import { FunnelRenderer } from './funnel/FunnelRenderer';
import { StreamRenderer } from './stream/StreamRenderer';
import { SunburstRenderer } from './sunburst/SunburstRenderer';
import { WaffleRenderer } from './waffle/WaffleRenderer';
import { NetworkRenderer } from './network/NetworkRenderer';
import { RadialBarRenderer } from './radialbar/RadialBarRenderer';
import { SwarmplotRenderer } from './swarmplot/SwarmplotRenderer';
import { TreemapRenderer } from './treemap/TreemapRenderer';
import { VoronoiRenderer } from './voronoi/VoronoiRenderer';
import { ChoroplethRenderer } from './choropleth/ChoroplethRenderer';
import { GeomapRenderer } from './geomap/GeomapRenderer';

export const CHART_RENDERERS: Record<ChartType, React.FC<any>> = {
  bar: BarRenderer,
  line: LineRenderer,
  pie: PieRenderer,
  heatmap: HeatmapRenderer,
  radar: RadarRenderer,
  scatter: ScatterRenderer,
  areaBump: AreaBumpRenderer,
  calendar: CalendarRenderer,
  chord: ChordRenderer,
  circlePacking: CirclePackingRenderer,
  sankey: SankeyRenderer,
  boxplot: BoxPlotRenderer,
  bump: BumpRenderer,
  bullet: BulletRenderer,
  funnel: FunnelRenderer,
  stream: StreamRenderer,
  sunburst: SunburstRenderer,
  waffle: WaffleRenderer,
  network: NetworkRenderer,
  radialbar: RadialBarRenderer,
  swarmplot: SwarmplotRenderer,
  treemap: TreemapRenderer,
  voronoi: VoronoiRenderer,
  choropleth: ChoroplethRenderer,
  geomap: GeomapRenderer,
};

// Configuration components
import { BarConfig } from './bar/BarConfig';
import { LineConfig } from './line/LineConfig';
import { PieConfig } from './pie/PieConfig';
import { HeatmapConfig } from './heatmap/HeatmapConfig';
import { RadarConfig } from './radar/RadarConfig';
import { ScatterConfig } from './scatter/ScatterConfig';
import { CalendarConfig } from './calendar/CalendarConfig';
import { ChoroplethConfig } from './choropleth/ChoroplethConfig';
import { GeomapConfig } from './geomap/GeomapConfig';

export const CHART_CONFIG_COMPONENTS: Partial<Record<ChartType, React.FC<any>>> = {
  bar: BarConfig,
  line: LineConfig,
  pie: PieConfig,
  heatmap: HeatmapConfig,
  radar: RadarConfig,
  scatter: ScatterConfig,
  calendar: CalendarConfig,
  choropleth: ChoroplethConfig,
  geomap: GeomapConfig,
}; 