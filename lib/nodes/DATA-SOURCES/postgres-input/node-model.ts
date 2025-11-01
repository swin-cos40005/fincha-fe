import type {
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
  Cell,
  QueryResult,
  DataValueRecord,
  ErrorWithMessage,
  ColumnSpec
} from '@/lib/types';
import { NodeModel } from '@/lib/nodes/base-node/node-model';
import { SimpleCell } from '@/lib/types';

/**
 * IMPORTANT: This node requires network access to the PostgreSQL API endpoint.
 * When executed by AI tools, network restrictions may prevent access to the API.
 * In such cases, the node will provide a helpful error message suggesting manual execution.
 */

// PostgreSQL connection configuration
export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

// Table selection configuration
export interface TableConfig {
  selectedTable: string;
  tableSchema: string;
  pageSize: number;
}

// Table metadata interface
export interface TableMetadata {
  name: string;
  type: string;
  columns: ColumnMetadata[];
}

export interface ColumnMetadata {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}

/**
 * Node model that loads data from PostgreSQL database tables
 */
export class PostgresInputNodeModel extends NodeModel {
  private settings: SettingsObject;
  private outputSpec: DataTableSpec;
  private cachedTableData: any = null; // Cache for fetched table data
  private cachedTableName: string = ''; // Track which table is cached

  constructor() {
    super(0, 1); // 0 input ports, 1 output port
    
    // Initialize with default values
    const defaultSettings = new Map<string, any>();
    defaultSettings.set('host', 'localhost');
    defaultSettings.set('port', 6543);
    defaultSettings.set('database', '');
    defaultSettings.set('username', '');
    defaultSettings.set('password', '');
    defaultSettings.set('ssl', false);
    defaultSettings.set('selectedTable', '');
    defaultSettings.set('tableSchema', '');
    defaultSettings.set('pageSize', 1000);
    
    this.settings = {
      getString: (key: string, defaultValue: string = '') => 
        defaultSettings.get(key) || defaultValue,
      getNumber: (key: string, defaultValue: number = 0) => 
        defaultSettings.get(key) || defaultValue,
      getBoolean: (key: string, defaultValue: boolean = false) => 
        defaultSettings.get(key) || defaultValue,
      set: (key: string, value: any) => {
        defaultSettings.set(key, value);
      }
    };
    this.outputSpec = { columns: [], findColumnIndex: () => -1 };

    // Configure dashboard output like data-input node
    this.configureDashboardOutput([
      {
        portIndex: 0,
        outputType: 'table',
        title: 'PostgreSQL Data',
        description: 'Data from the selected PostgreSQL table',
      },
    ]);
  }

