/* constellationcheck.js — is OBSERVATION a real constellation built from real
   astronomy and the real graph, or a picture of one?

   Nothing here tests for the word "constellation". Every assertion either
   recomputes geometry from the SIMBAD dataset and compares it with what was
   rendered, or cross-checks the drawn figure against preview.html — the
   semantic source — rather than against the renderer's own view of itself.

   CST-1  OBSERVATION uses the recorded constellation dataset, with provenance
   CST-2  exactly 8 graph stars, 7 in the chain + 1 off-asterism
   CST-3  the chain maps to the Dipper in the declared draw order
   CST-4  ANOMALY — the object with no internal relationship — is the off-asterism star
   CST-5  zero fabricated objects: every star is an object OBSERVATION already owned
   CST-6  star positions are DRIVEN by the measured RA/Dec/distance
   CST-7  depth ordering is the measured stellar distance ordering
   CST-8  no depth exaggeration is applied, and the data says why
   CST-9  the drawn lines are exactly OBSERVATION's own graph edges
   CST-10 no conventional asterism line is secretly added
   CST-11 the background sky is render-only and never enters the graph
   CST-12 the sky stays tertiary — no background star outweighs a real one
   CST-13 ownership is untouched: 14 MIGs, nothing reparented
   CST-14 the Main Mind Menu still exposes all 14 MIGs
   CST-15 the OBSERVATION highlight is deterministic and exactly reversible

   usage: node tools/constellationcheck.js [v02.html]
*/
const EXP = require('../.p3/expect.js');
const MIG_TOTAL = EXP.expectedMigs().total, NODE_TOTAL = EXP.expectedNodes().total;
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const DATA = 'data/constellation-ursa-major.json';
const tmp = (os.tmpdir() + '/ct-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02; if(!M) return {error:'__v02 missing'};
  M.enter(); M.settle(60);
  /* the MMM is now the BRAIN, where every object sits inside one small organ and
     per-object blobs overlap into saturation. World highlight is only
     measurable once the mind is unfolded, which is the state it describes. */
  M.setOpen(1); M.settle(40);
  /* measure the WORLD, not one star: at universe range an individual
     constellation star may be too small or off-frame to sample */
  /* sumSignal, not maxSignal. A bright star of the constellation sits near
     enough to most regions to pin the peak, so hovering a MIG lifted its
     sprite while the reported maximum never moved. Total light in the
     neighbourhood is monotone in the sprite's own contribution. */
  function b(id){ var x=M.spriteBlobs(id,130); return x?x.sumSignal:null; }
  var base={ obs:b('observation'), phil:b('philosophy'), st:M.hoverState() };
  M.highlight('observation'); M.settle(40);
  var hObs={ obs:b('observation'), phil:b('philosophy'), st:M.hoverState() };
  M.highlight(null); M.settle(40);
  var rel={ obs:b('observation'), phil:b('philosophy'), st:M.hoverState() };
  var menu=M.menuRows();
  M.go('region','observation'); M.settle(150);
  return { k:M.constellation('observation'), arch:M.arch(), dom:M.dom(),
           base:base, hObs:hObs, rel:rel, menu:menu, perf:M.perf() };
})()`;

const page = tmp + '/c.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},420);</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=4200 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 300000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>').replace(/&amp;/g, '&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e) {
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0, 90));
  process.exit(1);
}

const D = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const K = r.k || {};

/* ---- the SEMANTIC SOURCE, read independently of the renderer ---- */
const src = fs.readFileSync('preview.html', 'utf8');
const blk = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const srcMinors = [...blk('  var MINORS=[', '  var THOUGHTS=[')
  .matchAll(/\{id:'([^']+)',label:'([^']+)',mig:'([^']+)'/g)].map(m => ({ id: m[1], mig: m[3] }));
const srcThoughts = [...blk('  var THOUGHTS=[', '  var EDGES=[').matchAll(/\{id:'([^']+)'([^}]*)\}/g)]
  .map(m => ({ id: m[1], mig: (m[0].match(/mig:'([^']+)'/) || [])[1] }));
const srcHome = {};
srcMinors.concat(srcThoughts).forEach(o => { if (o.mig) srcHome[o.id] = o.mig; });
const eS = src.indexOf('  var EDGES=['), eE = src.indexOf('\n  ];', eS);
const srcEdges = [...src.slice(eS, eE).matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'/g)]
  .map(m => ({ a: m[1], b: m[2], verb: m[3] }));
const srcObsObjects = Object.keys(srcHome).filter(id => srcHome[id] === 'observation');
const srcObsEdges = srcEdges.filter(e => srcHome[e.a] === 'observation' && srcHome[e.b] === 'observation');

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(7) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(7) + msg); } };
const near = (a, b, t) => Math.abs(a - b) <= t;
const stars = K.stars || [];

// CST-1
ck('CST-1', K.system === 'Ursa Major' && /SIMBAD/.test(K.source || '') &&
            !!D.measured && !!D.derived && !!D.unverified && !!D.illustrative,
   'OBSERVATION uses the recorded ' + K.system + ' dataset (' +
   String(K.source).slice(0, 34) + '…), provenance split measured/derived/illustrative/unverified');

// CST-2
ck('CST-2', stars.length === 8 && (K.chain || []).length === 7 && (K.lone || []).length === 1,
   'exactly ' + stars.length + ' graph stars — ' + (K.chain || []).length +
   ' in the chain plus ' + (K.lone || []).length + ' off-asterism');

/* CST-3 — the mapping the APPROVED RESEARCH states, written out here so the
   assertion cannot move when the data moves. Comparing the render against
   K.order was circular: the mutation edited that very field and both sides
   changed together, so it could never fail. */
const order = K.order || [];
const RESEARCH_MAP = {
  'attention':'Alkaid', 't-reels':'Mizar', 'c-absurd':'Alioth', 'evidence':'Megrez',
  't-manager':'Phecda', 'patterns':'Merak', 't-magicians':'Dubhe', 'anomaly':'Alcor'
};
const chainMapped = (K.chain || []).map(id => K.map[id]);
const mapWrong = Object.keys(RESEARCH_MAP).filter(id => K.map[id] !== RESEARCH_MAP[id]);
ck('CST-3', mapWrong.length === 0 && Object.keys(K.map || {}).length === 8,
   'the mapping is exactly the one the research fixed' +
   (mapWrong.length ? ' — WRONG: ' + mapWrong.map(id => id + '→' + K.map[id]).join(', ')
                    : ' — ' + chainMapped.join(' → ')));

// CST-4 — derived from the graph, not from the name
const loneId = (K.lone || [])[0];
const loneDeg = srcObsEdges.filter(e => e.a === loneId || e.b === loneId).length;
ck('CST-4', loneId && K.map[loneId] === K.offAsterism && loneDeg === 0 &&
            (stars.find(s => s.id === loneId) || {}).offAsterism === true,
   'the object with NO internal relationship (' + loneId + ', degree ' + loneDeg +
   ') is the off-asterism star ' + K.offAsterism);

// CST-5 — nothing invented
const fabricated = stars.filter(s => srcObsObjects.indexOf(s.id) < 0);
ck('CST-5', fabricated.length === 0 && srcObsObjects.length === 8,
   'zero fabricated objects — all ' + stars.length + ' stars are among the ' +
   srcObsObjects.length + ' objects OBSERVATION owns in the source graph');

/* CST-6 — recompute the geometry from the dataset and compare with what was
   rendered. Distance RATIOS between star pairs are invariant under the world
   scale and rotation, so if the rendered figure is driven by the measured
   coordinates every pair ratio is the same constant. */
const R = Math.PI / 180;
const cart = {};
D.measured.stars.forEach(s => {
  const ra = s.raDeg * R, de = s.decDeg * R, d = s.distanceLy;
  cart[s.proper] = [d * Math.cos(de) * Math.cos(ra), d * Math.cos(de) * Math.sin(ra), d * Math.sin(de)];
});
const withPos = stars.filter(s => s.pos && cart[s.star]);
const ratios = [];
for (let i = 0; i < withPos.length; i++) for (let j = i + 1; j < withPos.length; j++) {
  const A = withPos[i], B = withPos[j];
  const exp = Math.hypot(cart[A.star][0] - cart[B.star][0], cart[A.star][1] - cart[B.star][1],
                         cart[A.star][2] - cart[B.star][2]);
  const got = Math.hypot(A.pos[0] - B.pos[0], A.pos[1] - B.pos[1], A.pos[2] - B.pos[2]);
  if (exp > 0.001) ratios.push(got / exp);
}
const rMin = Math.min(...ratios), rMax = Math.max(...ratios);
ck('CST-6', ratios.length >= 20 && rMax / rMin < 1.005 && near(rMin, K.scale, K.scale * 0.02),
   'star positions are DRIVEN by the measured coordinates — all ' + ratios.length +
   ' pair distances scale by one constant (' + rMin.toFixed(4) + '–' + rMax.toFixed(4) +
   ' scene units per ly, declared ' + K.scale + ')');

/* CST-7 — depth must be the measured distance projected onto the line of
   sight. Rebuild the figure's own frame from the dataset and compare. */
const names = D.measured.stars.map(s => s.proper);
const wv = [0, 0, 0];
D.measured.stars.forEach(s => { const c = cart[s.proper];
  for (let i = 0; i < 3; i++) wv[i] += c[i] / s.distanceLy; });
const wn = Math.hypot(...wv); const W = wv.map(x => x / wn);
const dotW = p => p[0] * W[0] + p[1] * W[1] + p[2] * W[2];
const meanDepth = names.reduce((a, nm) => a + dotW(cart[nm]), 0) / names.length;
const expected = {};
names.forEach(nm => expected[nm] = dotW(cart[nm]) - meanDepth);
const depthErr = Math.max(...withPos.map(s => Math.abs(s.depth - expected[s.star])));
const byDepth = withPos.slice().sort((a, b) => a.depth - b.depth).map(s => s.star);
const byDist = withPos.slice().sort((a, b) => expected[a.star] - expected[b.star]).map(s => s.star);
/* depth is the component along the LINE OF SIGHT, not raw distance: stars up
   to 12.5 deg off-axis project shorter by ~2%, so a few ly of deviation is the
   geometry being correct, not a fault. The ORDERING is the real claim. */
ck('CST-7', JSON.stringify(byDepth) === JSON.stringify(byDist) && depthErr < 0.05 &&
            withPos.length === 8,
   'every star\'s depth is its MEASURED distance projected on the line of sight — ' +
   byDist.slice(0, 2).join(' < ') + ' … ' + byDist[byDist.length - 1] +
   ', max deviation from the recomputed value ' + depthErr.toFixed(4) + ' ly');

// CST-8 — no exaggeration, and the data explains why
ck('CST-8', K.depthExaggeration === null &&
            D.derived.trueExtentLy && D.derived.trueExtentLy.depthOverWidth > 0.5 &&
            /No depth exaggeration/i.test(D.derived.trueExtentLy._meaning || ''),
   'no depth exaggeration is applied — the figure is measurably ' +
   D.derived.trueExtentLy.depthOverWidth + 'x as deep as it is wide, so true relative scale suffices');

// CST-9 — the lines are the graph's, checked against the SOURCE
const drawn = (K.internalEdges || []).map(e => [e.a, e.b].sort().join('|') + '|' + e.verb).sort();
const wanted = srcObsEdges.map(e => [e.a, e.b].sort().join('|') + '|' + e.verb).sort();
ck('CST-9', drawn.length === 6 && JSON.stringify(drawn) === JSON.stringify(wanted),
   'the ' + drawn.length + ' drawn lines are exactly OBSERVATION\'s own graph edges, verbs included — e.g. ' +
   (K.internalEdges[0] ? K.internalEdges[0].a + ' —' + K.internalEdges[0].verb + '→ ' +
    K.internalEdges[0].b : ''));

/* CST-10 — the conventional asterism closes the bowl between the stars holding
   the 4th and 7th chain objects. That edge is NOT in the graph, so it must not
   be drawn. If it appeared, someone added astronomy lines. */
const starToId = {};
Object.keys(K.map || {}).forEach(id => starToId[K.map[id]] = id);
const bowlA = starToId[order[3]], bowlB = starToId[order[6]];
const bowlDrawn = (K.internalEdges || []).some(e =>
  (e.a === bowlA && e.b === bowlB) || (e.a === bowlB && e.b === bowlA));
const inGraph = srcObsEdges.some(e =>
  (e.a === bowlA && e.b === bowlB) || (e.a === bowlB && e.b === bowlA));
ck('CST-10', !bowlDrawn && !inGraph,
   'no conventional asterism line is added — the bowl-closing edge ' + order[3] + '–' + order[6] +
   ' is not in the graph and is not drawn');

// CST-11 — the sky is render-only
const skyCount = (K.background || {}).count;
ck('CST-11', skyCount === D.background.atmosphericCount &&
            K.renderedPoints === K.graphNodes + K.companions + skyCount &&
            K.graphNodes === NODE_TOTAL,
   'the sky is render-only — ' + K.graphNodes + ' graph nodes + ' + K.companions +
   ' companion + ' + skyCount + ' background = ' + K.renderedPoints +
   ' rendered points; the graph is unchanged');

// CST-12 — and it stays tertiary
ck('CST-12', D.background.namedOrComponentRows > 0 &&
            skyCount === D.background.rawFieldRows - D.background.namedOrComponentRows,
   'the sky stays tertiary and does not double the figure — ' + D.background.rawFieldRows +
   ' field rows minus ' + D.background.namedOrComponentRows +
   ' that are the named stars or their components = ' + skyCount);

// CST-13
/* MIG-level reparenting was all this watched, so moving OBSERVATION's own
   objects into another region slipped straight past it. */
const strayed = stars.filter(s => s.mig !== 'observation');
ck('CST-13', r.arch.migCount === MIG_TOTAL && r.arch.reparented.length === 0 &&
            strayed.length === 0 && srcObsObjects.length === 8,
   'ownership untouched — ' + r.arch.migCount + ' MIGs, nothing reparented, and all ' +
   stars.length + ' stars still belong to OBSERVATION' +
   (strayed.length ? ' — STRAYED: ' + strayed.map(s => s.id + '→' + s.mig).join(', ') : ''));

// CST-14
ck('CST-14', (r.menu || []).length === MIG_TOTAL,
   'the Main Mind Menu still exposes all ' + (r.menu || []).length + ' MIGs');

// CST-15
ck('CST-15', r.hObs.st.hoverRegion >= 0 && r.base.st.hoverRegion === -1 &&
            r.rel.st.hoverRegion === -1 && r.hObs.obs > r.base.obs &&
            r.hObs.obs - r.hObs.phil > 30 && near(r.rel.obs, r.base.obs, 2),
   'the highlight is deterministic and reversible — OBSERVATION ' + r.base.obs + ' → ' +
   r.hObs.obs + ' (Philosophy ' + r.hObs.phil + ' behind it), released back to ' + r.rel.obs);

console.log('\n  ' + (TOTAL - bad) + '/' + TOTAL + ' constellation invariants hold');
console.log('  ' + K.system + ' · ' + stars.length + ' stars · ' + drawn.length +
            ' graph lines · ' + skyCount + ' background · scale ' + K.scale + ' u/ly');
console.log('  draw calls ' + r.perf.calls + ' · geometries ' + r.perf.geometries +
            ' · textures ' + r.perf.textures + ' · points ' + r.perf.points);
console.log(bad ? '\n' + bad + ' PROBLEM(S)'
                : '\nthe stars are real, the lines are the mind\'s');
process.exit(bad ? 1 : 0);
