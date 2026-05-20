/**
 * ARKIS AGENCY — Main Server Orchestrator (Express + EJS)
 * Handles: Dynamic templating, Security Hardening (Helmet, CSP, Rate Limiting), Modular routes
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const PORT = process.env.PORT || 3000;
const app = express();

// ─── 1. CYBERSECURITÉ : En-têtes HTTP Sécurisés (Helmet) ───
// Bloque le clickjacking, désactive le sniff de type MIME, et applique une CSP stricte.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      // Autorise les scripts locaux et l'exécution nécessaire pour les animations interactives
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      // Autorise le chargement des styles locaux et de Google Fonts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // Autorise les polices de Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // Autorise les images locales et les mocks png
      imgSrc: ["'self'", "data:", "https://*"],
      // Autorise les connexions sortantes (API Supabase / Brevo)
      connectSrc: [
        "'self'", 
        "https://api.brevo.com", 
        "https://ctfbpheihgujwsskgxxp.supabase.co", 
        "https://*.supabase.co",
        "wss://*.supabase.co"
      ],
    },
  },
  // Cache les détails technologiques du serveur (X-Powered-By)
  xPoweredBy: false,
}));

// ─── 2. Middlewares Standard ──────────────────────────────
app.use(cors({ origin: false })); // Bloque le cross-origin non sollicité par défaut
app.use(express.json({ limit: '64kb' })); // Taille max de payload pour éviter les injections de Denial of Service
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Sert les ressources statiques publiques depuis public/ uniquement
// ⚠️ Sécurité : on n'expose PAS la racine du projet (server.js, .env, routes/, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ─── 3a. Forcer UTF-8 sur toutes les réponses HTML ─────────────
// Évite que les navigateurs interprètent l'UTF-8 comme Latin-1 (Ã© etc.)
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});

// ─── 3. Configuration du Moteur EJS ───────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── 4. Chargement des Routes Modulaires ──────────────────
const pagesRouter = require('./routes/pages');
const contactRouter = require('./routes/contact');

// API de Contact (avec Rate Limit interne)
app.use('/api/contact', contactRouter);

// Pages vitrines dynamiques
app.use('/', pagesRouter);

// ─── 5. Fallback 404 / Redirection ────────────────────────
app.get('*', (_req, res) => {
  // Redirige vers l'accueil en cas de route inconnue pour maximiser l'expérience utilisateur
  res.redirect('/');
});

// ─── 6. Démarrage du Serveur ──────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ⬡  ARKIS AGENCY — Serveur Démarré de manière Sécurisée');
  console.log(`  🌐  Localhost  : http://localhost:${PORT}`);
  console.log('  🛡️   Sécurité   : Helmet & Content-Security-Policy activés');
  console.log('  💾  Base de Données : Supabase (Postgres) Connectée');
  console.log('');
});
