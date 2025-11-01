import type {
  DataTableType,
  DataTableSpec,
  ExecutionContext,
  SettingsObject,
} from '@/lib/types';
import { determineOutputType, type NodeOutputType } from '@/lib/nodes/utils';
import { convertNodeOutputToDashboardItem } from '@/lib/dashboard/utils';

/**
 * Dashboard output configuration for a node's output port
 */
export interface DashboardOutputConfig {
  portIndex: number; // Which output port (0-based)
  outputType: NodeOutputType; // Type of dashboard output
  title?: string; // Custom title for the dashboard item
  description?: string; // Custom description
}

/**
 * Abstract base class for all node models in the system
 */
export abstract class NodeModel {
  private readonly inPorts: number;
  private readonly outPorts: number;
  private dashboardOutputs: DashboardOutputConfig[] = [];

  constructor(inPorts: number, outPorts: number) {
    this.inPorts = inPorts;
    this.outPorts = outPorts;
  }

  /**
   * The main execution method that processes input data and generates output
   */
  abstract execute(
    inData: DataTableType[],
    context: ExecutionContext,
  ): Promise<DataTableType[]>;

  /**
   * Configures the node based on input data specifications
   */
  abstract configure(inSpecs: DataTableSpec[]): DataTableSpec[];

  /**
   * Loads the node's configuration settings
   */
  abstract loadSettings(settings: SettingsObject): void;

  /**
   * Saves the node's configuration settings
   */
  abstract saveSettings(settings: SettingsObject): void;

  /**
   * Validates the node's configuration settings
   */
  abstract validateSettings(settings: SettingsObject): void;

  /**
   * Configure which outputs should be sent to the dashboard
   * This should be called by subclasses during initialization if they have toDashboard=true
   */
  protected configureDashboardOutput(outputs: DashboardOutputConfig[]): void {
    this.dashboardOutputs = outputs;
  }

  /**
   * Automatically send outputs to dashboard based on configuration
   * This is called after successful execution and returns dashboard items
   * The caller (WorkflowEditor) is responsible for persisting to database
   */
  protected async sendOutputsToDashboard(
    outputs: any[], // Changed from DataTable[] to any[] to support mixed output types
    context: ExecutionContext,
    nodeLabel: string,
  ): Promise<any[]> {
    const nodeId = context.nodeId;
    
    if (this.dashboardOutputs.length === 0) {
      console.warn('⚠️ [NodeModel] No dashboard outputs configured, skipping');
      return [];
    }

    const dashboardItems: any[] = [];

    // Process all dashboard outputs
    for (const config of this.dashboardOutputs) {
      if (config.portIndex < outputs.length) {
        const outputData = outputs[config.portIndex];
        if (outputData) {
          const dashboardItem = await this.generateDashboardItem(
            outputData,
            config,
            nodeId,
            nodeLabel,
          );
          if (dashboardItem) {
            dashboardItems.push(dashboardItem);
          }
        } else {
          console.warn('⚠️ [NodeModel] Output data is null/undefined for port:', config.portIndex);
        }
      } else {
        console.warn('⚠️ [NodeModel] Port index out of bounds:', {
          configuredPort: config.portIndex,
          availableOutputs: outputs.length,
        });
      }
    }

    return dashboardItems;
  }

  /**
   * Generate a single dashboard item (without database operations)
   */
  private async generateDashboardItem(
    outputData: any,
    config: DashboardOutputConfig,
    nodeId: string,
    nodeLabel: string,
  ): Promise<any | null> {
    try {
      // Use combination of workflow node ID and port number for unique dashboard items
      // This allows one node to output multiple items to different dashboard sections
      const itemId = `${nodeId}-port-${config.portIndex}`;
      
      // Convert the output data to dashboard format
      const dashboardItem = convertNodeOutputToDashboardItem(
        nodeId,
        config.title || nodeLabel,
        config.outputType,
        outputData,
      );
      
      if (!dashboardItem) {
        console.warn('⚠️ [NodeModel] Failed to convert output to dashboard item:', {
          nodeId,
          outputType: config.outputType,
        });
        return null;
      }
      
      // Set the consistent ID for the dashboard item (nodeId + port number)
      dashboardItem.id = itemId;
      dashboardItem.nodeId = nodeId; // Ensure nodeId is set correctly
      
      // Override description if provided
      if (config.description) {
        dashboardItem.description = config.description;
      }

      return dashboardItem;
    } catch (error) {
      console.error('❌ [NodeModel] Failed to generate dashboard item:', error);
      return null;
    }
  }

  /**
   * Helper method to automatically determine dashboard output type from data
   */
  protected determineDashboardOutputType(outputData: any): NodeOutputType {
    return determineOutputType(outputData);
  }

  /**
   * Get the configured dashboard outputs
   */
  getDashboardOutputs(): DashboardOutputConfig[] {
    return [...this.dashboardOutputs];
  }

  /**
   * Resets the node's state
   */
  reset(): void {
    // Default implementation does nothing
  }

  /**
   * Returns the number of input ports
   */
  getInputPortCount(): number {
    return this.inPorts;
  }

  /**
   * Returns the number of output ports
   */
  getOutputPortCount(): number {
    return this.outPorts;
  }
}
