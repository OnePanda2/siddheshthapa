/* Probe the EXACT path a screenshot takes: navigate by hash, settle, read back
   the canvas. usage: node .p3/hashprobe.js "lite&focus:love" */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/hp-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/h.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{ var M=window.__v02;
  if(M.ok()) M.settle(140);
  M.enter(); M.settle(60);
  r.afterEnter=M.hoverState();
  M.highlight('love'); M.settle(30);
  r.afterHighlight=M.hoverState();
  r.loveA=(M.spriteBlobs('love',90)||{}).maxDarkness; r.p={}; ['attachment','vulnerability','intimacy','distance','b-begged','j-ex','c-independence'].forEach(function(id){ r.p[id]=M.project(id); });
}catch(e){ r={err:String(e&&e.message||e)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);
document.body.appendChild(p);
  setTimeout(function(){ r.later=M.hoverState(); r.loveB=(M.spriteBlobs("love",90)||{}).maxDarkness; var q=document.createElement("pre");q.id="vp2";q.textContent=JSON.stringify(r);document.body.appendChild(q); },600);
},900);</script>`, 'utf8');

const hash = process.argv[2] || 'lite&focus:love';
const dom = execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new' +
  ' --hide-scrollbars --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=3200 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#' + hash + '"', { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
console.log('#' + hash);
console.log(JSON.stringify(JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&')), null, 1));
