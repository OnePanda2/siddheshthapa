/* screenshot one constellation approach
   usage: node .p3/const/shot.js <A|B|C|D> <out.png> [w] [h] */
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [ap, out, w, h] = process.argv.slice(2);
const W = +(w || 1400), H = +(h || 1000);
execSync('node "' + path.join(__dirname, 'gen.js') + '" ' + ap + ' ' + W + ' ' + H, { stdio: 'pipe' });
const tmp = (os.tmpdir() + '/cp-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'proto.html'), tmp + '/p.html');
execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=4500' +
  ' --screenshot="' + out + '" "file:///' + tmp + '/p.html"',
  { stdio: 'pipe', timeout: 300000 });
console.log('wrote ' + out.split(/[\\/]/).pop());
