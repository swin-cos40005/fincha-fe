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

type AnswerOptionMap = { [numOptions: number]: number };

export class CronbachAlphaNodeModel extends NodeModel {
  private static SAMPLE_COUNT_KEY = 'sampleCount';
  private static TARGET_ALPHA_KEY = 'targetAlpha';
  private static OPTION_MAP_KEY = 'optionMap';
  private static CUSTOM_HEADERS_KEY = 'customHeaders';
  private static INPUT_FILE_HEADERS_KEY = 'inputFileHeaders';
  private static GENERATED_DATA_KEY = 'generatedData';

  private sampleCount: number = 100;
  private targetAlpha: number = 0.8;
  private optionMap: AnswerOptionMap = {
    2: 1,  // 1 question with 2 options
    3: 15, // 15 questions with 3 options
    5: 4   // 4 questions with 5 options
  };
  private customHeaders: string[] = [];
  private inputFileHeaders: string[] = [];
  private generatedData: number[][] = [];

  constructor() {
    super(0, 1); // 0 inputs, 1 output
  }

  async execute(_inData: DataTableType[], context: ExecutionContext): Promise<DataTableType[]> {
    context.setProgress(0.1, 'Generating synthetic data...');
    
    // Generate the synthetic data
    this.generatedData = this.generateDataWithAlphaDict(
      this.sampleCount,
      this.targetAlpha,
      this.optionMap
    );

    context.setProgress(0.5, 'Creating data table...');

    // Create output spec
    const outputSpec = this.createOutputSpec();
    const outputTable = context.createDataTable(outputSpec);

    // Add rows to output table
    this.generatedData.forEach((row, index) => {
      const cells: Cell[] = row.map((value: number) => 
        new SimpleCell('number', value)
      );
      outputTable.addRow(`row-${index}`, cells);
    });

    context.setProgress(1.0, 'Complete');
    
    const result = [outputTable.close()];
    
    // The data should now be available via getGeneratedData()
    return result;
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

    this.sampleCount = getNumber(CronbachAlphaNodeModel.SAMPLE_COUNT_KEY, 100);
    this.targetAlpha = getNumber(CronbachAlphaNodeModel.TARGET_ALPHA_KEY, 0.8);
    
    // Load option map
    const optionMapStr = getString(CronbachAlphaNodeModel.OPTION_MAP_KEY, '{"2":1,"3":15,"5":4}');
    try {
      this.optionMap = JSON.parse(optionMapStr);
    } catch {
      this.optionMap = { 2: 1, 3: 15, 5: 4 };
    }

    // Load custom headers
    const customHeadersStr = getString(CronbachAlphaNodeModel.CUSTOM_HEADERS_KEY, '[]');
    try {
      this.customHeaders = JSON.parse(customHeadersStr);
    } catch {
      this.customHeaders = [];
    }

    // Load input file headers
    const inputFileHeadersStr = getString(CronbachAlphaNodeModel.INPUT_FILE_HEADERS_KEY, '[]');
    try {
      this.inputFileHeaders = JSON.parse(inputFileHeadersStr);
    } catch {
      this.inputFileHeaders = [];
    }

    // Load generated data
    const generatedDataStr = getString(CronbachAlphaNodeModel.GENERATED_DATA_KEY, '[]');
    try {
      this.generatedData = JSON.parse(generatedDataStr);
    } catch {
      this.generatedData = [];
    }
  }

  saveSettings(settings: SettingsObject): void {
    settings.set(CronbachAlphaNodeModel.SAMPLE_COUNT_KEY, this.sampleCount);
    settings.set(CronbachAlphaNodeModel.TARGET_ALPHA_KEY, this.targetAlpha);
    settings.set(CronbachAlphaNodeModel.OPTION_MAP_KEY, JSON.stringify(this.optionMap));
    settings.set(CronbachAlphaNodeModel.CUSTOM_HEADERS_KEY, JSON.stringify(this.customHeaders));
    settings.set(CronbachAlphaNodeModel.INPUT_FILE_HEADERS_KEY, JSON.stringify(this.inputFileHeaders));
    settings.set(CronbachAlphaNodeModel.GENERATED_DATA_KEY, JSON.stringify(this.generatedData));
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
    const sampleCount = getNumber(CronbachAlphaNodeModel.SAMPLE_COUNT_KEY, 100);
    if (sampleCount <= 0) {
      throw new Error('Sample count must be greater than 0');
    }

    // Validate target alpha
    const targetAlpha = getNumber(CronbachAlphaNodeModel.TARGET_ALPHA_KEY, 0.8);
    if (targetAlpha < 0 || targetAlpha > 1) {
      throw new Error('Target alpha must be between 0 and 1');
    }

    // Validate option map
    const optionMapStr = getString(CronbachAlphaNodeModel.OPTION_MAP_KEY, '{"2":1,"3":15,"5":4}');
    let optionMap: any;
    try {
      optionMap = JSON.parse(optionMapStr);
    } catch {
      throw new Error('Invalid option map format');
    }
    
    if (typeof optionMap !== 'object' || Object.keys(optionMap).length === 0) {
      throw new Error('Option map must be a non-empty object');
    }
    
    for (const [key, value] of Object.entries(optionMap)) {
      const numOptions = parseInt(key);
      if (isNaN(numOptions) || numOptions < 2) {
        throw new Error('Number of options must be at least 2');
      }
      if (typeof value !== 'number' || value < 1) {
        throw new Error('Question count must be at least 1');
      }
    }
  }

