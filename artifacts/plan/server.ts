import { streamObject } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { NodeRegistry } from '@/lib/nodes/node-registry';

// Generate data context for plan creation
async function generateDataContext(csvUrls: string[] = []): Promise<string> {
  if (csvUrls.length === 0) return '';
  
  let dataContext = '\n\n**Available Data Sources:**\n\n';
  
  // For each CSV URL, fetch a sample of the data
  for (const csvUrl of csvUrls) {
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) continue;
      
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      if (lines.length > 0) {
        const headers = lines[0];
        const sampleRows = lines.slice(1, 6); // First 5 data rows
        
        dataContext += `**Dataset: ${csvUrl.split('/').pop() || 'Data File'}**\n`;
        dataContext += `- Headers: ${headers}\n`;
        dataContext += `- Sample rows (first 5):\n`;
        sampleRows.forEach((row, idx) => {
          dataContext += `  ${idx + 1}. ${row}\n`;
        });
        dataContext += `- Total rows: ${lines.length - 1}\n\n`;
      }
    } catch (error) {
      dataContext += `**Dataset: ${csvUrl.split('/').pop() || 'Data File'}**\n`;
      dataContext += `- Status: Unable to preview (will be loaded during analysis)\n\n`;
    }
  }
  
  return dataContext;
}

// Generate workflow context for plan creation
async function generateWorkflowContext(): Promise<string> {
  try {
    // Import NodeRegistry to get available nodes
    
    const registry = NodeRegistry.getInstance();
    const factories = registry.getAllFactories();
    
    // Group nodes by category
    const nodesByCategory = factories.reduce(
      (acc, factory) => {
        const metadata = factory.getNodeMetadata();
        const nodeModel = factory.createNodeModel();
        
        if (!acc[metadata.category]) {
          acc[metadata.category] = [];
        }
        
        acc[metadata.category].push({
          name: metadata.name,
          description: factory.getNodeShortDescription(),
          outputsToDashboard: metadata.toDashboard || false,
        });
        
        return acc;
      },
      {} as Record<string, Array<{ name: string; description: string; outputsToDashboard: boolean }>>
    );
    
    // Build context string
    let context = '\n\n**Available Workflow Nodes:**\n\n';
    
    Object.entries(nodesByCategory).forEach(([category, nodes]) => {
      context += `**${category}:**\n`;
      nodes.forEach((node) => {
        context += `• **${node.name}**: ${node.description}`;
        if (node.outputsToDashboard) {
          context += ' *(outputs to dashboard)*';
        }
        context += '\n';
      });
      context += '\n';
    });
    
    context += `**Workflow Process:**\n`;
    context += `• Data flows through connected nodes in sequence\n`;
    context += `• Source nodes (like Data Input) provide initial data\n`;
    context += `• Processing nodes transform and analyze data\n`;
    context += `• Visualization nodes (like Chart) create dashboard outputs\n`;
    context += `• Dashboard outputs include charts, tables, and statistics\n`;
    context += `• Nodes can be configured with specific settings for different analysis approaches\n\n`;
    
    return context;
  } catch (error) {
    console.warn('Failed to generate workflow context:', error);
    return '\n\n**Workflow System:** Available for data processing and visualization tasks.\n\n';
  }
}

