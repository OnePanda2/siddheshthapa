/* highlightmutate.js — mutation harness for tools/highlightcheck.js
   Same protocol: mutate · prove it applied · require failure for the stated
   reason · restore · require pass. No SKIPs.
   usage: node tools/highlightmutate.js [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ORIG = fs.readFileSync(APP, 'utf8');

const MUTATIONS = [
  { n: 'H1', name: 'the mapping is deterministic, not incidental',
    find: "  if(migId) for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===migId) idx=i;",
    repl: "  if(migId) idx=0;                 // every MIG resolves to the same world",
    expect: 'MIG -> world mapping is a region index' },

  { n: 'H2', name: 'the hovered world brightens',
    find: "      '    here *= (abs(region-hoverRegion)<0.5) ? 3.60 : 0.30;',",
    repl: "      '    here *= 1.0;',",
    expect: 'the hovered world brightens' },

  { n: 'H4', name: 'hover is exactly reversible',
    find: "function highlightMIG(migId){\n  if(hoveredMIG===migId) return;",
    repl: "function highlightMIG(migId){\n  if(!migId) return;            // never release\n  if(hoveredMIG===migId) return;",
    expect: 'releasing restores the baseline' },

  /* hover must never navigate. If it did, a visitor scanning the menu would be
     thrown across the universe by accident. */
  { n: 'H5', name: 'hover does not navigate',
    find: "  if(pts) pts.material.uniforms.hoverRegion.value=idx;",
    repl: "  if(pts) pts.material.uniforms.hoverRegion.value=idx;\n  if(migId) travelTo('region',migId);",
    expect: 'hover changed no state' },

  { n: 'H7', name: 'keyboard focus reaches the highlight',
    find: "      if(kbNav) highlightMIG(n.id);           // keyboard parity, visitor-driven only",
    repl: "      if(false) highlightMIG(n.id);           // keyboard parity removed",
    expect: 'keyboard focus' },

  { n: 'H8', name: 'orbital paths answer the hover',
    find: "  if(orbitLines) orbitLines.material.uniforms.hoverOwn.value=\n    (migId && ORBITS[migId]) ? 1.0 : 0.0;",
    repl: "  if(orbitLines) orbitLines.material.uniforms.hoverOwn.value=0.0;",
    expect: 'orbital paths answer the hover' }
];

const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;

function build(){ execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run(){
  try { return { code: 0, out: execSync('node tools/highlightcheck.js v02.html',
                                        { maxBuffer: 1<<26, timeout: 600000 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}
function restore(){ fs.writeFileSync(APP, ORIG, 'utf8'); build(); }

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL){
  const hits = ORIG.split(m.find).length - 1;
  if (hits !== 1){
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times: ' + m.find.slice(0,56));
    restore(); process.exit(3);
  }
  fs.writeFileSync(APP, ORIG.replace(m.find, m.repl), 'utf8');
  const applied = fs.readFileSync(APP, 'utf8') !== ORIG;
  build();
  const r = run();
  const failed = r.code !== 0;
  const right = failed && r.out.indexOf('FAIL  ' + m.n) >= 0;
  restore();
  const restored = fs.readFileSync(APP, 'utf8') === ORIG;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n.padEnd(4) + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' namedAssertionFailed=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right) console.log(r.out.split('\n').filter(l=>/FAIL/.test(l)).map(l=>'       '+l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion proves nothing');
}
restore();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' highlight assertions mutation-verified');
process.exit(bad ? 1 : 0);
