/* ═══════════════════════════════════════════════════════════════
   ARKIS — Main Script v2
   Minimal, clean, performant.
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ─── Mobile menu ─────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ─── Reveal on scroll ────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ─── Toast helper ────────────────────────────────────────── */
  function toast(msg, type) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 3500);
    setTimeout(() => t.remove(), 4000);
  }
  window.arkisToast = toast;

  /* ─── Contact form (basic client validation + submit) ─────── */
  const cf = document.getElementById('contact-form');
  if (cf) {
    cf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(cf).entries());
      if (!data.name || !data.email || !data.subject || !data.message) {
        toast('Merci de remplir les champs obligatoires.', 'error');
        return;
      }
      const submitBtn = cf.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          toast('Message envoyé. On revient vers vous sous 24h.', 'success');
          cf.reset();
        } else {
          toast('Une erreur est survenue. Réessayez ou écrivez à contact@arkis.agency', 'error');
        }
      } catch (err) {
        toast('Réseau indisponible. Réessayez.', 'error');
      } finally {
      }
    });
  }

  /* ─── Homepage animations ─────────────────────────────────── */
  const animUptime = document.getElementById('anim-uptime');
  if (animUptime) {
    let u = 99.90;
    setInterval(() => {
      u += (Math.random() > 0.5 ? 0.01 : -0.01);
      if (u > 99.99) u = 99.99;
      if (u < 99.95) u = 99.95;
      animUptime.textContent = u.toFixed(2);
    }, 3000);
  }

  const animAttacks = document.getElementById('anim-attacks');
  if (animAttacks) {
    let a = 12.8;
    setInterval(() => {
      a += (Math.random() * 0.1);
      animAttacks.textContent = a.toFixed(1);
    }, 4500);
  }

  /* Terminal typing effect */
  const terminalBody = document.querySelector('.hv-term-body');
  if (terminalBody) {
    const lines = terminalBody.querySelectorAll('.ln');
    if (lines.length > 0) {
      lines.forEach(l => l.style.display = 'none');
      let currentLine = 0;
      
      function showNextLine() {
        if (currentLine < lines.length) {
          lines[currentLine].style.display = 'block';
          currentLine++;
          
          let delay = 300 + Math.random() * 500;
          if (currentLine === 1) delay = 800;
          if (currentLine === 2) delay = 1200;
          
          setTimeout(showNextLine, delay);
        } else {
          // Restart animation after 10s
          setTimeout(() => {
            lines.forEach(l => l.style.display = 'none');
            currentLine = 0;
            showNextLine();
          }, 10000);
        }
      }
      setTimeout(showNextLine, 500);
    }
  }

  /* ════════════════════════════════════════════════════════════
     LIVE SOC DASHBOARD — Demo data simulation
     ════════════════════════════════════════════════════════════ */
  if (document.body.classList.contains('soc-page')) {
    initSocDashboard();
  }

  function initSocDashboard() {
    // Live clock
    const clockEl = document.getElementById('soc-clock');
    function updateClock() {
      if (!clockEl) return;
      const d = new Date();
      const t = d.toISOString().substr(11, 8) + ' UTC';
      clockEl.textContent = t;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // KPI live updates
    const epsEl = document.getElementById('kpi-eps');
    const blkEl = document.getElementById('kpi-blocked');
    let blocked = 12847;
    let eps = 847;
    setInterval(() => {
      if (epsEl) {
        eps += Math.round((Math.random() - 0.5) * 30);
        if (eps < 600) eps = 600;
        if (eps > 1100) eps = 1100;
        epsEl.textContent = eps.toLocaleString();
      }
      if (blkEl) {
        blocked += Math.floor(Math.random() * 8);
        blkEl.textContent = blocked.toLocaleString();
      }
    }, 2000);

    // Log feed simulation
    const feed = document.getElementById('log-feed');
    const logTemplates = [
      { sev: 'crit', src: 'WAF', msg: 'SQL injection blocked on /api/users from <span class="ip">185.220.101.42</span>' },
      { sev: 'crit', src: 'EDGE', msg: 'DDoS L7 mitigation triggered · 48k req/s · POP CDG' },
      { sev: 'warn', src: 'AUTH', msg: 'Brute-force on /admin/login from <span class="ip">91.234.18.55</span> · IP banned' },
      { sev: 'warn', src: 'WAF', msg: 'XSS payload sanitized in /search query' },
      { sev: 'info', src: 'CDN', msg: 'Cache invalidation · 1248 keys purged · path: /products/*' },
      { sev: 'info', src: 'TLS', msg: 'Handshake OK · TLS 1.3 · cipher: TLS_AES_256_GCM_SHA384' },
      { sev: 'ok', src: 'HEALTH', msg: 'Backend health check passed · 12/12 nodes' },
      { sev: 'info', src: 'AUDIT', msg: 'API key rotated by user admin@demo-client.fr' },
      { sev: 'warn', src: 'WAF', msg: 'Suspicious user-agent blocked · curl/bot' },
      { sev: 'ok', src: 'BACKUP', msg: 'Database snapshot completed · 4.2 GB · checksum verified' },
      { sev: 'crit', src: 'IDS', msg: 'Port scan detected from <span class="ip">45.142.214.219</span> · 247 ports / 12s' },
      { sev: 'info', src: 'DNS', msg: 'DNSSEC validation passed for demo-client.fr' },
      { sev: 'warn', src: 'WAF', msg: 'Path traversal attempt: <code>../../etc/passwd</code> · blocked' },
      { sev: 'ok', src: 'PATCH', msg: 'Security update applied · openssl 3.0.13 → 3.0.14 · 0 downtime' },
      { sev: 'info', src: 'RATE', msg: 'Rate-limit triggered on /api/login · 50 req/min exceeded' }
    ];

    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function timestamp() {
      const d = new Date();
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function addLogRow() {
      if (!feed) return;
      const tpl = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const row = document.createElement('div');
      row.className = 'log-row';
      row.dataset.sev = tpl.sev;
      row.innerHTML = `
        <span class="log-time">${timestamp()}</span>
        <span class="log-sev ${tpl.sev}">${tpl.sev}</span>
        <span class="log-src">${tpl.src}</span>
        <span class="log-msg">${tpl.msg}</span>
      `;
      // Apply current filter
      const activeFilter = document.querySelector('.panel-tool.active[data-filter]');
      if (activeFilter) {
        const f = activeFilter.dataset.filter;
        if (f !== 'all' && f !== tpl.sev) row.style.display = 'none';
      }
      feed.insertBefore(row, feed.firstChild);
      // Keep max 40 rows
      while (feed.children.length > 40) feed.removeChild(feed.lastChild);
    }

    // Seed initial logs
    for (let i = 0; i < 12; i++) addLogRow();
    // Live append
    setInterval(addLogRow, 1800 + Math.random() * 1200);

    // Log filter buttons
    document.querySelectorAll('.panel-tool[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.panel-tool[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        feed.querySelectorAll('.log-row').forEach(r => {
          r.style.display = (f === 'all' || r.dataset.sev === f) ? '' : 'none';
        });
      });
    });

    // Bar chart - 24 bars for 24h
    const chartBars = document.getElementById('chart-bars');
    if (chartBars) {
      for (let i = 0; i < 24; i++) {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        // simulate a wave pattern
        const base = 30 + Math.sin(i / 3) * 20;
        const h = base + Math.random() * 50;
        bar.style.height = h + '%';
        if (i % 4 === 0) bar.dataset.label = i + 'h';
        chartBars.appendChild(bar);
      }
    }

    // Attack arcs on map
    const arcsGroup = document.getElementById('attack-arcs');
    const targetX = 430, targetY = 190;
    const attackPoints = [
      { x: 180, y: 130 }, // EU
      { x: 780, y: 175 }, // Asia
      { x: 250, y: 310 }, // South America
      { x: 720, y: 360 }  // Australia
    ];

    function spawnArc() {
      if (!arcsGroup) return;
      const p = attackPoints[Math.floor(Math.random() * attackPoints.length)];
      const cx = (p.x + targetX) / 2;
      const cy = Math.min(p.y, targetY) - 80;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${p.x},${p.y} Q${cx},${cy} ${targetX},${targetY}`);
      path.setAttribute('class', 'attack-arc');
      path.setAttribute('stroke', 'url(#arcGrad)');
      path.style.strokeDasharray = '400';
      path.style.strokeDashoffset = '400';
      arcsGroup.appendChild(path);
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.6s ease-out, opacity 1.6s ease-out';
        path.style.strokeDashoffset = '0';
        path.style.opacity = '1';
        setTimeout(() => {
          path.style.opacity = '0';
          setTimeout(() => path.remove(), 400);
        }, 1400);
      });
    }
    setInterval(spawnArc, 1400);

    // Block buttons (just visual)
    document.querySelectorAll('.src-row .panel-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.src-row');
        if (!row) return;
        btn.textContent = 'BLOCKED';
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#fca5a5';
        btn.disabled = true;
        row.style.opacity = '0.5';
      });
    });
  }

})();
