import {
  NodeModel,
  type ExecutionContext,
  type SettingsObject,
} from '@/lib/nodes/core';
import type {
  DataTableType,
  DataTableSpec,
} from '@/lib/types';
import { processChartData } from '@/lib/chart/UnifiedChartDataProcessor';
import type { ChartConfig , ChartType } from '@/lib/chart/types';
import type { ChartNodeView } from './node-view';

interface ChartNodeConfig {
  chartType: ChartType;
  title: string;
  description: string;
  dataMapping: Record<string, string | string[]>; // Dynamic column mapping based on chart type
  chartConfig: any;
  processingOptions?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limitRows?: number;
  };
}

export class ChartNodeModel extends NodeModel {
  validateSettings(_settings: SettingsObject): void {
    // Basic validation - chart configuration is optional
  }
  private config: ChartNodeConfig;
  private nodeViews: ChartNodeView[] = []; // Keep track of node views to update them with data
  constructor() {
    super(1, 0); // 1 input port, 0 output ports (end node)
    this.config = this.getDefaultConfig();
    
    // Configure dashboard output - charts output chart data
    this.configureDashboardOutput([
      {
        portIndex: 0, // We'll store chart data as a special output
        outputType: 'chart',
        title: undefined, // Will be set dynamically based on config
        description: undefined, // Will be set dynamically based on config
      }
    ]);
  }

  private getDefaultConfig(): ChartNodeConfig {
    return {
      chartType: 'scatter',
      title: 'Chart Visualization',
      description: '',
      dataMapping: {},
      chartConfig: {},
      processingOptions: {
        sortBy: undefined,
        sortOrder: 'asc',
        limitRows: 1000,
      },
    };
  }

  // Method to register this view with the model (for updating with data)
  public registerNodeView(view: any): void {
    this.nodeViews.push(view);
  }

  public unregisterNodeView(view: any): void {
    const index = this.nodeViews.indexOf(view);
    if (index > -1) {
      this.nodeViews.splice(index, 1);
    }
  }

  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    // Update node views with input data if available
    if (inData && inData.length > 0 && inData[0]) {
      this.updateNodeViewsWithData(inData);
    }

    // Check if chart is properly configured
    const hasValidConfiguration = this.isConfigurationValid();


    if (!hasValidConfiguration) {
      // If configuration is invalid but we have input data, try to auto-configure
      if (inData && inData.length > 0 && inData[0] && inData[0].spec.columns.length > 0) {
        this.autoConfigureFromData(inData[0]);
        // Re-check configuration after auto-configuration
        if (!this.isConfigurationValid()) {
          return [];
        }
      } else {
        return [];
      }
    }

    if (!inData || inData.length === 0 || !inData[0]) {
      // Chart is configured but no data available yet - preserve configuration and return empty
      return [];
    }

    const inputTable = inData[0];


    // Validate that specified columns exist in the input data
    const availableColumns = inputTable.spec.columns.map((col) => col.name);

