/* worldframemutate.js — break the world framing on purpose and require
   worldframecheck to notice. Same rule as everywhere else: an anchor that
   does not match is UNVERIFIED, and an assertion that survives its own
   mutation gets fixed rather than the mutation.

   usage: node tools/worldframemutate.js [WF7] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const M = [
  { id:'WF1', why:'stop measuring the world and frame it from a constant instead',
    find:'  return b.radius/Math.max(0.001,Math.min(tanV,tanH));',
    repl:'  return 0;' },

  { id:'WF2', why:'ignore the fit entirely, so a world is framed by its preference alone',
    find:'  var d=Math.max(preferred, need);',
    repl:'  var d=preferred*0.35;' },

  { id:'WF3', why:'pretend the sheet is not there, so the safe area becomes the window',
    find:'    var safe={ x0:phone?8:Math.round(W*0.27), x1:W-8,\n               y0:8, y1:phone?Math.round(H*0.40):H-8 };',
    repl:'    var safe={ x0:0, x1:W, y0:0, y1:H };' },

  { id:'WF4', why:'give the phone the desktop’s framing instead of its own',
    find:'    var kc=CONSTELLATIONS[id], phoneC=window.innerWidth<768;',
    repl:'    var kc=CONSTELLATIONS[id], phoneC=false;' },

  { id:'WF5', why:'pull Philosophy back until its dense composition flattens',
    find:'                 : type===\'planetary\'     ? 0.66',
    repl:'                 : type===\'planetary\'     ? 2.40' },

  { id:'WF6', why:'pull Love back until Kepler-16 is two dots on an empty page',
    find:'                 : type===\'circumbinary\'  ? 0.55',
    repl:'                 : type===\'circumbinary\'  ? 2.60' },

  /* Observation is whole partly because the constellation's own preferred
     distance is nearly enough on a desktop — the fit adds about 12%. So the
     mutation that matters is not "move the camera" but "take the guarantee
     away": with no fit, the figure is left resting on a coincidence. */
  { id:'WF7', why:'remove the fit so the constellation is whole only by luck',
    find:'  var need=moves ? fitDistance(migId)*bias\n                 : Math.max(fitDistance(migId)*bias, fitDistance(migId,true));',
    repl:'  var need=0;' },

  { id:'WF8', why:'leave the selected world’s camera driving after the return',
    find:'  var wantOpen = (mode===\'universe\' && !id) ? 0 : 1;',
    repl:'  var wantOpen = 1;' }
];

const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const original = fs.readFileSync(APP, 'utf8');
let bad = 0;
if (DRY) {
  M.forEach(m => {
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.id + '  "' + m.find.slice(0, 60) + '"'); }
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
      console.log('BAD  ' + m.id.padEnd(5) + ' anchor matched ' + hits + ' times — UNVERIFIED');
      continue;
    }
    fs.writeFileSync(APP, original.replace(m.find, m.repl), 'utf8');
    execSync('node tools/build-v02.js', { stdio: 'pipe' });
    let failed = false, line = '';
    try {
      execSync('node tools/worldframecheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
    } catch (e) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      const f = out.split('\n').filter(l => /^\s*FAIL/.test(l));
      line = f.length ? f.map(l => l.trim().split(/\s+/)[1]).join(',') : 'crashed';
    }
    if (failed && (line === 'crashed' || line.split(',').indexOf(m.id) >= 0)) {
      verified++;
      console.log('OK   ' + m.id.padEnd(5) + ' ' + m.why + '  →  caught by ' + line);
    } else {
      bad++;
      console.log('BAD  ' + m.id.padEnd(5) + ' ' + m.why);
      console.log('     ' + (failed ? 'a DIFFERENT assertion failed (' + line + ') — ' + m.id + ' still proves nothing'
                                    : 'CHECK DID NOT FAIL — the assertion proves nothing'));
    }
  }
} finally {
  fs.writeFileSync(APP, original, 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}
console.log('\n' + verified + '/' + list.length + ' world-framing assertions mutation-verified');
process.exit(bad ? 1 : 0);
