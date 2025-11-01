import {
  NodeModel,
  type DataTableType,
  type DataTableSpec,
  type ExecutionContext,
  type SettingsObject,
} from '../core';
import { SimpleCell } from '../../types';

// Using existing types from lib/types.ts
interface DataQualityScore {
  overallScore: number;
  missingValueScore: number;
  duplicateRowScore: number;
  totalRows: number;
  totalColumns: number;
  missingValueCount: number;
  duplicateRowCount: number;
  missingValuePercentage: number;
  duplicateRowPercentage: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export class DataScorerNodeModel extends NodeModel {
  private static WEIGHT_MISSING_KEY = 'weight_missing';
  private static WEIGHT_DUPLICATES_KEY = 'weight_duplicates';
  private static INCLUDE_RECOMMENDATIONS_KEY = 'include_recommendations';

  private weightMissing = 0.6; // Weight for missing values (60%)
  private weightDuplicates = 0.4; // Weight for duplicate rows (40%)
  private includeRecommendations = true;

  constructor() {
    super(1, 2); // 1 input (data table), 2 outputs (score table + original data passthrough)
    
    // Configure dashboard outputs - first output is statistics, second is passthrough table
    this.configureDashboardOutput([
      {
        portIndex: 0, // Quality score statistics
        outputType: 'statistics',
        title: 'Data Quality Analysis',
        description: 'Comprehensive data quality assessment with scores and recommendations',
      },
      {
        portIndex: 1, // Passthrough data table
        outputType: 'table',
        title: 'Data Scorer - Source Data',
        description: 'Original data that was analyzed for quality',
      }
    ]);
  }

  async execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]> {
    if (!inData || inData.length === 0) {
      throw new Error('No input data provided');
    }

    const inputTable = inData[0];
    if (!inputTable || inputTable.size === 0) {
      throw new Error('Input data table is empty');
    }

    context.setProgress(0.1, 'Analyzing data quality...');

    // Calculate data quality metrics
    const qualityScore = this.calculateDataQualityScore(inputTable, context);

    context.setProgress(0.7, 'Creating quality score report...');

    // Create output table with quality scores
    const scoreOutput = context.createDataTable({
      columns: [
        { name: 'Metric', type: 'string' },
        { name: 'Value', type: 'string' },
        { name: 'Score', type: 'number' },
        { name: 'Description', type: 'string' },
      ],
      findColumnIndex: (name: string) => {
        const columns = ['Metric', 'Value', 'Score', 'Description'];
        return columns.indexOf(name);
      },
    });

    // Add quality metrics to output
    const metrics = [
      {
        metric: 'Overall Quality Score',
        value: `${qualityScore.overallScore.toFixed(1)}/100`,
        score: qualityScore.overallScore,
        description: `Grade: ${qualityScore.qualityGrade} - Overall data quality assessment`,
      },
      {
        metric: 'Missing Values Score',
        value: `${qualityScore.missingValueCount}/${qualityScore.totalRows * qualityScore.totalColumns} (${qualityScore.missingValuePercentage.toFixed(1)}%)`,
        score: qualityScore.missingValueScore,
        description: 'Score based on percentage of missing values in the dataset',
      },
      {
        metric: 'Duplicate Rows Score',
        value: `${qualityScore.duplicateRowCount}/${qualityScore.totalRows} (${qualityScore.duplicateRowPercentage.toFixed(1)}%)`,
        score: qualityScore.duplicateRowScore,
        description: 'Score based on percentage of duplicate rows in the dataset',
      },
      {
        metric: 'Total Rows',
        value: qualityScore.totalRows.toString(),
        score: qualityScore.totalRows,
        description: 'Total number of data rows analyzed',
      },
      {
        metric: 'Total Columns',
        value: qualityScore.totalColumns.toString(),
        score: qualityScore.totalColumns,
        description: 'Total number of columns analyzed',
      },
    ];

    metrics.forEach((metric, index) => {
      const cells = [
        new SimpleCell('string', metric.metric),
        new SimpleCell('string', metric.value),
        new SimpleCell('number', metric.score),
        new SimpleCell('string', metric.description),
      ];
      scoreOutput.addRow(`metric-${index}`, cells);
    });

    // Add recommendations if enabled
    if (this.includeRecommendations && qualityScore.recommendations.length > 0) {
      qualityScore.recommendations.forEach((recommendation, index) => {
        const cells = [
          new SimpleCell('string', 'Recommendation'),
          new SimpleCell('string', recommendation),
          new SimpleCell('number', 0),
          new SimpleCell('string', 'Data quality improvement suggestion'),
        ];
        scoreOutput.addRow(`recommendation-${index}`, cells);
      });
    }

    context.setProgress(1.0, 'Data quality analysis completed');

    // Build statistics data for dashboard
    const statisticsData = {
      summary: `Data Quality Analysis - Overall Score: ${qualityScore.overallScore.toFixed(1)}/100 (Grade: ${qualityScore.qualityGrade})`,
      metrics: {
        'Overall Quality Score': Number.parseFloat(qualityScore.overallScore.toFixed(1)),
        'Missing Values Score': Number.parseFloat(qualityScore.missingValueScore.toFixed(1)),
        'Duplicate Rows Score': Number.parseFloat(qualityScore.duplicateRowScore.toFixed(1)),
        'Total Rows': qualityScore.totalRows,
        'Total Columns': qualityScore.totalColumns,
      },
      details: {
        missingValueCount: qualityScore.missingValueCount,
        missingValuePercentage: Number.parseFloat(qualityScore.missingValuePercentage.toFixed(2)),
        duplicateRowCount: qualityScore.duplicateRowCount,
        duplicateRowPercentage: Number.parseFloat(qualityScore.duplicateRowPercentage.toFixed(2)),
        recommendations: qualityScore.recommendations,
      },
    };

    const outputs = [scoreOutput.close(), inputTable];

    // Send outputs to dashboard using the new centralized system
    // We need to create mixed outputs array with statistics data and table data
    const dashboardOutputs = [statisticsData, inputTable];
    const dashboardItems = await this.sendOutputsToDashboard(dashboardOutputs, context, 'Data Scorer Node');

      // Store dashboard items in context for WorkflowEditor to access
      (context as any).dashboardItems = dashboardItems;

    // Return both the score table and the original data (passthrough)
    return outputs;
  }

