export const NODE_DESCRIPTION = {
  shortDescription: "Generates synthetic multi-group factor data with specific Heterotrait-Monotrait (HTMT) ratios for discriminant validity testing",
  detailedDescription: {
    whatItDoes: `
The HTMT Manipulator creates synthetic factor data that meets specific Heterotrait-Monotrait (HTMT) ratio constraints for testing discriminant validity in multi-group factor analysis. This is essential for:

• Testing discriminant validity in structural equation modeling (SEM)
• Creating controlled datasets for measurement model validation
• Simulating multi-factor data with known discriminant validity properties
• Educational demonstrations of HTMT analysis
• Research method validation for factor analysis studies

**Key Features:**
- Specify target HTMT ratios and thresholds (typically < 0.85 or 0.90)
- Configure multiple factor groups with variable sizes
- Control factor loadings and cross-loadings
- Generate correlation matrices meeting HTMT constraints
- Optional bootstrap confidence intervals
- Export generated data and correlation matrices

**Configuration Options:**
- Sample size: Number of observations to generate
- HTMT threshold: Maximum acceptable HTMT ratio (0.85 conservative, 0.90 liberal)
- Target loadings: Desired factor loading strength
- Group structure: Define factor groups with names and variables
- Bootstrap options: Enable confidence interval calculation
- Output formats: CSV, JSON, or both with optional correlation matrix

**Technical Details:**
The algorithm uses iterative correlation matrix adjustment to ensure HTMT ratios fall below specified thresholds while maintaining realistic factor structures. Bootstrap resampling provides confidence intervals for HTMT estimates when enabled.

**HTMT Interpretation:**
- Values < 0.85: Strong evidence of discriminant validity (conservative criterion)
- Values < 0.90: Adequate discriminant validity (liberal criterion)  
- Values ≥ threshold: Potential discriminant validity issues requiring investigation
    `,
  },
};
