'use client';

import { useMemo } from 'react';
import type { UIMessage } from 'ai';

export interface ConversationArtifact {
  id: string;
  title: string;
  kind: string;
  content: string;
  createdAt: Date;
  messageId: string;
}

export function useConversationArtifacts(messages: UIMessage[]): ConversationArtifact[] {
  // Simply extract artifacts from messages in real-time
  const artifacts = useMemo(() => {
    const artifactList: ConversationArtifact[] = [];
    const seenIds = new Set<string>();

    messages.forEach((message) => {
      if (!message.parts) return;

      message.parts.forEach((part) => {
        if (part.type === 'tool-invocation' && 
            part.toolInvocation.state === 'result' && 
            part.toolInvocation.toolName === 'createDocument') {
          
          const { result } = part.toolInvocation;
          
          if (result && result.id && !seenIds.has(result.id)) {
            seenIds.add(result.id);
            
            artifactList.push({
              id: result.id,
              title: result.title || 'Untitled Artifact',
              kind: result.kind || 'text',
              content: result.content || '', // Try to extract content from result
              createdAt: message.createdAt || new Date(),
              messageId: message.id,
            });
          }
        }
      });
    });

    return artifactList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [messages]); // Depend directly on messages

  return artifacts;
}
