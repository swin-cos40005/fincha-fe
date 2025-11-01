import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { auth } from '../(auth)/auth';
import { DashboardProvider } from '@/hooks/use-dashboard';
import { getTemplateById, saveChat, upsertWorkflowByConversationId } from '@/lib/db/queries';
import { getSystemTemplateById } from '@/lib/templates';
import { reconstructWorkflowForStorage } from '@/lib/workflow/server-utils';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const templateId = params.template;

  // Add unique tracking ID for this page render
  const renderTrackingId = Math.random().toString(36).substring(7);

  if (templateId) {
    // If template parameter is provided, create a new chat with template data
    const session = await auth();

    if (!session) {
      redirect('/api/auth/guest');
    }

    // First try to get from system templates
    let template = getSystemTemplateById(templateId);
    
    if (!template) {
      // If not found in system templates, try to get from database
      try {
        const dbTemplate = await getTemplateById(templateId);
        template = dbTemplate || undefined;
      } catch (error) {
        // Template not found, redirect to regular chat
        const fallbackChatId = generateUUID();
        redirect(`/chat/${fallbackChatId}`);
      }
    }
    
    if (!template) {
      // Template not found, redirect to regular chat
      const fallbackChatId = generateUUID();
      redirect(`/chat/${fallbackChatId}`);
    }

    // Check if user has access to this template
    // System templates (no userId) and public templates are accessible
    // Private templates are only accessible to their owner
    const hasAccess = template.isPublic || 
                     !template.userId || // System templates
                     template.userId === session.user?.id;
    
    if (!hasAccess) {
      // No access to template, redirect to regular chat
      const fallbackChatId = generateUUID();
      redirect(`/chat/${fallbackChatId}`);
    }

    // Generate the chat ID ONCE and use it consistently
    const newChatId = generateUUID();

    try {
      // Create the chat with template name
      await saveChat({
        id: newChatId,
        userId: session.user.id,
        title: template.name,
        visibility: 'private',
      });

      // Reconstruct the template workflow on server-side to ensure proper initialization
      // This applies the same logic as client-side, ensuring dashboard configs are set
      const reconstructedWorkflow = reconstructWorkflowForStorage(template.data);

      // Serialize the workflow for storage (strips factory references like client-side does)
      const { serializeWorkflowForStorage } = await import('@/lib/workflow/utils');
      const serializedWorkflow = serializeWorkflowForStorage(reconstructedWorkflow);

      // CRITICAL: Use the same newChatId for both chat creation and workflow storage
      // This ensures AI tools will find dashboard items in the same conversation
      await upsertWorkflowByConversationId({
        title: `${template.name} Workflow`,
        content: JSON.stringify(serializedWorkflow),
        conversationId: newChatId, // This MUST match the chat ID
      });
    } catch (error) {
      // On error, redirect to regular chat
      const fallbackChatId = generateUUID();
      redirect(`/chat/${fallbackChatId}`);
    }

    // Redirect to the new chat (without template parameter to avoid double import)
    // This redirect is outside ALL try/catch blocks since redirect() throws NEXT_REDIRECT which is normal behavior
    redirect(`/chat/${newChatId}`);
  }

  const id = generateUUID();
  const session = await auth();



  if (!session) {
    redirect('/api/auth/guest');
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <DashboardProvider>
        <Chat
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider>
      <Chat
        id={id}
        initialMessages={[]}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </DashboardProvider>
  );
}
