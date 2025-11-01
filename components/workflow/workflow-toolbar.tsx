import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlayIcon,
  DownloadIcon,
  MenuIcon,
  ReloadIcon,
} from '@/components/icons';
import { Loader, Upload, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowToolbarProps {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onExecuteWorkflow: () => void;
  onResetWorkflow: () => void;
  onExportWorkflow?: () => void;
  onImportWorkflow?: (workflowData: any) => void;
  onSaveTemplate?: () => void;
  isSaving: boolean;
  shouldSave: boolean;
  readonly?: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  drawerOpen,
  onToggleDrawer,
  onExecuteWorkflow,
  onResetWorkflow,
  onExportWorkflow,
  onImportWorkflow,
  onSaveTemplate,
  isSaving,
  shouldSave,
  readonly = false,
}) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportWorkflow = () => {
    if (onExportWorkflow) {
      onExportWorkflow();
    } else {
      toast.error('Export functionality not available');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const workflowData = JSON.parse(text);

      // Basic validation
      if (!workflowData.nodes || !workflowData.edges) {
        throw new Error('Invalid workflow format: missing nodes or edges');
      }

      if (onImportWorkflow) {
        onImportWorkflow(workflowData);
        toast.success('Workflow imported successfully!');
      } else {
        toast.error('Import functionality not available');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import workflow: Invalid file format');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="border-b bg-background p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDrawer}
            className={drawerOpen ? 'hidden' : ''}
          >
            <MenuIcon size={16} />
          </Button>

          <h1 className="text-lg font-semibold">
            {readonly ? 'Workflow Viewer' : 'Workflow Editor'}
          </h1>
          {readonly && <Badge variant="secondary">Read-only</Badge>}
        </div>

        <div className="flex items-center gap-1">
          {!readonly && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExecuteWorkflow}
                title="Execute Workflow"
              >
                <PlayIcon size={16} />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onResetWorkflow}
                title="Reset Workflow"
              >
                <ReloadIcon size={16} />
              </Button>

              {/* Export workflow button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportWorkflow}
                title="Download Workflow"
              >
                <DownloadIcon size={16} />
              </Button>

              {/* Import workflow button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportClick}
                disabled={importing}
                title="Import Workflow"
              >
                {importing ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
              </Button>

              {/* Save as template button */}
              {onSaveTemplate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveTemplate}
                  title="Save as Template"
                >
                  <Bookmark size={16} />
                </Button>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Auto-save indicator */}
          {!readonly && shouldSave && !isSaving && (
            <Badge variant="secondary" className="text-xs">
              Auto-save pending
            </Badge>
          )}
          {!readonly && isSaving && (
            <Badge variant="default" className="text-xs">
              Saving...
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
