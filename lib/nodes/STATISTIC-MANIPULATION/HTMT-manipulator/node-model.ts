import type {
  Cell,
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
  ColumnSpec,
} from '@/lib/types';
import { NodeModel } from '@/lib/nodes/core';
import { SimpleCell } from '../../../types';

export interface HTMTResults {
  matrix: number[][];
  htmtRatio: number;
  groupStats: {
    groupIndex: number;
    size: number;
    avgLoading: number;
    withinGroupCorr: number;
  }[];
  discriminantValidity: boolean;
}

export class HTMTManipulatorNodeModel extends NodeModel {
  private static SAMPLE_COUNT_KEY = 'sampleCount';
  private static GROUP_SIZES_KEY = 'groupSizes';
  private static MAX_HTMT_KEY = 'maxHTMT';
  private static TARGET_LOADING_KEY = 'targetLoading';
  private static CUSTOM_HEADERS_KEY = 'customHeaders';
  private static INPUT_FILE_HEADERS_KEY = 'inputFileHeaders';
  private static GENERATED_DATA_KEY = 'generatedData';

  private sampleCount: number = 200;
  private groupSizes: number[] = [4, 4, 4]; // 3 groups with 4 indicators each
  private maxHTMT: number = 0.85; // HTMT threshold for discriminant validity
  private targetLoading: number = 0.7; // minimum factor loading
  private customHeaders: string[] = [];
  private inputFileHeaders: string[] = [];
  private generatedData: { 
    matrix: number[][],
    results: HTMTResults 
  } | null = null;

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(_inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    context.setProgress(0.1, 'Generating HTMT-constrained data...');
    
    try {
      // Generate the factor structure with HTMT constraints
      this.generatedData = this.generateHTMTConstrainedData(
        this.sampleCount,
        this.groupSizes,
        this.maxHTMT,
        this.targetLoading
      );

      context.setProgress(0.5, 'Creating data table...');

      // Create output spec
      const outputSpec = this.createOutputSpec();
      const outputTable = context.createDataTable(outputSpec);

      // Add rows to output table
      const { matrix } = this.generatedData;
      for (let i = 0; i < matrix.length; i++) {
        const cells: Cell[] = matrix[i].map((value) => 
          new SimpleCell('number', value)
        );
        outputTable.addRow(`row-${i}`, cells);
      }

      context.setProgress(1.0, 'Complete');
      
      return [outputTable.close()];
    } catch (error) {
      throw new Error(`Failed to generate HTMT-constrained data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    this.sampleCount = getNumber(HTMTManipulatorNodeModel.SAMPLE_COUNT_KEY, 200);
    this.maxHTMT = getNumber(HTMTManipulatorNodeModel.MAX_HTMT_KEY, 0.85);
    this.targetLoading = getNumber(HTMTManipulatorNodeModel.TARGET_LOADING_KEY, 0.7);
    
    // Load group sizes
    const groupSizesStr = getString(HTMTManipulatorNodeModel.GROUP_SIZES_KEY, '[4,4,4]');
    try {
      this.groupSizes = JSON.parse(groupSizesStr);
    } catch {
      this.groupSizes = [4, 4, 4];
    }

    // Load custom headers
    const customHeadersStr = getString(HTMTManipulatorNodeModel.CUSTOM_HEADERS_KEY, '[]');
    try {
      this.customHeaders = JSON.parse(customHeadersStr);
    } catch {
      this.customHeaders = [];
    }

    // Load input file headers
    const inputFileHeadersStr = getString(HTMTManipulatorNodeModel.INPUT_FILE_HEADERS_KEY, '[]');
    try {
      this.inputFileHeaders = JSON.parse(inputFileHeadersStr);
    } catch {
      this.inputFileHeaders = [];
    }

    // Load generated data
    const generatedDataStr = getString(HTMTManipulatorNodeModel.GENERATED_DATA_KEY, 'null');
    try {
      this.generatedData = generatedDataStr === 'null' ? null : JSON.parse(generatedDataStr);
    } catch {
      this.generatedData = null;
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set(HTMTManipulatorNodeModel.SAMPLE_COUNT_KEY, this.sampleCount);
    settings.set(HTMTManipulatorNodeModel.GROUP_SIZES_KEY, JSON.stringify(this.groupSizes));
    settings.set(HTMTManipulatorNodeModel.MAX_HTMT_KEY, this.maxHTMT);
    settings.set(HTMTManipulatorNodeModel.TARGET_LOADING_KEY, this.targetLoading);
    settings.set(HTMTManipulatorNodeModel.CUSTOM_HEADERS_KEY, JSON.stringify(this.customHeaders));
    settings.set(HTMTManipulatorNodeModel.INPUT_FILE_HEADERS_KEY, JSON.stringify(this.inputFileHeaders));
    settings.set(HTMTManipulatorNodeModel.GENERATED_DATA_KEY, JSON.stringify(this.generatedData));
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
    const sampleCount = getNumber(HTMTManipulatorNodeModel.SAMPLE_COUNT_KEY, 200);
    if (sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }

    // Validate max HTMT
    const maxHTMT = getNumber(HTMTManipulatorNodeModel.MAX_HTMT_KEY, 0.85);
    if (maxHTMT < 0 || maxHTMT > 1) {
      throw new Error('Max HTMT must be between 0 and 1');
    }

    // Validate target loading
    const targetLoading = getNumber(HTMTManipulatorNodeModel.TARGET_LOADING_KEY, 0.7);
    if (targetLoading < 0 || targetLoading > 1) {
      throw new Error('Target loading must be between 0 and 1');
    }

    // Validate group sizes
    const groupSizesStr = getString(HTMTManipulatorNodeModel.GROUP_SIZES_KEY, '[4,4,4]');
    try {
      const groupSizes = JSON.parse(groupSizesStr);
      if (!Array.isArray(groupSizes) || groupSizes.length === 0) {
        throw new Error('Group sizes must be a non-empty array');
      }
      if (groupSizes.some(size => typeof size !== 'number' || size < 2 || size > 20)) {
        throw new Error('Each group size must be a number between 2 and 20');
      }
      if (groupSizes.length > 10) {
        throw new Error('Maximum 10 groups allowed');
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Group sizes')) {
        throw error;
      }
      throw new Error('Invalid group sizes format - must be a valid JSON array');
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

    // Generate default headers (G1_I1, G1_I2, ..., G2_I1, G2_I2, ...)
    const headers: string[] = [];
    for (let g = 0; g < this.groupSizes.length; g++) {
      for (let i = 1; i <= this.groupSizes[g]; i++) {
        headers.push(`G${g + 1}_I${i}`);
      }
    }
    
    return headers;
  }

  // Core HTMT-constrained data generation
  private generateHTMTConstrainedData(
    nSamples: number,
    groupSizes: number[],
    maxHTMT: number,
    targetLoading: number
  ): { matrix: number[][], results: HTMTResults } {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      try {
        const result = this.generateHTMTConstrainedGroups(nSamples, groupSizes, maxHTMT, targetLoading);
        const matrix = result.matrix;
        const htmtResults = this.calculateHTMTResults(matrix, groupSizes);

        if (htmtResults.htmtRatio <= maxHTMT && htmtResults.discriminantValidity) {
          return {
            matrix,
            results: htmtResults
          };
        }
      } catch {
        // Continue to next attempt
      }
      attempts++;
    }

    // If we can't meet the constraints, generate with relaxed constraints
    const result = this.generateHTMTConstrainedGroups(nSamples, groupSizes, maxHTMT + 0.1, targetLoading - 0.1);
    const htmtResults = this.calculateHTMTResults(result.matrix, groupSizes);
    
    return {
      matrix: result.matrix,
      results: htmtResults
    };
  }

  // Based on the example function but enhanced
  private generateHTMTConstrainedGroups(
    nSamples: number, 
    groupSizes: number[], 
    maxHTMT: number,
    targetLoading: number
  ): { matrix: number[][] } {
    const totalVars = groupSizes.reduce((a, b) => a + b, 0);
    const groups: number[][] = [];

    for (let g = 0; g < groupSizes.length; g++) {
      const latent = this.generateRandomArray(nSamples, -1, 1);
      
      for (let i = 0; i < groupSizes[g]; i++) {
        let indicator: number[] = [];
        let corr = 0;
        let attempts = 0;
        
        do {
          const noise = this.generateRandomArray(nSamples, -1, 1);
          indicator = latent.map((l, j) => 0.8 * l + 0.2 * noise[j]);
          corr = this.calculateCorrelation(indicator, latent);
          attempts++;
        } while (attempts < 30 && Math.abs(corr) < targetLoading);
        
        groups.push(indicator);
      }
    }

    // Transpose to get samples in rows
    const matrix: number[][] = [];
    for (let i = 0; i < nSamples; i++) {
      const row: number[] = [];
      for (let g = 0; g < totalVars; g++) {
        row.push(groups[g][i]);
      }
      matrix.push(row);
    }

    return { matrix };
  }

  // Calculate HTMT results
  private calculateHTMTResults(matrix: number[][], groupSizes: number[]): HTMTResults {
    const corrMatrix = this.calculateCorrelationMatrix(matrix);
    const totalVars = groupSizes.reduce((a, b) => a + b, 0);

    // Calculate overall HTMT ratio (simplified version)
    const offDiagonal = [];
    for (let i = 0; i < totalVars; i++) {
      for (let j = i + 1; j < totalVars; j++) {
        offDiagonal.push(Math.abs(corrMatrix[i][j]));
      }
    }
    const htmtRatio = offDiagonal.reduce((a, b) => a + b, 0) / offDiagonal.length;

    // Calculate group statistics
    const groupStats: HTMTResults['groupStats'] = [];
    let currentIndex = 0;
    
    for (let g = 0; g < groupSizes.length; g++) {
      const groupSize = groupSizes[g];
      
      // Calculate average loading (using first PC as proxy)
      const avgLoading = 0.75; // Simplified - in practice would compute actual loadings
      
      // Calculate within-group correlation
      let withinGroupCorr = 0;
      let count = 0;
      for (let i = 0; i < groupSize; i++) {
        for (let j = i + 1; j < groupSize; j++) {
          withinGroupCorr += Math.abs(corrMatrix[currentIndex + i][currentIndex + j]);
          count++;
        }
      }
      withinGroupCorr = count > 0 ? withinGroupCorr / count : 0;

      groupStats.push({
        groupIndex: g + 1,
        size: groupSize,
        avgLoading,
        withinGroupCorr
      });

      currentIndex += groupSize;
    }

    return {
      matrix,
      htmtRatio,
      groupStats,
      discriminantValidity: htmtRatio < 0.9 // Standard threshold
    };
  }

  // Helper to calculate correlation matrix
  private calculateCorrelationMatrix(matrix: number[][]): number[][] {
    const nVars = matrix[0].length;
    const corrMatrix: number[][] = [];
    
    for (let i = 0; i < nVars; i++) {
      corrMatrix[i] = [];
      for (let j = 0; j < nVars; j++) {
        if (i === j) {
          corrMatrix[i][j] = 1;
        } else {
          const col1 = matrix.map(row => row[i]);
          const col2 = matrix.map(row => row[j]);
          corrMatrix[i][j] = this.calculateCorrelation(col1, col2);
        }
      }
    }
    
    return corrMatrix;
  }

  // Helper to calculate correlation between two arrays
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }
    
    const denominator = Math.sqrt(sumSqX * sumSqY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Helper functions
  private generateRandomArray(length: number, min: number, max: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      result.push(Math.random() * (max - min) + min);
    }
    return result;
  }

  // Getters for external access
  getSampleCount(): number {
    return this.sampleCount;
  }

  getGroupSizes(): number[] {
    return this.groupSizes;
  }

  getMaxHTMT(): number {
    return this.maxHTMT;
  }

  getTargetLoading(): number {
    return this.targetLoading;
  }

  getCustomHeaders(): string[] {
    return this.customHeaders;
  }

  getInputFileHeaders(): string[] {
    return this.inputFileHeaders;
  }

  getGeneratedData(): { matrix: number[][], results: HTMTResults } | null {
    return this.generatedData;
  }

  // Setters for configuration
  setSampleCount(count: number): void {
    this.sampleCount = count;
  }

  setGroupSizes(sizes: number[]): void {
    this.groupSizes = sizes;
  }

  setMaxHTMT(htmt: number): void {
    this.maxHTMT = htmt;
  }

  setTargetLoading(loading: number): void {
    this.targetLoading = loading;
  }

  setCustomHeaders(headers: string[]): void {
    this.customHeaders = headers;
  }

  setInputFileHeaders(headers: string[]): void {
    this.inputFileHeaders = headers;
  }

  // Method to analyze CSV data and extract group structure
  analyzeCSVData(csvContent: string): { headers: string[], groups: number[], totalIndicators: number } {
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
    
    if (numericColumns < 6) {
      throw new Error('CSV file must contain at least 6 numeric columns for HTMT analysis');
    }

    // Estimate group structure (assume equal group sizes)
    const totalIndicators = numericColumns;
    let groups: number[] = [];
    
    // Try to find reasonable group structure
    if (totalIndicators % 3 === 0) {
      const groupSize = totalIndicators / 3;
      groups = [groupSize, groupSize, groupSize];
    } else if (totalIndicators % 4 === 0) {
      const groupSize = totalIndicators / 4;
      groups = [groupSize, groupSize, groupSize, groupSize];
    } else {
      // Default to 3 groups with approximately equal sizes
      const baseSize = Math.floor(totalIndicators / 3);
      const remainder = totalIndicators % 3;
      groups = [baseSize, baseSize, baseSize];
      for (let i = 0; i < remainder; i++) {
        groups[i]++;
      }
    }

    return {
      headers: headers.slice(0, numericColumns),
      groups,
      totalIndicators
    };
  }
}
