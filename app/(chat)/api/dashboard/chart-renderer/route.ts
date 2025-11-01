import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dashboardItem, workflow } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Set up database client
const client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // First, try to find by dashboard item ID
    const items = await db
      .select()
      .from(dashboardItem)
      .where(eq(dashboardItem.id, itemId))
      .limit(1);

    if (items.length > 0) {
      const item = items[0];
      const itemData = item.data as any;

      // Verify this is a chart item
      if (item.type !== 'chart') {
        return NextResponse.json(
          { error: `Dashboard item ${itemId} is not a chart (type: ${item.type})` },
          { status: 400 }
        );
      }

      // Parse stored chart data
      let chartData;
      try {
        chartData = JSON.parse(itemData.dataSnapshot || '[]');
      } catch (error) {
        console.error('Failed to parse chart data:', error);
        return NextResponse.json(
          { error: 'Invalid chart data format' },
          { status: 400 }
        );
      }

      // Return chart configuration and data
      return NextResponse.json({
        success: true,
        chartId: itemId,
        title: item.title,
        description: item.description,
        chartType: itemData.chartType,
        config: itemData.config,
        data: chartData,
        metadata: itemData.metadata,
      });
    }

    // Dashboard item not found by ID, try to find by node ID
    const nodeItems = await db
      .select()
      .from(dashboardItem)
      .where(eq(dashboardItem.nodeId, itemId))
      .limit(1);

    if (nodeItems.length > 0) {
      const item = nodeItems[0];
      const itemData = item.data as any;

      // Verify this is a chart item
      if (item.type !== 'chart') {
        return NextResponse.json(
          { error: `Dashboard item with nodeId ${itemId} is not a chart (type: ${item.type})` },
          { status: 400 }
        );
      }

      // Parse stored chart data
      let chartData;
      try {
        chartData = JSON.parse(itemData.dataSnapshot || '[]');
      } catch (error) {
        console.error('Failed to parse chart data:', error);
        return NextResponse.json(
          { error: 'Invalid chart data format' },
          { status: 400 }
        );
      }

      // Return chart configuration and data
      return NextResponse.json({
        success: true,
        chartId: item.id, // Use the actual dashboard item ID
        title: item.title,
        description: item.description,
        chartType: itemData.chartType,
        config: itemData.config,
        data: chartData,
        metadata: {
          ...itemData.metadata,
          source: 'dashboard',
          nodeId: item.nodeId,
          dashboardItemId: item.id,
        },
      });
    }

    // Neither dashboard item ID nor node ID found
    return NextResponse.json(
      { error: `No dashboard item found with ID or nodeId: ${itemId}` },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error in chart renderer endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 