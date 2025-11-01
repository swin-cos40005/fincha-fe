import { TerminalWindowIcon, LoaderIcon, CrossSmallIcon } from './icons';
import { Button } from './ui/button';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

export interface ConsoleOutputContent {
  type: 'text' | 'image';
  value: string;
}

export interface ConsoleOutput {
  id: string;
  status: 'in_progress' | 'loading_packages' | 'completed' | 'failed';
  contents: Array<ConsoleOutputContent>;
}

interface ConsoleProps {
  consoleOutputs: Array<ConsoleOutput>;
  setConsoleOutputs: Dispatch<SetStateAction<Array<ConsoleOutput>>>;
}

export function Console({ consoleOutputs, setConsoleOutputs }: ConsoleProps) {
  const [height, setHeight] = useState<number>(300);
  const [isResizing, setIsResizing] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const minHeight = 100;
  const maxHeight = 600;

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && consoleRef.current) {
        const consoleRect = consoleRef.current.getBoundingClientRect();
        const newHeight = consoleRect.bottom - e.clientY;
        
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          setHeight(newHeight);
        }
      }
    },
    [isResizing, minHeight, maxHeight],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
      };
    }
  }, [resize, stopResizing, isResizing]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutputs]);

  // Don't render if no outputs
  if (consoleOutputs.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Resize handle */}
      <div
        className={cn(
          "w-full h-2 cursor-ns-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center border-t border-gray-300 dark:border-gray-600",
          {
            'select-none bg-blue-500/20': isResizing,
          }
        )}
        onMouseDown={startResizing}
        role="slider"
        aria-valuenow={height}
        title={`Resize console (${height}px)`}
      >
        <div className="w-12 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
      </div>

      {/* Console container */}
      <div
        ref={consoleRef}
        className={cn(
          'w-full flex flex-col bg-gray-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-600 overflow-hidden',
          {
            'select-none': isResizing,
          },
        )}
        style={{ height: height }}
      >
        {/* Console header */}
        <div className="flex flex-row justify-between items-center w-full h-10 border-b border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 shrink-0">
          <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-row gap-2 items-center">
            <TerminalWindowIcon size={16} />
            <span className="font-medium">Console</span>
          </div>
          <Button
            variant="ghost"
            className="size-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            size="icon"
            onClick={() => setConsoleOutputs([])}
          >
            <CrossSmallIcon size={14} />
          </Button>
        </div>

        {/* Console content */}
        <div className="flex-1 overflow-y-auto">
          {consoleOutputs.map((consoleOutput, index) => (
            <div
              key={consoleOutput.id}
              className="px-4 py-3 flex flex-row text-sm border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono"
            >
              <div
                className={cn('w-12 shrink-0 text-xs', {
                  'text-gray-500 dark:text-gray-400': [
                    'in_progress',
                    'loading_packages',
                  ].includes(consoleOutput.status),
                  'text-emerald-600 dark:text-emerald-400': consoleOutput.status === 'completed',
                  'text-red-600 dark:text-red-400': consoleOutput.status === 'failed',
                })}
              >
                [{index + 1}]
              </div>
              {['in_progress', 'loading_packages'].includes(
                consoleOutput.status,
              ) ? (
                <div className="flex flex-row gap-2 items-center">
                  <div className="animate-spin">
                    <LoaderIcon size={14} />
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {consoleOutput.status === 'in_progress'
                      ? 'Initializing...'
                      : consoleOutput.status === 'loading_packages'
                        ? consoleOutput.contents.map((content) =>
                            content.type === 'text' ? content.value : null,
                          )
                        : null}
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100 w-full flex flex-col gap-2 overflow-x-auto">
                  {consoleOutput.contents.map((content, contentIndex) =>
                    content.type === 'image' ? (
                      <picture key={`${consoleOutput.id}-${contentIndex}`}>
                        <img
                          src={content.value}
                          alt="output"
                          className="rounded-md max-w-full w-full border border-gray-300 dark:border-gray-600"
                        />
                      </picture>
                    ) : (
                      <div
                        key={`${consoleOutput.id}-${contentIndex}`}
                        className="whitespace-pre-line break-words w-full"
                      >
                        {content.value}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
}