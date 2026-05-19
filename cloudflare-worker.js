/**
 * ARKIS AGENCY — Cloudflare Worker (Edge Router + Assets Server)
 * Handles:
 *  - POST /api/contact -> input validation, XSS filtering, Supabase DB insert, Brevo SMTP mail send
 *  - GET * -> Falls back to static assets compiled in dist/ (index, services, tarifs, etc.)
 */

'use strict';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export default {
  async fetch(request, env) {
    // CORS Preflight handler
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    
    // Intercept form contact API route
    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    // Fallback: serve static assets compiled in /dist (index.html, services.html, style.css, script.js)
    try {
      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }
    } catch (assetErr) {
      console.error('Asset retrieval error:', assetErr.message);
    }

    return new Response('Not Found', { status: 404 });
  },
};

// ─── Contact Form Handler ───────────────────────────────────────
async function handleContact(request, env) {
  let body = {};
  const ct = request.headers.get('Content-Type') || '';
  
  try {
    body = ct.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return jsonResponse({ ok: false, errors: [{ field: 'form', message: 'Requête invalide.' }] }, 400, request);
  }

  const { name, company, email, phone, service, budget, message, _honey } = body;
  const sanitize   = (s = '') => String(s).trim().replace(/[<>]/g, '');
  const validEmail = (e)      => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Honeypot spam bot trap
  if (_honey && String(_honey).trim() !== '') {
    console.log('🤖 Spam bot blocked silently.');
    return jsonResponse({ ok: true }, 200, request);
  }

  // Strict server-side validation
  const errors = [];
  if (!name    || sanitize(name).length    < 2)  errors.push({ field: 'name',    message: 'Nom invalide (2 caractères minimum).' });
  if (!email   || !validEmail(email))             errors.push({ field: 'email',   message: 'Adresse email invalide.' });
  if (!service || sanitize(service).length  < 1)  errors.push({ field: 'service', message: 'Veuillez sélectionner un service.' });
  if (!message || sanitize(message).length  < 10) errors.push({ field: 'message', message: 'Message trop court (10 caractères minimum).' });

  if (errors.length) {
    return jsonResponse({ ok: false, errors }, 422, request);
  }

  // Input Sanitization (XSS filtering)
  const s = {
    name:    sanitize(name),
    company: sanitize(company  || '—'),
    email:   email.trim().toLowerCase(),
    phone:   sanitize(phone    || '—'),
    service: sanitize(service),
    budget:  sanitize(budget   || 'Non précisé'),
    message: sanitize(message),
  };

  const EMAIL_TO    = env.CONTACT_EMAIL_TO       || 'contact@arkis.agency';
  const FROM_NAME   = env.CONTACT_EMAIL_FROM_NAME || 'Arkis Agency';
  const FROM_ADDR   = env.CONTACT_EMAIL_FROM_ADDR || 'contact@arkis.agency';
  const BREVO_KEY   = env.BREVO_API_KEY;
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const now         = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  // 1. Save to Supabase (SQL Injection safe via parametrization in HTTP Headers)
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: s.name,
          company: s.company,
          email: s.email,
          phone: s.phone,
          service: s.service,
          budget: s.budget,
          message: s.message
        })
      });

      if (!dbResponse.ok) {
        console.error('❌ Supabase insert error:', await dbResponse.text());
      } else {
        console.log('💾 Contact saved to Supabase successfully from Edge Worker.');
      }
    } catch (dbErr) {
      console.error('❌ Supabase network failure:', dbErr.message);
    }
  } else {
    console.warn('⚠️ Supabase credentials missing on Edge Worker. Skipping database logging.');
  }

  // 2. Dispatch notifications via Brevo SMTP API
  try {
    if (BREVO_KEY) {
      const [internal] = await Promise.allSettled([
        // Internal team notification
        brevoSend(BREVO_KEY, {
          sender:      { name: FROM_NAME, email: FROM_ADDR },
          to:          [{ email: EMAIL_TO, name: 'Équipe Arkis' }],
          replyTo:     { email: s.email },
          subject:     `[Arkis] ${s.service} — ${s.name}${s.company !== '—' ? ` (${s.company})` : ''}`,
          htmlContent: buildInternalEmail(s, now),
        }),
        // Client auto-confirmation email
        brevoSend(BREVO_KEY, {
          sender:      { name: FROM_NAME, email: FROM_ADDR },
          to:          [{ email: s.email, name: s.name }],
          replyTo:     { email: FROM_ADDR },
          subject:     'Votre message a bien été reçu — Arkis Agency',
          htmlContent: buildConfirmEmail(s),
        }),
      ]);

      if (internal.status === 'rejected') throw internal.reason;
      console.log('✉️ Brevo notifications dispatched.');
    } else {
      console.warn('⚠️ BREVO_API_KEY not configured. Simulating email send.');
    }

    return jsonResponse({ ok: true }, 200, request);

  } catch (err) {
    console.error('❌ Edge mailer error:', err.message);
    return jsonResponse({
      ok: false,
      errors: [{ field: 'form', message: "Erreur d'envoi. Veuillez nous contacter directement." }],
    }, 500, request);
  }
}

