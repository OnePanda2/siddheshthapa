/* Arriving close made the pair magnificent and the WORLD illegible: 2 of 7
   bodies in frame, and nothing orbiting the pair. But "circumbinary" is only
   readable when you can see bodies going around BOTH stars, so the whole
   system has to be in frame and the pair has to survive at that range. The way
   to have both is not a nearer camera — it is tighter per-body caps. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

sub(`    var d0=(phoneB?3.6:2.5)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`,
    `    var d0=(phoneB?6.2:4.4)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`);

/* the two stars stay the largest bodies in their own system, and stop growing
   early enough that they never merge into one light */
sub(`    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=104; }
    else if(BINARY[n.mig]){ CAP[i]=74; }     // and never larger than its stars`,
    `    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=58; }
    else if(BINARY[n.mig]){ CAP[i]=34; }     // and never larger than its stars`);
sub(`    CAP[i]=104/b.sizeRatio;`, `    CAP[i]=58/b.sizeRatio;`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
