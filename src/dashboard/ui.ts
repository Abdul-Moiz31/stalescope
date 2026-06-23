// Self-contained HTML dashboard — no React, no external assets, no
// build step. Ships as a single template literal so the package stays
// small and avoids any bundler complexity inside the consumer's app.
export function renderDashboard(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>stalescope — cache inspector</title>
<style>
  :root {
    --bg:       #09090B;
    --surface:  #111113;
    --border:   #27272A;
    --text:     #FAFAFA;
    --muted:    #A1A1AA;
    --hint:     #52525B;
    --hit:      #22C55E;
    --hit-bg:   rgba(34,197,94,0.10);
    --miss:     #EF4444;
    --miss-bg:  rgba(239,68,68,0.10);
    --reval:    #F59E0B;
    --reval-bg: rgba(245,158,11,0.10);
    --skip:     #60A5FA;
    --skip-bg:  rgba(96,165,250,0.10);
    --mono:     'JetBrains Mono', 'Fira Code', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { background: var(--bg); color: var(--text);
         font-family: system-ui, -apple-system, sans-serif;
         font-size: 14px; line-height: 1.5; }

  nav { height: 52px; border-bottom: 1px solid var(--border);
        display: flex; align-items: center; padding: 0 20px;
        gap: 12px; position: sticky; top: 0; background: var(--bg); z-index: 10 }
  .logo { font-weight: 600; font-size: 15px; }
  .dot  { color: var(--hit); }
  .stat-pill { font-size: 11px; background: var(--surface);
               border: 1px solid var(--border); border-radius: 4px;
               padding: 2px 8px; color: var(--muted); font-family: var(--mono) }
  .btn { font-size: 12px; padding: 4px 10px; border-radius: 4px; cursor: pointer;
         border: 1px solid var(--border); background: var(--surface);
         color: var(--muted); margin-left: auto }
  .btn:hover { color: var(--text) }

  .filters { padding: 12px 20px; display: flex; gap: 8px; flex-wrap: wrap;
             border-bottom: 1px solid var(--border) }
  .filter-btn { font-size: 11px; padding: 3px 10px; border-radius: 20px;
                border: 1px solid var(--border); background: transparent;
                color: var(--muted); cursor: pointer; font-family: var(--mono) }
  .filter-btn.active { background: var(--surface); color: var(--text); }

  #mem-chart { padding: 12px 20px; border-bottom: 1px solid var(--border) }
  #mem-chart canvas { width: 100%; height: 60px; display: block }
  .chart-label { font-size: 11px; color: var(--hint); margin-bottom: 6px;
                 font-family: var(--mono) }

  #event-list { padding: 8px 20px }
  .event { display: grid;
           grid-template-columns: 120px 70px 100px 60px 1fr;
           gap: 12px; align-items: center;
           padding: 8px 0; border-bottom: 1px solid var(--border);
           font-family: var(--mono); font-size: 12px }
  .event:hover { background: var(--surface); margin: 0 -20px; padding: 8px 20px }
  .ts    { color: var(--hint) }
  .badge { font-size: 10px; font-weight: 600; padding: 2px 6px;
           border-radius: 3px; text-align: center }
  .HIT      { background: var(--hit-bg);   color: var(--hit) }
  .MISS     { background: var(--miss-bg);  color: var(--miss) }
  .REVALIDATE { background: var(--reval-bg); color: var(--reval) }
  .SKIP     { background: var(--skip-bg);  color: var(--skip) }
  .layer { color: var(--muted); font-size: 11px }
  .dur   { color: var(--hint) }
  .url   { color: var(--text); overflow: hidden;
           text-overflow: ellipsis; white-space: nowrap }
  .empty { text-align: center; padding: 60px 20px; color: var(--hint) }
  .live-dot { width: 6px; height: 6px; border-radius: 50%;
              background: var(--hit); display: inline-block;
              margin-right: 6px; animation: pulse 1.5s infinite }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
</style>
</head>
<body>
<nav>
  <span class="logo">stalescope<span class="dot">●</span></span>
  <span class="stat-pill" id="total-pill">0 events</span>
  <span class="stat-pill" id="heap-pill">heap: --</span>
  <span style="font-size:11px;color:var(--hint)">
    <span class="live-dot"></span>live
  </span>
  <button class="btn" onclick="clearEvents()">Clear</button>
</nav>

<div class="filters">
  <button class="filter-btn active" onclick="setFilter('all',this)">All</button>
  <button class="filter-btn" onclick="setFilter('HIT',this)">HIT</button>
  <button class="filter-btn" onclick="setFilter('MISS',this)">MISS</button>
  <button class="filter-btn" onclick="setFilter('REVALIDATE',this)">REVALIDATE</button>
  <button class="filter-btn" onclick="setFilter('SKIP',this)">SKIP</button>
  <button class="filter-btn" onclick="setFilter('revalidate-path',this)">revalidatePath</button>
  <button class="filter-btn" onclick="setFilter('revalidate-tag',this)">revalidateTag</button>
</div>

<div id="mem-chart">
  <p class="chart-label">heap usage (MB) — last 60 events</p>
  <canvas id="canvas" height="60"></canvas>
</div>

<div id="event-list">
  <div class="event" style="color:var(--hint);font-size:11px;border-bottom:1px solid var(--border)">
    <span>TIME</span><span>STATUS</span><span>LAYER</span>
    <span>MS</span><span>URL / TAG</span>
  </div>
  <div id="rows"></div>
</div>

<script>
  let events = []
  let filter = 'all'
  const heapHistory = []

  fetch('/__stalescope/api/events')
    .then(r => r.json())
    .then(d => { events = d.events || []; render() })

  const es = new EventSource('/__stalescope/events')
  es.onmessage = e => {
    const newEvents = JSON.parse(e.data)
    events = [...events, ...newEvents].slice(-500)
    render()
  }

  function setFilter(f, btn) {
    filter = f
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    render()
  }

  function clearEvents() {
    fetch('/__stalescope/api/clear', { method: 'DELETE' })
      .then(() => { events = []; heapHistory.length = 0; render() })
  }

  function render() {
    document.getElementById('total-pill').textContent = events.length + ' events'

    const withHeap = events.filter(e => e.heapUsed).slice(-60)
    drawChart(withHeap)

    const latest = events.filter(e => e.heapUsed).at(-1)
    if (latest) {
      const mb = (latest.heapUsed / 1024 / 1024).toFixed(1)
      document.getElementById('heap-pill').textContent = 'heap: ' + mb + ' MB'
    }

    const filtered = events.filter(e => {
      if (filter === 'all') return true
      if (['HIT','MISS','REVALIDATE','SKIP'].includes(filter)) return e.status === filter
      return e.type === filter
    }).slice().reverse()

    const rows = document.getElementById('rows')
    if (filtered.length === 0) {
      rows.innerHTML = '<div class="empty">No events. Make some requests to your Next.js app.</div>'
      return
    }

    rows.innerHTML = filtered.map(e => {
      const ts = new Date(e.timestamp).toLocaleTimeString()
      const dur = e.duration != null ? e.duration + 'ms' : '--'
      return \`<div class="event">
        <span class="ts">\${ts}</span>
        <span class="badge \${e.status}">\${e.status}</span>
        <span class="layer">\${e.layer}</span>
        <span class="dur">\${dur}</span>
        <span class="url" title="\${e.url}">\${e.url}</span>
      </div>\`
    }).join('')
  }

  function drawChart(events) {
    const canvas = document.getElementById('canvas')
    const ctx    = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (events.length < 2) return

    const values = events.map(e => e.heapUsed / 1024 / 1024)
    const min    = Math.min(...values)
    const max    = Math.max(...values) || 1
    const w      = canvas.width
    const h      = canvas.height
    const pts    = values.map((v, i) => ({
      x: (i / (values.length - 1)) * w,
      y: h - ((v - min) / (max - min)) * (h - 4) - 2
    }))

    ctx.strokeStyle = '#22C55E'
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.stroke()
  }
</script>
</body>
</html>`
}
