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

// 2. Copy static resources
const assets = [
  'style.css',
  'script.js',
  'portfolio_mockup1.png',
  'portfolio_mockup2.png',
  'portfolio_mockup3.png',
  'portfolio_bricosam.png',
  'portfolio_commerce.png',
  'portfolio_dhmtech.png'
];

assets.forEach(asset => {
  const srcPath = path.join(__dirname, asset);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(DIST_DIR, asset));
    console.log(`✓ Copied static asset: ${asset}`);
  } else {
    console.warn(`⚠️ Warning: Static asset not found: ${asset}`);
  }
});

// 3. Compile EJS Templates into static HTML pages
const pages = [
  { template: 'index.ejs', output: 'index.html', pageName: 'accueil' },
  { template: 'services.ejs', output: 'services.html', pageName: 'services' },
  { template: 'realisations.ejs', output: 'realisations.html', pageName: 'realisations' },
  { template: 'tarifs.ejs', output: 'tarifs.html', pageName: 'tarifs' },
  { template: 'equipe.ejs', output: 'equipe.html', pageName: 'equipe' },
  { template: 'contact.ejs', output: 'contact.html', pageName: 'contact' }
];

let compiledCount = 0;

pages.forEach(page => {
  const templatePath = path.join(VIEWS_DIR, page.template);
  if (fs.existsSync(templatePath)) {
    ejs.renderFile(templatePath, { page: page.pageName }, {}, (err, html) => {
      if (err) {
        console.error(`❌ Error compiling template ${page.template}:`, err);
        process.exit(1);
      }
      
      // Clean up EJS links to match standard relative files or mapped routes
      // Cloudflare Pages clean URLs maps /services -> services.html automatically,
      // but modifying .ejs links is not needed as Cloudflare resolves them natively.
      const outputPath = path.join(DIST_DIR, page.output);
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
