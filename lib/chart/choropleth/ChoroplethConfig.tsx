// Choropleth Chart Configuration Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ChoroplethChartConfig } from './ChoroplethSchema';

interface ChoroplethConfigProps {
  config: ChoroplethChartConfig;
  onChange: (updates: Partial<ChoroplethChartConfig>) => void;
}

export const ChoroplethConfig: React.FC<ChoroplethConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Choropleth Chart Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Projection Settings */}
          <div className="space-y-2">
            <Label>Projection Type</Label>
            <Select
              value={config.projectionType || 'equalEarth'}
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
              value={config.projectionScale || 147}
              onChange={(e) =>
                onChange({ projectionScale: parseFloat(e.target.value) || 147 })
              }
              min="50"
              max="300"
              step="1"
            />
          </div>

          {/* Border Settings */}
          <div className="space-y-2">
            <Label>Border Width</Label>
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
            <Label>Border Color</Label>
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