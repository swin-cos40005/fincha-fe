import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3Icon } from 'lucide-react';
import { PlusIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons';
import { toast } from 'sonner';

interface PlanContent {
  goal: string;
  approach: string;
  criteria: string;
  reportStyle: string;
  optionalEnhancements: string;
  customFields: Array<{ name: string; value: string }>;
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

function ContentRenderer({ content, title }: { content: string; title: string }) {
  if (!content.trim()) {
    return (
      <div className="text-muted-foreground italic text-sm">
        No content added yet. Click edit to add {title.toLowerCase()}.
      </div>
    );
  }
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
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        flushList();
        return;
      }
      if (/^\d+\.\s/.test(trimmedLine)) {
        if (listType !== 'numbered') {
          flushList();
          listType = 'numbered';
        }
        currentList.push(trimmedLine);
      } else if (/^\*\s/.test(trimmedLine)) {
        if (listType !== 'bulleted') {
          flushList();
          listType = 'bulleted';
        }
        currentList.push(trimmedLine);
      } else {
        flushList();
        elements.push(
          <p key={elements.length} className="text-foreground leading-relaxed mb-4">
            {trimmedLine}
          </p>
        );
      }
    });
    flushList();
    return elements;
  };
  return <div className="prose prose-sm max-w-none">{renderFormattedContent(content)}</div>;
}

type PlanEditorProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: 'streaming' | 'idle';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
};

