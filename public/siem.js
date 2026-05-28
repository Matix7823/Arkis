/* ═══════════════════════════════════════════════════════════════
   ARKIS SIEM — Demo interactive v3 (donnees fictives)
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  if (window.Chart) {
    Chart.defaults.color = '#7a8798';
    Chart.defaults.borderColor = '#1e2a3a';
    Chart.defaults.font.family = "'Fira Sans', system-ui, sans-serif";
  }

  const PAL = {
    accent: '#06b6d4', purple: '#8b5cf6',
    crit: '#f85149', warn: '#e3a008', info: '#3b82f6', ok: '#22c55e',
    grid: '#1e2a3a', bg: '#111827', surface: '#161e2d'
  };

  /* ── Clock ──────────────────────────────────────────────────── */
  const clockEl = document.getElementById('siem-clock');
  function tick() {
    if (!clockEl) return;
    const d = new Date();
    const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    clockEl.textContent = utc.toTimeString().slice(0, 8) + ' UTC';
  }
  tick(); setInterval(tick, 1000);

  /* ── KPI live ───────────────────────────────────────────────── */
  let eps = 1024, blocked = 48391, score = 38, scanMin = 7;
  const epsEl = document.getElementById('siem-eps');
  const blkEl = document.getElementById('siem-blocked');
  const scoreEl = document.getElementById('siem-score');
  const scoreBar = document.getElementById('siem-score-bar');
  const lastScan = document.getElementById('lastScan');

  function updateKpis() {
    eps = Math.max(500, Math.min(1800, eps + Math.round((Math.random() - 0.48) * 80)));
    blocked += Math.floor(Math.random() * 9 + 2);
    score = Math.max(28, Math.min(72, score + Math.round((Math.random() - 0.5) * 5)));
    if (epsEl) epsEl.textContent = eps.toLocaleString('fr-FR');
    if (blkEl) blkEl.textContent = blocked.toLocaleString('fr-FR');
    if (scoreEl) scoreEl.textContent = score;
    if (scoreBar) scoreBar.style.width = score + '%';
  }
  setInterval(updateKpis, 1800);
  setInterval(() => { scanMin++; if (lastScan) lastScan.textContent = `il y a ${scanMin} min`; }, 60000);

  /* ── Sparkline helper ───────────────────────────────────────── */
  function sparkline(id, color, base, amp) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) return;
    const data = Array.from({ length: 30 }, () => base + Math.random() * amp);
    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{ data, borderColor: color, borderWidth: 1.5, fill: true, backgroundColor: color + '18', tension: 0.4, pointRadius: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, min: 0 } }
      }
    });
    setInterval(() => {
      chart.data.datasets[0].data.shift();
      chart.data.datasets[0].data.push(base + Math.random() * amp);
      chart.update('none');
    }, 2000);
  }
  sparkline('sparkEps', PAL.accent, 500, 1200);
  sparkline('sparkBlocked', PAL.ok, 50, 150);

  /* ── Traffic chart ──────────────────────────────────────────── */
  const ctxT = document.getElementById('trafficChart');
  if (ctxT && window.Chart) {
    const N = 50;
    const labels = Array.from({ length: N }, (_, i) => i % 10 === 0 ? `-${N - i}s` : '');
    const mk = (base, amp) => Array.from({ length: N }, () => base + Math.random() * amp);
    const inb = mk(420, 260), out = mk(240, 180), blk = mk(18, 70);
    const trafficChart = new Chart(ctxT, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Inbound', data: inb, borderColor: PAL.accent, backgroundColor: 'rgba(6,182,212,0.12)', borderWidth: 1.8, fill: true, tension: 0.35, pointRadius: 0 },
          { label: 'Outbound', data: out, borderColor: PAL.purple, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1.8, fill: true, tension: 0.35, pointRadius: 0 },
          { label: 'Bloqué WAF', data: blk, borderColor: PAL.crit, backgroundColor: 'rgba(248,81,73,0.08)', borderWidth: 1.5, fill: true, tension: 0.35, pointRadius: 0 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#080c12', borderColor: PAL.grid, borderWidth: 1, padding: 10, callbacks: { label: c => ` ${c.dataset.label}: ${Math.round(c.parsed.y)} Mb/s` } }
        },
        scales: {
          x: { grid: { color: PAL.grid }, ticks: { color: '#4a5568', maxRotation: 0 } },
          y: { grid: { color: PAL.grid }, ticks: { color: '#4a5568', callback: v => v + ' Mb/s' }, min: 0, max: 900 }
        }
      }
    });
    setInterval(() => {
      trafficChart.data.datasets.forEach((ds, i) => {
        ds.data.shift();
        if (i === 0) ds.data.push(420 + Math.random() * 260);
        else if (i === 1) ds.data.push(240 + Math.random() * 180);
        else ds.data.push(18 + Math.random() * 70);
      });
      trafficChart.data.labels.shift();
      trafficChart.data.labels.push('');
      trafficChart.update('none');
    }, 1200);
  }

  /* ── Threat donut ───────────────────────────────────────────── */
  const ctxTh = document.getElementById('threatChart');
  if (ctxTh && window.Chart) {
    new Chart(ctxTh, {
      type: 'doughnut',
      data: {
        labels: ['DDoS L7', 'SQL Injection', 'XSS / RCE', 'Brute-force', 'Scan / Recon', 'Malware C2'],
        datasets: [{
          data: [34, 24, 16, 12, 9, 5],
          backgroundColor: [PAL.crit, PAL.warn, PAL.purple, PAL.info, PAL.accent, '#ec4899'],
          borderWidth: 0, spacing: 2, hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#d0d9e6', padding: 9, font: { size: 11 }, boxWidth: 9, boxHeight: 9 } },
          tooltip: { backgroundColor: '#080c12', borderColor: PAL.grid, borderWidth: 1, callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } }
        }
      }
    });
  }

  /* ── Severity 24h stacked bar ───────────────────────────────── */
  const ctxS = document.getElementById('severityChart');
  if (ctxS && window.Chart) {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`);
    new Chart(ctxS, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [
          { label: 'Critique', data: hours.map(() => Math.floor(Math.random() * 5)), backgroundColor: PAL.crit, stack: 's' },
          { label: 'Élevé', data: hours.map(() => Math.floor(Math.random() * 16) + 2), backgroundColor: PAL.warn, stack: 's' },
          { label: 'Info', data: hours.map(() => Math.floor(Math.random() * 35) + 8), backgroundColor: PAL.info, stack: 's' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#d0d9e6', boxWidth: 9, boxHeight: 9, font: { size: 11 } } },
          tooltip: { backgroundColor: '#080c12', borderColor: PAL.grid, borderWidth: 1 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#4a5568', maxRotation: 0, autoSkipPadding: 8 }, stacked: true },
          y: { grid: { color: PAL.grid }, ticks: { color: '#4a5568' }, stacked: true, beginAtZero: true }
        }
      }
    });
  }

  /* ── MITRE ATT&CK heatmap ───────────────────────────────────── */
  const MITRE = [
    { id:'TA0043', name:'Reconnaissance', sub:['T1595','T1596','T1597','T1598','T1589','T1590','T1591','T1592'] },
    { id:'TA0042', name:'Resource Dev.', sub:['T1583','T1584','T1585','T1586','T1587','T1588','T1608','T1650'] },
    { id:'TA0001', name:'Initial Access', sub:['T1189','T1190','T1133','T1200','T1566','T1091','T1195','T1199'] },
    { id:'TA0002', name:'Execution', sub:['T1059','T1203','T1559','T1106','T1053','T1129','T1072','T1204'] },
    { id:'TA0003', name:'Persistence', sub:['T1098','T1136','T1543','T1546','T1547','T1574','T1078','T1176'] },
    { id:'TA0004', name:'Priv. Escalation', sub:['T1548','T1134','T1484','T1611','T1068','T1055','T1053','T1078'] },
    { id:'TA0005', name:'Def. Evasion', sub:['T1548','T1134','T1197','T1622','T1140','T1480','T1211','T1562'] },
    { id:'TA0006', name:'Cred. Access', sub:['T1110','T1555','T1212','T1187','T1606','T1552','T1558','T1539'] },
    { id:'TA0007', name:'Discovery', sub:['T1087','T1010','T1217','T1526','T1482','T1083','T1615','T1069'] },
    { id:'TA0008', name:'Lateral Mvmt', sub:['T1210','T1534','T1570','T1563','T1021','T1091','T1550','T1080'] },
    { id:'TA0009', name:'Collection', sub:['T1560','T1123','T1119','T1115','T1530','T1213','T1005','T1025'] },
    { id:'TA0011', name:'C2', sub:['T1071','T1092','T1132','T1001','T1568','T1008','T1095','T1571'] },
    { id:'TA0010', name:'Exfiltration', sub:['T1020','T1030','T1048','T1041','T1011','T1052','T1567','T1029'] },
    { id:'TA0040', name:'Impact', sub:['T1531','T1485','T1486','T1565','T1491','T1498','T1657','T1529'] }
  ];
  const forcedLevels = {
    '0-0': 3, '2-0': 3, '7-0': 3, '12-0': 3, '5-1': 2, '9-1': 2,
    '3-2': 2, '6-3': 3, '11-2': 2, '13-0': 1, '7-2': 3, '0-3': 2,
    '4-1': 1, '8-0': 2, '10-3': 1
  };
  const grid = document.getElementById('mitreGrid');
  if (grid) {
    MITRE.forEach((tactic, col) => {
      const colEl = document.createElement('div');
      colEl.className = 'mitre-col';
      const headDiv = document.createElement('div');
      headDiv.className = 'mitre-head';
      headDiv.title = `${tactic.id} \u00b7 ${tactic.name}`;
      headDiv.textContent = tactic.name;
      colEl.appendChild(headDiv);
      tactic.sub.forEach((tech, row) => {
        const key = `${col}-${row}`;
        let level = forcedLevels[key] ?? 0;
        if (level === 0) {
          const r = Math.random();
          if (r > 0.93) level = 3;
          else if (r > 0.78) level = 2;
          else if (r > 0.56) level = 1;
        }
        const cell = document.createElement('div');
        cell.className = 'mitre-cell';
        cell.dataset.level = level;
        cell.title = `${tech} · ${tactic.name}`;
        if (level >= 2) cell.textContent = '●';
        cell.addEventListener('click', () => showMitreTooltip(tactic, tech, level));
        colEl.appendChild(cell);
      });
      grid.appendChild(colEl);
    });
  }
  function showMitreTooltip(tactic, tech, level) {
    const labels = ['Aucun', 'Bas', 'Moyen', 'Élevé'];
    const colors = ['', 'var(--siem-accent)', 'var(--siem-warn)', 'var(--siem-crit)'];
    pushToast('info', `MITRE ${tech}`, `${tactic.name} — niveau <span style="color:${colors[level]}">${labels[level]}</span>`);
  }

  /* ── Live event stream ──────────────────────────────────────── */
  const tbody = document.getElementById('log-tbody');
  const LOG_TEMPLATES = [
    { sev: 'crit', src: 'WAF',  ip: '185.220.101.42', msg: 'SQL Injection bloquée · <code>/api/users?id=1%27 OR 1=1--</code>' },
    { sev: 'crit', src: 'IDS',  ip: '194.180.49.114', msg: 'Port scan massif détecté — 512 ports sondés en 8s (NMAP)' },
    { sev: 'crit', src: 'EDGE', ip: '—',              msg: 'DDoS L7 mitigation déclenchée · pic 62 441 req/s' },
    { sev: 'crit', src: 'EDR',  ip: '10.0.4.18',      msg: 'Exécution PowerShell offusquée bloquée · <code>workstation-12</code>' },
    { sev: 'crit', src: 'DNS',  ip: '91.234.18.55',   msg: 'Requête DNS vers domaine C2 connu · arkis-blocked.threat-intel' },
    { sev: 'crit', src: 'IAM',  ip: '45.33.32.156',   msg: 'Connexion root depuis IP Tor — accès refusé · <code>db-prod-01</code>' },
    { sev: 'warn', src: 'AUTH', ip: '91.234.18.55',   msg: 'Brute-force SSH — 24 échecs en 60s · IP blacklistée' },
    { sev: 'warn', src: 'WAF',  ip: '45.142.214.219', msg: 'User-Agent malveillant détecté · <code>sqlmap/1.7.8</code>' },
    { sev: 'warn', src: 'IAM',  ip: '88.120.4.219',   msg: 'Connexion depuis géoloc. inhabituelle (BR) · <code>admin@demo-client.fr</code>' },
    { sev: 'warn', src: 'DLP',  ip: '10.0.2.45',      msg: 'Exfiltration suspecte — 847 MB vers domaine non whitelisté' },
    { sev: 'warn', src: 'EDR',  ip: '10.0.4.22',      msg: 'Tâche planifiée créée par <code>schtasks.exe</code> (proc. non autorisé)' },
    { sev: 'warn', src: 'NET',  ip: '—',              msg: 'Anomalie BGP — route hijacking suspecté · AS 29838' },
    { sev: 'warn', src: 'VULN', ip: '—',              msg: 'Tentative d\'exploitation CVE-2025-31864 sur <code>edge-proxy-01</code>' },
    { sev: 'info', src: 'TLS',  ip: '—',              msg: 'Renouvellement cert. <code>www.demo-client.fr</code> · 90j restants' },
    { sev: 'info', src: 'DB',   ip: '—',              msg: 'Snapshot quotidien créé — <code>db-prod-01</code> · 6.4 GB · chiffré AES-256' },
    { sev: 'info', src: 'SYS',  ip: '—',              msg: 'Health check OK — 12/12 nœuds sains · latence P99 : 8ms' },
    { sev: 'info', src: 'CDN',  ip: '—',              msg: 'Cache invalidé · <code>/api/products/*</code> — 124k objets purgés' },
    { sev: 'info', src: 'PATCH',ip: '—',              msg: 'Patch CVE-2025-19874 déployé sur <code>api-backend</code> · v1.4.3' },
    { sev: 'info', src: 'AUTH', ip: '10.0.1.5',       msg: 'Connexion admin réussie · MFA validé · <code>s.aubry@arkis.fr</code>' },
    { sev: 'info', src: 'FW',   ip: '—',              msg: 'Règle pare-feu mise à jour — 3 nouvelles rules BLOCK' }
  ];

  function fmt() {
    const d = new Date();
    const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return utc.toTimeString().slice(0, 8);
  }

  let curFilter = 'all';
  function addLog(tpl) {
    if (!tbody) return;
    const t = tpl || LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const tr = document.createElement('tr');
    tr.className = 'row-new';
    tr.dataset.sev = t.sev;
    tr.style.display = (curFilter === 'all' || curFilter === t.sev) ? '' : 'none';

    const tdTime = document.createElement('td');
    tdTime.style.cssText = 'font-family:var(--font-mono);font-size:0.73rem;white-space:nowrap';
    tdTime.textContent = fmt();

    const tdSev = document.createElement('td');
    const sevSpan = document.createElement('span');
    sevSpan.className = `sev-badge sev-${t.sev}`;
    sevSpan.textContent = t.sev === 'crit' ? 'CRITIQUE' : t.sev === 'warn' ? 'ÉLEVÉ' : 'INFO';
    tdSev.appendChild(sevSpan);

    const tdSrc = document.createElement('td');
    tdSrc.style.cssText = 'font-family:var(--font-mono);font-size:0.73rem;color:var(--siem-text-mut)';
    tdSrc.textContent = t.src;

    const tdIp = document.createElement('td');
    tdIp.className = 'log-ip';
    tdIp.textContent = t.ip;

    const tdMsg = document.createElement('td');
    tdMsg.style.cssText = 'color:var(--siem-text)';
    tdMsg.textContent = t.msg;

    tr.appendChild(tdTime);
    tr.appendChild(tdSev);
    tr.appendChild(tdSrc);
    tr.appendChild(tdIp);
    tr.appendChild(tdMsg);

    tbody.insertBefore(tr, tbody.firstChild);
    if (tbody.children.length > 60) tbody.removeChild(tbody.lastChild);
  }
  for (let i = 0; i < 18; i++) addLog();
  setInterval(() => addLog(), 900 + Math.random() * 2200);

  /* Stream filters */
  document.querySelectorAll('.stream-filters .filter-pill').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.stream-filters .filter-pill').forEach(x => x.classList.remove('filter-active'));
      b.classList.add('filter-active');
      curFilter = b.dataset.sev;
      if (tbody) [...tbody.children].forEach(tr => {
        tr.style.display = (curFilter === 'all' || tr.dataset.sev === curFilter) ? '' : 'none';
      });
    });
  });

  /* ── Toasts ─────────────────────────────────────────────────── */
  const toastBox = document.getElementById('toast-container');
  const TOASTS = [
    { type: 'crit', icon: '🚨', title: 'Nouvel incident critique', msg: 'INC-2026-0314 ouvert · Exfiltration DNS suspecte détectée' },
    { type: 'crit', icon: '⚠️', title: 'Détection MITRE T1110', msg: 'Brute-force credential access · bastion-01 · 42 tentatives/min' },
    { type: 'warn', icon: '📈', title: 'Pic de trafic inbound', msg: '+340% sur edge-fw-eu1 · Autoscaling déclenché' },
    { type: 'warn', icon: '🔒', title: 'Comportement utilisateur suspect', msg: 'UBA Score 89/100 · admin@demo-client.fr · 03h14 UTC' },
    { type: 'info', icon: '✅', title: 'Patch déployé avec succès', msg: 'CVE-2025-19874 corrigé sur api-backend · 0 interruption' },
    { type: 'info', icon: '🛡️', title: 'Règles WAF mises à jour', msg: '17 nouvelles signatures ajoutées · Arkis Threat Feed v4.2' }
  ];

  function pushToast(type, title, msg, icon) {
    if (!toastBox) return;
    const t = { type, title, msg, icon: icon || (type === 'crit' ? '🚨' : type === 'warn' ? '⚠️' : '✅') };
    const d = document.createElement('div');
    d.className = `toast toast-${t.type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = t.icon;

    const wrapper = document.createElement('div');
    wrapper.style.flex = '1';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'toast-title';
    titleDiv.textContent = t.title;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'toast-msg';
    msgDiv.textContent = t.msg;
    wrapper.appendChild(titleDiv);
    wrapper.appendChild(msgDiv);

    d.appendChild(iconSpan);
    d.appendChild(wrapper);

    toastBox.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity 0.4s'; }, 4800);
    setTimeout(() => d.remove(), 5300);
  }

  function showRandomToast() {
    const t = TOASTS[Math.floor(Math.random() * TOASTS.length)];
    pushToast(t.type, t.title, t.msg, t.icon);
  }
  setTimeout(showRandomToast, 3500);
  setInterval(showRandomToast, 11000 + Math.random() * 9000);

  /* ── Time-range buttons ─────────────────────────────────────── */
  document.querySelectorAll('.time-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  /* ── UEBA realtime score update ─────────────────────────────── */
  const uebaScores = document.querySelectorAll('.ueba-score');
  setInterval(() => {
    uebaScores.forEach(el => {
      const cur = parseInt(el.textContent);
      const nxt = Math.max(50, Math.min(99, cur + Math.round((Math.random() - 0.45) * 4)));
      el.textContent = nxt;
    });
  }, 3500);

  /* ── Query console ──────────────────────────────────────────── */
  const queryInput = document.getElementById('query-input');
  const queryRun = document.getElementById('query-run');
  const queryResults = document.getElementById('query-results');
  const queryStatus = document.getElementById('query-status');

  const QUERY_PRESETS = {
    'index=firewall severity=CRITICAL last=24h': [
      { heure: '14:22:38', source: 'WAF', ip_src: '185.220.101.42', action: 'BLOCK', règle: 'SQL-001', hits: '2 412' },
      { heure: '14:21:14', source: 'IDS', ip_src: '194.180.49.114', action: 'BLOCK', règle: 'SCAN-03', hits: '1 968' },
      { heure: '14:19:52', source: 'EDGE', ip_src: '45.142.214.219', action: 'DROP', règle: 'DDOS-L7', hits: '62 441' },
      { heure: '14:17:01', source: 'EDR', ip_src: '10.0.4.18', action: 'KILL', règle: 'PSHELL-OFF', hits: '1' },
    ],
    'index=auth action=FAIL user=admin': [
      { heure: '14:22:01', user: 'admin@demo-client.fr', ip_src: '91.234.18.55', résultat: 'FAIL', pays: 'NL', tentatives: '24' },
      { heure: '14:18:33', user: 'admin@demo-client.fr', ip_src: '45.33.32.156', résultat: 'FAIL', pays: 'TOR', tentatives: '87' },
      { heure: '14:11:09', user: 'root', ip_src: '194.180.49.1', résultat: 'FAIL', pays: 'CN', tentatives: '312' },
    ],
    'index=vuln cvss>=9': [
      { cve: 'CVE-2025-31864', cvss: '9.8', composant: 'OpenSSL 3.0.13', asset: 'edge-proxy-01', exploit: 'KEV CISA', statut: 'Patch en test' },
      { cve: 'CVE-2025-22149', cvss: '9.1', composant: 'NGINX 1.24', asset: 'www-cluster', exploit: 'PoC public', statut: 'Planifié' },
    ]
  };

  function runQuery(q) {
    if (!queryResults) return;
    const raw = q.trim().toLowerCase();
    let data = null;
    for (const [key, val] of Object.entries(QUERY_PRESETS)) {
      if (raw.includes(key.split(' ')[0].split('=')[1] || '') || raw === key.toLowerCase()) {
        data = val; break;
      }
    }
    if (!data) {
      const keys = Object.keys(QUERY_PRESETS);
      data = QUERY_PRESETS[keys[Math.floor(Math.random() * keys.length)]];
    }
    const cols = Object.keys(data[0]);
    const rows = data.slice(0, 6);

    // Construction securisee du tableau (DOM API, pas innerHTML)
    queryResults.textContent = '';
    const table = document.createElement('table');
    table.className = 'query-result-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    cols.forEach(c => { const th = document.createElement('th'); th.textContent = c; headRow.appendChild(th); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbodyEl = document.createElement('tbody');
    rows.forEach(r => {
      const row = document.createElement('tr');
      cols.forEach(c => { const td = document.createElement('td'); td.style.color = 'var(--siem-text)'; td.textContent = r[c] != null ? String(r[c]) : '—'; row.appendChild(td); });
      tbodyEl.appendChild(row);
    });
    table.appendChild(tbodyEl);
    queryResults.appendChild(table);

    if (queryStatus) {
      const ms = Math.round(42 + Math.random() * 180);
      queryStatus.textContent = '';
      const okSpan = document.createElement('span');
      okSpan.style.color = 'var(--siem-ok)';
      okSpan.textContent = `✓ ${rows.length} résultats`;
      const infoSpan = document.createElement('span');
      infoSpan.textContent = `${ms} ms · Arkis Search Engine v3`;
      queryStatus.appendChild(okSpan);
      queryStatus.appendChild(infoSpan);
    }
  }

  if (queryRun && queryInput) {
    queryRun.addEventListener('click', () => runQuery(queryInput.value || 'index=firewall severity=CRITICAL last=24h'));
    queryInput.addEventListener('keydown', e => { if (e.key === 'Enter') runQuery(queryInput.value); });
  }

  /* ── Query history ──────────────────────────────────────────── */
  const queryHistoryEl = document.getElementById('query-history');
  function pushQueryHistory(q) {
    if (!queryHistoryEl) return;
    if (queryHistoryEl.children.length === 1 && queryHistoryEl.firstElementChild && queryHistoryEl.firstElementChild.tagName !== 'DIV'.toUpperCase()) return;
    const first = queryHistoryEl.firstElementChild;
    if (first && first.textContent.includes('L\'historique')) queryHistoryEl.textContent = '';
    const item = document.createElement('div');
    item.style.cssText = 'padding:7px 10px;background:var(--siem-surface-2);border:1px solid var(--siem-border);border-radius:4px;cursor:pointer;font-size:0.72rem;font-family:var(--font-mono);color:var(--siem-accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:border-color 0.15s';
    item.textContent = q;
    item.onmouseenter = () => { item.style.borderColor = 'var(--siem-accent)'; };
    item.onmouseleave = () => { item.style.borderColor = 'var(--siem-border)'; };
    item.onclick = () => loadQuery(q);
    queryHistoryEl.insertBefore(item, queryHistoryEl.firstChild);
    if (queryHistoryEl.children.length > 10) queryHistoryEl.removeChild(queryHistoryEl.lastChild);
  }

  /* ── Load query from template ───────────────────────────────── */
  function loadQuery(q) {
    if (queryInput) queryInput.value = q;
    runQuery(q);
    pushQueryHistory(q);
  }
  window.loadQuery = loadQuery;

  /* Run initial query after short delay */
  setTimeout(() => {
    if (queryInput) queryInput.value = 'index=firewall severity=CRITICAL last=24h';
    runQuery('index=firewall severity=CRITICAL last=24h');
    pushQueryHistory('index=firewall severity=CRITICAL last=24h');
  }, 800);

  /* ── Compliance progress bars ───────────────────────────────── */
  const compBars = document.querySelectorAll('.comp-bar-fill');
  compBars.forEach(bar => {
    const pct = parseInt(bar.dataset.pct || '80');
    bar.style.width = pct + '%';
    bar.style.background = pct >= 90
      ? 'var(--siem-ok)'
      : pct >= 75 ? 'var(--siem-warn)' : 'var(--siem-crit)';
  });

  /* ── View switching ─────────────────────────────────────────── */
  function switchView(viewId) {
    document.querySelectorAll('.siem-nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`[data-view="${viewId}"]`);
    if (navBtn) navBtn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`view-${viewId}`);
    if (view) view.classList.add('active');
  }
  window.switchView = switchView;

  document.querySelectorAll('.siem-nav-item').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  /* ── UEBA chart ─────────────────────────────────────────────── */
  const ctxUeba = document.getElementById('uebaChart');
  if (ctxUeba && window.Chart) {
    new Chart(ctxUeba, {
      type: 'radar',
      data: {
        labels: ['Géoloc', 'Horaire', 'Volume', 'Accès', 'Device', 'Velocity'],
        datasets: [
          { label: 'admin@demo', data: [89,82,71,90,85,78], backgroundColor: 'rgba(248,81,73,0.15)', borderColor: PAL.crit, borderWidth: 2, pointBackgroundColor: PAL.crit, pointRadius: 4 },
          { label: 'j.martin', data: [22,30,95,68,18,72], backgroundColor: 'rgba(227,160,8,0.1)', borderColor: PAL.warn, borderWidth: 1.5, pointBackgroundColor: PAL.warn, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { angleLines: { color: PAL.grid }, grid: { color: PAL.grid }, pointLabels: { color: '#d0d9e6', font: { size: 11 } }, ticks: { display: false }, min: 0, max: 100 } },
        plugins: { legend: { position: 'bottom', labels: { color: '#d0d9e6', font: { size: 11 }, boxWidth: 9, boxHeight: 9 } }, tooltip: { backgroundColor: '#080c12', borderColor: PAL.grid, borderWidth: 1 } }
      }
    });
  }

  /* ── Events view stream ─────────────────────────────────────── */
  const eventsTbody = document.getElementById('events-tbody');
  const eventsCountEl = document.getElementById('events-count');
  const eventsPauseBtn = document.getElementById('events-pause-btn');
  const eventsSearchInput = document.getElementById('events-search');
  const evSevFilter = document.getElementById('ev-sev-filter');
  const evSrcFilter = document.getElementById('ev-src-filter');

  let eventsPaused = false;
  let eventsTotal = 0;
  const ASSETS = ['api-backend','db-prod-01','edge-fw-eu1','bastion-01','www-cluster','iam-portal','workstation-12','workstation-22'];

  function addEventRow(tpl) {
    if (!eventsTbody || eventsPaused) return;
    const t = tpl || LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const searchTerm = eventsSearchInput ? eventsSearchInput.value.toLowerCase() : '';
    const sevF = evSevFilter ? evSevFilter.value : 'all';
    const srcF = evSrcFilter ? evSrcFilter.value : 'all';
    const msgText = t.msg.replace(/<[^>]+>/g, '').toLowerCase();
    const matchSev = sevF === 'all' || sevF === t.sev;
    const matchSrc = srcF === 'all' || srcF === t.src;
    const matchSearch = !searchTerm || msgText.includes(searchTerm) || t.ip.includes(searchTerm) || t.src.toLowerCase().includes(searchTerm);
    eventsTotal++;
    if (eventsCountEl) eventsCountEl.textContent = eventsTotal.toLocaleString('fr-FR');
    const tr = document.createElement('tr');
    tr.className = 'row-new';
    tr.dataset.sev = t.sev;
    tr.style.display = (matchSev && matchSrc && matchSearch) ? '' : 'none';
    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const evId = 'EVT-' + String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const action = t.sev === 'crit' ? 'BLOCK' : t.sev === 'warn' ? 'ALERT' : 'LOG';

    const tdTime2 = document.createElement('td');
    tdTime2.style.cssText = 'font-family:var(--font-mono);font-size:0.73rem;white-space:nowrap';
    tdTime2.textContent = fmt();

    const tdSev2 = document.createElement('td');
    const sevSpan2 = document.createElement('span');
    sevSpan2.className = `sev-badge sev-${t.sev}`;
    sevSpan2.textContent = t.sev === 'crit' ? 'CRITIQUE' : t.sev === 'warn' ? 'ÉLEVÉ' : 'INFO';
    tdSev2.appendChild(sevSpan2);

    const tdSrc2 = document.createElement('td');
    tdSrc2.style.cssText = 'font-family:var(--font-mono);font-size:0.73rem;color:var(--siem-text-mut)';
    tdSrc2.textContent = t.src;

    const tdAsset = document.createElement('td');
    tdAsset.style.cssText = 'font-family:var(--font-mono);font-size:0.71rem;color:var(--siem-text-dim)';
    tdAsset.textContent = asset;

    const tdIp2 = document.createElement('td');
    tdIp2.className = 'log-ip';
    tdIp2.textContent = t.ip;

    const tdEvId = document.createElement('td');
    tdEvId.style.cssText = 'font-family:var(--font-mono);font-size:0.7rem;color:var(--siem-text-dim)';
    tdEvId.textContent = evId;

    const tdMsg2 = document.createElement('td');
    tdMsg2.style.cssText = 'color:var(--siem-text)';
    tdMsg2.textContent = t.msg;

    const tdAction = document.createElement('td');
    const actionSpan = document.createElement('span');
    actionSpan.className = `sev-badge ${action === 'BLOCK' ? 'sev-crit' : action === 'ALERT' ? 'sev-warn' : 'sev-info'}`;
    actionSpan.style.fontSize = '0.6rem';
    actionSpan.textContent = action;
    tdAction.appendChild(actionSpan);

    tr.appendChild(tdTime2);
    tr.appendChild(tdSev2);
    tr.appendChild(tdSrc2);
    tr.appendChild(tdAsset);
    tr.appendChild(tdIp2);
    tr.appendChild(tdEvId);
    tr.appendChild(tdMsg2);
    tr.appendChild(tdAction);

    eventsTbody.insertBefore(tr, eventsTbody.firstChild);
    if (eventsTbody.children.length > 100) eventsTbody.removeChild(eventsTbody.lastChild);
  }

  for (let i = 0; i < 25; i++) addEventRow();
  setInterval(() => addEventRow(), 1000 + Math.random() * 2500);

  if (eventsPauseBtn) {
    eventsPauseBtn.addEventListener('click', () => {
      eventsPaused = !eventsPaused;
      eventsPauseBtn.textContent = eventsPaused ? '▶ Reprendre' : '⏸ Pause';
    });
  }

  function refilterEvents() {
    if (!eventsTbody) return;
    const searchTerm = eventsSearchInput ? eventsSearchInput.value.toLowerCase() : '';
    const sevF = evSevFilter ? evSevFilter.value : 'all';
    const srcF = evSrcFilter ? evSrcFilter.value : 'all';
    [...eventsTbody.children].forEach(tr => {
      const cells = tr.cells;
      if (!cells || cells.length < 7) return;
      const srcText = cells[2].textContent.toLowerCase();
      const ipText = cells[4].textContent.toLowerCase();
      const msgText = cells[6].textContent.toLowerCase();
      const matchSev = sevF === 'all' || tr.dataset.sev === sevF;
      const matchSrc = srcF === 'all' || srcText.includes(srcF.toLowerCase());
      const matchSearch = !searchTerm || msgText.includes(searchTerm) || ipText.includes(searchTerm) || srcText.includes(searchTerm);
      tr.style.display = (matchSev && matchSrc && matchSearch) ? '' : 'none';
    });
  }

  if (eventsSearchInput) eventsSearchInput.addEventListener('input', refilterEvents);
  if (evSevFilter) evSevFilter.addEventListener('change', refilterEvents);
  if (evSrcFilter) evSrcFilter.addEventListener('change', refilterEvents);

  /* ── Animate KPI score bar on load ─────────────────────────── */
  setTimeout(() => {
    if (scoreBar) { scoreBar.style.width = '0%'; setTimeout(() => { scoreBar.style.transition = 'width 1.2s ease'; scoreBar.style.width = score + '%'; }, 100); }
  }, 400);

});
