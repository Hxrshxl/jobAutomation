const fs = require('fs');
const html = fs.readFileSync('naukri_debug.html', 'utf8');
const m = html.match(/class=['"]([^'"]+)['"]/g);
if (m) {
  const s = new Set();
  m.forEach(x => {
    const c = x.replace(/class=['"]/, '').replace(/['"]$/, '');
    c.split(' ').forEach(v => {
      const vl = v.toLowerCase();
      if (vl.includes('title') || vl.includes('comp') || vl.includes('loc')) s.add(v);
    });
  });
  console.log('classes:', Array.from(s).filter(c => c.includes('title') || c.includes('comp-name') || c.includes('loc')));
}