  private calculateDataQualityScore(
    dataTable: DataTableType,
    context: ExecutionContext,
  ): DataQualityScore {
    const totalRows = dataTable.size;
    const totalColumns = dataTable.spec.columns.length;
    const totalCells = totalRows * totalColumns;

    context.setProgress(0.2, 'Counting missing values...');

    // Count missing values
    let missingValueCount = 0;
    const columnMissingCounts: { [key: string]: number } = {};

    dataTable.spec.columns.forEach((col) => {
      columnMissingCounts[col.name] = 0;
    });

    dataTable.forEach((row) => {
      row.cells.forEach((cell, index: number) => {
        const value = cell.getValue();
        const columnName = dataTable.spec.columns[index].name;
        
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          missingValueCount++;
          columnMissingCounts[columnName]++;
        }
      });
    });

    context.setProgress(0.4, 'Identifying duplicate rows...');

    // Count duplicate rows
    const rowHashes = new Set<string>();
    let duplicateRowCount = 0;

    dataTable.forEach((row) => {
      const rowHash = row.cells
        .map((cell) => String(cell.getValue() || ''))
        .join('|');
      
      if (rowHashes.has(rowHash)) {
        duplicateRowCount++;
      } else {
        rowHashes.add(rowHash);
      }
    });

    context.setProgress(0.6, 'Calculating quality scores...');

    // Calculate percentages
    const missingValuePercentage = totalCells > 0 ? (missingValueCount / totalCells) * 100 : 0;
    const duplicateRowPercentage = totalRows > 0 ? (duplicateRowCount / totalRows) * 100 : 0;

    // Calculate individual scores (0-100 scale)
    const missingValueScore = Math.max(0, 100 - missingValuePercentage * 2); // Penalty: 2 points per 1% missing
    const duplicateRowScore = Math.max(0, 100 - duplicateRowPercentage * 3); // Penalty: 3 points per 1% duplicates

    // Calculate weighted overall score
    const overallScore = (
      missingValueScore * this.weightMissing +
      duplicateRowScore * this.weightDuplicates
    );

