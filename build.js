/**
 * ARKIS — Static Site Generator (EJS Compiler)
 * Compiles modular views/ EJS templates into a production-ready dist/ directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const VIEWS_DIR = path.join(__dirname, 'views');
const DIST_DIR = path.join(__dirname, 'dist');

console.log('⚡ Starting Arkis Static Compiler...');

// 1. Ensure dist/ exists (overwrite mode; safe on sandboxed filesystems)
fs.mkdirSync(DIST_DIR, { recursive: true });
console.log('✓ dist/ directory ready.');

// 2. Copy static resources from public/
const publicDir = path.join(__dirname, 'public');

function safeCopy(src, dest) {
  try { fs.copyFileSync(src, dest); return true; }
  catch (e) { console.warn(`! Could not copy ${src}: ${e.code || e.message}`); return false; }
}

if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir).forEach(file => {
    const srcPath = path.join(publicDir, file);
    if (fs.statSync(srcPath).isFile()) {
      safeCopy(srcPath, path.join(DIST_DIR, file));
      console.log(`✓ Copied: ${file}`);
    }
  });
}

// Images
const imagesDir = path.join(publicDir, 'images');
const distImagesDir = path.join(DIST_DIR, 'images');
if (fs.existsSync(imagesDir)) {
  fs.mkdirSync(distImagesDir, { recursive: true });
  fs.readdirSync(imagesDir).forEach(file => {
    safeCopy(path.join(imagesDir, file), path.join(distImagesDir, file));
    console.log(`✓ Copied image: images/${file}`);
  });
}

// 3. Compile EJS templates
const pages = [
  { template: 'index.ejs',       output: 'index.html',       pageName: 'accueil' },
  { template: 'services.ejs',    output: 'services.html',    pageName: 'services' },
  { template: 'realisations.ejs',output: 'realisations.html',pageName: 'realisations' },
  { template: 'tarifs.ejs',      output: 'tarifs.html',      pageName: 'tarifs' },
  { template: 'equipe.ejs',      output: 'equipe.html',      pageName: 'equipe' },
  { template: 'contact.ejs',     output: 'contact.html',     pageName: 'contact' },
  { template: 'live.ejs',        output: 'live.html',        pageName: 'live' },
  { template: 'legal/mentions-legales.ejs',     output: 'legal/mentions-legales.html',         pageName: 'mentions-legales' },
  { template: 'legal/confidentialite.ejs',      output: 'legal/politique-confidentialite.html',pageName: 'politique-confidentialite' },
  { template: 'legal/cgv.ejs',                  output: 'legal/cgv.html',                      pageName: 'cgv' },
  { template: 'legal/rgpd.ejs',                 output: 'legal/rgpd.html',                     pageName: 'rgpd' }
];

const buildVersion = Date.now();
let compiledCount = 0;
let errCount = 0;

pages.forEach(page => {
  const templatePath = path.join(VIEWS_DIR, page.template);
  if (!fs.existsSync(templatePath)) {
    console.warn(`! Skipped (missing): ${page.template}`);
    return;
  }
  ejs.renderFile(templatePath, { page: page.pageName, buildVersion }, {}, (err, html) => {
    if (err) {
      console.error(`✗ Error compiling ${page.template}:`, err.message);
      errCount++;
      return;
    }
    const outputPath = path.join(DIST_DIR, page.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Compiled: ${page.template} -> dist/${page.output}`);
    compiledCount++;
    if (compiledCount + errCount === pages.filter(p => fs.existsSync(path.join(VIEWS_DIR, p.template))).length) {
      console.log(`\n🎉 Build done. ${compiledCount} pages compiled, ${errCount} errors.`);
    }
  });
});
