import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  or,
  ilike,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  workflow,
  type Workflow,
  templateCategory,
  workflowTemplate,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import type {
  TemplateCategory,
  WorkflowTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateSearchFilters,
} from '@/lib/types';
import { SYSTEM_TEMPLATE_CATEGORIES } from '@/lib/templates';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
// Workflow queries
export async function saveWorkflow({
  chatId,
  title,
  content,
}: {
  chatId: string;
  title: string;
  content: string;
}) {
  try {
    return await db
      .insert(workflow)
      .values({
        chatId,
        title,
        content,
        shared: false,
        sharedId: null,
        createdAt: new Date(),
      })
      .returning();
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to save workflow');
  }
}

export async function upsertWorkflowByConversationId({
  title,
  content,
  conversationId,
}: {
  title: string;
  content: string;
  conversationId: string;
}) {
  try {
    // Try to update existing workflow first
    const [updated] = await db
      .update(workflow)
      .set({
        title,
        content,
      })
      .where(eq(workflow.chatId, conversationId))
      .returning();

    if (updated) {
      return updated;
    }

    // If no existing workflow, insert a new one
    const [inserted] = await db
      .insert(workflow)
      .values({
        chatId: conversationId,
        title,
        content,
        shared: false,
        sharedId: null,
        createdAt: new Date(),
      })
      .returning();

    return inserted;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to save workflow');
  }
}

export async function getWorkflowsByUserId({
  userId,
}: {
  userId: string;
}): Promise<Array<Workflow>> {
  try {
    // Since workflows are now tied to chats, we need to join with the chat table
    return await db
      .select({
        chatId: workflow.chatId,
        createdAt: workflow.createdAt,
        title: workflow.title,
        content: workflow.content,
        shared: workflow.shared,
        sharedId: workflow.sharedId,
      })
      .from(workflow)
      .innerJoin(chat, eq(workflow.chatId, chat.id))
      .where(eq(chat.userId, userId))
      .orderBy(desc(workflow.createdAt));
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get workflows');
  }
}

export async function getWorkflowById({
  chatId,
}: {
  chatId: string;
}): Promise<Workflow | null> {
  try {
    const [workflowResult] = await db
      .select()
      .from(workflow)
      .where(eq(workflow.chatId, chatId))
      .limit(1);

    return workflowResult || null;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get workflow');
  }
}

// Helper function to ensure both chat and workflow exist
export async function ensureChatAndWorkflowExist({
  chatId,
  userId,
  title = 'New Chat',
  visibility = 'private' as VisibilityType,
}: {
  chatId: string;
  userId: string;
  title?: string;
  visibility?: VisibilityType;
}) {
  try {
    // Check if chat exists
    let chat = await getChatById({ id: chatId });

    if (!chat) {
      // Create chat first
      await saveChat({
        id: chatId,
        userId,
        title,
        visibility,
      });
      chat = await getChatById({ id: chatId });
    }

    // Check if workflow exists
    let workflow = await getWorkflowById({ chatId });

    if (!workflow) {
      // Create empty workflow
      workflow = await upsertWorkflowByConversationId({
        title: `${title} Workflow`,
        content: JSON.stringify({
          nodes: [],
          edges: [],
          metadata: {
            created: new Date().toISOString(),
            description: 'Workflow for data processing and analysis',
          },
        }),
        conversationId: chatId,
      });
    }

    return { chat, workflow };
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to ensure chat and workflow exist',
    );
  }
}

// Template System Queries

// Category Operations
export async function getAllTemplateCategories(): Promise<TemplateCategory[]> {
  try {
    const categories = await db
      .select()
      .from(templateCategory)
      .orderBy(templateCategory.displayOrder, templateCategory.name);
    
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? undefined,
      displayOrder: parseInt(cat.displayOrder),
      isSystem: cat.isSystem,
      createdAt: cat.createdAt,
    }));
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get template categories');
  }
}

export async function createTemplateCategory(data: {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isSystem?: boolean;
}): Promise<TemplateCategory> {
  try {
    const [category] = await db
      .insert(templateCategory)
      .values({
        id: data.id,
        name: data.name,
        description: data.description,
        displayOrder: (data.displayOrder || 0).toString(),
        isSystem: data.isSystem || false,
        createdAt: new Date(),
      })
      .returning();

    return {
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      displayOrder: parseInt(category.displayOrder),
      isSystem: category.isSystem,
      createdAt: category.createdAt,
    };
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to create template category');
  }
}

// Template Operations
export async function getTemplatesByFilters(
  filters: TemplateSearchFilters,
  page = 1,
  pageSize = 20
): Promise<{ templates: WorkflowTemplate[]; total: number }> {
  try {
    const offset = (page - 1) * pageSize;
    
    let whereConditions: any[] = [];
    
    if (filters.categoryId) {
      whereConditions.push(eq(workflowTemplate.categoryId, filters.categoryId));
    }
    

    
    if (filters.isPublic !== undefined) {
      whereConditions.push(eq(workflowTemplate.isPublic, filters.isPublic));
    }
    
    if (filters.userId) {
      whereConditions.push(eq(workflowTemplate.userId, filters.userId));
    }
    
    if (filters.search) {
      whereConditions.push(
        or(
          ilike(workflowTemplate.name, `%${filters.search}%`),
          ilike(workflowTemplate.description, `%${filters.search}%`),
          ilike(workflowTemplate.useCase, `%${filters.search}%`)
        )
      );
    }
    
    // Get templates with categories
    const templatesQuery = db
      .select({
        template: workflowTemplate,
        category: templateCategory,
      })
      .from(workflowTemplate)
      .leftJoin(templateCategory, eq(workflowTemplate.categoryId, templateCategory.id))
      .orderBy(desc(workflowTemplate.usageCount), desc(workflowTemplate.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countQuery = db
      .select({ count: count() })
      .from(workflowTemplate);

    if (whereConditions.length > 0) {
      const whereClause = and(...whereConditions);
      templatesQuery.where(whereClause);
      countQuery.where(whereClause);
    }

    const [templates, [{ count: totalCount }]] = await Promise.all([
      templatesQuery,
      countQuery,
    ]);

    return {
      templates: templates.map(({ template, category }) => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        useCase: template.useCase ?? undefined,
        categoryId: template.categoryId,
        userId: template.userId ?? undefined,
        isPublic: template.isPublic,
        category: category ? {
          id: category.id,
          name: category.name,
          description: category.description ?? undefined,
          displayOrder: parseInt(category.displayOrder),
          isSystem: category.isSystem,
          createdAt: category.createdAt,
        } : undefined,
        usageCount: parseInt(template.usageCount),
        tags: template.tags as string[],
        data: template.data as any,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })),
      total: totalCount,
    };
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get templates');
  }
}

