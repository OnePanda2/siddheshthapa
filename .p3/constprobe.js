const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/cn-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/c.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02;
  M.enter(); M.settle(60);
  r.k=M.constellation('observation');
  M.go('region','observation'); M.settle(150);
  r.state=M.state(); r.perf=M.perf();
  r.proj={}; ['attention','evidence','patterns','anomaly','t-reels','c-absurd','t-manager','t-magicians','observation']
    .forEach(function(id){ r.proj[id]=M.project(id); });
  r.arch=M.arch(); r.graph=M.graph();
}catch(e){ r={err:String(e&&e.message||e), stack:String(e&&e.stack||'').slice(0,500)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);
document.body.appendChild(p);
},420);</script>`, 'utf8');
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=4000 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '"', { maxBuffer: 1 << 26, timeout: 240000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
if (r.err) { console.log('ERR ' + r.err + '\n' + r.stack); process.exit(1); }
const k = r.k;
console.log('system        ' + k.system + '   scale ' + k.scale + ' u/ly   depthExag ' + k.depthExaggeration);
console.log('source        ' + k.source);
console.log('mean distance ' + k.meanDistanceLy + ' ly  (the ideal viewpoint)');
console.log('\nchain walked from the graph (' + k.chain.length + '), isolated (' + k.lone.length + '):');
k.chain.forEach((id, i) => console.log('  ' + (i + 1) + '. ' + id.padEnd(15) + ' -> ' + k.map[id]));
k.lone.forEach(id => console.log('  *  ' + id.padEnd(15) + ' -> ' + k.map[id] + '   (off-asterism)'));
console.log('\nstars as rendered:');
k.stars.forEach(s => console.log('  ' + s.star.padEnd(7) + s.id.padEnd(15) + s.kind.padEnd(14) +
  'V ' + String(s.vMag).padStart(6) + '  ' + String(s.ly).padStart(7) + ' ly  depth ' +
  String(s.depth).padStart(8) + (s.offAsterism ? '  GOLD' : '')));
console.log('\ninternal edges drawn (' + k.internalEdges.length + '):');
k.internalEdges.forEach(e => console.log('  ' + e.a + '  --' + e.verb + '-->  ' + e.b));
console.log('\nbackground   ' + k.background.count + ' render-only stars');
console.log('MIG body emph ' + k.migBodyDrawn + '   (0 = the constellation is the emblem)');
console.log('points ' + k.renderedPoints + ' = graph ' + k.graphNodes + ' + companions ' +
  k.companions + ' + sky ' + k.background.count);
console.log('perf  calls ' + r.perf.calls + ' · geom ' + r.perf.geometries + ' · tex ' + r.perf.textures);
console.log('\nprojected on arrival:');
Object.keys(r.proj).forEach(id => { const p = r.proj[id];
  console.log('  ' + id.padEnd(15) + (p ? ('(' + String(p.x).padStart(5) + ',' + String(p.y).padStart(5) +
    ')  d=' + String(p.dist).padStart(6) + '  ' + (p.onScreen ? 'ON' : 'off')) : 'null')); });
console.log('\nMIGs ' + r.arch.migCount + ' · reparented ' + r.arch.reparented.length);
