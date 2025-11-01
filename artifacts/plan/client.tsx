import React, { useState, useEffect, useCallback } from 'react';
import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { Editor } from '@/components/text-editor';
import {
  ClockRewind,
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit3Icon } from 'lucide-react';
import { PlanEditor } from '@/components/plan-editor';

interface PlanArtifactMetadata {
  suggestions: Array<Suggestion>;
}

interface PlanContent {
  goal: string;
  approach: string;
  criteria: string;
  reportStyle: string;
  optionalEnhancements: string;
  customFields: Array<{ name: string; value: string }>;
}

interface PlanFieldEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  description?: string;
  multiline?: boolean;
}

function ContentRenderer({ content, title }: { content: string; title: string }) {
  if (!content.trim()) {
    return (
      <div className="text-muted-foreground italic text-sm">
        No content added yet. Click edit to add {title.toLowerCase()}.
      </div>
    );
  }

  // Handle numbered lists
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'numbered' | 'bulleted' | null = null;

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'numbered') {
          elements.push(
            <ol key={elements.length} className="list-decimal list-inside space-y-2 ml-4 mb-4">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground leading-relaxed">
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ol>
          );
        } else if (listType === 'bulleted') {
          elements.push(
            <ul key={elements.length} className="list-disc list-inside space-y-2 ml-4 mb-4">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground leading-relaxed">
                  {item.replace(/^\*\s*/, '')}
                </li>
              ))}
            </ul>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Check for numbered list items
      if (/^\d+\.\s/.test(trimmedLine)) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        currentList.push(trimmedLine);
      }
      // Check for bulleted list items
      else if (/^\*\s/.test(trimmedLine)) {
        if (listType !== 'bulleted') {
          flushList();
          listType = 'bulleted';
        }
        currentList.push(trimmedLine);
      }
      // Regular paragraph
      else {
        flushList();
        elements.push(
          <p key={elements.length} className="text-foreground leading-relaxed mb-4">
            {trimmedLine}
          </p>
        );
      }
    });

    flushList(); // Flush any remaining list items
    return elements;
  };

  return (
    <div className="prose prose-sm max-w-none">
      {renderFormattedContent(content)}
    </div>
  );
}

function parseContent(content: string): PlanContent {
  try {
    const parsed = JSON.parse(content);
    return {
      goal: parsed.goal || '',
      approach: parsed.approach || '',
      criteria: parsed.criteria || '',
      reportStyle: parsed.reportStyle || '',
      optionalEnhancements: parsed.optionalEnhancements || '',
      customFields: parsed.customFields || [],
    };
  } catch {
    return {
      goal: '',
      approach: '',
      criteria: '',
      reportStyle: '',
      optionalEnhancements: '',
      customFields: [],
    };
  }
}

function stringifyContent(planContent: PlanContent): string {
  return JSON.stringify(planContent, null, 2);
}

export const planArtifact = new Artifact<'plan', PlanArtifactMetadata>({
  kind: 'plan',
  description: 'Create structured plans for data analysis with clear goals, approaches, and success criteria',
  
  initialize: async ({ documentId, setMetadata }) => {
    const suggestions = await getSuggestions({ documentId });
    setMetadata({ suggestions });
  },
  
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'suggestion') {
      setMetadata((metadata) => ({
        suggestions: [
          ...metadata.suggestions,
          streamPart.content as Suggestion,
        ],
      }));
    }

    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        const updatedContent = draftArtifact.content + (streamPart.content as string);
        return {
          ...draftArtifact,
          content: updatedContent,
          isVisible: true,
          status: 'streaming',
        };
      });
    }

    if (streamPart.type === 'finish') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'idle',
        isVisible: true,
      }));
    }
  },
  
  actions: [
    {
      icon: <CopyIcon size={16} />,
      description: 'Copy plan to clipboard',
      onClick: async ({ content }) => {
        try {
          const planContent = parseContent(content);
          const readableText = `
DATA ANALYSIS PLAN

Goal: ${planContent.goal}

Approach: ${planContent.approach}

Success Criteria: ${planContent.criteria}

Report Style: ${planContent.reportStyle}

Optional Enhancements: ${planContent.optionalEnhancements}

${planContent.customFields.map(field => `${field.name}: ${field.value}`).join('\n\n')}
          `.trim();
          
          await navigator.clipboard.writeText(readableText);
          toast.success('Plan copied to clipboard');
        } catch (error) {
          toast.error('Failed to copy plan');
        }
      },
    },
  ],
  
  toolbar: [],
  
  content: (props) => {
    if (props.isLoading || props.status === 'streaming') {
      return <DocumentSkeleton artifactKind="plan" />;
    }
    if (props.mode === 'diff') {
      return (
        <DiffView
          oldContent={props.getDocumentContentById(props.currentVersionIndex - 1)}
          newContent={props.getDocumentContentById(props.currentVersionIndex)}
        />
      );
    }
    return (
      <PlanEditor
        content={props.content}
        onSaveContent={props.onSaveContent}
        status={props.status}
        isCurrentVersion={props.isCurrentVersion}
        currentVersionIndex={props.currentVersionIndex}
      />
    );
  },
});