'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import {
  artifactDefinitions,
  type ArtifactKind,
  type UIArtifact,
} from './artifact';
import type { Suggestion } from '@/lib/db/schema';
import { initialArtifactData } from '@/hooks/use-artifact';
import { useActiveArtifacts } from '@/hooks/use-active-artifacts';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'plan-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind'
    | 'workflow-execution-update'
    | 'workflow-structure-update'
    | 'dashboard-refresh';
  content: string | Suggestion | any;
};

interface DataStreamHandlerProps {
  id: string;
}

export function DataStreamHandler({ id }: DataStreamHandlerProps) {
  const { data: dataStream } = useChat({ id });
  const { addActiveArtifact, finishArtifact } = useActiveArtifacts();
  const lastProcessedIndex = useRef(-1);
  const currentArtifactId = useRef<string | null>(null);

  // Access SWR mutate so we can keep individual artifact caches in sync while streaming
  const { mutate: mutateCache } = useSWRConfig();

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      // Handle workflow execution events
      if (delta.type === 'workflow-execution-update' && delta.content) {
        // Dispatch a custom event that the workflow editor will listen for
        const event = new CustomEvent('workflowExecutionEvent', {
          detail: delta.content,
        });
        window.dispatchEvent(event);
        return;
      }

      // Handle workflow structure update events
      if (delta.type === 'workflow-structure-update' && delta.content) {
        // Dispatch a custom event that the workflow editor will listen for
        const event = new CustomEvent('workflowStructureUpdate', {
          detail: delta.content,
        });
        window.dispatchEvent(event);
        return;
      }

      // Handle dashboard refresh events
      if (delta.type === 'dashboard-refresh' && delta.content) {
        // Dispatch a custom event that the dashboard will listen for
        const event = new CustomEvent('dashboardRefreshEvent', {
          detail: delta.content,
        });
        window.dispatchEvent(event);
        return;
      }

      // Handle artifact-specific deltas
      if (delta.type === 'id') {
        currentArtifactId.current = delta.content as string;

        // Add artifact to active artifacts system when ID is set
        if (delta.content && delta.content !== 'init') {
          addActiveArtifact(delta.content as string, id);
        }

        // Initialize the artifact in cache
        const artifactCacheKey = `artifact-${delta.content}`;
        mutateCache(
          artifactCacheKey,
          {
            ...initialArtifactData,
            documentId: delta.content as string,
            status: 'streaming',
          },
          false,
        );
        return;
      }

      // Process other deltas only if we have an artifact ID
      if (!currentArtifactId.current || currentArtifactId.current === 'init')
        return;

      const artifactCacheKey = `artifact-${currentArtifactId.current}`;

      // Update the specific artifact cache
      mutateCache(
        artifactCacheKey,
        (currentArtifact: UIArtifact | undefined) => {
          const baseArtifact = currentArtifact || {
            ...initialArtifactData,
            documentId: currentArtifactId.current!,
            status: 'streaming',
          };

          let updatedArtifact: UIArtifact = baseArtifact;

          if (delta.type.endsWith('-delta')) {
          }

          switch (delta.type) {
            case 'title':
              updatedArtifact = {
                ...baseArtifact,
                title: delta.content as string,
                status: 'streaming',
              };
              break;

            case 'kind':
              updatedArtifact = {
                ...baseArtifact,
                kind: delta.content as ArtifactKind,
                status: 'streaming',
              };
              break;

            case 'clear':
              updatedArtifact = {
                ...baseArtifact,
                content: '',
                status: 'streaming',
              };
              break;

            case 'text-delta':
            case 'code-delta':
            case 'sheet-delta':
            case 'image-delta':
            case 'plan-delta':
              updatedArtifact = {
                ...baseArtifact,
                content: baseArtifact.content + (delta.content as string),
                status: 'streaming',
              };
              break;

            case 'finish':
              // Mark artifact as finished in active artifacts system
              if (
                baseArtifact.documentId &&
                baseArtifact.documentId !== 'init'
              ) {
                finishArtifact(baseArtifact.documentId);
              }
              updatedArtifact = {
                ...baseArtifact,
                status: 'idle',
              };
              break;

            default:
              updatedArtifact = baseArtifact;
              break;
          }

          return updatedArtifact;
        },
        false,
      );

      // Handle artifact-specific onStreamPart logic
      const inferredKind = delta.type.endsWith('-delta')
        ? (delta.type.replace('-delta', '') as ArtifactKind)
        : undefined;

      if (inferredKind) {
        const artifactDefinition = artifactDefinitions.find(
          (definition) => definition.kind === inferredKind,
        );

        if (artifactDefinition?.onStreamPart) {
          // Create temporary setArtifact and setMetadata functions for the artifact definition
          const setArtifact = (
            updaterFn:
              | UIArtifact
              | ((currentArtifact: UIArtifact) => UIArtifact),
          ) => {
            mutateCache(
              artifactCacheKey,
              (currentArtifact: UIArtifact | undefined) => {
                const artifactToUpdate = currentArtifact || {
                  ...initialArtifactData,
                  documentId: currentArtifactId.current!,
                  status: 'streaming',
                };

                if (typeof updaterFn === 'function') {
                  return updaterFn(artifactToUpdate);
                }
                return updaterFn;
              },
              false,
            );
          };

          const setMetadata = () => {
            // Metadata handling can be implemented if needed
          };

          artifactDefinition.onStreamPart({
            streamPart: delta,
            setArtifact,
            setMetadata,
          });
        }
      }
    });
  }, [dataStream, addActiveArtifact, finishArtifact, mutateCache, id]);

  return null;
}
