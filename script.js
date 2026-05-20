/**
 * ARKIS AGENCY — Main JavaScript
 * Handles: Navigation, Scroll Animations, Counters, Particle Canvas, Portfolio Filters, Form
 */

'use strict';

// ═══════════════════════════════════════════════
// 1. NAVBAR — Scroll-triggered glass effect
// ═══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
let lastScroll = 0;

function handleNavbar() {
  if (!navbar) return;
  const scrollY = window.scrollY;
  if (scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = scrollY;
}

if (navbar) {
  window.addEventListener('scroll', handleNavbar, { passive: true });
  handleNavbar();
}

// ─── Mobile Menu ──────────────────────────────
const hamburger = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

// ═══════════════════════════════════════════════
// 2. INTERSECTION OBSERVER — Reveal animations
// ═══════════════════════════════════════════════
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

// ═══════════════════════════════════════════════
// 3. ANIMATED COUNTERS
// ═══════════════════════════════════════════════
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  if (isNaN(target)) return;
  const duration = 1800;
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ═══════════════════════════════════════════════
// 4. PARTICLE CANVAS — Animated dots network
// ═══════════════════════════════════════════════
(function initParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  `;
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W, H, particles, animId;
  const COUNT = window.innerWidth < 768 ? 40 : 80;
  const MAX_DIST = 140;
  const SPEED = 0.3;

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * SPEED;
      this.vy = (Math.random() - 0.5) * SPEED;
      this.r = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.15;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 255, ${this.alpha})`;
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function init() {
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(loop);
  }

  // Pause when not visible (performance)
  const heroObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!animId) animId = requestAnimationFrame(loop);
      } else {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    });
  });
  heroObserver.observe(hero);

  window.addEventListener('resize', () => {
    clearTimeout(window._resizeTimeout);
    window._resizeTimeout = setTimeout(() => {
      resize();
      init();
    }, 200);
  }, { passive: true });

  resize();
  init();
  animId = requestAnimationFrame(loop);
})();

// ═══════════════════════════════════════════════
// 5. SMOOTH ACTIVE NAV LINK (scroll spy)
// ═══════════════════════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

if (sections.length > 0 && navLinks.length > 0) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
              const isActive = href === `#${id}`;
              link.style.color = isActive ? 'var(--clr-cyan)' : '';
            }
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(s => spyObserver.observe(s));
}

// ═══════════════════════════════════════════════
// 6. PORTFOLIO FILTER
// ═══════════════════════════════════════════════
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioCards = document.querySelectorAll('.portfolio-card');

if (filterBtns.length > 0 && portfolioCards.length > 0) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update button state
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;

      portfolioCards.forEach(card => {
        const cat = card.dataset.category;
        const show = filter === 'all' || cat === filter;

        if (show) {
          card.style.opacity = '1';
          card.style.transform = '';
          card.style.pointerEvents = '';
          card.hidden = false;
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.pointerEvents = 'none';
          // Delay hiding to allow transition
          setTimeout(() => {
            if (card.style.opacity === '0') card.hidden = true;
          }, 320);
        }
      });
    });
  });

  // Apply transitions to portfolio cards
  portfolioCards.forEach(card => {
    card.style.transition = 'opacity 320ms ease, transform 320ms ease';
  });
}

// ═══════════════════════════════════════════════
// 7. CONTACT FORM — Resend via /api/contact
//    Dev  : http://localhost:3000/api/contact  (server.js)
//    Prod : /api/contact  (Cloudflare Worker)
// ═══════════════════════════════════════════════
const API_ENDPOINT  = '/api/contact';
const contactForm   = document.getElementById('contact-form');
const submitBtn     = document.getElementById('contact-submit-btn');
const globalErrorEl = document.querySelector('.fs-global-error');

