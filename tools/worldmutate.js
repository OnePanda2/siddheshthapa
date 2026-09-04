/* worldmutate.js — mutation harness for tools/worldcheck.js.
   Five steps, no SKIPs: mutate · prove it applied · require the NAMED assertion
   to fail · restore · require pass. An anchor that does not match stops the run.
   usage: node tools/worldmutate.js [ids] | --dry
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ORIG = { [APP]: fs.readFileSync(APP, 'utf8') };

const MUTATIONS = [
  { n: 'W1', file: APP, name: 'every MIG really has a profile',
    find: `    MIG_WORLD_PROFILE[m.id]={`,
    repl: `    if(m.id==='music') return;          // mutation: one region left out
    MIG_WORLD_PROFILE[m.id]={` },

  { n: 'W2', file: APP, name: 'an unbuilt world is DECLARED latent, not a silent fallback',
    find: `             : tpl ? 'planetary'
             : 'latent';`,
    repl: `             : tpl ? 'planetary'
             : undefined;                       // mutation: silent fallback` },

  { n: 'W3', file: APP, name: 'world types come from the declared list',
    find: `var WORLD_TYPES=['planetary','circumbinary','constellation','latent'];`,
    repl: `var WORLD_TYPES=['planetary','circumbinary','constellation'];` },

  { n: 'W4', file: APP, name: 'no MIG is nested inside another',
    find: `MIGS.forEach(function(m){ m.t='mig'; m.mig=m.id; NODES.push(m); owned[m.id]=[]; });`,
    repl: `MIGS.forEach(function(m){ m.t='mig'; m.mig=(m.id==='love'?'philosophy':m.id); NODES.push(m); owned[m.id]=[]; });` },

  /* THE ANCHOR WAS BROKEN BY f11a2b2, "MY WORKS is not a region of the mind".
     The menu used to sort MY WORKS to the top; when MY WORKS stopped being a
     region there was nothing to lift, the sort went, and the line became a
     plain slice. This mutation kept anchoring on the sort and matched zero
     times, so W5 has been UNVERIFIED since that commit — reported as such by
     the harness rather than counted as a pass, and unread because the suite
     was not being run.

     The mutation is unchanged in intent: drop one region from the menu and
     require the check to notice. psychology is confirmed to be a live region
     id, because a filter naming an id that does not exist would remove
     nothing and this would be inert again — which is how L9 spent two days
     asking an empty question. */
  { n: 'W5', file: APP, name: 'the menu exposes every MIG',
    find: `    var ordered=MIGS.slice();`,
    repl: `    var ordered=MIGS.slice().filter(function(x){ return x.id!=='psychology'; });` },

  /* THE SUBJECT OF THIS MUTATION CEASED TO EXIST. It edited the relabel that
     turned MY WORKS into ART, and there is no such relabel any more: ART was
     promoted to a region with its own contents and MY WORKS was hidden, so
     `relabel` is empty and the anchor matched nothing. worldcheck's W6 had
     already been INVERTED to match — it now asserts ART is a real region and
     that nothing is being relabelled — but the mutation was left pointing at
     the world as it used to be, and had been unverified ever since.

     Restoring the relabel is therefore the right break: it puts back exactly
     the state W6 exists to forbid, one region wearing another's name as a
     costume. Nothing else needs touching, because a relabel of a region that
     is also hidden is harmless to the app and visible to the check. */
  { n: 'W6', file: APP, name: 'ART is a region of its own, not a costume for MY WORKS',
    find: `  relabel:[],`,
    repl: `  relabel:[{ id:'my-works', from:'MY WORKS', to:'ART' }],` },

  { n: 'W7', file: APP, name: 'Psychology took no content from anyone',
    find: `    MIGS.push({ id:a.id, label:a.label, gloss:a.gloss, v02Added:true, v02Empty:!!a.empty });`,
    repl: `    MIGS.push({ id:a.id, label:a.label, gloss:a.gloss, v02Added:true, v02Empty:!!a.empty });
    MINORS.forEach(function(x){ if(x.id==='psychology-behaviour') x.mig=a.id; });   // mutation: steal it` },

  { n: 'M1', file: APP, name: 'the layout really has brain proportions',
    find: `  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.74, z*r);`,
    repl: `  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*1.28, z*r);  // mutation: too tall` },

  { n: 'M1b', assert: 'M1', file: APP, name: 'the midline stays clear',
    find: `  p.x += (x>=0?1:-1)*(0.030+0.022*bsmooth(0.15,1.0,y));   /* a cleft, not a chasm */`,
    repl: `  p.x += 0.0;                                  // mutation: no fissure` },

  /* Dropped in the GRID pass, the way a region genuinely absent would be.
     Returning early from the placement instead left the region with grid
     coordinates but no position, which took the whole page down — and a crash
     is not the assertion catching anything. */
  { n: 'M2', file: APP, name: 'every MIG is in the brain',
    find: `  m.bDepth=0.62+((i*13)%4)/4*0.94;`,
    repl: `  m.bDepth=0.62+((i*13)%4)/4*0.94;
  if(m.id==='food') m.bY=undefined;            // mutation: leave one out` },

  { n: 'M3', file: APP, name: 'hover identifies a region while the mind is closed',
    find: `  if(pts) pts.material.uniforms.hoverRegion.value=idx;`,
    repl: `  if(pts) pts.material.uniforms.hoverRegion.value=(mindOpen<0.5?-1:idx);` },

  { n: 'M4', file: APP, name: 'the brain highlight is reversible',
    find: `function highlightMIG(migId){
  if(hoveredMIG===migId) return;`,
    repl: `function highlightMIG(migId){
  if(!migId) return;                           // mutation: never release
  if(hoveredMIG===migId) return;` },

  { n: 'M5', file: APP, name: 'choosing a region unfolds the mind',
    find: `    if(reduced||LITE){ setMindOpen(wantOpen); }`,
    repl: `    if(reduced||LITE){ }                 // mutation: never unfold` },

  { n: 'M5c', assert: 'M5', file: APP, name: 'entering leaves the brain standing',
    find: `  var wantOpen = (mode==='universe' && !id) ? 0 : 1;`,
    repl: `  var wantOpen = 1;                      // mutation: always expanded` },

  { n: 'M5b', assert: 'M5', file: APP, name: 'the regions actually travel',
    find: `    m.bPos=brainShell(dir).multiplyScalar(m.bRad);`,
    repl: `  m.bPos=m.uPos.clone();                       // mutation: brain == universe` },

  { n: 'H1', file: APP, name: 'a hover maps to exactly one MIG',
    find: `  if(migId) for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===migId) idx=i;`,
    repl: `  if(migId) idx=0;                             // mutation: everything is region 0` },

  /* the brighten comes from the EMPHASIS, not the size lift; removing only
     the brighten half leaves H3's dimming intact, so the two stay distinct */
  { n: 'H2', file: APP, name: 'the hovered world actually brightens',
    find: `      '    here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;',`,
    repl: `      '    here *= (abs(region-hoverRegion)<0.5) ? 1.0 : 0.45;',` },

  { n: 'H4', file: APP, name: 'releasing restores the baseline',
    find: `function highlightMIG(migId){
  if(hoveredMIG===migId) return;`,
    repl: `function highlightMIG(migId){
  if(!migId) return;                           // mutation: release does nothing
  if(hoveredMIG===migId) return;` },

  { n: 'H3', file: APP, name: 'the other worlds recede under hover',
    find: `      '    here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;',`,
    repl: `      '    here *= 1.0;',` },

  { n: 'W8', file: APP, name: 'the rename carries the relationships with it',
    find: `    EDGES.forEach(function(e){
      if(e[0]===rn.from){ e[0]=rn.to; }
      if(e[1]===rn.from){ e[1]=rn.to; }
    });`,
    repl: `    /* mutation: re-key the object but orphan its relationships */` },

  { n: 'W8b', assert: 'W8', file: APP, name: 'the freed id belongs to the MIG, not the concept',
    find: `      if(o.id===rn.from){ o.id=rn.to; moved++; }`,
    repl: `      if(false){ o.id=rn.to; moved++; }   // mutation: never re-key` },

  /* SEE braincheck B19 for why this grew a precondition. The line it breaks
     cannot run while every world has a system, so the mutation was landing on
     dead code and the pass meant nothing. ART is stripped first, so there IS an
     unassigned world, and only then is a heritage invented for it. */
  { n: 'W9', file: APP, name: 'an unassigned MIG never invents a source',
    also: { find: `'music':'Kepler-80', 'psychology':'Kepler-62', 'art':'HD 40307' };`,
            repl: `'music':'Kepler-80', 'psychology':'Kepler-62' };` },
    find: `  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';`,
    repl: `  if(p.worldType==='latent' || !p.astronomyTemplate) return 'TRAPPIST-1';` },

  { n: 'M6', file: APP, name: 'the whole brain stays inside the frame',
    find: `    var k=(phoneB2?5.60:2.50)*(1+WELCOME_DIM*0.13);`,
    repl: `    var k=phoneB2?2.62:0.34;            // mutation: zoom into the brain` },

  { n: 'MI1', file: APP, name: 'the named object is the one that lights',
    find: `  var i=(id && nodeIndex[id]!==undefined) ? nodeIndex[id] : -1;`,
    repl: `  var i=id?0:-1;                       // mutation: always the same object` },

  { n: 'MI2', file: APP, name: 'the objects it did not name recede',
    find: `      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 0.44;',`,
    repl: `      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 1.0;',` },

  { n: 'MI3', file: APP, name: 'the Minor IG highlight is reversible',
    find: `function highlightNode(id){
  if(hoveredNode===id) return;`,
    repl: `function highlightNode(id){
  if(!id) return;                        // mutation: never release
  if(hoveredNode===id) return;` },

  { n: 'R1', file: APP, name: 'relationship visibility is world-local, not origin-based',
    find: `      var range=relRangeOf(state.region);
      fm=Math.max(0,Math.min(1,(range-ld)/(range*0.62)));`,
    repl: `      fm=0.008+0.992*Math.max(0,Math.min(1,(430-camPos.length())/210));  // the old bug` },

  { n: 'R2', file: APP, name: "Philosophy's own range is used",
    find: `               : (type==='planetary') ? outerOrbit(m.id,tpl)*1.65*biasScale`,
    repl: `               : (type==='planetary') ? 6                 // mutation: a useless range` },

  { n: 'R3', file: APP, name: "Love's own range is used",
    find: `               : (type==='circumbinary') ? 2.5*scaleFor(m.id)*0.70+2.5*scaleFor(m.id)*0.42`,
    repl: `               : (type==='circumbinary') ? 6              // mutation: a useless range` },

  { n: 'R4', file: APP, name: "Observation's own range is used",
    find: `    var arrive = kon ? (CONST_DATA.derived.meanDistanceLy*CONST_SCALE)`,
    repl: `    var arrive = kon ? 6                          // mutation: a useless range` }
];

