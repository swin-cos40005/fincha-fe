// Geomap Chart Configuration Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { GeomapChartConfig } from './GeomapSchema';

interface GeomapConfigProps {
  config: GeomapChartConfig;
  onChange: (updates: Partial<GeomapChartConfig>) => void;
}

export const GeomapConfig: React.FC<GeomapConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Geomap Chart Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Projection Settings */}
          <div className="space-y-2">
            <Label>Projection Type</Label>
            <Select
              value={config.projectionType || 'mercator'}
              onValueChange={(value) =>
                onChange({ projectionType: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercator">Mercator</SelectItem>
                <SelectItem value="orthographic">Orthographic</SelectItem>
                <SelectItem value="stereographic">Stereographic</SelectItem>
                <SelectItem value="azimuthalEqualArea">Azimuthal Equal Area</SelectItem>
                <SelectItem value="azimuthalEquidistant">Azimuthal Equidistant</SelectItem>
                <SelectItem value="gnomonic">Gnomonic</SelectItem>
                <SelectItem value="equalEarth">Equal Earth</SelectItem>
                <SelectItem value="equirectangular">Equirectangular</SelectItem>
                <SelectItem value="transverseMercator">Transverse Mercator</SelectItem>
                <SelectItem value="naturalEarth1">Natural Earth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projection Scale */}
          <div className="space-y-2">
            <Label>Projection Scale</Label>
            <Input
              type="number"
              value={config.projectionScale || 1}
              onChange={(e) =>
                onChange({ projectionScale: parseFloat(e.target.value) || 1 })
              }
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          {/* Point Settings */}
          <div className="space-y-2">
            <Label>Point Size</Label>
            <Input
              type="number"
              value={typeof config.pointSize === 'number' ? config.pointSize : 6}
              onChange={(e) =>
                onChange({ pointSize: parseFloat(e.target.value) || 6 })
              }
              min="1"
              max="64"
              step="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Point Color</Label>
            <Input
              type="color"
              value={config.pointColor || '#ff0000'}
              onChange={(e) => onChange({ pointColor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Point Border Width</Label>
            <Input
              type="number"
              value={config.pointBorderWidth || 0}
              onChange={(e) =>
                onChange({ pointBorderWidth: parseFloat(e.target.value) || 0 })
              }
              min="0"
              max="10"
              step="0.5"
            />
          </div>

          <div className="space-y-2">
            <Label>Point Border Color</Label>
            <Input
              type="color"
              value={config.pointBorderColor || '#000000'}
              onChange={(e) => onChange({ pointBorderColor: e.target.value })}
            />
          </div>

          {/* Border Settings */}
          <div className="space-y-2">
            <Label>Map Border Width</Label>
            <Input
              type="number"
              value={config.borderWidth || 0.5}
              onChange={(e) =>
                onChange({ borderWidth: parseFloat(e.target.value) || 0 })
              }
              min="0"
              max="10"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label>Map Border Color</Label>
            <Input
              type="color"
              value={config.borderColor || '#152538'}
              onChange={(e) => onChange({ borderColor: e.target.value })}
            />
          </div>

          {/* Unknown Color */}
          <div className="space-y-2">
            <Label>Unknown Data Color</Label>
            <Input
              type="color"
              value={config.unknownColor || '#666666'}
              onChange={(e) => onChange({ unknownColor: e.target.value })}
            />
          </div>

          {/* Graticule */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enableGraticule"
              checked={config.enableGraticule || false}
              onCheckedChange={(checked) =>
                onChange({ enableGraticule: checked })
              }
            />
            <Label htmlFor="enableGraticule">Enable Graticule (Grid)</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 