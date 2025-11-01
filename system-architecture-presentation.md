# System Architecture Presentation
## AI-Powered Data Analysis & Visualization Platform

---

## 🏗️ System Architecture Overview

The AI-Powered Data Analysis Platform is built on a modern, scalable architecture that combines multiple technologies to create a unified data analysis experience. The system follows a layered architecture pattern with clear separation of concerns.

---

## 📊 Architecture Layers

### 1. **Presentation Layer**
**Technologies**: Next.js 15, React 19, TypeScript, Tailwind CSS

**Components**:
- **App Router**: File-based routing with server components
- **React Server Components**: Reduced client bundle size
- **shadcn/ui**: Modern, accessible UI components
- **Framer Motion**: Smooth animations and transitions

**Key Features**:
- Server-side rendering for improved performance
- Progressive enhancement for advanced features
- Responsive design with mobile-first approach
- Type-safe development with TypeScript

### 2. **Application Layer**
**Technologies**: Next.js API Routes, Vercel AI SDK

**Components**:
- **API Routes**: RESTful endpoints for data operations
- **AI SDK Integration**: Unified interface for multiple LLM providers
- **Authentication**: NextAuth.js with multiple providers
- **File Handling**: Vercel Blob for efficient storage

**Key Features**:
- Unified AI provider interface
- Real-time data streaming
- Secure file upload and processing
- Session management and user authentication

### 3. **Business Logic Layer**
**Technologies**: Custom workflow engine, chart processing system

**Components**:
- **Workflow Engine**: Visual data processing system
- **Chart System**: 23+ chart types with unified processing
- **AI Tools**: Document generation, chart analysis, workflow management
- **Dashboard Manager**: Real-time visualization management

**Key Features**:
- Modular node-based workflow system
- Real-time chart configuration and rendering
- AI-powered analysis and automation
- Comprehensive dashboard management

### 4. **Data Access Layer**
**Technologies**: Drizzle ORM, PostgreSQL, Redis

**Components**:
- **Database**: Neon PostgreSQL for persistent storage
- **ORM**: Drizzle for type-safe database operations
- **Caching**: Redis for session and data caching
- **Migrations**: Automated database schema management

**Key Features**:
- Type-safe database operations
- Connection pooling for performance
- Automated migration system
- Efficient caching strategies

---

## 🔄 Data Flow Architecture

### Request Flow
```
Client Request → Next.js Router → API Route → Business Logic → Database → Response
```

### AI Processing Flow
```
User Input → AI SDK → LLM Provider → Tool Execution → Response Generation → Client
```

### Workflow Execution Flow
```
Workflow Definition → Execution Engine → Node Processing → Dashboard Update → Visualization
```

---

## 🗄️ Database Architecture

### Schema Design
**Location**: `lib/db/schema.ts`

#### Core Tables

**User Management**:
```sql
User (id, email, password)
-- Handles user authentication and profile data
```

**Chat System**:
```sql
Chat (id, title, userId, visibility)
Message_v2 (id, chatId, role, parts, attachments)
-- Manages conversation history and AI interactions
```

**Workflow System**:
```sql
Workflow (chatId, title, content, shared, sharedId)
-- Stores visual workflow definitions and configurations
```

**Dashboard System**:
```sql
DashboardItem (id, chatId, nodeId, type, title, data)
-- Manages visualization outputs and chart data
```

**Document System**:
```sql
Document (id, title, content, kind, userId)
-- Stores AI-generated documents and artifacts
```

**Analytics**:
```sql
Vote_v2 (chatId, messageId, isUpvoted)
Report (id, chatId, title, content, userType)
-- Tracks user interactions and generates reports
```

### Database Relationships
```
User (1) → (N) Chat
Chat (1) → (N) Message_v2
Chat (1) → (1) Workflow
Chat (1) → (N) DashboardItem
User (1) → (N) Document
Chat (1) → (N) Vote_v2
Chat (1) → (N) Report
```

---

## 🤖 AI Architecture

### AI Provider Integration
**Location**: `lib/ai/providers.ts`

**Supported Providers**:
- **xAI**: Grok model integration
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude models
- **Google AI**: Gemini models

