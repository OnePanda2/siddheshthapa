const fs = require('fs');
const p = 'tools/astronomycheck.js';
let lines = fs.readFileSync(p, 'utf8').split('\n');
// drop the truncated line my sed left behind
lines = lines.filter(l => l.trim() !== "console.log('");
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('removed the truncated line; file now ' + lines.length + ' lines');
