import { createClient } from '@supabase/supabase-js';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let body = {};
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }

    const { name, company, email, phone, service, budget, message, _honey } = body;

    // Honeypot anti-spam check
    if (_honey && String(_honey).trim() !== '') {
      console.log('🤖 Bot blocked by Honeypot.');
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cybersecurity validation & sanitization
    const sanitize = (s = '') => String(s).trim().replace(/[<>]/g, '');
    const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const errors = [];
    if (!name || sanitize(name).length < 2) {
      errors.push({ field: 'name', message: 'Nom invalide (2 caractères minimum).' });
    }
    if (!email || !validEmail(email)) {
      errors.push({ field: 'email', message: 'Adresse email invalide.' });
    }
    if (!service || sanitize(service).length < 1) {
      errors.push({ field: 'service', message: 'Veuillez sélectionner un service.' });
    }
    if (!message || sanitize(message).length < 10) {
      errors.push({ field: 'message', message: 'Message trop court (10 caractères minimum).' });
    }

    if (errors.length) {
      return new Response(JSON.stringify({ ok: false, errors }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean inputs (XSS protection)
    const s = {
      name:    sanitize(name),
      company: sanitize(company || '—'),
      email:   email.trim().toLowerCase(),
      phone:   sanitize(phone || '—'),
      service: sanitize(service),
      budget:  sanitize(budget || 'Non précisé'),
      message: sanitize(message),
    };

    const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    // Supabase DB insertion (SQL Injection safe via client SDK parametrization)
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
        const { error: dbError } = await supabase
          .from('contacts')
          .insert([
            {
              name: s.name,
              company: s.company,
              email: s.email,
              phone: s.phone,
              service: s.service,
              budget: s.budget,
              message: s.message
            }
          ]);

        if (dbError) {
          console.error('❌ Supabase insert error:', dbError.message);
        } else {
          console.log('💾 Successfully saved to Supabase from Edge!');
        }
      } catch (dbErr) {
        console.error('❌ Supabase Client Error:', dbErr.message);
      }
    } else {
      console.warn('⚠️ Supabase credentials missing. Skipping DB write.');
    }

    // Send emails via Brevo SMTP API
    const BREVO_KEY = env.BREVO_API_KEY;
    const EMAIL_TO = env.CONTACT_EMAIL_TO || 'contact@arkis.agency';
    const FROM_ADDR = env.CONTACT_EMAIL_FROM_ADDR || 'contact@arkis.agency';

    if (BREVO_KEY) {
      await Promise.allSettled([
        // Internal email to Arkis
        brevoSend(BREVO_KEY, {
          sender:      { name: 'Arkis Edge Function', email: FROM_ADDR },
          to:          [{ email: EMAIL_TO, name: 'Équipe Arkis' }],
          replyTo:     { email: s.email },
          subject:     `[Arkis] ${s.service} — ${s.name}${s.company !== '—' ? ` (${s.company})` : ''}`,
          htmlContent: buildInternalEmail(s, now),
        }),
        // Confirmation to client
        brevoSend(BREVO_KEY, {
          sender:      { name: 'Arkis Agency', email: FROM_ADDR },
          to:          [{ email: s.email, name: s.name }],
          replyTo:     { email: FROM_ADDR },
          subject:     'Votre message a bien été reçu — Arkis Agency',
          htmlContent: buildConfirmEmail(s),
        })
      ]);
      console.log('✉️ Brevo notifications processed.');
    } else {
      console.log('⚠️ BREVO_API_KEY not configured. Simulating mail send.');
      console.log(`To: ${EMAIL_TO}, ReplyTo: ${s.email}, Subject: [Arkis] ${s.service} — ${s.name}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Edge Function error:', err);
    return new Response(JSON.stringify({
      ok: false,
      errors: [{ field: 'form', message: "Une erreur est survenue lors du traitement." }]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

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
  if (!res.ok) throw new Error(`Brevo API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function buildInternalEmail(s, now) {
  const rows = [
    ['👤 Nom',        s.name],
    ['🏢 Entreprise', s.company],
    ['📧 Email',      s.email],
    ['📞 Téléphone',  s.phone],
    ['💼 Service',    s.service],
    ['💶 Budget',     s.budget],
  ].map(([l, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
    <span style="font-size:11px;color:#64748B;display:block;text-transform:uppercase;">${l}</span>
    <span style="font-size:14px;color:#E8EDF8;font-weight:500;">${v}</span>
  </td></tr>`).join('');

  return `<!DOCTYPE html><html><body style="background:#050A18;color:#94A3B8;padding:20px;font-family:sans-serif;">
    <h1 style="color:#00D4FF;">📬 Message de Contact</h1>
    <table width="100%">${rows}</table>
    <div style="background:#080F22;padding:15px;margin-top:15px;border-left:3px solid #00D4FF;">${s.message}</div>
    <p>${now} - Arkis Agency</p>
  </body></html>`;
}

function buildConfirmEmail(s) {
  return `<!DOCTYPE html><html><body style="background:#050A18;color:#94A3B8;padding:20px;font-family:sans-serif;">
    <h1 style="color:#00D4FF;">Message bien reçu, ${s.name} !</h1>
    <p>Nous avons bien reçu votre demande concernant <strong>${s.service}</strong> et reviendrons vers vous sous 24 heures.</p>
    <p>© ${new Date().getFullYear()} Arkis Agency</p>
  </body></html>`;
}
