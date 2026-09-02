/* travelmutate.js — break the travel on purpose and require travelcheck to
   notice. Same rule as everywhere else: an anchor that does not match is
   UNVERIFIED, a crash is not a catch, and an assertion that survives its own
   mutation gets fixed rather than the mutation.

   usage: node tools/travelmutate.js [T3] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const M = [
  { id:'T1', why:'make the app believe motion is reduced, so nothing ever animates',
    find:'var reduced=window.matchMedia&&',
    repl:'var reduced=true||window.matchMedia&&' },

  { id:'T2', why:'stop a region selection from opening the mind at all',
    find:"  var wantOpen = (mode==='universe' && !id) ? 0 : 1;",
    repl:"  var wantOpen = 0;" },

  /* THE BUG. Restoring the guard that discarded a selection made during a
     transition is the whole reason this suite exists. */
  { id:'T3', why:'restore the guard that discarded a selection made mid-transition',
    find:`  var needsMorph = entered &&
    (MORPH_ON ? (wantOpen!==MORPH_TO) : (wantOpen!==mindOpen));`,
    repl:`  var needsMorph = entered && !MORPH_ON && wantOpen!==mindOpen;` },

  { id:'T4', why:'retarget from a standing start instead of from where it had got to',
    find:'    else { MORPH_FROM=mindOpen; MORPH_TO=wantOpen; MORPH_ON=true; morphT=0; morphStart=0; }',
    repl:'    else { MORPH_FROM=0; MORPH_TO=wantOpen; MORPH_ON=true; morphT=0; morphStart=0; }' },

  { id:'T5', why:'cut to the world instead of travelling to it',
    find:'var FLIGHT_MIN=48;',
    repl:'var FLIGHT_MIN=1e9;' },

  { id:'T6', why:'let a world push the camera absurdly far from itself',
    find:"                 : type==='planetary'     ? 0.66",
    repl:"                 : type==='planetary'     ? 12.0" },

  { id:'T7', why:'frame every world so close that its own bodies fall off screen',
    find:'  var d=Math.max(preferred, need);',
    repl:'  var d=Math.max(preferred, need)*0.22;' },

  { id:'T8', why:'never close the mind again once it has opened',
    find:"  var wantOpen = (mode==='universe' && !id) ? 0 : 1;",
    repl:"  var wantOpen = 1;",
    alt:true },

  /* THE SECOND BUG THIS SUITE EXISTS FOR. Framing from the departure fold
     instead of the destination fold sends the camera to where the world was
     before it unfolded — inside the brain. Everything except LOVE lands off
     screen, and LOVE only survives because its branch frames from a snapshot
     rather than from the live n.pos. */
  { id:'T9', why:'frame each world where it was before unfolding, not where it arrives',
    find:'  var f=frameForAt(mode, id||state.region, wantOpen);',
    repl:'  var f=frameFor(mode, id||state.region);' },

  /* THE PHONE HALF. The generic branch is the one twelve regions take, and on
     a phone the sheet is below rather than beside — so removing its lift puts
     those twelve back under the panel while the desktop stays perfect. */
  { id:'T11', why:'stop lifting the generic worlds on a phone, putting them under the sheet',
    find:'    if(upS.lengthSq()>1e-6) aimN.addScaledVector(upS.normalize(), -dOut*0.22);',
    repl:'    if(upS.lengthSq()>1e-6) aimN.addScaledVector(upS.normalize(), 0.0);' },

  { id:'T10', why:'append an empty section unchecked, so a region with nothing in it throws',
    find:"    put(group('Concepts', mem.filter(function(id){return byId[id].t==='minor';})",
    repl:"    elGroups.appendChild(group('Concepts', mem.filter(function(id){return byId[id].t==='minor';})" },

  /* BOTH GUARDS AT ONCE, because either one alone is sufficient and a
     mutation that removes only one proves nothing — both were tried
     separately first, and T12 survived both times.

     Restoring the second line grows every region name from 13px back to 22px;
     no longer seeding the sheet leaves the layout believing the panel is
     empty screen. Together they are the state the phone was actually in when
     SOCIETY's name ran twelve pixels under the sheet with the line naming its
     system cut in half. Redundant guards are worth keeping — a mutation that
     pretends to test one of them is not. */
  { id:'T12', why:'put the second line back AND let the layout treat the sheet as empty space',
    steps:[
      { find:'    var wantSrc = window.innerWidth >= 768;',
        repl:'    var wantSrc = true;' },
      { find:`    done.push({ x:shR.left+shR.width/2, y:shR.top+shR.height/2,
                hw:shR.width/2, hh:shR.height/2 });`,
        repl:'    void 0;' }
    ] }
];

/* one anchor or several — a mutation may need to restore a state that more
   than one guard independently prevents */
M.forEach(m => { if (!m.steps) m.steps = [{ find: m.find, repl: m.repl }]; });

/* T2 and T8 share an anchor, so T8 carries a marker and is applied by index */
const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const original = fs.readFileSync(APP, 'utf8');
let bad = 0;
if (DRY) {
  M.forEach(m => {
    m.steps.forEach(s => {
      const hits = original.split(s.find).length - 1;
      if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.id + '  "' + s.find.slice(0, 58) + '"'); }
    });
  });
  console.log(bad ? '\n' + bad + ' BAD ANCHOR(S) of ' + M.length
                  : '\nall ' + M.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

let verified = 0;
try {
  for (const m of list) {
    let mutated = original, miss = 0;
    for (const s of m.steps) {
      const hits = mutated.split(s.find).length - 1;
      if (hits !== 1) {
        miss++;
        console.log('BAD  ' + m.id.padEnd(4) + ' anchor matched ' + hits + ' times — UNVERIFIED');
        break;
      }
      mutated = mutated.replace(s.find, s.repl);
    }
    if (miss) { bad++; continue; }
    fs.writeFileSync(APP, mutated, 'utf8');
    execSync('node tools/build-v02.js', { stdio: 'pipe' });
    let failed = false, line = '';
    try {
      execSync('node tools/travelcheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
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
console.log('\n' + verified + '/' + list.length + ' travel assertions mutation-verified');
process.exit(bad ? 1 : 0);
