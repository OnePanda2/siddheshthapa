/* Run a driver against v02.html and get its return value back as JSON.
   usage: node .p3/probe.js <w> <h> "<driver returning an object>" [noenter]

   The result is stringified into document.title and read out of --dump-dom,
   which is the same route every other probe in this project uses. */
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [W, H, driver, noenter] = process.argv.slice(2);
const tmp = (require('../tools/scratch.js').root() + '/pr-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
const enterLine = (noenter === 'noenter') ? '' : 'M.enter(); M.settle(200);';
fs.writeFileSync(tmp + '/p.html', fs.readFileSync('v02.html', 'utf8') + `
<script>setTimeout(function(){
  var out;
  try{
    var M=window.__v02;
    ${enterLine}
    out=(function(){ ${driver} })();
  }catch(e){ out={ERROR:(e&&e.message)||String(e)}; }
  document.title=JSON.stringify(out);
},300);</script>`, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=5200' +
  ' --dump-dom "file:///' + tmp + '/p.html"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });

const m = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!m) { console.error('no result'); process.exit(1); }
const txt = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
process.stdout.write(txt);