// Extract CSV URLs from chat messages
async function getCsvUrlsFromChat(chatId?: string): Promise<string[]> {
  if (!chatId) return [];
  
  try {
    const { getMessagesByChatId } = await import('@/lib/db/queries');
    const messages = await getMessagesByChatId({ id: chatId });
    
    const csvUrls: string[] = [];
    
    for (const message of messages) {
      if (message.attachments && Array.isArray(message.attachments)) {
        for (const attachment of message.attachments) {
          if (
            (attachment.contentType === 'text/csv' ||
              attachment.contentType === 'application/vnd.ms-excel' ||
              attachment.name?.endsWith('.csv')) &&
            attachment.url
          ) {
            csvUrls.push(attachment.url);
          }
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(csvUrls)];
  } catch (error) {
    console.warn('Failed to extract CSV URLs from chat:', error);
    return [];
  }
}

function generatePlanPrompt(workflowContext: string, dataContext: string) {
  return `You are creating a comprehensive data analysis plan that guides the analytical process with clear structure and objectives.

Your plan should include the following structured components:

**Goal:** Define what needs to be achieved from the analysis process. Be specific about the analytical objectives and expected insights.

**Approach:** Describe how the task should be handled using available workflow capabilities. Consider the data processing pipeline, analysis methods, and visualization strategies.${workflowContext}${dataContext}

**Criteria:** Define objective, measurable criteria for success. Specify what deliverables indicate successful completion (e.g., "6 charts types visualizing different aspects of the data", "statistical analysis of key metrics", "identification of trends and anomalies"). Base criteria on the target audience and use case.

**Report Style:** Specify how results should be communicated to the target audience (business style, scientific style, executive summary, technical documentation, etc.). Consider the expertise level and needs of stakeholders.

**Optional Enhancements:** Describe additional considerations for specific scenarios or edge cases (e.g., "In scenario X, the agent should also Y...").

Focus on creating actionable, specific guidance that can be followed systematically. Consider the persona and context of the analysis to tailor your recommendations appropriately.`;
}

function generatePlanUpdatePrompt(currentContent: string, workflowContext: string, dataContext: string) {
  return `You are improving a data analysis plan based on the given prompt. 

${generatePlanPrompt(workflowContext, dataContext)}

Current plan:
${currentContent}

Update the plan according to the new requirements while maintaining the structured format and considering workflow capabilities.`;
}

export const planDocumentHandler = createDocumentHandler<'plan'>({
  kind: 'plan',
  
  onCreateDocument: async ({ title, dataStream, session, chatId }) => {
    let draftContent = '';

    try {
      const workflowContext = await generateWorkflowContext();
      const csvUrls = await getCsvUrlsFromChat(chatId);
      const dataContext = await generateDataContext(csvUrls);

      const { fullStream } = streamObject({
        model: myProvider.languageModel('artifact-model'),
        system: generatePlanPrompt(workflowContext, dataContext),
        prompt: title,
        schema: z.object({
          goal: z.string().describe('Primary analysis objective and expected outcomes'),
          approach: z.string().describe('Analytical approach and methodology using workflow nodes'),
          criteria: z.string().describe('Objective, measurable criteria for success'),
          reportStyle: z.string().describe('Communication style for target audience'),
          optionalEnhancements: z.string().describe('Additional considerations for specific scenarios'),
        }),
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const planContent = {
            goal: object.goal || '',
            approach: object.approach || '',
            criteria: object.criteria || '',
            reportStyle: object.reportStyle || '',
            optionalEnhancements: object.optionalEnhancements || '',
            customFields: []
          };

          draftContent = JSON.stringify(planContent, null, 2);

          dataStream.writeData({
            type: 'plan-delta',
            content: draftContent,
          });
        }
      }

    } catch (error) {
      throw error;
    }

    return draftContent;
  },

  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';
    const workflowContext = await generateWorkflowContext();
    // Note: For updates, we don't have direct access to chatId, so we can't fetch new CSV URLs
    // The plan will preserve existing data context and can be manually updated if needed
    const dataContext = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: generatePlanUpdatePrompt(document.content || '', workflowContext, dataContext),
      prompt: description,
      schema: z.object({
        goal: z.string().describe('Primary analysis objective and expected outcomes'),
        approach: z.string().describe('Analytical approach and methodology using workflow nodes'),
        criteria: z.string().describe('Objective, measurable criteria for success'),
        reportStyle: z.string().describe('Communication style for target audience'),
        optionalEnhancements: z.string().describe('Additional considerations for specific scenarios'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        
        // Parse existing content to preserve custom fields
        const currentPlan = (() => {
          try {
            return JSON.parse(document.content || '{}');
          } catch {
            return {};
          }
        })();
        
        const planContent = {
          goal: object.goal || currentPlan.goal || '',
          approach: object.approach || currentPlan.approach || '',
          criteria: object.criteria || currentPlan.criteria || '',
          reportStyle: object.reportStyle || currentPlan.reportStyle || '',
          optionalEnhancements: object.optionalEnhancements || currentPlan.optionalEnhancements || '',
          customFields: currentPlan.customFields || []
        };

        draftContent = JSON.stringify(planContent, null, 2);

        dataStream.writeData({
          type: 'plan-delta',
          content: draftContent,
        });
      }
    }

    return draftContent;
  },
}); 