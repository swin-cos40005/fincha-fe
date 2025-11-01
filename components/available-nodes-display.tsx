'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { NodeIcon } from '@/components/icons';
import { Portal } from '@/components/workflow/portal';
import { NodeRegistry } from '@/lib/nodes/node-registry';

interface NodeData {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  detailedDescription: string;
  inputPorts: number;
  outputPorts: number;
  keywords: string[];
  configurationSchema?: any;
}

interface AvailableNodesDisplayProps {
  category?: string;
  nodes: NodeData[];
}

interface NodeCardProps {
  node: NodeData;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const NodeCard: React.FC<NodeCardProps> = ({ node }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get the actual metadata from the node registry to access icon/image
  const getNodeMetadata = (nodeId: string) => {
    const registry = NodeRegistry.getInstance();
    const factory = registry.getFactory(nodeId);
    return factory?.getNodeMetadata();
  };

  const NodeDisplay = ({ size, className }: { size: number; className?: string }) => {
    const metadata = getNodeMetadata(node.id);
    
    if (metadata?.image && !imageError) {
      return (
        <Image
          src={metadata.image}
          alt={metadata.name}
          width={size}
          height={size}
          className={`object-contain ${className || ""}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      );
    }
    
    const IconComponent = metadata?.icon || NodeIcon;
    return <IconComponent size={size} className={className} />;
  };

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 300;
      const tooltipHeight = 120;

      let x = rect.right + 12;
      let y = rect.top;

      // Adjust position if tooltip would go off screen
      if (x + tooltipWidth > viewportWidth) {
        x = rect.left - tooltipWidth - 12;
      }

      if (y + tooltipHeight > viewportHeight) {
        y = viewportHeight - tooltipHeight - 12;
      }

      if (y < 12) {
        y = 12;
      }

      setTooltipPosition({ x, y });
      setIsHovered(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        className="group relative p-3 border border-border rounded-lg cursor-pointer hover:border-border/80 hover:shadow-md transition-all duration-200 select-none bg-card hover:bg-muted/50 aspect-square flex flex-col items-center justify-center gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Node Icon */}
        <div className="p-3 rounded-md bg-muted group-hover:bg-muted/80 transition-colors duration-200">
          <NodeDisplay size={24} className="text-muted-foreground" />
        </div>
        
        {/* Node Name */}
        <div className="text-xs font-medium text-foreground text-center truncate max-w-full">
          {node.name}
        </div>
      </div>

      {/* Floating tooltip */}
      {isHovered && (
        <Portal>
          <div
            className="fixed z-[9999] w-[300px] p-4 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
            role="tooltip"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <NodeDisplay size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-base text-popover-foreground">{node.name}</div>
                  <div className="text-xs text-muted-foreground">{node.category}</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground leading-relaxed">
                {node.shortDescription}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Inputs: {node.inputPorts}</span>
                <span>Outputs: {node.outputPorts}</span>
              </div>
              
              {node.keywords && node.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {node.keywords.slice(0, 4).map((keyword, index) => (
                    <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                      {keyword}
                    </span>
                  ))}
                  {node.keywords.length > 4 && (
                    <span className="px-2 py-1 bg-muted rounded text-xs">
                      +{node.keywords.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export const AvailableNodesDisplay: React.FC<AvailableNodesDisplayProps> = ({
  category,
  nodes,
}) => {
  // Group nodes by category
  const nodesByCategory = nodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeData[]>);

  // Handle empty nodes case
  if (nodes.length === 0) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Showing nodes in category: <span className="font-medium">{category || 'All'}</span>
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <NodeIcon size={48} className="text-muted-foreground/50 mb-4" />
          <div className="text-sm text-muted-foreground">
            {category ? `No nodes found in category "${category}"` : 'No workflow nodes available'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            Showing nodes in category: <span className="font-medium">{category || 'All'}</span>
        </h3>
        {!category && (
          <p className="text-sm text-muted-foreground mt-1">
            Showing all available nodes
          </p>
        )}
      </div>

      {/* Node Grid by Category */}
      <div className="space-y-6">
        {Object.entries(nodesByCategory).map(([categoryName, categoryNodes]) => (
          <div key={categoryName}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium text-foreground uppercase tracking-wide">
                {categoryName}
              </h4>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {categoryNodes.length} nodes
              </span>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {categoryNodes.map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          💡 Hover over nodes to see detailed descriptions and configuration options
        </p>
      </div>
    </div>
  );
}; 