  private createOutputSpec(): DataTableSpec {
    // Determine column headers
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

    // Generate default headers based on option map
    const headers: string[] = [];
    let questionIndex = 1;
    
    for (const [numOptions, count] of Object.entries(this.optionMap)) {
      for (let i = 0; i < count; i++) {
        headers.push(`Q${questionIndex}_${numOptions}opt`);
        questionIndex++;
      }
    }
    
    return headers;
  }

  getTotalQuestionCount(): number {
    return Object.values(this.optionMap).reduce((sum, count) => sum + count, 0);
  }

  // Helper to flatten answer option dictionary into array
  private expandAnswerOptions(optionMap: AnswerOptionMap): number[] {
    const expanded: number[] = [];
    for (const [key, count] of Object.entries(optionMap)) {
      const numOptions = parseInt(key);
      for (let i = 0; i < count; i++) {
        expanded.push(numOptions);
      }
    }
    return expanded;
  }

  // Cronbach's alpha calculator
  private cronbachAlpha(data: number[][]): number {
    const nItems = data[0].length;
    const nSamples = data.length;
    
    // Calculate item variances
    const itemVars: number[] = [];
    for (let j = 0; j < nItems; j++) {
      const column = data.map(row => row[j]);
      const mean = column.reduce((sum, val) => sum + val, 0) / nSamples;
      const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nSamples - 1);
      itemVars.push(variance);
    }
    
    // Calculate total scores and total variance
    const totalScores = data.map(row => row.reduce((sum, val) => sum + val, 0));
    const totalMean = totalScores.reduce((sum, val) => sum + val, 0) / nSamples;
    const totalVar = totalScores.reduce((sum, val) => sum + Math.pow(val - totalMean, 2), 0) / (nSamples - 1);

