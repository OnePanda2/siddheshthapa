const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const tmp = (require('../tools/scratch.js').root() + '/hv-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });
const page = tmp + '/h.html';
fs.writeFileSync(page, fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
var r={};
try{
  var M=window.__v02; M.enter(); M.settle(60);
  function bright(id){ var b=M.spriteBlobs(id,90); return b? b.maxDarkness : null; }
  r.none = {state:M.hoverState(), phil:bright('philosophy'), works:bright('my-works'), life:bright('life')};
  M.highlight('philosophy'); M.settle(50);
  r.hoverPhil = {state:M.hoverState(), phil:bright('philosophy'), works:bright('my-works'), life:bright('life')};
  M.highlight('my-works'); M.settle(50);
  r.hoverWorks = {state:M.hoverState(), phil:bright('philosophy'), works:bright('my-works'), life:bright('life')};
  M.highlight(null); M.settle(50);
  r.released = {state:M.hoverState(), phil:bright('philosophy'), works:bright('my-works'), life:bright('life')};
  r.arch = M.arch();
}catch(e){ r={err:String(e&&e.message||e)}; }
var p=document.createElement('pre');p.id='vp';p.textContent=JSON.stringify(r);document.body.appendChild(p);
},320);</script>`, 'utf8');
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
  ' --virtual-time-budget=2800 --force-prefers-reduced-motion --dump-dom "file:///' +
  page.replace(/\\/g, '/') + '#lite"';
const dom = execSync(cmd, { maxBuffer: 1 << 26, timeout: 200000 }).toString();
const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
if (!m) { console.log('NO PROBE'); process.exit(1); }
const r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<')
                         .replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
if (r.err) { console.log('ERR', r.err); process.exit(1); }
console.log('state          hoverRegion  orbitHover  philosophy  my-works  life');
['none','hoverPhil','hoverWorks','released'].forEach(k => {
  const v = r[k];
  console.log('  ' + k.padEnd(12) +
    String(v.state.hoverRegion).padStart(6) + '      ' +
    String(v.state.orbitHover).padStart(4) + '     ' +
    String(v.phil).padStart(7) + '   ' + String(v.works).padStart(7) + '  ' + String(v.life).padStart(5));
});
console.log('\npalette:', r.none.state.palette, JSON.stringify(r.none.state.philPalette));
console.log('MIGs intact after hovering:', r.arch.migCount, '· reparented:', r.arch.reparented.length);
