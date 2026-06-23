// Self-contained HTML dashboard — no React, no build step, no external
// assets. Ships as a single string so the package has zero runtime UI
// dependencies and works in any Next.js route handler.
export function renderDashboardHtml(mountPath: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>stalescope</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: #0b0d10;
    color: #d6dde3;
    font-size: 13px;
  }
  header {
    padding: 12px 16px;
    border-bottom: 1px solid #1c2128;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  header h1 { font-size: 14px; margin: 0; color: #7ee787; }
  header .stat { color: #8b949e; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid #161b22;
    white-space: nowrap;
  }
  th { color: #8b949e; font-weight: 500; position: sticky; top: 0; background: #0b0d10; }
  tr:hover { background: #11161c; }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
  }
  .HIT { background: #143; color: #7ee787; }
  .MISS { background: #432; color: #f2cc60; }
  .SKIP { background: #311; color: #ff7b72; }
  .REVALIDATE { background: #223; color: #79c0ff; }
  .url { max-width: 480px; overflow: hidden; text-overflow: ellipsis; }
  #empty { padding: 24px; color: #8b949e; }
</style>
</head>
<body>
<header>
  <h1>stalescope</h1>
  <span class="stat">events: <span id="count">0</span></span>
  <span class="stat">heap: <span id="heap">—</span></span>
</header>
<div id="empty">Waiting for cache events…</div>
<table id="events" style="display:none">
  <thead>
    <tr>
      <th>time</th>
      <th>type</th>
      <th>status</th>
      <th>layer</th>
      <th>url</th>
      <th>duration</th>
      <th>size</th>
      <th>heap</th>
    </tr>
  </thead>
  <tbody></tbody>
</table>
<script>
  const mountPath = ${JSON.stringify(mountPath)};
  const tbody = document.querySelector('#events tbody');
  const table = document.getElementById('events');
  const empty = document.getElementById('empty');
  const countEl = document.getElementById('count');
  const heapEl = document.getElementById('heap');
  let count = 0;

  function fmtBytes(n) {
    if (n === undefined || n === null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function addRow(e) {
    empty.style.display = 'none';
    table.style.display = '';
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + new Date(e.timestamp).toLocaleTimeString() + '</td>' +
      '<td>' + e.type + '</td>' +
      '<td><span class="badge ' + e.status + '">' + e.status + '</span></td>' +
      '<td>' + e.layer + '</td>' +
      '<td class="url" title="' + e.url + '">' + e.url + '</td>' +
      '<td>' + (e.duration !== undefined ? e.duration + 'ms' : '—') + '</td>' +
      '<td>' + fmtBytes(e.size) + '</td>' +
      '<td>' + fmtBytes(e.heapUsed) + '</td>';
    tbody.prepend(tr);
    count += 1;
    countEl.textContent = String(count);
    if (e.heapUsed) heapEl.textContent = fmtBytes(e.heapUsed);
    while (tbody.children.length > 500) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  fetch(mountPath + '/api/events')
    .then((r) => r.json())
    .then((events) => events.forEach(addRow));

  const sse = new EventSource(mountPath + '/api/live');
  sse.onmessage = (msg) => {
    try {
      addRow(JSON.parse(msg.data));
    } catch {}
  };
</script>
</body>
</html>`
}
