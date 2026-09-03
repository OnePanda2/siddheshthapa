/* The binding now reads. Two things still fail on the render: the pair sits
   small inside a frame of empty space and sprawling faint rings, and star B
   reads as a planet rather than a star. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

/* Arrive closer. The pair has to be the subject; the outer paths sweeping out
   of frame is the correct reading of a system whose centre is 14% of its
   width, not a cropping accident. */
sub(`    var d0=(phoneB?4.0:2.75)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`,
    `    var d0=(phoneB?3.2:2.2)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`);

/* A smaller sprite of the same glyph loses its core to the alpha falloff, so
   the companion needs more emphasis to read as the star it is, not a planet. */
sub(`    EMPH[i]=1.0;
    REG[i]=(migIndex[c.mig]===undefined?-1:migIndex[c.mig]);  // hover reaches it`,
    `    EMPH[i]=1.30;
    REG[i]=(migIndex[c.mig]===undefined?-1:migIndex[c.mig]);  // hover reaches it`);

/* the concepts of a binary world sit far out on slow orbits — they need to
   carry at that range or the world has stars and nothing else */
sub(`    SZ[i]= n.t==='mig' ? 150 : (n.t==='minor' ? 62+weight*38 : 44+weight*34);`,
    `    SZ[i]= n.t==='mig' ? 150 : (n.t==='minor' ? 62+weight*38 : 44+weight*34);
    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.5;   // far, slow, and few`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