    const itemVarSum = itemVars.reduce((sum, val) => sum + val, 0);
    const alpha = (nItems / (nItems - 1)) * (1 - (itemVarSum / totalVar));
    return alpha;
  }

  // Core function to generate data with target alpha
  private generateDataWithAlphaDict(
    nSamples: number,
    targetAlpha: number,
    answerOptionMap: AnswerOptionMap
  ): number[][] {
    const answerOptions = this.expandAnswerOptions(answerOptionMap);
    const nQuestions = answerOptions.length;

    let corrValue = 0.5; // initial guess
    const maxIter = 20;

    for (let iter = 0; iter < maxIter; iter++) {
      // Step 1: Build correlation matrix
      const corrMatrix: number[][] = [];
      for (let i = 0; i < nQuestions; i++) {
        corrMatrix[i] = [];
        for (let j = 0; j < nQuestions; j++) {
          corrMatrix[i][j] = i === j ? 1 : corrValue;
        }
      }

      // Step 2: Cholesky decomposition
      const L = this.choleskyDecomposition(corrMatrix);

      // Step 3: Generate uncorrelated standard normal data
      const rawNormals = this.generateNormalMatrix(nSamples, nQuestions);

      // Step 4: Apply Cholesky to get correlated data
      const correlated: number[][] = [];
      for (let i = 0; i < nSamples; i++) {
        const row: number[] = [];
        for (let j = 0; j < nQuestions; j++) {
          let sum = 0;
          for (let k = 0; k <= j; k++) {
            sum += L[j][k] * rawNormals[i][k];
          }
          row.push(sum);
        }
        correlated.push(row);
      }

      // Step 5: Convert to categorical responses
      const scaled: number[][] = correlated.map(row =>
        row.map((val, idx) => {
          const numOptions = answerOptions[idx];
          const percentile = this.erf(val / Math.sqrt(2)) * 0.5 + 0.5;
          return Math.min(numOptions, Math.max(1, Math.round(percentile * numOptions)));
        })
      );

      // Step 6: Check alpha
      const alpha = this.cronbachAlpha(scaled);
      if (alpha >= targetAlpha || iter === maxIter - 1) {
        return scaled;
      }

      // Step 7: Adjust correlation upwards to raise alpha
      corrValue = Math.min(corrValue + 0.05, 0.99);
    }

    throw new Error("Failed to generate data with desired alpha after max iterations");
  }

  // Helper function for Cholesky decomposition
  private choleskyDecomposition(A: number[][]): number[][] {
    const n = A.length;
    const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        if (i === j) {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[j][k] * L[j][k];
          }
          L[i][j] = Math.sqrt(A[i][i] - sum);
        } else {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[i][k] * L[j][k];
          }
          L[i][j] = (A[i][j] - sum) / L[j][j];
        }
      }
    }
    return L;
  }

  // Helper function to generate normal random matrix
  private generateNormalMatrix(rows: number, cols: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(this.generateNormal());
      }
      result.push(row);
    }
    return result;
  }

  // Box-Muller transform for generating normal random numbers
  private generateNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Approximation of the error function
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
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

  getTargetAlpha(): number {
    return this.targetAlpha;
  }

  getOptionMap(): AnswerOptionMap {
    return this.optionMap;
  }

  getCustomHeaders(): string[] {
    return this.customHeaders;
  }

  getInputFileHeaders(): string[] {
    return this.inputFileHeaders;
  }

  getGeneratedData(): number[][] {
    return this.generatedData;
  }

  // Setters for configuration
  setSampleCount(count: number): void {
    this.sampleCount = count;
  }

  setTargetAlpha(alpha: number): void {
    this.targetAlpha = alpha;
  }

  setOptionMap(optionMap: AnswerOptionMap): void {
    this.optionMap = optionMap;
    
    // If we have custom headers that don't match the new total question count,
    // and we don't have file headers, clear the custom headers to force regeneration
    const totalQuestions = Object.values(optionMap).reduce((sum, count) => sum + count, 0);
    
    if (this.customHeaders.length > 0 && 
        this.customHeaders.length !== totalQuestions && 
        this.inputFileHeaders.length === 0) {
      // Clear custom headers so they'll be auto-generated with the correct count
      this.customHeaders = [];
    }
  }

  setCustomHeaders(headers: string[]): void {
    this.customHeaders = headers;
  }

  setInputFileHeaders(headers: string[]): void {
    this.inputFileHeaders = headers;
  }

  // Method to analyze CSV data and extract option map
  analyzeCSVData(csvContent: string): { headers: string[], optionMap: AnswerOptionMap } {
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
    
    // Parse data rows
    const dataRows: number[][] = [];
    const columnStats: { min: number, max: number, values: Set<number> }[] = headers.map(() => ({
      min: Infinity,
      max: -Infinity,
      values: new Set()
    }));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const numericRow: number[] = [];
      
      for (let j = 0; j < Math.min(values.length, headers.length); j++) {
        const num = parseFloat(values[j]);
        if (!isNaN(num) && isFinite(num)) {
          const roundedNum = Math.round(num);
          numericRow.push(roundedNum);
          
          // Update column statistics
          columnStats[j].min = Math.min(columnStats[j].min, roundedNum);
          columnStats[j].max = Math.max(columnStats[j].max, roundedNum);
          columnStats[j].values.add(roundedNum);
        } else {
          // For non-numeric values, skip this row entirely
          break;
        }
      }
      
      // Only include rows that have data for all columns
      if (numericRow.length === headers.length) {
        dataRows.push(numericRow);
      }
    }

    if (dataRows.length === 0) {
      throw new Error('No valid numeric data rows found in CSV. Please ensure all columns contain numeric values.');
    }

    // Analyze each column to determine the response scale
    const columnMaxValues: number[] = [];
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const stats = columnStats[colIndex];
      
      // Determine the response scale based on the range and unique values
      let responseScale: number;
      
      if (stats.min === 1 || stats.min === 0) {
        // If minimum is 0 or 1, use max as the scale
        responseScale = Math.max(2, stats.max);
      } else {
        // If minimum is higher, determine scale based on range
        const range = stats.max - stats.min + 1;
        responseScale = Math.max(2, range);
      }
      
      // Cap at reasonable maximum (e.g., 10-point scale)
      responseScale = Math.min(responseScale, 10);
      
      columnMaxValues.push(responseScale);
    }

    // Create option map by counting how many columns have each response scale
    const optionMap: AnswerOptionMap = {};
    for (const scale of columnMaxValues) {
      if (optionMap[scale]) {
        optionMap[scale]++;
      } else {
        optionMap[scale] = 1;
      }
    }

    return {
      headers,
      optionMap
    };
  }
}
