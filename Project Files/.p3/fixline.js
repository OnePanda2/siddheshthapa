const fs = require('fs');
const p = 'tools/astronomycheck.js';
const lines = fs.readFileSync(p, 'utf8').split('\n');
const i = lines.findIndex(l => l.indexOf('astronomy invariants hold') >= 0);
if (i < 0) { console.error('summary line not found'); process.exit(1); }
lines[i] = "console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' astronomy invariants hold');";
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('line ' + (i + 1) + ' rewritten:', lines[i]);
