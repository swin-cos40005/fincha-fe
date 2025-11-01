import { chromium, Browser, Page } from 'playwright';
import { dashboardItem } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

export interface ChartScreenshotOptions {
  chartId: string;
  chatId?: string;
  waitTime?: number;
}

export interface ChartScreenshotResult {
  success: boolean;
  chartId: string;
  screenshot?: {
    base64: string;
    width: number;
    height: number;
  };
  error?: string;
}

class ChartScreenshotService {
  private browser: Browser | null = null;
  private isInitialized = false;
  private dbClient = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
  private db = drizzle(this.dbClient);

  async initialize(): Promise<void> {
    if (this.isInitialized && this.browser) {
      return;
    }

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Playwright browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
    }
  }

  async captureChart(options: ChartScreenshotOptions): Promise<ChartScreenshotResult> {
    const {
      chartId,
      waitTime = 3000,
    } = options;

    let page: Page | null = null;

    try {
      // First, get the chart data from the database
      // Try to find by dashboard item ID first
      let items = await this.db
        .select()
        .from(dashboardItem)
        .where(eq(dashboardItem.id, chartId))
        .limit(1);

      // If not found by ID, try to find by nodeId
      if (items.length === 0) {
        items = await this.db
          .select()
          .from(dashboardItem)
          .where(eq(dashboardItem.nodeId, chartId))
          .limit(1);
      }

      if (items.length === 0) {
        throw new Error(`Dashboard item with ID or nodeId ${chartId} not found in database`);
      }

      const item = items[0];

      // Check if item is a chart
      if (item.type !== 'chart') {
        throw new Error(`Dashboard item ${chartId} is not a chart (type: ${item.type})`);
      }

      // Initialize browser
      await this.initialize();
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      // Create a new page to render the chart
      page = await this.browser.newPage();
      
      // Use a larger viewport to ensure the chart renders properly
      await page.setViewportSize({ width: 1200, height: 800 });

      // Use the chart renderer page
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const chartUrl = `${baseUrl}/chart-renderer?id=${item.id}`;
      const apiUrl = `${baseUrl}/api/dashboard/chart-renderer?id=${item.id}`;

      // First fetch the chart data from our API
      const apiResponse = await page.goto(apiUrl, { waitUntil: 'networkidle' });
      if (!apiResponse?.ok()) {
        throw new Error(`Failed to fetch chart data: ${apiResponse?.statusText()}`);
      }
      const data = await apiResponse.json();
      if (!data.success) {
        throw new Error(`API error: ${data.error || 'Unknown error'}`);
      }

      // Navigate to the rendering page
      await page.goto(chartUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for chart to be visible and rendered
      await page.waitForSelector('#chart-container', { 
        state: 'visible',
        timeout: Math.max(waitTime, 10000)
      });
      
      // Give extra time for animations and styling
      await page.waitForTimeout(2000);

      // Take screenshot of the chart container
      const element = await page.locator('#chart-container').first();
      const boundingBox = await element.boundingBox();
      
      if (!boundingBox) {
        throw new Error("Couldn't get chart container dimensions");
      }
      
      // Ensure the chart has a minimum size
      if (boundingBox.width < 100 || boundingBox.height < 100) {
        throw new Error(`Chart dimensions too small: ${boundingBox.width}x${boundingBox.height}`);
      }
      
      const screenshotBuffer = await element.screenshot({ type: 'png' });
      const base64 = screenshotBuffer.toString('base64');

      return {
        success: true,
        chartId,
        screenshot: {
          base64: `data:image/png;base64,${base64}`,
          width: Math.round(boundingBox.width),
          height: Math.round(boundingBox.height),
        },
      };

    } catch (error) {
      console.error(`❌ Screenshot capture failed for chart ${chartId}:`, error);
      
      return {
        success: false,
        chartId,
        error: `Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      return this.browser !== null && this.isInitialized;
    } catch {
      return false;
    }
  }
}

// Singleton instance
const chartScreenshotService = new ChartScreenshotService();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', async () => {
    await chartScreenshotService.cleanup();
  });

  process.on('SIGINT', async () => {
    await chartScreenshotService.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await chartScreenshotService.cleanup();
    process.exit(0);
  });
}

export { chartScreenshotService };
export default ChartScreenshotService;
