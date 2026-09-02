/* p46matrix.js — the P4.6 gate: every Chrome-based check across the full
   width matrix, run ONE AT A TIME.

   Two Chrome-heavy tools running at once have raced in this project before
   (a 1920 probe read a 375 frame from a shared tmp dir), so this is strictly
   serial. A tool that cannot be measured at a width is a FAILURE at that
   width, never a skip.

   usage: node tools/p46matrix.js [preview.html]
*/
const { execSync } = require('child_process');
const FILE = process.argv[2] || 'preview.html';
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
const hFor = w => (w === 2560 ? 1080 : w >= 1920 ? 1080 : w >= 1280 ? 900 : w >= 768 ? 1024 : 812);

const rows = [];
function run(label, cmd){
  const t = Date.now();
  try {
    const out = execSync(cmd, { maxBuffer: 1 << 26, timeout: 900000 }).toString();
    rows.push({ label, ok: true, ms: Date.now() - t, out });
    console.log('  PASS  ' + label + '  (' + Math.round((Date.now()-t)/1000) + 's)');
    return true;
  } catch (e){
    const out = (e.stdout || '').toString() + (e.stderr || '').toString();
    rows.push({ label, ok: false, ms: Date.now() - t, out });
    console.log('  FAIL  ' + label);
    out.split('\n').filter(l => /FAIL|PROBLEM|Error|error/.test(l)).slice(0,6)
       .forEach(l => console.log('          ' + l.trim()));
    return false;
  }
}

console.log('P4.6 GATE — ' + FILE + '\n');
console.log('STATIC');
run('validate',   'node tools/validate.js "' + FILE + '"');
run('accept',     'node tools/accept.js "' + FILE + '"');

console.log('\nRUNTIME — reference viewport');
run('tokencheck',        'node tools/tokencheck.js "' + FILE + '"');
run('overlapcheck',      'node tools/overlapcheck.js "' + FILE + '"');
run('contradictioncheck','node tools/contradictioncheck.js "' + FILE + '" 1440 900');

console.log('\nWIDTH MATRIX — gridcheck + marginaliacheck at every width');
WIDTHS.forEach(w => {
  const h = hFor(w);
  run('gridcheck ' + w + 'x' + h,       'node tools/gridcheck.js "' + FILE + '" ' + w + ' ' + h);
  run('marginaliacheck ' + w + 'x' + h, 'node tools/marginaliacheck.js "' + FILE + '" ' + w + ' ' + h);
});

console.log('\nRESPONSIVE + ULTRAWIDE');
run('mobilecheck', 'node tools/mobilecheck.js "' + FILE + '"');
run('widecheck 2560x1080', 'node tools/widecheck.js "' + FILE + '" 2560 1080');
run('contradictioncheck 2560x1080', 'node tools/contradictioncheck.js "' + FILE + '" 2560 1080');

const bad = rows.filter(r => !r.ok);
console.log('\n──────── P4.6 GATE ────────');
rows.forEach(r => console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.label));
console.log('\n' + (rows.length - bad.length) + '/' + rows.length + ' green');
if (bad.length){
  console.log('\nFAILING OUTPUT');
  bad.forEach(r => { console.log('\n=== ' + r.label + ' ===\n' + r.out); });
}
process.exit(bad.length ? 1 : 0);