**Unified Interface**:
```typescript
interface AIProvider {
  languageModel(model: string): LanguageModel;
  generateText(prompt: string): Promise<string>;
  streamText(messages: Message[]): AsyncIterable<string>;
}
```

### AI Tools Architecture
**Location**: `lib/ai/tools/`

**Tool Categories**:
1. **Document Tools**: `createDocument`, `updateDocument`
2. **Chart Tools**: `captureChartScreenshot`, `configureChart`
3. **Workflow Tools**: `viewAvailableCategories`, `modifyWorkflow`, `executeWorkflow`
4. **Analysis Tools**: `readDashboardData`, `requestSuggestions`
5. **External Tools**: `getWeather`

**Tool Execution Flow**:
```
AI Request → Tool Selection → Parameter Validation → Execution → Result Processing → Response
```

---

## 🔄 Workflow Engine Architecture

### Core Components
**Location**: `lib/workflow/core/`

#### 1. **UnifiedWorkflowSystem**
- **Purpose**: Main orchestrator for all workflow operations
- **Responsibilities**:
  - Coordinate workflow lifecycle (create, execute, save, load)
  - Manage node creation and deletion
  - Handle workflow execution and monitoring
  - Integrate with dashboard system

#### 2. **WorkflowManager**
- **Purpose**: Core workflow logic and node management
- **Responsibilities**:
  - Node creation and configuration
  - Workflow execution with dependency resolution
  - Node status tracking and notifications
  - Serialization/deserialization of workflow data

#### 3. **DashboardManager**
- **Purpose**: Visual output and artifact management
- **Responsibilities**:
  - Process node outputs into dashboard items
  - Handle persistence of visual artifacts
  - Manage different dashboard item types
  - Real-time dashboard updates

#### 4. **ConnectionManager**
- **Purpose**: Node relationship and validation management
- **Responsibilities**:
  - Validate node connections
  - Prevent circular dependencies
  - Manage connection state
  - Handle connection events

#### 5. **ExecutionEngine**
- **Purpose**: Workflow execution logic
- **Responsibilities**:
  - Topological sorting for execution order
  - Dependency resolution
  - Node execution and error handling
  - Progress tracking and notifications

### Execution Flow
```
Workflow Definition → Topological Sort → Dependency Resolution → Node Execution → Output Processing → Dashboard Update
```

---

## 📊 Chart System Architecture

### Chart Processing Pipeline
**Location**: `lib/chart/`

#### Data Flow
```
Raw Data → Data Processor → Chart Config → Renderer → Dashboard
```

#### Component Architecture

**1. Data Processors**
- **Location**: `lib/chart/*/DataProcessor.ts`
- **Purpose**: Transform raw data into chart-specific format
- **Features**:
  - Data validation and cleaning
  - Type conversion and normalization
  - Aggregation and summarization
  - Missing value handling

**2. Chart Configurators**
- **Location**: `lib/chart/*/Config.tsx`
- **Purpose**: Interactive chart configuration interface
- **Features**:
  - Column mapping with dropdowns
  - Styling and theme options
  - Real-time preview
  - Configuration validation

**3. Chart Renderers**
- **Location**: `lib/chart/*/Renderer.tsx`
- **Purpose**: Visual chart rendering with Nivo
- **Features**:
  - Responsive design
  - Interactive elements
  - Export capabilities
  - Screenshot capture

**4. Chart Schemas**
- **Location**: `lib/chart/*/Schema.ts`
- **Purpose**: Type definitions and validation
- **Features**:
  - TypeScript interfaces
  - Zod validation schemas
  - Default configurations
  - Chart-specific options

### Chart Categories

#### Primary Charts
- **Bar Charts**: `lib/chart/bar/`
- **Line Charts**: `lib/chart/line/`
- **Scatter Plots**: `lib/chart/scatter/`
- **Pie Charts**: `lib/chart/pie/`
- **Heatmaps**: `lib/chart/heatmap/`
- **Radar Charts**: `lib/chart/radar/`

#### Advanced Charts
- **Hierarchical**: Tree Map, Sunburst, Circle Packing
- **Network**: Chord, Network, Sankey
- **Statistical**: Box Plot, Swarm Plot, Bullet
- **Time Series**: Calendar, Stream, Area Bump
- **Specialized**: Voronoi, Waffle, Radial Bar, Funnel

