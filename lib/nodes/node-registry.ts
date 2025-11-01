import type { NodeFactory } from './core';
// NOTE: Commented out nodes are in progress

{ /* Data input nodes */ }
import { DataInputNodeFactory } from './DATA-SOURCES/data-input/node-factory';
import { PostgresInputNodeFactory } from './DATA-SOURCES/postgres-input/node-factory';
import { TableCreatorNodeFactory } from './DATA-SOURCES/table-creator/node-factory';

{ /* Data manipulation nodes */ }
import { MissingValuesNodeFactory } from './missing-values/node-factory';
import { PartitionNodeFactory } from './partition/node-factory';
import { ChartNodeFactory } from './chart/node-factory';
import { FilterNodeFactory } from './row-filter/node-factory';
import { ColumnFilterNodeFactory } from './column-filter/node-factory';
import { SorterNodeFactory } from './sorter/node-factory';
import { JoinerNodeFactory } from './joiner/node-factory';
import { DataScorerNodeFactory } from './data-scorer/node-factory';
import { GroupAndAggregateNodeFactory } from './group-and-aggregate/node-factory';
import { NormalizerNodeFactory } from './normalizer/node-factory';

{ /* Statistical manipulation nodes */ }
import { CronbachAlphaNodeFactory } from './STATISTIC-MANIPULATION/cronbach-alpha-generator/node-factory';
// import { ForceRegressionNodeFactory } from './STATISTIC-MANIPULATION/force-fit-regression/node-factory';
// import { EVAManipulatorNodeFactory } from './STATISTIC-MANIPULATION/EVA-manipulator/node-factory';
// import { HTMTManipulatorNodeFactory } from './STATISTIC-MANIPULATION/HTMT-manipulator/node-factory';

{ /* Code execution nodes */ }
// import { PythonScriptNodeFactory } from './python-script/node-factory';
/**
 * Registry for all node factories in the system
 */
export class NodeRegistry {
  private static instance: NodeRegistry;
  private factories: Map<string, NodeFactory<any>> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  /**
   * Register a node factory
   */
  registerFactory(factory: NodeFactory<any>): void {
    const metadata = factory.getNodeMetadata();
    this.factories.set(metadata.id, factory);
  }

  /**
   * Get all registered factories
   */
  getAllFactories(): NodeFactory<any>[] {
    return Array.from(this.factories.values());
  }

  /**
   * Get factories by category
   */
  getFactoriesByCategory(category: string): NodeFactory<any>[] {
    return Array.from(this.factories.values()).filter((factory) =>
      factory.getNodeMetadata().category.includes(category),
    );
  }

  /**
   * Get a factory by ID
   */
  getFactory(id: string): NodeFactory<any> | undefined {
    return this.factories.get(id);
  }
}

/**
 * Initialize and register all available nodes
 */
export function initializeNodeRegistry(): void {
  const registry = NodeRegistry.getInstance();

  // Register all available nodes
  registry.registerFactory(new DataInputNodeFactory());
  registry.registerFactory(new GroupAndAggregateNodeFactory());
  registry.registerFactory(new TableCreatorNodeFactory());
  registry.registerFactory(new MissingValuesNodeFactory());
  registry.registerFactory(new PartitionNodeFactory());
  registry.registerFactory(new ChartNodeFactory());
  registry.registerFactory(new FilterNodeFactory());
  registry.registerFactory(new ColumnFilterNodeFactory());
  registry.registerFactory(new SorterNodeFactory());
  registry.registerFactory(new JoinerNodeFactory());
  registry.registerFactory(new PostgresInputNodeFactory());
  registry.registerFactory(new DataScorerNodeFactory());
  registry.registerFactory(new CronbachAlphaNodeFactory());
  registry.registerFactory(new NormalizerNodeFactory());
  // registry.registerFactory(new PythonScriptNodeFactory());
  // registry.registerFactory(new ForceRegressionNodeFactory());
  // registry.registerFactory(new EVAManipulatorNodeFactory());
  // registry.registerFactory(new HTMTManipulatorNodeFactory());
}

// Auto-initialize when module is loaded
initializeNodeRegistry();
