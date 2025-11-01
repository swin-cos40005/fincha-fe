import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId, getTemplateById, upsertWorkflowByConversationId, saveChat } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import { DashboardProvider } from '@/hooks/use-dashboard';
import { getSystemTemplateById } from '@/lib/templates';
import { reconstructWorkflowForStorage } from '@/lib/workflow/server-utils';

export default async function Page(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const templateId = searchParams.template;
  
  // Add unique tracking ID for this page render
  const renderTrackingId = Math.random().toString(36).substring(7);  
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  let chat = await getChatById({ id });

  // If chat doesn't exist and we have a template, create the chat
  if (!chat && templateId) {
    try {
      // First try to get from system templates
      let template = getSystemTemplateById(templateId);
      
      if (!template) {
        // If not found in system templates, try to get from database
        try {
          const dbTemplate = await getTemplateById(templateId);
          template = dbTemplate || undefined;
        } catch (error) {
          console.error('Database template lookup failed:', templateId, error);
          template = undefined;
        }
      }
      
      if (template) {
        // Check if user has access to this template
        // System templates (no userId) and public templates are accessible
        // Private templates are only accessible to their owner
        const hasAccess = template.isPublic || 
                         !template.userId || // System templates
                         template.userId === session.user?.id;
        
        if (hasAccess) {
          // Create the chat with template name
          await saveChat({
            id,
            userId: session.user.id,
            title: template.name,
            visibility: 'private',
          });
          // This applies the same logic as client-side, ensuring dashboard configs are set
          const reconstructedWorkflow = reconstructWorkflowForStorage(template.data);
          // Serialize the workflow for storage (strips factory references like client-side does)
          const { serializeWorkflowForStorage } = await import('@/lib/workflow/utils');
          const serializedWorkflow = serializeWorkflowForStorage(reconstructedWorkflow);

          await upsertWorkflowByConversationId({
            title: `${template.name} Workflow`,
            content: JSON.stringify(serializedWorkflow),
            conversationId: id, // This MUST match the chat ID
          });

          // Get the newly created chat
          chat = await getChatById({ id });
        }
      }
    } catch (error) {
      console.error('❌ [ChatPage] Failed to create chat with template:', error, 'trackingId:', renderTrackingId);
      // Continue with normal flow
    }
  }

  // If chat still doesn't exist, create a basic chat
  if (!chat) {
    try {
      await saveChat({
        id,
        userId: session.user.id,
        title: 'New Chat',
        visibility: 'private',
      });
      chat = await getChatById({ id });
    } catch (error) {
      console.error('❌ [ChatPage] Failed to create basic chat:', error, 'trackingId:', renderTrackingId);
      notFound();
    }
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  // Handle template import for existing chats
  if (templateId && session.user?.id === chat.userId && chat) {
    try {
      // First try to get from system templates
      let template = getSystemTemplateById(templateId);
      
      if (!template) {
        // If not found in system templates, try to get from database
        try {
          const dbTemplate = await getTemplateById(templateId);
          template = dbTemplate || undefined;
        } catch (error) {
          console.error('Database template lookup failed:', templateId, error);
          template = undefined;
        }
      }
      
      if (template) {
        // Check if user has access to this template
        // System templates (no userId) and public templates are accessible
        // Private templates are only accessible to their owner
        const hasAccess = template.isPublic || 
                         !template.userId || // System templates
                         template.userId === session.user.id;
        
        if (hasAccess) {
          // Reconstruct the template workflow on server-side to ensure proper initialization
          // This applies the same logic as client-side, ensuring dashboard configs are set
          const reconstructedWorkflow = reconstructWorkflowForStorage(template.data);

          // Serialize the workflow for storage (strips factory references like client-side does)
          const { serializeWorkflowForStorage } = await import('@/lib/workflow/utils');
          const serializedWorkflow = serializeWorkflowForStorage(reconstructedWorkflow);

          // Import the properly reconstructed and serialized workflow
          await upsertWorkflowByConversationId({
            title: `${template.name} Workflow`,
            content: JSON.stringify(serializedWorkflow),
            conversationId: id,
          });
        }
      }
    } catch (error) {
      console.error('Failed to import template:', error);
      // Continue with normal chat flow even if template import fails
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <DashboardProvider>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler id={id} />
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </DashboardProvider>
  );
}
