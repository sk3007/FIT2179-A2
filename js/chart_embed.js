// 1. Define your global Vega-Lite configuration
const globalEmbedOptions = {
  actions: false,
  config: {
    font: "Times New Roman, serif",

    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#333333",
      anchor: "start",
      subtitleFontSize: 16,
      offset: 20
    },

    axis: {
      labelFont: "Arial, sans-serif",
      titleFont: "Arial, sans-serif",
      titleFontSize: 15,
      labelFontSize: 13,
      gridWidth: 0.5
    },

    legend: {
      titleFont: "Arial, sans-serif",
      labelFont: "Arial, sans-serif",
      titleFontSize: 14,
      labelFontSize: 12
    },

    text: {
      font: "Arial, sans-serif",
      fontSize: 13,
      fontWeight: "normal",
      color: "#374151",
      lineHeight: 16
    },
    
    view: {
        stroke: null
    }
  }
};

// 2. Map your chart containers to their JSON specification paths
const charts = [
  { id: "#chart1", path: "charts/chart1.vg.json" },
  { id: "#chart2", path: "charts/chart2.vg.json" },
  // { id: "#chart3", path: "charts/chart3.vg.json" },
  { id: "#chart4", path: "charts/chart4.vg.json" },
  { id: "#chart5", path: "charts/chart5.vg.json" },
  { id: "#chart6", path: "charts/chart6.vg.json" },

  // Special responsive faceted chart
  {
    id: "#chart7",
    path: "charts/chart7.vg.json",
    responsiveFacet: true
  },

  { id: "#chart8", path: "charts/chart8.vg.json" },
  { id: "#chart9", path: "charts/chart9.vg.json" },
  { id: "#chart10", path: "charts/chart10.vg.json" },
  { id: "#chart12", path: "charts/chart12(1).vg.json" },
  { id: "#chart13", path: "charts/chart13.vg.json" },
  { id: "#chart14", path: "charts/chart14.vg.json" }
];

function getResponsiveFacetLayout(container) {
  const containerWidth = container.getBoundingClientRect().width;
  // 1. Read the actual CSS height of the container
  const containerHeight = container.getBoundingClientRect().height;

  let columns;

  if (containerWidth >= 900) {
    columns = 3;
  } else if (containerWidth >= 600) {
    columns = 2;
  } else {
    columns = 1;
  }

  const columnGap = 20;
  const totalGap = columnGap * (columns - 1);

  // Reserve fixed space for the global legend and horizontal chart padding
  const legendAndPaddingReserve = 150; 

  // Calculate the width left over for the actual map cells
  const availableWidth = containerWidth - totalGap - legendAndPaddingReserve;

  // Calculate cell width and ensure it doesn't shrink below a usable size
  const cellWidth = Math.max(100, Math.floor(availableWidth / columns));

  // --- NEW HEIGHT CALCULATIONS ---
  // You have 6 years (2019-2024), so we calculate how many rows that takes
  const totalMaps = 6;
  const rows = Math.ceil(totalMaps / columns);

  // Reserve vertical space for the main title, facet headers, and margins
  const verticalReserve = 150; 
  const availableHeight = containerHeight - verticalReserve;

  // Calculate cell height dynamically based on available vertical container space
  // We use Math.max(120, ...) to ensure the map doesn't get squashed too flat on tiny screens
  const cellHeight = Math.max(120, Math.floor(availableHeight / rows));

  return {
    columns,
    cellWidth,
    cellHeight
  };
}

async function embedResponsiveFacetChart(chart) {
  const container = document.querySelector(chart.id);

  if (!container) {
    console.warn(`Container not found: ${chart.id}`);
    return;
  }

  const response = await fetch(chart.path);
  const spec = await response.json();

  const layout = getResponsiveFacetLayout(container);

  spec.columns = layout.columns;

  if (!spec.spec) {
    console.error(`Responsive facet chart ${chart.id} does not contain a nested "spec".`);
    return;
  }

  spec.spec.width = layout.cellWidth;
  spec.spec.height = layout.cellHeight;

  await vegaEmbed(chart.id, spec, globalEmbedOptions);
}

function debounce(fn, delay = 250) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

async function embedAllCharts() {
  for (const chart of charts) {
    if (chart.responsiveFacet) {
      await embedResponsiveFacetChart(chart);
    } else {
      vegaEmbed(chart.id, chart.path, globalEmbedOptions)
        .catch(console.error);
    }
  }
}

const resizeResponsiveCharts = debounce(() => {
  charts
    .filter(chart => chart.responsiveFacet)
    .forEach(chart => {
      embedResponsiveFacetChart(chart).catch(console.error);
    });
}, 250);

document.addEventListener("DOMContentLoaded", () => {
  embedAllCharts().catch(console.error);

  window.addEventListener("resize", resizeResponsiveCharts);
});