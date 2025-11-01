"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileStack, Star, Clock, Users, Layers, ChevronDown, ChevronRight } from "lucide-react"
import { Portal } from "@/components/workflow/portal"
import { toast } from "sonner"
import type { WorkflowTemplate, TemplateCategory } from "@/lib/types"
import { getSystemTemplates, getSystemTemplateCategories } from "@/lib/templates"

interface TemplatePaletteProps {
  isOpen: boolean
  onClose: () => void
  onTemplateUse?: (template: WorkflowTemplate) => void
}

interface TemplateCardProps {
  template: WorkflowTemplate
  onUse?: (template: WorkflowTemplate) => void
}

interface TooltipPosition {
  x: number
  y: number
}

interface CategoryState {
  [key: string]: boolean
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const tooltipWidth = 320
      const tooltipHeight = 280

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

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const templateDragData = `template:${template.id}`
      event.dataTransfer.setData("application/reactflow", templateDragData)
      event.dataTransfer.effectAllowed = "move"
    },
    [template],
  )

  const handleClick = useCallback(() => {
    if (onUse) {
      onUse(template)
    }
  }, [template, onUse])

  return (
    <>
      <div
        ref={cardRef}
        className="group relative p-3 border border-border rounded-lg cursor-grab hover:border-border/80 hover:shadow-sm transition-all duration-200 select-none bg-card hover:bg-muted/50"
        role="button"
        tabIndex={0}
        draggable={true}
        onDragStart={handleDragStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-muted group-hover:bg-muted/80 transition-colors duration-200 flex-shrink-0">
              <FileStack size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground leading-tight mb-1 truncate">{template.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{template.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Layers size={12} />
                <span>{template.data.nodes.length}</span>
              </div>
              {template.usageCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{template.usageCount}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {template.isPublic && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border-border">
                  <Star size={10} className="mr-1" />
                  Public
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border-border"
                >
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 2 && (
                <span className="text-xs text-muted-foreground/70 self-center">+{template.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating tooltip */}
      {isHovered && (
        <Portal>
          <div
            className="fixed z-[9999] w-80 p-4 bg-popover border border-border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
            role="tooltip"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  <FileStack size={18} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base text-popover-foreground leading-tight">{template.name}</h4>
                  {template.category && <p className="text-xs text-muted-foreground mt-1">{template.category.name}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
                {template.useCase && (
                  <div className="p-3 bg-muted rounded-md border border-border">
                    <p className="text-xs text-foreground leading-relaxed">
                      <strong>Use Case:</strong> {template.useCase}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers size={12} />
                    <span>{template.data.nodes.length} nodes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{template.usageCount} uses</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}

export const TemplatePalette: React.FC<TemplatePaletteProps> = ({ isOpen, onClose, onTemplateUse }) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<CategoryState>({})

  // Load templates and categories
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)

        const systemTemplates = getSystemTemplates()
        const systemCategories = getSystemTemplateCategories()

        const response = await fetch("/api/templates")
        let userTemplates: WorkflowTemplate[] = []
        let dbCategories: TemplateCategory[] = []

        if (response.ok) {
          const data = await response.json()
          userTemplates = data.templates || []
          dbCategories = data.categories || []
        } else {
          console.warn("Failed to load user templates from database")
        }

        const allTemplates = [...systemTemplates, ...userTemplates]

        const allCategories = [...systemCategories]
        dbCategories.forEach((dbCat) => {
          if (!systemCategories.some((sysCat) => sysCat.id === dbCat.id)) {
            allCategories.push(dbCat)
          }
        })

        allCategories.sort((a, b) => a.displayOrder - b.displayOrder)

        setTemplates(allTemplates)
        setCategories(allCategories)
      } catch (error) {
        console.error("Failed to load templates:", error)
        toast.error("Failed to load templates")
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  // Filter templates based on search
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  // Group templates by category
  const templatesByCategory = new Map<string, WorkflowTemplate[]>()
  filteredTemplates.forEach((template) => {
    const categoryId = template.categoryId
    if (!templatesByCategory.has(categoryId)) {
      templatesByCategory.set(categoryId, [])
    }
    templatesByCategory.get(categoryId)?.push(template)
  })

  // Initialize expanded state for all categories
  const initializeExpandedState = useCallback(() => {
    const initialState: CategoryState = {}
    templatesByCategory.forEach((_, categoryId) => {
      if (!(categoryId in expandedCategories)) {
        initialState[categoryId] = true // Default to expanded
      }
    })
    if (Object.keys(initialState).length > 0) {
      setExpandedCategories((prev) => ({ ...prev, ...initialState }))
    }
  }, [templatesByCategory, expandedCategories])

  // Initialize expanded state when categories change
  useEffect(() => {
    initializeExpandedState()
  }, [initializeExpandedState])

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }, [])

  const handleTemplateUse = useCallback(
    async (template: WorkflowTemplate) => {
      try {
        await fetch(`/api/templates/${template.id}/use`, {
          method: "POST",
        })

        if (onTemplateUse) {
          onTemplateUse(template)
        }

        toast.success(`Using template: ${template.name}`)
      } catch (error) {
        console.error("Failed to track template usage:", error)
        if (onTemplateUse) {
          onTemplateUse(template)
        }
      }
    },
    [onTemplateUse],
  )

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
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-muted border-border focus:border-ring text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading templates...</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileStack size={40} className="text-muted-foreground/50 mb-3" />
              <div className="text-sm text-muted-foreground">
                {searchTerm ? "No templates found" : "No templates available"}
              </div>
            </div>
          ) : (
            Array.from(templatesByCategory.entries()).map(([categoryId, categoryTemplates]) => {
              const category = categories.find((c) => c.id === categoryId)
              return (
                <div key={categoryId} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors duration-200 group"
                  >
                    {expandedCategories[categoryId] ? (
                      <ChevronDown size={16} className="text-muted-foreground group-hover:text-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                    )}
                    <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">
                      {category?.name || "Other"}
                    </h3>
                    <div className="flex-1 h-px bg-border ml-2" />
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {categoryTemplates.length}
                    </span>
                  </button>

                  {/* Template List */}
                  {expandedCategories[categoryId] && (
                    <div className="space-y-2 ml-4">
                      {categoryTemplates.map((template) => (
                        <TemplateCard key={template.id} template={template} onUse={handleTemplateUse} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          Drag templates to your workflow
        </div>
      </div>
    </div>
  )
}
