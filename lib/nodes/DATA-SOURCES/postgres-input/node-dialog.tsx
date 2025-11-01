"use client";

import React, { useState, useEffect, createElement } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { 
  PostgresIcon, 
  TableIcon, 
  EyeIcon,
} from '@/components/icons';
import { DatabaseIcon } from 'lucide-react';
import { NodeDialog } from '@/lib/nodes/core';
import type { DataTableSpec, SettingsObject } from '@/lib/nodes/core';
import type {
  PostgresInputNodeModel,
  PostgresConfig,
  TableConfig,
  TableMetadata,
} from './node-model';

interface PostgresInputNodeDialogProps {
  nodeModel: PostgresInputNodeModel;
  inputSpecs: DataTableSpec[];
  onSettingsChange: () => void;
}

export class PostgresInputNodeDialog extends NodeDialog {
  constructor(private nodeModel: PostgresInputNodeModel) {
    super();
  }

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): React.ReactElement {
    return createElement(PostgresDialogContent, {
      nodeModel: this.nodeModel,
      inputSpecs: _specs,
      onSettingsChange: () => this.saveSettings(settings),
    });
  }

  saveSettings(settings: SettingsObject): void {
    this.nodeModel.saveSettings(settings);
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.nodeModel.loadSettings(settings);
  }
}

