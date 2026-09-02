/* Line endings must stay LF.

   Every patch script in this project anchors on exact text containing \n.
   Python's text-mode write translates \n to \r\n on Windows, so an edit made
   that way silently converts whatever it touches to CRLF and every anchor
   through that region stops matching — with no error, just "x0". That has
   cost real time twice. This normalises and reports, so it can be run after
   any editing pass and wired into the build.

   usage: node tools/normalise.js [--check]
*/
const fs = require('fs'), path = require('path');
const CHECK = process.argv.includes('--check');
const ROOTS = ['src', 'tools', 'data'];
const EXT = /\.(js|html|json|md|css)$/;
let touched = 0, scanned = 0;
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f), s = fs.statSync(p);
    if (s.isDirectory()) { walk(p); continue; }
    if (!EXT.test(f)) continue;
    scanned++;
    const raw = fs.readFileSync(p, 'utf8');
    if (raw.indexOf('\r\n') < 0) continue;
    touched++;
    const n = raw.split('\r\n').length - 1;
    console.log('  ' + (CHECK ? 'CRLF' : 'fixed') + '  ' + p + '  (' + n + ' lines)');
    if (!CHECK) fs.writeFileSync(p, raw.split('\r\n').join('\n'), 'utf8');
  }
}
ROOTS.filter(fs.existsSync).forEach(walk);
console.log(scanned + ' files scanned, ' + touched + (CHECK ? ' with CRLF' : ' normalised'));
process.exit(CHECK && touched ? 1 : 0);
