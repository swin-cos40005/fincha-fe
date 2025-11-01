/**
 * Artifact Viewer component for displaying conversation artifacts in the dashboard
 * Now uses the same hook-based approach as the main artifact component for consistency
 * 
 * Key improvements:
 * - Uses useArtifactById hook for per-artifact state management
 * - Properly initializes with conversation artifact content before loading document
 * - Consistent document fetching and content management with main artifact system
 * - Proper debounced content saving and version handling
 * - Maintains UX within dashboard (doesn't jump to conversation)
 * 
 * Supports different artifact types: text, code, image, sheet
 * Includes editing capabilities and toolbar functionality
 */

import { Button } from "./ui/button";
import { type ConversationArtifact } from "@/hooks/use-conversation-artifacts";
import { useState, useEffect, useMemo } from "react";

import { artifactDefinitions } from "./artifact";
import type { Document } from "@/lib/db/schema";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { ArtifactActions } from "./artifact-actions";
import type { UIArtifact } from "./artifact";
import { useArtifactById } from "@/hooks/use-artifact";
import { ArtifactContent } from "./artifact-content";

function getArtifactTypeLabel(kind: string): string {
  switch (kind) {
    case 'text':
      return 'Text Document';
    case 'code':
      return 'Code Artifact';
    case 'sheet':
      return 'Spreadsheet';
    case 'image':
      return 'Image Artifact';
    default:
      return 'Artifact';
  }
}

export function ArtifactViewer({ 
  selectedArtifact, 
  onCloseArtifact,
}: { 
  selectedArtifact: ConversationArtifact;
  onCloseArtifact: () => void;
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Use the hook-based artifact system for metadata and current content
  const { artifact, setArtifact, metadata, setMetadata } = useArtifactById(selectedArtifact.id);

  // Initialize artifact with correct properties from selectedArtifact
  useEffect(() => {
    setArtifact((current) => ({
      ...current,
      kind: selectedArtifact.kind as UIArtifact['kind'],
      title: selectedArtifact.title,
      content: selectedArtifact.content,
      documentId: selectedArtifact.id,
      status: 'idle' as const,
    }));
  }, [selectedArtifact.id, selectedArtifact.kind, selectedArtifact.title, selectedArtifact.content, setArtifact]);

  // Also fetch the document directly to get the latest content for actions
  const { data: documents } = useSWR<Array<Document>>(
    selectedArtifact.id ? `/api/document?id=${selectedArtifact.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  // Get the current content - prioritize document content over artifact content
  const currentContent = useMemo(() => {
    if (documents && documents.length > 0) {
      const latestDocument = documents[documents.length - 1];
      const resolvedContent = latestDocument.content || artifact.content || selectedArtifact.content;
      return resolvedContent;
    }
    const fallbackContent = artifact.content || selectedArtifact.content;
    return fallbackContent;
  }, [documents, artifact.content, selectedArtifact.content]);

  // Initialize artifact metadata when component mounts
  useEffect(() => {
    const artifactDefinition = artifactDefinitions.find(
      (definition) => definition.kind === selectedArtifact.kind,
    );
    
    if (artifactDefinition && artifactDefinition.initialize) {
      artifactDefinition.initialize({
        documentId: selectedArtifact.id,
        setMetadata: setMetadata,
      });
    }
  }, [selectedArtifact.id, selectedArtifact.kind, setMetadata]);

  const handleContentChange = (newContent: string) => {
    setHasUnsavedChanges(newContent !== selectedArtifact.content);
    // Here you could implement saving logic
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-top justify-center z-50" onClick={onCloseArtifact}>
      <div className="bg-background size-full max-w-6xl rounded shadow-xl relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <div className="font-semibold text-lg flex items-center gap-2">
              {selectedArtifact.title}
              {hasUnsavedChanges && (
                <span className="text-xs text-muted-foreground">(unsaved changes)</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {getArtifactTypeLabel(selectedArtifact.kind)} • Created {new Date(selectedArtifact.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onCloseArtifact}>×</Button>
          </div>
        </div>
        
        <div className="h-[calc(100vh-4rem)] overflow-hidden relative">
          <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center relative">
            <ArtifactContent 
              artifactId={selectedArtifact.id}
              isEditable={true}
              _onContentChange={handleContentChange}
            />
            
            {/* Add ArtifactActions for artifact-specific actions like Run, Copy, etc. */}
            <div className="absolute top-2 right-2 z-10">
              <ArtifactActions
                artifact={{
                  title: artifact.title || selectedArtifact.title,
                  documentId: selectedArtifact.id,
                  kind: selectedArtifact.kind,
                  content: currentContent, // Use the current resolved content
                  status: artifact.status || 'idle',
                  isVisible: true,
                  boundingBox: { top: 0, left: 0, width: 0, height: 0 }
                } as UIArtifact}
                handleVersionChange={() => {}}
                currentVersionIndex={0}
                isCurrentVersion={true}
                mode="edit"
                metadata={metadata || { outputs: [], suggestions: [] }}
                setMetadata={setMetadata}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
