/* tokencheck.js — prove the environment profile produces exactly the colours
   the hand-written per-world CSS used to produce.

   P2 moved 98 colour values (14 regions x 7 tokens) out of CSS and into the
   profile. Pixel diffing cannot verify that: the canvas has a brightness ramp
   and random ambient motion, so the same file captured twice differs by ~40%.
   Computed style is deterministic, and it is what actually changed.

   The GOLD table below is transcribed from the CSS as it stood before P2.

   usage: node tools/tokencheck.js preview.html
*/
const fs = require('fs'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const CHROME = process.env.CHROME ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

const GOLD = {
  philosophy : ['#07090E','#EEF1F5','#98A3B4','#5A6474','#1B2230','#5B9BFF','#2C5FA6'],
  behaviour  : ['#0A1626','#E4ECF6','#9DAEC4','#5F7089','#1B2B41','#6FA6FF','#2E5C93'],
  business   : ['#F1F3F6','#0B0E13','#4A525E','#8A939F','#C9CFD8','#2A62C9','#9AAECE'],
  technology : ['#070B12','#DCE6F4','#8C9AAF','#556275','#182231','#4C8DFF','#28558F'],
  building   : ['#0A121C','#D6E3F3','#8B9BB0','#55647A','#1B2A3D','#5FA0FF','#2B5A94'],
  learning   : ['#E6ECF4','#0F151E','#4B5665','#8A94A3','#C4CDDA','#2A62C9','#9DB2D2'],
  observation: ['#E9EBEE','#12161C','#4E5764','#8B94A1','#C6CBD3','#2A62C9','#9AAECD'],
  life       : ['#04060A','#E7ECF3','#8F9AA9','#525C6B','#141B25','#4A7FD4','#274668'],
  music      : ['#000000','#FFFFFF','#9AA0A8','#5B6068','#151719','#7FB0FF','#2E4A73'],
  movies     : ['#05070A','#E7EBF1','#8E97A5','#535C69','#161C25','#5B93E8','#2A4C7C'],
  food       : ['#101319','#E9EBEF','#9AA2AE','#616A77','#1E242E','#6E9DDC','#33526F'],
  love       : ['#080B10','#DDE4EE','#8B95A5','#525B69','#151C26','#5E8FD8','#2A4468'],
  'my-works' : ['#0D1015','#E6EAF0','#96A0AE','#5E6875','#1C232D','#6292CE','#2F4A69'],
  society    : ['#12161D','#E4E9F0','#98A2B2','#616B7A','#1F2733','#5685C4','#2E4763']
};
const NAMES = ['--env','--ink','--ink-2','--ink-3','--line','--accent','--accent-soft'];

const tmp = require('os').tmpdir() + '/tokencheck';
fs.mkdirSync(tmp, { recursive: true });
execSync('node tools/capture.js "' + file + '" "' + tmp + '/cap.html"', { stdio: 'pipe' });

const probe = `
<script>
setTimeout(function(){
  var out=[], ids=${JSON.stringify(Object.keys(GOLD))}, N=${JSON.stringify(NAMES)};
  ids.forEach(function(id){
    window.__mind.open(window.__mind.byId[id]);
    var cs=getComputedStyle(document.documentElement);
    // NOT comma-joined: an rgb() value contains commas and would be shredded
    out.push(id+'|'+N.map(function(n){return cs.getPropertyValue(n).trim();}).join('~'));
  });
  var p=document.createElement('pre');p.id='tok';p.textContent=out.join(';;');
  document.body.appendChild(p);
},400);
</script>`;
fs.writeFileSync(tmp + '/probe.html', fs.readFileSync(tmp + '/cap.html', 'utf8') + probe, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --window-size=1440,900' +
  ' --virtual-time-budget=4000 --force-prefers-reduced-motion --dump-dom "file:///' +
  tmp.replace(/\\/g, '/') + '/probe.html#mind"', { maxBuffer: 1 << 26 }).toString();

const m = dom.match(/<pre id="tok">([\s\S]*?)<\/pre>/);
if (!m) { console.error('probe did not run'); process.exit(2); }

const rgb2hex = s => {
  const p = s.match(/\d+/g);
  return p ? '#' + p.slice(0,3).map(v => (+v).toString(16).padStart(2,'0')).join('').toUpperCase() : s;
};

let bad = 0, checked = 0;
m[1].split(';;').forEach(row => {
  const [id, vals] = row.split('|');
  const got = vals.split('~').map(rgb2hex), want = GOLD[id];
  const wrong = [];
  want.forEach((w, i) => { checked++; if (got[i] !== w) wrong.push(NAMES[i] + ' want ' + w + ' got ' + got[i]); });
  if (wrong.length) { bad++; console.log('  FAIL  ' + id + ' — ' + wrong.join('; ')); }
  else console.log('  PASS  ' + id.padEnd(12) + ' all 7 tokens match the pre-P2 CSS');
});
console.log('\n' + (bad ? bad + ' REGION(S) DRIFTED' : checked + ' colour values reproduced exactly from the profile'));
process.exit(bad ? 1 : 0);
