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
// 11. SMOOTH ANCHOR SCROLL with offset
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

console.log('%c⬡ ARKIS AGENCY', 'color:#00D4FF;font-family:monospace;font-size:18px;font-weight:bold;');
console.log('%cSecure by Design. Impénétrable par conception.', 'color:#94A3B8;font-family:monospace;font-size:12px;');
