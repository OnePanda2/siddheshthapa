/* Prove every mutation anchor matches exactly once before spending an hour
   discovering it does not. Reads the harness's own find: values. */
const fs = require('fs');
const app  = fs.readFileSync('src/v02-app.js', 'utf8');
const data = fs.readFileSync('data/astronomy-systems.json', 'utf8');
const src  = fs.readFileSync('tools/astromutate.js', 'utf8');

const finds = [];
const re = /find:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
let m;
while ((m = re.exec(src))) {
  const lit = m[1];
  let v;
  if (lit[0] === '"') v = JSON.parse(lit);
  else v = lit.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  finds.push(v);
}

let bad = 0;
finds.forEach(f => {
  const a = app.split(f).length - 1;
  const d = data.split(f).length - 1;
  const n = a + d;
  if (n !== 1) { bad++; console.log('  x' + n + '  ' + JSON.stringify(f.slice(0, 60))); }
});
console.log(bad ? bad + ' BAD ANCHOR(S) of ' + finds.length
                : 'all ' + finds.length + ' anchors match exactly once');
process.exit(bad ? 1 : 0);
