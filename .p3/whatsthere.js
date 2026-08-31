const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/wt-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/w.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{
  var M=window.__v02; M.enter(); M.go('region','philosophy'); M.settle(120);
  r=M.near ? M.near('desire',26) : {noHook:true};
}catch(e){ r={err:String(e&&e.message||e)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);document.body.appendChild(p);
},300);</script>`, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
  .replace(/&gt;/g,'>').replace(/&amp;/g,'&')), null, 1));
