import React, { useState, useEffect } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/text-editor';
import {
  ClockRewind,
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import { useDashboard } from '@/hooks/use-dashboard';
import { DashboardItem, StatisticsDashboardItem } from "@/lib/dashboard/utils";
import { ChartType } from "@/lib/chart/types";
import { UnifiedChartRenderer } from "@/lib/chart/UnifiedChartRenderer";
import { DataTable } from "@/components/ui/data-table";
import { StatisticItem } from "@/components/statistic-item";
import { Markdown } from "@/components/markdown";
import { Card } from "@/components/ui/card";

interface TextArtifactMetadata {
  suggestions: Array<Suggestion>;
}

// Component to render text content with embedded dashboard items
function TextContentRenderer({ content, dashboardItems }: { content: string, dashboardItems: DashboardItem[] }) {
  if (!content) return null;

  // Create a map to store rendered items
  const renderedItems = new Map<string, JSX.Element>();

  // Pre-process content to handle item references - using a robust pattern
  const processedContent = content.replace(/```([^`\n\r]+)```/g, (match: string, itemId: string) => {
    const item = dashboardItems.find(i => i.id === itemId);
    if (item) {
      // Generate a unique placeholder that won't be interpreted as markdown
      const placeholder = `__ITEM_${itemId}__`;
      let renderedItem: JSX.Element;

      switch(item.type) {
        case 'chart':
          renderedItem = <UnifiedChartRenderer chartType={item.chartType as ChartType} data={item.data ? item.data : []} config={item.config} />;
          break;
        case 'table':
          renderedItem = <DataTable columns={item.columns} rows={item.rows} rowsPerPage={10} showPagination={false} />;
          break;
        case 'statistics':
          renderedItem = <StatisticItem statsItem={item as StatisticsDashboardItem} />;
          break;
        default:
          return match;
      }

      renderedItems.set(placeholder, renderedItem);
      return placeholder;
    }
    return match;
  });

  // Split content into parts - text and rendered items
  const parts = processedContent.split(/(\_\_ITEM\_[^_]+\_\_)/g).map((part, index) => {
    if (part.startsWith('__ITEM_') && part.endsWith('__')) {
      const renderedItem = renderedItems.get(part);
      if (renderedItem) {
        const placeholder = part;
        const itemId = placeholder.replace('__ITEM_', '').replace('__', '');
        const item = dashboardItems.find(i => i.id === itemId);
        
        // Apply appropriate styling based on item type
        if (item?.type === 'chart') {
          return (
            <Card key={index} className="w-full my-4 p-4">
              <div style={{ height: '400px', width: '100%' }}>
                {renderedItem}
              </div>
            </Card>
          );
        } else {
          return <Card key={index} className="w-full my-4 p-4">{renderedItem}</Card>;
        }
      }
      return part;
    }
    return <Markdown key={index}>{part}</Markdown>;
  });

  return <div className="text-content-renderer">{parts}</div>;
}

// Wrapper component that uses the dashboard hook
function TextArtifactContentWithDashboard(props: any) {
  const { getDashboardItems, loadDashboardItems } = useDashboard();
  const [dashboardItems, setDashboardItems] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  const { content } = props;

  // Check if content contains dashboard item references
  const hasEmbeddedItems = content && /```[^`\n\r]+```/g.test(content);

  // Load dashboard items when component mounts if content has embedded items
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!hasEmbeddedItems || hasTriedLoading) return;

      const currentItems = getDashboardItems();
      
      // If we have no items but content references them, try to load from database
      if (currentItems.length === 0) {
        // Extract chatId from URL or use a default approach
        const currentUrl = window.location.pathname;
        const chatIdMatch = currentUrl.match(/\/chat\/([^\/]+)/);
        const chatId = chatIdMatch ? chatIdMatch[1] : null;
        
        if (chatId) {
          setIsLoadingDashboard(true);
          try {
            await loadDashboardItems(chatId);
            setHasTriedLoading(true);
          } catch (error) {
            console.error('Failed to load dashboard items:', error);
            setHasTriedLoading(true);
          } finally {
            setIsLoadingDashboard(false);
          }
        } else {
          setHasTriedLoading(true);
        }
      } else {
        setDashboardItems(currentItems);
        setHasTriedLoading(true);
      }
    };

    loadDashboardData();
  }, [hasEmbeddedItems, getDashboardItems, loadDashboardItems, hasTriedLoading]);

  // Update local state when hook state changes
  useEffect(() => {
    const currentItems = getDashboardItems();
    setDashboardItems(currentItems);
  }, [getDashboardItems]);

  if (hasEmbeddedItems) {
    // Show loading overlay if we're loading dashboard data
    if (isLoadingDashboard) {
      return (
        <div className="flex flex-row py-8 md:p-20 px-4">
          <div className="w-full">
            <div className="relative">
              <TextContentRenderer 
                content={content} 
                dashboardItems={[]} 
              />
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">Loading data...</div>
                  <div className="text-sm text-muted-foreground">
                    Fetching dashboard items for embedded content
                  </div>
                </div>
              </div>
            </div>
          </div>
          {props.metadata?.suggestions && props.metadata.suggestions.length > 0 ? (
            <div className="md:hidden h-dvh w-12 shrink-0" />
          ) : null}
        </div>
      );
    }

    // Render with dashboard items embedded
    return (
      <div className="flex flex-row py-8 md:p-20 px-4">
        <div className="w-full">
          <TextContentRenderer 
            content={content} 
            dashboardItems={dashboardItems} 
          />
        </div>
        {props.metadata?.suggestions && props.metadata.suggestions.length > 0 ? (
          <div className="md:hidden h-dvh w-12 shrink-0" />
        ) : null}
      </div>
    );
  }

  // Default editor view for regular text content
  return (
    <>
      <div className="flex flex-row py-8 md:p-20 px-4">
        <Editor
          content={content}
          suggestions={props.metadata?.suggestions ?? []}
          isCurrentVersion={props.isCurrentVersion}
          currentVersionIndex={props.currentVersionIndex}
          status={props.status}
          onSaveContent={props.onSaveContent}
        />

        {props.metadata?.suggestions && props.metadata.suggestions.length > 0 ? (
          <div className="md:hidden h-dvh w-12 shrink-0" />
        ) : null}
      </div>
    </>
  );
}

