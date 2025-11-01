// UnifiedChartDataProcessor – registry-driven implementation
// -----------------------------------------------------------------------------
// This file contains ONLY the data processing logic, which is safe to use
// on both client and server side. React components are in a separate registry.
// -----------------------------------------------------------------------------

import type { ChartType, ChartConfig } from './types';
import type { DataTableType } from '@/lib/types';

// Data-processing helpers
import {
  processBarData,
  validateCsvForBar,
  getRequiredColumns as getBarRequiredColumns,
} from './bar/BarDataProcessor';
import {
  processLineData,
  validateCsvForLine,
  getRequiredColumns as getLineRequiredColumns,
} from './line/LineDataProcessor';
import {
  processPieData,
  validateCsvForPie,
  getRequiredColumns as getPieRequiredColumns,
} from './pie/PieDataProcessor';
import {
  processHeatmapData,
  validateCsvForHeatmap,
  getRequiredColumns as getHeatmapRequiredColumns,
} from './heatmap/HeatmapDataProcessor';
import {
  processRadarData,
  validateCsvForRadar,
  getRequiredColumns as getRadarRequiredColumns,
} from './radar/RadarDataProcessor';
import {
  processScatterData,
  validateCsvForScatter,
  getRequiredColumns as getScatterRequiredColumns,
} from './scatter/ScatterDataProcessor';
import {
  processAreaBumpData,
  validateCsvForAreaBump,
  getRequiredColumns as getAreaBumpRequiredColumns,
} from './areaBump/AreaBumpDataProcessor';
import {
  processCalendarData,
  validateCsvForCalendar,
} from './calendar/CalendarDataProcessor';
import {
  processChordData,
  validateCsvForChord,
  getRequiredColumns as getChordRequiredColumns,
} from './chord/ChordDataProcessor';
import {
  processCirclePackingData,
  validateCsvForCirclePacking,
  getRequiredColumns as getCirclePackingRequiredColumns,
} from './circlePacking/CirclePackingDataProcessor';
import {
  processSankeyData,
  validateCsvForSankey,
  getRequiredColumns as getSankeyRequiredColumns,
} from './sankey/SankeyDataProcessor';
import {
  processBoxPlotData,
  validateCsvForBoxPlot,
  getRequiredColumns as getBoxPlotRequiredColumns,
} from './boxplot/BoxPlotDataProcessor';
import {
  processBumpData,
  validateCsvForBump,
  getRequiredColumns as getBumpRequiredColumns,
} from './bump/BumpDataProcessor';
import {
  processBulletData,
  validateCsvForBullet,
  getRequiredColumns as getBulletRequiredColumns,
} from './bullet/BulletDataProcessor';
import {
  processFunnelData,
  validateCsvForFunnel,
  getRequiredColumns as getFunnelRequiredColumns,
} from './funnel/FunnelDataProcessor';
import {
  processStreamData,
  validateCsvForStream,
  getRequiredColumns as getStreamRequiredColumns,
} from './stream/StreamDataProcessor';
import {
  processSunburstData,
  validateCsvForSunburst,
  getRequiredColumns as getSunburstRequiredColumns,
} from './sunburst/SunburstDataProcessor';
import {
  processWaffleData,
  validateCsvForWaffle,
  getRequiredColumns as getWaffleRequiredColumns,
} from './waffle/WaffleDataProcessor';
import {
  processNetworkData,
  validateCsvForNetwork,
  getRequiredColumns as getNetworkRequiredColumns,
} from './network/NetworkDataProcessor';
import {
  processRadialBarData,
  validateCsvForRadialBar,
  getRequiredColumns as getRadialBarRequiredColumns,
} from './radialbar/RadialBarDataProcessor';
import {
  processSwarmplotData,
  validateCsvForSwarmplot,
  getRequiredColumns as getSwarmplotRequiredColumns,
} from './swarmplot/SwarmplotDataProcessor';
import {
  processTreemapData,
  validateCsvForTreemap,
  getRequiredColumns as getTreemapRequiredColumns,
} from './treemap/TreemapDataProcessor';
import {
  processVoronoiData,
  validateCsvForVoronoi,
  getRequiredColumns as getVoronoiRequiredColumns,
} from './voronoi/VoronoiDataProcessor';
import {
  processChoroplethData,
  validateCsvForChoropleth,
  getRequiredColumns as getChoroplethRequiredColumns,
} from './choropleth/ChoroplethDataProcessor';
import {
  processGeomapData,
  validateCsvForGeomap,
  getRequiredColumns as getGeomapRequiredColumns,
} from './geomap/GeomapDataProcessor';

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function processChartData(
  chartType: ChartType,
  dataTable: DataTableType,
  config: ChartConfig,
): any {
  const entry = CHART_PROCESSORS[chartType];
  if (!entry) {
    console.error(`Unsupported chart type: ${chartType}`);
    return [];
  }

  try {
    return entry.process(dataTable, config);
  } catch (error) {
    console.error(`Error processing data for ${chartType} chart:`, error);
    return [];
  }
}

export function validateDataTableForChart(
  chartType: ChartType,
  dataTable: DataTableType,
  config: ChartConfig,
): { valid: boolean; missingColumns: string[]; availableColumns: string[] } {
  const entry = CHART_PROCESSORS[chartType];
  if (!entry) {
    return { valid: false, missingColumns: [], availableColumns: [] };
  }

  try {
    return entry.validate(dataTable, config);
  } catch (error) {
    console.error(`Error validating DataTableType for ${chartType} chart:`, error);
    return { valid: false, missingColumns: [], availableColumns: [] };
  }
}

