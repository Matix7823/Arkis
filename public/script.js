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



})();
