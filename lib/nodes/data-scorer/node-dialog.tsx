"use client"

import React, { useState, useEffect, createElement, type ReactElement } from 'react';
import { NodeDialog, type SettingsObject, type DataTableSpec } from '../core';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InfoIcon } from '@/components/icons';

export class DataScorerNodeDialog extends NodeDialog {
  private static WEIGHT_MISSING_KEY = 'weight_missing';
  private static WEIGHT_DUPLICATES_KEY = 'weight_duplicates';
  private static INCLUDE_RECOMMENDATIONS_KEY = 'include_recommendations';

  private weightMissing = 0.6;
  private weightDuplicates = 0.4;
  private includeRecommendations = true;

  createDialogPanel(
    settings: SettingsObject,
    _specs: DataTableSpec[],
  ): ReactElement {
    this.loadSettings(settings, _specs);

    return createElement(DataScorerDialogPanel, {
      settings,
      specs: _specs,
      initialWeightMissing: this.weightMissing,
      initialWeightDuplicates: this.weightDuplicates,
      initialIncludeRecommendations: this.includeRecommendations,
      onSettingsChange: (weightMissing: number, weightDuplicates: number, includeRecommendations: boolean) => {
        this.weightMissing = weightMissing;
        this.weightDuplicates = weightDuplicates;
        this.includeRecommendations = includeRecommendations;
        this.saveSettings(settings);
      },
    });
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.weightMissing = settings.getNumber
      ? settings.getNumber(DataScorerNodeDialog.WEIGHT_MISSING_KEY, 0.6)
      : (settings as any)[DataScorerNodeDialog.WEIGHT_MISSING_KEY] || 0.6;
    
    this.weightDuplicates = settings.getNumber
      ? settings.getNumber(DataScorerNodeDialog.WEIGHT_DUPLICATES_KEY, 0.4)
      : (settings as any)[DataScorerNodeDialog.WEIGHT_DUPLICATES_KEY] || 0.4;
    
    this.includeRecommendations = settings.getBoolean
      ? settings.getBoolean(DataScorerNodeDialog.INCLUDE_RECOMMENDATIONS_KEY, true)
      : (settings as any)[DataScorerNodeDialog.INCLUDE_RECOMMENDATIONS_KEY] !== false;
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(DataScorerNodeDialog.WEIGHT_MISSING_KEY, this.weightMissing);
      settings.set(DataScorerNodeDialog.WEIGHT_DUPLICATES_KEY, this.weightDuplicates);
      settings.set(DataScorerNodeDialog.INCLUDE_RECOMMENDATIONS_KEY, this.includeRecommendations);
    } else {
      (settings as any)[DataScorerNodeDialog.WEIGHT_MISSING_KEY] = this.weightMissing;
      (settings as any)[DataScorerNodeDialog.WEIGHT_DUPLICATES_KEY] = this.weightDuplicates;
      (settings as any)[DataScorerNodeDialog.INCLUDE_RECOMMENDATIONS_KEY] = this.includeRecommendations;
    }
  }
}

interface DataScorerDialogPanelProps {
  settings: SettingsObject;
  specs: DataTableSpec[];
  initialWeightMissing: number;
  initialWeightDuplicates: number;
  initialIncludeRecommendations: boolean;
  onSettingsChange: (weightMissing: number, weightDuplicates: number, includeRecommendations: boolean) => void;
}