export function getRequiredColumnsForChart(
  chartType: ChartType,
  config: ChartConfig,
): string[] {
  const entry = CHART_PROCESSORS[chartType];
  if (!entry) return [];

  try {
    return entry.getRequiredColumns(config);
  } catch (error) {
    console.error(`Error getting required columns for ${chartType}:`, error);
    return [];
  }
}

// Chart Data Processors Registry (Server-Safe)
// -----------------------------------------------------------------------------
// This file contains ONLY the data processing logic, which is safe to use
// on both client and server side. React components are in a separate registry.
// -----------------------------------------------------------------------------

export interface ChartProcessorEntry {
  process: (dataTable: DataTableType, config: any) => any;
  validate: (
    dataTable: DataTableType,
    config: any,
  ) => { valid: boolean; missingColumns: string[]; availableColumns: string[] };
  getRequiredColumns: (config: any) => string[];
}

export const CHART_PROCESSORS: Record<ChartType, ChartProcessorEntry> = {
  bar: {
    process: processBarData as any,
    validate: validateCsvForBar as any,
    getRequiredColumns: getBarRequiredColumns as any,
  },
  line: {
    process: processLineData as any,
    validate: validateCsvForLine as any,
    getRequiredColumns: getLineRequiredColumns as any,
  },
  pie: {
    process: processPieData as any,
    validate: validateCsvForPie as any,
    getRequiredColumns: getPieRequiredColumns as any,
  },
  heatmap: {
    process: processHeatmapData as any,
    validate: validateCsvForHeatmap as any,
    getRequiredColumns: getHeatmapRequiredColumns as any,
  },
  radar: {
    process: processRadarData as any,
    validate: validateCsvForRadar as any,
    getRequiredColumns: getRadarRequiredColumns as any,
  },
  scatter: {
    process: processScatterData as any,
    validate: validateCsvForScatter as any,
    getRequiredColumns: getScatterRequiredColumns as any,
  },
  areaBump: {
    process: processAreaBumpData as any,
    validate: validateCsvForAreaBump as any,
    getRequiredColumns: getAreaBumpRequiredColumns as any,
  },
  calendar: {
    process: processCalendarData as any,
    validate: validateCsvForCalendar as any,
    getRequiredColumns: ((config: any) => {
      const c: any = config;
      return [c?.dataMapping?.dateColumn, c?.dataMapping?.valueColumn].filter(Boolean);
    }) as any,
  },
  chord: {
    process: processChordData as any,
    validate: validateCsvForChord as any,
    getRequiredColumns: getChordRequiredColumns as any,
  },
  circlePacking: {
    process: processCirclePackingData as any,
    validate: validateCsvForCirclePacking as any,
    getRequiredColumns: getCirclePackingRequiredColumns as any,
  },
  sankey: {
    process: processSankeyData as any,
    validate: validateCsvForSankey as any,
    getRequiredColumns: getSankeyRequiredColumns as any,
  },
  boxplot: {
    process: processBoxPlotData as any,
    validate: validateCsvForBoxPlot as any,
    getRequiredColumns: getBoxPlotRequiredColumns as any,
  },
  bump: {
    process: processBumpData as any,
    validate: validateCsvForBump as any,
    getRequiredColumns: getBumpRequiredColumns as any,
  },
  bullet: {
    process: processBulletData as any,
    validate: validateCsvForBullet as any,
    getRequiredColumns: getBulletRequiredColumns as any,
  },
  funnel: {
    process: processFunnelData as any,
    validate: validateCsvForFunnel as any,
    getRequiredColumns: getFunnelRequiredColumns as any,
  },
  stream: {
    process: processStreamData as any,
    validate: validateCsvForStream as any,
    getRequiredColumns: getStreamRequiredColumns as any,
  },
  sunburst: {
    process: processSunburstData as any,
    validate: validateCsvForSunburst as any,
    getRequiredColumns: getSunburstRequiredColumns as any,
  },
  waffle: {
    process: processWaffleData as any,
    validate: validateCsvForWaffle as any,
    getRequiredColumns: getWaffleRequiredColumns as any,
  },
  network: {
    process: processNetworkData as any,
    validate: validateCsvForNetwork as any,
    getRequiredColumns: getNetworkRequiredColumns as any,
  },
  radialbar: {
    process: processRadialBarData as any,
    validate: validateCsvForRadialBar as any,
    getRequiredColumns: getRadialBarRequiredColumns as any,
  },
  swarmplot: {
    process: processSwarmplotData as any,
    validate: validateCsvForSwarmplot as any,
    getRequiredColumns: getSwarmplotRequiredColumns as any,
  },
  treemap: {
    process: processTreemapData as any,
    validate: validateCsvForTreemap as any,
    getRequiredColumns: getTreemapRequiredColumns as any,
  },
  voronoi: {
    process: processVoronoiData as any,
    validate: validateCsvForVoronoi as any,
    getRequiredColumns: getVoronoiRequiredColumns as any,
  },
  choropleth: {
    process: processChoroplethData as any,
    validate: validateCsvForChoropleth as any,
    getRequiredColumns: getChoroplethRequiredColumns as any,
  },
  geomap: {
    process: processGeomapData as any,
    validate: validateCsvForGeomap as any,
    getRequiredColumns: getGeomapRequiredColumns as any,
  },
};