    // Check all mapped columns exist in the data
    const missingColumns: string[] = [];
    Object.values(this.config.dataMapping).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((column) => {
          if (column && !availableColumns.includes(column)) {
            missingColumns.push(column);
          }
        });
      } else if (value && !availableColumns.includes(value)) {
        missingColumns.push(value);
      }
    });

    if (missingColumns.length > 0) {
      throw new Error(
        `Mapped columns not found in input data: ${missingColumns.join(', ')}`,
      );
    }

    // Create chart configuration based on current settings
    const chartConfig = this.createChartConfig();

    // Process data for the specific chart type
    try {
      const processedData = processChartData(
        this.config.chartType,
        inputTable,
        chartConfig,
      );

      // Create chart output data for the dashboard
      const chartOutput = {
        chartType: this.config.chartType,
        title: this.config.title,
        description: this.config.description,
        dataMapping: this.config.dataMapping,
        config: chartConfig,
        data: processedData,
        dataRows: inputTable.size,
        dataColumns: inputTable.spec.columns.length,
      };
      // Generate dashboard items (WorkflowEditor will handle persistence)
      // We'll create a mock output array with the chart data for dashboard purposes
      const nodeLabel = this.config.title || `Chart Node (${this.config.chartType})`;
      const dashboardItems = await this.sendOutputsToDashboard([chartOutput as any], context, nodeLabel);
      
      // Store dashboard items in context for WorkflowEditor to access
      (context as any).dashboardItems = dashboardItems;
      
      // Chart node is an end node, return empty array for downstream nodes
      return [];
    } catch (error) {
      throw new Error(
        `Failed to process chart data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {

    // Chart node is an end node with no output, return empty array
    return [];
  }

  // Check if chart configuration is valid
  private isConfigurationValid(): boolean {
    // Basic validation - check if we have data mappings
    const mappingEntries = Object.entries(this.config.dataMapping);
    
    if (mappingEntries.length === 0) {
      return false;
    }

    // At least one mapping should be present and not empty
    const isValid = mappingEntries.some(([_key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0 && value.some((v) => v && v.trim().length > 0);
      } else {
        return value && value.trim().length > 0;
      }
    });
    
    return isValid;
  }

  loadSettings(settings: SettingsObject): void {
    
    // Handle both direct settings and nested settings format
    let actualSettings = settings;
    if ('settings' in settings && typeof settings.settings === 'object') {
      actualSettings = settings.settings as any;
    }
    
    // Simple helpers that respect both SettingsObject interface and plain objects
    const getString = (key: string, defaultValue = ''): string => {
      const value = actualSettings.getString ? actualSettings.getString(key, defaultValue) : (actualSettings as any)[key] ?? defaultValue;
      return value;
    };

    const getNumber = (key: string, defaultValue = 0): number => {
      const value = actualSettings.getNumber ? actualSettings.getNumber(key, defaultValue) : (typeof (actualSettings as any)[key] === 'number' ? (actualSettings as any)[key] : defaultValue);
      return value;
    };

    // Basic scalar settings
    this.config.chartType = (getString('chartType', 'scatter') as ChartType) || 'scatter';
    this.config.title = getString('title', 'Chart Visualization');
    this.config.description = getString('description', '');

    // --- Data Mapping -----------------------------------------------------
    // Check if dataMapping exists as an object directly
    let mapping: Record<string, any> = {};
    const directDataMapping = (actualSettings as any).dataMapping;
    
    if (directDataMapping && typeof directDataMapping === 'object') {
      mapping = { ...directDataMapping };
    } else {
      // Fallback to string-based approach
      const rawMapping = ((): any => {
        const strCandidate = getString('dataMapping', '');
        if (typeof strCandidate === 'string' && strCandidate.trim().startsWith('{')) {
          return strCandidate; // JSON string
        }
        return strCandidate;
      })();

      if (typeof rawMapping === 'string' && rawMapping.trim() !== '' && rawMapping.trim() !== '{}') {
        try {
          mapping = JSON.parse(rawMapping);
        } catch {
          // leave empty – invalid JSON
        }
      }
    }

    this.config.dataMapping = mapping;

    // --- Processing options ----------------------------------------------
    this.config.processingOptions = {
      sortBy: getString('processingOptions.sortBy', '') || undefined,
      sortOrder: (getString('processingOptions.sortOrder', 'asc') as 'asc' | 'desc'),
      limitRows: getNumber('processingOptions.limitRows', 1000),
    };

    // --- Chart specific config -------------------------------------------
    const chartConfigStr = getString('chartConfig', '');
    if (chartConfigStr) {
      try {
        this.config.chartConfig = JSON.parse(chartConfigStr);
      } catch {
        this.config.chartConfig = this.createChartConfig();
      }
    } else {
      this.config.chartConfig = this.createChartConfig();
    }
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set('chartType', this.config.chartType);
      settings.set('title', this.config.title);
      settings.set('description', this.config.description);
      settings.set('dataMapping', JSON.stringify(this.config.dataMapping));
      settings.set('chartConfig', JSON.stringify(this.config.chartConfig));
      settings.set(
        'processingOptions.sortBy',
        this.config.processingOptions?.sortBy || '',
      );
      settings.set(
        'processingOptions.sortOrder',
        this.config.processingOptions?.sortOrder || 'asc',
      );
      settings.set(
        'processingOptions.limitRows',
        this.config.processingOptions?.limitRows || 1000,
      );
    } else {
      (settings as any).chartType = this.config.chartType;
      (settings as any).title = this.config.title;
      (settings as any).description = this.config.description;
      (settings as any).dataMapping = JSON.stringify(this.config.dataMapping);
      (settings as any).chartConfig = JSON.stringify(this.config.chartConfig);
      (settings as any)['processingOptions.sortBy'] =
        this.config.processingOptions?.sortBy || '';
      (settings as any)['processingOptions.sortOrder'] =
        this.config.processingOptions?.sortOrder || 'asc';
      (settings as any)['processingOptions.limitRows'] =
        this.config.processingOptions?.limitRows || 1000;
    }
  }

  // Create chart configuration based on chart type and data mapping
  private createChartConfig(): ChartConfig {
    // Create base config
    const baseConfig = {
      chartType: this.config.chartType,
      title: this.config.title,
      description: this.config.description,
      dataMapping: this.config.dataMapping,
      // Add default theme and styling options
      colors: { scheme: 'nivo' },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      enableLabels: true,
      labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
    };

    // Return as ChartConfig (this will be type-asserted to specific types during processing)
    return baseConfig as unknown as ChartConfig;
  }

  // Getter methods for external access
  getChartType(): ChartType {
    return this.config.chartType;
  }

  getTitle(): string {
    return this.config.title;
  }

  getDescription(): string {
    return this.config.description;
  }

  getDataMapping(): Record<string, string | string[]> {
    return { ...this.config.dataMapping };
  }

  // Legacy getters for backward compatibility (deprecated)
  getXColumn(): string {
    const value = this.config.dataMapping.xColumn;
    return typeof value === 'string' ? value : '';
  }

  getYColumn(): string {
    const value = this.config.dataMapping.yColumn;
    return typeof value === 'string' ? value : '';
  }

  getSeriesColumn(): string {
    const value = this.config.dataMapping.seriesColumn;
    return typeof value === 'string' ? value : '';
  }

  getProcessingOptions() {
    return this.config.processingOptions;
  }

  getChartConfig(): any {
    return this.config.chartConfig;
  }

  // Update methods
  setChartType(chartType: ChartType): void {
    this.config.chartType = chartType;
    // Reset data mapping when chart type changes
    this.config.dataMapping = {};
  }

  setTitle(title: string): void {
    this.config.title = title;
  }

  setDescription(description: string): void {
    this.config.description = description;
  }

  setDataMapping(dataMapping: Record<string, string | string[]>): void {
    this.config.dataMapping = { ...dataMapping };
  }

  setProcessingOptions(options: any): void {
    this.config.processingOptions = {
      ...this.config.processingOptions,
      ...options,
    };
  }

  private updateNodeViewsWithData(data: DataTableType[]): void {
    this.nodeViews.forEach((view) => {
      if (typeof view.setInputData === 'function') {
        view.setInputData(data);
      }
    });
  }

  // Auto-configure chart based on available data columns
  private autoConfigureFromData(inputTable: DataTableType): void {
    const columns = inputTable.spec.columns;
    if (columns.length === 0) return;



    // Simple auto-configuration based on chart type
    switch (this.config.chartType) {
      case 'scatter':
        if (columns.length >= 2) {
          this.config.dataMapping = {
            xColumn: columns[0].name,
            yColumn: columns[1].name,
            ...(columns.length > 2 && { seriesColumn: columns[2].name }),
          };
        }
        break;
      
      case 'bar':
        if (columns.length >= 2) {
          this.config.dataMapping = {
            indexBy: columns[0].name,
            valueColumns: [columns[1].name],
          };
        }
        break;
      
      case 'line':
        if (columns.length >= 2) {
          this.config.dataMapping = {
            xColumn: columns[0].name,
            yColumns: [columns[1].name],
          };
        }
        break;
      
      case 'pie':
        if (columns.length >= 2) {
          this.config.dataMapping = {
            idColumn: columns[0].name,
            valueColumn: columns[1].name,
          };
        }
        break;
      
      case 'heatmap':
        if (columns.length >= 3) {
          this.config.dataMapping = {
            xColumn: columns[0].name,
            yColumn: columns[1].name,
            valueColumn: columns[2].name,
          };
        }
        break;
      
      default:
        // For other chart types, try scatter configuration as fallback
        if (columns.length >= 2) {
          this.config.dataMapping = {
            xColumn: columns[0].name,
            yColumn: columns[1].name,
          };
        }
        break;
    }

    // Update the chart config after auto-configuration
    this.config.chartConfig = this.createChartConfig();
  }
}
