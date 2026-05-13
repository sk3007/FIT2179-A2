/* ============================================================
   chart_treemap.js
   Malaysia GDP by Economic Activity — Highcharts Treemap
   Requires:
     - https://code.highcharts.com/highcharts.js  (already in page)
     - https://code.highcharts.com/modules/treemap.js
     - https://code.highcharts.com/modules/heatmap.js  (for colour scale)
   ============================================================ */

(function () {

  const CSV_PATH = 'data/malaysia_gdp_treemap.csv';

  /* ---------- colour palette per top-level sector ---------- */
  const SECTOR_COLOURS = {
    'Agriculture':          '#2d6a4f',
    'Mining and quarrying': '#3d2605',
    'Manufacturing':        '#457b9d',
    'Construction':         '#e07a5f',
    'Services':             '#3d405b',
    'plus Import duties':   '#81b29a',
  };

  /* ---------- parse CSV text into an array of objects ---------- */
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      // simple split — values contain no commas (all numeric / short strings)
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ? cols[i].trim() : ''; });
      obj.value = parseInt(obj.value, 10);
      obj.level = parseInt(obj.level, 10);
      return obj;
    });
  }

  /* ---------- build Highcharts data array for one year ---------- */
  function buildSeriesData(rows, year) {
    const yearRows = rows.filter(r => r.year === year);

    // Highcharts treemap needs: id, name, parent, value, color
    // id must be unique — we use the code field
    // parent must reference another id (or '' for root)
    // Only include level-1 and level-2 nodes (level-3 makes it too dense);
    // swap in level-3 leaves when level-2 has children, keeping level-2 as
    // a group node (no value of its own — Highcharts sums children).

    const data = [];

    // root node (invisible, just anchors the tree)
    data.push({ id: 'root', name: 'GDP', parent: '', color: '#1a1a2e' });

    yearRows.forEach(r => {
      const color = SECTOR_COLOURS[r.parent] || SECTOR_COLOURS[r.name] || '#555';

      if (r.level === 1) {
        data.push({
          id: r.code,
          name: r.name,
          parent: 'root',
          value: r.value,
          color: SECTOR_COLOURS[r.name] || '#555',
        });
      } else if (r.level === 2) {
        data.push({
          id: r.code,
          name: r.name,
          parent: r.code.split('.')[0],   // e.g. "1.1" → parent id "1"
          value: r.value,
          color: Highcharts.color(SECTOR_COLOURS[r.parent] || '#555')
                           .brighten(0.15).get(),
        });
      } else if (r.level === 3) {
        // parent id is the L2 code, e.g. "1.3.1" → "1.3"
        const parentCode = r.code.split('.').slice(0, -1).join('.');
        data.push({
          id: r.code,
          name: r.name,
          parent: parentCode,
          value: r.value,
          color: Highcharts.color(SECTOR_COLOURS[r.parent] || '#555')
                           .brighten(0.3).get(),
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
            <h2 class="tm-title">Malaysia GDP by Economic Activity</h2>
            <p class="tm-subtitle">Constant 2010 Prices &nbsp;·&nbsp; RM Million</p>
          </div>
          <div class="tm-controls">
            <label class="tm-year-label" for="tm-year-slider">Year: <span id="tm-year-display">2010</span></label>
            <input id="tm-year-slider" class="tm-slider" type="range" min="0" max="7" step="1" value="0">
          </div>
        </div>
        <div id="tm-chart-container"></div>
      </div>`;

    /* --- scoped styles injected once --- */
    if (!document.getElementById('tm-styles')) {
      const style = document.createElement('style');
      style.id = 'tm-styles';
      style.textContent = `
        .tm-wrapper {
          font-family: 'Georgia', serif;
          padding: 24px 28px 16px;
        }
        .tm-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 18px;
        }
        .tm-title {
          margin: 0 0 4px;
          font-size: 1.25rem;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.01em;
        }
        .tm-subtitle {
          margin: 0;
          font-size: 0.78rem;
          color: #a09a88;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .tm-controls {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .tm-year-label {
          font-size: 0.85rem;
          color: #c8c0a8;
          font-family: 'Georgia', serif;
        }
        #tm-year-display {
          font-weight: 700;
          color: #000000;
          font-size: 1rem;
        }
        .tm-slider {
          -webkit-appearance: none;
          width: 200px;
          height: 4px;
          border-radius: 2px;
          background: #2a2a3e;
          outline: none;
          cursor: pointer;
        }
        .tm-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          box-shadow: 0 0 6px rgba(245,200,66,0.5);
        }
        .tm-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #000000;
          cursor: pointer;
          border: none;
        }
        #tm-chart-container {
          border-radius: 8px;
          overflow: hidden;
          height: 700px;
        }
        .tm-note {
          margin: 10px 0 0;
          font-size: 0.72rem;
          color: #5a5468;
          text-align: center;
          letter-spacing: 0.04em;
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

        /* --- render chart --- */
        const chart = Highcharts.chart('tm-chart-container', {
          chart: {
            style: { fontFamily: "'Georgia', serif" },
            animation: { duration: 400 },
          },
          title: { text: null },
          credits: { enabled: false },
          exporting: { enabled: false },

          series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            animationLimit: 1000,
            dataLabels: {
              enabled: false,

              // style: {
              //   fontSize: '18px',
              //   fontWeight: '50',
              //   fontFamily: "'Georgia', serif",
              //   textOutline: '1px #12121f',
              //   color: '#fff',
              // },
            },
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
                    // percentage relative to root GDP
                    const total = this.series.points.find(p => p.id === 'root').value;
                    const pct = (this.point.value / total * 100).toFixed(1);
                    return this.point.name + ' (' + pct + '%)';
                  },
                  style: { fontSize: '16px', fontWeight: '1000', color: '#000000',  },
                },
                borderWidth: 3,
                borderColor: '#0f0f1a',
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
                    if (!parentValue) return this.point.name; // fallback if undefined

                    const pct = (this.point.value / parentValue * 100).toFixed(1);
                    return this.point.name + ' (' + pct + '%)';
                  },
                  style: { fontSize: '10px', fontweight: '50', color: '#ffffff' } },
                borderWidth: 2,
                borderColor: '#0f0f1a',
              },
              {
                level: 3,
                dataLabels: { enabled: false,
                  formatter: function () {
                    const parentNode = this.point.node.parent;
                    const parentValue = parentNode && parentNode.childrenTotal;
                    if (!parentValue) return this.point.name; // fallback if undefined

                    const pct = (this.point.value / parentValue * 100).toFixed(1);
                    return this.point.name + ' (' + pct + '%)';
                  },
                 },
                borderWidth: 1,
                borderColor: '#0f0f1a',
              },
            ],
            data: buildSeriesData(rows, years[0]),
          }],

          tooltip: {
            backgroundColor: '#1e1e30',
            borderColor: '#3a3a50',
            borderRadius: 8,
            style: { color: '#f0ece0', fontSize: '13px' },
            formatter: function () {
              if (!this.point.value) return false;
              return '<b>' + this.point.name + '</b><br/>' +
                     fmtRM(this.point.value);
            },
          },
        });

        /* --- slider interaction --- */
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
        if (host) host.innerHTML = '<p style="color:#e07a5f;padding:20px">Error loading chart: ' + err.message + '</p>';
        console.error('chart_treemap.js:', err);
      });
  }

  /* ---------- expose globally ---------- */
  window.initTreemap = init;

})();