import React, { useRef, useEffect, useMemo } from 'react';
import type { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { NodeFactory, NodeDialog, DataTableSpec } from '@/lib/nodes/core';

interface NodeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  inputSpecs: DataTableSpec[];
  onSave: (settings: any) => void;
}

// Configuration dialog wrapper component
const ConfigDialogWrapper: React.FC<{
  nodeDialog: NodeDialog;
  settings: any;
  specs: any[];
  onSave: (settings: any) => void;
}> = ({ nodeDialog, settings, specs, onSave }) => {
  const settingsRef = useRef<any>({ ...settings });

  // Create mock settings object with getter/setter methods using useMemo to prevent recreation
  const mockSettings = useMemo(
    () => ({
      getString: (key: string, defaultValue = '') => {
        const value = settingsRef.current[key] || defaultValue;
        return value;
      },
      getNumber: (key: string, defaultValue = 0) => {
        const value = settingsRef.current[key] || defaultValue;
        return value;
      },
      getBoolean: (key: string, defaultValue = false) => {
        const value = settingsRef.current[key] || defaultValue;
        return value;
      },
      set: (key: string, value: any) => {
        settingsRef.current[key] = value;
      },
    }),
    [],
  );

  // Update settings ref when external settings change
  useEffect(() => {
    settingsRef.current = { ...settings };
  }, [settings]);

  // Initialize dialog - call loadSettings whenever settings change
  useEffect(() => {
    try {
      nodeDialog.loadSettings(mockSettings, specs);
    } catch (error) {
      console.error('ConfigDialogWrapper: Error loading settings:', error);
    }
  }, [nodeDialog, mockSettings, settings, specs]);

  // Save handler
  useEffect(() => {
    const handleSave = () => {
      try {
        nodeDialog.saveSettings(mockSettings);
        onSave(settingsRef.current);
      } catch (error) {
        toast.error(
          `Failed to save settings: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    document.addEventListener('dialog-save', handleSave);
    return () => document.removeEventListener('dialog-save', handleSave);
  }, [nodeDialog, onSave, mockSettings]);

  // Create dialog panel - recreate when settings change to reflect updates
  const dialogPanel = useMemo(() => {
    return nodeDialog.createDialogPanel(mockSettings, specs);
  }, [nodeDialog, mockSettings, specs]); // Add settings as dependency to force recreation

  return <>{dialogPanel}</>;
};

export const NodeConfigDialog: React.FC<NodeConfigDialogProps> = ({
  isOpen,
  onClose,
  node,
  inputSpecs,
  onSave,
}) => {
  if (!node) return null;

  const factory = node.data.factory as NodeFactory<any>;
  const nodeDialog = factory.createNodeDialog();

  if (!nodeDialog) return null;

  const handleSave = (settings: any) => {
    onSave(settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Configure {node.data.label}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <ConfigDialogWrapper
            nodeDialog={nodeDialog}
            settings={node.data.settings || {}}
            specs={inputSpecs}
            onSave={handleSave}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // This triggers the save in the wrapper component
              const saveEvent = new CustomEvent('dialog-save');
              document.dispatchEvent(saveEvent);
            }}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
