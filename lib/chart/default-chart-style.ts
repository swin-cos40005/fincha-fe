export const defaultTheme = {
    axis: {
      domain: {
        line: {
          stroke: '#ffffff',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: '#ffffff',
          strokeWidth: 1,
        },
        text: {
          fill: '#ffffff',
          fontSize: 12,
        },
      },
      legend: {
        text: {
          fill: '#ffffff',
          fontSize: 14,
        },
      },
    },
    grid: {
      line: {
        stroke: '#ffffff',
        strokeWidth: 1,
        strokeOpacity: 0.2,
      },
    },
    text: {
      fill: '#ffffff',
    },
    tooltip: {
      container: {
        background: '#333333',
        color: '#ffffff',
      },
    },
  };
  
  export const defaultLegend = {
    dataFrom: 'keys',
    anchor: 'bottom-right',
    direction: 'column',
    justify: false,
    translateX: 120,
    translateY: 40,
    itemsSpacing: 0,
    itemWidth: 100,
    itemHeight: 18,
    itemDirection: 'left-to-right',
    itemOpacity: 1,
    symbolSize: 12,
    symbolShape: 'square',
  };