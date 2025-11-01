import { tool } from 'ai';
import { z } from 'zod';
import { chartScreenshotService } from '@/lib/services/chart-screenshot';

export const captureChartScreenshot = (chatId: string) => tool({
  description: `Capture a screenshot of a chart and analyze its visual appearance.

This tool takes a dashboard item ID and renders a visual representation of the chart
based on its data and configuration stored in the database.`,

  parameters: z.object({
    chartId: z
      .string()
      .describe(
        'The ID of the dashboard item containing chart data',
      ),
  }),

  execute: async ({
    chartId,
  }) => {
    try {
      // Call the chart screenshot service
      const screenshotResult = await chartScreenshotService.captureChart({
        chartId,
        chatId,
        waitTime: 3000,
      });

      if (!screenshotResult.success) {
        throw new Error(screenshotResult.error || 'Screenshot capture failed');
      }
      return {
        success: true,
        chartId,
        screenshot: screenshotResult.screenshot,
        message: `Chart screenshot generated from dashboard item ${chartId}. You can now analyze the chart.`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to capture chart screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        chartId,
        message: `Screenshot capture failed for chart ${chartId}. Make sure this is a valid dashboard item ID for a chart.`,
      };
    }
  },
});