if (process.argv.indexOf('--dry') >= 0) {
  let bad2 = 0;
  MUTATIONS.forEach(m => {
    const hits = ORIG[m.file].split(m.find).length - 1;
    if (hits !== 1) { bad2++; console.log('  x' + hits + '  ' + m.n + '  ' + JSON.stringify(m.find.slice(0, 56))); }
    if (m.also) {
      const h2 = ORIG[m.also.file || m.file].split(m.also.find).length - 1;
      if (h2 !== 1) { bad2++; console.log('  x' + h2 + '  ' + m.n + ' (precondition)  ' + JSON.stringify(m.also.find.slice(0, 46))); }
    }
  });
  console.log(bad2 ? bad2 + ' BAD ANCHOR(S) of ' + MUTATIONS.length
                   : 'all ' + MUTATIONS.length + ' anchors match exactly once');
  process.exit(bad2 ? 1 : 0);
}

const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;
/* A NAME THAT MATCHES NOTHING IS A TYPO, NOT AN EMPTY TEST RUN. Without this,
   ONLY filters the table to nothing, the loop has no work, and the summary
   prints 0/0 with exit 0 — a green result for a set that was never tested,
   which is the one outcome these harnesses exist to prevent. lovemutate was
   caught doing exactly that when asked for a flag it did not understand. */
