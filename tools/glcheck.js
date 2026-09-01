/* glcheck.js — can the 3D environment be TESTED?

   Built before the universe, deliberately (V02 brief §7). Pixel diffing has
   been invalid for this project since V0.3 and 3D does not change that, so
   nothing here samples pixels. It asserts two kinds of truth:

     SCENE-GRAPH STATE      what the model says exists
     PROJECTED COORDINATES  where a real node lands on a real viewer's screen

   Both are derived from `camera.project()`, so they test the same matrices the
   renderer uses. A state that cannot be measured FAILS.

   usage: node tools/glcheck.js [v02.html] [w] [h] [state]
*/
const NODE_TOTAL = require('../.p3/expect.js').expectedNodes().total;
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const ONLY = process.argv[5];

const tmp = (require('./scratch.js').root() + '/glcheck-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

/* Each state is a hash the app boots straight into, plus the probe to run.
   Booting directly is far cheaper than driving the UI and avoids timing races. */
const STATES = [
  { id: 'universe',  hash: 'lite' },
  { id: 'region',    hash: 'lite&focus:philosophy' },
  { id: 'concept',   hash: 'lite&focus:curiosity' },
  { id: 'reading',   hash: 'lite&read:b-kind' }
];

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing — the app did not boot'};
  if(!M.ok()) return {error:'no WebGL context'};
  M.settle(120);                       // headless-lite: run the easing to rest
  var g=M.graph(), s=M.state(), p=M.perf(), sp=M.spread(), d=M.dom(), ink=M.ink();

  /* every node the graph declares must have a real position, and the layout
     must be genuinely volumetric — a flat plane with perspective would show a
     collapsed axis, which is exactly the failure V02 §9 forbids */
  var vol = sp.x>20 && sp.y>20 && sp.z>20;
  var ratio = Math.min(sp.x,sp.y,sp.z)/Math.max(sp.x,sp.y,sp.z);

  /* screen-space truth for a handful of real ids */
  var probes={};
  ['philosophy','life','society','curiosity','b-kind','b-boundaries','c-curiosity']
    .forEach(function(id){ probes[id]=M.project(id); });

  /* a real cross-region relationship must exist in the model */
  var crossOK = g.cross>0;

  return {
    graph:g, state:s, perf:p, spread:sp, volumetric:vol, axisRatio:+ratio.toFixed(2),
    ranges:M.ranges(), probes:probes, dom:d, crossEdges:g.cross, crossOK:crossOK, ink:ink,
    onScreen:Object.keys(probes).filter(function(k){return probes[k]&&probes[k].onScreen;}).length
  };
})()`;

function run(st){
  const page = tmp + '/p-' + st.id + '.html';
  const src = fs.readFileSync(FILE, 'utf8');
  fs.writeFileSync(page, src + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var pre=document.createElement('pre'); pre.id='vp';
  pre.textContent=JSON.stringify({viewport:{w:innerWidth,h:innerHeight},result:r});
  document.body.appendChild(pre);
},260);
</script>`, 'utf8');

  const url = 'file:///' + page.replace(/\\/g,'/') + '#' + st.hash;
  const cmd = '"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr-' + st.id + '"' +
    ' --no-first-run --no-default-browser-check --disable-extensions' +
    ' --disable-background-networking --disable-sync' +
    ' --window-size=' + Math.max(W,520) + ',' + Math.max(H,520) +
    ' --virtual-time-budget=2600 --force-prefers-reduced-motion' +
    ' --dump-dom "' + url + '"';
  const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 240000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  const decoded = m[1].replace(/&nbsp;/g,' ').replace(/&quot;/g,'"')
                      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  return JSON.parse(decoded);
}

let bad = 0, measured = 0, first = null;
const list = ONLY ? STATES.filter(s => s.id === ONLY) : STATES;

