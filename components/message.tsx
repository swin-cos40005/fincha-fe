'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import { AvailableNodesDisplay } from './available-nodes-display';
import type { UseChatHelpers } from '@ai-sdk/react';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;
              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              Creating chart document...
                            </span>
                          </div>
                          <pre className="text-xs text-muted-foreground overflow-auto">
                            {JSON.stringify(args, null, 2)}
                          </pre>
                        </div>
                      ) : toolName.startsWith('view') &&
                        (toolName.includes('Categories') ||
                          toolName.includes('Nodes') ||
                          toolName.includes('NodeDetails') ||
                          toolName.includes('NodeResult')) ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">🔍</div>
                          <div className="text-left">Querying workflow information...</div>
                        </div>
                      ) : toolName === 'modifyWorkflow' ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">🔧</div>
                          <div className="text-left">Modifying workflow...</div>
                        </div>
                      ) : toolName === 'executeWorkflow' ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">⚡</div>
                          <div className="text-left">Executing workflow...</div>
                        </div>
                      ) : toolName === 'readDashboardData' ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">📊</div>
                          <div className="text-left">Reading dashboard data...</div>
                        </div>
                      ) : toolName === 'generateDashboardReport' ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">📄</div>
                          <div className="text-left">Generating dashboard report...</div>
                        </div>
                      ) : toolName === 'captureChartScreenshot' ? (
                        <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                          <div className="text-muted-foreground mt-1">📸</div>
                          <div className="text-left">Analyzing chart...</div>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <div className="space-y-4">
                          {result.error ? (
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="text-red-500 text-sm">
                                Error: {result.error}
                              </div>
                            </div>
                          ) : result.chart ? (
                            // Display the created chart if available
                            <>
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="size-2 bg-green-500 rounded-full" />
                                  <span className="text-sm font-medium text-green-800">
                                    Chart Created Successfully
                                  </span>
                                </div>
                                {result.message && (
                                  <div className="text-xs text-green-700">
                                    {result.message}
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            // Display configuration results without chart
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  Chart Configuration Results
                                </span>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium mb-2">
                                  Chart:{' '}
                                  {result.chartConfig?.title ||
                                    'Untitled Chart'}
                                </div>
                                <div className="text-muted-foreground">
                                  Type:{' '}
                                  {result.chartConfig?.chartType || 'Unknown'} |
                                  Columns:{' '}
                                  {result.chartConfig?.dataMapping
                                    ? Object.values(
                                        result.chartConfig.dataMapping,
                                      )
                                        .flat()
                                        .join(', ')
                                    : 'N/A'}
                                </div>
                                {result.message && (
                                  <div className="text-xs text-muted-foreground mt-2">
                                    {result.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                      // : toolName === 'modifyWorkflow' ? (
                      //   <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                      //     <div className="text-muted-foreground mt-1">🔧</div>
                      //     <div className="text-left">
                      //       {result.createdNodes?.length > 0 || result.createdEdges?.length > 0 
                      //         ? `Modified workflow (${(result.createdNodes?.length || 0) + (result.createdEdges?.length || 0)} changes)`
                      //         : 'Modified workflow'
                      //       }
                      //     </div>
                      //   </div>
                      // ) 
                      // : toolName === 'executeWorkflow' ? (
                      //   <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                      //     <div className="text-muted-foreground mt-1">⚡</div>
                      //     <div className="text-left">
                      //       {result.successCount !== undefined 
                      //         ? `Executed workflow (${result.successCount} successful)`
                      //         : 'Executed workflow'
                      //       }
                      //     </div>
                      //   </div>
                      // ) 
                      // : toolName === 'readDashboardData' ? (
                      //   <div className="bg-background border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start">
                      //     <div className="text-muted-foreground mt-1">📊</div>
                      //     <div className="text-left">
                      //       {result.totalItems > 0 
                      //         ? `Analyzed dashboard data (${result.totalItems} items)`
                      //         : 'Analyzed dashboard data'
                      //       }
                      //     </div>
                      //   </div>
                      // ) 
                      : toolName === 'captureChartScreenshot' ? (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              📊 Analyzing chart
                            </span>
                          </div>
                          {result.success && result.screenshot && (
                            <div className="mt-3">
                              {result.screenshot.base64 ? (
                                <img 
                                  src={result.screenshot.base64} 
                                  alt="Chart analysis" 
                                  className="w-full rounded border"
                                />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Chart captured ({result.screenshot.width}×{result.screenshot.height})
                                </div>
                              )}
                            </div>
                          )}
                          {!result.success && result.error && (
                            <div className="mt-2 text-sm text-red-600">
                              {result.error}
                            </div>
                          )}
                        </div>
                      ) : toolName === 'viewAvailableNodes' ? (
                        result.success && result.data && result.data.nodes ? (
                          <AvailableNodesDisplay 
                            nodes={result.data.nodes} 
                            category={toolInvocation.args?.category}
                          />
                        ) : (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-red-600">
                                ❌ Error loading nodes
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.error || 'Failed to load available nodes'}
                            </div>
                          </div>
                        )
                      ) : toolName === 'viewAvailableCategories' ? (
                        result.success && result.data && result.data.categories ? (
                          <div className="p-4 bg-card border border-border rounded-lg">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="text-muted-foreground">📂</span>
                                Available Node Categories
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Explore workflow nodes by category
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {result.data.categories.map((category: string) => (
                                <div key={category} className="p-3 bg-muted rounded-lg">
                                  <div className="font-medium text-sm">{category}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                              <p className="text-xs text-muted-foreground text-center">
                                💡 Use viewAvailableNodes with a category to see specific nodes
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-red-600">
                                ❌ Error loading categories
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.error || 'Failed to load available categories'}
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              Tool Result: {toolName}
                            </span>
                          </div>
                          <pre className="text-xs text-muted-foreground overflow-auto max-h-64">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
