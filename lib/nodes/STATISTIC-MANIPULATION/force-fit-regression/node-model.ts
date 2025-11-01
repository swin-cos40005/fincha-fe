import type {
  Cell,
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
  ColumnSpec,
} from '@/lib/types';
import { NodeModel } from '@/lib/nodes/core';
import * as math from 'mathjs';
import { SimpleCell } from '../../../types';

export interface RegressionStats {
  beta: number[];
  t: number[];
  p: number[];
  r2adj: number;
  cohenF2: number[];
  q2: number;
}

export interface RegressionTargets {
  targetR2?: number;
  targetBeta?: number[];
  targetCohenF2?: number;
  targetQ2?: number;
}

export class ForceRegressionNodeModel extends NodeModel {
  private static SAMPLE_COUNT_KEY = 'sampleCount';
  private static PREDICTOR_COUNT_KEY = 'predictorCount';
  private static TARGET_R2_KEY = 'targetR2';
  private static TARGET_BETA_KEY = 'targetBeta';
  private static TARGET_COHEN_F2_KEY = 'targetCohenF2';
  private static TARGET_Q2_KEY = 'targetQ2';
  private static CUSTOM_HEADERS_KEY = 'customHeaders';
  private static INPUT_FILE_HEADERS_KEY = 'inputFileHeaders';
  private static GENERATED_DATA_KEY = 'generatedData';
  private static TARGET_TYPE_KEY = 'targetType';