list.forEach(st => {
  let r;
  try {
    const parsed = run(st);
    if (Math.abs(parsed.viewport.w - W) > 24) throw new Error('viewport ' + parsed.viewport.w);
    r = parsed.result;
    if (!r || r.error) throw new Error(r ? r.error : 'no result');
  } catch (e){
    console.log('  FAIL  ' + st.id.padEnd(10) + ' NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,70));
    bad++; return;                       // unmeasured is a failure, never a pass
  }
  measured++;
  if (!first) first = r;
  const p = [];

  // 1 — the model is intact and is the same mind
  if (r.graph.nodes !== NODE_TOTAL) p.push('expected ' + NODE_TOTAL + ' nodes, model has ' + r.graph.nodes);
  if (r.graph.links !== 126) p.push('expected 126 relationships, model has ' + r.graph.links);

  // 2 — the layout is genuinely three-dimensional
  if (!r.volumetric)
    p.push('layout is not volumetric — spread ' + JSON.stringify(r.spread) +
           '; a collapsed axis means the 2D graph was placed in Z');
  if (r.axisRatio < 0.28)
    p.push('one axis dominates (ratio ' + r.axisRatio + ') — the universe is nearly a plane');

  // 3 — real objects land on a real screen
  const off = Object.keys(r.probes).filter(k => r.probes[k] === null);
  if (off.length) p.push('no position for: ' + off.join(', '));
  if (!r.onScreen) p.push('not one probed node projects on screen');

  // 4 — cross-region relationships exist in the model
  if (!r.crossOK) p.push('no cross-region relationships — interdisciplinarity is the product');

  // 5 — perception ranges are real, not decorative
  const rg = r.ranges;
  if ((rg.far + rg.mid + rg.near) !== r.graph.nodes)
    p.push('ranges do not account for every node: ' + JSON.stringify(rg));
  if (st.id === 'universe' && rg.far < 20)
    p.push('from the universe almost nothing is distant (far=' + rg.far + ') — there is no depth to travel through');
  if (st.id === 'concept' && rg.near < 1)
    p.push('approaching a concept brought nothing into near range');

  // 6 — the DOM layer carries the structure, and the canvas is not the site
  if (!r.dom.canvasHidden) p.push('the canvas is not aria-hidden — WebGL must never be the structure');
  if (r.dom.navRows < 3) p.push('only ' + r.dom.navRows + ' navigable rows in the DOM layer');
  if (!r.dom.where) p.push('the DOM layer does not say where you are');

  // 7 — rendering actually happened
  if (!r.perf || !r.perf.calls) p.push('zero draw calls — nothing was rendered');

  /* 8 — AND IT REACHED THE SCREEN. Draw calls are not evidence: the first
     build reported 143 points and 1260 lines while rendering a blank white
     field, because the fog was calibrated for a room and erased the universe.
     This is not pixel diffing (invalid here since V0.3) — it asks only
     whether anything at all is distinguishable from the ground. */
  if (st.id !== 'reading') {
    if (!r.ink) p.push('could not read the frame back');
    else {
      if (r.ink.pct < 0.4)
        p.push('the frame is effectively blank — only ' + r.ink.pct + '% of sampled pixels ' +
               'differ from the ground; objects are drawn but invisible');
      if (r.ink.range < 14)
        p.push('no tonal range in the frame (' + r.ink.range + ') — nothing is legible against the ground');
    }
  }

  if (p.length){ bad += p.length; console.log('  FAIL  ' + st.id); p.forEach(x => console.log('          ' + x)); }
  else console.log('  PASS  ' + st.id.padEnd(10) +
    'spread ' + r.spread.x + '/' + r.spread.y + '/' + r.spread.z +
    '  far·mid·near ' + rg.far + '·' + rg.mid + '·' + rg.near +
    '  calls ' + r.perf.calls + '  ' + r.perf.frameMs + 'ms');
});

if (first && first.perf)
  console.log('\n  renderer: ' + first.perf.renderer +
              '\n  points ' + first.perf.points + ' · lines ' + first.perf.lines +
              ' · geometries ' + first.perf.geometries + ' · textures ' + first.perf.textures +
              ' · dpr ' + first.perf.dpr +
              '\n  graph: ' + first.graph.nodes + ' nodes · ' + first.graph.links +
              ' relationships · ' + first.crossEdges + ' cross-region');

console.log('\n' + measured + '/' + list.length + ' states measured at ' + W + 'x' + H);
console.log(bad ? bad + ' PROBLEM(S)' : 'the 3D environment is measurable and the model is intact');
process.exit(bad ? 1 : 0);
/* RENDERER NOTE — do not "restore" SwiftShader here.
   --use-gl=swiftshader LOSES THE CONTEXT on this scene (glError 37442,
   CONTEXT_LOST_WEBGL) and every frame reads back as zeros, which looks
   exactly like a rendering bug in the app and is not one. Default headless
   uses ANGLE over the D3D11 Basic Render Driver, reports lost:false,
   glError:0 and a point-size range of 1..1024. Measured 2026-08-19. */
