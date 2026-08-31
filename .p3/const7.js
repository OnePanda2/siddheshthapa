/* The eight stars rendered as soft green glows rather than points of light.
   The shared core() gradient is deliberately soft — right for a concept body in
   a planetary world, wrong for a star. A star needs a very tight bright centre
   and a fast falloff, with one wide faint halo for air.

   This takes the last free atlas cell: 11 glyphs + 14 species = 25 = 5x5. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`var GLYPHS=['mig','minor','thought','belief','question','project','experiment',
            'contradiction','person','reference'];`,
`var GLYPHS=['mig','minor','thought','belief','question','project','experiment',
            'contradiction','person','reference','star'];`);

sub(`    if(t==='mig'){ core(R*0.86,0.92); }        // generic anchor; real MIGs use their species`,
`    if(t==='star'){
      /* A POINT OF LIGHT. Tight centre, fast falloff, one wide faint halo — the
         difference between a star and a glow is how quickly it stops. */
      var sg=g.createRadialGradient(0,0,0,0,0,R*0.22);
      sg.addColorStop(0,'rgba(255,255,255,1)');
      sg.addColorStop(0.38,'rgba(255,255,255,0.62)');
      sg.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=sg; g.beginPath(); g.arc(0,0,R*0.22,0,6.2832); g.fill();
      core(R*0.72,0.13);
    }
    else if(t==='mig'){ core(R*0.86,0.92); }   // generic anchor; real MIGs use their species`);

sub(`    if(n.star!==undefined){ var si=GLYPHS.indexOf('minor'); if(si>=0) gi=si; }`,
    `    if(n.star!==undefined){ var si=GLYPHS.indexOf('star'); if(si>=0) gi=si; }`);

sub(`    var gi=GLYPHS.indexOf('minor'); if(gi<0) gi=1;`,
    `    var gi=GLYPHS.indexOf('star'); if(gi<0) gi=1;`);

console.log(n + ' edits applied');