export const textArtifact = new Artifact<'text', TextArtifactMetadata>({
  kind: 'text',
  description: 'Useful for text content, like drafting essays and emails.',
  initialize: async ({ documentId, setMetadata }) => {
    const suggestions = await getSuggestions({ documentId });

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [
            ...metadata.suggestions,
            streamPart.content as Suggestion,
          ],
        };
      });
    }

    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        const updatedContent = draftArtifact.content + (streamPart.content as string);
        return {
          ...draftArtifact,
          content: updatedContent,
          isVisible: true,
          status: 'streaming',
        };
      });
    }

    if (streamPart.type === 'finish') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'idle',
        isVisible: true, // Ensure visibility is maintained after streaming
      }));
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="text" />;
    }

    if (mode === 'diff') {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);

      return <DiffView oldContent={oldContent} newContent={newContent} />;
    }

    if (!content && status === 'streaming') {
      return <DocumentSkeleton artifactKind="text" />;
    }

    if (!content && status === 'idle') {
      return <DocumentSkeleton artifactKind="text" />;
    }

    // Use the wrapper component that has access to dashboard items
    return (
      <TextArtifactContentWithDashboard
        content={content}
        metadata={metadata}
        isCurrentVersion={isCurrentVersion}
        currentVersionIndex={currentVersionIndex}
        status={status}
        onSaveContent={onSaveContent}
      />
    );
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle');
      },
      isDisabled: ({ currentVersionIndex, setMetadata }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add final polish',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: 'Request suggestions',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content:
            'Please add suggestions you have that could improve the writing.',
        });
      },
    },
  ],
});
