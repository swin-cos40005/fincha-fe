'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { FileIcon, PlusIcon } from './icons';
import type { DashboardItem } from '@/lib/dashboard/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface DashboardExportProps {
  dashboardItems: DashboardItem[];
  artifacts: any[];
  onGenerateArtifact: (config: ArtifactConfig) => void;
  onOpenArtifact: (artifactId: string) => void;
  onRemoveArtifact: (artifactId: string) => void;
  isGenerating?: boolean;
}

interface ArtifactConfig {
  title?: string;
  type: 'text' | 'code' | 'image' | 'sheet';
  includeExecutiveSummary: boolean;
  includeRecommendations: boolean;
  focusAreas: string[];
}

export function DashboardExport({
  dashboardItems,
  artifacts,
  onGenerateArtifact,
  onOpenArtifact,
  onRemoveArtifact,
  isGenerating = false,
}: DashboardExportProps) {
  const [artifactTitle, setArtifactTitle] = useState('');
  const [artifactType, setArtifactType] = useState<'text' | 'code' | 'image' | 'sheet'>('text');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [focusAreasText, setFocusAreasText] = useState('');

  const handleGenerateArtifact = () => {
    // Title is optional – use empty string if not provided
    const sanitizedTitle = artifactTitle.trim();

    const focusAreas = focusAreasText
      .split(',')
      .map(area => area.trim())
      .filter(area => area.length > 0);

    const config: ArtifactConfig = {
      title: sanitizedTitle.length > 0 ? sanitizedTitle : undefined,
      type: artifactType,
      includeExecutiveSummary,
      includeRecommendations,
      focusAreas,
    };

    onGenerateArtifact(config);
    
    // Reset form
    setArtifactTitle('');
    setFocusAreasText('');
  };

  const chartItems = dashboardItems.filter(item => item.type === 'chart');
  const tableItems = dashboardItems.filter(item => item.type === 'table');
  const statsItems = dashboardItems.filter(item => item.type === 'statistics');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Export Dashboard</h1>
          <div className="text-muted-foreground">
            Generate comprehensive artifacts from your workflow data
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{dashboardItems.length} data sources</Badge>
          <Badge variant="secondary">{artifacts.length} artifacts</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon size={20} />
              Generate New Artifact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Artifact Title */}
            <div className="space-y-2">
              <Label htmlFor="artifact-title">Artifact Title</Label>
              <Input
                id="artifact-title"
                placeholder="Enter artifact title..."
                value={artifactTitle}
                onChange={(e) => setArtifactTitle(e.target.value)}
              />
            </div>

            {/* Artifact Type */}
            <div className="space-y-2">
              <Label>Artifact Type</Label>
              <RadioGroup value={artifactType} onValueChange={(value) => setArtifactType(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <label htmlFor="text" className="text-sm">
                    Text Document - Analysis and insights
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="code" id="code" />
                  <label htmlFor="code" className="text-sm">
                    Code - Scripts and technical documentation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sheet" id="sheet" />
                  <label htmlFor="sheet" className="text-sm">
                    Spreadsheet - Data tables and calculations
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="image" />
                  <label htmlFor="image" className="text-sm">
                    Image - Visual charts and diagrams
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="executive-summary" className="text-sm">
                  Include Executive Summary
                </Label>
                <Switch
                  id="executive-summary"
                  checked={includeExecutiveSummary}
                  onCheckedChange={setIncludeExecutiveSummary}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recommendations" className="text-sm">
                  Include Recommendations
                </Label>
                <Switch
                  id="recommendations"
                  checked={includeRecommendations}
                  onCheckedChange={setIncludeRecommendations}
                />
              </div>
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <Label htmlFor="focus-areas">Focus Areas (Optional)</Label>
              <Textarea
                id="focus-areas"
                placeholder="e.g., performance, trends, outliers (comma-separated)"
                value={focusAreasText}
                onChange={(e) => setFocusAreasText(e.target.value)}
                rows={2}
              />
              <div className="text-xs text-muted-foreground">
                Specify areas you want the report to focus on, separated by commas
              </div>
            </div>

            {/* Data Summary */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Available Data:</div>
              <div className="space-y-1 text-xs">
                <div>{chartItems.length} chart{chartItems.length !== 1 ? 's' : ''}</div>
                <div>{tableItems.length} data table{tableItems.length !== 1 ? 's' : ''}</div>
                <div>{statsItems.length} statistical analysis{statsItems.length !== 1 ? 'es' : ''}</div>
              </div>
            </div>

            <Button
              onClick={handleGenerateArtifact}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating Artifact...' : 'Generate Artifact'}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileIcon size={20} />
              Generated Artifacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {artifacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No artifacts generated yet
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {artifacts.map((artifact, index) => (
                    <div
                      key={artifact.id || index}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{artifact.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {artifact.kind || artifact.type} artifact
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Created {new Date(artifact.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenArtifact(artifact.id)}
                            className="p-2"
                            title="Open Artifact"
                          >
                            <FileIcon size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveArtifact(artifact.id)}
                            className="p-2 text-destructive"
                            title="Remove Artifact"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 