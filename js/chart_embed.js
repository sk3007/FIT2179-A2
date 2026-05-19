// 1. Define your global Vega-Lite configuration
const globalEmbedOptions = {
    config: {
        // Sets the default font for all text, titles, and labels across the chart
        font: "Times New Roman, serif", 
        
        // Specific styling applied only to chart titles
        title: {
            fontSize: 18,
            fontWeight: "bold",
            color: "#333333",
            anchor: "start",
            subtitleFontSize: 14,
        },
        
        // Optional: Uniform styling for axes
        axis: {
            labelFont: "Arial, sans-serif",
            titleFont: "Arial, sans-serif",
            titleFontSize: 12,
            labelFontSize: 10
        },
        
        // Optional: Uniform styling for legends
        legend: {
            titleFont: "Arial, sans-serif",
            labelFont: "Arial, sans-serif",
            titleFontSize: 12,
            labelFontSize: 10
        }
    }
};

// 2. Map your chart containers to their JSON specification paths
const charts = [
    { id: '#chart1', path: 'charts/chart1.vg.json' },
    { id: '#chart2', path: 'charts/chart2.vg.json' },
    // { id: '#chart3', path: 'charts/chart3.vg.json' },
    { id: '#chart4', path: 'charts/chart4.vg.json' },
    { id: '#chart5', path: 'charts/chart5.vg.json' },
    { id: '#chart6', path: 'charts/chart6.vg.json' },
    { id: '#chart7', path: 'charts/chart7.vg.json' },
    { id: '#chart8', path: 'charts/chart8.vg.json' },
    { id: '#chart9', path: 'charts/chart9.vg.json' },
    { id: '#chart10', path: 'charts/chart10.vg.json' },
    { id: '#chart12', path: 'charts/chart12.vg.json' },
    { id: '#chart13', path: 'charts/chart13.vg.json' },
    { id: '#chart14', path: 'charts/chart14.vg.json' }
];

// 3. Loop through and embed each chart, injecting the global options
charts.forEach(chart => {
    vegaEmbed(chart.id, chart.path, globalEmbedOptions)
        .catch(console.error);
});