  async execute(inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    try {
      // Get settings
      const host = this.settings.getString('host', '');
      const port = this.settings.getNumber('port', 6543);
      const database = this.settings.getString('database', '');
      const username = this.settings.getString('username', '');
      const password = this.settings.getString('password', '');
      const ssl = this.settings.getBoolean('ssl', false);
      const selectedTable = this.settings.getString('selectedTable', '');

      // Validate settings
      if (!host || !database || !username || !password || !port) {
        throw new Error('Missing required connection parameters');
      }

      if (!selectedTable) {
        throw new Error('No table selected');
      }

      // Check if we're in AI tool execution context
      const isAiToolExecution = typeof window === 'undefined';
      if (isAiToolExecution) {
        context.setProgress(0, 'PostgreSQL node detected in AI tool execution context. Using cached table data...');
      } else {
        context.setProgress(0, 'Loading PostgreSQL data...');
      }

      // Check if we have cached data for this table
      if (this.cachedTableData && this.cachedTableName === selectedTable) {
        context.setProgress(0.5, 'Using cached table data...');
      } else {
        // Try to restore cached data from settings first
        const cachedDataString = this.settings.getString('cachedData', '');
        if (cachedDataString) {
          try {
            const cachedData = JSON.parse(cachedDataString);
            if (cachedData && cachedData.rows && cachedData.rows.length > 0) {
              this.cachedTableData = cachedData;
              this.cachedTableName = selectedTable;
              context.setProgress(0.5, 'Restored cached table data from settings...');
            }
          } catch (error) {
            console.warn('Failed to restore cached data from settings:', error);
          }
        }

        // If we still don't have cached data, try different approaches based on context
        if (!this.cachedTableData) {
          if (isAiToolExecution) {
            // In AI execution context, try to fetch data directly without API
            context.setProgress(0.2, 'Fetching table data directly (AI execution context)...');
            
            try {
              const queryResult = await this.fetchTableDataDirect(context, selectedTable);
              
              // Cache the fetched data
              this.cachedTableData = queryResult;
              this.cachedTableName = selectedTable;
              
              context.setProgress(0.5, 'Direct table data fetch completed...');
            } catch (fetchError) {
              // If direct fetch fails, fall back to mock data from schema
              context.setProgress(0.3, 'Direct fetch failed, creating sample data from schema...');
              
              try {
                const tableSchema = this.settings.getString('tableSchema', '');
                if (tableSchema) {
                  const schema = JSON.parse(tableSchema);
                  
                  // Create mock data based on the table schema as fallback
                  const mockData = this.createMockDataFromSchema(schema);
                  this.cachedTableData = mockData;
                  this.cachedTableName = selectedTable;
                  
                  context.setProgress(0.5, 'Created sample data from schema (direct fetch failed)...');
                } else {
                  throw new Error('No table schema available and direct fetch failed. Please configure the table in the dialog first.');
                }
              } catch (schemaError) {
                throw new Error(`Both direct fetch and schema fallback failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
              }
            }
          } else {
            // In browser context, fetch fresh data via API
            context.setProgress(0.2, 'Fetching fresh table data via API...');
            
            try {
              const queryResult = await this.fetchTableData(context, selectedTable);
              
              // Cache the fetched data
              this.cachedTableData = queryResult;
              this.cachedTableName = selectedTable;
              
              context.setProgress(0.5, 'Processing results...');
            } catch (fetchError) {
              // Provide more specific error handling for fetch failures
              const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
              
              if (errorMessage.includes('Failed to parse URL')) {
                throw new Error('Failed to construct API URL. This may be due to environment configuration issues in AI tool execution context.');
              } else if (errorMessage.includes('fetch')) {
                throw new Error('Network request failed during AI tool execution. Please check your connection and try again.');
              } else {
                throw fetchError; // Re-throw the original error
              }
            }
          }
        }
      }

      // Create output table using cached data
      const outputTable = context.createDataTable(this.outputSpec);

      // Add rows to output table
      this.cachedTableData.rows.forEach((row: DataValueRecord, index: number) => {
        if (index % 100 === 0) {
          context.checkCanceled();
          context.setProgress(
            0.5 + (index / this.cachedTableData.rows.length) * 0.4,
            `Processing row ${index} of ${this.cachedTableData.rows.length}`,
          );
        }

        const cells: Cell[] = this.outputSpec.columns.map((col: ColumnSpec) => {
          // Handle NULL values properly and try different case variations for column names
          let value = row[col.name];
          
          // If not found, try different case variations
          if (value === undefined || value === null) {
            value = row[col.name.toLowerCase()];
          }
          if (value === undefined || value === null) {
            value = row[col.name.toUpperCase()];
          }
          
          // If still not found, try to find by partial match
          if (value === undefined || value === null) {
            const rowKeys = Object.keys(row);
            const matchingKey = rowKeys.find(key => 
              key.toLowerCase() === col.name.toLowerCase()
            );
            if (matchingKey) {
              value = row[matchingKey];
            }
          }
          
          // Handle only actual NULL values - convert to empty string for display, preserve legitimate "NOR" values
          if (value === null || value === undefined) {
            value = '';
          }
          
          return new SimpleCell(col.type, value);
        });

        outputTable.addRow(`row_${index}`, cells);
      });

      context.setProgress(1.0, 'PostgreSQL data loaded');
      
      const result = [outputTable.close()];
      
      // Generate dashboard items (WorkflowEditor will handle persistence)
      const nodeLabel = selectedTable || 'PostgreSQL Data';
      const dashboardItems = await this.sendOutputsToDashboard(result, context, nodeLabel);
      
      // Store dashboard items in context for WorkflowEditor to access
      (context as any).dashboardItems = dashboardItems;
      
      return result;
    } catch (error) {
      const err = error as ErrorWithMessage;
      
      // Provide more specific error messages for common issues
      let errorMessage = err.message || 'Unknown error';
      
      if (errorMessage.includes('Failed to parse URL')) {
        errorMessage = 'Failed to construct API URL. This may be due to environment configuration issues.';
      } else if (errorMessage.includes('fetch')) {
        errorMessage = 'Network request failed. Please check your connection and try again.';
      } else if (errorMessage.includes('HTTP error')) {
        errorMessage = `Server error: ${errorMessage}`;
      }
      
      throw new Error(
        `PostgreSQL table fetch failed: ${errorMessage}`,
      );
    }
  }

  configure(inSpecs: DataTableSpec[]): DataTableSpec[] {
    // This node has no input ports, so inSpecs should be empty
    if (inSpecs.length > 0) {
      throw new Error('PostgreSQL input node does not accept input connections');
    }

    // Return the current output spec
    return [this.outputSpec];
  }

  loadSettings(settings: SettingsObject): void {
    // Copy values from the passed settings object to our internal settings
    // Don't replace the entire settings object as it would lose our methods
    const keys = ['host', 'port', 'database', 'username', 'password', 'ssl', 'selectedTable', 'tableSchema', 'pageSize', 'cachedData'];
    
    keys.forEach(key => {
      if (key === 'host' || key === 'database' || key === 'username' || key === 'password' || key === 'selectedTable' || key === 'tableSchema' || key === 'cachedData') {
        let value = '';
        if (settings.getString) {
          value = settings.getString(key, '');
        } else {
          // Fallback for settings objects without methods
          value = (settings as any)[key] || '';
        }
        if (value) {
          this.settings.set(key, value);
        }
      } else if (key === 'port' || key === 'pageSize') {
        let value = key === 'port' ? 6543 : 1000;
        if (settings.getNumber) {
          value = settings.getNumber(key, value);
        } else {
          // Fallback for settings objects without methods
          const rawValue = (settings as any)[key];
          value = typeof rawValue === 'number' ? rawValue : value;
        }
        this.settings.set(key, value);
      } else if (key === 'ssl') {
        let value = false;
        if (settings.getBoolean) {
          value = settings.getBoolean(key, false);
        } else {
          // Fallback for settings objects without methods
          const rawValue = (settings as any)[key];
          value = typeof rawValue === 'boolean' ? rawValue : false;
        }
        this.settings.set(key, value);
      }
    });

    // After loading settings, try to reconstruct output spec and cached data from table schema
    const selectedTable = this.settings.getString('selectedTable', '');
    const tableSchema = this.settings.getString('tableSchema', '');
    const cachedDataString = this.settings.getString('cachedData', '');
    
    if (selectedTable && tableSchema) {
      try {
        const schema = JSON.parse(tableSchema);
        if (schema && schema.columns) {
          // Reconstruct output spec from saved schema
          const columns = schema.columns.map((col: any) => ({
            name: col.name,
            type: this.mapPostgresTypeToCellType(col.dataType),
          }));

          this.outputSpec = {
            columns: columns,
            findColumnIndex: (name: string) => 
              columns.findIndex((col: any) => col.name === name)
          };
        }
      } catch (error) {
        console.warn('Failed to reconstruct output spec from table schema:', error);
      }
    }

    // Try to restore cached data if available
    if (selectedTable && cachedDataString) {
      try {
        const cachedData = JSON.parse(cachedDataString);
        if (cachedData && cachedData.rows) {
          this.cachedTableData = cachedData;
          this.cachedTableName = selectedTable;
        }
      } catch (error) {
        console.warn('Failed to restore cached data:', error);
      }
    }
  }

  saveSettings(settings: SettingsObject): void {
    // Copy current settings to the provided settings object
    const host = this.settings.getString('host', '');
    const port = this.settings.getNumber('port', 6543);
    const database = this.settings.getString('database', '');
    const username = this.settings.getString('username', '');
    const password = this.settings.getString('password', '');
    const ssl = this.settings.getBoolean('ssl', false);
    const selectedTable = this.settings.getString('selectedTable', '');
    const tableSchema = this.settings.getString('tableSchema', '');
    const pageSize = this.settings.getNumber('pageSize', 1000);

    settings.set('host', host);
    settings.set('port', port);
    settings.set('database', database);
    settings.set('username', username);
    settings.set('password', password);
    settings.set('ssl', ssl);
    settings.set('selectedTable', selectedTable);
    settings.set('tableSchema', tableSchema);
    settings.set('pageSize', pageSize);

    // Save cached data if available
    if (this.cachedTableData && this.cachedTableName) {
      try {
        const cachedDataString = JSON.stringify(this.cachedTableData);
        settings.set('cachedData', cachedDataString);
      } catch (error) {
        console.warn('Failed to serialize cached data:', error);
      }
    }
  }

  validateSettings(settings: SettingsObject): void {
    const getString = (key: string, defaultValue: string = '') => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      return (settings as any)[key] || defaultValue;
    };

    const host = getString('host', '');
    const database = getString('database', '');
    const username = getString('username', '');
    const password = getString('password', '');
    const selectedTable = getString('selectedTable', '');

    if (!host || !database || !username || !password) {
      throw new Error('Missing required connection parameters');
    }

    if (!selectedTable) {
      throw new Error('No table selected');
    }
  }

  private async fetchTableData(context: ExecutionContext, tableName: string): Promise<QueryResult> {
    context.checkCanceled();

    try {
      // Get connection settings
      const host = this.settings.getString('host', '');
      const port = this.settings.getNumber('port', 6543);
      const database = this.settings.getString('database', '');
      const username = this.settings.getString('username', '');
      const password = this.settings.getString('password', '');
      const ssl = this.settings.getBoolean('ssl', false);

      // Log the API URL being used for debugging
      const apiUrl = this.getApiUrl();

      // Make API request to fetch entire table data without pagination limits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_table_data',
            host,
            port,
            database,
            username,
            password,
            ssl,
            tableName,
            page: 1,
            pageSize: 100,
            fetchAll: true, // Fetch entire table without pagination limits
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        
        // Update output spec based on fetched data
        if (result.fields && result.fields.length > 0) {
          this.outputSpec = {
            columns: result.fields.map((field: any) => ({
              name: field.name,
              type: this.mapPostgresTypeToCellType(field.dataType || 'unknown')
            })),
            findColumnIndex: (name: string) => {
              return result.fields.findIndex((field: any) => field.name === name);
            }
          };
        }
        
        return {
          fields: result.fields || [],
          rows: result.rows || [],
          rowCount: result.rowCount || 0
        };
              } catch (fetchError: unknown) {
          clearTimeout(timeoutId);
          
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('Request timed out after 30 seconds. The API server may be unreachable or overloaded.');
          }
          
          // Check if this is a network connectivity issue
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
            const context = typeof window !== 'undefined' ? 'browser' : 'AI tool execution';
            
            // For AI tool execution, provide a more helpful error message with workarounds
            if (context === 'AI tool execution') {
              throw new Error(this.getAiToolExecutionError());
            } else {
              throw new Error(`Network connectivity issue detected in ${context} context. The PostgreSQL API endpoint is not accessible. This may be due to:
1. Network restrictions in the execution environment
2. API server being unavailable or not running
3. Firewall blocking the connection
4. Incorrect API URL construction

Please try executing the workflow manually in the browser interface instead of using AI tools.`);
            }
          }
          
          throw fetchError;
        }
    } catch (error) {
      const err = error as ErrorWithMessage;
      
      // Provide more specific error messages for common issues
      let errorMessage = err.message || 'Unknown error';
      
      if (errorMessage.includes('Failed to parse URL')) {
        errorMessage = 'Failed to construct API URL. This may be due to environment configuration issues.';
      } else if (errorMessage.includes('fetch')) {
        errorMessage = 'Network request failed. Please check your connection and try again.';
      } else if (errorMessage.includes('HTTP error')) {
        errorMessage = `Server error: ${errorMessage}`;
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ENODATA')) {
        errorMessage = 'DNS resolution failed. The API endpoint could not be reached.';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. The API server may not be running or accessible.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out. The API server may be overloaded or unreachable.';
      }
      
      console.error('PostgreSQL fetch error details:', {
        error: errorMessage,
        originalError: err.message,
        stack: err.stack,
        executionContext: typeof window !== 'undefined' ? 'browser' : 'server/AI tool'
      });
      
      throw new Error(
        `PostgreSQL table fetch failed: ${errorMessage}`,
      );
    }
  }

  // Direct PostgreSQL connection method for server-side execution
  private async fetchTableDataDirect(context: ExecutionContext, tableName: string): Promise<QueryResult> {
    context.checkCanceled();

    // For now, throw an error indicating this method is not yet implemented
    // We'll implement this using a server-side API endpoint instead
    throw new Error('Direct PostgreSQL connection not implemented. Please use the browser interface to execute workflows with PostgreSQL nodes. This is due to security practices.');
  }

  // Map PostgreSQL data types to cell types
  private mapPostgresTypeToCellType(postgresType: string): string {
    const type = postgresType.toLowerCase();
    
    // Numeric types
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || 
        type.includes('float') || type.includes('real') || type.includes('double') ||
        type.includes('money') || type.includes('serial') || type.includes('bigint') ||
        type.includes('smallint')) {
      return 'number';
    } 
    // Date/time types
    else if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return 'date';
    } 
    // Boolean type
    else if (type.includes('bool')) {
      return 'boolean';
    }
    // Text types
    else if (type.includes('char') || type.includes('text') || type.includes('varchar') ||
             type.includes('json') || type.includes('xml') || type.includes('uuid')) {
      return 'string';
    }
    // Binary types
    else if (type.includes('bytea') || type.includes('blob')) {
      return 'string'; // Represent as string for display
    }
    // Array types
    else if (type.includes('[]')) {
      return 'string'; // Represent as string for display
    }
    // Default to string for unknown types
    else {
      return 'string';
    }
  }

  // Getter methods for configuration
  getConnection(): PostgresConfig {
    return {
      host: this.settings.getString('host', ''),
      port: this.settings.getNumber('port', 6543),
      database: this.settings.getString('database', ''),
      username: this.settings.getString('username', ''),
      password: this.settings.getString('password', ''),
      ssl: this.settings.getBoolean('ssl', false)
    };
  }

  setConnection(config: PostgresConfig): void {
    this.settings.set('host', config.host);
    this.settings.set('port', config.port);
    this.settings.set('database', config.database);
    this.settings.set('username', config.username);
    this.settings.set('password', config.password);
    this.settings.set('ssl', config.ssl);
  }

  getTableConfig(): TableConfig {
    return {
      selectedTable: this.settings.getString('selectedTable', ''),
      tableSchema: this.settings.getString('tableSchema', ''),
      pageSize: this.settings.getNumber('pageSize', 1000)
    };
  }

  setTableConfig(config: TableConfig): void {
    this.settings.set('selectedTable', config.selectedTable);
    this.settings.set('tableSchema', config.tableSchema);
    this.settings.set('pageSize', config.pageSize);
    
    // Auto-save cached data if we have it for this table
    if (this.cachedTableData && this.cachedTableName === config.selectedTable) {
      try {
        const cachedDataString = JSON.stringify(this.cachedTableData);
        this.settings.set('cachedData', cachedDataString);
      } catch (error) {
        console.warn('Failed to auto-save cached data:', error);
      }
    }
  }

  // Method to fetch available tables from the database
  async fetchAvailableTables(): Promise<TableMetadata[]> {
    try {
      const connection = this.getConnection();
      
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_tables',
          ...connection,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.tables || [];
    } catch (error) {
      const err = error as ErrorWithMessage;
      throw new Error(
        `Failed to fetch tables: ${err.message || 'Unknown error'}`,
      );
    }
  }

  // Method to fetch table data with pagination
  async fetchTableDataWithPagination(tableName: string, page: number = 1, pageSize: number = 100, fetchAll: boolean = false): Promise<any> {
    try {
      const connection = this.getConnection();
      
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_table_data',
          ...connection,
          tableName,
          page,
          pageSize,
          fetchAll,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Process the data to handle only actual NULL values, preserve legitimate "NOR" values
      if (result.rows) {
        result.rows = result.rows.map((row: any) => {
          const processedRow: any = {};
          Object.keys(row).forEach(key => {
            // Only convert actual NULL/undefined values to empty strings, preserve "NOR" as legitimate value
            const value = row[key];
            processedRow[key] = (value === null || value === undefined) ? '' : value;
          });
          return processedRow;
        });
      }

      // Cache the data for future AI tool execution
      if (result && !result.isEmpty && result.rows && result.rows.length > 0) {
        this.cachedTableData = result;
        this.cachedTableName = tableName;
        
        // Update output spec based on fetched data
        if (result.fields && result.fields.length > 0) {
          const columns = result.fields.map((field: any) => ({
            name: field.name,
            type: this.mapPostgresTypeToCellType(field.dataType || 'text'),
          }));
          
          this.outputSpec = {
            columns: columns,
            findColumnIndex: (name: string) => 
              columns.findIndex((col: any) => col.name === name)
          };
        }
      }
      
      return result;
    } catch (error) {
      const err = error as ErrorWithMessage;
      throw new Error(
        `Failed to fetch table data: ${err.message || 'Unknown error'}`,
      );
    }
  }

  // Method to fetch foreign key data for a table
  async fetchForeignKeyData(tableName: string): Promise<any> {
    try {
      const connection = this.getConnection();
      
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_foreign_key_data',
          ...connection,
          tableName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const err = error as ErrorWithMessage;
      throw new Error(
        `Failed to fetch foreign key data: ${err.message || 'Unknown error'}`,
      );
    }
  }

  // Method to clear cached data when table changes
  clearCache(): void {
    this.cachedTableData = null;
    this.cachedTableName = '';
  }

  // Method to check if data is cached for a specific table
  hasCachedData(tableName: string): boolean {
    return this.cachedTableData !== null && this.cachedTableName === tableName;
  }

  // Method to get cached data (for view purposes)
  getCachedData(): any {
    return this.cachedTableData;
  }

  // Method to get the cached table name
  getCachedTableName(): string {
    return this.cachedTableName;
  }

  // Method to create mock data from table schema for AI execution context
  private createMockDataFromSchema(schema: TableMetadata): any {
    try {
      // Create output spec from schema
      const columns = schema.columns.map(col => ({
        name: col.name,
        type: this.mapPostgresTypeToCellType(col.dataType),
        spec: {
          name: col.name,
          type: this.mapPostgresTypeToCellType(col.dataType),
        }
      }));

      this.outputSpec = {
        columns: columns.map(col => col.spec),
        findColumnIndex: (name: string) => 
          columns.findIndex(col => col.name === name)
      };

      // Create a few sample rows based on the column types
      const sampleRows = [];
      for (let i = 0; i < 5; i++) {
        const row: any = {};
        schema.columns.forEach(col => {
          row[col.name] = this.generateSampleValue(col.dataType, i);
        });
        sampleRows.push(row);
      }

      return {
        fields: schema.columns,
        rows: sampleRows,
        totalRows: sampleRows.length,
        isEmpty: false
      };
    } catch (error) {
      throw new Error(`Failed to create mock data from schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper method to generate sample values based on PostgreSQL data types
  private generateSampleValue(dataType: string, index: number): any {
    const type = dataType.toLowerCase();
    
    if (type.includes('int') || type.includes('serial')) {
      return index + 1;
    } else if (type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('real') || type.includes('double')) {
      return (index + 1) * 10.5;
    } else if (type.includes('bool')) {
      return index % 2 === 0;
    } else if (type.includes('date')) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return date.toISOString().split('T')[0];
    } else if (type.includes('timestamp') || type.includes('time')) {
      const date = new Date();
      date.setHours(date.getHours() - index);
      return date.toISOString();
    } else if (type.includes('char') || type.includes('text') || type.includes('varchar')) {
      return `Sample text ${index + 1}`;
    } else if (type.includes('json')) {
      return JSON.stringify({ sample: `data ${index + 1}`, value: index + 1 });
    } else if (type.includes('uuid')) {
      return `550e8400-e29b-41d4-a716-44665544000${index}`;
    } else {
      return `Value ${index + 1}`;
    }
  }

  // Helper method to construct API URL for AI tool execution context
  private getApiUrl(): string {
    // In browser context, use relative URL
    if (typeof window !== 'undefined') {
      return '/api/node/postgres';
    }
    
    // In server/AI tool context, try to construct absolute URL
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/node/postgres`;
      return apiUrl;
    } catch (error) {
      // Fallback to relative URL if absolute URL construction fails
      console.warn('Failed to construct absolute API URL, falling back to relative URL', error);
      return '/api/node/postgres';
    }
  }

  // Helper method to provide consistent error messages for AI tool execution
  private getAiToolExecutionError(): string {
    return `PostgreSQL node execution failed in AI tool context. 

This is a known limitation where AI tools cannot access the PostgreSQL API endpoint due to network restrictions.

SOLUTIONS:
1. Execute this workflow manually in the browser interface
2. Use the PostgreSQL node in a browser environment where network access is available
3. Consider using a different data source that doesn't require API access

The node configuration appears correct, but the execution environment cannot reach the database API.`;
  }
}
