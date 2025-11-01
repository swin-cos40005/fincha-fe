'use client';

import React, { useState, useEffect, createElement } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type JoinerNodeModel,
  JoinType,
  type JoinConfiguration,
} from './node-model';
import { NodeDialog } from '../core';
import type { DataTableSpec, SettingsObject } from '../../types';

export class JoinerNodeDialog extends NodeDialog {
  constructor(private nodeModel: JoinerNodeModel) {
    super();
  }

  createDialogPanel(
    settings: SettingsObject,
    specs: DataTableSpec[],
  ): React.ReactElement {
    return createElement(JoinerDialogComponent, {
      nodeModel: this.nodeModel,
      settings,
      inputSpecs: specs,
      onSave: (newSettings: any) => this.saveSettings(newSettings),
      onCancel: () => {},
    });
  }

  saveSettings(settings: SettingsObject): void {
    this.nodeModel.saveSettings(settings);
  }

  loadSettings(settings: SettingsObject, _specs: DataTableSpec[]): void {
    this.nodeModel.loadSettings(settings);
  }
}

interface JoinerDialogComponentProps {
  nodeModel: JoinerNodeModel;
  settings: SettingsObject;
  inputSpecs: DataTableSpec[];
  onSave: (settings: SettingsObject) => void;
  onCancel: () => void;
}

function JoinerDialogComponent({
  nodeModel,
  settings: _settings,
  inputSpecs,
  onSave,
  onCancel: _onCancel,
}: JoinerDialogComponentProps) {
  // State for join configurations
  const [join1_2, setJoin1_2] = useState<JoinConfiguration>(
    nodeModel.getJoin1_2(),
  );
  const [join1_3, setJoin1_3] = useState<JoinConfiguration>(
    nodeModel.getJoin1_3(),
  );
  const [prefixes, setPrefixes] = useState(nodeModel.getColumnPrefixes());

  // Available columns for each table
  const table1Columns = inputSpecs[0]?.columns || [];
  const table2Columns = inputSpecs[1]?.columns || [];
  const table3Columns = inputSpecs[2]?.columns || [];

  const hasTable3 = inputSpecs.length > 2;

  // Save automatically when configurations change
  useEffect(() => {
    // Update node model immediately when settings change
    nodeModel.setJoin1_2(join1_2);
    nodeModel.setJoin1_3(join1_3);
    nodeModel.setColumnPrefixes(
      prefixes.prefix1,
      prefixes.prefix2,
      prefixes.prefix3,
    );

    // Create settings object and save
    const newSettings: SettingsObject = {
      getString: (key: string, defaultValue?: string) => {
        const settingsMap: Record<string, string> = {
          join_1_2: JSON.stringify(join1_2),
          join_1_3: JSON.stringify(join1_3),
          column_prefix_1: prefixes.prefix1,
          column_prefix_2: prefixes.prefix2,
          column_prefix_3: prefixes.prefix3,
        };
        return settingsMap[key] || defaultValue || '';
      },
      getNumber: (key: string, defaultValue?: number) => defaultValue || 0,
      getBoolean: (_key: string, defaultValue?: boolean) =>
        defaultValue || false,
      set: (_key: string, _value: any) => {},
    };

    onSave(newSettings);
  }, [join1_2, join1_3, prefixes, nodeModel, onSave]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Configure Table Joins</h2>
        <div className="text-sm text-gray-500">
          {inputSpecs.length} table(s) connected
        </div>
      </div>

      <Tabs defaultValue="joins" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="joins">Join Configuration</TabsTrigger>
          <TabsTrigger value="columns">Column Prefixes</TabsTrigger>
        </TabsList>

        <TabsContent value="joins" className="space-y-4">
          {/* Join between Table 1 and Table 2 */}
          <Card>
            <CardHeader>
              <CardTitle>Join: Table 1 ↔ Table 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="table1-column">Table 1 Column</Label>
                  <Select
                    value={join1_2.leftColumn}
                    onValueChange={(value) =>
                      setJoin1_2((prev) => ({ ...prev, leftColumn: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {table1Columns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="table2-column">Table 2 Column</Label>
                  <Select
                    value={join1_2.rightColumn}
                    onValueChange={(value) =>
                      setJoin1_2((prev) => ({ ...prev, rightColumn: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {table2Columns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="join-type-1-2">Join Type</Label>
                <Select
                  value={join1_2.joinType}
                  onValueChange={(value) =>
                    setJoin1_2((prev) => ({
                      ...prev,
                      joinType: value as JoinType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JoinType.INNER}>Inner Join</SelectItem>
                    <SelectItem value={JoinType.LEFT}>Left Join</SelectItem>
                    <SelectItem value={JoinType.RIGHT}>Right Join</SelectItem>
                    <SelectItem value={JoinType.FULL}>
                      Full Outer Join
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Join with Table 3 (if present) */}
          {hasTable3 && (
            <Card>
              <CardHeader>
                <CardTitle>Join: Result ↔ Table 3</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="result-column">Result Column</Label>
                    <Select
                      value={join1_3.leftColumn}
                      onValueChange={(value) =>
                        setJoin1_3((prev) => ({ ...prev, leftColumn: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {table1Columns.concat(table2Columns).map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="table3-column">Table 3 Column</Label>
                    <Select
                      value={join1_3.rightColumn}
                      onValueChange={(value) =>
                        setJoin1_3((prev) => ({ ...prev, rightColumn: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {table3Columns.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} ({col.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="join-type-1-3">Join Type</Label>
                  <Select
                    value={join1_3.joinType}
                    onValueChange={(value) =>
                      setJoin1_3((prev) => ({
                        ...prev,
                        joinType: value as JoinType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={JoinType.INNER}>Inner Join</SelectItem>
                      <SelectItem value={JoinType.LEFT}>Left Join</SelectItem>
                      <SelectItem value={JoinType.RIGHT}>Right Join</SelectItem>
                      <SelectItem value={JoinType.FULL}>
                        Full Outer Join
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Column Name Prefixes</CardTitle>
              <p className="text-sm text-gray-600">
                Add prefixes to column names to avoid conflicts when joining
                tables
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prefix1">Table 1 Prefix</Label>
                <Input
                  id="prefix1"
                  value={prefixes.prefix1}
                  onChange={(e) =>
                    setPrefixes((prev) => ({
                      ...prev,
                      prefix1: e.target.value,
                    }))
                  }
                  placeholder="e.g., T1_"
                />
              </div>

              <div>
                <Label htmlFor="prefix2">Table 2 Prefix</Label>
                <Input
                  id="prefix2"
                  value={prefixes.prefix2}
                  onChange={(e) =>
                    setPrefixes((prev) => ({
                      ...prev,
                      prefix2: e.target.value,
                    }))
                  }
                  placeholder="e.g., T2_"
                />
              </div>

              {hasTable3 && (
                <div>
                  <Label htmlFor="prefix3">Table 3 Prefix</Label>
                  <Input
                    id="prefix3"
                    value={prefixes.prefix3}
                    onChange={(e) =>
                      setPrefixes((prev) => ({
                        ...prev,
                        prefix3: e.target.value,
                      }))
                    }
                    placeholder="e.g., T3_"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
