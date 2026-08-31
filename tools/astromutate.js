/* astromutate.js — mutation harness for tools/astronomycheck.js

   Mutations are applied to the source and v02.html is REBUILT, so what is
   tested is the artifact a visitor would load.

   Protocol: mutate · prove it reached the file · require failure FOR THE
   STATED REASON · restore byte-for-byte · require pass. A mutation that does
   not apply is a hard stop, never a SKIP.

   usage: node tools/astromutate.js [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', DATA = 'data/astronomy-systems.json';
const ORIG_APP = fs.readFileSync(APP, 'utf8');
const ORIG_DATA = fs.readFileSync(DATA, 'utf8');

const MUTATIONS = [
  { n: 'A1', name: 'Philosophy uses TRAPPIST-1',
    file: APP, find: "var MIG_SYSTEM={ 'philosophy':'TRAPPIST-1', 'love':'Kepler-16',",
    repl: "var MIG_SYSTEM={ 'philosophy':'HR 8799', 'love':'Kepler-16',",
    expect: 'Philosophy uses HR 8799' },

  /* the geometry must come from the DATASET. Corrupt the source figures and
     the rendered spacing must follow — if it does not, the scene is being
     driven by constants somebody typed. */
  { n: 'A7', name: 'relative spacing IS the measured spacing',
    file: APP,
    find: "  return a.map(function(v){ return R0*(v/inner); });",
    repl: "  return a.map(function(v,i){ return R0*(1+i*0.5); });",
    expect: 'relative spacing is the measured spacing' },

  { n: 'A2', name: 'the template carries provenance',
    file: DATA, find: '"_sourceType": "NASA Exoplanet Archive (IPAC/Caltech), pscomppars",',
    repl: '"_sourceType": "hand-drawn sketch",',
    expect: 'template drawn from' },

  { n: 'A6', name: 'orbital ordering follows the documented ordering',
    file: APP,
    find: "      var r=slots[Math.min(k,slots.length-1)];",
    repl: "      var r=slots[Math.min(slots.length-1-k,slots.length-1)];",
    expect: 'radii ascend with slot' },

  { n: 'A8', name: 'Philosophy is the gravitational centre',
    file: APP,
    find: "      node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(r,theta,incl));",
    repl: "      node.pos=new THREE.Vector3().addVectors(m.pos, localOrbit(r*1.4,theta,incl));",
    expect: 'sits at its own orbital radius' },

  { n: 'A5', name: 'each concept occupies exactly one position',
    file: APP,
    find: "      var theta=k*2.39996+((degree[id]||0)%5)*0.42;",
    repl: "      var theta=k*2.39996+((degree[id]||0)%5)*0.42; k=0;",
    expect: 'each position used once' },

  /* THE ONE THAT WOULD HAVE CAUGHT THE REAL BUG. flipY made every concept
     render FOOD's eight-body cluster while sixteen other assertions stayed
     green. Put the flip back and A13 must refuse it. */
  /* THE REAL DEFECT, both halves of it. Either mutation reproduces a build in
     which a concept silently samples the wrong atlas cell. A13 cannot see it
     (FOOD's eight cores merge into one region at any usable ink threshold),
     which is exactly why A17 pins the orientation instead. */
  { n: 'A17', name: 'atlas sampling contract — flipY',
    file: APP, find: "  tex.flipY=false;",
    repl: "  tex.flipY=true;",
    expect: 'atlas sampling contract' },

  { n: 'A17b', assertion: 'A17', name: 'atlas sampling contract — inverted point coord',
    file: APP, find: "      '  vec2 uv=(vCell+gl_PointCoord)/cells;',",
    repl: "      '  vec2 uv=(vCell+vec2(gl_PointCoord.x,1.0-gl_PointCoord.y))/cells;',",
    expect: 'atlas sampling contract' },

  /* the data half of "one body": park the writings back on top of their
     concept and the region becomes icon soup again, exactly as it was */
  { n: 'A13', name: 'a concept is not crowded into a cluster',
    file: APP,
    find: "          new THREE.Vector3(Math.cos(off)*13.5, lift, Math.sin(off)*13.5));",
    repl: "          new THREE.Vector3(Math.cos(off)*2.0, lift*0.08, Math.sin(off)*2.0));",
    expect: 'renders as ONE body' },

  { n: 'A11', name: 'orbital bodies stay owned by Philosophy',
    file: APP,
    find: "      node.home=m.id; node.orbit={r:r,theta:theta,slot:k};",
    repl: "      node.home=m.id; node.mig='life'; node.orbit={r:r,theta:theta,slot:k};",
    expect: 'owned by Philosophy' },

  { n: 'A12', name: 'Philosophy does not fall back to a generic icon',
    file: APP,
    find: "  'philosophy'  :{family:'neural',   branches:8, len:0.86, spread:0.40, rings:0, core:0.58},",
    repl: "",
    expect: 'not the generic star' },

  /* reinstate the field-name slip that printed "UNDEFINED" over every
     relationship. Found by looking at a screenshot, not by any assertion. */
  { n: 'A18', name: 'relationship verbs are real verbs',
    file: APP, find: "'<span class=\"verb\">'+esc(k.v)+'</span> '+esc(o.label)",
    repl: "'<span class=\"verb\">'+esc(k.verb)+'</span> '+esc(o.label)",
    expect: 'relationship verbs rendered' },

  /* THE FOURTH WORLD. Take the system away and MOVIES falls back to a latent
     placeholder — the state it was in before this increment. */
  { n: 'A19', name: 'MOVIES uses HR 8799',
    file: APP,
    find: "'movies':'HR 8799',",
    repl: "",
    expect: 'MOVIES uses' },

  /* A20 needs no mutation of its own, and that is the point: MOVIES adds no
     new code path. It is built by the same shared rule as PHILOSOPHY, so A7's
     mutation — breaking the link between the measured axes and the rendered
     radii — fails A20 as well. A separate mutation here could only be a
     contrived one.

     What the SOURCE figures do bind is A21. Flatten HR 8799's axes into a
     tightening series and it stops being the contrast it was chosen to be,
     while every ratio on screen still faithfully matches the data it was
     given — which is exactly the failure A21 exists to catch. */
  { n: 'A21', name: 'the two planetary worlds are opposite shapes',
    file: DATA,
    find: ['"semiMajorAxisAU": [','    16.4,','    24,','    38,','    68','   ],'].join('\n'),
    repl: ['"semiMajorAxisAU": [','    16.4,','    20,','    24,','    28','   ],'].join('\n'),
    expect: 'opposite shapes' },

  /* THE FIFTH WORLD, same shape as A19: take the system away and LIFE falls
     back to the latent placeholder it was. */
  { n: 'A22', name: 'LIFE uses Kepler-33',
    file: APP,
    find: "'life':'Kepler-33',",
    repl: "",
    expect: 'LIFE uses' },

  /* A23 needs no mutation for the same reason A20 does not: LIFE shares the
     one code path, so A7's mutation fails it too.

     What the SOURCE figures bind is A24. Turn Kepler-33 from the most
     compressive system in the set into an expanding one and the three regimes
     stop being three — every ratio on screen still matches the data it was
     given, which is exactly the failure A24 exists to catch. */
  { n: 'A24', name: 'the three planetary worlds are three regimes in order',
    file: DATA,
    find: ['"semiMajorAxisAU": [','    0.0677,','    0.1189,','    0.1662,','    0.2138,','    0.2535','   ],'].join('\n'),
    repl: ['"semiMajorAxisAU": [','    0.0677,','    0.0800,','    0.1100,','    0.1700,','    0.3000','   ],'].join('\n'),
    expect: 'three regimes in order' },

  /* THE SIXTH WORLD. Take the system away and TECHNOLOGY falls back to the
     latent placeholder it was. */
  { n: 'A25', name: 'TECHNOLOGY uses GJ 876',
    file: APP,
    find: " 'technology':'GJ 876' };",
    repl: " };",
    expect: 'TECHNOLOGY uses' },

  /* A26 needs no mutation, for the third time and the same reason: TECHNOLOGY
     shares the one code path, so A7's mutation fails it too.

     A27 is bound by the PERIODS. Take the outer three out of their 1:2:4 chain
     and the resonance stops being one — the radii on screen still match the
     axes they were given, so nothing else notices, which is exactly the gap
     A27 was written to close. */
  { n: 'A27', name: 'the Laplace resonance is visible in the drawn geometry',
    file: DATA,
    find: ['"orbitalPeriodDays": [','    1.93778,','    30.0881,','    61.1166,','    124.26','   ],'].join('\n'),
    repl: ['"orbitalPeriodDays": [','    1.93778,','    30.0881,','    55.0000,','    95.0000','   ],'].join('\n'),
    expect: 'Laplace resonance' },

  { n: 'A3', name: 'exactly seven Philosophy concepts',
    file: APP,
    find: "    var concepts=mem.filter(function(id){ return byId[id].t==='minor'; });",
    repl: "    var concepts=mem.filter(function(id){ return byId[id].t==='minor'; }).slice(0,5);",
    expect: 'Philosophy concepts' }
];

