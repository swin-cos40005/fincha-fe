"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NodeIcon } from "@/components/icons"
import { Portal } from "@/components/workflow/portal"
import { NodeRegistry, type NodeFactory } from "@/lib/nodes/core"
import LoadingWrapper from "@/components/ui/loading-wrapper"

interface NodePaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface NodeCardProps {
  factory: NodeFactory<any>
}

interface TooltipPosition {
  x: number
  y: number
}

interface CategoryState {
  [key: string]: boolean
}

const NodeCard: React.FC<NodeCardProps> = ({ factory }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  })
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const metadata = factory.getNodeMetadata()

  // Component to render either icon or image
  const NodeDisplay = ({ size, className }: { size: number; className?: string }) => {
    if (metadata.image && !imageError) {
      return (
        <Image
          src={metadata.image || "/placeholder.svg"}
          alt={metadata.name}
          width={size}
          height={size}
          className={`object-contain ${className || ""}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      )
    }
    const IconComponent = metadata.icon || NodeIcon
    return <IconComponent size={size} className={className} />
  }

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const tooltipWidth = 280
      const tooltipHeight = 200

      let x = rect.right + 12
      let y = rect.top

      if (x + tooltipWidth > viewportWidth) {
        x = rect.left - tooltipWidth - 12
      }

      if (y + tooltipHeight > viewportHeight) {
        y = viewportHeight - tooltipHeight - 12
      }

      if (y < 12) {
        y = 12
      }

      setTooltipPosition({ x, y })
      setIsHovered(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <>
      <div
        ref={cardRef}
        className="group relative p-3 border border-border rounded-lg cursor-grab hover:border-border/80 hover:shadow-sm transition-all duration-200 select-none bg-card hover:bg-muted/50"
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("application/reactflow", metadata.id)
          event.dataTransfer.effectAllowed = "move"
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted group-hover:bg-muted/80 transition-colors duration-200">
            <NodeDisplay size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{metadata.name}</div>
          </div>
        </div>
      </div>

      {/* Floating tooltip */}
      {isHovered && (
        <Portal>
          <div
            className="fixed z-[9999] w-70 p-4 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
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
                  <NodeDisplay size={18} className="text-muted-foreground" />
                </div>
                <div className="font-semibold text-base text-popover-foreground">{metadata.name}</div>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">{factory.getNodeShortDescription()}</div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}

export const NodePalette: React.FC<NodePaletteProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<CategoryState>({})

  const registry = NodeRegistry.getInstance()

  // Group nodes by category and filter by search
  const nodesByCategory = new Map<string, NodeFactory<any>[]>()
  registry.getAllFactories().forEach((factory) => {
    const metadata = factory.getNodeMetadata()
    const matchesSearch =
      !searchTerm ||
      metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      metadata.category.toLowerCase().includes(searchTerm.toLowerCase())

    if (matchesSearch) {
      const category = metadata.category
      if (!nodesByCategory.has(category)) {
        nodesByCategory.set(category, [])
      }
      nodesByCategory.get(category)?.push(factory)
    }
  })

  // Initialize expanded state for all categories
  const initializeExpandedState = useCallback(() => {
    const initialState: CategoryState = {}
    nodesByCategory.forEach((_, category) => {
      if (!(category in expandedCategories)) {
        initialState[category] = true // Default to expanded
      }
    })
    if (Object.keys(initialState).length > 0) {
      setExpandedCategories((prev) => ({ ...prev, ...initialState }))
    }
  }, [nodesByCategory, expandedCategories])

  // Initialize expanded state when categories change
  useEffect(() => {
    initializeExpandedState()
  }, [initializeExpandedState])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-muted border-border focus:border-ring text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <LoadingWrapper onLoad={() => setLoading(false)}>
            {nodesByCategory.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <NodeIcon size={40} className="text-muted-foreground/50 mb-3" />
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? "No nodes found" : "No nodes available"}
                </div>
              </div>
            ) : (
              Array.from(nodesByCategory.entries()).map(([category, factories]) => (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors duration-200 group"
                  >
                    {expandedCategories[category] ? (
                      <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                    )}
                    <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">{category}</h3>
                    <div className="flex-1 h-px bg-border ml-2" />
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {factories.length}
                    </span>
                  </button>

                  {/* Node List */}
                  {expandedCategories[category] && (
                    <div className="space-y-1 ml-4">
                      {factories.map((factory) => (
                        <NodeCard key={factory.getNodeMetadata().id} factory={factory} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </LoadingWrapper>
        </div>
      </ScrollArea>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Loading nodes...</div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">Drag nodes to add them to your workflow</div>
      </div>
    </div>
  )
}
