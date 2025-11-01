import { useState, useEffect, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useDebounceCallback } from "usehooks-ts";
import { fetcher } from "@/lib/utils";
import type { Document } from "@/lib/db/schema";
import { artifactDefinitions } from "./artifact";

import { useArtifactById } from "@/hooks/use-artifact";
import { DocumentSkeleton } from "./document-skeleton";
import { AnimatePresence } from "framer-motion";
import { Toolbar } from "./toolbar";
import { VersionFooter } from "./version-footer";
import type { UseChatHelpers } from '@ai-sdk/react';

interface ArtifactContentProps {
  artifactId: string;
  isEditable?: boolean;
  _onContentChange?: (content: string) => void;
  mode?: 'edit' | 'diff';
  showToolbar?: boolean;
  showVersionFooter?: boolean;
  className?: string;
  // External version change handler
  onVersionChange?: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  currentVersionIndex?: number;
  // Toolbar props
  append?: UseChatHelpers['append'];
  status?: UseChatHelpers['status'];
  stop?: UseChatHelpers['stop'];
  setMessages?: UseChatHelpers['setMessages'];
}

export function ArtifactContent({
  artifactId,
  isEditable = false,
  _onContentChange,
  mode = 'edit',
  showToolbar = false,
  showVersionFooter = false,
  className = "",
  onVersionChange,
  currentVersionIndex: externalCurrentVersionIndex,
  // Toolbar props
  append,
  status,
  stop,
  setMessages,
}: ArtifactContentProps) {
  // Use the same hook-based approach as the main artifact component
  const { artifact, setArtifact, metadata, setMetadata } = useArtifactById(artifactId);

  // Fetch documents using the same pattern as main artifact component
  const { data: documents, isLoading } = useSWR<Array<Document>>(
    artifactId && artifact.status !== 'streaming'
      ? `/api/document?id=${artifactId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  const [document, setDocument] = useState<Document | null>(null);
  const [internalCurrentVersionIndex, setInternalCurrentVersionIndex] = useState(-1);

  // Use external version index if provided, otherwise use internal
  const currentVersionIndex = externalCurrentVersionIndex !== undefined 
    ? externalCurrentVersionIndex 
    : internalCurrentVersionIndex;

  // Sync document state when documents are loaded (same as main artifact component)
  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);
      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        if (externalCurrentVersionIndex === undefined) {
          setInternalCurrentVersionIndex(documents.length - 1);
        }

        // Only update content if the document has newer content
        setArtifact((prev) => ({
          ...prev,
          title: mostRecentDocument.title || prev.title,
          content: mostRecentDocument.content || prev.content,
        }));
      }
    }
  }, [documents, setArtifact, externalCurrentVersionIndex]);

  // Content change handling with debouncing (same as main artifact component)
  const { mutate } = useSWRConfig();

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      mutate<Array<Document>>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (onVersionChange) {
      // Use external version change handler if provided
      onVersionChange(type);
    } else {
      // Use internal version change logic
      if (!documents) return;

      if (type === 'latest') {
        setInternalCurrentVersionIndex(documents.length - 1);
      }

      if (type === 'prev') {
        if (currentVersionIndex > 0) {
          setInternalCurrentVersionIndex((index) => index - 1);
        }
      } else if (type === 'next') {
        if (currentVersionIndex < documents.length - 1) {
          setInternalCurrentVersionIndex((index) => index + 1);
        }
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  if (isLoading) {
    return <DocumentSkeleton artifactKind={artifact.kind as any} />;
  }

  // Always prioritize document content over artifact content
  const currentContent = document?.content || artifact.content;
  
  if (!currentContent) {
    return <div className="text-muted-foreground p-8">No content available.</div>;
  }

  // Find the correct artifact definition
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    return (
      <div className={`artifact-content size-full overflow-auto p-4 ${className}`}>
        <div className="text-muted-foreground text-center">
          Unsupported artifact type: {artifact.kind}
        </div>
      </div>
    );
  }

  // Determine if we're viewing the current version
  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  // Use the proper artifact renderer
  const ArtifactRenderer = artifactDefinition.content;
  
  return (
    <div className={`artifact-content h-full ${className}`}>
      <ArtifactRenderer
        title={artifact.title}
        content={
          isCurrentVersion
            ? currentContent
            : getDocumentContentById(currentVersionIndex)
        }
        mode={isEditable ? "edit" : mode}
        isCurrentVersion={isCurrentVersion}
        currentVersionIndex={currentVersionIndex}
        status={artifact.status}
        suggestions={[]}
        onSaveContent={saveContent}
        isInline={false}
        getDocumentContentById={getDocumentContentById}
        isLoading={isLoading}
        metadata={metadata || { outputs: [], suggestions: [] }}
        setMetadata={setMetadata}
      />

      <AnimatePresence>
        {showToolbar && isCurrentVersion && append && status && stop && setMessages && (
          <Toolbar
            isToolbarVisible={isToolbarVisible}
            setIsToolbarVisible={setIsToolbarVisible}
            append={append}
            status={status}
            stop={stop}
            setMessages={setMessages}
            artifactKind={artifact.kind}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVersionFooter && !isCurrentVersion && documents && (
          <VersionFooter
            currentVersionIndex={currentVersionIndex}
            documents={documents}
            handleVersionChange={handleVersionChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 