/* screenshot the standalone brain prototype
   usage: node .p3/protoshot.js <view> <out.png> [w] [h] */
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [view, out, w, h] = process.argv.slice(2);
const W = +(w || 1200), H = +(h || 820);
execSync('node "' + path.join(__dirname, 'lineproto.js') + '" ' + (view || 'lateral') + ' ' + W + ' ' + H,
  { stdio: 'pipe' });
const tmp = (os.tmpdir() + '/bp-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });
fs.copyFileSync(path.join(__dirname,'lineproto.html'), tmp + '/b.html');
execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/cr" --no-first-run --no-default-browser-check' +
  ' --disable-extensions --disable-background-networking --disable-sync' +
  ' --window-size=' + W + ',' + H + ' --virtual-time-budget=4000' +
  ' --screenshot="' + out + '" "file:///' + tmp + '/b.html"',
  { stdio: 'pipe', timeout: 300000 });
console.log('wrote ' + out + '  ' + W + 'x' + H + '  view=' + (view || 'lateral'));
