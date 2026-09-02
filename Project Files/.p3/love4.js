const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

/* A body that drifts near the camera in a wide world balloons to the global
   212px cap and stops being a body at all — VULNERABILITY rendered as a cloud
   twice the size of the stars it orbits. Cap the bodies of a wide world too;
   the two stars must stay the largest things in their own system. */
sub(`    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.5;   // far, slow, and few`,
    `    if(n.t!=='mig'&&BINARY[n.mig]) SZ[i]*=1.35;  // far, slow, and few`);

/* the cap has to be set HERE, after CAP_DEFAULT lands, or it is overwritten */
sub(`    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=104; }`,
    `    if(n.t==='mig'&&BINARY[n.id]){ CAP[i]=104; }
    else if(BINARY[n.mig]){ CAP[i]=74; }     // and never larger than its stars`);

/* stand back enough that more than one of the four bodies is present on
   arrival, while the pair still leads the frame */
sub(`    var d0=(phoneB?3.2:2.2)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`,
    `    var d0=(phoneB?3.6:2.5)*(ORBITS[id]&&ORBITS[id][0]?ORBITS[id][0].r:scaleFor(id));`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
