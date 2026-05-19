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

module.exports = router;
