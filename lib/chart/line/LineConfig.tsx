import React from 'react';
import type { LineChartConfig } from './LineSchema';
import type { LegendConfig } from '../utils';
import { Card } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Settings, Eye, Zap, Accessibility } from 'lucide-react';

interface LineConfigProps {
  config: LineChartConfig;
  onChange: (updates: Partial<LineChartConfig>) => void;
}

export const LineConfig: React.FC<LineConfigProps> = ({ config, onChange }) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    basic: true,
    scales: false,
    points: false,
    area: false,
    grid: false,
    axes: false,
    legends: false,
    interactivity: false,
    accessibility: false,
    performance: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Card className="bg-card p-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="size-4" />
            Line Chart Configuration
          </h4>
          <Badge variant="secondary">Nivo 0.98.0</Badge>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="flex w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="interactivity">Interactive</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-4">
            {/* Chart Title and Description */}
            <div className="space-y-2">
              <Label>Chart Title</Label>
              <Input
                value={config.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Enter chart title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={config.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Enter chart description"
                rows={2}
              />
            </div>

            {/* Line Properties */}
            <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Line Properties</span>
                  {openSections.basic ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Curve Type</Label>
                    <Select
                      value={config.curve || 'linear'}
                      onValueChange={(value) => onChange({ curve: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basis">Basis</SelectItem>
                        <SelectItem value="cardinal">Cardinal</SelectItem>
                        <SelectItem value="catmullRom">Catmull Rom</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="monotoneX">Monotone X</SelectItem>
                        <SelectItem value="monotoneY">Monotone Y</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="step">Step</SelectItem>
                        <SelectItem value="stepAfter">Step After</SelectItem>
                        <SelectItem value="stepBefore">Step Before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Line Width ({config.lineWidth || 2})</Label>
                    <Slider
                      value={[config.lineWidth || 2]}
                      onValueChange={(value) => onChange({ lineWidth: value[0] })}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Margins */}
            <div className="space-y-2">
              <Label>Margins</Label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Top</Label>
                  <Input
                    type="number"
                    value={config.margin?.top || 50}
                    onChange={(e) => onChange({
                      margin: { ...config.margin, top: Number(e.target.value) }
                    })}
                    min={0}
                    max={200}
                  />
                </div>
                <div>
                  <Label className="text-xs">Right</Label>
                  <Input
                    type="number"
                    value={config.margin?.right || 110}
                    onChange={(e) => onChange({
                      margin: { ...config.margin, right: Number(e.target.value) }
                    })}
                    min={0}
                    max={200}
                  />
                </div>
                <div>
                  <Label className="text-xs">Bottom</Label>
                  <Input
                    type="number"
                    value={config.margin?.bottom || 50}
                    onChange={(e) => onChange({
                      margin: { ...config.margin, bottom: Number(e.target.value) }
                    })}
                    min={0}
                    max={200}
                  />
                </div>
                <div>
                  <Label className="text-xs">Left</Label>
                  <Input
                    type="number"
                    value={config.margin?.left || 60}
                    onChange={(e) => onChange({
                      margin: { ...config.margin, left: Number(e.target.value) }
                    })}
                    min={0}
                    max={200}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            {/* Scales */}
            <Collapsible open={openSections.scales} onOpenChange={() => toggleSection('scales')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Scales</span>
                  {openSections.scales ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* X Scale */}
                <div className="space-y-4">
                  <h5 className="font-medium">X Scale</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={config.xScale?.type || 'linear'}
                        onValueChange={(value) =>
                          onChange({
                            xScale: {
                              type: value as 'point' | 'linear' | 'time',
                              ...config.xScale,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="point">Point</SelectItem>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Min</Label>
                      <Input
                        placeholder="auto"
                        value={
                          (config.xScale?.type === 'linear' || config.xScale?.type === 'time')
                            ? (config.xScale?.min === 'auto' 
                                ? '' 
                                : config.xScale?.min instanceof Date 
                                  ? config.xScale.min.toISOString().split('T')[0]
                                  : config.xScale?.min !== undefined
                                    ? String(config.xScale.min)
                                    : '')
                            : ''
                        }
                        disabled={config.xScale?.type === 'point'}
                        type={config.xScale?.type === 'time' ? 'date' : 'text'}
                        onChange={(e) => {
                          const currentType = config.xScale?.type || 'linear';
                          const value = e.target.value;
                          
                          if (currentType === 'linear') {
                            if (value === '') {
                              // Empty value - don't update the config, just show empty
                              return;
                            } else if (value === 'auto') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  min: 'auto',
                                } as any,
                              });
                            } else if (!isNaN(Number(value)) && value.trim() !== '') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  min: Number(value),
                                } as any,
                              });
                            }
                            // Invalid input - don't update, let user continue typing
                          } else if (currentType === 'time') {
                            if (value === '') {
                              return;
                            } else if (value === 'auto') {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  min: 'auto',
                                } as any,
                              });
                            } else {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  min: new Date(value),
                                } as any,
                              });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, if empty, set to auto
                          const currentType = config.xScale?.type || 'linear';
                          const value = e.target.value;
                          
                          if (value === '') {
                            if (currentType === 'linear') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  min: 'auto',
                                } as any,
                              });
                            } else if (currentType === 'time') {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  min: 'auto',
                                } as any,
                              });
                            }
                          } else if (currentType === 'linear' && !isNaN(Number(value)) && value.trim() !== '') {
                            // Valid number, keep it
                            onChange({
                              xScale: {
                                type: 'linear',
                                min: Number(value),
                              } as any,
                            });
                          } else if (currentType === 'linear' && value !== 'auto') {
                            // Invalid number, reset to auto
                            onChange({
                              xScale: {
                                type: 'linear',
                                min: 'auto',
                              } as any,
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max</Label>
                      <Input
                        placeholder="auto"
                        value={
                          (config.xScale?.type === 'linear' || config.xScale?.type === 'time')
                            ? (config.xScale?.max === 'auto' 
                                ? '' 
                                : config.xScale?.max instanceof Date 
                                  ? config.xScale.max.toISOString().split('T')[0]
                                  : config.xScale?.max !== undefined
                                    ? String(config.xScale.max)
                                    : '')
                            : ''
                        }
                        disabled={config.xScale?.type === 'point'}
                        type={config.xScale?.type === 'time' ? 'date' : 'text'}
                        onChange={(e) => {
                          const currentType = config.xScale?.type || 'linear';
                          const value = e.target.value;
                          
                          if (currentType === 'linear') {
                            if (value === '') {
                              // Empty value - don't update the config, just show empty
                              return;
                            } else if (value === 'auto') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  max: 'auto',
                                } as any,
                              });
                            } else if (!isNaN(Number(value)) && value.trim() !== '') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  max: Number(value),
                                } as any,
                              });
                            }
                            // Invalid input - don't update, let user continue typing
                          } else if (currentType === 'time') {
                            if (value === '') {
                              return;
                            } else if (value === 'auto') {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  max: 'auto',
                                } as any,
                              });
                            } else {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  max: new Date(value),
                                } as any,
                              });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, if empty, set to auto
                          const currentType = config.xScale?.type || 'linear';
                          const value = e.target.value;
                          
                          if (value === '') {
                            if (currentType === 'linear') {
                              onChange({
                                xScale: {
                                  type: 'linear',
                                  max: 'auto',
                                } as any,
                              });
                            } else if (currentType === 'time') {
                              onChange({
                                xScale: {
                                  type: 'time',
                                  max: 'auto',
                                } as any,
                              });
                            }
                          } else if (currentType === 'linear' && !isNaN(Number(value)) && value.trim() !== '') {
                            // Valid number, keep it
                            onChange({
                              xScale: {
                                type: 'linear',
                                max: Number(value),
                              } as any,
                            });
                          } else if (currentType === 'linear' && value !== 'auto') {
                            // Invalid number, reset to auto
                            onChange({
                              xScale: {
                                type: 'linear',
                                max: 'auto',
                              } as any,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Y Scale */}
                <div className="space-y-4">
                  <h5 className="font-medium">Y Scale</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={config.yScale?.type || 'linear'}
                        onValueChange={(value) =>
                          onChange({
                            yScale: {
                              type: value as 'linear' | 'symlog',
                              ...config.yScale,
                            },
                          })
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
                      <Label>Min</Label>
                      <Input
                        placeholder="auto"
                        value={
                          config.yScale?.min === 'auto'
                            ? ''
                            : config.yScale?.min || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            // Empty value - don't update the config, just show empty
                            return;
                          } else if (value === 'auto') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                min: 'auto',
                              },
                            });
                          } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                min: Number(value),
                              },
                            });
                          }
                          // Invalid input - don't update, let user continue typing
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === 'auto' || value === '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                min: 'auto',
                              },
                            });
                          } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                min: Number(value),
                              },
                            });
                          } else {
                            // Invalid number, reset to auto
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                min: 'auto',
                              },
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max</Label>
                      <Input
                        placeholder="auto"
                        value={
                          config.yScale?.max === 'auto'
                            ? ''
                            : config.yScale?.max || ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            // Empty value - don't update the config, just show empty
                            return;
                          } else if (value === 'auto') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                max: 'auto',
                              },
                            });
                          } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                max: Number(value),
                              },
                            });
                          }
                          // Invalid input - don't update, let user continue typing
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === 'auto' || value === '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                max: 'auto',
                              },
                            });
                          } else if (!isNaN(Number(value)) && value.trim() !== '') {
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                max: Number(value),
                              },
                            });
                          } else {
                            // Invalid number, reset to auto
                            onChange({
                              yScale: {
                                type: config.yScale?.type || 'linear',
                                ...config.yScale,
                                max: 'auto',
                              },
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.yScale?.stacked || false}
                        onCheckedChange={(checked) =>
                          onChange({
                            yScale: {
                              type: config.yScale?.type || 'linear',
                              ...config.yScale,
                              stacked: checked,
                            },
                          })
                        }
                      />
                      <Label>Stacked</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.yScale?.reverse || false}
                        onCheckedChange={(checked) =>
                          onChange({
                            yScale: {
                              type: config.yScale?.type || 'linear',
                              ...config.yScale,
                              reverse: checked,
                            },
                          })
                        }
                      />
                      <Label>Reverse</Label>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Points */}
            <Collapsible open={openSections.points} onOpenChange={() => toggleSection('points')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Points</span>
                  {openSections.points ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enablePoints || false}
                      onCheckedChange={(checked) =>
                        onChange({ enablePoints: checked })
                      }
                    />
                    <Label>Enable Points</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enablePointLabel || false}
                      onCheckedChange={(checked) =>
                        onChange({ enablePointLabel: checked })
                      }
                    />
                    <Label>Enable Point Labels</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Size ({config.pointSize || 8})</Label>
                    <Slider
                      value={[config.pointSize || 8]}
                      onValueChange={(value) => onChange({ pointSize: value[0] })}
                      min={4}
                      max={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Border Width</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={config.pointBorderWidth || 0}
                      onChange={(e) =>
                        onChange({
                          pointBorderWidth: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={config.pointColor || '#ffffff'}
                      onChange={(e) => onChange({ pointColor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <Input
                      type="color"
                      value={config.pointBorderColor || '#000000'}
                      onChange={(e) => onChange({ pointBorderColor: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Point Label</Label>
                    <Input
                      value={config.pointLabel || ''}
                      onChange={(e) => onChange({ pointLabel: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Label Y Offset</Label>
                    <Input
                      type="number"
                      value={config.pointLabelYOffset || 0}
                      onChange={(e) =>
                        onChange({
                          pointLabelYOffset: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Areas */}
            <Collapsible open={openSections.area} onOpenChange={() => toggleSection('area')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Area Fill</span>
                  {openSections.area ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enableArea || false}
                    onCheckedChange={(checked) => onChange({ enableArea: checked })}
                  />
                  <Label>Enable Area</Label>
                </div>

                <div className="space-y-2">
                  <Label>Opacity ({config.areaOpacity || 0.2})</Label>
                  <Slider
                    value={[config.areaOpacity || 0.2]}
                    onValueChange={(value) => onChange({ areaOpacity: value[0] })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Baseline Value</Label>
                  <Input
                    type="number"
                    value={config.areaBaselineValue || 0}
                    onChange={(e) =>
                      onChange({ areaBaselineValue: Number(e.target.value) })
                    }
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Grid and Crosshair */}
            <Collapsible open={openSections.grid} onOpenChange={() => toggleSection('grid')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Grid & Crosshair</span>
                  {openSections.grid ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableGridX || false}
                      onCheckedChange={(checked) =>
                        onChange({ enableGridX: checked })
                      }
                    />
                    <Label>Enable Grid X</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableGridY || false}
                      onCheckedChange={(checked) =>
                        onChange({ enableGridY: checked })
                      }
                    />
                    <Label>Enable Grid Y</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableCrosshair || false}
                      onCheckedChange={(checked) =>
                        onChange({ enableCrosshair: checked })
                      }
                    />
                    <Label>Enable Crosshair</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableTouchCrosshair || false}
                      onCheckedChange={(checked) =>
                        onChange({ enableTouchCrosshair: checked })
                      }
                    />
                    <Label>Touch Crosshair</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Crosshair Type</Label>
                  <Select
                    value={config.crosshairType || 'cross'}
                    onValueChange={(value) =>
                      onChange({ crosshairType: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="x">X</SelectItem>
                      <SelectItem value="y">Y</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Axes */}
            <Collapsible open={openSections.axes} onOpenChange={() => toggleSection('axes')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Axes</span>
                  {openSections.axes ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!config.axisBottom}
                      onCheckedChange={(checked) =>
                        onChange({
                          axisBottom: checked ? { legend: 'X Axis' } : null,
                        })
                      }
                    />
                    <Label>Bottom Axis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!config.axisLeft}
                      onCheckedChange={(checked) =>
                        onChange({
                          axisLeft: checked ? { legend: 'Y Axis' } : null,
                        })
                      }
                    />
                    <Label>Left Axis</Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* Interactivity Tab */}
          <TabsContent value="interactivity" className="space-y-4">
            <Collapsible open={openSections.interactivity} onOpenChange={() => toggleSection('interactivity')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span>Interactivity Settings</span>
                  {openSections.interactivity ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.isInteractive !== false}
                      onCheckedChange={(checked) =>
                        onChange({ isInteractive: checked })
                      }
                    />
                    <Label>Interactive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.useMesh || false}
                      onCheckedChange={(checked) =>
                        onChange({ useMesh: checked })
                      }
                    />
                    <Label>Use Mesh</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Slices</Label>
                  <Select
                    value={config.enableSlices || 'false'}
                    onValueChange={(value) =>
                      onChange({ enableSlices: value === 'false' ? false : value as 'x' | 'y' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Disabled</SelectItem>
                      <SelectItem value="x">X Axis</SelectItem>
                      <SelectItem value="y">Y Axis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.debugSlices || false}
                    onCheckedChange={(checked) =>
                      onChange({ debugSlices: checked })
                    }
                  />
                  <Label>Debug Slices</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.debugMesh || false}
                    onCheckedChange={(checked) =>
                      onChange({ debugMesh: checked })
                    }
                  />
                  <Label>Debug Mesh</Label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Animation */}
            <div className="space-y-4">
              <h5 className="font-medium">Animation</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.animate !== false}
                    onCheckedChange={(checked) =>
                      onChange({ animate: checked })
                    }
                  />
                  <Label>Enable Animation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.skipAnimation || false}
                    onCheckedChange={(checked) =>
                      onChange({ skipAnimation: checked })
                    }
                  />
                  <Label>Skip Animation</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motion Config</Label>
                <Select
                  value={config.motionConfig || 'default'}
                  onValueChange={(value) =>
                    onChange({ motionConfig: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="gentle">Gentle</SelectItem>
                    <SelectItem value="wobbly">Wobbly</SelectItem>
                    <SelectItem value="stiff">Stiff</SelectItem>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="molasses">Molasses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Accessibility */}
            <Collapsible open={openSections.accessibility} onOpenChange={() => toggleSection('accessibility')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span className="flex items-center gap-2">
                    <Accessibility className="size-4" />
                    Accessibility
                  </span>
                  {openSections.accessibility ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>ARIA Label</Label>
                  <Input
                    value={config.ariaLabel || ''}
                    onChange={(e) => onChange({ ariaLabel: e.target.value })}
                    placeholder="Chart description for screen readers"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ARIA Labelled By</Label>
                  <Input
                    value={config.ariaLabelledBy || ''}
                    onChange={(e) => onChange({ ariaLabelledBy: e.target.value })}
                    placeholder="ID of element that labels this chart"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ARIA Described By</Label>
                  <Input
                    value={config.ariaDescribedBy || ''}
                    onChange={(e) => onChange({ ariaDescribedBy: e.target.value })}
                    placeholder="ID of element that describes this chart"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.isFocusable || false}
                    onCheckedChange={(checked) =>
                      onChange({ isFocusable: checked })
                    }
                  />
                  <Label>Focusable</Label>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={config.role || ''}
                    onChange={(e) => onChange({ role: e.target.value })}
                    placeholder="img, application, etc."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Performance */}
            <Collapsible open={openSections.performance} onOpenChange={() => toggleSection('performance')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span className="flex items-center gap-2">
                    <Zap className="size-4" />
                    Performance
                  </span>
                  {openSections.performance ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableOptimizations || false}
                      onCheckedChange={(checked) =>
                        onChange({ enableOptimizations: checked })
                      }
                    />
                    <Label>Enable Optimizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.reduceMotion || false}
                      onCheckedChange={(checked) =>
                        onChange({ reduceMotion: checked })
                      }
                    />
                    <Label>Reduce Motion</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pixel Ratio</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    step="0.5"
                    value={config.pixelRatio || 1}
                    onChange={(e) =>
                      onChange({ pixelRatio: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Layers</Label>
                  <Select
                    value="all"
                    onValueChange={(value) => {
                      const layers = value === 'all' 
                        ? ['grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'slices', 'points', 'mesh', 'legends']
                        : value === 'minimal'
                        ? ['grid', 'axes', 'lines', 'points']
                        : ['grid', 'axes', 'lines', 'points', 'legends'];
                      onChange({ layers });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Layers</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Legends */}
            <Collapsible open={openSections.legends} onOpenChange={() => toggleSection('legends')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2">
                  <span className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Legends
                  </span>
                  {openSections.legends ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Legend Position</Label>
                  <Select
                    value="bottom"
                    onValueChange={(value) => {
                      const legend: LegendConfig = {
                        anchor: value as any,
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemWidth: 80,
                        itemHeight: 18,
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 12,
                        symbolShape: 'circle',
                      };
                      onChange({ legends: [legend] });
                    }}
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

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={!!config.legends?.length}
                    onCheckedChange={(checked) =>
                      onChange({
                        legends: checked ? [{
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemWidth: 80,
                          itemHeight: 18,
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 12,
                          symbolShape: 'circle',
                        }] : []
                      })
                    }
                  />
                  <Label>Show Legend</Label>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};
