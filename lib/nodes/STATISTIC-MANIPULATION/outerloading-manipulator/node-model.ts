import type {
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
} from '@/lib/types';
import { NodeModel } from '@/lib/nodes/core';
import * as math from 'mathjs';
import { SimpleCell } from '../../../types';

export class OuterLoadingManipulatorNodeModel extends NodeModel {
  static readonly N_SAMPLES_KEY = 'nSamples';
  static readonly TARGET_LOADING_KEY = 'targetLoading';
  static readonly NUM_INDICATORS_KEY = 'numIndicators';

  nSamples = 200;
  targetLoading = 0.7;
  numIndicators = 5;
  generatedData: number[][] | null = null;

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(
    _inputs: DataTableType[],
    context: ExecutionContext
  ): Promise<DataTableType[]> {
    try {
      context.setProgress(0.1, 'Generating indicators...');
      this.generatedData = this.generateIndicatorsWithTargetLoading({
        nSamples: this.nSamples,
        targetLoading: this.targetLoading,
        numIndicators: this.numIndicators,
      });
      context.setProgress(0.7, 'Building output table...');
      const outputSpec = this.createOutputSpec();
      const outputTable = context.createDataTable(outputSpec);
      for (let i = 0; i < this.generatedData.length; i++) {
        const row = this.generatedData[i].map((v) => new SimpleCell('number', v));
        outputTable.addRow(`row-${i}`, row);
      }
      context.setProgress(1.0, 'Complete');
      return [outputTable.close()];
    } catch (error) {
      throw new Error(`Failed to generate indicators: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    return [this.createOutputSpec()];
  }

  loadSettings(settings: SettingsObject): void {
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };
    this.nSamples = getNumber(OuterLoadingManipulatorNodeModel.N_SAMPLES_KEY, 200);
    this.targetLoading = getNumber(OuterLoadingManipulatorNodeModel.TARGET_LOADING_KEY, 0.7);
    this.numIndicators = getNumber(OuterLoadingManipulatorNodeModel.NUM_INDICATORS_KEY, 5);
  }

  saveSettings(settings: SettingsObject): void {
    settings.set('nSamples', this.nSamples);
    settings.set('targetLoading', this.targetLoading);
    settings.set('numIndicators', this.numIndicators);
  }

  validateSettings(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.nSamples <= 0) {
      errors.push('Sample count must be positive');
    }
    if (this.nSamples > 10000) {
      errors.push('Sample count should not exceed 10,000 for performance reasons');
    }

    if (this.targetLoading <= 0 || this.targetLoading >= 1) {
      errors.push('Target loading must be between 0 and 1');
    }

    if (this.numIndicators < 2) {
      errors.push('Number of indicators must be at least 2');
    }
    if (this.numIndicators > 20) {
      errors.push('Number of indicators should not exceed 20 for performance reasons');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private createOutputSpec(): DataTableSpec {
    return {
      columns: Array.from({ length: this.numIndicators }, (_, i) => ({
        name: `Indicator${i + 1}`,
        type: 'number',
      })),
      findColumnIndex: (name: string) => {
        const index = Array.from({ length: this.numIndicators }, (_, i) => `Indicator${i + 1}`).indexOf(name);
        return index >= 0 ? index : -1;
      },
    };
  }

  private generateIndicatorsWithTargetLoading(config: {
    nSamples: number;
    targetLoading: number;
    numIndicators: number;
  }): number[][] {
    const { nSamples, targetLoading, numIndicators } = config;
    const latent = math.random([nSamples], -1, 1);
    const indicators: number[][] = [];
    for (let i = 0; i < numIndicators; i++) {
      let indicator = [];
      let corr = 0;
      let attempts = 0;
      do {
        const noise = math.random([nSamples], -1, 1);
        indicator = latent.map((l: number, j: number) => 0.8 * l + 0.2 * noise[j]);
        corr = Number(math.corr(indicator, latent));
        attempts++;
      } while (Math.abs(corr) < targetLoading && attempts < 50);
      indicators.push(indicator);
    }
    // transpose to row-wise samples
    return math.transpose(indicators) as number[][];
  }
}
