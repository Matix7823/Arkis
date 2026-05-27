const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

const pages = ['index', 'services', 'realisations', 'live', 'tarifs', 'equipe', 'contact'];
const data = { buildVersion: Date.now(), page: 'accueil' };

for (const p of pages) {
  try {
    const file = path.join(__dirname, 'views', p + '.ejs');
    const html = ejs.render(fs.readFileSync(file, 'utf8'), { ...data, page: p === 'index' ? 'accueil' : p }, { filename: file });
    console.log(`✓ ${p}.ejs renders OK (${html.length} bytes)`);
  } catch (e) {
    console.log(`✗ ${p}.ejs FAILED:`, e.message);
  }
}
