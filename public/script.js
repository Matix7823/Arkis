/* ═══════════════════════════════════════════════════════════════
   ARKIS — Main Script v3
   Minimal, clean, performant. Dark premium.
   ─────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ─── Navbar scroll state ─────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check in case page loads scrolled
  }

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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ─── CSRF helper ─────────────────────────────────────────── */
  function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)_csrf_token=([^;]+)/);
    return match ? match[1] : '';
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

  /* ─── Contact form (validation + submit) ─────────────────── */
  const cf = document.getElementById('contact-form');
  if (cf) {
    cf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(cf).entries());

      if (!data.name || !data.email || !data.subject || !data.message) {
        toast('Merci de remplir les champs obligatoires.', 'error');
        return;
      }
      if (data.consent !== 'true') {
        toast('Veuillez accepter la politique de confidentialité pour continuer.', 'error');
        return;
      }

      const submitBtn = cf.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours…';
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken(),
          },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          toast('Message envoyé. On revient vers vous sous 24h.', 'success');
          cf.reset();
        } else {
          toast(json.message || 'Une erreur est survenue. Réessayez ou écrivez à contact@arkis.agency', 'error');
        }
      } catch {
        toast('Réseau indisponible. Réessayez.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Envoyer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:-2px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
        }
      }
    });
  }

  /* ─── Homepage animations ─────────────────────────────────── */
  const animUptime = document.getElementById('anim-uptime');
  if (animUptime) {
    let u = 99.97;
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
      a += Math.random() * 0.1;
      animAttacks.textContent = a.toFixed(1);
    }, 4500);
  }

  /* ─── Terminal typing effect ──────────────────────────────── */
  const terminalBody = document.querySelector('.hv-term-body');
  if (terminalBody) {
    const lines = terminalBody.querySelectorAll('.ln');
    if (lines.length > 0) {
      lines.forEach(l => (l.style.display = 'none'));
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
          setTimeout(() => {
            lines.forEach(l => (l.style.display = 'none'));
            currentLine = 0;
            showNextLine();
          }, 10000);
        }
      }
      setTimeout(showNextLine, 500);
    }
  }

  /* ─── Generic Button Feedback ─────────────────────────────── */
  document.querySelectorAll('button:not([type="submit"]):not(#hamburger-btn)').forEach(btn => {
    if (!btn.onclick && !btn.id) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const actionText = btn.textContent.trim() || 'Action';
        toast(`${actionText} a été déclenché.`, 'info');
      });
    }
  });

})();
