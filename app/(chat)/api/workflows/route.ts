import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';
import {
  getWorkflowsByUserId,
  getWorkflowById,
  upsertWorkflowByConversationId,
  ensureChatAndWorkflowExist,
} from '@/lib/db/queries';

// GET /api/workflows - Get workflows for current user
// GET /api/workflows?conversationId=xxx - Get workflow for specific conversation
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    if (conversationId) {
      const workflow = await getWorkflowById({
        chatId: conversationId,
      });
      return NextResponse.json({ workflow });
    }

    const workflows = await getWorkflowsByUserId({ userId: session.user.id });
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Failed to get workflows:', error);
    return NextResponse.json(
      { error: 'Failed to get workflows' },
      { status: 500 },
    );
  }
}

// POST /api/workflows - Create/save a workflow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { title, content, conversationId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 },
      );
    }

    let actualConversationId = conversationId;
    if (!conversationId) {
      // No conversationId provided - create a new chat and workflow
      actualConversationId = generateUUID();

      // Create new chat for this workflow
      await ensureChatAndWorkflowExist({
        chatId: actualConversationId,
        userId: session.user.id,
        title: title.replace(' Workflow', ''), // Remove ' Workflow' if it exists to avoid duplication
      });
    } else {
      // ConversationId provided - ensure chat and workflow exist
      await ensureChatAndWorkflowExist({
        chatId: conversationId,
        userId: session.user.id,
        title: title.replace(' Workflow', ''), // Remove ' Workflow' if it exists to avoid duplication
      });
    }
    // Use upsert for conversation-based workflows
    const workflow = await upsertWorkflowByConversationId({
      title,
      content,
      conversationId: actualConversationId,
    });

    return NextResponse.json({
      workflow,
      conversationId: actualConversationId,
    });
  } catch (error) {
    console.error('Failed to save workflow:', error);
    return NextResponse.json(
      { error: 'Failed to save workflow' },
      { status: 500 },
    );
  }
}
