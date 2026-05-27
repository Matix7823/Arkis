/* ═══════════════════════════════════════════════════════════════
   ARKIS SIEM — Live Data Simulation
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Live Clock
  const clockEl = document.getElementById('siem-clock');
  function updateClock() {
    if (!clockEl) return;
    const d = new Date();
    clockEl.textContent = d.toISOString().substr(11, 8) + ' UTC';
  }
  updateClock();
  setInterval(updateClock, 1000);

  // KPIs
  const epsEl = document.getElementById('siem-eps');
  const blkEl = document.getElementById('siem-blocked');
  let eps = 847;
  let blocked = 12847;

  setInterval(() => {
    if (epsEl) {
      eps += Math.round((Math.random() - 0.5) * 50);
      if (eps < 600) eps = 600;
      if (eps > 1500) eps = 1500;
      epsEl.textContent = eps.toLocaleString();
    }
    if (blkEl) {
      blocked += Math.floor(Math.random() * 5);
      blkEl.textContent = blocked.toLocaleString();
    }
  }, 2000);

  // Chart.js - Network Traffic
  const ctxTraffic = document.getElementById('trafficChart');
  let trafficChart;
  if (ctxTraffic) {
    const initialData = Array.from({length: 20}, () => Math.floor(Math.random() * 500) + 200);
    const labels = Array.from({length: 20}, (_, i) => '-' + (20 - i) + 's');

    trafficChart = new Chart(ctxTraffic, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Inbound Traffic (Mb/s)',
          data: initialData,
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' }, min: 0, max: 1000 }
        },
        plugins: { legend: { display: false } }
      }
    });

    setInterval(() => {
      const data = trafficChart.data.datasets[0].data;
      data.shift();
      data.push(Math.floor(Math.random() * 500) + 200);
      trafficChart.update();
    }, 1000);
  }

  // Chart.js - Threat Donut
  const ctxThreat = document.getElementById('threatChart');
  if (ctxThreat) {
    new Chart(ctxThreat, {
      type: 'doughnut',
      data: {
        labels: ['DDoS', 'SQL Injection', 'XSS', 'Brute-force'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#f85149', '#d29922', '#58a6ff', '#8957e5'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#c9d1d9', padding: 20 } }
        },
        cutout: '75%'
      }
    });
  }

  // Live Logs Simulation
  const logTbody = document.getElementById('log-tbody');
  const logTemplates = [
    { sev: 'crit', src: 'WAF', ip: '185.220.101.42', msg: 'SQL injection attempt blocked on /api/users' },
    { sev: 'crit', src: 'EDGE', ip: '-', msg: 'DDoS L7 mitigation triggered. Peak: 48k req/s' },
    { sev: 'warn', src: 'AUTH', ip: '91.234.18.55', msg: 'Multiple failed login attempts. IP rate-limited' },
    { sev: 'info', src: 'TLS', ip: '-', msg: 'Certificate auto-renewal completed successfully' },
    { sev: 'ok', src: 'SYS', ip: '-', msg: 'Backend health check passed (12/12 nodes healthy)' },
    { sev: 'warn', src: 'WAF', ip: '45.142.214.219', msg: 'Suspicious User-Agent detected (curl/bot)' },
    { sev: 'info', src: 'DB', ip: '-', msg: 'Database backup snapshot created. Size: 4.2GB' },
    { sev: 'crit', src: 'IDS', ip: '194.180.49.114', msg: 'Port scan detected (247 ports probed in 12s)' }
  ];

  function addLog() {
    if (!logTbody) return;
    const tpl = logTemplates[Math.floor(Math.random() * logTemplates.length)];
    const d = new Date();
    const ts = d.toISOString().substr(11, 8);
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ts}</td>
      <td><span class="sev-badge sev-${tpl.sev}">${tpl.sev.toUpperCase()}</span></td>
      <td>${tpl.src}</td>
      <td style="color:#58a6ff">${tpl.ip}</td>
      <td>${tpl.msg}</td>
    `;
    
    logTbody.insertBefore(tr, logTbody.firstChild);
    if (logTbody.children.length > 15) {
      logTbody.removeChild(logTbody.lastChild);
    }
  }

  // Init
  for (let i=0; i<10; i++) addLog();
  setInterval(addLog, 1500 + Math.random() * 2000);
});
