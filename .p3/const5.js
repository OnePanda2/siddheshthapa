/* The constellation had no labels at all. Its stars sit 213-320 units from the
   camera and the label rule shows Minor IGs only inside 160 units, writings
   inside 80 — so every name was hidden and the world was eight anonymous dots.

   Constellation stars need their own ranges, and the tier has to be explicit:
   a Minor IG name outranks a writing title at every distance (DESIGN §9). */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(
`    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : (n.t==='minor' ? (d<160 && !elsewhere) : (d<80 && !elsewhere));`,
`    /* A constellation is framed whole, so its stars are far and would other-
       wise never be named. Minor IGs carry much further than writings, which
       is the hierarchy rather than a tweak: the concepts are what the region
       IS, the writings are what it produced. */
    var isStar=(n.star!==undefined);
    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : isStar ? ((n.t==='minor' ? d<470 : d<300) && !elsewhere)
             : (n.t==='minor' ? (d<160 && !elsewhere) : (d<80 && !elsewhere));`);

sub(
`    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))
                           : Math.max(0,Math.min(1,(120-d)/70));`,
`    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))
             : isStar ? Math.max(0,Math.min(1,(n.t==='minor'?(470-d)/240:(300-d)/150)))
             : Math.max(0,Math.min(1,(120-d)/70));`);

/* the figure should be a drawn line, not a suggestion */
sub(`        alphas.push((kon2?0.34:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));`,
    `        alphas.push((kon2?0.46:(cross&&l.keep?0.46:(cross?0.14:0.10)))*(0.18+0.82*t));`);

console.log(n + ' edits applied');
