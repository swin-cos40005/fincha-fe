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

export interface OuterLoadingTargetConfig {
  nSamples: number;
  targetLoading: number;
  numIndicators: number;
}

export interface AVEResults {
  loadings: number[][];
  ave: number;
  reliability: number;
  discriminantValidity: number;
}

export class EVAManipulatorNodeModel extends NodeModel {
  private static SAMPLE_COUNT_KEY = 'sampleCount';
  private static NUM_FACTORS_KEY = 'numFactors';
  private static INDICATORS_PER_FACTOR_KEY = 'indicatorsPerFactor';
  private static TARGET_AVE_KEY = 'targetAVE';
  private static TARGET_RELIABILITY_KEY = 'targetReliability';
  private static CUSTOM_HEADERS_KEY = 'customHeaders';
  private static INPUT_FILE_HEADERS_KEY = 'inputFileHeaders';
  private static GENERATED_DATA_KEY = 'generatedData';
  private static GENERATION_METHOD_KEY = 'generationMethod';

  private sampleCount: number = 200;
  private numFactors: number = 3;
  private indicatorsPerFactor: number = 4;
  private targetAVE: number = 0.5;
  private targetReliability: number = 0.7;
  private generationMethod: 'ave' | 'reliability' | 'both' = 'ave';
  private customHeaders: string[] = [];
  private inputFileHeaders: string[] = [];
  private generatedData: { 
    loadings: number[][], 
    factorScores: number[][],
    indicatorData: number[][],
    results: AVEResults 
  } | null = null;

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(_inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    context.setProgress(0.1, 'Generating factor loadings...');
    
    try {
      // Generate the factor structure based on method
      switch (this.generationMethod) {
        case 'ave':
          this.generatedData = this.generateDataForTargetAVE(
            this.sampleCount,
            this.numFactors,
            this.indicatorsPerFactor,
            this.targetAVE
          );
          break;
        case 'reliability':
          this.generatedData = this.generateDataForTargetReliability(
            this.sampleCount,
            this.numFactors,
            this.indicatorsPerFactor,
            this.targetReliability
          );
          break;
        case 'both':
          this.generatedData = this.generateDataForBothTargets(
            this.sampleCount,
            this.numFactors,
            this.indicatorsPerFactor,
            this.targetAVE,
            this.targetReliability
          );
          break;
        default:
          throw new Error(`Unsupported generation method: ${this.generationMethod}`);
      }

      context.setProgress(0.5, 'Creating data table...');

      // Create output spec
      const outputSpec = this.createOutputSpec();
      const outputTable = context.createDataTable(outputSpec);

      // Add rows to output table (indicator data)
      const { indicatorData } = this.generatedData;
      for (let i = 0; i < indicatorData.length; i++) {
        const cells: Cell[] = indicatorData[i].map((value) => 
          new SimpleCell('number', value)
        );
        outputTable.addRow(`row-${i}`, cells);
      }

      context.setProgress(1.0, 'Complete');
      
      return [outputTable.close()];
    } catch (error) {
      throw new Error(`Failed to generate factor structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    this.sampleCount = getNumber(EVAManipulatorNodeModel.SAMPLE_COUNT_KEY, 200);
    this.numFactors = getNumber(EVAManipulatorNodeModel.NUM_FACTORS_KEY, 3);
    this.indicatorsPerFactor = getNumber(EVAManipulatorNodeModel.INDICATORS_PER_FACTOR_KEY, 4);
    this.targetAVE = getNumber(EVAManipulatorNodeModel.TARGET_AVE_KEY, 0.5);
    this.targetReliability = getNumber(EVAManipulatorNodeModel.TARGET_RELIABILITY_KEY, 0.7);
    
    // Load generation method
    const method = getString(EVAManipulatorNodeModel.GENERATION_METHOD_KEY, 'ave');
    this.generationMethod = ['ave', 'reliability', 'both'].includes(method) 
      ? method as 'ave' | 'reliability' | 'both' 
      : 'ave';

    // Load custom headers
    const customHeadersStr = getString(EVAManipulatorNodeModel.CUSTOM_HEADERS_KEY, '[]');
    try {
      this.customHeaders = JSON.parse(customHeadersStr);
    } catch {
      this.customHeaders = [];
    }

    // Load input file headers
    const inputFileHeadersStr = getString(EVAManipulatorNodeModel.INPUT_FILE_HEADERS_KEY, '[]');
    try {
      this.inputFileHeaders = JSON.parse(inputFileHeadersStr);
    } catch {
      this.inputFileHeaders = [];
    }

    // Load generated data
    const generatedDataStr = getString(EVAManipulatorNodeModel.GENERATED_DATA_KEY, 'null');
    try {
      this.generatedData = generatedDataStr === 'null' ? null : JSON.parse(generatedDataStr);
    } catch {
      this.generatedData = null;
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set(EVAManipulatorNodeModel.SAMPLE_COUNT_KEY, this.sampleCount);
    settings.set(EVAManipulatorNodeModel.NUM_FACTORS_KEY, this.numFactors);
    settings.set(EVAManipulatorNodeModel.INDICATORS_PER_FACTOR_KEY, this.indicatorsPerFactor);
    settings.set(EVAManipulatorNodeModel.TARGET_AVE_KEY, this.targetAVE);
    settings.set(EVAManipulatorNodeModel.TARGET_RELIABILITY_KEY, this.targetReliability);
    settings.set(EVAManipulatorNodeModel.GENERATION_METHOD_KEY, this.generationMethod);
    settings.set(EVAManipulatorNodeModel.CUSTOM_HEADERS_KEY, JSON.stringify(this.customHeaders));
    settings.set(EVAManipulatorNodeModel.INPUT_FILE_HEADERS_KEY, JSON.stringify(this.inputFileHeaders));
    settings.set(EVAManipulatorNodeModel.GENERATED_DATA_KEY, JSON.stringify(this.generatedData));
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
    const sampleCount = getNumber(EVAManipulatorNodeModel.SAMPLE_COUNT_KEY, 200);
    if (sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }

    // Validate number of factors
    const numFactors = getNumber(EVAManipulatorNodeModel.NUM_FACTORS_KEY, 3);
    if (numFactors <= 0 || numFactors > 10) {
      throw new Error('Number of factors must be between 1 and 10');
    }

    // Validate indicators per factor
    const indicatorsPerFactor = getNumber(EVAManipulatorNodeModel.INDICATORS_PER_FACTOR_KEY, 4);
    if (indicatorsPerFactor < 2 || indicatorsPerFactor > 20) {
      throw new Error('Indicators per factor must be between 2 and 20');
    }

    // Validate target AVE
    const targetAVE = getNumber(EVAManipulatorNodeModel.TARGET_AVE_KEY, 0.5);
    if (targetAVE < 0 || targetAVE > 1) {
      throw new Error('Target AVE must be between 0 and 1');
    }

    // Validate target reliability
    const targetReliability = getNumber(EVAManipulatorNodeModel.TARGET_RELIABILITY_KEY, 0.7);
    if (targetReliability < 0 || targetReliability > 1) {
      throw new Error('Target reliability must be between 0 and 1');
    }

    // Validate generation method
    const method = getString(EVAManipulatorNodeModel.GENERATION_METHOD_KEY, 'ave');
    if (!['ave', 'reliability', 'both'].includes(method)) {
      throw new Error('Generation method must be one of: ave, reliability, both');
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

    // Generate default headers (F1_I1, F1_I2, ..., F2_I1, F2_I2, ...)
    const headers: string[] = [];
    for (let f = 1; f <= this.numFactors; f++) {
      for (let i = 1; i <= this.indicatorsPerFactor; i++) {
        headers.push(`F${f}_I${i}`);
      }
    }
    
    return headers;
  }

  // Core AVE computation function (from example)
  computeAVE(loadings: number[]): number {
    if (loadings.length === 0) return 0;
    return math.mean(loadings.map(l => l ** 2)) as number;
  }

  // Boost AVE function (from example)
  boostAVE(loadings: number[], targetAVE: number): number[] {
    let currentAVE = this.computeAVE(loadings);
    const newLoadings = [...loadings];

    for (let i = 0; i < loadings.length; i++) {
      while (currentAVE < targetAVE && newLoadings[i] < 1.0) {
        newLoadings[i] += 0.01; // push up artificially
        currentAVE = this.computeAVE(newLoadings);
        
        // Prevent infinite loops
        if (newLoadings[i] >= 0.99) break;
      }
      
      // Early exit if target is reached
      if (currentAVE >= targetAVE) break;
    }

    return newLoadings;
  }

  // Compute composite reliability
  computeCompositeReliability(loadings: number[]): number {
    const sumLoadings = loadings.reduce((sum, loading) => sum + loading, 0);
    const sumSquaredLoadings = loadings.reduce((sum, loading) => sum + loading ** 2, 0);
    const errorVariance = loadings.length - sumSquaredLoadings; // assuming error variance = 1 - loading²
    
    return (sumLoadings ** 2) / ((sumLoadings ** 2) + errorVariance);
  }

  // Generate factor loadings for target AVE
  private generateDataForTargetAVE(
    nSamples: number,
    numFactors: number,
    indicatorsPerFactor: number,
    targetAVE: number
  ): { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } {
    // Generate initial random loadings
    const loadings: number[][] = [];
    for (let f = 0; f < numFactors; f++) {
      let factorLoadings = this.generateRandomArray(indicatorsPerFactor, 0.3, 0.7);
      // Boost to meet AVE target
      factorLoadings = this.boostAVE(factorLoadings, targetAVE);
      loadings.push(factorLoadings);
    }

    return this.generateIndicatorData(nSamples, loadings);
  }

  // Generate factor loadings for target reliability
  private generateDataForTargetReliability(
    nSamples: number,
    numFactors: number,
    indicatorsPerFactor: number,
    targetReliability: number
  ): { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } {
    const loadings: number[][] = [];
    
    for (let f = 0; f < numFactors; f++) {
      let factorLoadings = this.generateRandomArray(indicatorsPerFactor, 0.4, 0.8);
      
      // Iteratively adjust loadings to meet reliability target
      let attempts = 0;
      while (attempts < 100) {
        const reliability = this.computeCompositeReliability(factorLoadings);
        if (reliability >= targetReliability) break;
        
        // Increase all loadings slightly
        factorLoadings = factorLoadings.map(loading => Math.min(0.95, loading + 0.01));
        attempts++;
      }
      
      loadings.push(factorLoadings);
    }

    return this.generateIndicatorData(nSamples, loadings);
  }

  // Generate factor loadings for both AVE and reliability targets
  private generateDataForBothTargets(
    nSamples: number,
    numFactors: number,
    indicatorsPerFactor: number,
    targetAVE: number,
    targetReliability: number
  ): { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } {
    const loadings: number[][] = [];
    
    for (let f = 0; f < numFactors; f++) {
      let factorLoadings = this.generateRandomArray(indicatorsPerFactor, 0.5, 0.8);
      
      let attempts = 0;
      while (attempts < 100) {
        const ave = this.computeAVE(factorLoadings);
        const reliability = this.computeCompositeReliability(factorLoadings);
        
        if (ave >= targetAVE && reliability >= targetReliability) break;
        
        // Prioritize whichever target is further from being met
        if (ave < targetAVE) {
          factorLoadings = this.boostAVE(factorLoadings, targetAVE);
        }
        if (reliability < targetReliability) {
          factorLoadings = factorLoadings.map(loading => Math.min(0.95, loading + 0.005));
        }
        
        attempts++;
      }
      
      loadings.push(factorLoadings);
    }

    return this.generateIndicatorData(nSamples, loadings);
  }

  // Generate actual indicator data from factor loadings
  private generateIndicatorData(
    nSamples: number,
    loadings: number[][]
  ): { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } {
    const numFactors = loadings.length;
    const indicatorsPerFactor = loadings[0].length;
    
    // Generate factor scores (latent variables)
    const factorScores: number[][] = [];
    for (let i = 0; i < nSamples; i++) {
      const scores: number[] = [];
      for (let f = 0; f < numFactors; f++) {
        scores.push(this.generateNormal()); // Standard normal factor scores
      }
      factorScores.push(scores);
    }

    // Generate indicator data based on factor model: X = Λf + ε
    const indicatorData: number[][] = [];
    for (let i = 0; i < nSamples; i++) {
      const indicators: number[] = [];
      
      for (let f = 0; f < numFactors; f++) {
        for (let ind = 0; ind < indicatorsPerFactor; ind++) {
          const loading = loadings[f][ind];
          const factorScore = factorScores[i][f];
          const error = this.generateNormal() * Math.sqrt(1 - loading ** 2); // Error with appropriate variance
          const indicator = loading * factorScore + error;
          indicators.push(indicator);
        }
      }
      
      indicatorData.push(indicators);
    }

    // Calculate overall results
    const allLoadings = loadings.flat();
    const results: AVEResults = {
      loadings,
      ave: this.computeAVE(allLoadings),
      reliability: math.mean(loadings.map(fl => this.computeCompositeReliability(fl))) as number,
      discriminantValidity: this.computeDiscriminantValidity(loadings)
    };

    return { loadings, factorScores, indicatorData, results };
  }

  // Helper to compute discriminant validity (Fornell-Larcker criterion)
  private computeDiscriminantValidity(loadings: number[][]): number {
    const aves = loadings.map(fl => this.computeAVE(fl));
    const minAVE = Math.min(...aves);
    const sqrtMinAVE = Math.sqrt(minAVE);
    
    // This is a simplified measure - in practice you'd compare with inter-factor correlations
    return sqrtMinAVE;
  }

  // Helper functions
  private generateRandomArray(length: number, min: number, max: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      result.push(Math.random() * (max - min) + min);
    }
    return result;
  }

  // Box-Muller transform for generating normal random numbers (same as cronbach node)
  private generateNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Getters for external access
  getSampleCount(): number {
    return this.sampleCount;
  }

  getNumFactors(): number {
    return this.numFactors;
  }

  getIndicatorsPerFactor(): number {
    return this.indicatorsPerFactor;
  }

  getTargetAVE(): number {
    return this.targetAVE;
  }

  getTargetReliability(): number {
    return this.targetReliability;
  }

  getGenerationMethod(): 'ave' | 'reliability' | 'both' {
    return this.generationMethod;
  }

  getCustomHeaders(): string[] {
    return this.customHeaders;
  }

  getInputFileHeaders(): string[] {
    return this.inputFileHeaders;
  }

  getGeneratedData(): { loadings: number[][], factorScores: number[][], indicatorData: number[][], results: AVEResults } | null {
    return this.generatedData;
  }

  // Setters for configuration
  setSampleCount(count: number): void {
    this.sampleCount = count;
  }

  setNumFactors(count: number): void {
    this.numFactors = count;
  }

  setIndicatorsPerFactor(count: number): void {
    this.indicatorsPerFactor = count;
  }

  setTargetAVE(ave: number): void {
    this.targetAVE = ave;
  }

  setTargetReliability(reliability: number): void {
    this.targetReliability = reliability;
  }

  setGenerationMethod(method: 'ave' | 'reliability' | 'both'): void {
    this.generationMethod = method;
  }

  setCustomHeaders(headers: string[]): void {
    this.customHeaders = headers;
  }

  setInputFileHeaders(headers: string[]): void {
    this.inputFileHeaders = headers;
  }

  // Method to analyze CSV data and extract factor structure
  analyzeCSVData(csvContent: string): { headers: string[], factors: number, indicatorsPerFactor: number } {
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
    
    if (numericColumns < 4) {
      throw new Error('CSV file must contain at least 4 numeric columns for factor analysis');
    }

    // Estimate factor structure (assume equal indicators per factor)
    const totalIndicators = numericColumns;
    let factors = 1;
    let indicatorsPerFactor = totalIndicators;
    
    // Try to find a reasonable factor structure
    for (let f = 2; f <= Math.min(5, Math.floor(totalIndicators / 2)); f++) {
      if (totalIndicators % f === 0) {
        factors = f;
        indicatorsPerFactor = totalIndicators / f;
        break;
      }
    }
    
    // If no even division found, use reasonable defaults
    if (indicatorsPerFactor > 10) {
      factors = Math.ceil(totalIndicators / 6);
      indicatorsPerFactor = Math.ceil(totalIndicators / factors);
    }

    return {
      headers: headers.slice(0, numericColumns),
      factors,
      indicatorsPerFactor
    };
  }
}