export async function getTemplateById(id: string): Promise<WorkflowTemplate | null> {
  try {
    const [result] = await db
      .select({
        template: workflowTemplate,
        category: templateCategory,
      })
      .from(workflowTemplate)
      .leftJoin(templateCategory, eq(workflowTemplate.categoryId, templateCategory.id))
      .where(eq(workflowTemplate.id, id))
      .limit(1);

    if (!result) {
      return null;
    }

    const { template, category } = result;
    
    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      useCase: template.useCase ?? undefined,
      categoryId: template.categoryId,
      userId: template.userId ?? undefined,
      isPublic: template.isPublic,
      category: category ? {
        id: category.id,
        name: category.name,
        description: category.description ?? undefined,
        displayOrder: parseInt(category.displayOrder),
        isSystem: category.isSystem,
        createdAt: category.createdAt,
      } : undefined,
      usageCount: parseInt(template.usageCount),
      tags: template.tags as string[],
      data: template.data as any,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get template');
  }
}

export async function createTemplate(data: CreateTemplateRequest & { userId?: string }): Promise<WorkflowTemplate> {
  try {
    // First, ensure the category exists
    const [categoryExists] = await db
      .select({ id: templateCategory.id })
      .from(templateCategory)
      .where(eq(templateCategory.id, data.categoryId))
      .limit(1);

    if (!categoryExists) {
      // Create the category if it doesn't exist (for system categories)
      const systemCategory = SYSTEM_TEMPLATE_CATEGORIES.find((cat: TemplateCategory) => cat.id === data.categoryId);
      if (systemCategory) {
        await createTemplateCategory(systemCategory);
      } else {
        throw new Error(`Category with id '${data.categoryId}' does not exist`);
      }
    }

    const [template] = await db
      .insert(workflowTemplate)
      .values({
        name: data.name,
        description: data.description,
        useCase: data.useCase,
        categoryId: data.categoryId,
        data: data.data,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        userId: data.userId,
        usageCount: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Fetch with category
    const result = await getTemplateById(template.id);
    if (!result) {
      throw new Error('Failed to create template');
    }
    
    return result;
  } catch (error) {
    console.error('Template creation error:', error);
    throw new ChatSDKError('bad_request:database', `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateTemplate(data: UpdateTemplateRequest): Promise<WorkflowTemplate> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.useCase !== undefined) updateData.useCase = data.useCase;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.data !== undefined) updateData.data = data.data;

    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    await db
      .update(workflowTemplate)
      .set(updateData)
      .where(eq(workflowTemplate.id, data.id));

    const result = await getTemplateById(data.id);
    if (!result) {
      throw new Error('Template not found after update');
    }
    
    return result;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to update template');
  }
}

export async function deleteTemplate(id: string, userId?: string): Promise<void> {
  try {
    if (userId) {
      // Only allow owner to delete their templates
      await db
        .delete(workflowTemplate)
        .where(
          and(
            eq(workflowTemplate.id, id),
            eq(workflowTemplate.userId, userId)
          )
        );
    } else {
      // Admin delete - can delete any template
      await db.delete(workflowTemplate).where(eq(workflowTemplate.id, id));
    }
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to delete template');
  }
}

export async function incrementTemplateUsage(id: string): Promise<void> {
  try {
    // Get current usage count
    const [template] = await db
      .select({ usageCount: workflowTemplate.usageCount })
      .from(workflowTemplate)
      .where(eq(workflowTemplate.id, id))
      .limit(1);
    
    if (template) {
      const newCount = parseInt(template.usageCount) + 1;
      await db
        .update(workflowTemplate)
        .set({ usageCount: newCount.toString() })
        .where(eq(workflowTemplate.id, id));
    }
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to increment template usage');
  }
}

export async function getUserTemplates(userId: string): Promise<WorkflowTemplate[]> {
  try {
    const { templates } = await getTemplatesByFilters({ userId });
    return templates;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get user templates');
  }
}

export async function getSystemTemplates(): Promise<WorkflowTemplate[]> {
  try {
    // Since isSystem field is removed, we'll need to identify system templates differently
    // For now, return empty array or implement alternative logic
    const { templates } = await getTemplatesByFilters({});
    return templates;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get system templates');
  }
}

export async function getPublicTemplates(): Promise<WorkflowTemplate[]> {
  try {
    const { templates } = await getTemplatesByFilters({ isPublic: true });
    return templates;
  } catch {
    throw new ChatSDKError('bad_request:database', 'Failed to get public templates');
  }
}
