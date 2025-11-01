import { memo } from 'react';
import { CrossIcon } from './icons';
import { Button } from './ui/button';
import { useActiveArtifacts } from '@/hooks/use-active-artifacts';

function PureArtifactCloseButton() {
  const { getVisibleArtifact, hideArtifact } = useActiveArtifacts();
  
  return (
    <Button
      data-testid="artifact-close-button"
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        const visibleArtifact = getVisibleArtifact();
        if (visibleArtifact) {
          hideArtifact(visibleArtifact.documentId);
        }
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