if (contactForm) {
  // ── Real-time browser validation UX
  contactForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  function validateField(field) {
    const isValid = field.checkValidity();
    field.classList.toggle('error', !isValid);
    let nativeErr = field.parentElement.querySelector('.native-field-error');
    if (!isValid) {
      if (!nativeErr) {
        nativeErr = document.createElement('span');
        nativeErr.className = 'native-field-error fs-field-error';
        nativeErr.setAttribute('aria-live', 'polite');
        field.parentElement.appendChild(nativeErr);
      }
      if (field.validity.valueMissing)  nativeErr.textContent = 'Ce champ est requis.';
      else if (field.validity.typeMismatch) nativeErr.textContent = 'Format invalide (ex: vous@exemple.com).';
      else nativeErr.textContent = 'Valeur incorrecte.';
    } else if (nativeErr) {
      nativeErr.remove();
      field.classList.remove('error');
    }
  }

  function showGlobalError(msg) {
    if (!globalErrorEl) return;
    globalErrorEl.textContent = msg;
    globalErrorEl.classList.add('visible');
    globalErrorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearGlobalError() {
    if (!globalErrorEl) return;
    globalErrorEl.textContent = '';
    globalErrorEl.classList.remove('visible');
  }

  // Clear global/field errors on manual edit
  contactForm.querySelectorAll('[data-fs-error]').forEach(errSpan => {
    const fieldName = errSpan.getAttribute('data-fs-error');
    if (!fieldName) return;
    const field = contactForm.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.addEventListener('input', () => {
        errSpan.textContent = '';
        errSpan.classList.remove('visible');
        field.classList.remove('error');
        clearGlobalError();
      });
    }
  });

  function showFieldError(fieldName, msg) {
    const errEl = contactForm.querySelector(`[data-fs-error="${fieldName}"]`);
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.classList.add('visible');
    const field = contactForm.querySelector(`[name="${fieldName}"]`);
    if (field) field.classList.add('error');
  }

  function clearAllFieldErrors() {
    contactForm.querySelectorAll('[data-fs-error]').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    contactForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    contactForm.querySelectorAll('.native-field-error').forEach(el => el.remove());
  }

  // ── Main submit handler → POST /api/contact
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearGlobalError();
    clearAllFieldErrors();

    // Honeypot
    const honey = contactForm.querySelector('[name="_honey"]');
    if (honey && honey.value.trim() !== '') return;

    // Privacy checkbox
    const privacy = document.getElementById('contact-privacy');
    if (privacy && !privacy.checked) {
      const wrap = privacy.closest('.form-privacy');
      if (wrap) { wrap.classList.add('shake'); setTimeout(() => wrap.classList.remove('shake'), 600); }
      showGlobalError("Veuillez accepter la politique de confidentialité avant d'envoyer.");
      return;
    }

    // HTML5 validation
    let isValid = true;
    contactForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
      if (!field.checkValidity()) { validateField(field); isValid = false; }
    });
    if (!isValid) {
      showGlobalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Loading state
    if (!submitBtn) return;
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnIcon    = submitBtn.querySelector('.btn-icon');
    const origText   = btnText ? btnText.textContent : 'Envoyer';
    
    if (btnText) btnText.textContent = 'Envoi en cours…';
    if (btnIcon) btnIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.75';

    try {
      // Collect form data as JSON
      const formData = new FormData(contactForm);
      formData.delete('privacy'); // Ne pas envoyer la checkbox côté serveur
      const payload = Object.fromEntries(formData.entries());

      const response = await fetch(API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        // ── Succès ──
        contactForm.style.transition = 'opacity 400ms ease';
        contactForm.style.opacity    = '0';
        setTimeout(() => {
          contactForm.style.display = 'none';
          const successEl = document.getElementById('form-success');
          if (successEl) {
            successEl.removeAttribute('hidden');
            successEl.style.display = 'flex';
            successEl.focus();
          }
        }, 420);
      } else {
        // ── Erreurs Resend / validation serveur ──
        if (Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            if (err.field && err.field !== 'form') {
              showFieldError(err.field, err.message);
            } else {
              showGlobalError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
            }
          });
          if (!data.errors.some(e => e.field === 'form' || !e.field)) {
            showGlobalError('Certains champs contiennent des erreurs. Veuillez les corriger.');
          }
        } else {
          showGlobalError('Une erreur est survenue. Veuillez réessayer ou nous écrire directement.');
        }
        // Restaure le bouton
        if (btnText) btnText.textContent = origText;
        if (btnIcon) btnIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }

    } catch (networkErr) {
      console.error('[Arkis] Erreur réseau :', networkErr);
      showGlobalError('Erreur réseau — vérifiez votre connexion et réessayez.');
      if (btnText) btnText.textContent = origText;
      if (btnIcon) btnIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });
}

