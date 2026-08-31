const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/lv-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/l.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{
  var M=window.__v02; M.enter(); M.settle(60);
  r.astro=M.astro();
  M.go('region','love'); M.settle(160);
  r.after=M.state();
  r.starA=M.project('love'); r.nodeA=M.nodeAt('love'); r.att=M.project('attachment'); r.ink=M.ink(); r.perf=M.perf();
}catch(e){ r={err:String(e&&e.message||e), stack:String(e&&e.stack||'').slice(0,600)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);document.body.appendChild(p);
},320);</script>`, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=3000 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
console.log(JSON.stringify(r, null, 1).slice(0, 4000));
