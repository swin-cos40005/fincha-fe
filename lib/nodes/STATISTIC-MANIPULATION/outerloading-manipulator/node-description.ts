export const NODE_DESCRIPTION = {
  shortDescription:
    'Generate or manipulate indicator data to achieve specific outer loading values for PLS-SEM analysis',
  detailedDescription: {
    whatItDoes: `The Outer Loading Manipulator node generates synthetic indicator data or manipulates existing data to achieve target outer loading values in Partial Least Squares Structural Equation Modeling (PLS-SEM). 

Outer loadings represent the correlation between indicators and their respective constructs. This node is particularly useful for:
- Generating synthetic datasets with known outer loading properties for simulation studies
- Creating test data for SEM analysis validation
- Educational purposes to demonstrate the relationship between indicators and constructs
- Preparing benchmark datasets with specific outer loading characteristics

The node can generate data with specified target outer loadings between indicators and a single construct, helping researchers understand how indicator-construct relationships affect overall model fit and validity.`,
    howItWorks: `The node operates through several key mechanisms:

1. **Target Loading Specification**: Users define the desired outer loading value (correlation between indicators and construct)

2. **Data Generation Process**:
   - Creates a latent construct variable with normal distribution
   - Generates indicators as linear combinations of the construct plus error terms
   - Adjusts error variance to achieve the target outer loading

3. **Statistical Foundation**: 
   - Uses the relationship: Loading = √(1 - ErrorVariance)
   - Ensures realistic correlations between indicators
   - Maintains statistical properties consistent with SEM assumptions

4. **Quality Control**:
   - Validates that target loadings are within realistic bounds (0.1 to 0.95)
   - Ensures sufficient sample size for stable estimates
   - Provides warnings for potentially problematic configurations`,
    acceptedInputTypes: `The node accepts the following input formats:

**Tabular Data Input:**
- CSV files with numerical data columns
- Excel files (.xlsx, .xls) with structured data
- Tab-separated values (TSV) files
- Data tables with indicators for analysis

**Synthetic Data Generation:**
- No input required when generating new datasets
- Users specify number of samples and indicators through the interface

**Data Requirements:**
- For input data: Numerical columns representing potential indicators
- Minimum 30 observations recommended for stable results
- Missing values are handled through listwise deletion`,
    outputDescription: `The node produces a comprehensive dataset optimized for outer loading analysis:

**Primary Output - Data Table:**
- Construct variable (latent factor)
- Generated indicators with target outer loadings
- Sample size as specified by user
- Proper correlation structure between indicators

**Statistical Properties:**
- Indicators correlated with construct at target loading level
- Realistic error terms and measurement noise
- Maintains multivariate normality assumptions
- Preserves statistical relationships required for SEM

**Data Format:**
- CSV-compatible output for direct use in SEM software
- Column headers clearly identifying construct and indicators
- Standardized scales for direct analysis
- Compatible with lavaan, SmartPLS, AMOS, and other SEM tools`,
  },
};
