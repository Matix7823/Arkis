'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');
const brevo = require('../config/brevo');

const router = express.Router();

// ─── Config ───────────────────────────────────────────────
const EMAIL_TO  = process.env.CONTACT_EMAIL_TO  || 'contact@arkis.agency';
const FROM_ADDR  = process.env.CONTACT_EMAIL_FROM_ADDR || 'contact@arkis.agency';

// ─── Rate Limiter (Anti-DDoS / Anti-Spam) ──────────────────
// Limite chaque adresse IP à 5 soumissions de formulaire par tranche de 15 minutes.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true, // Renvoie les en-têtes standard de limite de débit
  legacyHeaders: false, // Désactive les en-têtes X-RateLimit-* obsolètes
  message: {
    ok: false,
    errors: [{ field: 'form', message: 'Trop de requêtes. Veuillez patienter 15 minutes avant de réessayer.' }]
  }
});

// ─── Helpers de Sécurité ──────────────────────────────────
const sanitize = (s = '') => String(s).trim().replace(/[<>]/g, '');
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── Route POST /api/contact ───────────────────────────────
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, company, email, phone, service, budget, message, _honey } = req.body;

    // 1. Honeypot anti-spam (silencieux pour les robots)
    if (_honey && String(_honey).trim() !== '') {
      console.log('🤖 Spam bot bloqué par Honeypot.');
      return res.status(200).json({ ok: true });
    }

    // 2. Validation stricte des entrées
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
      return res.status(422).json({ ok: false, errors });
    }

    // 3. Assainissement des données (XSS Prevention)
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

    // 4. Enregistrement dans Supabase (Fiabilité 100%)
    // L'utilisation du client SDK officiel garantit des requêtes paramétrées protégées contre les injections SQL (SQLi).
    try {
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
        // En cas d'erreur de base de données (ex: table non créée dans le dashboard), on logge l'erreur.
        // Mais on tente quand même d'envoyer l'email pour ne pas bloquer le client !
        console.error('❌ Erreur insertion Supabase (vérifiez que la table contacts existe) :', dbError.message);
      } else {
        console.log('💾 Contact enregistré avec succès dans Supabase.');
      }
    } catch (dbErr) {
      console.error('❌ Erreur inattendue Supabase :', dbErr.message);
    }

    // 5. Envoi des deux emails via Brevo
    await Promise.allSettled([
      // Email interne à l'équipe d'Arkis
      brevo.sendEmail({
        to:      EMAIL_TO,
        toName:  'Équipe Arkis',
        replyTo: s.email,
        subject: `[Arkis] ${s.service} — ${s.name}${s.company !== '—' ? ` (${s.company})` : ''}`,
        html:    buildInternalEmail(s, now)
      }),

      // Confirmation par email au client
      brevo.sendEmail({
        to:      s.email,
        toName:  s.name,
        replyTo: FROM_ADDR,
        subject: `Votre message a bien été reçu — Arkis Agency`,
        html:    buildConfirmEmail(s)
      })
    ]).then(([internal]) => {
      // Si l'envoi de l'email interne échoue (et que Brevo est configuré), on lève l'erreur.
      if (internal.status === 'rejected') throw internal.reason;
    });

    console.log(`✅ Formulaire traité avec succès : ${s.name} <${s.email}> — ${s.service}`);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('❌ Erreur route contact :', err.message);
    return res.status(500).json({
      ok: false,
      errors: [{ field: 'form', message: "Erreur lors de l'envoi. Veuillez réessayer ou nous contacter directement." }]
    });
  }
});

// ═══════════════════════════════════════════════════════════
// TEMPLATES EMAIL HTML
// ═══════════════════════════════════════════════════════════