// ─── Brevo HTTP Dispatcher ──────────────────────────────────────
async function brevoSend(apiKey, payload) {
  const res = await fetch(BREVO_ENDPOINT, {
    method:  'POST',
    headers: {
      'api-key':      apiKey,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Brevo API returned status ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── HTTP Utilities ──────────────────────────────────────────────
function corsHeaders(req) {
  const origin = req?.headers?.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, status, req) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

// ─── Dynamic Email Templates ──────────────────────────────────────
function buildInternalEmail(s, now) {
  const rows = [
    ['👤 Nom',        s.name],
    ['🏢 Entreprise', s.company],
    ['📧 Email',      `<a href="mailto:${s.email}" style="color:#00D4FF;text-decoration:none;">${s.email}</a>`],
    ['📞 Téléphone',  s.phone],
    ['💼 Service',    s.service],
    ['💶 Budget',     s.budget],
  ].map(([l, v]) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:11px;color:#64748B;display:block;text-transform:uppercase;letter-spacing:0.05em;">${l}</span>
      <span style="font-size:14px;color:#E8EDF8;font-weight:500;">${v}</span>
    </td></tr>`).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#050A18;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050A18;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;background:#0C1529;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#00D4FF,#7B2FFF);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;">📬 Nouveau message</h1>
  </td></tr>
  <tr><td style="padding:20px 32px 0;">
    <span style="background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.3);
      border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#00D4FF;text-transform:uppercase;letter-spacing:0.06em;">
      ${s.service}
    </span>
  </td></tr>
  <tr><td style="padding:16px 32px 8px;">
    <table width="100%">${rows}</table>
  </td></tr>
  <tr><td style="padding:0 32px 24px;">
    <p style="margin:16px 0 8px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">💬 Message</p>
    <div style="background:#080F22;border-left:3px solid #00D4FF;border-radius:0 10px 10px 0;
      padding:16px;font-size:14px;color:#94A3B8;line-height:1.75;white-space:pre-wrap;">${s.message}</div>
  </td></tr>
  <tr><td style="padding:0 32px 32px;text-align:center;">
    <a href="mailto:${s.email}?subject=Re:%20Votre%20demande%20Arkis"
       style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#7B2FFF);
         color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:10px;">
      ↩ Répondre à ${s.name.split(' ')[0]}
    </a>
  </td></tr>
  <tr><td style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="margin:0;font-size:11px;color:#64748B;font-family:monospace;">${now} · Arkis Agency · Secure by Design</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildConfirmEmail(s) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#050A18;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050A18;padding:40px 16px;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;background:#0C1529;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#00D4FF,#7B2FFF);padding:40px 32px;text-align:center;">
    <p style="margin:0 0 12px;font-size:40px;">⬡</p>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Message bien reçu, ${s.name.split(' ')[0]} !</h1>
    <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.8);">Nous revenons vers vous sous <strong>24h ouvrées</strong>.</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#94A3B8;line-height:1.75;">
      Merci de nous avoir contactés. Votre demande concernant <strong style="color:#00D4FF;">${s.service}</strong> a bien été reçue.
    </p>
    <div style="background:#080F22;border:1px solid rgba(0,212,255,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;color:#64748B;font-family:monospace;text-transform:uppercase;letter-spacing:0.08em;">Récapitulatif</p>
      <p style="margin:0 0 4px;font-size:13px;color:#E8EDF8;"><strong style="color:#94A3B8;">Service :</strong> ${s.service}</p>
      ${s.budget !== 'Non précisé' ? `<p style="margin:0;font-size:13px;color:#E8EDF8;"><strong style="color:#94A3B8;">Budget :</strong> ${s.budget}</p>` : ''}
    </div>
    <p style="margin:0;font-size:13px;color:#64748B;line-height:1.65;">
      Urgence ? <a href="mailto:contact@arkis.agency" style="color:#00D4FF;text-decoration:none;">contact@arkis.agency</a>
    </p>
  </td></tr>
  <tr><td style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="margin:0;font-size:11px;color:#64748B;font-family:monospace;">© ${year} Arkis Agency · Secure by Design</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}
