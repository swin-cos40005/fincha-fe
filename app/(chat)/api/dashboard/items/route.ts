import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveDashboardItem, getDashboardItems, deleteDashboardItem } from '@/lib/db/dashboard-operations';

export async function POST(req: NextRequest) {
  
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const { chatId, nodeId, item } = body;

    if (!chatId || !nodeId || !item) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId, nodeId, item' },
        { status: 400 }
      );
    }

    try {
      await saveDashboardItem(chatId, nodeId, item);
      return NextResponse.json({ success: true });
    } catch (saveError) {
      throw saveError;
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save dashboard item' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId parameter' },
        { status: 400 }
      );
    }
    const items = await getDashboardItems(chatId);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard items' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId parameter' },
        { status: 400 }
      );
    }

    await deleteDashboardItem(itemId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete dashboard item' },
      { status: 500 }
    );
  }
}
