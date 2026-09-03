/* The constellation rendered as eight scattered dots because its lines were
   invisible — and the figure IS the lines.

   Cause: the `localMix` gate that decides when local relationships resolve is
   computed from the camera's distance to the WORLD ORIGIN, while every MIG sits
   on a sphere far from it. Inside any region the gate evaluates to ~0.008, so
   internal relationship lines have been drawn at ~1% opacity everywhere, always.

   Rather than change that gate — which would alter Philosophy's approved look —
   use the `kind` attribute the material already has: kind=1 means "not gated by
   localMix". Only constellation edges take it. Philosophy is untouched.

   Second fault: the per-star cap of 64px flattened every star to the same size,
   erasing the real magnitude hierarchy the astronomy provides. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`        kinds.push(cross&&l.keep?1:0);`,
`        /* kind=1 bypasses the localMix gate. A constellation's lines are not
           incidental local detail — they are the figure, and they must be
           visible wherever the figure is. */
        kinds.push((kon2||(cross&&l.keep))?1:0);`);

sub(`        alphas.push((kon2?0.30:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));`,
    `        alphas.push((kon2?0.34:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));`);

/* let the measured magnitudes actually differ on screen */
sub(`    else if(n.star!==undefined){ CAP[i]=64; }`,
    `    else if(n.star!==undefined){ CAP[i]=124; }   // room for real magnitude to show`);

/* the sky should read as sky, not as dust */
sub(`    SZ[i]=9+Math.max(0,(6.0-b.vMag))*4.4;
    CAP[i]=17;                                   // never a body, always a backdrop`,
    `    SZ[i]=11+Math.max(0,(6.0-b.vMag))*5.2;
    CAP[i]=22;                                   // never a body, always a backdrop`);

sub(`    EMPH[i]=0.30;                                // tertiary, and it must stay there`,
    `    EMPH[i]=0.42;                                // tertiary, and it must stay there`);

console.log(n + ' edits applied');