    // Determine quality grade
    let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) qualityGrade = 'A';
    else if (overallScore >= 80) qualityGrade = 'B';
    else if (overallScore >= 70) qualityGrade = 'C';
    else if (overallScore >= 60) qualityGrade = 'D';
    else qualityGrade = 'F';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (missingValuePercentage > 5) {
      recommendations.push(`High missing value rate (${missingValuePercentage.toFixed(1)}%) - consider data imputation or removal of incomplete records`);
    }
    
    if (duplicateRowPercentage > 2) {
      recommendations.push(`Duplicate rows detected (${duplicateRowPercentage.toFixed(1)}%) - consider deduplication`);
    }
    
    if (missingValuePercentage > 20) {
      recommendations.push('Critical data quality issue: >20% missing values may significantly impact analysis');
    }
    
    if (duplicateRowPercentage > 10) {
      recommendations.push('High duplication rate may skew statistical analysis and model training');
    }

    // Column-specific recommendations
    const problematicColumns = Object.entries(columnMissingCounts)
      .filter(([_, count]) => count / totalRows > 0.3)
      .map(([name, _]) => name);
    
    if (problematicColumns.length > 0) {
      recommendations.push(`Columns with >30% missing values: ${problematicColumns.join(', ')} - consider removal or special handling`);
    }

    if (overallScore >= 90) {
      recommendations.push('Excellent data quality! Dataset is ready for analysis.');
    } else if (overallScore >= 70) {
      recommendations.push('Good data quality with minor issues that should be addressed.');
    } else {
      recommendations.push('Data quality needs significant improvement before analysis.');
    }

    return {
      overallScore,
      missingValueScore,
      duplicateRowScore,
      totalRows,
      totalColumns,
      missingValueCount,
      duplicateRowCount,
      missingValuePercentage,
      duplicateRowPercentage,
      qualityGrade,
      recommendations,
    };
  }

  configure(inSpecs: DataTableSpec[]): DataTableSpec[] {
    if (!inSpecs || inSpecs.length === 0) {
      return [
        {
          columns: [],
          findColumnIndex: () => -1,
        },
        {
          columns: [],
          findColumnIndex: () => -1,
        },
      ];
    }

    // First output: Quality score table
    const scoreSpec: DataTableSpec = {
      columns: [
        { name: 'Metric', type: 'string' },
        { name: 'Value', type: 'string' },
        { name: 'Score', type: 'number' },
        { name: 'Description', type: 'string' },
      ],
      findColumnIndex: (name: string) => {
        const columns = ['Metric', 'Value', 'Score', 'Description'];
        return columns.indexOf(name);
      },
    };

    // Second output: Passthrough of original data
    const passthroughSpec = inSpecs[0];

    return [scoreSpec, passthroughSpec];
  }

  loadSettings(settings: SettingsObject): void {
    this.weightMissing = settings.getNumber
      ? settings.getNumber(DataScorerNodeModel.WEIGHT_MISSING_KEY, 0.6)
      : (settings as any)[DataScorerNodeModel.WEIGHT_MISSING_KEY] || 0.6;
    
    this.weightDuplicates = settings.getNumber
      ? settings.getNumber(DataScorerNodeModel.WEIGHT_DUPLICATES_KEY, 0.4)
      : (settings as any)[DataScorerNodeModel.WEIGHT_DUPLICATES_KEY] || 0.4;
    
    this.includeRecommendations = settings.getBoolean
      ? settings.getBoolean(DataScorerNodeModel.INCLUDE_RECOMMENDATIONS_KEY, true)
      : (settings as any)[DataScorerNodeModel.INCLUDE_RECOMMENDATIONS_KEY] !== false;
  }

  saveSettings(settings: SettingsObject): void {
    if (settings.set) {
      settings.set(DataScorerNodeModel.WEIGHT_MISSING_KEY, this.weightMissing);
      settings.set(DataScorerNodeModel.WEIGHT_DUPLICATES_KEY, this.weightDuplicates);
      settings.set(DataScorerNodeModel.INCLUDE_RECOMMENDATIONS_KEY, this.includeRecommendations);
    } else {
      (settings as any)[DataScorerNodeModel.WEIGHT_MISSING_KEY] = this.weightMissing;
      (settings as any)[DataScorerNodeModel.WEIGHT_DUPLICATES_KEY] = this.weightDuplicates;
      (settings as any)[DataScorerNodeModel.INCLUDE_RECOMMENDATIONS_KEY] = this.includeRecommendations;
    }
  }

  validateSettings(settings: SettingsObject): void {
    const weightMissing = settings.getNumber
      ? settings.getNumber(DataScorerNodeModel.WEIGHT_MISSING_KEY, 0.6)
      : (settings as any)[DataScorerNodeModel.WEIGHT_MISSING_KEY] || 0.6;
    
    const weightDuplicates = settings.getNumber
      ? settings.getNumber(DataScorerNodeModel.WEIGHT_DUPLICATES_KEY, 0.4)
      : (settings as any)[DataScorerNodeModel.WEIGHT_DUPLICATES_KEY] || 0.4;

    if (weightMissing < 0 || weightMissing > 1) {
      throw new Error('Missing values weight must be between 0 and 1');
    }

    if (weightDuplicates < 0 || weightDuplicates > 1) {
      throw new Error('Duplicate rows weight must be between 0 and 1');
    }

    if (Math.abs((weightMissing + weightDuplicates) - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }
  }

  // Getters for the dialog
  getWeightMissing(): number {
    return this.weightMissing;
  }

  getWeightDuplicates(): number {
    return this.weightDuplicates;
  }

  getIncludeRecommendations(): boolean {
    return this.includeRecommendations;
  }
}