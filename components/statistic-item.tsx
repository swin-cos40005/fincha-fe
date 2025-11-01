import { StatisticsDashboardItem } from "@/lib/dashboard/utils";
import { formatValue } from "@/lib/utils";

export function StatisticItem({ statsItem }: { statsItem: StatisticsDashboardItem }) {
    return (
    <div className="space-y-4">
        {statsItem.summary && (
        <div className="text-sm font-medium">{statsItem.summary}</div>
        )}
        
        {Object.keys(statsItem.metrics).length > 0 && (
        <div>
            <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
            {Object.entries(statsItem.metrics).map(([key, value]) => (
                <div key={key} className="bg-muted/50 rounded p-2">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="font-medium">{formatValue(value)}</div>
                </div>
            ))}
            </div>
        </div>
        )}

        {Object.keys(statsItem.details).length > 0 && (
        <div>
            <h4 className="text-sm font-medium mb-2">Details</h4>
            <div className="space-y-1">
            {Object.entries(statsItem.details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{key}:</span>
                <span>{formatValue(value)}</span>
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    );
}