'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { CrossIcon, ChartBarIcon, MenuIcon, FileIcon } from './icons';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { UnifiedDashboard } from './unified-dashboard';
import { WorkflowEditor } from './workflow-editor';
import { DashboardExport } from './dashboard-export';
import { useSidebar } from './ui/sidebar';
import { generateUUID } from '@/lib/utils';
import { ArtifactViewer } from './artifact-viewer';
import { useConversationArtifacts } from '@/hooks/use-conversation-artifacts';
import { useDashboard } from '@/hooks/use-dashboard';
import type { UIMessage } from 'ai';

export interface DashboardState {
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

interface DashboardProps {
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  onClose: () => void;
  chatId?: string;
  session?: any;
  append?: (message: any) => void;
  messages?: UIMessage[];
}

function Dashboard({
  isVisible,
  boundingBox,
  onClose,
  chatId,
  session,
  append,
  messages = [],
}: DashboardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const { state: sidebarState } = useSidebar();
  const isSidebarOpen = sidebarState === 'expanded';
  const isMobile = windowWidth ? windowWidth < 768 : false;

  // Simple state for 3 fixed tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Use dashboard hook for data management
  const { 
    getDashboardItems, 
    loadDashboardItems, 
    updateDashboardItem, 
    removeDashboardItem 
  } = useDashboard();

  // Dashboard items state - get from hook
  const [dashboardItems, setDashboardItems] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Get artifacts from conversation messages
  const artifacts = useConversationArtifacts(messages);
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);

  // Workflow state
  const [currentWorkflowData, setCurrentWorkflowData] = useState<any>(null);

  // Load data when dashboard opens
  useEffect(() => {
    const loadDataOnOpen = async () => {
      if (!isVisible || !chatId) return;

      try {
        setIsLoadingDashboard(true);

        // Load dashboard items from database using hook
        await loadDashboardItems(chatId);

        // Load workflow data
        try {
          const apiUrl = `/api/workflows?conversationId=${chatId}`;
          const response = await fetch(apiUrl);

          if (response.ok) {
            const responseData = await response.json();
            const { workflow } = responseData;

            if (workflow) {
              const data = JSON.parse(workflow.content);
              setCurrentWorkflowData(data);
            }
          }
        } catch (error) {
          console.error('Failed to load workflow:', error);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    loadDataOnOpen();
  }, [isVisible, chatId, loadDashboardItems]);

  // Update local dashboard items when hook state changes
  useEffect(() => {
    const items = getDashboardItems();
    setDashboardItems(items);
  }, [getDashboardItems]);

  // Listen for dashboard refresh events and reload data
  useEffect(() => {
    if (!isVisible || !chatId) return;

    const handleDashboardRefresh = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      
      // Only handle events for this conversation
      if (conversationId !== chatId) return;

      // Async refresh logic
      (async () => {
        try {
          setIsLoadingDashboard(true);
          // Reload dashboard items from database
          await loadDashboardItems(chatId);
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error);
        } finally {
          setIsLoadingDashboard(false);
        }
      })();
    };

    window.addEventListener('dashboardRefreshEvent', handleDashboardRefresh as EventListener);

    return () => {
      window.removeEventListener('dashboardRefreshEvent', handleDashboardRefresh as EventListener);
    };
  }, [isVisible, chatId, loadDashboardItems]);

  // Dashboard item management functions
  const handleUpdateDashboardItem = (itemId: string, updates: any) => {
    updateDashboardItem(itemId, updates);
    // Update local state as well
    setDashboardItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    );
  };

  const handleRemoveDashboardItem = (itemId: string) => {
    removeDashboardItem(itemId);
    // Update local state as well
    setDashboardItems((items) => items.filter((item) => item.id !== itemId));
  };

