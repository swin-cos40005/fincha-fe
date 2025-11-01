'use client';

import type React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NodeIcon } from '@/components/icons';
import { NodePalette } from './node-palette';
import { TemplatePalette } from './template-palette';
import type { WorkflowTemplate } from '@/lib/types';
import { FileStack, Layers } from 'lucide-react';

interface TabbedPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateUse?: (template: WorkflowTemplate) => void;
}

export const TabbedPalette: React.FC<TabbedPaletteProps> = ({
  isOpen,
  onClose,
  onTemplateUse,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-80 border-r bg-white dark:bg-background h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-muted">
              <Layers size={18} className="text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Palette</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 hover:bg-gray-900 dark:hover:bg-muted rounded-md"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="nodes" className="h-full flex flex-col">
          {/* Tab List */}
          <div className="px-4 pt-3 pb-0">
            <TabsList className="grid w-full grid-cols-2 h-10 bg-muted p-1">
              <TabsTrigger 
                value="nodes" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
              >
                <NodeIcon size={14} />
                Nodes
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
              >
                <FileStack size={14} />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="nodes" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-hidden">
                <NodePaletteContent />
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="h-full m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 overflow-hidden">
                <TemplatePaletteContent onTemplateUse={onTemplateUse} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

// Extracted content components without headers to avoid duplication
const NodePaletteContent: React.FC = () => {
  return (
    <div className="h-full">
      <NodePalette isOpen={true} onClose={() => {}} />
    </div>
  );
};

const TemplatePaletteContent: React.FC<{ onTemplateUse?: (template: WorkflowTemplate) => void }> = ({ onTemplateUse }) => {
  return (
    <div className="h-full">
      <TemplatePalette isOpen={true} onClose={() => {}} onTemplateUse={onTemplateUse} />
    </div>
  );
};