/* lovemutate.js — mutation harness for tools/lovecheck.js.
   Protocol: mutate · prove it applied · require the NAMED assertion to fail ·
   restore · require pass. A mutation that does not apply is not a pass, it is
   UNVERIFIED, and the run stops.
   Mutations target either the renderer or the astronomy data.
   usage: node tools/lovemutate.js [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', AST = 'data/astronomy-systems.json';
const ORIG = { [APP]: fs.readFileSync(APP, 'utf8'), [AST]: fs.readFileSync(AST, 'utf8') };

const MUTATIONS = [
  { n: 'L1', file: AST, name: 'the illustrative block is flagged as not astronomy',
    find: 'NOT ASTRONOMY. Chosen for rendering',
    repl: 'Chosen for rendering',
    expect: 'measured/derived/illustrative kept apart' },

  { n: 'L2', file: APP, name: 'the world really has a second stellar centre',
    find: "  COMPANIONS.push({ mig:mid, role:'starB',",
    repl: "  if(0) COMPANIONS.push({ mig:mid, role:'starB',",
    expect: 'TWO stellar centres' },

  { n: 'L3', file: APP, name: 'the stars are opposite, not merely two',
    find: "  return localOrbit(binaryRadius(b,which,phase), phase+(which?Math.PI:0), 0);",
    repl: "  return localOrbit(binaryRadius(b,which,phase), phase+(which?0.6:0), 0);",
    expect: 'diametrically opposite' },

  { n: 'L4', file: APP, name: 'the offsets come from the MEASURED mass ratio',
    find: "  var mu=1/(1+d.swingRatioBoverA);              // M_B / M_total",
    repl: "  var mu=0.5;                                   // an equal-mass guess",
    expect: 'MEASURED mass ratio' },

  { n: 'L5', file: APP, name: 'the hollow centre is the measured ratio',
    find: "  var aBin=R0/d.planetToBinaryRatio;            // scene units, from the ratio",
    repl: "  var aBin=R0/2.0;                              // a chosen gap",
    expect: 'measured planet/binary ratio' },

  { n: 'L6', file: APP, name: 'nothing orbits inside the stability radius',
    find: "    var out=[];\n    for(var k=0;k<Math.max(1,want||1);k++) out.push(R0*Math.pow(step,k));",
    repl: "    var out=[];\n    for(var k=0;k<Math.max(1,want||1);k++) out.push(R0*Math.pow(step,k)*(k?1:0.4));",
    expect: 'stability radius' },

  { n: 'L7', file: APP, name: 'star B never becomes an idea',
    find: "  COMPANIONS.push({ mig:mid, role:'starB',\n    pos:new THREE.Vector3().addVectors(b.centre, binaryOffset(b,1,b.phase)) });",
    repl: "  var fake={id:mid+'-starB',label:'STAR B',t:'minor',mig:mid,\n    pos:new THREE.Vector3().addVectors(b.centre, binaryOffset(b,1,b.phase))};\n  NODES.push(fake); byId[fake.id]=fake;\n  COMPANIONS.push({ mig:mid, role:'starB', pos:fake.pos });",
    expect: 'render-only' },

  /* the first attempt here — raising the primary's cap to 420 — did NOT merge
     the two lights, so it proved nothing and the run reported BAD. Two sharper
     mutations replace it: one hides star B, one puts it on top of star A. */
  { n: 'L8', file: APP, name: 'star B is actually visible on screen',
    find: "    EMPH[i]=1.30;",
    repl: "    EMPH[i]=0.015;                 // present in the buffer, invisible on screen",
    expect: 'two separated lights' },

  { n: 'L8b', assert: 'L8', file: APP, name: 'the two lights are actually SEPARATED',
    /* mutating the BUILD-TIME companion position proved nothing: travel
       recomputes star B every frame, so the mutation was overwritten before it
       could be measured. Target the value that actually reaches the screen. */
    find: "          var pB=binaryOffset(b,1,b.phase+binPhase);",
    repl: "          var pB=binaryOffset(b,0,b.phase+binPhase);   // land on star A",
    expect: 'two separated lights' },

  /* THIS MUTATION USED TO BE INERT, and L9 was reported as surviving it. It
     disabled the circumbinary branch — but disabling that branch changes
     nothing, because the generic path below it reproduces the same radii
     exactly. Kepler-16 has ONE measured planet, so the generic path maps that
     single axis and then pads with orbitSpacingStep, which is the identical
     rule the branch applies:

       circumbinary branch : 10, 13.1037, 17.170695, 22.499964
       generic + padding   : 10, 13.1037, 17.170695, 22.499964

     No assertion can catch a mutation that changes no output, so L9 was not
     weak — it was being asked an empty question. The branch became redundant
     at 523acdc, when the 55 Cnc work generalised the padding rule it had been
     the only user of. It is kept in the app because it states the Kepler-16
     case explicitly, not because anything depends on it.

     So the mutation now breaks the mechanism that DOES decide the geometry:
     the code that raises the declared step to each orbit's power. Spacing
     becomes linear, the ratios stop being constant, and a check claiming LOVE
     is geometric at the declared rate has to notice.

     It mutates the CODE and not the data on purpose. lovecheck reads the
     expected step from the data file, so moving the data would move the
     check's own expectation with it and the assertion would pass while the
     geometry was wrong — a check agreeing with a copy of the thing it is
     checking, which is the failure this whole suite exists to prevent. */
  { n: 'L9', file: APP, name: 'the two worlds are structurally different',
    find: "    for(var k=0;k<Math.max(1,want||1);k++) out.push(R0*Math.pow(step,k));",
    repl: "    for(var k=0;k<Math.max(1,want||1);k++) out.push(R0*(1+k));",
    expect: 'differ structurally' },

  { n: 'L10', file: AST, name: 'an illustrative number is never laundered into a measurement',
    find: "     \"eccentric\": true\n    },",
    repl: "     \"eccentric\": true,\n     \"eccentricity\": 0.16\n    },\n    \"binaryEccentricity\": 0.16,",
    expect: 'never claimed as measured' },

  { n: 'L11', file: APP, name: 'ONE hover implementation serves both worlds',
    find: "  if(pts) pts.material.uniforms.hoverRegion.value=idx;",
    repl: "  if(pts) pts.material.uniforms.hoverRegion.value=(migId==='love'?-1:idx);",
    expect: 'same highlightMIG serves both' },

  /* THE LINE THIS BROKE NO LONGER EXISTS. The menu used to print
     "4 concepts · 7 writings" under every row and this made the count wrong;
     the counts were removed because they invited the menu to be read as a
     leaderboard, and the anchor went with them.

     L13 was not retired with them — it holds the promise the counts were only
     one expression of: the front door must not overstate the mind. It now
     reads in both directions, so a row that states a count must state a true
     one and a row that states none cannot be wrong.

     The mutation therefore ADDS a count, and a false one. That is the exact
     failure the assertion exists to catch, and it is the only way to exercise
     it while no row states anything — otherwise L13's first clause would sit
     unverified for as long as the menu stays quiet. */
  { n: 'L13', file: APP, name: 'the menu states true counts, not total members',
    find: "      return row(m, '', function(){ travelTo('region',m.id); });",
    repl: "      return row(m, (owned[m.id]||[]).length + ' concepts · 99 writings',\n" +
          "                 function(){ travelTo('region',m.id); });   // mutation: an invented count",
    expect: 'overstates nothing' },

  { n: 'L14', file: APP, name: 'a focus the app moved does not light a world',
    find: "      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only",
    repl: "      highlightMIG(n.id);                    // any focus lights up",
    expect: 'opens with NO world highlighted' },

  /* THE ANCHOR DRIFTED AND THIS RAN AGAINST NOTHING FOR TWO DAYS. It read
     "return a.map(...)", which is what the function said until 523acdc gave
     BUSINESS the 55 Cnc system: the map became "var out=a.map(...)" so the
     seven-concept case could be handled before returning. The mutation then
     matched zero times.

     It failed loudly rather than quietly — the harness stops on any anchor
     that does not match exactly once, and reported L12 as UNVERIFIED rather
     than as a pass. That is the protocol working. What did not happen is
     anyone reading it, because the suite was not being run.

     The mutation itself is unchanged in intent: replace the MEASURED spacing
     with evenly spaced orbits, so a check claiming exact TRAPPIST-1 spacing
     has to notice. */
  { n: 'L12', file: APP, name: 'Philosophy is not disturbed',
    find: "  var out=a.map(function(v){ return R0*(v/inner); });",
    repl: "  var out=a.map(function(v,i){ return R0*(1+i*0.5); });",
    expect: 'exact TRAPPIST-1 spacing' }
];

