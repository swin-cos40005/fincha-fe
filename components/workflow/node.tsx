'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Handle, Position } from 'reactflow';
import { Button } from '@/components/ui/button';
import { LoaderIcon, EyeIcon, PlayIcon, NodeIcon } from '@/components/icons';
import { SettingsIcon, Copy, Trash2 } from 'lucide-react';

import { Portal } from '@/components/workflow/portal';
import type { DataTableType } from '@/lib/types';

export interface NodeData {
  label: string;
  factory: any;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  image?: string; // URL or path to image
  status?: 'idle' | 'executing' | 'success' | 'error' | 'warning';
  executed?: boolean;
  outputs?: DataTableType[];
  error?: string;
  inputPorts: number;
  outputPorts: number;
  settings?: any;
  onConfigure: (nodeId: string) => void;
  onViewResult?: (nodeId: string) => void;
  onExecute?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  connectedInputs?: Set<string>; // Track which input ports are connected
  connectedOutputs?: Set<string>; // Track which output ports are connected
}

export interface NodeProps {
  id: string;
  data: NodeData;
  selected?: boolean;
}

interface ToolboxPosition {
  x: number;
  y: number;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

// Custom port components - FIXED PUZZLE DESIGN
const TriangleOutputPort: React.FC<{ connected?: boolean }> = ({
  connected,
}) => (
  <div
    className="absolute flex items-center justify-center"
    style={{
      width: '16px',
      height: '16px',
    }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16">
      <polygon
        points="2,2 12,8 2,12"
        fill={connected ? '#10b981' : '#f97316'}
        stroke="white"
        strokeWidth="2"
        className="drop-shadow-sm"
      />
    </svg>
  </div>
);

const SquareInputPort: React.FC<{ connected?: boolean }> = ({ connected }) => (
  <div
    className="absolute flex items-center justify-center"
    style={{
      width: '16px',
      height: '16px',
    }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16">
      {connected ? (
        // Complete square when connected
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          fill="#10b981"
          stroke="white"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      ) : (
        // Square with triangular notch on the left that matches the output triangle
        <path
          d="M 2 2 L 14 2 L 14 14 L 2 14 L 2 12 L 8 8 L 2 4 Z"
          fill="#8b5cf6"
          stroke="white"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      )}
    </svg>
  </div>
);

// Component to render either image or icon
const NodeDisplay: React.FC<{
  image?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  size: number;
  className?: string;
}> = ({ image, icon, size, className }) => {
  const [imageError, setImageError] = useState(false);

  if (image && !imageError) {
    return (
      <Image
        src={image}
        alt="Node"
        width={size}
        height={size}
        className={`object-contain ${className || ''}`}
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    );
  }

  const IconComponent = icon || NodeIcon;
  return <IconComponent size={size} className={className} />;
};

export const Node: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [showToolbox, setShowToolbox] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [toolboxPosition, setToolboxPosition] = useState<ToolboxPosition>({
    x: 0,
    y: 0,
  });
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const {
    label,
    status = 'idle',
    executed = false,
    outputs,
    error,
    inputPorts,
    outputPorts,
    onConfigure,
    onViewResult,
    onExecute,
    onDuplicate,
    onDelete,
    connectedInputs = new Set(),
    connectedOutputs = new Set(),
  } = data;

  // Get node border style based on status
  const getNodeBorderStyle = () => {
    if (selected) {
      return 'ring-2 ring-blue-500 ring-offset-2';
    }
    switch (status) {
      case 'executing':
        return 'border-blue-500 shadow-blue-200 shadow-lg';
      case 'success':
        return 'border-green-500 shadow-green-200 shadow-lg';
      case 'error':
        return 'border-red-500 shadow-red-200 shadow-lg';
      case 'warning':
        return 'border-yellow-500 shadow-yellow-200 shadow-lg';
      default:
        return 'border-border hover:border-accent-foreground/20';
    }
  };

  const handleMouseEnter = useCallback(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - 100; // Center the toolbox (200px width / 2)
      const y = rect.top - 50; // Position above the node

      setToolboxPosition({ x, y });
      setShowToolbox(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowToolbox(false);
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        ref={nodeRef}
        className="custom-node relative"
        role="button"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleContextMenu(e as any);
          }
        }}
      >
        {' '}
        {/* Main Node Container */}
        <div className="flex flex-col items-center gap-2">
          {/* Square Node Body - Made larger */}
          <div
            className={`
    relative size-16 bg-background border-2 rounded-lg 
    flex items-center justify-center transition-all duration-200
    hover:shadow-md ${getNodeBorderStyle()}
  `}
          >
            {/* Input Handles with Custom Puzzle Ports - positioned relative to this 64px square only */}
            {Array.from({ length: inputPorts }).map((_, i) => {
              const portId = `target-${i}`;
              const isConnected = connectedInputs.has(portId);
              // Calculate position relative to the 64px square only
              const portTop = 8 + i * (48 / Math.max(inputPorts - 1, 1)); // 8px from top, spread across 48px height

              return (
                <div
                  key={portId}
                  className="absolute"
                  style={{ top: portTop, left: -8 }}
                >
                  {/* Visual port */}
                  <div
                    className="absolute"
                    style={{
                      width: '16px',
                      height: '16px',
                      zIndex: 1,
                      pointerEvents: 'none',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <SquareInputPort connected={isConnected} />
                  </div>
                  {/* Invisible handle on top for interactions */}
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={portId}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: 'none',
                      zIndex: 10,
                      background: 'transparent',
                      cursor: 'crosshair',
                      transform: 'translateX(0%)',
                    }}
                  />
                </div>
              );
            })}

            {/* Output Handles with Custom Triangle Ports - positioned relative to this 64px square only */}
            {Array.from({ length: outputPorts }).map((_, i) => {
              const portId = `source-${i}`;
              const isConnected = connectedOutputs.has(portId);
              // Calculate position relative to the 64px square only
              const portTop = 8 + i * (16 / Math.max(outputPorts - 1, 1));

              return (
                <div
                  key={portId}
                  className="absolute"
                  style={{ top: portTop, right: -8 }}
                >
                  {/* Visual port */}
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      zIndex: 1,
                      pointerEvents: 'none',
                      transform: 'translateX(50%)',
                    }}
                  >
                    <TriangleOutputPort connected={isConnected} />
                  </div>
                  {/* Invisible handle on top for interactions */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={portId}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: 'none',
                      background: 'transparent',
                      zIndex: 10,
                      cursor: 'crosshair',
                    }}
                  />
                </div>
              );
            })}

            {/* Node Icon - Made bigger */}
            <div className="flex items-center justify-center">
              {status === 'executing' ? (
                <div className="animate-spin">
                  <LoaderIcon size={32} />
                </div>
              ) : (
                <NodeDisplay
                  image={data.image}
                  icon={data.icon}
                  size={32}
                  className="text-primary"
                />
              )}
            </div>

            {/* Configuration status indicator */}
            {data.settings && Object.keys(data.settings).length > 0 && (
              <div
                className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full border border-background"
                title="Configured"
              />
            )}
          </div>

          {/* Node Label */}
          <div className="text-xs font-medium text-center max-w-28 truncate">
            {label}
          </div>

          {/* Error Message */}
          {status === 'error' && error && (
            <div
              className="text-xs text-red-500 text-center max-w-28 truncate"
              title={error}
            >
              {error}
            </div>
          )}

          {/* Output Summary */}
          {outputs && outputs.length > 0 && status === 'success' && (
            <div className="text-xs text-muted-foreground text-center">
              {outputs.reduce((total, output) => total + output.rows.length, 0)}{' '}
              rows
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbox */}
      {showToolbox && (
        <Portal>
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-xl p-2 flex items-center gap-1 animate-in fade-in-0 zoom-in-95 duration-200"
            role="toolbar"
            style={{
              left: toolboxPosition.x,
              top: toolboxPosition.y,
            }}
            onMouseEnter={() => setShowToolbox(true)}
            onMouseLeave={() => setShowToolbox(false)}
          >
            {onExecute && (
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0"
                onClick={() => onExecute(id)}
                disabled={status === 'executing'}
                title="Execute node"
              >
                <PlayIcon size={14} />
              </Button>
            )}

            {onViewResult && (
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0"
                onClick={() => onViewResult(id)}
                disabled={!executed || status === 'error'}
                title="View results"
              >
                <EyeIcon size={14} />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="size-8 p-0"
              onClick={() => onConfigure(id)}
              title="Configure node"
            >
              <SettingsIcon size={14} />
            </Button>
          </div>
        </Portal>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <Portal>
          {' '}
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-xl py-2 min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
          >
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b mb-1">
              {label}
            </div>
            {onExecute && (
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                onClick={() => {
                  onExecute(id);
                  handleCloseContextMenu();
                }}
                disabled={status === 'executing'}
              >
                <PlayIcon size={14} />
                Execute
              </button>
            )}
            {onViewResult && (
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                onClick={() => {
                  onViewResult(id);
                  handleCloseContextMenu();
                }}
                disabled={!executed || status === 'error'}
              >
                <EyeIcon size={14} />
                View Results
              </button>
            )}
            <button
              type="button"
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                onConfigure(id);
                handleCloseContextMenu();
              }}
            >
              <SettingsIcon size={14} />
              Configure
            </button>
            <div className="border-t my-1" />{' '}
            {onDuplicate && (
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                onClick={() => {
                  onDuplicate(id);
                  handleCloseContextMenu();
                }}
              >
                <Copy size={14} />
                Duplicate
              </button>
            )}{' '}
            {onDelete && (
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent text-red-600 hover:text-red-700 flex items-center gap-2"
                onClick={() => {
                  onDelete(id);
                  handleCloseContextMenu();
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </Portal>
      )}
    </>
  );
};

export default Node;
