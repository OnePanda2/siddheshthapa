/* anchorcheck.js — do the mutation harnesses still point at real code?
 *
 * A mutation harness works by finding an exact string in the source and
 * replacing it. When a refactor moves that string, the anchor matches nothing,
 * and what happens next depends on the harness: the careful ones stop and say
 * UNVERIFIED, the rest quietly test nothing and report a green.
 *
 * That is not hypothetical. In one regression run:
 *   - constellationmutate CST-14 hard-stopped after 650 seconds because its
 *     anchor had been lifted into menuOrdered() by the menu-ordering work
 *   - worldmutate W5 had broken on the SAME line in the SAME commit, and was
 *     found and fixed at the time — because it was one of the three harnesses
 *     that looked affected and got dry-run. Nobody dry-ran the rest.
 *
 * Anchors cost seconds to check and hours to discover. This runs --dry across
 * every harness that has it, in about ten seconds, and NAMES the ones that
 * cannot be checked rather than counting them as passing. A tool that reports
 * a green over harnesses it never examined would be repeating the exact fault
 * it exists to prevent.
 *
 * usage: node tools/anchorcheck.js
 */
const fs = require('fs'), { execSync } = require('child_process');

const harnesses = fs.readdirSync('tools')
  .filter(f => /mutate\.js$/.test(f))
  .map(f => f.replace(/\.js$/, ''))
  .sort();

/* a harness with no --dry flag cannot be asked this question at all */
const canAsk = [], cannot = [];
harnesses.forEach(n => {
  (fs.readFileSync('tools/' + n + '.js', 'utf8').indexOf('--dry') >= 0 ? canAsk : cannot).push(n);
});

let bad = 0, checked = 0;
console.log('checking ' + canAsk.length + ' of ' + harnesses.length + ' mutation harnesses\n');

canAsk.forEach(n => {
  let out = '', code = 0;
  try { out = execSync('node tools/' + n + '.js --dry',
                       { encoding: 'utf8', maxBuffer: 1 << 24, timeout: 120000 }); }
  catch (e) { code = e.status || 1; out = ((e.stdout || '') + (e.stderr || '')).toString(); }
  const line = out.trim().split('\n').filter(Boolean).pop() || '(said nothing)';
  checked++;
  if (code === 0) console.log('  ok    ' + n.padEnd(22) + line);
  else {
    bad++;
    console.log('  BAD   ' + n.padEnd(22) + line);
    out.trim().split('\n').filter(l => /^\s*x\d/.test(l))
      .forEach(l => console.log('          ' + l.trim()));
  }
});

if (cannot.length) {
  console.log('\n  NOT CHECKED — these have no --dry:');
  cannot.forEach(n => {
    /* SAY WHY, because these are three different admissions and only one of
       them is a gap. A harness anchored into preview.html cannot go stale from
       a refactor: that file is the locked senior document and is never edited.
       One anchored into src/ can, and that is worth adding --dry for — which
       is why glmutate and highlightmutate are no longer on this list. */
    const src = fs.readFileSync('tools/' + n + '.js', 'utf8');
    const anchors = (src.match(/\bfind\s*:/g) || []).length;
    const intoLocked = /'preview\.html'/.test(src) && !/'src\//.test(src);
    console.log('          ' + n.padEnd(22) +
      (!anchors ? 'builds its own fixture; it has no source anchors to break'
       : intoLocked ? anchors + ' anchor(s), all into preview.html — locked, so they cannot move'
       : anchors + ' anchor(s) into source that CAN move, and no way to audit them'));
  });
  const risky = cannot.filter(n => {
    const src = fs.readFileSync('tools/' + n + '.js', 'utf8');
    return /\bfind\s*:/.test(src) && /'src\//.test(src);
  });
  if (risky.length)
    console.log('\n  ' + risky.length + ' of those anchor into files that move: ' +
                risky.join(', ') + ' — they should grow a --dry flag');
}

console.log('\n' + (checked - bad) + '/' + checked + ' harnesses have every anchor matching exactly once' +
            (cannot.length ? '  (' + cannot.length + ' not checked)' : ''));
console.log(bad ? bad + ' HARNESS(ES) POINTING AT CODE THAT MOVED'
                : 'every anchor that can be checked still points at real code');
process.exit(bad ? 1 : 0);