/* --dry AUDITS THE ANCHORS AND RUNS NOTHING, which every other harness in this
   project offers and this one did not. That was not a missing convenience, it
   was a trap: '--dry' fell through into ONLY, matched no mutation name, and the
   run selected zero mutations, went green, and printed

     0/0 contrast assertions mutation-verified

   in a full twenty-four seconds of looking busy. A suite reporting success
   having tested nothing is the one outcome these harnesses exist to make
   impossible, and it was reachable here by typing a flag that every sibling
   tool accepts.

   So the flag is understood, and it is also removed from ONLY — a mutation can
   never be named '--dry', and treating it as one is how the silence happened. */
const DRY = process.argv.indexOf('--dry') >= 0;
const ONLY = (process.argv[2] || '').split(',').filter(Boolean).filter(x => x !== '--dry');
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;

if (ONLY.length && !SEL.length) {
  console.error('no mutation named ' + ONLY.join(',') + ' — nothing would have been tested');
  process.exit(1);
}

if (DRY) {
  let bad2 = 0;
  MUTATIONS.forEach(m => {
    const hits = ORIG[m.file].split(m.find).length - 1;
    if (hits !== 1) {
      bad2++;
      console.log('  x' + hits + '  ' + m.n + '  ' + JSON.stringify(m.find.slice(0, 56)));
    }
  });
  console.log(bad2 ? bad2 + ' BAD ANCHOR(S) of ' + MUTATIONS.length
                   : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad2 ? 1 : 0);
}

function build(){ execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run(){
  try { return { code: 0, out: execSync('node tools/lovecheck.js v02.html',
                                        { maxBuffer: 1<<26, timeout: 600000 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}
function restoreAll(){ Object.keys(ORIG).forEach(f => fs.writeFileSync(f, ORIG[f], 'utf8')); build(); }

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL){
  const src = ORIG[m.file];
  const hits = src.split(m.find).length - 1;
  if (hits !== 1){
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times in ' + m.file +
                  ' — UNVERIFIED, not a pass: ' + m.find.slice(0, 60));
    restoreAll(); process.exit(3);
  }
  fs.writeFileSync(m.file, src.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== src;
  build();
  const res = run();
  const failed = res.code !== 0;
  const aid = m.assert || m.n;   // a mutation may target an assertion whose id differs
  const right = failed && res.out.indexOf('FAIL  ' + aid) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === src;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(4) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right)
    console.log(res.out.split('\n').filter(l => /FAIL/.test(l)).map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' contrast assertions mutation-verified');
process.exit(bad ? 1 : 0);
