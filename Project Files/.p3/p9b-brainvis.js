/* The brain rendered but did not READ as one.

   Cause: globalMix — the rule that decides when cross-region relationships
   resolve — is calibrated against the universe's radius, and the brain is a
   fifth the size. At the brain camera it evaluated to 0.008, so the 41 arcs
   that ARE the brain's structure drew at under 1%. The same class of fault as
   the localMix bug, in the other half of the same rule.

   Fixed inside the shared model rather than beside it: the reference is the
   scale of the mind you are actually looking at, and it moves with mindOpen.
   And the threshold is made more transparent, because the brain behind it is
   now worth seeing. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

edit('src/v02-app.js',
`    /* GLOBAL — unchanged, so cross-MIG arcs behave exactly as before */
    LU.globalMix.value=0.008+0.992*Math.max(0,Math.min(1,(430-camPos.length())/210));`,
`    /* GLOBAL — cross-MIG arcs, judged against the scale of the mind you are
       actually looking at. In the brain those arcs ARE the structure, so they
       are fully present; as the mind opens they hand over to the universe rule
       they always had. */
    var uniMix=0.008+0.992*Math.max(0,Math.min(1,(430-camPos.length())/210));
    LU.globalMix.value=(1-mindOpen)*0.92 + mindOpen*uniMix;`);

/* the counts must not be hardcoded — there are fifteen regions now */
edit('src/v02-app.js',
  `    elGloss.textContent='Fourteen regions of thinking, '+NODES.length+' objects, '+LINKS.length+`,
  `    elGloss.textContent=MIGS.length+' regions of thinking, '+NODES.length+' objects, '+LINKS.length+`);

edit('src/v02-app.js',
  `    say('The whole mind. Fourteen regions.');`,
  `    say('The whole mind. '+MIGS.length+' regions.');`);

/* let the brain show through the threshold */
edit('src/v02-shell.html',
  `  background:rgba(251,252,253,.90);transition:opacity 520ms ease,visibility 520ms}`,
  `  background:rgba(251,252,253,.62);transition:opacity 520ms ease,visibility 520ms}`);

console.log(n + ' edits applied');