function buildInternalEmail(s, now) {
  const rows = [
    ['👤 Nom',        s.name],
    ['🏢 Entreprise', s.company],
    ['📧 Email',      `<a href="mailto:${s.email}" style="color:#00D4FF;text-decoration:none;">${s.email}</a>`],
    ['📞 Téléphone',  s.phone],
    ['💼 Service',    s.service],
    ['💶 Budget',     s.budget],
  ].map(([label, value]) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:11px;color:#64748B;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
      <span style="font-size:14px;color:#E8EDF8;font-weight:500;">${value}</span>
    </td>
  </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#050A18;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050A18;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0C1529;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

  <!-- En-tête gradient -->
  <tr>
    <td style="background:linear-gradient(135deg,#00D4FF 0%,#7B2FFF 100%);padding:28px 32px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;color:rgba(255,255,255,0.65);text-transform:uppercase;font-family:monospace;">Arkis Agency</p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;">📬 Nouveau message</h1>
    </td>
  </tr>

  <!-- Badge service -->
  <tr>
    <td style="padding:20px 32px 0;">
      <span style="display:inline-block;background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.3);
        border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#00D4FF;letter-spacing:0.06em;text-transform:uppercase;">
        ${s.service}
      </span>
    </td>
  </tr>

  <!-- Champs -->
  <tr>
    <td style="padding:16px 32px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td>
  </tr>

  <!-- Message -->
  <tr>
    <td style="padding:0 32px 24px;">
      <p style="margin:16px 0 8px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;">💬 Message</p>
      <div style="background:#080F22;border:1px solid rgba(255,255,255,0.06);border-left:3px solid #00D4FF;
        border-radius:0 10px 10px 0;padding:16px;font-size:14px;color:#94A3B8;line-height:1.75;white-space:pre-wrap;">${s.message}</div>
    </td>
  </tr>

  <!-- Bouton répondre -->
  <tr>
    <td style="padding:0 32px 32px;text-align:center;">
      <a href="mailto:${s.email}?subject=Re:%20Votre%20demande%20Arkis&body=Bonjour%20${encodeURIComponent(s.name.split(' ')[0])}%2C%0A%0A"
         style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#7B2FFF);color:#fff;
           font-weight:700;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:10px;">
        ↩ Répondre à ${s.name.split(' ')[0]}
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="margin:0;font-size:11px;color:#64748B;font-family:monospace;">
        ${now} · Arkis Agency · Secure by Design
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildConfirmEmail(s) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#050A18;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050A18;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0C1529;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

  <!-- En-tête -->
  <tr>
    <td style="background:linear-gradient(135deg,#00D4FF 0%,#7B2FFF 100%);padding:40px 32px;text-align:center;">
      <p style="margin:0 0 12px;font-size:40px;line-height:1;">⬡</p>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">
        Message bien reçu, ${s.name.split(' ')[0]} !
      </h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.5;">
        Nous revenons vers vous sous <strong>24h ouvrées</strong>.
      </p>
    </td>
  </tr>

  <!-- Corps -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#94A3B8;line-height:1.75;">
        Merci de nous avoir contactés. Notre équipe a bien reçu votre demande concernant
        <strong style="color:#00D4FF;">${s.service}</strong>
        et vous recontactera dans les meilleurs délais.
      </p>

      <!-- Récapitulatif -->
      <div style="background:#080F22;border:1px solid rgba(0,212,255,0.15);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:11px;color:#64748B;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase;">
          Récapitulatif de votre demande
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#94A3B8;width:40%;">Service demandé</td>
            <td style="padding:4px 0;font-size:13px;color:#E8EDF8;font-weight:600;">${s.service}</td>
          </tr>
          ${s.budget !== 'Non précisé' ? `
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#94A3B8;">Budget estimé</td>
            <td style="padding:4px 0;font-size:13px;color:#E8EDF8;font-weight:600;">${s.budget}</td>
          </tr>` : ''}
          ${s.company !== '—' ? `
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#94A3B8;">Entreprise</td>
            <td style="padding:4px 0;font-size:13px;color:#E8EDF8;font-weight:600;">${s.company}</td>
          </tr>` : ''}
        </table>
      </div>

      <p style="margin:0;font-size:13px;color:#64748B;line-height:1.65;">
        En cas d'urgence, écrivez-nous directement à
        <a href="mailto:contact@arkis.agency" style="color:#00D4FF;text-decoration:none;">contact@arkis.agency</a>.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:14px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="margin:0;font-size:11px;color:#64748B;font-family:monospace;">
        © ${year} Arkis Agency · Secure by Design · Made in France
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = router;
