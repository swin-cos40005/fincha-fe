import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartDashboardItem, DashboardItem, StatisticsDashboardItem, TableDashboardItem } from "@/lib/dashboard/utils";
import { ChartBarIcon, TableIcon, FullscreenIcon } from "@/components/icons";
import { StatisticItem } from './statistic-item';
import { UnifiedChartRenderer } from "@/lib/chart/UnifiedChartRenderer";
import { DataTable } from "@/components/ui/data-table";

// Dashboard Item Card Component
export function DashboardItemCard({
    item,
    onToggleFullScreen,
    onRemove,
    onDownloadCSV,
  }: {
    item: DashboardItem;
    onToggleFullScreen: () => void;
    onRemove?: () => void;
    onDownloadCSV: () => void;
  }) {
    const getIcon = () => {
      switch (item.type) {
        case 'chart':
          return <ChartBarIcon size={16} />;
        case 'table':
          return <TableIcon size={16} />;
        case 'statistics':
          return <ChartBarIcon size={16} />;
      }
    };
  
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getIcon()}
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </div>
              {item.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{item.type}</Badge>
                <Badge variant="secondary">node: {item.nodeName}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadCSV}
                className="p-2"
                title="Download CSV"
              >
                📥
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullScreen}
                className="p-2"
              >
                <FullscreenIcon size={16} />
              </Button>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="p-2 text-destructive"
                  title="Remove"
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
  
        <CardContent className="flex-1 flex flex-col">
          <DashboardItemContent item={item} />
          
          {/* Metadata */}
          {item.metadata && (
            <div className="text-xs text-muted-foreground mt-2">
              {item.metadata.totalRows !== undefined && (
                <span>{item.metadata.totalRows} rows</span>
              )}
              {item.metadata.totalColumns !== undefined && (
                <span> × {item.metadata.totalColumns} columns</span>
              )}
              {item.metadata.processedAt && (
                <span>
                  {' '}
                  | Updated:{' '}
                  {new Date(item.metadata.processedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
// Dashboard Item Content Component
export function DashboardItemContent({ item }: { item: DashboardItem }) {
    switch (item.type) {
      case 'chart': {
        const chartItem = item as ChartDashboardItem;
        return (
          <div
            className="size-full"
            data-chart-id={chartItem.id}
          >
            {chartItem.data && Array.isArray(chartItem.data) && chartItem.data.length > 0 ? (
              <UnifiedChartRenderer
                chartType={chartItem.chartType as any}
                data={chartItem.data}
                config={chartItem.config}
              />
            ) : (
              <div className="flex size-full items-center justify-center border border-dashed rounded">
                <div className="text-muted-foreground text-center">
                  <div>No data available</div>
                  <div className="text-xs mt-1">
                    Execute the node to populate chart data
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
  
      case 'table': {
        const tableItem = item as TableDashboardItem;
        return (
            <div className="border rounded" style={{ maxHeight: '400px' }}>
                <DataTable
                    columns={tableItem.columns}
                    rows={tableItem.rows}
                    rowsPerPage={10}
                    showPagination={false}
                    maxHeight="400px"
                />
            </div>
        );
      }
        case 'statistics': {
        return <StatisticItem statsItem={item as StatisticsDashboardItem} />;
      }
    }
  }
  
