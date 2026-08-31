const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/diag' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/d.html';
const probe = `
<script>setTimeout(function(){
var M=window.__v02,r;
try{
  M.settle(60);
  var cv=document.getElementById('gl');
  var gl=M.gltest?null:null;
  r={ ink:M.ink(), perf:M.perf(), proj:M.project('philosophy'),
      projCuriosity:M.project('curiosity'),
      canvasAttr:[cv.width,cv.height], client:[cv.clientWidth,cv.clientHeight],
      atlas:(window.__v02.atlasProbe?window.__v02.atlasProbe():'n/a'),
      state:M.state() };
}catch(e){ r={err:String(e&&e.message||e), stack:String(e&&e.stack||'').slice(0,300)}; }
var p=document.createElement('pre'); p.id='vp';
p.textContent=JSON.stringify(r); document.body.appendChild(p);
},300);</script>`;
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + probe, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --use-gl=swiftshader --enable-unsafe-swiftshader --user-data-dir="' + tmp + '/cr"' +
  ' --no-first-run --window-size=1440,900 --virtual-time-budget=2600' +
  ' --force-prefers-reduced-motion --dump-dom "file:///' + page.replace(/\\/g,'/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const txt = m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
console.log(JSON.stringify(JSON.parse(txt), null, 1));
