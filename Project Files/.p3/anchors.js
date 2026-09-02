/* Validate that every mutation anchor in a harness matches exactly once,
   before spending an hour discovering that it does not.
   usage: node .p3/anchors.js tools/<harness>.js [extra target files...] */
const fs = require('fs');
const harness = process.argv[2];
if (!harness) { console.error('usage: node .p3/anchors.js tools/<harness>.js'); process.exit(2); }
const targets = (process.argv.slice(3).length ? process.argv.slice(3)
                 : ['src/v02-app.js', 'src/v02-shell.html', 'data/astronomy-systems.json'])
                .filter(f => fs.existsSync(f))
                .map(f => ({ f, text: fs.readFileSync(f, 'utf8') }));

const src = fs.readFileSync(harness, 'utf8');
const finds = [];
const re = /find:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
while ((m = re.exec(src))) {
  const lit = m[1];
  finds.push(lit[0] === '"' ? JSON.parse(lit)
                            : lit.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
}

let bad = 0;
finds.forEach(f => {
  const n = targets.reduce((s, t) => s + (t.text.split(f).length - 1), 0);
  if (n !== 1) { bad++; console.log('  x' + n + '  ' + JSON.stringify(f.slice(0, 62))); }
});
console.log(bad ? bad + ' BAD ANCHOR(S) of ' + finds.length
                : 'all ' + finds.length + ' anchors match exactly once');
process.exit(bad ? 1 : 0);
