# AI-Powered Data Analysis & Visualization Platform

<div align="center">
  <img alt="AI-Powered Data Analysis Platform" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Advanced AI Chatbot with Data Analysis & Visualization</h1>
</div>

<p align="center">
  A comprehensive, enterprise-grade platform that combines AI-powered chat with advanced data analysis, visualization, and workflow automation. Built on Next.js with a modular architecture supporting 23+ chart types, KNIME-like workflow system, and intelligent document generation.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#chart-system"><strong>Chart System</strong></a> ·
  <a href="#workflow-system"><strong>Workflow System</strong></a> ·
  <a href="#ai-capabilities"><strong>AI Capabilities</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a>
</p>

## 🚀 Features

### Core Platform
- **[Next.js 15](https://nextjs.org)** with App Router and React Server Components
- **[AI SDK](https://sdk.vercel.ai/docs)** - Unified API for LLM interactions with support for xAI, OpenAI, Anthropic, and more
- **[shadcn/ui](https://ui.shadcn.com)** - Modern, accessible UI components with Tailwind CSS
- **[Auth.js](https://authjs.dev)** - Secure authentication system
- **[Neon Postgres](https://vercel.com/marketplace/neon)** - Serverless database for data persistence
- **[Vercel Blob](https://vercel.com/storage/blob)** - Efficient file storage

### 🎨 Advanced Chart System (Nivo Integration)
**Comprehensive data visualization with 23+ chart types:**

- **Primary Charts**: Scatter, Bar, Line, Pie, Heatmap, Radar
- **Specialized Charts**: Area Bump, Calendar, Chord, Circle Packing, Sankey, Box Plot, Bump, Bullet, Funnel, Stream, Sunburst, Waffle, Network, Radial Bar, Swarm Plot, Tree Map, Voronoi
- **Advanced Features**:
  - Unified data processing pipeline
  - Real-time chart configuration
  - Automatic data validation and transformation
  - Responsive design with custom themes
  - Chart screenshot capture
  - Export capabilities (PNG, SVG, PDF)

### 🔄 KNIME-like Workflow System
**Visual data processing and analysis workflows:**

- **Node Types**:
  - **Data Sources**: CSV Input, PostgreSQL, Table Creator, Data Input
  - **Data Processing**: Filter, Sort, Join, Group & Aggregate, Missing Values, Column Filter, Row Filter
  - **Statistical Analysis**: Cronbach Alpha, EVA Manipulator, Force Fit Regression, HTMT Manipulator, Outer Loading Manipulator
  - **Visualization**: Chart nodes for all 31 chart types
  - **Utilities**: Calculator, Date/Time Manipulation, String Manipulation, Python Script, Partition, Pivot

- **Workflow Features**:
  - Drag-and-drop visual editor
  - Real-time execution with progress tracking
  - Dependency management and parallel processing
  - Template system with pre-built workflows
  - Export/import workflow configurations
  - Version control and collaboration

### 📊 Dashboard & Artifacts System
**Comprehensive results management and reporting:**

- **Dashboard Features**:
  - Real-time data visualization
  - Interactive charts and tables
  - Statistical summaries and insights
  - Multi-tab organization
  - Export to various formats

- **Artifact Generation**:
  - **Text Documents**: Reports, summaries, analysis
  - **Code Artifacts**: Python scripts, SQL queries, data processing code
  - **Image Artifacts**: Chart screenshots, visualizations
  - **Sheet Artifacts**: Spreadsheet exports, data tables
  - **Plan Artifacts**: Project plans, analysis roadmaps

### 🤖 AI-Powered Analysis
**Intelligent data processing and insights:**

- **Deep Analysis Capabilities**:
  - Statistical analysis and hypothesis testing
  - Pattern recognition and anomaly detection
  - Predictive modeling and trend analysis
  - Natural language query processing
  - Automated report generation

- **AI Tools Integration**:
  - Chart configuration and optimization
  - Document creation and editing
  - Workflow suggestion and optimization
  - Data quality assessment
  - Intelligent data transformation

## 📈 Chart System

The platform includes a comprehensive chart system built on Nivo with advanced data processing capabilities:

### Supported Chart Types

| Category | Charts | Features |
|----------|--------|----------|
| **Primary** | Scatter, Bar, Line, Pie, Heatmap, Radar | Basic to advanced configurations |
| **Hierarchical** | Tree Map, Sunburst, Circle Packing | Complex data relationships |
| **Network** | Chord, Network, Sankey | Connection and flow visualization |
| **Statistical** | Box Plot, Swarm Plot, Bullet | Statistical analysis and comparisons |
| **Time Series** | Calendar, Stream, Area Bump | Temporal data visualization |
| **Specialized** | Voronoi, Waffle, Radial Bar, Funnel | Domain-specific visualizations |

### Data Processing Features

- **Unified Data Pipeline**: Consistent data transformation across all chart types
- **Smart Validation**: Automatic data type detection and validation
- **Real-time Processing**: Dynamic data updates and live chart rendering
- **Export Capabilities**: High-quality image and vector exports
- **Responsive Design**: Adaptive layouts for all screen sizes

## 🔄 Workflow System

The KNIME-inspired workflow system provides visual data processing capabilities:

### Node Categories

#### Data Sources
- **CSV Input**: Load and parse CSV files
- **PostgreSQL**: Direct database connections
- **Table Creator**: Manual data entry
- **Data Input**: Various data format support

#### Data Processing
- **Filter Nodes**: Row and column filtering
- **Sort Nodes**: Multi-column sorting
- **Join Nodes**: Data merging and combining
- **Aggregate Nodes**: Group and summarize data
- **Transform Nodes**: Data type conversion and cleaning

#### Statistical Analysis
- **Cronbach Alpha**: Reliability analysis
- **EVA Manipulator**: Exploratory factor analysis
- **HTMT Manipulator**: Discriminant validity
- **Regression Analysis**: Predictive modeling
- **Outer Loading**: Structural equation modeling

#### Visualization
- **Chart Nodes**: All 31 chart types available
- **Dashboard Nodes**: Multi-chart layouts
- **Export Nodes**: Various output formats

### Workflow Features

- **Visual Editor**: Drag-and-drop interface
- **Real-time Execution**: Live progress tracking
- **Dependency Management**: Automatic execution order
- **Template System**: Pre-built workflow templates
- **Version Control**: Workflow history and rollback
- **Collaboration**: Share and import workflows

## 🤖 AI Capabilities

The AI system provides intelligent analysis and automation:

### Analysis Tools
- **Statistical Analysis**: Automated hypothesis testing and correlation analysis
- **Pattern Recognition**: Identify trends, anomalies, and relationships
- **Predictive Modeling**: Time series forecasting and regression analysis
- **Data Quality Assessment**: Automatic data validation and cleaning suggestions
- **Natural Language Processing**: Query data using natural language

### Document Generation
- **Automated Reports**: Generate comprehensive analysis reports
- **Executive Summaries**: High-level insights and recommendations
- **Technical Documentation**: Detailed methodology and results
- **Visual Presentations**: Chart-rich presentations and dashboards
- **Code Generation**: Python scripts and SQL queries

### Workflow Intelligence
- **Smart Suggestions**: AI-powered workflow optimization
- **Template Recommendations**: Suggest relevant workflow templates
- **Error Detection**: Identify and suggest fixes for workflow issues
- **Performance Optimization**: Suggest improvements for data processing efficiency

## 🚀 Deploy Your Own

You can deploy your own version of this advanced AI platform to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Generate%20a%20random%20secret%20to%20use%20for%20authentication&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&project-name=my-ai-data-platform&repository-name=my-ai-data-platform&demo-title=AI%20Data%20Analysis%20Platform&demo-description=Advanced%20AI-powered%20data%20analysis%20and%20visualization%20platform&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## 🛠️ Running Locally

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (Neon recommended)

### Environment Setup

You will need to use the environment variables [defined in `.env.example`](.env.example) to run the platform. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> **Note**: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Quick Start

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Link local instance**: `vercel link`
3. **Download environment variables**: `vercel env pull`

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Your platform should now be running on [localhost:3000](http://localhost:3000).

### Database Setup

The platform uses Drizzle ORM with PostgreSQL. Set up your database:

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open database studio (optional)
pnpm db:studio
```

### Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open database studio
pnpm db:push          # Push schema changes

# Code Quality
pnpm lint             # Run linting
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code

# Testing
pnpm test             # Run Playwright tests
```

## 📚 Architecture

### Core Components

- **AI SDK Integration**: Unified LLM interface with multiple providers
- **Chart System**: Modular Nivo-based visualization engine
- **Workflow Engine**: Visual data processing with node-based architecture
- **Dashboard Manager**: Real-time data visualization and management
- **Artifact System**: Document generation and content management
- **Database Layer**: Drizzle ORM with PostgreSQL

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Charts**: Nivo (23+ chart types)
- **Workflows**: ReactFlow, custom execution engine
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Vercel AI SDK with multiple LLM providers
- **Authentication**: Auth.js (NextAuth)
- **Testing**: Playwright for E2E testing

## 🤝 Contributing

This is an open-source project. Contributions are welcome! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Next.js, AI SDK, and the power of modern web technologies.**


