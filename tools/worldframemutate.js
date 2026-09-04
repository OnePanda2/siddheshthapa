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
    find:'  var d=b.radius/Math.max(0.001,Math.min(tanV,tanH));',
    repl:'  var d=0;' },

  { id:'WF2', why:'ignore the fit entirely, so a world is framed by its preference alone',
    find:'  var d=Math.max(preferred, need);',
    repl:'  var d=preferred*0.35;' },

  { id:'WF3', why:'pretend the sheet is not there, so the safe area becomes the window',
    find:'    var safe={ x0:phone?8:Math.round(shR?shR.right+8:W*0.27), x1:W-8,\n               y0:8, y1:phone?Math.round(shR?shR.top-8:H*0.40):H-8 };',
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
    find:'  var need=moves ? fitRef*bias + extra\n                 : Math.max(fitRef*bias + extra, fitAll);',
    repl:'  var need=0;' },

  /* NARROW LAPTOPS. Two separate assumptions that the sheet is a constant
     FRACTION of the window rather than a fixed 380px panel. */
  { id:'WF9', why:'compose every world against the window instead of against the sheet',
    find:'  if(shiftPx<1) return f;',
    repl:'  if(shiftPx>=0) return f;' },

  { id:'WF10', why:'reserve a constant fraction for a panel whose width is fixed',
    find:'    if(shB && vpW>0) safeW=Math.min(safeW, Math.max(0.30, 1-(shB.right/vpW)-0.06));',
    repl:'    if(shB && vpW>0) safeW=safeW;' },

  /* Spending the cropping allowance on the panel as well as on the world is
     caught by WF10, not WF11: with the shift at its current strength
     PHILOSOPHY holds 7/8 either way, and it is LOVE that drops to 3/5. Each
     mutation is filed under the assertion that actually catches it. */
  { id:'WF10', why:'spend the cropping allowance on the panel as well as on the world',
    find:'  var need=moves ? fitRef*bias + extra\n                 : Math.max(fitRef*bias + extra, fitAll);',
    repl:'  var need=moves ? fitRead*bias : Math.max(fitRead*bias, fitAll);' },

  /* PER-WORLD BIAS. WF11 is about how far the composition is pushed clear of
     the panel: the shift has to satisfy every bar in WF9 while still costing
     PHILOSOPHY a concept that a wide window keeps.

     THIS WAS 0.16 AND HAD STOPPED BITING. Other framing work moved the margins
     until a shift that once cost PHILOSOPHY a concept cost it nothing, and
     WF11 was reported as surviving. The assertion had not gone soft; the
     mutation had. Rather than guess a new number, the value was swept and the
     assertions that fired at each step recorded:

       0.16   survives — nothing fails
       0.15   WF11 alone
       0.14   WF11 alone
       0.13   WF9 and WF11
       0.12   WF9 and WF11
       0.08   WF9, WF10 and WF11
       0.00   WF9, WF10 and WF11

     0.15 is the strongest mutation that still bites, and it lands inside the
     narrow band where WF11 fails BY ITSELF — which is what this mutation was
     always for. Below 0.14 the shift is weak enough that WF9's bar goes too,
     and a mutation tripping three assertions cannot tell you which one is
     doing the work.

     One methodological note, because it nearly produced a wrong conclusion:
     the first sweep of these values silently edited nothing, and every run
     re-tested the same number while appearing to test six. The identical
     results read as a finding — "no value isolates WF11" — when they were an
     artefact of a regex that did not match. The setter now verifies the file
     changed and refuses to run if it did not. A sweep that cannot prove it
     varied its variable is not a measurement. */
  { id:'WF11', why:'push the composition only far enough to satisfy the bar, not far enough to keep the world whole',
    find:'  var shiftPx=Math.max(Wpx/2, panelR+0.20*Wpx)-Wpx/2;',
    repl:'  var shiftPx=Math.max(Wpx/2, panelR+0.15*Wpx)-Wpx/2;' },

  /* THIS MUTATION LOST ITS SUBJECT AND WENT ON BEING APPLIED. WF12 frames
     "whichever world is latent", written that way so that charting a region
     could never empty it — but giving MUSIC, PSYCHOLOGY and ART their systems
     left no latent world at all, and a check with nothing to measure cannot be
     made to fail by breaking the measurement.

     A latent world is one with a shape and nothing in it yet, so the mutation
     makes one: ART is stripped of HD 40307, exactly as a topic added tomorrow
     would arrive. Only then is the framing broken. The claim being verified is
     unchanged and is the one that matters — a world with nothing in it is
     framed by its own size and not by a constant — and it is now verified
     against a world that actually exists while the mutation runs. */
  { id:'WF12', why:'frame a latent world from a constant instead of from its own size',
    also:{ find:"'music':'Kepler-80', 'psychology':'Kepler-62', 'art':'HD 40307' };",
           repl:"'music':'Kepler-80', 'psychology':'Kepler-62' };" },
    find:'    out.normalize().multiplyScalar(fwG.d);\n    dOut=fwG.d;',
    repl:'    out.normalize().multiplyScalar(dOut);' },

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
    if (m.also) {
      const h2 = original.split(m.also.find).length - 1;
      if (h2 !== 1) { bad++; console.log('  x' + h2 + '  ' + m.id + ' (precondition)  "' + m.also.find.slice(0, 46) + '"'); }
    }
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
    let mutated = original;
    if (m.also) {
      const h2 = mutated.split(m.also.find).length - 1;
      if (h2 !== 1) {
        bad++;
        console.log('BAD  ' + m.id.padEnd(5) + ' precondition anchor matched ' + h2 + ' times — UNVERIFIED');
        continue;
      }
      mutated = mutated.replace(m.also.find, m.also.repl);
    }
    fs.writeFileSync(APP, mutated.replace(m.find, m.repl), 'utf8');
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
