/**
 * ARKIS AGENCY — Static Site Generator (EJS Compiler)
 * Compiles modular views/ EJS templates into a production-ready, ultra-secure dist/ directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const VIEWS_DIR = path.join(__dirname, 'views');
const DIST_DIR = path.join(__dirname, 'dist');

console.log('⚡ Starting Arkis Static Compiler...');

// 1. Clean and recreate the build directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
console.log('✓ Created fresh dist/ directory.');

// 2. Copy static resources from public/ (canonical source of truth)
const publicDir = path.join(__dirname, 'public');

// Copy top-level files in public/ (style.css, script.js, manifest.json, etc.)
if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir).forEach(file => {
    const srcPath = path.join(publicDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, path.join(DIST_DIR, file));
      console.log(`✓ Copied public asset: ${file}`);
    }
  });
}

// Copy images from public/images/
const imagesDir = path.join(publicDir, 'images');
const distImagesDir = path.join(DIST_DIR, 'images');
if (fs.existsSync(imagesDir)) {
  fs.mkdirSync(distImagesDir, { recursive: true });
  fs.readdirSync(imagesDir).forEach(file => {
    fs.copyFileSync(path.join(imagesDir, file), path.join(distImagesDir, file));
    console.log(`✓ Copied image: images/${file}`);
  });
}

// 3. Compile EJS Templates into static HTML pages
const pages = [
  { template: 'index.ejs', output: 'index.html', pageName: 'accueil' },
  { template: 'services.ejs', output: 'services.html', pageName: 'services' },
  { template: 'realisations.ejs', output: 'realisations.html', pageName: 'realisations' },
  { template: 'tarifs.ejs', output: 'tarifs.html', pageName: 'tarifs' },
  { template: 'equipe.ejs', output: 'equipe.html', pageName: 'equipe' },
  { template: 'contact.ejs', output: 'contact.html', pageName: 'contact' },
  { template: 'live.ejs', output: 'live.html', pageName: 'live' },
  { template: 'legal/mentions-legales.ejs', output: 'legal/mentions-legales.html', pageName: 'mentions-legales' },
  { template: 'legal/confidentialite.ejs', output: 'legal/politique-confidentialite.html', pageName: 'politique-confidentialite' },
  { template: 'legal/cgv.ejs', output: 'legal/cgv.html', pageName: 'cgv' },
  { template: 'legal/rgpd.ejs', output: 'legal/rgpd.html', pageName: 'rgpd' }
];

let compiledCount = 0;

const buildVersion = Date.now();

pages.forEach(page => {
  const templatePath = path.join(VIEWS_DIR, page.template);
  if (fs.existsSync(templatePath)) {
    ejs.renderFile(templatePath, { page: page.pageName, buildVersion }, {}, (err, html) => {
      if (err) {
        console.error(`❌ Error compiling template ${page.template}:`, err);
        process.exit(1);
      }
      
      const outputPath = path.join(DIST_DIR, page.output);
      // Ensure target directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html);
      console.log(`✓ Compiled: ${page.template} -> dist/${page.output}`);
      
      compiledCount++;
      if (compiledCount === pages.length) {
        console.log('\n🎉 EJS static compilation finished successfully!');
        console.log('📂 Ready for secure deployment via Cloudflare Pages!');
      }
    });
  } else {
    console.error(`❌ Missing critical template: ${page.template}`);
    process.exit(1);
  }
});

