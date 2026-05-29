/* ============================================================
   chart_treemap.js
   Malaysia GDP by Economic Activity — Highcharts Treemap
   ============================================================ */

(function () {

  const CSV_PATH = 'data/malaysia_gdp_treemap.csv';

  /* ---------- colour palette per top-level sector ---------- */
  /* Updated to be color-blind friendly. No red or green. */
  const SECTOR_COLOURS = {
    'Agriculture':          '#8fdfa1', /* Teal instead of green */
    'Mining and quarrying': '#907555', /* Dark orange/brown */
    'Manufacturing':        '#9486cf', /* Blue */
    'Construction':         '#8aa3f0', /* Purple instead of red */
    'Services':             '#b4dcf3', /* Slate/Dark Blue */
    'plus Import duties':   '#a9aaaa', /* Light Blue instead of green */
  };

  /* ---------- parse CSV text into an array of objects ---------- */
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ? cols[i].trim() : ''; });
      obj.value = parseInt(obj.value, 10);
      obj.level = parseInt(obj.level, 10);
      return obj;
    });
  }

  /* ---------- build Highcharts data array for one year ---------- */
/* ---------- build Highcharts data array for one year ---------- */
  function buildSeriesData(rows, year) {
    const yearRows = rows.filter(r => r.year === year);
    const data = [];

    // Calculate total GDP manually for level 1 percentage labels
    const totalGDP = yearRows
      .filter(r => r.level === 1)
      .reduce((sum, r) => sum + r.value, 0);

    // Create a quick lookup map of code -> name for level 1 sectors
    const rootSectorMap = {};
    yearRows.forEach(r => {
      if (r.level === 1) {
        rootSectorMap[r.code] = r.name;
      }
    });

    yearRows.forEach(r => {
      // Find the top-level sector code by taking the first element before the dot
      const rootCode = r.code.split('.')[0];
      const rootName = rootSectorMap[rootCode] || '';
      const baseColor = SECTOR_COLOURS[rootName] || '#94a3b8';

      if (r.level === 1) {
        data.push({
          id: r.code,
          name: r.name,
          parent: '', 
          value: r.value,
          color: baseColor,
          totalGDP: totalGDP
        });
      } else if (r.level === 2) {
        data.push({
          id: r.code,
          name: r.name,
          parent: rootCode,
          value: r.value,
          // Give all sub-items a standard, uniform brightness bump
          color: Highcharts.color(baseColor).brighten(0.18).get(),
        });
      } else if (r.level === 3) {
        const parentCode = r.code.split('.').slice(0, -1).join('.');
        data.push({
          id: r.code,
          name: r.name,
          parent: parentCode,
          value: r.value,
          // Level 3 gets the exact same brightness as Level 2
          color: Highcharts.color(baseColor).brighten(0.18).get(),
        });
      }
    });

    return data;
  }

  /* ---------- format RM value for tooltip ---------- */
  function fmtRM(v) {
    if (v >= 1e6) return 'RM ' + (v / 1e6).toFixed(2) + ' trillion';
    if (v >= 1e3) return 'RM ' + (v / 1e3).toFixed(1) + ' billion';
    return 'RM ' + v.toLocaleString() + ' million';
  }

  /* ---------- inject slider + chart container HTML ---------- */
  function injectDOM(containerId) {
    const host = document.getElementById(containerId);
    if (!host) { console.error('chart_treemap.js: container #' + containerId + ' not found'); return null; }

    host.innerHTML = `
      <div class="tm-wrapper">
        <div class="tm-header">
          <div class="tm-titles">
            <p class="tm-title">Malaysia GDP by Economic Activity</p>
            <p class="tm-subtitle">Constant 2010 Prices &nbsp;·&nbsp; RM Million</p>
          </div>
          <div class="tm-controls">
            <label class="tm-year-label" for="tm-year-slider">Year: <span id="tm-year-display">2010</span></label>
            <input id="tm-year-slider" class="tm-slider" type="range" min="0" max="7" step="1" value="0">
          </div>
        </div>
        <div id="tm-chart-container"></div>
      </div>`;

    if (!document.getElementById('tm-styles')) {
      const style = document.createElement('style');
      style.id = 'tm-styles';
      style.textContent = `
        .tm-wrapper {
          font-family: 'Inter', sans-serif;
          background: #ffffff;
          padding: 10px 0;
        }
        .tm-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 15px;
        }
        .tm-title {
          margin: 0 0 4px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
        }
        .tm-subtitle {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
          text-transform: uppercase;
        }
        .tm-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .tm-year-label {
          font-size: 0.9rem;
          color: #475569;
        }
        #tm-year-display {
          font-weight: 700;
          color: #0f172a;
          font-size: 1.1rem;
        }
        .tm-slider {
          -webkit-appearance: none;
          width: 200px;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
        }
        .tm-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .tm-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
        #tm-chart-container {
          height: 600px;
          width: 100%;
        }
      `;
      document.head.appendChild(style);
    }

    return host;
  }

  /* ---------- main init ---------- */
  function init(containerId) {
    injectDOM(containerId);

    fetch(CSV_PATH)
      .then(res => {
        if (!res.ok) throw new Error('Could not load ' + CSV_PATH + ' (HTTP ' + res.status + ')');
        return res.text();
      })
      .then(text => {
        const rows = parseCSV(text);
        const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016e', '2017p'];

        const chart = Highcharts.chart('tm-chart-container', {
          chart: {
            style: { fontFamily: "'Inter', sans-serif" },
            animation: { duration: 400 },
            backgroundColor: 'transparent'
          },
          title: { text: null },
          credits: { enabled: false },
          exporting: { enabled: false },

          series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            animationLimit: 1000,
            dataLabels: { enabled: false },
            levelIsConstant: false,
            
          levels: [
  {
    level: 1,
    dataLabels: {
      enabled: true,
      headers: true,
      crop: true,
      overflow: 'hidden',
      allowOverlap: false,
      formatter: function () {
        const total = this.series.points
          .filter(p => p.node && p.node.level === 1)
          .reduce((sum, p) => sum + (p.value || 0), 0);

        const pct = total ? (this.point.value / total * 100).toFixed(1) : 0;
        return this.point.name + ' (' + pct + '%)';
      },
      style: { fontSize: '15px', fontWeight: '700', color: '#000000', textOutline: 'none' },
    },
    borderWidth: 2,
    borderColor: '#474646',
  },
  {
    level: 2,
    dataLabels: { 
      enabled: true, 
      crop: true,
      overflow: 'hidden',
      allowOverlap: false,
      formatter: function () {
        const parentNode = this.point.node.parent;
        const parentValue = parentNode && parentNode.childrenTotal;
        if (!parentValue) return this.point.name;
        const pct = (this.point.value / parentValue * 100).toFixed(1);
        return this.point.name + ' (' + pct + '%)';
      },
      style: { fontSize: '11px', fontWeight: '400', color: '#000000', textOutline: 'none' } 
    },
    borderWidth: 1,
    borderColor: '#474646',
  },
  {
    level: 3,
    // Changed enabled to true so nested elements retain legible textual parsing
    dataLabels: { 
      enabled: false,
      crop: true,
      overflow: 'hidden',
      style: { fontSize: '10px', fontWeight: '400', color: '#333333', textOutline: 'none' }
    },
    borderWidth: 0.5,
    borderColor: '#474646',
  },
],

            data: buildSeriesData(rows, years[0]),
          }],

          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: '#cbd5e1',
            borderRadius: 6,
            style: { color: '#1e293b', fontSize: '13px', fontFamily: "'Inter', sans-serif" },
            formatter: function () {
              if (!this.point.value) return false;
              return '<b>' + this.point.name + '</b><br/>' + fmtRM(this.point.value);
            },
          },
        });

        const slider  = document.getElementById('tm-year-slider');
        const display = document.getElementById('tm-year-display');

        slider.addEventListener('input', function () {
          const year = years[parseInt(this.value, 10)];
          display.textContent = year;
          chart.series[0].setData(buildSeriesData(rows, year), true, { duration: 400 });
        });
      })
      .catch(err => {
        const host = document.getElementById('tm-chart-container') || document.getElementById(containerId);
        if (host) host.innerHTML = '<p style="color:#6a4c93;padding:20px">Error loading chart: ' + err.message + '</p>';
        console.error('chart_treemap.js:', err);
      });
  }

  window.initTreemap = init;

})();