function DataScorerDialogPanel({
  initialWeightMissing,
  initialWeightDuplicates,
  initialIncludeRecommendations,
  onSettingsChange,
}: DataScorerDialogPanelProps) {
  const [weightMissing, setWeightMissing] = useState(initialWeightMissing);
  const [weightDuplicates, setWeightDuplicates] = useState(initialWeightDuplicates);
  const [includeRecommendations, setIncludeRecommendations] = useState(
    initialIncludeRecommendations,
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Ensure weights sum to 1.0
  const handleWeightMissingChange = (value: number[]) => {
    const newWeightMissing = value[0] / 100;
    const newWeightDuplicates = 1.0 - newWeightMissing;
    
    setWeightMissing(newWeightMissing);
    setWeightDuplicates(newWeightDuplicates);
    validateAndSave(newWeightMissing, newWeightDuplicates, includeRecommendations);
  };

  const handleWeightDuplicatesChange = (value: number[]) => {
    const newWeightDuplicates = value[0] / 100;
    const newWeightMissing = 1.0 - newWeightDuplicates;
    
    setWeightMissing(newWeightMissing);
    setWeightDuplicates(newWeightDuplicates);
    validateAndSave(newWeightMissing, newWeightDuplicates, includeRecommendations);
  };

  const handleRecommendationsChange = (checked: boolean) => {
    setIncludeRecommendations(checked);
    validateAndSave(weightMissing, weightDuplicates, checked);
  };

  const validateAndSave = (
    wMissing: number,
    wDuplicates: number,
    includeRecs: boolean,
  ) => {
    const newErrors: string[] = [];

    if (wMissing < 0 || wMissing > 1) {
      newErrors.push('Missing values weight must be between 0 and 1');
    }

    if (wDuplicates < 0 || wDuplicates > 1) {
      newErrors.push('Duplicate rows weight must be between 0 and 1');
    }

    if (Math.abs((wMissing + wDuplicates) - 1.0) > 0.01) {
      newErrors.push('Weights must sum to 1.0');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      onSettingsChange(wMissing, wDuplicates, includeRecs);
    }
  };

  // Initial validation
  useEffect(() => {
    validateAndSave(weightMissing, weightDuplicates, includeRecommendations);
  }, []);

  const resetToDefaults = () => {
    setWeightMissing(0.6);
    setWeightDuplicates(0.4);
    setIncludeRecommendations(true);
    validateAndSave(0.6, 0.4, true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Data Quality Scorer Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure how data quality is assessed based on missing values and duplicate rows.
        </p>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Scoring Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Weights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust the relative importance of different quality factors. Weights must sum to 100%.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Missing Values Weight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="weight-missing">Missing Values Weight</Label>
              <Badge variant="secondary">{(weightMissing * 100).toFixed(0)}%</Badge>
            </div>
            <Slider
              id="weight-missing"
              min={0}
              max={100}
              step={5}
              value={[weightMissing * 100]}
              onValueChange={handleWeightMissingChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How much missing values impact the overall quality score. Higher values penalize missing data more heavily.
            </p>
          </div>

          <Separator />

          {/* Duplicate Rows Weight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="weight-duplicates">Duplicate Rows Weight</Label>
              <Badge variant="secondary">{(weightDuplicates * 100).toFixed(0)}%</Badge>
            </div>
            <Slider
              id="weight-duplicates"
              min={0}
              max={100}
              step={5}
              value={[weightDuplicates * 100]}
              onValueChange={handleWeightDuplicatesChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How much duplicate rows impact the overall quality score. Higher values penalize duplicates more heavily.
            </p>
          </div>

          {/* Weight Sum Display */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Total Weight:</span>
            <Badge variant={Math.abs((weightMissing + weightDuplicates) - 1.0) < 0.01 ? "default" : "destructive"}>
              {((weightMissing + weightDuplicates) * 100).toFixed(0)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Output Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output Options</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure what information is included in the quality assessment output.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="include-recommendations">Include Recommendations</Label>
              <p className="text-sm text-muted-foreground">
                Generate actionable recommendations for improving data quality
              </p>
            </div>
            <Switch
              id="include-recommendations"
              checked={includeRecommendations}
              onCheckedChange={handleRecommendationsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scoring Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <InfoIcon size={16} />
            Scoring Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">Quality Grades</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">A</Badge>
                  <span className="text-xs">90-100 points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">B</Badge>
                  <span className="text-xs">80-89 points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">C</Badge>
                  <span className="text-xs">70-79 points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">D</Badge>
                  <span className="text-xs">60-69 points</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">F</Badge>
                  <span className="text-xs">Below 60 points</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm">Scoring Method</h4>
              <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                <li>• Missing values: -2 points per 1% missing</li>
                <li>• Duplicate rows: -3 points per 1% duplicates</li>
                <li>• Final score = (Missing Score × Weight) + (Duplicate Score × Weight)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
} 