---

## 🔒 Security Architecture

### Authentication System
**Location**: `app/(auth)/`

#### Components
- **NextAuth.js**: Authentication framework
- **Session Management**: Secure cookie-based sessions
- **Provider Integration**: Multiple OAuth providers
- **Guest Access**: Demo user functionality

#### Security Features
- **Environment Variables**: Secure configuration management
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Drizzle ORM protection
- **XSS Protection**: React sanitization
- **CSRF Protection**: NextAuth built-in protection

### Data Security
- **Encryption**: HTTPS/TLS for data in transit
- **Access Control**: Role-based permissions
- **Data Validation**: Server-side validation
- **Audit Logging**: User action tracking

---

## 🚀 Performance Architecture

### Frontend Optimization
- **React Server Components**: Reduced client bundle
- **Code Splitting**: Dynamic imports for lazy loading
- **Image Optimization**: Next.js Image component
- **Caching**: Browser and CDN caching strategies

### Backend Optimization
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Redis Caching**: Session and data caching
- **CDN Distribution**: Static asset delivery

### Scalability Features
- **Serverless Architecture**: Vercel platform scaling
- **Microservices Ready**: Modular component design
- **Horizontal Scaling**: Database and application scaling
- **Load Balancing**: Distributed request handling

---

## 🧪 Testing Architecture

### Testing Strategy
**Location**: `tests/`

#### Test Types
1. **E2E Testing**: Playwright for user workflows
2. **Unit Testing**: Component and function testing
3. **Integration Testing**: API and database testing
4. **Visual Testing**: Chart rendering verification

#### Testing Tools
- **Playwright**: End-to-end testing framework
- **Jest**: Unit testing framework
- **Testing Library**: Component testing utilities
- **MSW**: API mocking for integration tests

### Code Quality
- **TypeScript**: Type safety and IntelliSense
- **ESLint**: Code linting and style enforcement
- **Biome**: Fast code formatting and linting
- **Prettier**: Code formatting consistency

---

## 📈 Deployment Architecture

### Deployment Pipeline
1. **Development**: Local development with hot reload
2. **Staging**: Vercel preview deployments
3. **Production**: Automated deployment on main branch

### Environment Management
- **Environment Variables**: Configuration management
- **Database Migrations**: Automated schema updates
- **Secrets Management**: Vercel environment secrets
- **Monitoring**: Vercel Analytics integration

### Infrastructure
- **Vercel Platform**: Serverless hosting and deployment
- **Neon Database**: Serverless PostgreSQL
- **Vercel Blob**: File storage and CDN
- **Redis**: Caching and session storage

---

## 🔮 Architecture Evolution

### Current State
- **Monolithic Architecture**: Single application with modular components
- **Serverless Functions**: API routes for backend logic
- **Database-First**: PostgreSQL with Drizzle ORM
- **AI-Integrated**: Multiple LLM providers with unified interface

### Future Enhancements
1. **Microservices**: Separate services for different domains
2. **Event-Driven**: Message queues for async processing
3. **Distributed Workflows**: Multi-node workflow execution
4. **Real-time Collaboration**: WebSocket-based collaboration
5. **Edge Computing**: Edge functions for global performance

---

## 📋 Architecture Summary

### Key Strengths
- **Modular Design**: Clear separation of concerns
- **Scalable Architecture**: Serverless and microservices-ready
- **Type Safety**: Comprehensive TypeScript coverage
- **Performance Optimized**: Multiple optimization strategies
- **Security Focused**: Comprehensive security measures

### Technical Excellence
- **Modern Stack**: Latest technologies and best practices
- **Developer Experience**: Excellent tooling and documentation
- **Quality Assurance**: Comprehensive testing strategy
- **Deployment Ready**: Automated CI/CD pipeline

### Business Value
- **Rapid Development**: Efficient development workflow
- **Cost Effective**: Serverless architecture reduces costs
- **Reliable**: Comprehensive testing and monitoring
- **Maintainable**: Clean architecture and documentation

This architecture provides a solid foundation for a scalable, maintainable, and feature-rich data analysis platform that can grow with business needs while maintaining high performance and security standards. 