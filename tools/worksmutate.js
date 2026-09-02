/* worksmutate.js — break the manual on purpose and require workscheck to
   notice. Same rule as everywhere else in this project: an anchor that does
   not match is UNVERIFIED, a crash is not a catch, and an assertion that
   survives its own mutation gets fixed rather than the mutation.

   Unlike the other mutation suites this one spans FOUR files — the manual, the
   app, the shell and the content — because the manual's guarantees are spread
   across all of them. A rule that keeps the page from scrolling sideways lives
   in CSS; a rule that keeps content from being restated lives in JSON.

   usage: node tools/worksmutate.js [W4] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const APP   = 'src/v02-app.js';
const WORKS = 'src/v02-works.js';
const SHELL = 'src/v02-shell.html';
const DATA  = 'data/works.json';

const M = [
  { id:'W1', why:'let the region and its concepts count as works', file:WORKS,
    find:"  return n.mig === 'my-works' && n.t !== 'mig' && n.t !== 'minor';",
    repl:"  return n.mig === 'my-works';" },

  /* THE RULE THE WHOLE ARCHITECTURE RESTS ON. One restated field and the
     manual has started keeping its own copy of what the graph declares. */
  { id:'W2', why:'restate a label the graph already owns', file:DATA,
    find:'      "node": "p-cotsi",',
    repl:'      "node": "p-cotsi",\n      "label": "COTSI",' },

  { id:'W3', why:'type the sheet count instead of deriving it from the graph', file:WORKS,
    find:"  plate.appendChild(el('span', null, 'Sheet ' + pad(idx + 1) + ' of ' + pad(SHEETS.length)));",
    repl:"  plate.appendChild(el('span', null, 'Sheet ' + pad(idx + 1) + ' of 09'));" },

  /* the band of night is the only route back into the mind, and the only
     part of a sheet nobody authored. Inventing one entry is the failure it
     exists to prevent. */
  { id:'W4', why:'invent a relationship the graph does not declare', file:WORKS,
    find:"function seeAlso(id){\n  var out = [];",
    repl:"function seeAlso(id){\n  var out = [{ id:'curiosity', node:byId['curiosity'], verb:'inspired by', gloss:'', outbound:true }];" },

  { id:'W5', why:'render an undocumented work as an empty sheet', file:WORKS,
    find:"function renderReserved(n){\n  var box = el('div', 'wk-col');",
    repl:"function renderReserved(n){\n  if(n) return;\n  var box = el('div', 'wk-col');" },

  { id:'W6', why:'let the drawing drift from its own parts list', file:WORKS,
    find:"'<text x=\"518\" y=\"58\" font-size=\"9\" fill=\"#9a2a1f\">04</text></g>',",
    repl:"'<text x=\"518\" y=\"58\" font-size=\"9\" fill=\"#9a2a1f\">07</text></g>'," },

  { id:'W7', why:'keep the scene running behind the manual', file:APP,
    find:"function scenePaused(){ return !!readingId || WORKS_OPEN; }",
    repl:"function scenePaused(){ return !!readingId; }" },

  { id:'W8', why:'leave the threshold and the region sheet reachable behind the manual',
    file:SHELL,
    find:"body.works-open .ctl{display:none}",
    repl:"body.works-open .ctl{opacity:.999}" },

  { id:'W9', why:'make Escape drop out of the manual instead of stepping back', file:WORKS,
    find:"  if(wkView && wkView !== 'contents') renderContents();\n  else closeWorks();",
    repl:"  closeWorks();" },

  /* Let the drawing push the whole page sideways. The figure is 520px at its
     narrowest and the phone is not, so without its own scroll container the
     body itself starts scrolling — which is the rule W10 exists for.

     NOT the minmax(0,1fr) fix on the contents grid: that stays in the CSS as
     a guard, but Chrome will not open a window narrower than about 500px and
     the row does not overflow at that width, so no mutation of it can be made
     to fail here. It is a measurement W10 takes, not a claim it verifies. */
  { id:'W10', why:'let the drawing push the whole page sideways instead of scrolling itself',
    file:SHELL,
    find:".wk-figscroll{overflow-x:auto}",
    repl:".wk-figscroll{overflow-x:visible}" }
];

const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const FILES = [APP, WORKS, SHELL, DATA];
const original = {};
FILES.forEach(f => { original[f] = fs.readFileSync(f, 'utf8'); });

/* IS THE TREE ALREADY BROKEN?

   A mutation run restores its files in a `finally`, which does not run if the
   process is killed. That happened: an interrupted run left W4's fabricated
   relationship in src/v02-works.js, the artifact was rebuilt from it, and the
   only reason it surfaced was that W4's anchor then matched zero times — the
   failure reported itself as a bad anchor rather than as a poisoned baseline.

   So before mutating anything, look for our own replacements in the source. If
   one is there, every later measurement would be taken against a corrupted
   baseline, and the honest thing is to refuse to run. */
const contaminated = M.filter(m => original[m.file].indexOf(m.repl) >= 0);
if (contaminated.length) {
  console.error('REFUSING TO RUN — a previous run did not clean up after itself.\n');
  contaminated.forEach(m => console.error('  ' + m.id + '  ' + m.file +
    '\n      still contains: ' + m.repl.split('\n')[0].trim().slice(0, 72)));
  console.error('\nRestore those lines before mutating anything: every measurement\n' +
                'taken now would be against a baseline that is already wrong.');
  process.exit(1);
}

let bad = 0;
if (DRY) {
  M.forEach(m => {
    const hits = original[m.file].split(m.find).length - 1;
    if (hits !== 1) {
      bad++;
      console.log('  x' + hits + '  ' + m.id + '  ' + m.file + '  "' + m.find.slice(0, 46) + '"');
    }
  });
  console.log(bad ? '\n' + bad + ' BAD ANCHOR(S) of ' + M.length
                  : '\nall ' + M.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

let verified = 0;
try {
  for (const m of list) {
    const hits = original[m.file].split(m.find).length - 1;
    if (hits !== 1) {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' anchor matched ' + hits + ' times — UNVERIFIED');
      continue;
    }
    fs.writeFileSync(m.file, original[m.file].replace(m.find, m.repl), 'utf8');
    let failed = false, line = '';
    try {
      execSync('node tools/build-v02.js', { stdio: 'pipe' });
      execSync('node tools/workscheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
    } catch (e) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      const f = out.split('\n').filter(l => /^\s*FAIL/.test(l));
      line = f.length ? f.map(l => l.trim().split(/\s+/)[1]).join(',') : 'crashed';
    }
    if (failed && line !== 'crashed' && line.split(',').indexOf(m.id) >= 0) {
      verified++;
      console.log('OK   ' + m.id.padEnd(4) + ' ' + m.why + '  →  caught by ' + line);
    } else {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' ' + m.why);
      console.log('     ' + (line === 'crashed'
        ? 'the suite CRASHED rather than failing — a crash is not a catch'
        : (failed ? 'a DIFFERENT assertion failed (' + line + ') — ' + m.id + ' still proves nothing'
                  : 'CHECK DID NOT FAIL — the assertion proves nothing')));
    }
    FILES.forEach(f => fs.writeFileSync(f, original[f], 'utf8'));
  }
} finally {
  FILES.forEach(f => fs.writeFileSync(f, original[f], 'utf8'));
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}

console.log('\n' + verified + '/' + list.length + ' manual assertions mutation-verified');
process.exit(bad ? 1 : 0);
