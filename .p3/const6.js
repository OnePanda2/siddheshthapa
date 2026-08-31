/* Two things the render showed that the checks could not.

   1. SERIOUS vs ABSURD rendered with the contradiction glyph — an outlined
      ellipse holding two dots. Among stars that reads as a UI chip, exactly the
      vocabulary §18 forbids. In a constellation world every object IS a star;
      what kind of object it is comes from its label tier and the DOM, not from
      a pictogram.

   2. The 42 background stars were so faint the negative space read as blank
      rather than as sky, which is what makes a constellation a constellation. */
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
`    var gi=glyphIndex(n);
    if(n.t==='mig'){`,
`    var gi=glyphIndex(n);
    /* in a constellation every object is a star — the kind of object is carried
       by the label tier and the sheet, never by a pictogram among stars */
    if(n.star!==undefined){ var si=GLYPHS.indexOf('minor'); if(si>=0) gi=si; }
    if(n.t==='mig'){`);

sub(`    EMPH[i]=0.42;                                // tertiary, and it must stay there`,
    `    EMPH[i]=0.60;                                // tertiary, and it must stay there`);

sub(`    SZ[i]=11+Math.max(0,(6.0-b.vMag))*5.2;
    CAP[i]=22;                                   // never a body, always a backdrop`,
    `    SZ[i]=13+Math.max(0,(6.0-b.vMag))*6.0;
    CAP[i]=27;                                   // never a body, always a backdrop`);

console.log(n + ' edits applied');
