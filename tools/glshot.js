/* glshot.js — screenshot a V02 state at a true CSS viewport.
   usage: node tools/glshot.js <w> <h> <hash> <out.png> [file]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [W, H, hash, out, file] = process.argv.slice(2);
const FILE = file || 'v02.html';
const tmp = (require('./scratch.js').root() + '/glshot-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

/* settle the camera before the shutter: lite mode renders on demand, so drive
   the easing to rest rather than hoping a timer lands in the right place */
const page = tmp + '/s.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') +
  `\n<script>setTimeout(function(){ if(window.__v02&&window.__v02.ok()) window.__v02.settle(140); },120);</script>`, 'utf8');

const url = 'file:///' + page.replace(/\\/g,'/') + '#' + (hash || 'lite');
execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + Math.max(+W,520) + ',' + Math.max(+H,520) +
  ' --virtual-time-budget=3200 --force-prefers-reduced-motion' +
  ' --screenshot="' + out + '" "' + url + '"', { stdio: 'pipe', timeout: 240000 });
console.log('wrote ' + out + '  ' + W + 'x' + H + '  #' + (hash||'lite'));
