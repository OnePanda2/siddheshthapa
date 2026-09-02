/* Two fixes.

   1. LOVE's stars sat OUTSIDE the organ. The binary-motion code writes star A
      and star B to their UNIVERSE positions on any frame the camera moves, so
      it was overwriting the folded positions every time. It must not run while
      the mind is folded.

   2. A line drawing on white needs ink. The contour was 0.9 alpha of a light
      grey-blue, which on a near-white ground is a whisper — no amount of
      re-shaping the curve rescues a line that faint. Contour goes to near-ink
      and everything else steps back behind it. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* 1 — the binary belongs to the universe, not to the folded brain */
sub(`  if(BIN_KEYS.length && pts){`,
`  /* while the mind is folded the pair belongs to the brain's interior, not to
     its own orbit — running this then threw LOVE's stars outside the organ */
  if(BIN_KEYS.length && pts && mindOpen > 0.5){`);

/* 2 — the contour is ink; everything else is behind it */
sub(`    var gc=new THREE.Color(0x7d8ba1);`,
    `    var gc=new THREE.Color(0x39465c), gcInk=new THREE.Color(0x1e2836);`);

sub(`          cols.push(gc.r,gc.g,gc.b);`,
    `          var cc=contour?gcInk:gc;
          cols.push(cc.r,cc.g,cc.b);`);

sub(`  { id:'rim', w:1.00, contour:true,`, `  { id:'rim', w:2.30, contour:true,`);
sub(`var BRAIN_MIDLINE={ id:'midline', w:0.62, contour:true,`,
    `var BRAIN_MIDLINE={ id:'midline', w:1.15, contour:true,`);
sub(`  { id:'sylvian', w:0.78,`, `  { id:'sylvian', w:1.40,`);
sub(`  { id:'central', w:0.62,`, `  { id:'central', w:1.10,`);
sub(`  { id:'cerebellar', w:0.62,`, `  { id:'cerebellar', w:1.10,`);
sub(`  { id:'fold', w:0.26,`, `  { id:'fold', w:0.45,`);

/* the graph and the tissue step back so the anatomy is the first thing read */
sub(`      '  if(home < -0.5 && kind < 1.5) a = mix(a, 0.085, 1.0-mindOpen);',`,
    `      '  if(home < -0.5 && kind < 1.5) a = mix(a, 0.055, 1.0-mindOpen);',`);

sub(`      '  if(isMig < 0.5) here *= (0.78 + 0.22*mindOpen);',`,
    `      '  if(isMig < 0.5) here *= (0.42 + 0.58*mindOpen);',`);

console.log(n + ' edits applied');
