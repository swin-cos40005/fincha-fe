'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ArtifactKind, UIArtifact } from './artifact';
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from './icons';
import { cn, fetcher } from '@/lib/utils';
import type { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { Editor } from './text-editor';
import { CodeEditor } from './code-editor';
import { ImageEditor } from './image-editor';
import { SpreadsheetEditor } from './sheet-editor';
import { PlanEditor } from './plan-editor';
import { useArtifactById } from '@/hooks/use-artifact';
import { useActiveArtifacts } from '@/hooks/use-active-artifacts';
import equal from 'fast-deep-equal';

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

export function DocumentPreview({
  result,
  args,
}: DocumentPreviewProps) {
  const artifactId = result?.id ?? null;
  const { artifact, setArtifact } = useArtifactById(artifactId);

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);

  // Reset artifact state when a new document is loaded (different ID)
  useEffect(() => {
    if (result && result.id !== artifact.documentId) {
      setArtifact((current) => {
        // If already loading this document, don't update state
        if (current.documentId === result.id) {
          return current;
        }
        return {
          ...current,
          content: '',
          documentId: result.id,
          title: result.title,
          kind: result.kind,
        };
      });
    }
  }, [result, artifact.documentId, setArtifact]);

  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();

    if (artifact.documentId && boundingBox) {
      const { left, top, width, height } = boundingBox;
      const prevBox = artifact.boundingBox || { left: 0, top: 0, width: 0, height: 0 };

      // Only update if any dimension actually changed to avoid render loops
      if (
        prevBox.left !== left ||
        prevBox.top !== top ||
        prevBox.width !== width ||
        prevBox.height !== height
      ) {
        setArtifact((prev) => ({
          ...prev,
          boundingBox: { left, top, width, height },
        }));
      }
    }
  }, [artifact.documentId, setArtifact]);

  // Always show document preview inline, regardless of artifact visibility
  // The artifact visibility only controls the full-screen artifact viewer
  
  if (isDocumentsFetching) {
    return <LoadingSkeleton artifactKind={result.kind ?? args.kind} />;
  }

  const document: Document | null = previewDocument
    ? previewDocument
    : artifact.status === 'streaming' || (artifact.content && !previewDocument)
      ? {
          title: artifact.title,
          kind: artifact.kind,
          content: artifact.content,
          id: artifact.documentId,
          createdAt: new Date(),
          userId: 'noop',
        }
      : null;

  if (!document) {
    return <LoadingSkeleton artifactKind={artifact.kind} />;
  }
  
  // Show content if we have it, even if still streaming
  if (document.content && document.content.length > 0) {
  }
  // Force content to be visible if we have content, even if still streaming
  else if (artifact.status === 'streaming' && !document.content) {
    document.content = ' '; // Ensure non-empty content to trigger rendering
  }

  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        result={result}
        setArtifact={setArtifact}
      />
      <DocumentHeader
        title={document.title}
        kind={document.kind}
        isStreaming={artifact.status === 'streaming'}
      />
      <DocumentContent document={document} />
    </div>
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    {artifactKind === 'image' ? (
      <div className="overflow-y-scroll border rounded-b-2xl bg-muted border-t-0 dark:border-zinc-700">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureHitboxLayer = ({
  hitboxRef,
  result,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
}) => {
  const { showArtifact, addActiveArtifact } = useActiveArtifacts();
  
  const handleClick = useCallback(
    () => {
      if (result?.id) {
        addActiveArtifact(result.id, 'current-chat');
        
        // Small delay to ensure the artifact is registered before showing it
        setTimeout(() => {
          // Provide kind for immediate correct renderer
          if (result.kind) {
            setArtifact((current) => ({ ...current, kind: result.kind }));
          }
          showArtifact(result.id);
        }, 50);
      }
    },
    [result, showArtifact, addActiveArtifact, setArtifact],
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.result, nextProps.result)) return false;
  return true;
});

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === 'image' ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
});

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact, setArtifact } = useArtifactById(document?.id ?? null);
  const documentId = document?.id;
  const documentContent = document?.content;
  const documentKind = document?.kind;
  const documentTitle = document?.title;

  // Only reset content when document ID changes and current content is empty
  useEffect(() => {
    if (documentId !== artifact.documentId) {
      setArtifact((current) => ({
        ...current,
        content: documentContent || current.content || '',
        documentId: documentId || 'init',
        kind: documentKind || 'text',
        title: documentTitle || '',
        status: documentContent ? 'idle' : 'streaming', // Only set streaming if no content
      }));
    }
    // Update status to idle when content is available, but don't interfere if already idle
    else if (documentContent && documentContent.length > 0 && artifact.status === 'streaming') {
      setArtifact((current) => ({
        ...current,
        status: 'idle'
      }));
    }
  }, [
    documentId,
    artifact.documentId,
    setArtifact,
    documentContent,
    documentKind,
    documentTitle,
    artifact.status,
  ]);

  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'p-4 sm:px-14 sm:py-16': document.kind === 'text',
      'p-4': document.kind === 'plan',
      'p-0': document.kind === 'code',
    },
  );
  const commonProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0, // Always provide a valid default
    status: artifact.status || 'streaming', // Ensure status has a default value
    saveContent: () => {},
    suggestions: [],
  };
  return (
    <div className={containerClassName}>
      {' '}
      {document.kind === 'text' ? (
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === 'code' ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor
              {...commonProps}
              onSaveContent={() => {}}
              currentVersionIndex={0} // Provide explicit currentVersionIndex
              isCurrentVersion={true} // Ensure isCurrentVersion is always defined
            />
          </div>
        </div>
      ) : document.kind === 'sheet' ? (
        <div className="flex flex-1 relative size-full p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === 'image' ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ''}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={artifact.status}
          isInline={true}
        />
      ) : document.kind === 'plan' ? (
        <PlanEditor
          content={document.content ?? ''}
          onSaveContent={() => {}}
          status={artifact.status}
          isCurrentVersion={true}
          currentVersionIndex={0}
        />
      ) : null}
    </div>
  );
};