  private sampleCount: number = 100;
  private predictorCount: number = 3;
  private targetR2: number = 0.8;
  private targetBeta: number[] = [0.6, 0.2, 0.1];
  private targetCohenF2: number = 0.25;
  private targetQ2: number = 0.7;
  private targetType: 'r2' | 'beta' | 'cohenF2' | 'q2' = 'r2';
  private customHeaders: string[] = [];
  private inputFileHeaders: string[] = [];
  private generatedData: { X: number[][], y: number[], stats: RegressionStats } | null = null;

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(_inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    context.setProgress(0.1, 'Generating regression data...');
    
    try {
      // Generate the regression data based on target type
      switch (this.targetType) {
        case 'r2':
          this.generatedData = this.generateDataForTargetR2(
            this.sampleCount,
            this.predictorCount,
            this.targetR2
          );
          break;
        case 'beta':
          this.generatedData = this.generateDataForTargetBeta(
            this.sampleCount,
            this.targetBeta
          );
          break;
        case 'cohenF2':
          this.generatedData = this.generateDataForTargetCohenF2(
            this.sampleCount,
            this.predictorCount,
            this.targetCohenF2
          );
          break;
        case 'q2':
          this.generatedData = this.generateDataForTargetQ2(
            this.sampleCount,
            this.predictorCount,
            this.targetQ2
          );
          break;
        default:
          throw new Error(`Unsupported target type: ${this.targetType}`);
      }

      context.setProgress(0.5, 'Creating data table...');

      // Create output spec
      const outputSpec = this.createOutputSpec();
      const outputTable = context.createDataTable(outputSpec);

      // Add rows to output table (X + y combined)
      const { X, y } = this.generatedData;
      for (let i = 0; i < X.length; i++) {
        const row = [...X[i], y[i]];
        const cells: Cell[] = row.map((value) => 
          new SimpleCell('number', value)
        );
        outputTable.addRow(`row-${i}`, cells);
      }

      context.setProgress(1.0, 'Complete');
      
      return [outputTable.close()];
    } catch (error) {
      throw new Error(`Failed to generate regression data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  configure(_inSpecs: DataTableSpec[]): DataTableSpec[] {
    return [this.createOutputSpec()];
  }

  loadSettings(settings: SettingsObject): void {
    // Helper functions with fallback logic
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };

    const getString = (key: string, defaultValue: string): string => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'string' ? value : defaultValue;
    };

    this.sampleCount = getNumber(ForceRegressionNodeModel.SAMPLE_COUNT_KEY, 100);
    this.predictorCount = getNumber(ForceRegressionNodeModel.PREDICTOR_COUNT_KEY, 3);
    this.targetR2 = getNumber(ForceRegressionNodeModel.TARGET_R2_KEY, 0.8);
    this.targetCohenF2 = getNumber(ForceRegressionNodeModel.TARGET_COHEN_F2_KEY, 0.25);
    this.targetQ2 = getNumber(ForceRegressionNodeModel.TARGET_Q2_KEY, 0.7);
    
    // Load target beta
    const targetBetaStr = getString(ForceRegressionNodeModel.TARGET_BETA_KEY, '[0.6,0.2,0.1]');
    try {
      this.targetBeta = JSON.parse(targetBetaStr);
      if (this.targetBeta.length !== this.predictorCount) {
        // Adjust beta array to match predictor count
        this.targetBeta = this.adjustBetaArray(this.targetBeta, this.predictorCount);
      }
    } catch {
      this.targetBeta = this.generateDefaultBeta(this.predictorCount);
    }

    // Load target type
    const targetType = getString(ForceRegressionNodeModel.TARGET_TYPE_KEY, 'r2');
    this.targetType = ['r2', 'beta', 'cohenF2', 'q2'].includes(targetType) 
      ? targetType as 'r2' | 'beta' | 'cohenF2' | 'q2' 
      : 'r2';

    // Load custom headers
    const customHeadersStr = getString(ForceRegressionNodeModel.CUSTOM_HEADERS_KEY, '[]');
    try {
      this.customHeaders = JSON.parse(customHeadersStr);
    } catch {
      this.customHeaders = [];
    }

    // Load input file headers
    const inputFileHeadersStr = getString(ForceRegressionNodeModel.INPUT_FILE_HEADERS_KEY, '[]');
    try {
      this.inputFileHeaders = JSON.parse(inputFileHeadersStr);
    } catch {
      this.inputFileHeaders = [];
    }

    // Load generated data
    const generatedDataStr = getString(ForceRegressionNodeModel.GENERATED_DATA_KEY, 'null');
    try {
      this.generatedData = generatedDataStr === 'null' ? null : JSON.parse(generatedDataStr);
    } catch {
      this.generatedData = null;
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set(ForceRegressionNodeModel.SAMPLE_COUNT_KEY, this.sampleCount);
    settings.set(ForceRegressionNodeModel.PREDICTOR_COUNT_KEY, this.predictorCount);
    settings.set(ForceRegressionNodeModel.TARGET_R2_KEY, this.targetR2);
    settings.set(ForceRegressionNodeModel.TARGET_BETA_KEY, JSON.stringify(this.targetBeta));
    settings.set(ForceRegressionNodeModel.TARGET_COHEN_F2_KEY, this.targetCohenF2);
    settings.set(ForceRegressionNodeModel.TARGET_Q2_KEY, this.targetQ2);
    settings.set(ForceRegressionNodeModel.TARGET_TYPE_KEY, this.targetType);
    settings.set(ForceRegressionNodeModel.CUSTOM_HEADERS_KEY, JSON.stringify(this.customHeaders));
    settings.set(ForceRegressionNodeModel.INPUT_FILE_HEADERS_KEY, JSON.stringify(this.inputFileHeaders));
    settings.set(ForceRegressionNodeModel.GENERATED_DATA_KEY, JSON.stringify(this.generatedData));
  }

  validateSettings(settings: SettingsObject): void {
    // Helper functions with fallback logic
    const getNumber = (key: string, defaultValue: number): number => {
      if (settings.getNumber) {
        return settings.getNumber(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'number' ? value : defaultValue;
    };

    const getString = (key: string, defaultValue: string): string => {
      if (settings.getString) {
        return settings.getString(key, defaultValue);
      }
      const value = (settings as any)[key];
      return typeof value === 'string' ? value : defaultValue;
    };

    // Validate sample count
    const sampleCount = getNumber(ForceRegressionNodeModel.SAMPLE_COUNT_KEY, 100);
    if (sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }

    // Validate predictor count
    const predictorCount = getNumber(ForceRegressionNodeModel.PREDICTOR_COUNT_KEY, 3);
    if (predictorCount <= 0 || predictorCount > 10) {
      throw new Error('Predictor count must be between 1 and 10');
    }

    // Validate target R²
    const targetR2 = getNumber(ForceRegressionNodeModel.TARGET_R2_KEY, 0.8);
    if (targetR2 < 0 || targetR2 > 1) {
      throw new Error('Target R² must be between 0 and 1');
    }

    // Validate target Cohen's f²
    const targetCohenF2 = getNumber(ForceRegressionNodeModel.TARGET_COHEN_F2_KEY, 0.25);
    if (targetCohenF2 < 0) {
      throw new Error('Target Cohen\'s f² must be non-negative');
    }

    // Validate target Q²
    const targetQ2 = getNumber(ForceRegressionNodeModel.TARGET_Q2_KEY, 0.7);
    if (targetQ2 < 0 || targetQ2 > 1) {
      throw new Error('Target Q² must be between 0 and 1');
    }

    // Validate target beta
    const targetBetaStr = getString(ForceRegressionNodeModel.TARGET_BETA_KEY, '[0.6,0.2,0.1]');
    try {
      const targetBeta = JSON.parse(targetBetaStr);
      if (!Array.isArray(targetBeta) || targetBeta.length === 0) {
        throw new Error('Target beta must be a non-empty array');
      }
      if (targetBeta.some(b => typeof b !== 'number' || !isFinite(b))) {
        throw new Error('All target beta values must be finite numbers');
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Target beta')) {
        throw error;
      }
      throw new Error('Invalid target beta format - must be a valid JSON array');
    }
  }

  private createOutputSpec(): DataTableSpec {
    const headers = this.getColumnHeaders();
    
    const columns: ColumnSpec[] = headers.map((header) => ({
      name: header,
      type: 'number',
    }));

    return {
      columns,
      findColumnIndex(name: string): number {
        return columns.findIndex(col => col.name === name);
      }
    };
  }

  getColumnHeaders(): string[] {
    // Priority: Custom headers > Input file headers > Generated headers
    if (this.customHeaders.length > 0) {
      return this.customHeaders;
    }
    
    if (this.inputFileHeaders.length > 0) {
      return this.inputFileHeaders;
    }

    // Generate default headers (X1, X2, ..., Xk, Y)
    const headers: string[] = [];
    for (let i = 1; i <= this.predictorCount; i++) {
      headers.push(`X${i}`);
    }
    headers.push('Y');
    
    return headers;
  }

  // Core regression statistics computation
  computeRegressionStats(X: number[][], y: number[]): RegressionStats {
    const n = y.length;
    const k = X[0].length;
    
    try {
      const Xt = math.transpose(X) as number[][];
      const XtX = math.multiply(Xt, X) as number[][];
      const XtY = math.multiply(Xt, y) as number[];
      const beta = math.lusolve(XtX, XtY).map((v: any) => Array.isArray(v) ? v[0] : v);

      const yHat = math.multiply(X, beta) as number[];
      const residuals = math.subtract(y, yHat) as number[];
      const sse = math.sum(residuals.map(e => e ** 2)) as number;
      const sst = math.sum(y.map(v => (v - math.mean(y)) ** 2)) as number;
      const r2 = 1 - (sse / sst);
      const r2adj = 1 - ((1 - r2) * (n - 1) / (n - k - 1));

      const mse = sse / (n - k - 1);
      const XtXinv = math.inv(XtX) as number[][];
      const stdErr = XtXinv.map((row, i) => Math.sqrt(mse * row[i]));
      const t = beta.map((b, i) => b / stdErr[i]);
      const p = t.map(ti => 2 * (1 - this.erf(Math.abs(ti) / Math.sqrt(2))));

      const cohenF2 = beta.map((_, _i) => r2 / (1 - r2));
      const press = y.map((_, i) => (y[i] - yHat[i]) ** 2).reduce((a, b) => a + b, 0);
      const q2 = 1 - (press / sst);

      return { beta, t, p, r2adj, cohenF2, q2 };
    } catch (error) {
      throw new Error(`Failed to compute regression statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate data for target R²
  private generateDataForTargetR2(nSamples: number, nPredictors: number, targetR2: number): { X: number[][], y: number[], stats: RegressionStats } {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts++ < maxAttempts) {
      try {
        const X = this.generateRandomMatrix(nSamples, nPredictors, -1, 1);
        const weights = this.generateDefaultBeta(nPredictors);
        const y = X.map((row: number[]) => {
          const dotProduct = row.reduce((sum: number, val: number, idx: number) => sum + val * weights[idx], 0);
          return dotProduct + (Math.random() - 0.5) * 0.6; // Random noise between -0.3 and 0.3
        });

        const stats = this.computeRegressionStats(X, y);
        if (stats.r2adj >= targetR2) {
          return { X, y, stats };
        }
      } catch {
        // Continue to next attempt if this one fails
        continue;
      }
    }
    
    throw new Error(`Failed to generate regression data meeting R² target of ${targetR2} after ${maxAttempts} attempts`);
  }

  // Generate data for target beta
  private generateDataForTargetBeta(nSamples: number, targetBeta: number[]): { X: number[][], y: number[], stats: RegressionStats } {
    const nPredictors = targetBeta.length;
    
    try {
      const X = this.generateRandomMatrix(nSamples, nPredictors, -1, 1);
      const y = X.map((row: number[]) => {
        const dotProduct = row.reduce((sum: number, val: number, idx: number) => sum + val * targetBeta[idx], 0);
        return dotProduct + (Math.random() - 0.5) * 0.2; // Small noise to make it realistic
      });

      const stats = this.computeRegressionStats(X, y);
      return { X, y, stats };
    } catch {
      throw new Error(`Failed to generate regression data for target beta`);
    }
  }

  // Generate data for target Cohen's f²
  private generateDataForTargetCohenF2(nSamples: number, nPredictors: number, targetCohenF2: number): { X: number[][], y: number[], stats: RegressionStats } {
    // Cohen's f² = R² / (1 - R²), so R² = f² / (1 + f²)
    const impliedR2 = targetCohenF2 / (1 + targetCohenF2);
    return this.generateDataForTargetR2(nSamples, nPredictors, impliedR2);
  }

  // Generate data for target Q²
  private generateDataForTargetQ2(nSamples: number, nPredictors: number, targetQ2: number): { X: number[][], y: number[], stats: RegressionStats } {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts++ < maxAttempts) {
      try {
        const X = this.generateRandomMatrix(nSamples, nPredictors, -1, 1);
        const weights = this.generateDefaultBeta(nPredictors);
        const y = X.map((row: number[]) => {
          const dotProduct = row.reduce((sum: number, val: number, idx: number) => sum + val * weights[idx], 0);
          return dotProduct + (Math.random() - 0.5) * 0.6;
        });

        const stats = this.computeRegressionStats(X, y);
        if (stats.q2 >= targetQ2) {
          return { X, y, stats };
        }
      } catch {
        continue;
      }
    }
    
    throw new Error(`Failed to generate regression data meeting Q² target of ${targetQ2} after ${maxAttempts} attempts`);
  }

  // Helper functions
  private generateRandomMatrix(rows: number, cols: number, min: number, max: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(Math.random() * (max - min) + min);
      }
      result.push(row);
    }
    return result;
  }

  private generateDefaultBeta(count: number): number[] {
    const beta: number[] = [];
    for (let i = 0; i < count; i++) {
      beta.push(0.8 - (i * 0.2)); // Decreasing weights: 0.8, 0.6, 0.4, etc.
    }
    return beta;
  }

  private adjustBetaArray(currentBeta: number[], targetCount: number): number[] {
    if (currentBeta.length === targetCount) {
      return currentBeta;
    }
    
    if (currentBeta.length > targetCount) {
      return currentBeta.slice(0, targetCount);
    }
    
    // Extend array with decreasing values
    const result = [...currentBeta];
    const lastValue = result[result.length - 1] || 0.1;
    for (let i = result.length; i < targetCount; i++) {
      result.push(Math.max(0.1, lastValue - (i - result.length + 1) * 0.1));
    }
    return result;
  }

  // Error function approximation (same as cronbach node)
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Getters for external access
  getSampleCount(): number {
    return this.sampleCount;
  }

  getPredictorCount(): number {
    return this.predictorCount;
  }

  getTargetR2(): number {
    return this.targetR2;
  }

  getTargetBeta(): number[] {
    return this.targetBeta;
  }

  getTargetCohenF2(): number {
    return this.targetCohenF2;
  }

  getTargetQ2(): number {
    return this.targetQ2;
  }

  getTargetType(): 'r2' | 'beta' | 'cohenF2' | 'q2' {
    return this.targetType;
  }

  getCustomHeaders(): string[] {
    return this.customHeaders;
  }

  getInputFileHeaders(): string[] {
    return this.inputFileHeaders;
  }

  getGeneratedData(): { X: number[][], y: number[], stats: RegressionStats } | null {
    return this.generatedData;
  }

  // Setters for configuration
  setSampleCount(count: number): void {
    this.sampleCount = count;
  }

  setPredictorCount(count: number): void {
    this.predictorCount = count;
    // Adjust beta array to match new predictor count
    this.targetBeta = this.adjustBetaArray(this.targetBeta, count);
  }

  setTargetR2(r2: number): void {
    this.targetR2 = r2;
  }

  setTargetBeta(beta: number[]): void {
    this.targetBeta = beta;
    this.predictorCount = beta.length;
  }

  setTargetCohenF2(cohenF2: number): void {
    this.targetCohenF2 = cohenF2;
  }

  setTargetQ2(q2: number): void {
    this.targetQ2 = q2;
  }

  setTargetType(type: 'r2' | 'beta' | 'cohenF2' | 'q2'): void {
    this.targetType = type;
  }

  setCustomHeaders(headers: string[]): void {
    this.customHeaders = headers;
  }

  setInputFileHeaders(headers: string[]): void {
    this.inputFileHeaders = headers;
  }

  // Method to analyze CSV data and extract regression setup
  analyzeCSVData(csvContent: string): { headers: string[], predictorCount: number } {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse headers - handle both comma and semicolon separators
    let separator = ',';
    if (lines[0].includes(';') && !lines[0].includes(',')) {
      separator = ';';
    }
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Validate that we have numeric data
    const sampleRow = lines[1].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const numericColumns = sampleRow.filter(val => !isNaN(parseFloat(val)) && isFinite(parseFloat(val))).length;
    
    if (numericColumns < 2) {
      throw new Error('CSV file must contain at least 2 numeric columns (predictors + outcome)');
    }

    // Assume last column is the outcome variable, rest are predictors
    const predictorCount = Math.max(1, numericColumns - 1);

    return {
      headers: headers.slice(0, numericColumns),
      predictorCount
    };
  }
}
