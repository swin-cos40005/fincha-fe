import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader, Calendar, Layers } from 'lucide-react';

interface WorkflowInfo {
  title: string;
  createdAt: string;
  nodeCount: number;
}

interface WorkflowImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const WorkflowImportDialog: React.FC<WorkflowImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [workflowInfo, setWorkflowInfo] = useState<WorkflowInfo | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  const extractSharedId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const sharedIndex = pathParts.findIndex((part) => part === 'shared');
      if (sharedIndex !== -1 && pathParts[sharedIndex + 1]) {
        return pathParts[sharedIndex + 1];
      }
      return null;
    } catch {
      return null;
    }
  };

  const handlePreviewWorkflow = async () => {
    if (!shareUrl.trim()) {
      toast.error('Please enter a valid share URL');
      return;
    }

    const sharedId = extractSharedId(shareUrl);
    if (!sharedId) {
      toast.error('Invalid share URL format');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/workflows/import?sharedId=${sharedId}`,
      );

      if (!response.ok) {
        throw new Error('Failed to load workflow info');
      }

      const data = await response.json();
      setWorkflowInfo(data.workflow);
      setCustomTitle(data.workflow.title);
    } catch (error) {
      toast.error('Failed to load workflow. Please check the URL.');
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWorkflow = async () => {
    if (!workflowInfo) return;

    const sharedId = extractSharedId(shareUrl);
    if (!sharedId) return;

    try {
      setImporting(true);

      const response = await fetch(`/api/workflows/shared/${sharedId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: customTitle || workflowInfo.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import workflow');
      }

      toast.success('Workflow imported successfully!');
      onImportComplete?.();
      handleClose();
    } catch (error) {
      toast.error('Failed to import workflow');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setWorkflowInfo(null);
    setCustomTitle('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Workflow</DialogTitle>
          <DialogDescription>
            Enter a workflow share link to import it to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shareUrl">Share URL</Label>
            <div className="flex gap-2">
              <Input
                id="shareUrl"
                placeholder="https://example.com/workflow/shared/..."
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                disabled={loading || importing}
              />
              <Button
                onClick={handlePreviewWorkflow}
                disabled={loading || importing || !shareUrl.trim()}
                variant="outline"
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  'Preview'
                )}
              </Button>
            </div>
          </div>

          {workflowInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {workflowInfo.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>
                      Created{' '}
                      {new Date(workflowInfo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers size={14} />
                    <span>{workflowInfo.nodeCount} nodes</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customTitle">Custom Title (optional)</Label>
                  <Input
                    id="customTitle"
                    placeholder="Enter a custom title for the imported workflow"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    disabled={importing}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge variant="secondary">Ready to import</Badge>
                  <Button
                    onClick={handleImportWorkflow}
                    disabled={importing}
                    size="sm"
                  >
                    {importing ? (
                      <>
                        <Loader size={16} className="mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Workflow'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