  // Artifact handling functions
  const handleGenerateArtifact = async (config: any) => {
    // Title is optional – fallback to "Untitled Artifact" if missing or blank
    const artifactTitle = config.title?.trim() || 'Untitled Artifact';

    setIsGeneratingArtifact(true);

    try {
      // Trigger the AI agent via append function with proper message format
      if (append) {
        // Create a natural language message that will trigger the createDocument tool
        const content = `Please use the createDocument tool to create an artifact with the following configuration:

Title: "${artifactTitle}"
Type: ${config.type || 'text'}
Include Executive Summary: ${config.includeExecutiveSummary}
Include Recommendations: ${config.includeRecommendations}${
          config.focusAreas?.length > 0
            ? `
Focus Areas: ${config.focusAreas.join(', ')}`
            : ''
        }

I have ${dashboardItems.length} dashboard items available for analysis. Please analyze the current dashboard data and generate a comprehensive artifact that adapts to the specified type.`;

        await append({
          id: generateUUID(),
          role: 'user',
          content: content,
        });

        // Close the dashboard to let the user see the chat
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        alert('Chat function not available. Please try again.');
      }
    } catch {
      alert('Error generating artifact. Please try again.');
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  const handleOpenArtifact = (artifactId: string) => {
    const artifact = artifacts.find((a) => a.id === artifactId);
    if (artifact) {
      setSelectedArtifact(artifact);
    }
  };

  const handleRemoveArtifact = async (artifactId: string) => {
    try {
      alert(
        'Artifact removal not yet implemented. Artifacts are part of the conversation history.' +
          artifactId,
      );
    } catch {
      alert('Failed to remove artifact. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="dashboard"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* Chat area background */}
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {/* Dashboard panel */}
          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-hidden md:border-l dark:border-zinc-700 border-zinc-200"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: boundingBox.left,
                    y: boundingBox.top,
                    height: boundingBox.height,
                    width: boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: boundingBox.left,
                    y: boundingBox.top,
                    height: boundingBox.height,
                    width: boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100vw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100vw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* Header with close button */}
            <div className="p-2 flex flex-row justify-between items-start border-b">
              <div className="flex flex-row gap-4 items-start">
                <Button
                  data-testid="dashboard-close-button"
                  variant="outline"
                  className="h-fit p-2 dark:hover:bg-zinc-700"
                  onClick={onClose}
                >
                  <CrossIcon size={18} />
                </Button>

                <div className="flex flex-col">
                  <div className="font-medium">Node Output Dashboard</div>
                  <div className="text-sm text-muted-foreground">
                    {activeTab === 'workflow'
                      ? 'Data Processing Workflow'
                      : `${dashboardItems.length} item${dashboardItems.length !== 1 ? 's' : ''} from node outputs`}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid grid-cols-3 border-b bg-background rounded-none h-12">
                <TabsTrigger
                  value="artifacts"
                  className="flex items-center gap-2"
                >
                  <FileIcon size={16} />
                  Artifacts
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2"
                >
                  <ChartBarIcon size={16} />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="workflow"
                  className="flex items-center gap-2"
                >
                  <MenuIcon size={16} />
                  Workflow
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              <div className="flex-1 relative overflow-hidden">
                {/* Only mount the active tab to prevent unnecessary initialization */}
                {activeTab === 'dashboard' && (
                  <div className="absolute inset-0 m-0 flex flex-col overflow-auto">
                    {isLoadingDashboard ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-muted-foreground">
                          Loading dashboard items...
                        </div>
                      </div>
                    ) : (
                      <UnifiedDashboard
                        dashboardItems={dashboardItems}
                        onUpdateItem={handleUpdateDashboardItem}
                        onRemoveItem={handleRemoveDashboardItem}
                      />
                    )}
                  </div>
                )}
                {activeTab === 'workflow' && (
                  <div className="absolute inset-0 m-0 flex flex-col overflow-auto">
                    <WorkflowEditor
                      chatId={chatId}
                      session={session}
                      workflowData={currentWorkflowData}
                      onWorkflowUpdate={(newWorkflowData) => {
                        setCurrentWorkflowData(newWorkflowData);
                      }}
                    />
                  </div>
                )}
                {activeTab === 'artifacts' && (
                  <div className="absolute inset-0 m-0 flex flex-col overflow-auto">
                    <DashboardExport
                      dashboardItems={dashboardItems}
                      artifacts={artifacts}
                      onGenerateArtifact={handleGenerateArtifact}
                      onOpenArtifact={handleOpenArtifact}
                      onRemoveArtifact={handleRemoveArtifact}
                      isGenerating={isGeneratingArtifact}
                    />
                  </div>
                )}
              </div>
            </Tabs>

            {/* Artifact Modal */}
            {selectedArtifact && (
              <ArtifactViewer
                selectedArtifact={selectedArtifact}
                onCloseArtifact={() => setSelectedArtifact(null)}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Dashboard;
