'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateCategory, CreateTemplateRequest } from '@/lib/types';
import { SYSTEM_TEMPLATE_CATEGORIES } from '@/lib/templates';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflowData: {
    nodes: any[];
    edges: any[];
  };
  onTemplateSaved?: (templateId: string) => void;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  isOpen,
  onClose,
  workflowData,
  onTemplateSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TemplateCategory[]>(SYSTEM_TEMPLATE_CATEGORIES);
  const [formData, setFormData] = useState<Partial<CreateTemplateRequest>>({
    name: '',
    description: '',
    useCase: '',
    categoryId: '',
    tags: [],
    isPublic: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Load categories when dialog opens
  useEffect(() => {
    if (isOpen) {
      //loadCategories();
      setCategories(SYSTEM_TEMPLATE_CATEGORIES);
    }
  }, [isOpen]);
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || SYSTEM_TEMPLATE_CATEGORIES);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!workflowData.nodes.length) {
      toast.error('Cannot save empty workflow as template');
      return;
    }

    try {
      setLoading(true);
      
      const templateData: CreateTemplateRequest = {
        name: formData.name,
        description: formData.description,
        useCase: formData.useCase,
        categoryId: formData.categoryId,
        data: {
          nodes: workflowData.nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              label: node.data.label,
              factoryId: node.data.factoryId || node.data.factory?.getNodeMetadata().id,
              settings: node.data.settings || {},
              inputPorts: node.data.inputPorts,
              outputPorts: node.data.outputPorts,
              // Reset execution state for template
              status: 'idle',
              executed: false,
              outputs: undefined,
              error: undefined,
            },
          })),
          edges: workflowData.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
          metadata: {
            version: '1.0',
            templateType: 'user',
            createdFrom: 'workflow-editor',
          },
        },
        tags: formData.tags || [],
        isPublic: formData.isPublic || false,
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      const result = await response.json();
      toast.success('Template saved successfully!');
      
      if (onTemplateSaved) {
        onTemplateSaved(result.template.id);
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      useCase: '',
      categoryId: '',
      tags: [],
      isPublic: false,
    });
    setTagInput('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this workflow as a reusable template for future use.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              placeholder="Enter template name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this template does"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Use Case */}
          <div className="space-y-2">
            <Label htmlFor="useCase">Use Case</Label>
            <Textarea
              id="useCase"
              placeholder="When should users use this template?"
              value={formData.useCase}
              onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => removeTag(tag)}
                      >
                        <X size={12} />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Public/Private */}
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="public">Make this template public</Label>
          </div>

          {/* Workflow Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-1">Workflow Summary</div>
            <div className="text-xs text-muted-foreground">
              {workflowData.nodes.length} nodes, {workflowData.edges.length} connections
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 