// ═══════════════════════════════════════════════
// 8. BACK TO TOP BUTTON
// ═══════════════════════════════════════════════
const backToTop = document.getElementById('back-to-top');

if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.hidden = window.scrollY < 400;
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ═══════════════════════════════════════════════
// 9. PARALLAX — Subtle hero parallax on scroll
// ═══════════════════════════════════════════════
const heroCanvas = document.querySelector('.hero-canvas');
const heroGrid = document.querySelector('.hero-grid-overlay');

if ((heroCanvas || heroGrid) && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (heroCanvas) heroCanvas.style.transform = `translateY(${y * 0.15}px)`;
        if (heroGrid) heroGrid.style.transform = `translateY(${y * 0.08}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ═══════════════════════════════════════════════
// 10. SERVICE CARDS — Mouse tracking glow effect
// ═══════════════════════════════════════════════
document.querySelectorAll('.service-card, .pricing-card, .portfolio-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  });
});

// ═══════════════════════════════════════════════
// 11. SMOOTH ANCHOR SCROLL with offset & hash intercept
// ═══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ═══════════════════════════════════════════════
// 12. TYPING EFFECT — Hero headline
// ═══════════════════════════════════════════════
(function initTypingEffect() {
  const badge = document.querySelector('.badge-text');
  if (!badge) return;
  const original = badge.textContent;
  badge.textContent = '';

  let i = 0;
  function type() {
    if (i < original.length) {
      badge.textContent += original[i++];
      setTimeout(type, 25);
    }
  }
  setTimeout(type, 800);
})();

// ═══════════════════════════════════════════════
// 13. PRICING PHASE TOGGLER (BUILD & RUN)
// ═══════════════════════════════════════════════
(function initPricingToggler() {
  const buildTab = document.getElementById('phase-build-tab');
  const runTab = document.getElementById('phase-run-tab');
  const pricingBuild = document.getElementById('pricing-build');
  const runSection = document.querySelector('.run-section');

  if (!buildTab || !runTab || !pricingBuild || !runSection) return;

  function setPhase(phase) {
    if (phase === 'run') {
      runTab.classList.add('active');
      buildTab.classList.remove('active');
      pricingBuild.style.display = 'none';
      runSection.style.display = 'block';
      runSection.style.marginTop = '0px';
    } else {
      buildTab.classList.add('active');
      runTab.classList.remove('active');
      pricingBuild.style.display = 'grid';
      runSection.style.display = 'none';
    }
  }

  buildTab.addEventListener('click', () => setPhase('build'));
  runTab.addEventListener('click', () => setPhase('run'));

  // Initial state: hide run section by default
  runSection.style.display = 'none';

  // Check URL Hash on Load
  const hash = window.location.hash;
  if (hash === '#run' || hash.startsWith('#run-')) {
    setPhase('run');
    setTimeout(() => {
      const offsetTop = runSection.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }, 400);
  }
})();

// ═══════════════════════════════════════════════
// 14. LIVE SECURITY OBSERVABILITY (SOC ENGINE)
// ═══════════════════════════════════════════════
(function initLiveSocEngine() {
  const logContainer = document.getElementById('log-container');
  const consoleBody = document.getElementById('cyber-console');
  if (!logContainer || !consoleBody) return;

  const sites = [
    { name: 'DHM-Tech', url: 'dhmtech.com', el: document.getElementById('dhm-visits'), visits: 12840, attacks: 1284 },
    { name: 'Bricosam.fr', url: 'bricosam.fr', el: document.getElementById('bricosam-visits'), visits: 8429, attacks: 439 },
    { name: 'L\'Écrin Sucré', url: 'ecrinsucre.fr', el: document.getElementById('bakery-visits'), visits: 2840, attacks: 112 }
  ];

  // Global State
  let state = {
    activeFilter: 'ALL',
    cpuLoad: 42,
    defcon: 4,
    threatLevel: 0.02,
    latency: 82,
    attacksRate: 42,
    attacks24h: 28491,
    traffic24h: 148932,
    isDdosActive: false,
    isSqliActive: false,
    isBotActive: false,
    chartData: [85, 92, 78, 110, 95, 120, 105, 112, 98, 115, 130, 108, 118, 96, 110]
  };

  const loggedItems = [];

  // DOM Elements cache
  const attacksEl = document.getElementById('val-attacks');
  const trafficEl = document.getElementById('val-traffic');
  const latencyEl = document.getElementById('val-latency');
  const cpuEl = document.getElementById('val-cpu');
  const cpuBar = document.getElementById('bar-cpu');
  const wafModeEl = document.getElementById('waf-mode');
  const threatLevelEl = document.getElementById('threat-level-val');
  const statusDot = document.getElementById('soc-status-dot');
  const statusText = document.getElementById('soc-status-text');
  const defconShield = document.getElementById('defcon-shield');

  const btnDdos = document.getElementById('btn-sim-ddos');
  const btnSqli = document.getElementById('btn-sim-sqli');
  const btnBot = document.getElementById('btn-sim-bot');

  const logTemplates = [
    { type: 'INFO', msg: 'TLS 1.3 cryptographic handshake verified successfully.' },
    { type: 'INFO', msg: 'Integrity check pass: Edge static assets matched source SHA-256 hash.' },
    { type: 'INFO', msg: 'PostgreSQL read query executed in 1.4ms via Supabase REST Client.' },
    { type: 'INFO', msg: 'Static Page Delivery from Edge Cache Paris (POP CDG).' },
    { type: 'INFO', msg: 'Zero-Trust access token validated on administration gateway.' },
    { type: 'INFO', msg: 'Row-Level Security policy triggered: secure access isolation confirmed.' },
    { type: 'BLOCKED', msg: 'SQL Injection signature detected on search parameter ➔ Dropped by Cloudflare WAF.' },
    { type: 'BLOCKED', msg: 'Cross-Site Scripting (XSS) payload blocked on endpoint /contact.' },
    { type: 'BLOCKED', msg: 'Excessive connections from unique IP ➔ Rate-limiting threshold engaged (429).' },
    { type: 'BLOCKED', msg: 'Malicious user-agent blocked from scanning web server endpoints.' },
    { type: 'BLOCKED', msg: 'Brute-force security mitigation triggered on transaction gateway.' }
  ];

  function randomIP() {
    return `${Math.floor(Math.random() * 150) + 50}.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 254) + 1}`;
  }

  function getFormattedTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }

  // Prepopulate SOC with logs
  for (let i = 0; i < 15; i++) {
    createAndStoreLog();
  }
  renderLogs();

  function createAndStoreLog(forcedType = null, forcedMsg = null) {
    const site = sites[Math.floor(Math.random() * sites.length)];
    const template = forcedType 
      ? { type: forcedType, msg: forcedMsg }
      : logTemplates[Math.floor(Math.random() * logTemplates.length)];
    const time = getFormattedTime();

    let html = "";
    if (template.type === 'BLOCKED') {
      html = `<span style="color:#EF4444;font-weight:600;">[BLOCKED]</span> [${time}] — <strong style="color:#E8EDF8;">${site.name}</strong> — ${template.msg} <span style="color:var(--clr-text-3); font-size:0.75rem;">(Source: IP ${randomIP()})</span>`;
      state.attacks24h++;
      if (attacksEl) attacksEl.textContent = state.attacks24h.toLocaleString();
    } else {
      html = `<span style="color:#10B981;font-weight:600;">[INFO]</span> [${time}] — <strong style="color:#E8EDF8;">${site.name}</strong> — ${template.msg}`;
    }

    loggedItems.push({ type: template.type, html: html });
    if (loggedItems.length > 200) loggedItems.shift();
  }

  function renderLogs() {
    logContainer.innerHTML = "";
    loggedItems.forEach(item => {
      if (state.activeFilter === 'ALL' || item.type === state.activeFilter) {
        const p = document.createElement('p');
        p.style.marginBottom = '0.35rem';
        p.style.animation = 'fadeIn 0.2s ease-out';
        p.innerHTML = item.html;
        logContainer.appendChild(p);
      }
    });
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  // Draw Line and Area SVG dynamic chart
  function drawChart() {
    const linePath = document.getElementById('chart-line-path');
    const areaPath = document.getElementById('chart-area-path');
    if (!linePath || !areaPath) return;

    const pointsCount = state.chartData.length;
    const stepX = 600 / (pointsCount - 1);
    
    let dLine = "";
    let dArea = "";
    
    state.chartData.forEach((val, i) => {
      const x = i * stepX;
      // Map val (0 to 1000) to Y coordinate (165 = baseline, 15 = maximum peak)
      const maxVal = state.isDdosActive ? 1000 : 250;
      const y = 165 - (val / maxVal) * 140;
      
      if (i === 0) {
        dLine += `M ${x} ${y}`;
        dArea += `M ${x} 165 L ${x} ${y}`;
      } else {
        dLine += ` L ${x} ${y}`;
        dArea += ` L ${x} ${y}`;
      }
    });
    
    dArea += ` L 600 165 Z`;
    
    linePath.setAttribute('d', dLine);
    areaPath.setAttribute('d', dArea);

    // Apply color gradient updates depending on threat activity
    const lineGrad = document.getElementById('chartGrad');
    if (state.isDdosActive) {
      linePath.setAttribute('stroke', '#EF4444');
      if (lineGrad) {
        lineGrad.querySelectorAll('stop').forEach((stop, idx) => {
          stop.setAttribute('stop-color', '#EF4444');
        });
      }
    } else {
      linePath.setAttribute('stroke', 'var(--clr-cyan)');
      if (lineGrad) {
        lineGrad.querySelectorAll('stop').forEach((stop, idx) => {
          stop.setAttribute('stop-color', '#00D4FF');
        });
      }
    }
  }

  // Threat Typology distribution circle updates
  function updateThreatDistribution(ddos = 45, sqli = 25, bot = 20, brute = 10) {
    const ddosCircle = document.getElementById('circle-ddos');
    const sqliCircle = document.getElementById('circle-sqli');
    const botCircle = document.getElementById('circle-bot');
    const bruteCircle = document.getElementById('circle-brute');
    
    if (ddosCircle) ddosCircle.setAttribute('stroke-dasharray', `${ddos} 100`);
    if (sqliCircle) {
      sqliCircle.setAttribute('stroke-dasharray', `${sqli} 100`);
      sqliCircle.setAttribute('stroke-dashoffset', `-${ddos}`);
    }
    if (botCircle) {
      botCircle.setAttribute('stroke-dasharray', `${bot} 100`);
      botCircle.setAttribute('stroke-dashoffset', `-${ddos + sqli}`);
    }
    if (bruteCircle) {
      bruteCircle.setAttribute('stroke-dasharray', `${brute} 100`);
      bruteCircle.setAttribute('stroke-dashoffset', `-${ddos + sqli + bot}`);
    }
    
    const lblDdos = document.getElementById('lbl-ddos-pct');
    const lblSqli = document.getElementById('lbl-sqli-pct');
    const lblBot = document.getElementById('lbl-bot-pct');
    
    if (lblDdos) lblDdos.textContent = `${ddos}%`;
    if (lblSqli) lblSqli.textContent = `${sqli}%`;
    if (lblBot) lblBot.textContent = `${bot}%`;
  }

  // Update hardware resource UI
  function updateSystemResources() {
    if (!cpuEl || !cpuBar) return;
    let targetCpu = 35 + Math.floor(Math.random() * 12);
    if (state.isDdosActive) {
      targetCpu = 92 + Math.floor(Math.random() * 6);
    }
    state.cpuLoad = targetCpu;
    cpuEl.textContent = `${state.cpuLoad}%`;
    cpuBar.style.width = `${state.cpuLoad}%`;
    
    if (state.cpuLoad > 85) {
      cpuEl.style.color = '#EF4444';
      cpuBar.style.backgroundColor = '#EF4444';
    } else if (state.cpuLoad > 60) {
      cpuEl.style.color = '#FBBF24';
      cpuBar.style.backgroundColor = '#FBBF24';
    } else {
      cpuEl.style.color = 'var(--clr-green)';
      cpuBar.style.backgroundColor = 'var(--clr-green)';
    }
  }

  // Hook event filters
  const filterTabs = document.querySelectorAll('#console-filter-tabs .filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeFilter = tab.dataset.filter;
      renderLogs();
    });
  });

  // Simulator Buttons Event Listeners
  if (btnDdos) {
    btnDdos.addEventListener('click', () => {
      if (state.isDdosActive) return;
      state.isDdosActive = true;
      state.defcon = 1;
      
      // Disable buttons
      btnDdos.disabled = true;
      btnDdos.style.opacity = '0.5';

      // Visual updates to critical mode
      if (statusDot) {
        statusDot.style.backgroundColor = '#EF4444';
        statusDot.style.animation = 'pulseGlow 0.4s infinite';
      }
      if (statusText) {
        statusText.textContent = 'CRITICAL SYSLOG TARGETED — DDoS FLOOD ATTACK ENGAGED — DEFCON 1';
        statusText.style.color = '#EF4444';
      }
      if (threatLevelEl) {
        threatLevelEl.textContent = 'CRITICAL RED (99.98%)';
        threatLevelEl.style.color = '#EF4444';
      }
      if (wafModeEl) {
        wafModeEl.textContent = 'ENTERPRISE FLOW SHIELD MITIGATION';
        wafModeEl.style.color = '#EF4444';
      }

      updateThreatDistribution(82, 8, 7, 3);

      // Injects rapid stream of alerts
      let alertCount = 0;
      const ddosInterval = setInterval(() => {
        const pps = 450 + Math.floor(Math.random() * 200);
        createAndStoreLog('BLOCKED', `MITIGATED DDoS Flow: Layer 7 Flood HTTP flood attack vector dropped ➔ Packets: ${pps} pps, Protocol: HTTP/2`);
        renderLogs();
        
        // Push huge values to graph
        state.chartData.shift();
        state.chartData.push(800 + Math.floor(Math.random() * 190));
        drawChart();

        alertCount++;
        if (alertCount >= 30) {
          clearInterval(ddosInterval);
          finishDdosMitigation();
        }
      }, 250);

      function finishDdosMitigation() {
        state.isDdosActive = false;
        state.defcon = 4;
        
        // Restore controls
        btnDdos.disabled = false;
        btnDdos.style.opacity = '1';

        if (statusDot) {
          statusDot.style.backgroundColor = 'var(--clr-green)';
          statusDot.style.animation = 'pulseGlow 1.5s infinite';
        }
        if (statusText) {
          statusText.textContent = 'SYSTEM OPERATIONAL — DEFCON 4';
          statusText.style.color = 'var(--clr-green)';
        }
        if (threatLevelEl) {
          threatLevelEl.textContent = 'NORMAL (0.02%)';
          threatLevelEl.style.color = 'var(--clr-cyan)';
        }
        if (wafModeEl) {
          wafModeEl.textContent = 'HIGH DÉFENSE';
          wafModeEl.style.color = 'var(--clr-cyan)';
        }

        updateThreatDistribution(45, 25, 20, 10);
        
        // Final syslog
        createAndStoreLog('INFO', `[MITIGATION RESULT] Cloudflare WAF successfully blocked 1.48M packets globally. Main Supabase DB load is normal.`);
        renderLogs();
      }
    });
  }

  if (btnSqli) {
    btnSqli.addEventListener('click', () => {
      if (state.isDdosActive) return;
      btnSqli.disabled = true;
      btnSqli.style.opacity = '0.5';

      if (threatLevelEl) {
        threatLevelEl.textContent = 'HIGH SQLi ATTEMPT (14.28%)';
        threatLevelEl.style.color = '#A78BFA';
      }
      if (statusText) {
        statusText.textContent = 'PROBE INTERCEPTED — INJECTION PAYLOAD QUARANTINED — DEFCON 2';
        statusText.style.color = '#A78BFA';
      }

      // Add SQLi attack logs
      setTimeout(() => {
        createAndStoreLog('BLOCKED', `SQL Injection signature XSS/SQLI-9014 detected on query parameter: '/api/products?id=1%27%20OR%201%3D1' ➔ Connection Dropped.`);
        renderLogs();
      }, 400);

      setTimeout(() => {
        createAndStoreLog('BLOCKED', `Payload quarantine: IP ${randomIP()} blacklisted for repeated backend authentication bypass attempt.`);
        renderLogs();

        // Restore normal status
        btnSqli.disabled = false;
        btnSqli.style.opacity = '1';

        if (threatLevelEl) {
          threatLevelEl.textContent = 'NORMAL (0.02%)';
          threatLevelEl.style.color = 'var(--clr-cyan)';
        }
        if (statusText) {
          statusText.textContent = 'SYSTEM OPERATIONAL — DEFCON 4';
          statusText.style.color = 'var(--clr-green)';
        }
      }, 2500);
    });
  }

  if (btnBot) {
    btnBot.addEventListener('click', () => {
      if (state.isDdosActive) return;
      btnBot.disabled = true;
      btnBot.style.opacity = '0.5';

      if (threatLevelEl) {
        threatLevelEl.textContent = 'WARNING BOT SCAN ACTIVE (8.40%)';
        threatLevelEl.style.color = 'var(--clr-cyan)';
      }
      if (statusText) {
        statusText.textContent = 'BOT TELEMETRY WARNING — SCAN SEQUENCING ACTIVE — DEFCON 3';
        statusText.style.color = 'var(--clr-cyan)';
      }

      // Add crawler scanner logs
      let scanStep = 0;
      const botInterval = setInterval(() => {
        const paths = ['/wp-login.php', '/.env', '/config/db.php', '/admin/setup'];
        createAndStoreLog('BLOCKED', `Crawler Exploit Probe blocked: GET ${paths[scanStep]} from headless python-agent.`);
        renderLogs();
        scanStep++;
        if (scanStep >= paths.length) {
          clearInterval(botInterval);
          
          btnBot.disabled = false;
          btnBot.style.opacity = '1';

          if (threatLevelEl) {
            threatLevelEl.textContent = 'NORMAL (0.02%)';
            threatLevelEl.style.color = 'var(--clr-cyan)';
          }
          if (statusText) {
            statusText.textContent = 'SYSTEM OPERATIONAL — DEFCON 4';
            statusText.style.color = 'var(--clr-green)';
          }
        }
      }, 600);
    });
  }

  // Active loop for live logs & counters
  function runLoop() {
    if (!state.isDdosActive) {
      createAndStoreLog();
      renderLogs();

      // Normal graph progression
      state.chartData.shift();
      state.chartData.push(85 + Math.floor(Math.random() * 65));
      drawChart();
    }

    // Fluctuating traffic & latency
    state.traffic24h += Math.floor(Math.random() * 4) + 1;
    if (trafficEl) trafficEl.textContent = state.traffic24h.toLocaleString();

    if (latencyEl) {
      const lat = Math.floor(Math.random() * 8) + 79;
      latencyEl.textContent = `${lat}ms`;
    }

    // Update hardware resources
    updateSystemResources();

    // Slightly increment client site visits
    const luckySite = sites[Math.floor(Math.random() * sites.length)];
    luckySite.visits += Math.floor(Math.random() * 2) + 1;
    if (luckySite.el) {
      luckySite.el.textContent = `${luckySite.visits.toLocaleString()} visits`;
    }

    // Schedule next log
    const nextMs = state.isDdosActive ? 1500 : (Math.floor(Math.random() * 1500) + 1500);
    setTimeout(runLoop, nextMs);
  }

  // Initial runs
  updateThreatDistribution(45, 25, 20, 10);
  drawChart();
  setTimeout(runLoop, 1500);
})();

console.log('%c⬡ ARKIS AGENCY', 'color:#00D4FF;font-family:monospace;font-size:18px;font-weight:bold;');
console.log('%cSecure by Design. Impénétrable par conception.', 'color:#94A3B8;font-family:monospace;font-size:12px;');

