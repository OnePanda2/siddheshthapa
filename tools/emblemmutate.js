/* emblemmutate.js — break the emblems on purpose and require emblemcheck to
   notice. Same rule as everywhere else in this project: an anchor that does not
   match is UNVERIFIED, a crash is not a catch, and an assertion that survives
   its own mutation gets fixed rather than the mutation.

   E2, E3 and E6 restore the two halves of the bug the user reported twice, so
   these three are the ones that matter most: if they ever stop biting, the
   suite has stopped protecting anything.

   usage: node tools/emblemmutate.js [E4] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const M = [
  /* Moving the vertex in the position buffer is NOT enough to hide a region:
     the morph rewrites every position each frame, so the edit is undone before
     anything is drawn. Denying the region a place in the mind at all is what
     actually takes it off the screen. */
  { id:'E1', why:'stop placing a region in the mind, so one emblem is nowhere on screen',
    find: '  if(!m.uPos) return;\n  var N=MIGS.length,',
    repl: '  if(!m.uPos || i===7) return;\n  var N=MIGS.length,' },

  /* THE BUG, first half. Without the lift the navigation targets are drawn
     dimmer than the constellation's own decoration. */
  { id:'E2', why:'remove the luminance lift, leaving emblems dimmer than the decoration',
    find: "      '  vTint=min(tint*mix(3.4, 1.0, mindOpen), vec3(1.0));',",
    repl: "      '  vTint=tint;'," },

  /* THE BUG, second half. OBSERVATION alone was zeroed unconditionally, so one
     region sat dark while the other fourteen were fine — which is exactly the
     shape E3 exists to catch. */
  { id:'E3', why:'zero one region everywhere instead of only inside its own world',
    find: "      '  here *= (1.0 - noCentre*mindOpen);',",
    repl: "      '  here *= (1.0 - noCentre);'," },

  /* The cheap way to pass a brightness floor. This must NOT be allowed to look
     like a fix. */
  { id:'E4', why:'buy brightness by washing every region to the same pale dot',
    find: "      '  vTint=min(tint*mix(3.4, 1.0, mindOpen), vec3(1.0));',",
    repl: "      '  vTint=vec3(1.0);',",
    alt:true },

  { id:'E5', why:'drain every central star once its world opens',
    find: "      '  here *= (1.0 - noCentre*mindOpen);',",
    repl: "      '  here *= (1.0 - mindOpen);',",
    alt:true },

  /* The opposite failure, and the reason E2 is not simply "make every centre
     bright": fabricating a star at the middle of Ursa Major. */
  { id:'E6', why:'invent a central star at the middle of a constellation that has none',
    find: "      '  here *= (1.0 - noCentre*mindOpen);',",
    repl: "      '  here *= 1.0;',",
    alt:true }
];

const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const original = fs.readFileSync(APP, 'utf8');
let bad = 0;
if (DRY) {
  M.forEach(m => {
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.id + '  "' + m.find.slice(0, 58) + '"'); }
  });
  console.log(bad ? '\n' + bad + ' BAD ANCHOR(S) of ' + M.length
                  : '\nall ' + M.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

let verified = 0;
try {
  for (const m of list) {
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' anchor matched ' + hits + ' times — UNVERIFIED');
      continue;
    }
    fs.writeFileSync(APP, original.replace(m.find, m.repl), 'utf8');
    execSync('node tools/build-v02.js', { stdio: 'pipe' });
    let failed = false, line = '';
    try {
      execSync('node tools/emblemcheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
    } catch (e) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      const f = out.split(/[\r\n]+/).filter(l => /^\s*FAIL/.test(l));
      line = f.length ? f.map(l => l.trim().split(/\s+/)[1]).join(',') : 'crashed';
    }
    if (failed && line !== 'crashed' && line.split(',').indexOf(m.id) >= 0) {
      verified++;
      console.log('OK   ' + m.id.padEnd(4) + ' ' + m.why + '  →  caught by ' + line);
    } else {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' ' + m.why);
      console.log('     ' + (line === 'crashed'
        ? 'the page CRASHED — a crash is not the assertion catching anything'
        : failed ? 'a DIFFERENT assertion failed (' + line + ') — ' + m.id + ' still proves nothing'
                 : 'CHECK DID NOT FAIL — the assertion proves nothing'));
    }
  }
} finally {
  fs.writeFileSync(APP, original, 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}
console.log('\n' + verified + '/' + list.length + ' emblem assertions mutation-verified');
process.exit(bad ? 1 : 0);
