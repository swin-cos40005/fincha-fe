import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
} from '../../core';
import { SimpleCell } from '../../../types';

export class DataInputNodeModel extends NodeModel {
  private static CSV_URL_KEY = 'csv_url';
  private static CSV_SOURCE_TYPE_KEY = 'csv_source_type';
  private static CSV_FILE_NAME_KEY = 'csv_file_name';

  private csvUrl = '';
  private csvSourceType: 'url' | 'upload' | 'conversation' = 'url';
  private csvFileName = '';

  // Public getters
  public getCsvUrl(): string {
    return this.csvUrl;
  }

  public getCsvSourceType(): 'url' | 'upload' | 'conversation' {
    return this.csvSourceType;
  }

  public getCsvFileName(): string {
    return this.csvFileName;
  }

  constructor() {
    super(0, 1); // 0 inputs, 1 output

    this.configureDashboardOutput([
      {
        portIndex: 0,
        outputType: 'table',
        title: 'Data Input',
        description: 'Data from the CSV file',
      },
    ]);
  }

  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    if (!this.csvUrl) {
      throw new Error('CSV URL is required. Please configure the node.');
    }

    try {
      // Display user-friendly progress message based on source type
      const progressMessage = this.csvFileName
        ? `Loading data from ${this.csvFileName}...`
        : 'Fetching CSV data...';
      context.setProgress(0.1, progressMessage);

      // Always fetch CSV data from URL (regardless of original source)
      const response = await fetch(this.csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }

      const csvText = await response.text();
      context.setProgress(0.5, 'Parsing CSV data...');

      // Parse CSV properly handling quoted values
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result.map(val => val.replace(/^"|"$/g, '')); // Remove surrounding quotes
      };

      // Parse CSV
      const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1);

      if (rows.length === 0) {
        throw new Error('CSV file contains no data rows');
      }

      // Determine column types by sampling first few rows
      const columnTypes = headers.map((header, index) => {
        const sampleValues = rows
          .slice(0, Math.min(10, rows.length))
          .map((row) => {
            const values = parseCSVLine(row);
            return values[index] || '';
          })
          .filter((v) => v !== '');

        // Check if values are numeric
        const numericValues = sampleValues
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v));
        if (numericValues.length > sampleValues.length * 0.8) {
          return 'number';
        }

        // Check if values are dates
        const dateValues = sampleValues.filter(
          (v) => !Number.isNaN(Date.parse(v)),
        );
        if (dateValues.length > sampleValues.length * 0.7) {
          return 'date';
        }

        return 'string';
      });

      context.setProgress(0.7, 'Creating data table...');

      // Create output table
      const output = context.createDataTable({
        columns: headers.map((name, index) => ({
          name,
          type: columnTypes[index],
        })),
        findColumnIndex: (name: string) => headers.indexOf(name),
      });

      // Add data rows
      context.setProgress(0.8, 'Processing data rows...');

      rows.forEach((line, rowIndex) => {
        const values = parseCSVLine(line);
        const cells = headers.map((header, index) => {
          let value: any = values[index] || '';
          const type = columnTypes[index];

          // Convert based on detected type
          if (type === 'number' && value !== '') {
            const numValue = Number(value);
            value = Number.isNaN(numValue) ? 0 : numValue;
          } else if (type === 'date' && value !== '') {
            const dateValue = new Date(value);
            value = Number.isNaN(dateValue.getTime())
              ? value
              : dateValue.toISOString();
          }

          return new SimpleCell(type, value);
        });

        output.addRow(`row-${rowIndex}`, cells);
      });

      context.setProgress(1.0, 'Completed');

      const result = [output.close()];
      
      // Generate dashboard items (WorkflowEditor will handle persistence)
      const nodeLabel = this.csvFileName || 'Data Input';
      const dashboardItems = await this.sendOutputsToDashboard(result, context, nodeLabel);
      
      // Store dashboard items in context for WorkflowEditor to access
      (context as any).dashboardItems = dashboardItems;
      
      return result;
    } catch (error) {
      throw new Error(
        `Failed to load CSV data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (!this.csvUrl) {
      // Return empty spec if no URL configured
      return [
        {
          columns: [],
          findColumnIndex: () => -1,
        },
      ];
    }

    // Don't send to dashboard during configuration - only during execution
    return [
      {
        columns: [{ name: 'data', type: 'string' }],
        findColumnIndex: (name: string) => (name === 'data' ? 0 : -1),
      },
    ];
  }

  loadSettings(settings: SettingsObject): void {
    this.csvUrl = settings.getString
      ? settings.getString(DataInputNodeModel.CSV_URL_KEY, '')
      : (settings as any)[DataInputNodeModel.CSV_URL_KEY] || '';
    this.csvSourceType = settings.getString
      ? (settings.getString(DataInputNodeModel.CSV_SOURCE_TYPE_KEY, 'url') as
          | 'url'
          | 'upload'
          | 'conversation')
      : (settings as any)[DataInputNodeModel.CSV_SOURCE_TYPE_KEY] || 'url';
    this.csvFileName = settings.getString
      ? settings.getString(DataInputNodeModel.CSV_FILE_NAME_KEY, '')
      : (settings as any)[DataInputNodeModel.CSV_FILE_NAME_KEY] || '';
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(DataInputNodeModel.CSV_URL_KEY, this.csvUrl);
      settings.set(DataInputNodeModel.CSV_SOURCE_TYPE_KEY, this.csvSourceType);
      settings.set(DataInputNodeModel.CSV_FILE_NAME_KEY, this.csvFileName);
    } else {
      (settings as any)[DataInputNodeModel.CSV_URL_KEY] = this.csvUrl;
      (settings as any)[DataInputNodeModel.CSV_SOURCE_TYPE_KEY] =
        this.csvSourceType;
      (settings as any)[DataInputNodeModel.CSV_FILE_NAME_KEY] =
        this.csvFileName;
    }
  }

  validateSettings(settings: SettingsObject): void {
    const url = settings.getString
      ? settings.getString(DataInputNodeModel.CSV_URL_KEY, '')
      : (settings as any)[DataInputNodeModel.CSV_URL_KEY] || '';

    if (!url || url.trim() === '') {
      throw new Error('CSV URL is required');
    }

    try {
      new URL(url);
    } catch {
      throw new Error('Invalid CSV URL format');
    }
  }

}
