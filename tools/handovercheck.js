/* Every checkable claim in HANDOVER.md, checked against the repository.
   A handover that is confidently wrong is worse than none. */
const fs = require('fs'), { execSync } = require('child_process');
const h = fs.readFileSync('HANDOVER.md', 'utf8');
let bad = 0;
const ck = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok    ' : '  WRONG ') + msg); };

const harnessFiles = fs.readdirSync('tools').filter(f => /(check|mutate|fill)\.js$/.test(f));
ck(/55 test harnesses/.test(h) && /\*\*55 harnesses\*\*/.test(h) && harnessFiles.length === 55,
   '55 harnesses (tools/ has ' + harnessFiles.length + ')');

const D = JSON.parse(fs.readFileSync('data/astronomy-systems.json', 'utf8'));
ck(/\*\*26 systems\*\*/.test(h) && D.systems.length === 26, '26 systems');
ck(/\*\*12 are held unassigned\*\*/.test(h) && D.systems.filter(s => s.reserve).length === 12,
   '12 unassigned');
ck(/\*\*14 are assigned\*\*/.test(h) && D.systems.filter(s => !s.reserve).length === 14,
   '14 assigned');

const n = JSON.parse(fs.readFileSync('data/notes.json', 'utf8'));
const keys = Object.keys(n).filter(k => k[0] !== '_');
ck(/all ten\nkeys/.test(h) && keys.length === 10, 'ten store keys (' + keys.length + ')');
keys.forEach(k => ck(h.indexOf(k) >= 0, 'store key documented: ' + k));

const app = fs.readFileSync('src/v02-app.js', 'utf8');
const ovStart = app.indexOf('var V02_OVERLAY={');
const channels = [...app.slice(ovStart, ovStart + 16000).matchAll(/^  ([a-zA-Z]+):/gm)].map(m => m[1]);
channels.forEach(c => ck(h.indexOf('`' + c + '`') >= 0, 'overlay channel documented: ' + c));
ck(channels.length === (h.match(/^\| `(relabel|menuLast|reline|reedge|hideMIGs|renameIds|addMIGs|addMinors|addWritings|addWorks|addEdges)`/gm) || []).length,
   'overlay table has one row per channel (' + channels.length + ')');

ck(/36\.653/.test(h), 'the derived world centre is stated');
ck(/2bb2ddc/.test(h), 'the commit it was written at is stated');
/* THE COMMIT COUNT IS NOT ASSERTED, deliberately. It was, and it failed on the
   very commit that fixed it — every commit invalidates it, including this one,
   so the check demanded an edit to the document on every push and would have
   been wrong far more often than right. An assertion that cannot hold still is
   not an assertion, it is a chore. The document states the figure as a
   snapshot instead, which is a true sentence that stays true. */
const commits = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
ck(/at the time of writing/.test(h),
   'the commit count is framed as a snapshot rather than a live claim (now ' + commits + ')');

['preview.html', 'CONTENT-MODEL.md', 'tools/regression.sh', 'tools/anchorcheck.js',
 'tools/scratch.js', 'worker/index.js', 'data/editor-config.json', 'tools/build-v02.js',
 '.github/workflows/deploy.yml'].forEach(f => {
  ck(fs.existsSync(f) && h.indexOf(f) >= 0, 'names a file that exists: ' + f);
});

/* the runner really does invoke everything the handover lists in its groups */
const rs = fs.readFileSync('tools/regression.sh', 'utf8');
['anchorcheck', 'editorcheck', 'edgecheck', 'edgemutate', 'editormutate', 'menucheck',
 'regioncheck', 'reservecheck'].forEach(t => {
  ck(rs.indexOf(t) >= 0 && h.indexOf(t) >= 0, 'registered and documented: ' + t);
});

console.log('\n' + (bad ? bad + ' CLAIM(S) WRONG' : 'every checkable claim in HANDOVER.md holds'));
process.exit(bad ? 1 : 0);
