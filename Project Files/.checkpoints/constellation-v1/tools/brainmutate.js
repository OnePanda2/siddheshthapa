/* brainmutate.js — break the line brain on purpose, one property at a time,
   and require braincheck to notice.

   A mutation that does not apply is UNVERIFIED, not a pass. A mutation that
   applies and leaves the suite green means the assertion proves nothing, and
   the assertion is what gets fixed — never the mutation.

   usage: node tools/brainmutate.js [B9]   one assertion
          node tools/brainmutate.js --dry  check every anchor still exists
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const M = [
  { id:'B1', why:'stop emitting the anatomy, leaving nothing but the graph',
    find:'    buildBrainCurves(BRAIN_VIEW, phoneLine?0.5:1).forEach(function(c){',
    repl:'    [].forEach(function(c){' },

  { id:'B2', why:'flatten the drawing onto a plane so it wraps no volume',
    find:'  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.80, z*r);',
    repl:'  var p=new THREE.Vector3(x*brainWidth(y,z)*0.01, y*r*0.80, z*r);' },

  { id:'B3', why:'swing the camera to a three-quarter view',
    find:'var BRAIN_VIEW=new THREE.Vector3(1.0,0.125,0.105).normalize();',
    repl:'var BRAIN_VIEW=new THREE.Vector3(1.0,0.62,0.95).normalize();' },

  { id:'B4', why:'push the camera in until the drawing is cropped',
    find:'    var k=(phoneB2?6.20:2.78)*(1+WELCOME_DIM*0.13);',
    repl:'    var k=(phoneB2?6.20:0.85)*(1+WELCOME_DIM*0.13);' },

  { id:'B5', why:'draw the far hemisphere exactly like the near one',
    find:`  curves.push({ id:'far-ghost', layer:'E', w:0.44, pts:silhouettePoints(viewDir,-1) });`,
    repl:`  BRAIN_CURVES.forEach(function(c){\n    curves.push({ id:'far-ghost', layer:'C', w:c.w, pts:curvePoints(c,-1) });\n  });` },

  { id:'B6', why:'close the longitudinal fissure so the hemispheres fuse',
    find:'var BRAIN_GAP=0.055;',
    repl:'var BRAIN_GAP=0.0;' },

  { id:'B7', why:'take the frontal lobe away, leaving the back the fullest end',
    find:'var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,',
    repl:'var BRAIN_PROFILE=[0.70,0.72,0.74,0.76,0.78,' },

  { id:'B8', why:'lift the temporal sulci above the Sylvian fissure',
    find:`  { id:'superior-temporal', layer:'C', w:0.80,`,
    repl:`  { id:'superior-temporal', layer:'C', w:0.80, uv:[[0.42,0.39],[0.24,0.36],[0.04,0.30]] },\n  { id:'unused-temporal', layer:'C', w:0.80,` },

  { id:'B9', why:'remove the cerebellum, notch and folia together',
    find:'                   0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];',
    repl:'                   0.85,0.75,0.75,0.75,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];' },

  { id:'B10', why:'replace the designed outline with a plain ellipse',
    find:'var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,1.07,1.05,1.02,0.99,0.96,0.93,0.89,\n                   0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];',
    repl:'var BRAIN_PROFILE=[1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,\n                   1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00];' },

  { id:'B11', why:'fix a weak shape by adding curves, the exact failure the brief bans',
    find:'  var minW = (detail>=1) ? 0 : 0.62;',
    repl:'  var minW = (detail>=1) ? 0 : 0.62;\n  for(var q=0;q<40;q++) curves.push({ id:"filler-"+q, layer:"C", w:0.4,\n    pts:curvePoints(BRAIN_CURVES[q%BRAIN_CURVES.length],1) });' },

  /* the layers share one buffer, so the way to merge them is to stop
     distinguishing them: emit the anatomy under the relationship's kind. */
  { id:'B12', why:'collapse the anatomy into the relationship layer',
    find:'            kinds.push(L.kind);',
    repl:'            kinds.push(1);' },

  /* leaves every named landmark in place, so it isolates the claim B13 makes:
     that NOTHING in the drawing is derived from a relationship. Renaming the
     landmarks instead would break B6 and B7 first and prove nothing about B13. */
  { id:'B13', why:'let relationships contribute curves to the anatomy',
    find:'  return curves;\n}\n',
    repl:'  for(var z=0;z<5;z++) curves.push({ id:"rel-"+z, layer:"C", w:0.5,\n    pts:curvePoints(BRAIN_CURVES[z],1) });\n  return curves;\n}\n' },

  { id:'B14', why:'let the threshold render the drawing at full strength',
    find:'      var wantDim=(entered?0:1);',
    repl:'      var wantDim=0;' },

  { id:'B15', why:'leave the world camera driving after the return',
    find:'  var wantOpen = (mode===\'universe\' && !id) ? 0 : 1;',
    repl:'  var wantOpen = 1;' },

  { id:'B16', why:'drop a region out of the brain',
    find:'MIGS.forEach(function(m,i){\n  if(!m.uPos) return;\n  var N=MIGS.length,',
    repl:'MIGS.forEach(function(m,i){\n  if(!m.uPos || i===3) return;\n  var N=MIGS.length,' },

  { id:'B17', why:'drop a region out of the menu',
    find:`    var rows=[].slice.call(document.querySelectorAll('#groups [data-nav]'))
               .map(function(b){ return b.getAttribute('data-nav'); });`,
    repl:`    var rows=[].slice.call(document.querySelectorAll('#groups [data-nav]'))
               .map(function(b){ return b.getAttribute('data-nav'); }).slice(1);` },

  { id:'B18', why:'make one MIG the child of another',
    find:'var BRAIN_SPREAD=0.46;',
    repl:'MIGS.forEach(function(mm){ if(mm.id==="love") mm.mig="philosophy"; });\nvar BRAIN_SPREAD=0.46;' },

  { id:'B19', why:'invent a source for a world that has none',
    find:`  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';`,
    repl:`  if(p.worldType==='latent' || !p.astronomyTemplate) return 'HR 8799';` },

  { id:'B20', why:'let visiting a world rewrite the anatomy behind it',
    find:'  BRAIN_CURVES.forEach(function(c){\n    if(c.w < minW) return;',
    repl:'  BRAIN_CURVES.forEach(function(c){\n    if(c.w < minW) return;\n    if(typeof state!=="undefined" && state.region) return;' }
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
      execSync('node tools/braincheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
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
        ? 'the page CRASHED — a crash is not the assertion catching anything'
        : failed ? 'a DIFFERENT assertion failed (' + line + ') — ' + m.id + ' still proves nothing'
                 : 'CHECK DID NOT FAIL — the assertion proves nothing'));
    }
  }
} finally {
  fs.writeFileSync(APP, original, 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}
console.log('\n' + verified + '/' + list.length + ' brain assertions mutation-verified');
process.exit(bad ? 1 : 0);
