'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { page: 'accueil' });
});

router.get('/services', (req, res) => {
  res.render('services', { page: 'services' });
});

router.get('/realisations', (req, res) => {
  res.render('realisations', { page: 'realisations' });
});

router.get('/tarifs', (req, res) => {
  res.render('tarifs', { page: 'tarifs' });
});

router.get('/equipe', (req, res) => {
  res.render('equipe', { page: 'equipe' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { page: 'contact' });
});

// Live Observability Security Dashboard Route
router.get('/live', (req, res) => {
  res.render('live', { page: 'live' });
});

// Legal Subpages
router.get('/legal/mentions-legales', (req, res) => {
  res.render('legal/mentions-legales', { page: 'mentions-legales' });
});

router.get('/legal/politique-confidentialite', (req, res) => {
  res.render('legal/confidentialite', { page: 'politique-confidentialite' });
});

router.get('/legal/cgv', (req, res) => {
  res.render('legal/cgv', { page: 'cgv' });
});

router.get('/legal/rgpd', (req, res) => {
  res.render('legal/rgpd', { page: 'rgpd' });
});

module.exports = router;
