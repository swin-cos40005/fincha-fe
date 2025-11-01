import React from 'react';
import type { BarChartConfig, BarLegendConfig } from './BarSchema';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

interface BarConfigProps {
  config: BarChartConfig;
  onChange: (updates: Partial<BarChartConfig>) => void;
}

export const BarConfig: React.FC<BarConfigProps> = ({ config, onChange }) => {
  // Helper function to update nested properties
  const updateNestedProperty = (path: string[], value: any) => {
    const keys = path;
    const update: any = {};
    let current = update;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    // Deep merge with existing config
    const mergeDeep = (target: any, source: any) => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = mergeDeep(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };
    
    onChange(mergeDeep(config, update));
  };

  // Helper to add a new legend
  const addLegend = () => {
    const newLegend: BarLegendConfig = {
      anchor: 'bottom-right' as const,
      direction: 'column' as const,
      justify: false,
      translateX: 120,
      translateY: 0,
      itemsSpacing: 2,
      itemWidth: 100,
      itemHeight: 18,
      itemDirection: 'left-to-right' as const,
      itemOpacity: 1,
      symbolSize: 12,
      symbolShape: 'square' as const,
      dataFrom: 'keys' as const,
    };
    
    onChange({
      legends: [...(config.legends || []), newLegend],
    });
  };

  // Helper to remove a legend
  const removeLegend = (index: number) => {
    const newLegends = [...(config.legends || [])];
    newLegends.splice(index, 1);
    onChange({ legends: newLegends });
  };

  // Helper to update a legend
  const updateLegend = (index: number, updates: any) => {
    const newLegends = [...(config.legends || [])];
    newLegends[index] = { ...newLegends[index], ...updates };
    onChange({ legends: newLegends });
  };

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto">
      {/* Basic Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={config.layout || 'vertical'}
                onValueChange={(value) =>
                  onChange({ layout: value as 'vertical' | 'horizontal' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupMode">Group Mode</Label>
              <Select
                value={config.groupMode || 'grouped'}
                onValueChange={(value) =>
                  onChange({ groupMode: value as 'stacked' | 'grouped' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grouped">Grouped</SelectItem>
                  <SelectItem value="stacked">Stacked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spacing & Padding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spacing & Padding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="padding">
                Bar Padding ({(config.padding || 0.3).toFixed(1)})
              </Label>
              <Slider
                value={[config.padding || 0.3]}
                onValueChange={(value) => onChange({ padding: value[0] })}
                min={0.1}
                max={0.9}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Space between bar groups
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="innerPadding">
                Inner Padding ({config.innerPadding || 0})
              </Label>
              <Slider
                value={[config.innerPadding || 0]}
                onValueChange={(value) => onChange({ innerPadding: value[0] })}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Space between bars in a group
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Margins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Top ({config.margin?.top || 50})</Label>
              <Slider
                value={[config.margin?.top || 50]}
                onValueChange={(value) =>
                  updateNestedProperty(['margin', 'top'], value[0])
                }
                min={0}
                max={200}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Right ({config.margin?.right || 130})</Label>
              <Slider
                value={[config.margin?.right || 130]}
                onValueChange={(value) =>
                  updateNestedProperty(['margin', 'right'], value[0])
                }
                min={0}
                max={200}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Bottom ({config.margin?.bottom || 50})</Label>
              <Slider
                value={[config.margin?.bottom || 50]}
                onValueChange={(value) =>
                  updateNestedProperty(['margin', 'bottom'], value[0])
                }
                min={0}
                max={200}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Left ({config.margin?.left || 60})</Label>
              <Slider
                value={[config.margin?.left || 60]}
                onValueChange={(value) =>
                  updateNestedProperty(['margin', 'left'], value[0])
                }
                min={0}
                max={200}
                step={5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Scale */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Scale Type</Label>
              <Select
                value={config.valueScale?.type || 'linear'}
                onValueChange={(value) =>
                  updateNestedProperty(['valueScale', 'type'], value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="symlog">Symlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Value</Label>
              <Input
                placeholder="auto"
                value={
                  config.valueScale?.min === 'auto' || config.valueScale?.min === undefined
                    ? 'auto'
                    : String(config.valueScale.min)
                }
                onChange={(e) =>
                  updateNestedProperty(
                    ['valueScale', 'min'],
                    e.target.value === 'auto' ? 'auto' : Number(e.target.value) || 'auto'
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max Value</Label>
              <Input
                placeholder="auto"
                value={
                  config.valueScale?.max === 'auto' || config.valueScale?.max === undefined
                    ? 'auto'
                    : String(config.valueScale.max)
                }
                onChange={(e) =>
                  updateNestedProperty(
                    ['valueScale', 'max'],
                    e.target.value === 'auto' ? 'auto' : Number(e.target.value) || 'auto'
                  )
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.valueScale?.stacked || false}
                onCheckedChange={(checked) =>
                  updateNestedProperty(['valueScale', 'stacked'], checked)
                }
              />
              <Label>Stacked Scale</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.valueScale?.reverse || false}
                onCheckedChange={(checked) =>
                  updateNestedProperty(['valueScale', 'reverse'], checked)
                }
              />
              <Label>Reverse Scale</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Labels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enableLabel || false}
              onCheckedChange={(checked) => onChange({ enableLabel: checked })}
            />
            <Label>Enable Labels</Label>
          </div>
          
          {config.enableLabel && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label Type</Label>
                  <Select
                    value={config.label || 'value'}
                    onValueChange={(value) => onChange({ label: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="formattedValue">Formatted Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={config.labelTextColor || '#333333'}
                    onChange={(e) => onChange({ labelTextColor: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skip Width ({config.labelSkipWidth || 12})</Label>
                  <Slider
                    value={[config.labelSkipWidth || 12]}
                    onValueChange={(value) => onChange({ labelSkipWidth: value[0] })}
                    min={0}
                    max={50}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground">
                    Hide labels if bar width is less than this value
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Skip Height ({config.labelSkipHeight || 12})</Label>
                  <Slider
                    value={[config.labelSkipHeight || 12]}
                    onValueChange={(value) => onChange({ labelSkipHeight: value[0] })}
                    min={0}
                    max={50}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground">
                    Hide labels if bar height is less than this value
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grid Lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.enableGridX || false}
                onCheckedChange={(checked) => onChange({ enableGridX: checked })}
              />
              <Label>Enable X Grid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.enableGridY !== false}
                onCheckedChange={(checked) => onChange({ enableGridY: checked })}
              />
              <Label>Enable Y Grid</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Axes Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Axes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bottom Axis */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.axisBottom !== null}
                onCheckedChange={(checked) =>
                  onChange({
                    axisBottom: checked 
                      ? {
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: config.dataMapping.indexBy,
                          legendPosition: 'middle',
                          legendOffset: 32,
                        }
                      : null,
                  })
                }
              />
              <Label>Bottom Axis</Label>
            </div>
            
            {config.axisBottom && (
              <div className="ml-6 space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Legend</Label>
                    <Input
                      value={config.axisBottom.legend || ''}
                      onChange={(e) =>
                        updateNestedProperty(['axisBottom', 'legend'], e.target.value)
                      }
                      placeholder="Axis legend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legend Position</Label>
                    <Select
                      value={config.axisBottom.legendPosition || 'middle'}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisBottom', 'legendPosition'], value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tick Size ({config.axisBottom.tickSize || 5})</Label>
                    <Slider
                      value={[config.axisBottom.tickSize || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisBottom', 'tickSize'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Padding ({config.axisBottom.tickPadding || 5})</Label>
                    <Slider
                      value={[config.axisBottom.tickPadding || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisBottom', 'tickPadding'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Rotation ({config.axisBottom.tickRotation || 0}°)</Label>
                    <Slider
                      value={[config.axisBottom.tickRotation || 0]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisBottom', 'tickRotation'], value[0])
                      }
                      min={-90}
                      max={90}
                      step={15}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Legend Offset ({config.axisBottom.legendOffset || 32})</Label>
                  <Slider
                    value={[config.axisBottom.legendOffset || 32]}
                    onValueChange={(value) =>
                      updateNestedProperty(['axisBottom', 'legendOffset'], value[0])
                    }
                    min={-60}
                    max={60}
                    step={4}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Left Axis */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.axisLeft !== null}
                onCheckedChange={(checked) =>
                  onChange({
                    axisLeft: checked 
                      ? {
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Value',
                          legendPosition: 'middle',
                          legendOffset: -40,
                        }
                      : null,
                  })
                }
              />
              <Label>Left Axis</Label>
            </div>
            
            {config.axisLeft && (
              <div className="ml-6 space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Legend</Label>
                    <Input
                      value={config.axisLeft.legend || ''}
                      onChange={(e) =>
                        updateNestedProperty(['axisLeft', 'legend'], e.target.value)
                      }
                      placeholder="Axis legend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legend Position</Label>
                    <Select
                      value={config.axisLeft.legendPosition || 'middle'}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisLeft', 'legendPosition'], value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tick Size ({config.axisLeft.tickSize || 5})</Label>
                    <Slider
                      value={[config.axisLeft.tickSize || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisLeft', 'tickSize'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Padding ({config.axisLeft.tickPadding || 5})</Label>
                    <Slider
                      value={[config.axisLeft.tickPadding || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisLeft', 'tickPadding'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Rotation ({config.axisLeft.tickRotation || 0}°)</Label>
                    <Slider
                      value={[config.axisLeft.tickRotation || 0]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisLeft', 'tickRotation'], value[0])
                      }
                      min={-90}
                      max={90}
                      step={15}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Legend Offset ({config.axisLeft.legendOffset || -40})</Label>
                  <Slider
                    value={[config.axisLeft.legendOffset || -40]}
                    onValueChange={(value) =>
                      updateNestedProperty(['axisLeft', 'legendOffset'], value[0])
                    }
                    min={-60}
                    max={60}
                    step={4}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Top Axis */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.axisTop !== null}
                onCheckedChange={(checked) =>
                  onChange({
                    axisTop: checked 
                      ? {
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: '',
                          legendPosition: 'middle',
                          legendOffset: -32,
                        }
                      : null,
                  })
                }
              />
              <Label>Top Axis</Label>
            </div>
            
            {config.axisTop && (
              <div className="ml-6 space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Legend</Label>
                    <Input
                      value={config.axisTop.legend || ''}
                      onChange={(e) =>
                        updateNestedProperty(['axisTop', 'legend'], e.target.value)
                      }
                      placeholder="Axis legend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legend Position</Label>
                    <Select
                      value={config.axisTop.legendPosition || 'middle'}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisTop', 'legendPosition'], value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tick Size ({config.axisTop.tickSize || 5})</Label>
                    <Slider
                      value={[config.axisTop.tickSize || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisTop', 'tickSize'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Padding ({config.axisTop.tickPadding || 5})</Label>
                    <Slider
                      value={[config.axisTop.tickPadding || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisTop', 'tickPadding'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Rotation ({config.axisTop.tickRotation || 0}°)</Label>
                    <Slider
                      value={[config.axisTop.tickRotation || 0]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisTop', 'tickRotation'], value[0])
                      }
                      min={-90}
                      max={90}
                      step={15}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Legend Offset ({config.axisTop.legendOffset || -32})</Label>
                  <Slider
                    value={[config.axisTop.legendOffset || -32]}
                    onValueChange={(value) =>
                      updateNestedProperty(['axisTop', 'legendOffset'], value[0])
                    }
                    min={-60}
                    max={60}
                    step={4}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Right Axis */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.axisRight !== null}
                onCheckedChange={(checked) =>
                  onChange({
                    axisRight: checked 
                      ? {
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: '',
                          legendPosition: 'middle',
                          legendOffset: 40,
                        }
                      : null,
                  })
                }
              />
              <Label>Right Axis</Label>
            </div>
            
            {config.axisRight && (
              <div className="ml-6 space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Legend</Label>
                    <Input
                      value={config.axisRight.legend || ''}
                      onChange={(e) =>
                        updateNestedProperty(['axisRight', 'legend'], e.target.value)
                      }
                      placeholder="Axis legend"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legend Position</Label>
                    <Select
                      value={config.axisRight.legendPosition || 'middle'}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisRight', 'legendPosition'], value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Start</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="end">End</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tick Size ({config.axisRight.tickSize || 5})</Label>
                    <Slider
                      value={[config.axisRight.tickSize || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisRight', 'tickSize'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Padding ({config.axisRight.tickPadding || 5})</Label>
                    <Slider
                      value={[config.axisRight.tickPadding || 5]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisRight', 'tickPadding'], value[0])
                      }
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tick Rotation ({config.axisRight.tickRotation || 0}°)</Label>
                    <Slider
                      value={[config.axisRight.tickRotation || 0]}
                      onValueChange={(value) =>
                        updateNestedProperty(['axisRight', 'tickRotation'], value[0])
                      }
                      min={-90}
                      max={90}
                      step={15}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Legend Offset ({config.axisRight.legendOffset || 40})</Label>
                  <Slider
                    value={[config.axisRight.legendOffset || 40]}
                    onValueChange={(value) =>
                      updateNestedProperty(['axisRight', 'legendOffset'], value[0])
                    }
                    min={-60}
                    max={60}
                    step={4}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Legends
            <Button
              variant="outline"
              size="sm"
              onClick={addLegend}
              className="flex items-center gap-1"
            >
              <Plus className="size-4" />
              Add Legend
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.legends && config.legends.length > 0 ? (
            config.legends.map((legend, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Legend {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLegend(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Anchor Position</Label>
                    <Select
                      value={legend.anchor}
                      onValueChange={(value) =>
                        updateLegend(index, { anchor: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={legend.direction}
                      onValueChange={(value) =>
                        updateLegend(index, { direction: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="row">Row</SelectItem>
                        <SelectItem value="column">Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Translate X ({legend.translateX || 0})</Label>
                    <Slider
                      value={[legend.translateX || 0]}
                      onValueChange={(value) =>
                        updateLegend(index, { translateX: value[0] })
                      }
                      min={-200}
                      max={200}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Translate Y ({legend.translateY || 0})</Label>
                    <Slider
                      value={[legend.translateY || 0]}
                      onValueChange={(value) =>
                        updateLegend(index, { translateY: value[0] })
                      }
                      min={-200}
                      max={200}
                      step={5}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Item Width ({legend.itemWidth || 100})</Label>
                    <Slider
                      value={[legend.itemWidth || 100]}
                      onValueChange={(value) =>
                        updateLegend(index, { itemWidth: value[0] })
                      }
                      min={10}
                      max={200}
                      step={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Item Height ({legend.itemHeight || 18})</Label>
                    <Slider
                      value={[legend.itemHeight || 18]}
                      onValueChange={(value) =>
                        updateLegend(index, { itemHeight: value[0] })
                      }
                      min={10}
                      max={200}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Items Spacing ({legend.itemsSpacing || 0})</Label>
                    <Slider
                      value={[legend.itemsSpacing || 0]}
                      onValueChange={(value) =>
                        updateLegend(index, { itemsSpacing: value[0] })
                      }
                      min={0}
                      max={60}
                      step={2}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Direction</Label>
                    <Select
                      value={legend.itemDirection || 'left-to-right'}
                      onValueChange={(value) =>
                        updateLegend(index, { itemDirection: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left-to-right">Left to Right</SelectItem>
                        <SelectItem value="right-to-left">Right to Left</SelectItem>
                        <SelectItem value="top-to-bottom">Top to Bottom</SelectItem>
                        <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Symbol Shape</Label>
                    <Select
                      value={legend.symbolShape || 'square'}
                      onValueChange={(value) =>
                        updateLegend(index, { symbolShape: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="triangle">Triangle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol Size ({legend.symbolSize || 12})</Label>
                    <Slider
                      value={[legend.symbolSize || 12]}
                      onValueChange={(value) =>
                        updateLegend(index, { symbolSize: value[0] })
                      }
                      min={2}
                      max={60}
                      step={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Item Opacity ({((legend.itemOpacity || 1) * 100).toFixed(0)}%)</Label>
                    <Slider
                      value={[legend.itemOpacity || 1]}
                      onValueChange={(value) =>
                        updateLegend(index, { itemOpacity: value[0] })
                      }
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={legend.justify || false}
                    onCheckedChange={(checked) =>
                      updateLegend(index, { justify: checked })
                    }
                  />
                  <Label>Justify Content</Label>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No legends configured. Click &quot;Add Legend&quot; to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Animation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.animate !== false}
              onCheckedChange={(checked) => onChange({ animate: checked })}
            />
            <Label>Enable Animation</Label>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Enable smooth transitions and animations for the chart
          </div>
        </CardContent>
      </Card>

      {/* Bar Styling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bar Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Border Radius ({config.borderRadius || 0})</Label>
              <Slider
                value={[config.borderRadius || 0]}
                onValueChange={(value) => onChange({ borderRadius: value[0] })}
                min={0}
                max={20}
                step={1}
              />
              <div className="text-xs text-muted-foreground">
                Corner radius for bars
              </div>
            </div>
            <div className="space-y-2">
              <Label>Border Width ({config.borderWidth || 0})</Label>
              <Slider
                value={[config.borderWidth || 0]}
                onValueChange={(value) => onChange({ borderWidth: value[0] })}
                min={0}
                max={10}
                step={1}
              />
              <div className="text-xs text-muted-foreground">
                Border thickness for bars
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Border Color</Label>
            <Input
              type="color"
              value={
                typeof config.borderColor === 'string' 
                  ? config.borderColor 
                  : '#000000'
              }
              onChange={(e) => onChange({ borderColor: e.target.value })}
            />
            <div className="text-xs text-muted-foreground">
              Color for bar borders
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.reverse || false}
              onCheckedChange={(checked) => onChange({ reverse: checked })}
            />
            <Label>Reverse Direction</Label>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Labels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Label Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.enableLabel && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Label Position</Label>
                  <Select
                    value={config.labelPosition || 'middle'}
                    onValueChange={(value) => 
                      onChange({ labelPosition: value as 'start' | 'middle' | 'end' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="end">End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label Offset ({config.labelOffset || 0})</Label>
                  <Slider
                    value={[config.labelOffset || 0]}
                    onValueChange={(value) => onChange({ labelOffset: value[0] })}
                    min={-20}
                    max={20}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground">
                    Offset from label position
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Label Format</Label>
                <Input
                  value={config.labelFormat || ''}
                  onChange={(e) => onChange({ labelFormat: e.target.value })}
                  placeholder="e.g., .2s, .0%"
                />
                <div className="text-xs text-muted-foreground">
                  D3 format string for labels (leave empty for default)
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Totals Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enableTotals || false}
              onCheckedChange={(checked) => onChange({ enableTotals: checked })}
            />
            <Label>Show Totals on Stacked Bars</Label>
          </div>
          
          {config.enableTotals && (
            <div className="space-y-2">
              <Label>Totals Offset ({config.totalsOffset || 0})</Label>
              <Slider
                value={[config.totalsOffset || 0]}
                onValueChange={(value) => onChange({ totalsOffset: value[0] })}
                min={-50}
                max={50}
                step={2}
              />
              <div className="text-xs text-muted-foreground">
                Offset for total value labels
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Grid Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custom X Grid Values</Label>
            <Input
              value={config.gridXValues?.join(', ') || ''}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map(v => v.trim())
                  .filter(v => v)
                  .map(v => isNaN(Number(v)) ? v : Number(v));
                onChange({ gridXValues: values.length > 0 ? values : undefined });
              }}
              placeholder="e.g., 0, 50, 100 or Jan, Feb, Mar"
            />
            <div className="text-xs text-muted-foreground">
              Comma-separated values for custom grid lines
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Custom Y Grid Values</Label>
            <Input
              value={config.gridYValues?.join(', ') || ''}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map(v => v.trim())
                  .filter(v => v)
                  .map(v => isNaN(Number(v)) ? v : Number(v));
                onChange({ gridYValues: values.length > 0 ? values : undefined });
              }}
              placeholder="e.g., 0, 25, 50, 75, 100"
            />
            <div className="text-xs text-muted-foreground">
              Comma-separated values for custom grid lines
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value Formatting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value Formatting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Value Format</Label>
            <Input
              value={typeof config.valueFormat === 'string' ? config.valueFormat : ''}
              onChange={(e) => onChange({ valueFormat: e.target.value || undefined })}
              placeholder="e.g., .2s, .0%, $,.0f"
            />
            <div className="text-xs text-muted-foreground">
              D3 format string for values (leave empty for default)
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tooltip Label</Label>
            <Input
              value={typeof config.tooltipLabel === 'string' ? config.tooltipLabel : ''}
              onChange={(e) => onChange({ tooltipLabel: e.target.value || undefined })}
              placeholder="Custom tooltip label"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Legend Label</Label>
            <Input
              value={typeof config.legendLabel === 'string' ? config.legendLabel : ''}
              onChange={(e) => onChange({ legendLabel: e.target.value || undefined })}
              placeholder="Custom legend label"
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Color Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color By</Label>
            <Select
              value={config.colorBy || 'id'}
              onValueChange={(value) => 
                onChange({ colorBy: value as 'id' | 'indexValue' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">ID (Series)</SelectItem>
                <SelectItem value="indexValue">Index Value (Categories)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              How to assign colors to bars
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactivity & Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interactivity & Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.isInteractive !== false}
                onCheckedChange={(checked) => onChange({ isInteractive: checked })}
              />
              <Label>Interactive</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.isFocusable !== false}
                onCheckedChange={(checked) => onChange({ isFocusable: checked })}
              />
              <Label>Focusable</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>ARIA Label</Label>
            <Input
              value={config.ariaLabel || ''}
              onChange={(e) => onChange({ ariaLabel: e.target.value || undefined })}
              placeholder="Accessible label for screen readers"
            />
          </div>
          
          <div className="space-y-2">
            <Label>ARIA Role</Label>
            <Input
              value={config.role || ''}
              onChange={(e) => onChange({ role: e.target.value || undefined })}
              placeholder="e.g., img, application"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
