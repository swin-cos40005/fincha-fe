"use client"

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartBarIcon, TableIcon } from '@/components/icons';
import { UnifiedChartRenderer } from '@/lib/chart/UnifiedChartRenderer';
import type { DashboardItem, ChartDashboardItem, TableDashboardItem, StatisticsDashboardItem } from '@/lib/dashboard/utils';
import { convertDashboardItemToCSV } from '@/lib/dashboard/utils';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChartType, ChartConfig } from '@/lib/chart/types';
import { UnifiedChartConfig } from '@/lib/chart/UnifiedChartConfig';
import { DashboardItemCard, DashboardItemContent } from './dashboard-item-card';

interface UnifiedDashboardProps {
  dashboardItems: DashboardItem[];
  onUpdateItem?: (itemId: string, updates: Partial<DashboardItem>) => void;
  onRemoveItem?: (itemId: string) => void;
}

export function UnifiedDashboard({
  dashboardItems,
  onUpdateItem,
  onRemoveItem,
}: UnifiedDashboardProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Group items by type
  const uniqueItems = useMemo(() => {
    const map = new Map<string, DashboardItem>();
    dashboardItems.forEach((item) => {
      // Build a stable key so that subsequent executions from the same node replace the old item
      const key =
        item.type === 'chart'
          ? `${item.nodeId}-chart-${(item as ChartDashboardItem).chartType}`
          : `${item.nodeId}-${item.type}`;
      map.set(key, item); // keep the latest occurrence for this key
    });
    return Array.from(map.values());
  }, [dashboardItems]);

  // Use the deduplicated list for subsequent processing
  const chartItems = uniqueItems.filter(item => item.type === 'chart') as ChartDashboardItem[];
  const tableItems = uniqueItems.filter(item => item.type === 'table') as TableDashboardItem[];
  const statsItems = uniqueItems.filter(item => item.type === 'statistics') as StatisticsDashboardItem[];

  // Toggle item full screen
  const toggleFullScreen = (itemId: string) => {
    setExpandedItem((prev) => (prev === itemId ? null : itemId));
  };

  // Download CSV
  const downloadCSV = (item: DashboardItem) => {
    const csv = convertDashboardItemToCSV(item);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  if (expandedItem) {
    const item = uniqueItems.find((i) => i.id === expandedItem);
    if (item) {
      if (item.type === 'chart') {
        return (
          <FullScreenChartItemView
            item={item as ChartDashboardItem}
            onClose={() => setExpandedItem(null)}
            onUpdate={(updates) => onUpdateItem?.(item.id, updates)}
            onDownloadCSV={() => downloadCSV(item)}
          />
        );
      }

      return (
        <FullScreenGenericItemView
          item={item}
          onClose={() => setExpandedItem(null)}
          onUpdate={(updates) => onUpdateItem?.(item.id, updates)}
          onDownloadCSV={() => downloadCSV(item)}
        />
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Node Output Dashboard</h1>
          <div className="text-muted-foreground">
            Visualizations and data from workflow nodes ({uniqueItems.length} item{uniqueItems.length !== 1 ? 's' : ''})
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <ChartBarIcon size={12} />
            {chartItems.length} charts
          </Badge>
          <Badge variant="secondary">
            <TableIcon size={12} />
            {tableItems.length} tables
          </Badge>
          <Badge variant="secondary">
            <ChartBarIcon size={12} />
            {statsItems.length} statistics
          </Badge>
        </div>
      </div>

      {/* Dashboard Content */}
      {uniqueItems.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({uniqueItems.length})</TabsTrigger>
            <TabsTrigger value="charts">Charts ({chartItems.length})</TabsTrigger>
            <TabsTrigger value="tables">Tables ({tableItems.length})</TabsTrigger>
            <TabsTrigger value="statistics">Statistics ({statsItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {uniqueItems.map((item) => (
                <DashboardItemCard
                  key={item.id}
                  item={item}
                  onToggleFullScreen={() => toggleFullScreen(item.id)}
                  onRemove={() => onRemoveItem?.(item.id)}
                  onDownloadCSV={() => downloadCSV(item)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chartItems.map((item) => (
                <DashboardItemCard
                  key={item.id}
                  item={item}
                  onToggleFullScreen={() => toggleFullScreen(item.id)}
                  onRemove={() => onRemoveItem?.(item.id)}
                  onDownloadCSV={() => downloadCSV(item)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              {tableItems.map((item) => (
                <DashboardItemCard
                  key={item.id}
                  item={item}
                  onToggleFullScreen={() => toggleFullScreen(item.id)}
                  onRemove={() => onRemoveItem?.(item.id)}
                  onDownloadCSV={() => downloadCSV(item)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {statsItems.map((item) => (
                <DashboardItemCard
                  key={item.id}
                  item={item}
                  onToggleFullScreen={() => toggleFullScreen(item.id)}
                  onRemove={() => onRemoveItem?.(item.id)}
                  onDownloadCSV={() => downloadCSV(item)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="text-muted-foreground">No dashboard items available yet.</div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              📊 Execute workflow nodes to see their outputs here.
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3 max-w-md mx-auto">
              💡 Tip: Nodes can output charts, data tables, or statistics that will appear in this dashboard.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Full Screen Generic Item View
function FullScreenGenericItemView({
  item,
  onClose,
  onUpdate: _onUpdate,
  onDownloadCSV,
}: {
  item: DashboardItem;
  onClose: () => void;
  onUpdate: (updates: Partial<DashboardItem>) => void;
  onDownloadCSV: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-muted-foreground">{item.description}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {item.type} from node {item.nodeName}
              {item.metadata && (
                <span>
                  {' '}
                  | {item.metadata.totalRows || 0} rows
                  {item.metadata.totalColumns && (
                    <span> × {item.metadata.totalColumns} columns</span>
                  )}
                  {item.metadata.processedAt && (
                    <span>
                      {' '}
                      | Updated:{' '}
                      {new Date(item.metadata.processedAt).toLocaleTimeString()}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDownloadCSV}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <DashboardItemContent item={item} />
        </ScrollArea>
      </div>
    </div>
  );
}

// Full Screen Chart Item View
function FullScreenChartItemView({
  item,
  onClose,
  onUpdate,
  onDownloadCSV,
}: {
  item: ChartDashboardItem;
  onClose: () => void;
  onUpdate: (updates: Partial<ChartDashboardItem>) => void;
  onDownloadCSV: () => void;
}) {
  const [activePanel, setActivePanel] = useState<'config' | 'data'>('config');

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <p className="text-muted-foreground">{item.description}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {item.chartType} from node {item.nodeName}
              {item.metadata && (
                <span>
                  {' '}| {item.metadata.totalRows || 0} rows
                  {item.metadata.totalColumns && (
                    <span> × {item.metadata.totalColumns} columns</span>
                  )}
                  {item.metadata.processedAt && (
                    <span>
                      {' '}| Updated:{' '}
                      {new Date(item.metadata.processedAt).toLocaleTimeString()}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDownloadCSV}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-auto">
          {/* Chart Display */}
          <div className="flex-1 p-6 overflow-y-auto">
            {item.data && Array.isArray(item.data) && item.data.length > 0 ? (
              <div 
                className="size-full"
                data-chart-id={`fullscreen-${item.id}`}
              >
                <UnifiedChartRenderer
                  chartType={item.chartType as ChartType}
                  data={item.data}
                  config={item.config}
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center border border-dashed rounded mb-6"
                style={{ height: '400px' }}
              >
                <div className="text-muted-foreground text-center">
                  <div>No data available for this chart</div>
                  <div className="text-xs mt-1">Execute the node to populate chart data</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side Panel */}
          <div className="w-80 border-l bg-muted overflow-auto flex flex-col">
            <Tabs
              value={activePanel}
              onValueChange={(v) => setActivePanel(v as 'config' | 'data')}
              className="flex flex-col h-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="flex-1 overflow-auto">
                <ScrollArea className="h-full p-4">
                  <ChartItemConfigPanel item={item} onChange={onUpdate} />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="data" className="flex-1 overflow-auto">
                <ScrollArea className="h-full p-4">
                  <ChartDataPanel item={item} />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chart configuration panel
function ChartItemConfigPanel({
  item,
  onChange,
}: {
  item: ChartDashboardItem;
  onChange: (updates: Partial<ChartDashboardItem>) => void;
}) {
  const [localConfig, setLocalConfig] = useState<ChartConfig>(item.config);

  const updateConfig = (updates: Partial<ChartConfig>) => {
    const newConfig = { ...localConfig, ...updates } as ChartConfig;
    setLocalConfig(newConfig);
    onChange({ config: newConfig });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chart Configuration</h3>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="chart-title">Title</Label>
        <Input
          id="chart-title"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="chart-description">Description</Label>
        <Input
          id="chart-description"
          value={item.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      {/* Color Scheme */}
      <div className="space-y-2">
        <Label htmlFor="colorScheme">Color Scheme</Label>
        <Select
          value={
            typeof localConfig.colors === 'object' &&
            !Array.isArray(localConfig.colors) &&
            (localConfig.colors as any)?.scheme
              ? (localConfig.colors as any).scheme
              : 'nivo'
          }
          onValueChange={(value) =>
            updateConfig({
              colors: { scheme: value as any },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nivo">Nivo</SelectItem>
            <SelectItem value="category10">Category 10</SelectItem>
            <SelectItem value="accent">Accent</SelectItem>
            <SelectItem value="dark2">Dark 2</SelectItem>
            <SelectItem value="paired">Paired</SelectItem>
            <SelectItem value="pastel1">Pastel 1</SelectItem>
            <SelectItem value="pastel2">Pastel 2</SelectItem>
            <SelectItem value="set1">Set 1</SelectItem>
            <SelectItem value="set2">Set 2</SelectItem>
            <SelectItem value="set3">Set 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unified chart-specific config */}
      <UnifiedChartConfig
        chartType={item.chartType as ChartType}
        config={localConfig}
        onChange={updateConfig}
      />
    </div>
  );
}

// Data panel for chart
function ChartDataPanel({ item }: { item: ChartDashboardItem }) {
  const [searchTerm, setSearchTerm] = useState('');
  const csvData = convertChartDataToCsv(item.data || []);
  const lines = csvData.split('\n').filter((ln) => ln.trim());
  const headers = lines[0]?.split(',') || [];
  const dataRows = lines.slice(1);

  const filteredRows = searchTerm
    ? dataRows.filter((row) => row.toLowerCase().includes(searchTerm.toLowerCase()))
    : dataRows;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Chart Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {dataRows.length} rows × {headers.length} columns
        </p>
        <Input
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
      </div>

      <Card>
        <div className="bg-muted/50 border-b overflow-x-auto">
          <div className="flex min-w-max">
            {headers.map((header) => (
              <div
                key={`header-${header}`}
                className="px-3 py-2 text-xs font-medium text-muted-foreground border-r last:border-r-0 min-w-24"
              >
                {header.replace(/"/g, '')}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {filteredRows.slice(0, 100).map((row, rowIndex) => {
            const cells = row.split(',');
            return (
              <div
                key={`row-${cells.join('-')}`}
                className="flex min-w-max border-b last:border-b-0 hover:bg-muted/30"
              >
                {cells.map((cell) => (
                  <div
                    key={`cell-${rowIndex}-${cell}`}
                    className="px-3 py-2 text-xs border-r last:border-r-0 min-w-24"
                    title={cell.replace(/"/g, '')}
                  >
                    <div className="truncate">{cell.replace(/"/g, '')}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </ScrollArea>

        {filteredRows.length > 100 && (
          <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
            Showing first 100 rows of {filteredRows.length} filtered results
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(csvData);
            toast.success('CSV data copied to clipboard');
          }}
        >
          Copy CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.title.replace(/\s+/g, '_')}_chart_data.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download CSV
        </Button>
      </div>
    </div>
  );
}

// Helper to convert chart data to CSV (same logic as Node dashboard util)
function convertChartDataToCsv(data: any[]): string {
  if (!data || !Array.isArray(data) || data.length === 0) return '';

  // scatter/line series format
  if (
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'id' in data[0] &&
    'data' in data[0]
  ) {
    const flattened: any[] = [];
    data.forEach((series: any) => {
      if (Array.isArray(series.data)) {
        series.data.forEach((pt: any) => {
          flattened.push({ series: series.id, ...pt });
        });
      }
    });
    if (flattened.length === 0) return '';
    const headers = Object.keys(flattened[0]);
    const csvRows = flattened.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"')))
            return `"${val.replace(/"/g, '""')}"`;
          return val;
        })
        .join(',')
    );
    return [headers.join(','), ...csvRows].join('\n');
  }

  // flat data
  const headers = Object.keys(data[0]);
  const csvRows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"')))
          return `"${val.replace(/"/g, '""')}"`;
        return val;
      })
      .join(',')
  );
  return [headers.join(','), ...csvRows].join('\n');
} 