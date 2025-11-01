import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getChatById,
  getMessagesByChatId,
  saveMessages,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';

// Extract chatId from referer URL (e.g., /chat/[id])
function extractChatIdFromReferer(request: Request): string | null {
  const referer = request.headers.get('referer');
  if (!referer) return null;

  const url = new URL(referer);
  const pathSegments = url.pathname.split('/');

  // Handle both /chat/[id] and root page paths
  if (pathSegments.length >= 3 && pathSegments[1] === 'chat') {
    return pathSegments[2];
  }

  return null;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    // Extract chatId from referer header
    const chatId = extractChatIdFromReferer(request);

    if (!chatId) {
      // Return empty list if no chat context (e.g., on homepage)
      return NextResponse.json([]);
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      return NextResponse.json([]);
    }

    // Check if user has access to this chat
    if (chat.visibility === 'private' && chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // Get all messages for this chat
    const messages = await getMessagesByChatId({ id: chatId });

    // Extract CSV files from message attachments
    const csvFiles: Array<{
      url: string;
      originalName: string;
      displayName: string;
    }> = [];

    for (const message of messages) {
      if (message.attachments && Array.isArray(message.attachments)) {
        for (const attachment of message.attachments) {
          // Check if it's a CSV file
          if (
            (attachment.contentType === 'text/csv' ||
              attachment.contentType === 'application/vnd.ms-excel' ||
              attachment.name?.endsWith('.csv')) &&
            attachment.url
          ) {
            csvFiles.push({
              url: attachment.url,
              originalName: attachment.name || 'unnamed.csv',
              displayName: attachment.name || 'unnamed.csv',
            });
          }
        }
      }
    }

    // Remove duplicates based on URL
    const uniqueCsvFiles = csvFiles.filter(
      (file, index, self) =>
        index === self.findIndex((f) => f.url === file.url),
    );

    return NextResponse.json(uniqueCsvFiles);
  } catch (error) {
    console.error('Failed to fetch CSV files:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to fetch CSV files',
    ).toResponse();
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const { url, name } = await request.json();

    if (!url || !name) {
      return new ChatSDKError(
        'bad_request:api',
        'url and name are required.',
      ).toResponse();
    }

    // Extract chatId from referer header
    const chatId = extractChatIdFromReferer(request);

    if (!chatId) {
      return new ChatSDKError(
        'bad_request:api',
        'No chat context found. Please ensure you are in a conversation.',
      ).toResponse();
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    // Check if user has access to this chat
    if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // Create a system message to track the CSV file in the conversation
    // This ensures the CSV URL gets picked up by the system prompt
    const systemMessage = {
      id: generateUUID(),
      chatId: chatId,
      role: 'system' as const,
      parts: [
        {
          type: 'text' as const,
          text: `CSV file uploaded: ${name}`,
        },
      ],
      attachments: [
        {
          url: url,
          name: name,
          contentType: 'text/csv',
        },
      ],
      createdAt: new Date(),
    };

    await saveMessages({ messages: [systemMessage] });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add CSV to conversation:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to add CSV to conversation',
    ).toResponse();
  }
}