const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;

function build(){ execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run(){
  try { return { code: 0, out: execSync('node tools/astronomycheck.js v02.html',
                                        { maxBuffer: 1<<26, timeout: 900000 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}
function restoreAll(){
  fs.writeFileSync(APP, ORIG_APP, 'utf8');
  fs.writeFileSync(DATA, ORIG_DATA, 'utf8');
  build();
}

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL){
  const orig = m.file === DATA ? ORIG_DATA : ORIG_APP;
  const hits = orig.split(m.find).length - 1;
  if (hits !== 1){
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times: ' + m.find.slice(0,56));
    restoreAll(); process.exit(3);
  }
  const mutated = orig.replace(m.find, m.repl);
  if (mutated === orig){ console.error('STOP: mutation ' + m.n + ' changed nothing'); restoreAll(); process.exit(3); }
  fs.writeFileSync(m.file, mutated, 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== orig;
  build();
  const r = run();
  const failed = r.code !== 0;
  /* the named assertion must be the one that failed, not merely some assertion */
  const line = r.out.split('\n').find(l => l.indexOf('FAIL  ' + m.n) === 2 || l.trim().startsWith('FAIL  ' + m.n));
  const want = m.assertion || m.n;   // two mutations may target one assertion
  const right = failed && r.out.indexOf('FAIL  ' + want) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === orig;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(5) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right) console.log(r.out.split('\n').filter(l=>/FAIL/.test(l)).map(l=>'       '+l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' astronomy assertions mutation-verified');
process.exit(bad ? 1 : 0);