if (ONLY.length && SEL.length !== ONLY.length) {
  const missing = ONLY.filter(x => !MUTATIONS.some(m => String(m.n) === String(x)));
  console.error('no mutation named ' + missing.join(', ') +
                ' — refusing to report a result for a set that was never tested');
  process.exit(1);
}

function build() { execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run() {
  try { return { code: 0, out: execSync('node tools/worldcheck.js v02.html',
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
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times — UNVERIFIED: ' +
                  m.find.slice(0, 56));
    restoreAll(); process.exit(3);
  }
  /* the precondition goes on first, audited as strictly as the mutation */
  if (m.also) {
    const af = m.also.file || m.file, asrc = ORIG[af];
    const h2 = asrc.split(m.also.find).length - 1;
    if (h2 !== 1) {
      console.error('STOP: precondition for ' + m.n + ' matched ' + h2 + ' times — UNVERIFIED: ' +
                    m.also.find.slice(0, 56));
      restoreAll(); process.exit(3);
    }
    fs.writeFileSync(af, asrc.replace(m.also.find, m.also.repl), 'utf8');
  }
  fs.writeFileSync(m.file, (m.also && (m.also.file || m.file) === m.file
                              ? fs.readFileSync(m.file, 'utf8') : src).replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(m.file, 'utf8') !== src;
  build();
  const res = run();
  const failed = res.code !== 0;
  const aid = m.assert || m.n;
  const right = failed && res.out.indexOf('FAIL  ' + aid) >= 0;
  restoreAll();
  const restored = fs.readFileSync(m.file, 'utf8') === src;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(5) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right)
    console.log(res.out.split('\n').filter(l => /FAIL/.test(l)).map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' architecture assertions mutation-verified');
process.exit(bad ? 1 : 0);
