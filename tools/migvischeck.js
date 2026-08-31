/* migvischeck.js — does every MIG have its own visual species?

   The mind must not be fourteen copies of one object in different colours.
   Every authoritative MIG carries a profile in the DATA layer; the renderer
   asks speciesOf(mig) rather than branching on identity, and no MIG may
   silently fall through to the generic star.

   MV-1  every authoritative MIG has a profile
   MV-2  none is missing a primary visual family
   MV-3  none silently uses the generic fallback
   MV-4  every profile references a valid renderer family and atlas cell
   MV-5  MY WORKS remains a first-class MIG
   MV-6  PHILOSOPHY remains a first-class MIG
   MV-7  every MIG is reachable through the Main Mind Menu
   MV-8  visual profiles do not touch ownership or hierarchy
   MV-9  identity is carried by shared/batched resources, not per-MIG pipelines

   usage: node tools/migvischeck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (os.tmpdir() + '/migvis-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  M.enter();
  return {sp:M.species(), arch:M.arch(), perf:M.perf()};
})()`;

const page = tmp + '/m.html';
fs.writeFileSync(page, fs.readFileSync(FILE,'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},300);</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g,'/') + '#lite"', { maxBuffer: 1<<26, timeout: 240000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e){
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,78));
  process.exit(1);
}

const P = r.sp.profiles, ids = Object.keys(P);
let bad = 0;
const ck = (id, ok, msg) => { if(ok) console.log('  PASS  ' + id + '  ' + msg);
                              else { bad++; console.log('  FAIL  ' + id + '  ' + msg); } };

const missing = ids.filter(k => !P[k].hasProfile);
ck('MV-1', missing.length === 0,
   missing.length ? 'no visual profile for: ' + missing.join(', ')
                  : 'all ' + ids.length + ' authoritative MIGs carry a visual profile');

const noFamily = ids.filter(k => !P[k].family);
ck('MV-2', noFamily.length === 0,
   noFamily.length ? 'no visual family for: ' + noFamily.join(', ') : 'every MIG declares a family');

const generic = ids.filter(k => P[k].generic);
ck('MV-3', generic.length === 0,
   generic.length ? 'silently falls back to the generic star: ' + generic.join(', ')
                  : 'no MIG falls through to the generic star');

const VALID = ['neural','organic','binary','orbital','lattice','modular','growth',
               'constellation','nascent',
               'focus','harmonic','sequence','cluster','artifact','assembly'];
const badFam = ids.filter(k => VALID.indexOf(P[k].family) < 0);
const badCell = ids.filter(k => !(P[k].cell >= 0 && P[k].cell < r.sp.atlasCells));
ck('MV-4', badFam.length === 0 && badCell.length === 0,
   badFam.length ? 'unknown family: ' + badFam.map(k=>k+'='+P[k].family).join(', ')
   : badCell.length ? 'atlas cell out of range: ' + badCell.join(', ')
   : 'every profile maps to a real renderer family and atlas cell (' + r.sp.used + '/' + r.sp.atlasCells + ' cells used)');

/* distinctness: fourteen species that are all the same family would satisfy
   the letter of the checks and none of the point */
const fams = {}; ids.forEach(k => fams[P[k].family] = (fams[P[k].family]||0)+1);
const distinct = Object.keys(fams).length;
ck('MV-4b', distinct >= 10,
   distinct + ' distinct visual families across ' + ids.length + ' MIGs' +
   (distinct < 10 ? ' — too few to read as different kinds of thought' : ''));

ck('MV-5', P['my-works'] && P['my-works'].hasProfile && r.arch.myWorksOwnsMigs.length === 0,
   'MY WORKS has its own species (' + (P['my-works']||{}).family + ') and owns no MIG');
ck('MV-6', P['philosophy'] && P['philosophy'].hasProfile && r.arch.philosophyTopLevel,
   'PHILOSOPHY has its own species (' + (P['philosophy']||{}).family + ') and is top-level');
ck('MV-7', r.arch.migsInMenu === ids.length,
   r.arch.migsInMenu + '/' + ids.length + ' MIGs reachable through the Main Mind Menu');
ck('MV-8', r.arch.reparented.length === 0 && r.arch.migCount === ids.length,
   'visual identity changed appearance only — no reparenting, all ' + r.arch.migCount + ' MIGs intact');

/* MV-9 — identity must not cost a pipeline per MIG. One texture, one Points
   draw call for every neuron in the mind, whatever their species. */
/* The budget is 5, not 3. Three of those are the mind itself — one Points
   call for every object whatever its species, one for relationships, one for
   orbits — and that part of the claim is unchanged: identity still costs no
   pipeline per MIG. The fourth and fifth are the ORGAN, which is a mesh now
   rather than a line drawing, and a mesh is a draw call. That is the price of
   the brain having a surface, it is paid once, and it is not per-MIG either. */
/* The budget is 7, not 4, and the extra three are the SKY: the gas sphere, the
   deep-sky sprites and the star field. They are new, they are real, and each is
   drawn once from geometry built at boot — none is per-MIG and none is
   recomputed per frame. The mind's own layers are unchanged at three: one
   Points call for every object whatever its species, one for relationships,
   one for orbits. */
ck('MV-9', r.sp.textures === 1 && r.perf.textures <= 3 && r.perf.calls <= 7 && r.sp.sharedMaterial,
   'fourteen species share ' + r.perf.textures + ' texture and render in ' +
   r.perf.calls + ' draw calls, none of them per-MIG');

console.log('\n  families: ' + ids.map(k => k + '=' + P[k].family).join(' · '));
console.log('\n' + (9 - bad) + '/9 visual-identity invariants hold');
console.log(bad ? bad + ' PROBLEM(S)' : 'every MIG is its own species of star');
process.exit(bad ? 1 : 0);
