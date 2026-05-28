/**
 * ARKIS AGENCY — Route Contact (API Express)
 * Sécurité : CSRF double-submit, validation stricte, rate limiting, encodage contextuel
 */

'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// ─── Rate Limiter (store en mémoire par défaut, suffisant si single instance) ───
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requêtes par IP par fenêtre
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ─── Constantes de validation ────────────────────────────────
const VALIDATION = {
  name: { min: 2, max: 80, pattern: /^[\p{L}\p{N}\s\-'.]+$/u },
  email: { max: 254, pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ },
  subject: { min: 0, max: 120 },
  message: { min: 10, max: 5000 },
};

// ─── Helper d'échappement HTML contextuel ────────────────────
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── CSRF Validation middleware ──────────────────────────────
function validateCsrf(req, res, next) {
  const cookieToken = extractCookieValue(req.headers.cookie, '_csrf_token');
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ success: false, message: 'CSRF validation failed.' });
  }
  next();
}

function extractCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Route POST /api/contact ─────────────────────────────────
router.post('/', contactLimiter, validateCsrf, async (req, res) => {
  try {
    const { name, email, subject, message, consent } = req.body;

    // Vérification du consentement RGPD
    if (!consent || consent !== 'true') {
      return res.status(400).json({ success: false, message: 'Le consentement RGPD est requis.' });
    }

    // Validation stricte des champs
    const errors = [];

    // Nom
    const trimmedName = (name || '').trim();
    if (trimmedName.length < VALIDATION.name.min || trimmedName.length > VALIDATION.name.max) {
      errors.push(`Nom : entre ${VALIDATION.name.min} et ${VALIDATION.name.max} caractères.`);
    } else if (!VALIDATION.name.pattern.test(trimmedName)) {
      errors.push('Nom : caractères non autorisés.');
    }

    // Email
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (trimmedEmail.length > VALIDATION.email.max || !VALIDATION.email.pattern.test(trimmedEmail)) {
      errors.push('Email : format invalide.');
    }

    // Sujet (optionnel)
    const trimmedSubject = (subject || '').trim();
    if (trimmedSubject.length > VALIDATION.subject.max) {
      errors.push(`Sujet : maximum ${VALIDATION.subject.max} caractères.`);
    }

    // Message
    const trimmedMessage = (message || '').trim();
    if (trimmedMessage.length < VALIDATION.message.min || trimmedMessage.length > VALIDATION.message.max) {
      errors.push(`Message : entre ${VALIDATION.message.min} et ${VALIDATION.message.max} caractères.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    // Données nettoyées
    const sanitized = {
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
    };

    // Insertion Supabase
    const supabase = require('../config/supabase');
    const { error: dbError } = await supabase
      .from('contacts')
      .insert([{
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        message: sanitized.message,
        created_at: new Date().toISOString(),
      }]);

    if (dbError) {
      console.error('[Contact DB Error]', dbError);
      return res.status(500).json({ success: false, message: 'Une erreur est survenue. Réessayez.' });
    }

    // Envoi email Brevo (avec encodage HTML contextuel)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const emailHtml = `
        <h2>Nouveau message de contact — Arkis</h2>
        <p><strong>Nom :</strong> ${escapeHtml(sanitized.name)}</p>
        <p><strong>Email :</strong> ${escapeHtml(sanitized.email)}</p>
        <p><strong>Sujet :</strong> ${escapeHtml(sanitized.subject || 'Non spécifié')}</p>
        <hr>
        <p>${escapeHtml(sanitized.message).replace(/\n/g, '<br>')}</p>
      `;

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: process.env.CONTACT_EMAIL_FROM_NAME || 'Arkis', email: process.env.CONTACT_EMAIL_FROM_ADDR || 'contact@arkis.agency' },
          to: [{ email: process.env.CONTACT_EMAIL_TO || 'contact@arkis.agency' }],
          subject: `[Arkis Contact] ${sanitized.subject || 'Nouveau message'}`,
          htmlContent: emailHtml,
        }),
      }).catch(err => console.error('[Brevo Error]', err.message));
    }

    return res.json({ success: true, message: 'Message envoyé avec succès.' });

  } catch (err) {
    console.error('[Contact Error]', err.message);
    return res.status(500).json({ success: false, message: 'Une erreur interne est survenue.' });
  }
});

module.exports = router;
