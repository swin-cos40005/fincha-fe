import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dashboardItem, report } from './schema';
import { generateUUID } from '../utils';
import type { DashboardItem as DashboardItemType } from '../dashboard/utils';

const client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
const db = drizzle(client);

// Dashboard Item Operations
export async function saveDashboardItem(
  chatId: string,
  nodeId: string,
  item: DashboardItemType
): Promise<void> {
  try {
    const processedData = processDashboardItemData(item);
    
    const now = new Date();
    
    // Upsert logic: replace existing item with same chatId + nodeId + type
    const result = await db
      .insert(dashboardItem)
      .values({
        id: item.id,
        chatId,
        nodeId,
        type: item.type,
        title: item.title,
        description: item.description || null,
        data: processedData,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: dashboardItem.id,
        set: {
          title: item.title,
          description: item.description || null,
          data: processedData,
          updatedAt: now,
        },
      });

  } catch (error) {
    console.error('❌ [DB] Error in saveDashboardItem:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      itemId: item.id,
      chatId,
      nodeId,
    });
    throw error;
  }
}

export async function getDashboardItems(chatId: string): Promise<any[]> {
  const items = await db
    .select()
    .from(dashboardItem)
    .where(eq(dashboardItem.chatId, chatId))
    .orderBy(desc(dashboardItem.updatedAt));
    
  return items;
}

export async function deleteDashboardItem(itemId: string): Promise<void> {
  await db.delete(dashboardItem).where(eq(dashboardItem.id, itemId));
}

// Report Operations
export async function saveReport(
  chatId: string,
  title: string,
  content: string,
  userType: 'business' | 'technical' = 'business'
): Promise<string> {
  const reportId = generateUUID();
  const now = new Date();
  
  await db.insert(report).values({
    id: reportId,
    chatId,
    title,
    content,
    userType,
    createdAt: now,
    updatedAt: now,
  });
  
  return reportId;
}

export async function getReports(chatId: string): Promise<any[]> {
  const reports = await db
    .select()
    .from(report)
    .where(eq(report.chatId, chatId))
    .orderBy(desc(report.createdAt));
    
  return reports;
}

export async function deleteReport(reportId: string): Promise<void> {
  await db.delete(report).where(eq(report.id, reportId));
}

export async function getReport(reportId: string): Promise<any | null> {
  const reports = await db
    .select()
    .from(report)
    .where(eq(report.id, reportId))
    .limit(1);
    
  return reports[0] || null;
}

// Process dashboard item data according to storage rules
function processDashboardItemData(item: DashboardItemType): any {
  switch (item.type) {
    case 'table': {
      const tableItem = item as any;
      // Store only first 5 rows + column headers
      const limitedRows = tableItem.rows ? tableItem.rows.slice(0, 5) : [];
      return {
        columns: tableItem.columns || [],
        rows: limitedRows,
        totalRows: tableItem.rows?.length || 0,
        statistics: tableItem.statistics || [],
      };
    }

    case 'statistics': {
      const statsItem = item as any;
      // Store as metric-value pairs
      return {
        summary: statsItem.summary || '',
        metrics: statsItem.metrics || {},
        details: statsItem.details || {},
      };
    }

    case 'chart': {
      const chartItem = item as any;
      // Store as string representation (for future image conversion)
      return {
        chartType: chartItem.chartType || 'unknown',
        config: chartItem.config || {},
        dataSnapshot: JSON.stringify(chartItem.data || []),
        metadata: chartItem.metadata || {},
      };
    }

    default:
      return item;
  }
}
