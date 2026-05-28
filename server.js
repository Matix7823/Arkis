/**
 * ARKIS AGENCY — Main Server Orchestrator (Express + EJS)
 * Handles: Dynamic templating, Security Hardening (Helmet, CSP, Rate Limiting), Modular routes
 */

'use strict';

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const helmet = require('helmet');

const PORT = process.env.PORT || 3000;
const app = express();
app.locals.buildVersion = Date.now();

// ─── 1. CYBERSECURITÉ : En-têtes HTTP Sécurisés (Helmet + CSP stricte) ───
app.use((req, res, next) => {
  // Génère un nonce unique par requête pour les scripts inline
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${res.locals.cspNonce}'`,
          "https://cdn.jsdelivr.net",
          "https://challenges.cloudflare.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: [
          "'self'",
          "https://api.brevo.com",
          "https://challenges.cloudflare.com"
        ],
        frameSrc: ["'self'", "https://challenges.cloudflare.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    xPoweredBy: false,
    permissionsPolicy: {
      features: {
        geolocation: [],
        camera: [],
        microphone: [],
        payment: [],
        usb: [],
      }
    }
  })(req, res, next);
});

// ─── 2. Middlewares Standard ──────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Sert les ressources statiques publiques depuis public/ uniquement
app.use(express.static(path.join(__dirname, 'public')));

// ─── 3a. Forcer UTF-8 sur toutes les réponses HTML ─────────────
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});

// ─── 3. Configuration du Moteur EJS ───────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── 4. CSRF Token middleware (double-submit cookie pattern) ───
app.use((req, res, next) => {
  // Génère un token CSRF si absent
  if (!req.headers.cookie || !req.headers.cookie.includes('_csrf_token')) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('_csrf_token', token, {
      httpOnly: false, // Le JS frontend doit pouvoir le lire
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }
  next();
});

// ─── 5. Chargement des Routes Modulaires ──────────────────
const pagesRouter = require('./routes/pages');
const contactRouter = require('./routes/contact');

// API de Contact (avec Rate Limit interne + CSRF validation)
app.use('/api/contact', contactRouter);

// Pages vitrines dynamiques
app.use('/', pagesRouter);

// ─── 6. Fallback 404 / Redirection ────────────────────────
app.get('*', (_req, res) => {
  res.redirect('/');
});

// ─── 7. Démarrage du Serveur ──────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ARKIS AGENCY — Serveur demarre');
  console.log(`  http://localhost:${PORT}`);
  console.log('  Securite : Helmet, CSP nonce, CSRF, Rate Limiting');
  console.log('');
});
