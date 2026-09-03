/* constellationmutate.js — mutation harness for tools/constellationcheck.js.
   Five steps, no SKIPs: mutate · prove it applied · require the NAMED assertion
   to fail · restore · require pass. A mutation that does not apply stops the
   run — it is UNVERIFIED, never a pass.
   usage: node tools/constellationmutate.js [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js', UMA = 'data/constellation-ursa-major.json';
const ORIG = { [APP]: fs.readFileSync(APP, 'utf8'), [UMA]: fs.readFileSync(UMA, 'utf8') };

const MUTATIONS = [
  { n: 'CST-1', file: UMA, name: 'the dataset carries its real provenance',
    find: 'SIMBAD Astronomical Database — CDS (Strasbourg), TAP service',
    repl: 'internal notes' },

  { n: 'CST-2', file: APP, name: 'the off-asterism object is really placed',
    find: `  if(g.lone.length===1 && byName[lone]){ map[g.lone[0]]=lone; starOf[lone]=g.lone[0]; }`,
    repl: `  /* mutation: drop the object that does not fit */` },

  { n: 'CST-3', file: UMA, name: 'the chain follows the declared draw order',
    find: '"Alkaid",\n   "Mizar",\n   "Alioth",\n   "Megrez",\n   "Phecda",\n   "Merak",\n   "Dubhe"',
    repl: '"Dubhe",\n   "Merak",\n   "Phecda",\n   "Megrez",\n   "Alioth",\n   "Mizar",\n   "Alkaid"' },

  { n: 'CST-4', file: APP, name: 'the OFF-ASTERISM star is the object with no relationship',
    find: `      node.offAsterism=(s.proper===kon.offAsterism);`,
    repl: `      node.offAsterism=(s.proper===kon.order[0]);   // mutation: mark a chain star` },

  { n: 'CST-5', file: APP, name: 'no object is fabricated',
    /* injecting a brand-new node mid-layout crashed the app instead of failing
       the named assertion, which proves nothing. Map a FOREIGN object onto a
       star instead — same claim, clean failure. */
    find: `  return { data:D, local:local, byName:byName, map:map, starOf:starOf,`,
    repl: `  map['curiosity']=order[0];              // mutation: a star from another region
  return { data:D, local:local, byName:byName, map:map, starOf:starOf,` },

  { n: 'CST-6', file: APP, name: 'positions are driven by the measured coordinates',
    find: `          .add(vW.clone().multiplyScalar(p.y*CONST_SCALE))`,
    repl: `          .add(vW.clone().multiplyScalar(p.y*CONST_SCALE*1.6))   // squash the figure` },

  { n: 'CST-7', file: APP, name: 'depth is the measured distance on the line of sight',
    find: `          .add(wW.clone().multiplyScalar(-p.z*CONST_SCALE)));`,
    repl: `          .add(wW.clone().multiplyScalar(-p.z*CONST_SCALE*0.5)));  // squashed depth` },

  { n: 'CST-8', file: APP, name: 'no depth exaggeration is applied',
    find: `      depthExaggeration:null,      // none applied: the figure is 0.90x as deep as wide`,
    repl: `      depthExaggeration:3.5,` },

  { n: 'CST-9', file: APP, name: 'the drawn lines are the graph edges',
    find: `    adj[l.a].push(l.b); adj[l.b].push(l.a);
    internal.push(l);`,
    repl: `    adj[l.a].push(l.b); adj[l.b].push(l.a);
    if(internal.length<5) internal.push(l);        // mutation: quietly drop one` },

  { n: 'CST-10', file: APP, name: 'no conventional asterism line is added',
    find: `  return {chain:chain, lone:lone, internal:internal, adj:adj};`,
    repl: `  /* mutation: close the bowl the way the ancients drew it */
  if(chain.length===7) internal.push({a:chain[3],b:chain[6],verb:'asterism'});
  return {chain:chain, lone:lone, internal:internal, adj:adj};` },

  { n: 'CST-11', file: APP, name: 'the background sky never enters the graph',
    find: `      CONST_BG.push({ mig:m.id, vMag:b.vMag, pos:place(p) });`,
    repl: `      var sky={id:'sky-'+bi,label:'',t:'minor',mig:m.id,pos:place(p)};
      NODES.push(sky); byId[sky.id]=sky;
      CONST_BG.push({ mig:m.id, vMag:b.vMag, pos:sky.pos });` },

  { n: 'CST-12', file: APP, name: 'the named stars are not drawn twice as sky',
    find: `      for(var q=0;q<named.length;q++)
        if(Math.abs(named[q].raDeg-b.raDeg)<0.02 && Math.abs(named[q].decDeg-b.decDeg)<0.02) return;`,
    repl: `      /* mutation: let the figure be drawn twice */` },

  { n: 'CST-13', file: APP, name: 'ownership is untouched',
    find: `      node.home=m.id;
      node.star=s.proper;`,
    repl: `      node.home=m.id; node.mig='philosophy';        // mutation: reparent
      node.star=s.proper;` },

  /* Broken by the same commit as W5 in worldmutate.js — f11a2b2 removed the
     menu sort along with MY WORKS, and both harnesses were still anchored on
     it. One source edit, two mutations silently matching nothing.

     observation is confirmed to be a live region id, so the filter really does
     remove a region rather than quietly doing nothing. */
  { n: 'CST-14', file: APP, name: 'the Main Mind Menu keeps all 14 MIGs',
    find: `    var ordered=MIGS.slice();`,
    repl: `    var ordered=MIGS.slice().filter(function(x){ return x.id!=='observation'; });` },

  { n: 'CST-15', file: APP, name: 'the highlight is reversible',
    find: `function highlightMIG(migId){
  if(hoveredMIG===migId) return;`,
    repl: `function highlightMIG(migId){
  if(!migId) return;                    // mutation: never release
  if(hoveredMIG===migId) return;` }
];

/* --dry validates every anchor without running anything: the shared
   anchors.js only parses quoted literals, and most of these are backticks. */
if (process.argv.indexOf('--dry') >= 0) {
  let bad2 = 0;
  MUTATIONS.forEach(m => {
    const hits = ORIG[m.file].split(m.find).length - 1;
    if (hits !== 1) { bad2++; console.log('  x' + hits + '  ' + m.n + '  ' + m.file + '  ' + JSON.stringify(m.find.slice(0, 54))); }
  });
  console.log(bad2 ? bad2 + ' BAD ANCHOR(S) of ' + MUTATIONS.length : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad2 ? 1 : 0);
}

const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run() {
  try { return { code: 0, out: execSync('node tools/constellationcheck.js v02.html',
                                        { maxBuffer: 1 << 26, timeout: 600000 }).toString() }; }
  catch (e) { return { code: e.status || 1, out: (e.stdout || '').toString() + (e.stderr || '').toString() }; }
}
function restoreAll() { Object.keys(ORIG).forEach(f => fs.writeFileSync(f, ORIG[f], 'utf8')); build(); }

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0) { console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL) {
  const src = ORIG[m.file];
  const hits = src.split(m.find).length - 1;
  if (hits !== 1) {
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times in ' + m.file +
                  ' — UNVERIFIED, not a pass: ' + m.find.slice(0, 58));
    restoreAll(); process.exit(3);
  }
  fs.writeFileSync(m.file, src.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== src;
  build();
  const res = run();
  const failed = res.code !== 0;
  const right = failed && res.out.indexOf('FAIL  ' + m.n) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === src;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(8) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right)
    console.log(res.out.split('\n').filter(l => /FAIL/.test(l)).map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' constellation assertions mutation-verified');
process.exit(bad ? 1 : 0);