function PurePlanEditor({
  content,
  onSaveContent,
}: PlanEditorProps) {
  const [planContent, setPlanContent] = useState<PlanContent>(parseContent(content));
  const [newFieldName, setNewFieldName] = useState('');
  const [activeSection, setActiveSection] = useState('objective');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const sections = [
    { id: 'objective', title: 'Analysis Objective', icon: '🎯', field: 'goal' as keyof PlanContent },
    { id: 'methodology', title: 'Methodology', icon: '⚙️', field: 'approach' as keyof PlanContent },
    { id: 'success', title: 'Success Metrics', icon: '📊', field: 'criteria' as keyof PlanContent },
    { id: 'communication', title: 'Communication Style', icon: '💬', field: 'reportStyle' as keyof PlanContent },
    { id: 'advanced', title: 'Advanced Considerations', icon: '🧠', field: 'optionalEnhancements' as keyof PlanContent },
    { id: 'custom', title: 'Custom Fields', icon: '🔧', field: null },
  ];

  useEffect(() => {
    setPlanContent(parseContent(content));
  }, [content]);

  const handleFieldChange = useCallback((field: keyof PlanContent, value: string) => {
    const updatedContent = { ...planContent, [field]: value };
    setPlanContent(updatedContent);
    onSaveContent(stringifyContent(updatedContent), true);
  }, [planContent, onSaveContent]);

  const handleCustomFieldChange = useCallback((index: number, field: 'name' | 'value', value: string) => {
    const updatedFields = [...planContent.customFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    const updatedContent = { ...planContent, customFields: updatedFields };
    setPlanContent(updatedContent);
    onSaveContent(stringifyContent(updatedContent), true);
  }, [planContent, onSaveContent]);

  const addCustomField = useCallback(() => {
    if (!newFieldName.trim()) {
      toast.error('Please enter a field name');
      return;
    }
    const updatedContent = {
      ...planContent,
      customFields: [...planContent.customFields, { name: newFieldName, value: '' }]
    };
    setPlanContent(updatedContent);
    onSaveContent(stringifyContent(updatedContent), true);
    setNewFieldName('');
  }, [planContent, newFieldName, onSaveContent]);

  const removeCustomField = useCallback((index: number) => {
    const updatedFields = planContent.customFields.filter((_, i) => i !== index);
    const updatedContent = { ...planContent, customFields: updatedFields };
    setPlanContent(updatedContent);
    onSaveContent(stringifyContent(updatedContent), true);
  }, [planContent, onSaveContent]);

  const handleSaveEdit = () => {
    setEditingSection(null);
  };

  const handleCancelEdit = () => {
    setPlanContent(parseContent(content));
    setEditingSection(null);
  };

  const renderSectionContent = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    if (!currentSection) return null;
    const isEditing = editingSection === activeSection;
    if (activeSection === 'custom') {
      return (
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">Custom Fields</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Add custom fields to capture specific requirements for your analysis
            </p>
          </div>
          {planContent.customFields.length > 0 && (
            <div className="space-y-6">
              {planContent.customFields.map((field, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground">{field.name || 'Untitled Field'}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <input
                        value={field.name}
                        onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                        placeholder="Field name"
                        className="w-full text-lg font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      />
                      <textarea
                        value={field.value}
                        onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                        placeholder="Field content"
                        className="w-full h-70vh min-h-[100px] bg-transparent border-none p-0 text-base leading-relaxed resize-none focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border border-dashed border-border rounded-lg p-6 bg-muted/30">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Add New Field</h3>
              <div className="flex gap-3">
                <input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Enter field name"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomField();
                    }
                  }}
                />
                <Button onClick={addCustomField} className="bg-primary hover:bg-primary/90">
                  <PlusIcon size={16} />
                  <span className="ml-2">Add Field</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    const fieldValue = planContent[currentSection.field!] as string;
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">{currentSection.title}</h2>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XIcon />
                    <span className="ml-1">Cancel</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <CheckIcon />
                    <span className="ml-1">Save</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(activeSection)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit3Icon />
                  <span className="ml-1">Edit</span>
                </Button>
              )}
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {getDescription(activeSection)}
          </p>
        </div>
        <div className="bg-card border border-none rounded-lg p-8">
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={fieldValue}
                onChange={(e) => handleFieldChange(currentSection.field!, e.target.value)}
                placeholder={getPlaceholder(activeSection)}
                className="m-4 border-none bg-transparent p-0 text-base leading-relaxed focus:ring-0 focus:outline-none"
                style={{
                  height: '60vh',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  border: 'none',
                }}
              />
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded border border-dashed border-border">
                <strong>Tip:</strong> {getFieldDescription(activeSection)}
              </div>
            </div>
          ) : (
            <ContentRenderer content={fieldValue} title={currentSection.title} />
          )}
        </div>
      </div>
    );
  };

  function getDescription(sectionId: string) {
    switch (sectionId) {
      case 'objective': return 'Define the primary objective and expected outcomes of your data analysis';
      case 'methodology': return 'Describe the analytical approach, data processing steps, and workflow design';
      case 'success': return 'Define objective, measurable criteria for success';
      case 'communication': return 'Specify the tone and format for presenting results to the target audience';
      case 'advanced': return 'Additional considerations for specific scenarios or edge cases';
      default: return '';
    }
  }
  function getPlaceholder(sectionId: string) {
    switch (sectionId) {
      case 'objective': return 'What do you need to achieve from the analysis process?';
      case 'methodology': return 'How should the task be handled based on available workflow nodes?';
      case 'success': return 'What specific deliverables indicate successful completion?';
      case 'communication': return 'Business, Scientific, Executive, Technical, etc.';
      case 'advanced': return 'In scenario X, the agent should Y...';
      default: return '';
    }
  }
  function getFieldDescription(sectionId: string) {
    switch (sectionId) {
      case 'objective': return 'Clearly articulate what you want to accomplish with this analysis';
      case 'methodology': return 'Outline your analytical strategy and implementation approach';
      case 'success': return 'List specific charts, statistics, insights, or other measurable outcomes';
      case 'communication': return 'Choose the appropriate communication style for your audience';
      case 'advanced': return 'Describe any conditional logic or special handling requirements';
      default: return '';
    }
  }

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-muted/30 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground truncate">Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">Data Analysis Plan</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sections.map((section) => {
              const hasContent = section.field
                ? !!(planContent[section.field] as string)?.trim()
                : planContent.customFields.length > 0;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-base">{section.icon}</span>
                    <span className="flex-1 text-left">{section.title}</span>
                    {hasContent && <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">{renderSectionContent()}</div>
      </div>
    </div>
  );
}

export const PlanEditor = React.memo(PurePlanEditor); 