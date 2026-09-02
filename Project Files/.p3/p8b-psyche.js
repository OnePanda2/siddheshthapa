/* PSYCHOLOGY was added as a MIG but given no visual identity, so it fell
   through to the generic star — exactly the "undeclared fallback" the
   architecture forbids. It needs its own species, and the 5x5 atlas was
   already full at 25/25 (11 glyphs + 14 species), so the grid grows to 6x6.

   Its species has to say something true: this region exists and has not been
   written yet. Not an error state, not a placeholder box — a diffuse body that
   has not condensed into structure. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the grid grows */
edit('src/v02-app.js',
  `var CELL=128, ATLAS=5;   // 10 type forms + 14 MIG species, one texture`,
  `var CELL=128, ATLAS=6;   // 11 type forms + 15 MIG species, one texture`);

/* the species */
edit('src/v02-app.js',
  `  /* many minds forming one system: stable bodies sharing a gravity well */
  'society'     :{family:'assembly', branches:0, len:0.00, spread:0.00, rings:1, core:0.44}`,
  `  /* many minds forming one system: stable bodies sharing a gravity well */
  'society'     :{family:'assembly', branches:0, len:0.00, spread:0.00, rings:1, core:0.44},
  /* a region that exists and has not been written yet. Diffuse, uncondensed —
     not an empty box, but matter that has not yet become a body. */
  'psyche'      :{family:'nascent',  branches:0, len:0.00, spread:0.00, rings:0, core:0.30}`);

edit('src/v02-app.js',
  `    } else if(f==='constellation'){         // OBSERVATION: a figure, not an icon`,
  `    } else if(f==='nascent'){               // PSYCHOLOGY: present, unwritten
      /* wide and faint, with no centre yet — it reads as potential rather than
         as an object, which is the honest thing to draw for a region whose
         thinking has not been filed here. */
      core2(R*0.96,0.13); core2(R*0.66,0.10); core2(R*0.34,0.09);
    } else if(f==='constellation'){         // OBSERVATION: a figure, not an icon`);

/* the family is declared, not a surprise */
edit('tools/migvischeck.js',
  `               'constellation',`,
  `               'constellation','nascent',`);

console.log(n + ' edits applied');
