'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { UnifiedChartRenderer } from '@/lib/chart/UnifiedChartRenderer';

interface ChartData {
  title: string;
  chartType: string;
  data: any[];
  config: any;
}

export default function ChartRendererPage() {
  const searchParams = useSearchParams();
  const chartId = searchParams.get('id');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!chartId) {
        setError('Chart ID is required');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch chart data from API
        const response = await fetch(`/api/dashboard/chart-renderer?id=${chartId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load chart data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading chart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [chartId]);

  // Signal when the chart is ready for screenshot
  useEffect(() => {
    if (chartData && !isLoading) {
      // Add a small class to indicate readiness for screenshot detection
      const readyIndicator = document.createElement('div');
      readyIndicator.className = 'chart-ready';
      readyIndicator.style.position = 'absolute';
      readyIndicator.style.top = '10px';
      readyIndicator.style.right = '10px';
      readyIndicator.style.padding = '5px';
      readyIndicator.style.background = 'green';
      readyIndicator.style.color = 'white';
      readyIndicator.style.borderRadius = '3px';
      readyIndicator.style.fontSize = '12px';
      readyIndicator.style.opacity = '0.5';
      readyIndicator.textContent = 'Ready';
      
      const container = document.getElementById('chart-container');
      if (container) {
        container.appendChild(readyIndicator);
      }
    }
  }, [chartData, isLoading]);

  if (isLoading) {
    return (
      <div className="loading">Loading chart data...</div>
    );
  }

  if (error) {
    return (
      <div className="error">{error}</div>
    );
  }

  if (!chartData) {
    return (
      <div className="no-data">No chart data available</div>
    );
  }

  return (
    <div 
      id="chart-container" 
      style={{
        width: '1100px',
        height: '700px',
        margin: '0 auto',
        padding: '20px',
        background: '#1a1a1a',
        color: 'white',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div 
        style={{
          fontSize: '18px',
          marginBottom: '10px',
          textAlign: 'center',
        }}
      >
        {chartData.title}
      </div>
      
      <div 
        style={{
          fontSize: '14px',
          color: '#888',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Chart type: {chartData.chartType}
      </div>
      
      <div 
        style={{ 
          width: '1100px', 
          height: '600px'
        }}
      >
        <UnifiedChartRenderer
          chartType={chartData.chartType as any}
          data={chartData.data}
          config={chartData.config}
        />
      </div>
    </div>
  );
} 