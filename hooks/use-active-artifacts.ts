'use client';

import { useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useArtifactById } from './use-artifact';

// Global store to track which artifacts are actively streaming or being edited
interface ActiveArtifact {
  documentId: string;
  chatId: string;
  isStreaming: boolean;
  isVisible: boolean;
  lastActivityTimestamp: number;
}

// Hook to manage multiple active artifacts across all chats
export function useActiveArtifacts() {
  const { data: activeArtifacts = [], mutate: setActiveArtifacts } = useSWR<ActiveArtifact[]>(
    'active-artifacts',
    null,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  const addActiveArtifact = useCallback((documentId: string, chatId: string) => {
    if (!documentId || documentId === 'init') return;
    
    setActiveArtifacts((current = []) => {
      const existing = current.find(a => a.documentId === documentId);
      if (existing) {
        // Only update if something actually changed
        if (existing.chatId !== chatId || !existing.isStreaming) {
          return current.map(a => 
            a.documentId === documentId 
              ? { 
                  ...a, 
                  isStreaming: true, 
                  chatId,
                  lastActivityTimestamp: Date.now()
                }
              : a
          );
        }
        // No change needed
        return current;
      }
      return [...current, { 
        documentId, 
        chatId, 
        isStreaming: true, 
        isVisible: false,
        lastActivityTimestamp: Date.now()
      }];
    }, false); // Don't revalidate
  }, [setActiveArtifacts]);

  const finishArtifact = useCallback((documentId: string) => {
    if (!documentId || documentId === 'init') return;
    
    setActiveArtifacts((current = []) =>
      current.map(a => 
        a.documentId === documentId 
          ? { 
              ...a, 
              isStreaming: false,
              lastActivityTimestamp: Date.now()
            }
          : a
      )
    , false); // Don't revalidate
  }, [setActiveArtifacts]);

  const showArtifact = useCallback((documentId: string) => {
    if (!documentId || documentId === 'init') return;
    
    setActiveArtifacts((current = []) =>
      current.map(a => ({ 
        ...a, 
        isVisible: a.documentId === documentId,
        lastActivityTimestamp: a.documentId === documentId ? Date.now() : a.lastActivityTimestamp
      }))
    , false); // Don't revalidate
  }, [setActiveArtifacts]);

  const hideArtifact = useCallback((documentId: string) => {
    if (!documentId || documentId === 'init') return;
    
    setActiveArtifacts((current = []) =>
      current.map(a => 
        a.documentId === documentId 
          ? { 
              ...a, 
              isVisible: false,
              lastActivityTimestamp: Date.now()
            }
          : a
      )
    , false); // Don't revalidate
  }, [setActiveArtifacts]);

  const removeArtifact = useCallback((documentId: string) => {
    if (!documentId || documentId === 'init') return;
    
    setActiveArtifacts((current = []) =>
      current.filter(a => a.documentId !== documentId)
    , false); // Don't revalidate
  }, [setActiveArtifacts]);

  const getVisibleArtifact = useCallback(() => {
    return activeArtifacts.find(a => a.isVisible);
  }, [activeArtifacts]);

  const getArtifactsForChat = useCallback((chatId: string) => {
    return activeArtifacts.filter(a => a.chatId === chatId);
  }, [activeArtifacts]);
  
  // Auto-cleanup effect for stale artifacts (those stuck in streaming state)
  useEffect(() => {
    // Check every 30 seconds for stuck artifacts
    const interval = setInterval(() => {
      setActiveArtifacts((current = []) => {
        const now = Date.now();
        const staleThreshold = 30 * 1000; // 30 seconds
        
        // Find any streaming artifacts that haven't had activity in the last 30 seconds
        const staleArtifacts = current.filter(
          a => a.isStreaming && now - a.lastActivityTimestamp > staleThreshold
        );
        
        // If no stale artifacts, don't change anything
        if (staleArtifacts.length === 0) return current;
        
        // Mark stale artifacts as finished
        return current.map(a => 
          a.isStreaming && now - a.lastActivityTimestamp > staleThreshold
            ? { ...a, isStreaming: false }
            : a
        );
      }, false); // Don't revalidate
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [setActiveArtifacts]);

  return {
    activeArtifacts,
    addActiveArtifact,
    finishArtifact,
    showArtifact,
    hideArtifact,
    removeArtifact,
    getVisibleArtifact,
    getArtifactsForChat,
  };
}

// Hook to listen for artifact stream events and manage individual artifacts
export function useArtifactStreamListener() {
  const { addActiveArtifact, finishArtifact } = useActiveArtifacts();
  
  useEffect(() => {
    const handleArtifactStreamDelta = (event: CustomEvent) => {
      const { artifactId, delta, chatId } = event.detail;
      
      if (!artifactId || artifactId === 'init') return;
      
      // Ensure artifact is in active artifacts
      addActiveArtifact(artifactId, chatId);
      
      // Dispatch the delta to the specific artifact's stream
      window.dispatchEvent(new CustomEvent(`artifact-${artifactId}-delta`, {
        detail: { delta, chatId }
      }));
    };

    window.addEventListener('artifactStreamDelta', handleArtifactStreamDelta as EventListener);

    return () => {
      window.removeEventListener('artifactStreamDelta', handleArtifactStreamDelta as EventListener);
    };
  }, [addActiveArtifact, finishArtifact]);
}

// Hook to manage streaming data for a specific artifact
export function useArtifactStream(documentId: string | null, chatId: string) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifactById(documentId);
  const { addActiveArtifact, finishArtifact } = useActiveArtifacts();
  
  // Track artifact-specific state
  const processingRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimestampRef = useRef<number>(Date.now());
  const hasInitialized = useRef<Set<string>>(new Set());
  
  // Reset processing state when document ID changes
  useEffect(() => {
    // Clear any pending timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    processingRef.current = false;
    lastActivityTimestampRef.current = Date.now();
    
    return () => {
      // Also clear on unmount
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, [documentId]);
  
  // Initialize artifact in active artifacts when document ID is set
  useEffect(() => {
    if (documentId && documentId !== 'init' && !hasInitialized.current.has(documentId)) {
      hasInitialized.current.add(documentId);
      addActiveArtifact(documentId, chatId);
    }
    
    // Safety: Set up an auto-finish timer for this artifact
    // If no activity for 60 seconds, force finish the artifact
    const autoFinishTimer = setTimeout(() => {
      if (documentId && documentId !== 'init' && Date.now() - lastActivityTimestampRef.current > 60000) {
        finishArtifact(documentId);
        setArtifact(current => ({
          ...current,
          status: 'idle'
        }));
      }
    }, 60000); // 60 second timeout
    
    return () => {
      clearTimeout(autoFinishTimer);
    };
  }, [documentId, chatId, addActiveArtifact, finishArtifact, setArtifact]);

  // Listen for delta events specific to this artifact
  useEffect(() => {
    if (!documentId || documentId === 'init') return;
    
    const handleDelta = (event: CustomEvent) => {
      const { delta } = event.detail;
      processStreamDelta(delta);
    };

    const eventName = `artifact-${documentId}-delta`;
    window.addEventListener(eventName, handleDelta as EventListener);

    return () => {
      window.removeEventListener(eventName, handleDelta as EventListener);
    };
  }, [documentId]);

  const processStreamDelta = useCallback((delta: any) => {
    if (!documentId || documentId === 'init') return;
    
    // Update last activity timestamp
    lastActivityTimestampRef.current = Date.now();
    
    // Avoid processing if we're in the middle of cleanup
    if (processingRef.current) {
      return;
    }

    setArtifact((draftArtifact) => {
      if (!draftArtifact) {
        return { 
          documentId,
          content: '',
          kind: 'text',
          title: '',
          status: 'streaming',
          isVisible: false,
          boundingBox: { top: 0, left: 0, width: 0, height: 0 }
        };
      }

      switch (delta.type) {
        case 'text-delta':
        case 'code-delta':
        case 'sheet-delta':
        case 'image-delta':
          // Ensure content is a string
          const contentToAppend = typeof delta.content === 'string' ? delta.content : String(delta.content || '');
          return {
            ...draftArtifact,
            content: draftArtifact.content + contentToAppend,
            status: 'streaming',
          };

        case 'title':
          return {
            ...draftArtifact,
            title: typeof delta.content === 'string' ? delta.content : String(delta.content || ''),
            status: 'streaming',
          };

        case 'kind':
          return {
            ...draftArtifact,
            kind: delta.content,
            status: 'streaming',
          };

        case 'clear':
          return {
            ...draftArtifact,
            content: '',
            status: 'streaming',
          };

        case 'finish':
          // Set a short timeout to allow any pending operations to complete
          processingRef.current = true;
          processingTimeoutRef.current = setTimeout(() => {
            finishArtifact(documentId);
            processingRef.current = false;
          }, 100); // Reduced timeout
          
          return {
            ...draftArtifact,
            status: 'idle',
          };

        default:
          return draftArtifact;
      }
    });
  }, [documentId, setArtifact, finishArtifact]);

  return {
    artifact,
    metadata,
    setArtifact,
    setMetadata,
    processStreamDelta,
  };
}
