/* LOVE is a physically wider system, so its camera sits at ~179 units where
   Philosophy's sits at ~115. The orbit shader fades with distance — 0.476 vs
   0.853 — so LOVE was rendering at 56% of Philosophy's path opacity for a
   reason that has nothing to do with design. Compensate in LOVE's own vertex
   alphas; touching the shared falloff would change Philosophy. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

sub(`          if(BINARY[mid]) al*=0.70;                   // the pair leads, not the rings`,
    `          if(BINARY[mid]) al*=1.55;   // distance-compensated; the rings still
                                      // sit under the pair in the hierarchy`);

sub(`          push2(pt, si?0.50:0.58, si?(pal.star2||pal.star):pal.star);`,
    `          push2(pt, si?0.88:1.00, si?(pal.star2||pal.star):pal.star);`);

sub(`      push2(b.centre.clone(), 0.46, pal.accent);
      push2(new THREE.Vector3().addVectors(b.centre, localOrbit(CR,a0,0)), 0.05, pal.accent);`,
    `      push2(b.centre.clone(), 0.80, pal.accent);
      push2(new THREE.Vector3().addVectors(b.centre, localOrbit(CR,a0,0)), 0.05, pal.accent);`);

sub(`              0.16, paletteOf(mid).body);`, `              0.30, paletteOf(mid).body);`);

sub(`    push2(A.pos.clone(), 0.30, pal2.star);
    push2(b.centre.clone(), 0.30, pal2.accent);
    push2(b.centre.clone(), 0.30, pal2.accent);
    push2(pB, 0.30, pal2.star2||pal2.star);`,
    `    push2(A.pos.clone(), 0.62, pal2.star);
    push2(b.centre.clone(), 0.52, pal2.accent);
    push2(b.centre.clone(), 0.52, pal2.accent);
    push2(pB, 0.62, pal2.star2||pal2.star);`);

/* the bodies were reduced until they stopped being bodies */
sub(`    else if(BINARY[n.mig]){ CAP[i]=34; }     // and never larger than its stars`,
    `    else if(BINARY[n.mig]){ CAP[i]=48; }     // and never larger than its stars`);

if (!n) { console.error('nothing changed'); process.exit(1); }
fs.writeFileSync(F, s, 'utf8');
console.log(n + ' edits applied');
