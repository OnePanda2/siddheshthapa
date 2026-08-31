const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (os.tmpdir() + '/ac-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/a.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{
  var M=window.__v02; M.enter(); M.settle(4);
  ['mig','minor','thought','belief','question','project','experiment',
   'contradiction','person','reference','philosophy','society','food','love']
   .forEach(function(n){ r[n]=M.atlasStats(n); });
}catch(e){ r={err:String(e&&e.message||e)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);document.body.appendChild(p);
},300);</script>`, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1000,800' +
  ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
                         .replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
if (r.err) { console.log('ERR', r.err); process.exit(1); }
console.log('glyph          cell col,row  blobs  maxAlpha  lit');
Object.keys(r).forEach(k => {
  const v = r[k];
  if (!v) { console.log('  ' + k.padEnd(14) + ' MISSING'); return; }
  console.log('  ' + k.padEnd(14) + String(v.cell).padStart(2) + '  ' +
    (v.col + ',' + v.row).padEnd(5) + '  ' + String(v.peaks).padStart(4) +
    '   ' + String(v.maxAlpha).padStart(4) + '    ' + v.litSamples);
});
