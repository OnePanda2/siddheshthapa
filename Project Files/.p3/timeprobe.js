/* Drive the app with REAL time passing, not a synchronous settle loop.
   A time-driven morph cannot advance inside a tight loop, because
   performance.now() barely moves between synchronous calls. */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [W, H, driver] = process.argv.slice(2);
const tmp = (require('../tools/scratch.js').root() + '/tp-' + process.pid).split(String.fromCharCode(92)).join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(tmp + '/p.html', fs.readFileSync('v02.html', 'utf8') + `
<script>
var OUT={};
function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
setTimeout(async function(){
  try{
    var M=window.__v02;
    ${driver}
  }catch(e){ OUT.ERROR=(e&&e.message)||String(e); }
  document.title=JSON.stringify(OUT);
},400);
</script>`, 'utf8');
const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --disable-extensions' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=20000 --dump-dom "file:///' + tmp + '/p.html"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const m = dom.match(/<title>([\s\S]*?)<\/title>/);
process.stdout.write(m ? m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&') : 'no result');