export function PostgresDialogContent({
  nodeModel,
  onSettingsChange,
}: PostgresInputNodeDialogProps) {
  const [connection, setConnection] = useState<PostgresConfig>({
    host: 'localhost',
    port: 6543,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    selectedTable: '',
    tableSchema: '',
    pageSize: 1000,
  });
  const [connectionError, setConnectionError] = useState<string>('');
  const [tables, setTables] = useState<TableMetadata[]>([]);
  const [selectedTableData, setSelectedTableData] = useState<any>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingTableData, setIsLoadingTableData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      setConnection(nodeModel.getConnection());
      setTableConfig(nodeModel.getTableConfig());
    } catch (error) {
      console.error('Error loading node configuration:', error);
      setConnection({
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
        ssl: false,
      });
      setTableConfig({
        selectedTable: '',
        tableSchema: '',
        pageSize: 1000,
      });
    }
  }, [nodeModel]);

  const handleConnectionChange = (field: keyof PostgresConfig, value: any) => {
    const newConnection = { ...connection, [field]: value };
    setConnection(newConnection);
    setConnectionError('');
    
    if (field === 'host' && value.includes('supabase.co')) {
      const standardSupabasePattern = /^db\.[a-zA-Z0-9-]+\.supabase\.co$/;
      const poolerSupabasePattern = /^[a-zA-Z0-9-]+-[0-9]+-[a-zA-Z0-9-]+\.pooler\.supabase\.com$/;
      
      if (!standardSupabasePattern.test(value) && !poolerSupabasePattern.test(value)) {
        setConnectionError('Invalid Supabase hostname format. Should be: db.your-project-ref.supabase.co or region-pooler.supabase.com');
      }
    }
    
    nodeModel.setConnection(newConnection);
    onSettingsChange();
  };

  const handleTableConfigChange = (field: keyof TableConfig, value: any) => {
    const newTableConfig = { ...tableConfig, [field]: value };
    setTableConfig(newTableConfig);
    nodeModel.setTableConfig(newTableConfig);
    onSettingsChange();
  };

  const handleFetchTables = async () => {
    setIsLoadingTables(true);
    setTables([]);
    setSelectedTableData(null);
    setConnectionError('');

    try {
      const fetchedTables = await nodeModel.fetchAvailableTables();
      setTables(fetchedTables);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Failed to fetch tables',
      );
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleTableSelect = async (table: TableMetadata) => {
    setIsLoadingTableData(true);
    setCurrentPage(1);
    setConnectionError('');

    try {
      const newTableConfig = {
        ...tableConfig,
        selectedTable: table.name,
        tableSchema: JSON.stringify(table),
      };
      setTableConfig(newTableConfig);
      nodeModel.setTableConfig(newTableConfig);
      onSettingsChange();

      // Clear cache when selecting a new table
      nodeModel.clearCache();

      const tableData = await nodeModel.fetchTableDataWithPagination(
        table.name,
        1,
        Math.min(tableConfig.pageSize, 100)
      );
      setSelectedTableData(tableData);
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Failed to fetch table data',
      );
    } finally {
      setIsLoadingTableData(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!tableConfig.selectedTable) return;

    setIsLoadingTableData(true);
    setCurrentPage(page);
    setConnectionError('');

    try {
      const tableData = await nodeModel.fetchTableDataWithPagination(
        tableConfig.selectedTable,
        page,
        Math.min(tableConfig.pageSize, 100)
      );
      setSelectedTableData(tableData);
    } catch (error) {
      console.error('Failed to fetch table data:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Failed to fetch table data',
      );
    } finally {
      setIsLoadingTableData(false);
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-postgres text-white">
        <div className="flex items-center gap-3">
          <PostgresIcon size={24} />
          <div>
            <h3 className="text-lg font-semibold">PostgreSQL Configuration</h3>
            <p className="text-sm opacity-90">Connect to your database and select tables</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Database Connection Settings */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <DatabaseIcon size={16} />
              Database Connection
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                data-testid="host-input"
                value={connection.host}
                onChange={(e) => handleConnectionChange('host', e.target.value)}
                placeholder="db.your-project-ref.supabase.co"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                data-testid="port-input"
                type="number"
                value={connection.port}
                onChange={(e) => handleConnectionChange('port', Number.parseInt(e.target.value) || 6543)}
                placeholder="6543"
              />
            </div>
            <div>
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                data-testid="database-input"
                value={connection.database}
                onChange={(e) => handleConnectionChange('database', e.target.value)}
                placeholder="postgres"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                data-testid="username-input"
                value={connection.username}
                onChange={(e) => handleConnectionChange('username', e.target.value)}
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                data-testid="password-input"
                type="password"
                value={connection.password}
                onChange={(e) => handleConnectionChange('password', e.target.value)}
                placeholder="password"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Switch
              id="ssl"
              checked={connection.ssl}
              onCheckedChange={(checked) => handleConnectionChange('ssl', checked)}
            />
            <Label htmlFor="ssl">Enable SSL</Label>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleFetchTables}
              disabled={isLoadingTables || !connection.host || !connection.database || !connection.username || !connection.password}
              className="w-full"
            >
              {isLoadingTables ? 'Loading...' : 'Fetch Tables'}
            </Button>
          </div>

          {connectionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {connectionError}
            </div>
          )}
        </div>

        {/* Tables Section - Only show after successful fetch */}
        {tables.length > 0 && (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Table List */}
            <div className="w-1/3 border rounded-lg flex flex-col" data-testid="table-list">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Tables</h4>
                  <Badge variant="secondary">{tables.length}</Badge>
                </div>
                <Input
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {filteredTables.map((table) => {
                  // Count foreign key columns
                  const foreignKeyCount = table.columns.filter(col => 
                    col.dataType && col.dataType.toLowerCase().includes('int') && 
                    col.name.toLowerCase().includes('id')
                  ).length;
                  
                  return (
                    <button
                      key={table.name}
                      data-testid="table-item"
                      onClick={() => handleTableSelect(table)}
                      className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        tableConfig.selectedTable === table.name ? 'bg-blue-100 text-blue-800' : ''
                      }`}
                    >
                      <TableIcon size={14} />
                      <div className="flex-1">
                        <div className="font-medium">{table.name}</div>
                        <div className="text-xs text-gray-500">
                          {table.columns.length} columns
                          {foreignKeyCount > 0 && ` • ${foreignKeyCount} FK`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Preview */}
            <div className="flex-1 border rounded-lg flex flex-col" data-testid="table-preview">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <EyeIcon size={16} />
                    {tableConfig.selectedTable || 'Select a table'}
                  </h4>
                  {selectedTableData && (
                    <Badge variant="outline">{selectedTableData.totalRows} rows</Badge>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3">
                {!tableConfig.selectedTable ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a table to preview data
                  </div>
                ) : isLoadingTableData ? (
                  <div className="flex items-center justify-center h-full">
                    Loading table data...
                  </div>
                ) : selectedTableData ? (
                  selectedTableData.rows && selectedTableData.rows.length > 0 && !selectedTableData.isEmpty ? (
                    <DataTable
                      columns={selectedTableData.fields?.map((field: any) => ({
                        name: field.name,
                        type: field.dataType || 'unknown',
                        // Add indicator for foreign key columns
                        description: field.foreignKeyReference ? `FK: ${field.foreignKeyReference}` : undefined
                      })) || []}
                      rows={selectedTableData.rows?.map((row: any) => {
                        const convertedRow: { [key: string]: any } = {};
                        selectedTableData.fields?.forEach((field: any) => {
                          // Handle only actual NULL values properly - preserve legitimate "NOR" values
                          let value = row[field.name];
                          
                          // If not found, try different case variations
                          if (value === undefined || value === null) {
                            value = row[field.name.toLowerCase()];
                          }
                          if (value === undefined || value === null) {
                            value = row[field.name.toUpperCase()];
                          }
                          
                          // If still not found, try to find by partial match
                          if (value === undefined || value === null) {
                            const rowKeys = Object.keys(row);
                            const matchingKey = rowKeys.find(key => 
                              key.toLowerCase() === field.name.toLowerCase()
                            );
                            if (matchingKey) {
                              value = row[matchingKey];
                            }
                          }
                          
                          // Only convert actual NULL/undefined values to empty strings, preserve "NOR" as legitimate value
                          if (value === null || value === undefined) {
                            convertedRow[field.name] = '';
                          } else {
                            convertedRow[field.name] = value;
                          }
                        });
                        return convertedRow;
                      }) || []}
                      rowsPerPage={10}
                      emptyMessage="No data found"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-lg font-medium mb-2">No Data Found</div>
                        <div className="text-sm">This table is empty or contains no rows matching the current page.</div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Failed to load table data
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}