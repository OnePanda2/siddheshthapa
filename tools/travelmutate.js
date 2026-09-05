/* travelmutate.js — break the travel on purpose and require travelcheck to
   notice. Same rule as everywhere else: an anchor that does not match is
   UNVERIFIED, a crash is not a catch, and an assertion that survives its own
   mutation gets fixed rather than the mutation.

   usage: node tools/travelmutate.js [T3] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
/* A STEP MAY NAME ITS FILE. Everything here used to mutate the app alone,
   which put the entire stylesheet out of reach — and the composition this
   suite measures is half CSS. T12 is the case that forced it: no app-side edit
   can make the sheet climb into the region names, because the sheet's height
   on a phone is a max-height in the shell. */
const SHELL = 'src/v02-shell.html';
const FILES = [APP, SHELL];
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
  /* THE LINE THIS BREAKS CANNOT RUN ANY MORE, and the mutation went on being
     applied as though it could. frameForRaw answers a region from one of three
     early branches — constellation, circumbinary, planetary — and only falls
     through to the generic branch, where this lift lives, for a world with no
     system at all. Giving MUSIC, PSYCHOLOGY and ART their systems left no such
     world, so the lift became unreachable and removing it changed nothing.

     MEASURED, because "the guard stopped mattering" and "the assertion went
     soft" are the same pass/fail line and only a number tells them apart. At a
     true 390x844 the tightest world clears the sheet by 73px with the lift in
     place, and by 73px with it removed — not nearly the same, identical, which
     is the signature of dead code rather than of a redundant guard.

     So the mutation makes a generic world first: ART loses HD 40307 and falls
     through to the branch this lift belongs to, exactly as a topic added
     tomorrow would arrive. The claim is unchanged and worth keeping — a world
     with no system of its own is still lifted clear of the sheet on a phone —
     and it is now tested against a world that reaches the code being broken.

     Two steps rather than one, which this runner already supports: the first
     establishes the precondition, the second is the mutation proper. */
  { id:'T11', why:'stop lifting the generic worlds on a phone, putting them under the sheet',
    steps:[
      { find:"'music':'Kepler-80', 'books':'Kepler-62', 'art':'HD 40307',",
        repl:"'music':'Kepler-80', 'books':'Kepler-62'," },
      { find:'    if(upS.lengthSq()>1e-6) aimN.addScaledVector(upS.normalize(), -dOut*0.22);',
        repl:'    if(upS.lengthSq()>1e-6) aimN.addScaledVector(upS.normalize(), 0.0);' }
    ] },

  /* THE ANCHOR FOLLOWED ITS CODE. Concepts moved below Writings and the
     heading became a text-store key, so this matched nothing and the mutation
     silently stopped being run — the anchor audit is the only reason that was
     visible at all. The claim is unchanged: put() is what tolerates an empty
     group, and a call site that appends directly throws on a region that has
     nothing in it yet. */
  { id:'T10', why:'append an empty section unchecked, so a region with nothing in it throws',
    find:"    put(group(T('topic.concepts'), mem.filter(function(id){",
    repl:"    elGroups.appendChild(group(T('topic.concepts'), mem.filter(function(id){" },

  /* T12's TWO APP-SIDE GUARDS HAVE STOPPED BEING LOAD-BEARING, and this
     mutation was reported as surviving for that reason rather than because the
     assertion had gone soft. Measured at a true 390x844:

       both guards intact    SOCIETY clears the sheet by 33px
       both guards removed   SOCIETY clears the sheet by 29px

     Four pixels. The bug T12 was written for was SOCIETY twelve pixels UNDER
     the sheet, so the layout has moved some forty pixels away from that state
     and no removal of those two guards can get back to it. They are worth
     keeping — four pixels of margin is still margin — but a mutation that only
     removes them is asking whether four pixels can bury a name that has
     twenty-nine to spare.

     (Before this could even be measured, the runner had to be fixed: it asked
     for 390x844 and headless Chrome silently gave it 500x749, so every "phone"
     measurement in this suite was taken at 500px — a width where the defect
     cannot occur at all. travelcheck now renders the phone inside an iframe,
     which is the technique tools/viewport.js established for exactly this.)

     So the mutation now attacks what actually keeps the names clear: the size
     of the sheet itself. On a phone that is a max-height in the SHELL, which
     is why steps became file-aware. At 80vh the panel's top rises from y354 to
     roughly y169, well above where the names sit, and a check claiming no name
     is buried has to notice. The two app-side guards are kept in the mutation
     as well, so it still tests the state the phone was really in — the sheet
     is simply now large enough for that state to matter. */
  { id:'T12', why:'grow the sheet into the region names, and remove both guards that hold them clear',
    steps:[
      { find:'    var wantSrc = window.innerWidth >= 768;',
        repl:'    var wantSrc = true;' },
      { find:`    done.push({ x:shR.left+shR.width/2, y:shR.top+shR.height/2,
                hw:shR.width/2, hh:shR.height/2 });`,
        repl:'    void 0;' },
      { file:SHELL,
        find:'max-height:58vh',
        repl:'max-height:80vh' }
    ] }
];

/* one anchor or several — a mutation may need to restore a state that more
   than one guard independently prevents */
M.forEach(m => { if (!m.steps) m.steps = [{ find: m.find, repl: m.repl }]; });

/* T2 and T8 share an anchor, so T8 carries a marker and is applied by index */
const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const originals = {};
FILES.forEach(f => originals[f] = fs.readFileSync(f, 'utf8'));
let bad = 0;
if (DRY) {
  M.forEach(m => {
    m.steps.forEach(s => {
      const hits = originals[s.file || APP].split(s.find).length - 1;
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
    const work = {}; FILES.forEach(f => work[f] = originals[f]);
    let miss = 0;
    for (const s of m.steps) {
      const f = s.file || APP;
      const hits = work[f].split(s.find).length - 1;
      if (hits !== 1) {
        miss++;
        console.log('BAD  ' + m.id.padEnd(4) + ' anchor matched ' + hits +
                    ' times in ' + f + ' — UNVERIFIED');
        break;
      }
      work[f] = work[f].replace(s.find, s.repl);
    }
    if (miss) { bad++; continue; }
    FILES.forEach(f => { if (work[f] !== originals[f]) fs.writeFileSync(f, work[f], 'utf8'); });
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
  FILES.forEach(f => fs.writeFileSync(f, originals[f], 'utf8'));
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}
console.log('\n' + verified + '/' + list.length + ' travel assertions mutation-verified');
process.exit(bad ? 1 : 0);
