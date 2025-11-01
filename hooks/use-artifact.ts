'use client';

import useSWR from 'swr';
import type { UIArtifact } from '@/components/artifact';
import { useCallback, useEffect, useMemo } from 'react';

export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  const { data: localArtifact } = useSWR<UIArtifact>('current-artifact', null, {
    fallbackData: initialArtifactData,
  });

  const selectedValue = useMemo(() => {
    if (!localArtifact) return selector(initialArtifactData);
    return selector(localArtifact);
  }, [localArtifact, selector]);

  return selectedValue;
}

// Hook for managing a specific artifact by ID
export function useArtifactById(artifactId: string | null) {
  // Use unique key for each artifact to ensure proper cache isolation
  const swrKey = artifactId ? `artifact-${artifactId}` : null;
  
  // Initialize artifact data for this specific ID
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    swrKey,
    null,
    {
      fallbackData: artifactId ? { ...initialArtifactData, documentId: artifactId } : initialArtifactData,
      // Don't revalidate on focus/reconnect - we control this data manually
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,
    },
  );

  // Reset artifact content when switching to a new ID or first initialization
  useEffect(() => {
    if (
      artifactId &&
      artifactId !== 'init' &&
      (!localArtifact || (localArtifact.documentId !== artifactId && !localArtifact.content))
    ) {
      // Only initialize if we don't already have the correct artifact in cache
      // AND there's no content (don't override existing streaming content)
      setLocalArtifact({
        ...initialArtifactData,
        documentId: artifactId,
        status: 'streaming',
      }, false); // Don't revalidate
    }
  }, [artifactId, localArtifact, setLocalArtifact]);

  const artifact = useMemo(() => {
    if (!localArtifact) return artifactId ? { ...initialArtifactData, documentId: artifactId } : initialArtifactData;
    return localArtifact;
  }, [localArtifact, artifactId]);

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      if (!artifactId) return;
      
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || { ...initialArtifactData, documentId: artifactId };

        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate);
        }

        return updaterFn;
      }, false); // false = don't revalidate
    },
    [setLocalArtifact, artifactId],
  );

  // Use a separate key for metadata to keep it isolated from the artifact itself
  const metadataKey = artifactId ? `artifact-metadata-${artifactId}` : null;
  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      metadataKey,
      null,
      {
        fallbackData: {},
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      },
    );

  // Clean up effect when unmounting or changing artifact ID
  useEffect(() => {
    return () => {
      if (artifactId && artifactId !== 'init') {
      }
    };
  }, [artifactId]);

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}

// Legacy hook that uses global current artifact (keeping for compatibility)
export function useArtifact() {
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'current-artifact',
    null,
    {
      fallbackData: initialArtifactData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const artifact = useMemo(() => {
    if (!localArtifact) return initialArtifactData;
    return localArtifact;
  }, [localArtifact]);

  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        const artifactToUpdate = currentArtifact || initialArtifactData;

        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate);
        }

        return updaterFn;
      }, false); // false = don't revalidate
    },
    [setLocalArtifact],
  );

  // Use a separate key for metadata based on the current artifact ID
  const metadataKey = useMemo(() => 
    artifact.documentId && artifact.documentId !== 'init' 
      ? `artifact-metadata-${artifact.documentId}` 
      : null
  , [artifact.documentId]);
  
  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      metadataKey,
      null,
      {
        fallbackData: {},
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      },
    );

  return useMemo(
    () => ({
      artifact,
      setArtifact,
      metadata: localArtifactMetadata,
      setMetadata: setLocalArtifactMetadata,
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}
