/* glmutate.js — mutation harness for tools/glcheck.js

   Mutations are applied to src/v02-app.js and v02.html is REBUILT, so what is
   tested is the artifact a visitor would load, not a patched copy of it.

   Protocol, unchanged since P4.6: mutate · prove the mutation reached the file
   · require failure FOR THE STATED REASON · restore byte-for-byte · require
   pass. A mutation that does not apply is a hard stop, never a SKIP.

   usage: node tools/glmutate.js [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ORIGINAL = fs.readFileSync(APP, 'utf8');

const MUTATIONS = [
  /* THE one that matters. V02 §9 forbids "place the existing 2D graph in Z".
     Collapsing the Z axis produces exactly that build, and the check must
     refuse it — otherwise the whole rebuild could ship as a flat diagram
     behind a perspective camera and nothing would notice. */
  /* THIS FLATTENED A LAYOUT NOTHING IS MEASURED IN. It zeroed the Z of
     seedSphere, which is still called - it seeds the MIGs' universe positions -
     but glcheck probes at boot, before the mind is entered, and there the
     objects stand at their BRAIN positions. seedSphere's plane never reached
     the measurement, so the assertion could not fail and was not verified.

     brainShell is what actually gives that layout its three dimensions, and
     its x term is the brain's width. Zeroing it presses the whole organ into a
     single plane, which is the exact condition "the layout is genuinely
     three-dimensional" exists to refuse. */
  { n: 'GL-1', name: 'the universe is genuinely volumetric, not a plane in Z',
    find: '  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.74, z*r);',
    repl: '  var p=new THREE.Vector3(0.0, y*r*0.74, z*r);',
    expect: 'not volumetric' },

  { n: 'GL-2', name: 'the model is the same mind (node count)',
    find: 'THOUGHTS.forEach(function(n){ NODES.push(n); });',
    repl: 'THOUGHTS.slice(0,-4).forEach(function(n){ NODES.push(n); });',
    /* the number is NOT written here. It was 'expected 143 nodes' and had gone
       stale twice over - once when the overlay began adding contents, again
       when the first live note was published - so the mutation was caught by
       the right assertion and reported as caught by the wrong one. glcheck
       derives the count now; this matches the shape of its message instead,
       which identifies the assertion without pinning a total that is supposed
       to move. */
    expect: 'nodes, model has' },

  { n: 'GL-3', name: 'cross-region relationships exist',
    find: 'l.cross=cross;',
    repl: 'l.cross=false;',
    expect: 'no cross-region relationships' },

  { n: 'GL-4', name: 'the canvas is never the structure',
    find: "<canvas id=\"gl\" aria-hidden=\"true\">",
    repl: "<canvas id=\"gl\">",
    file: 'src/v02-shell.html',
    expect: 'not aria-hidden' },

  { n: 'GL-5', name: 'the DOM layer carries the structure',
    find: 'ul.appendChild(r); });',
    repl: '});',
    file: 'src/v02-app.js',
    expect: 'navigable rows' },

  /* Approaching must actually bring things closer. If range is computed from
     anything but real distance, the FAR→MID→NEAR metaphor is decorative. */
  { n: 'GL-6', name: 'perception range is driven by real camera distance',
    find: "return p.dist>190?'far':(p.dist>70?'mid':'near');",
    repl: "return 'far';",
    expect: 'near range' },

  { n: 'GL-7', name: 'something is actually rendered',
    find: 'renderer.render(scene,camera);',
    repl: 'if(false) renderer.render(scene,camera);',
    expect: 'zero draw calls' }
];

const ONLY = (process.argv[2] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(m.n) >= 0) : MUTATIONS;

function build(){ execSync('node tools/build-v02.js', { stdio: 'pipe' }); }
function run(){
  try { return { code: 0, out: execSync('node tools/glcheck.js v02.html 1440 900',
                                        { maxBuffer: 1 << 26, timeout: 900000 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}
function read(f){ return fs.readFileSync(f, 'utf8'); }
function restoreAll(){
  fs.writeFileSync(APP, ORIGINAL, 'utf8');
  fs.writeFileSync('src/v02-shell.html', SHELL, 'utf8');
  build();
}
const SHELL = fs.readFileSync('src/v02-shell.html', 'utf8');

build();
console.log('BASELINE');
const base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL){
  const target = m.file || APP;
  const before = read(target);
  const hits = before.split(m.find).length - 1;
  if (hits !== 1){
    console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times: ' + m.find.slice(0,54));
    restoreAll(); process.exit(3);
  }
  fs.writeFileSync(target, before.replace(m.find, m.repl), 'utf8');
  const applied = read(target).indexOf(m.repl) >= 0;
  build();
  const r = run();
  const failed = r.code !== 0, right = r.out.indexOf(m.expect) >= 0;
  restoreAll();
  const restored = read(target) === before;
  const after = run().code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n + '  ' + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' rightReason=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right) console.log(r.out.split('\n').map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL\n' + r.out.split('\n').map(l => '       ' + l).join('\n'));
}
restoreAll();
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' 3D assertions mutation-verified');
process.exit(bad ? 1 : 0);
