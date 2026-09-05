/* margmutate.js — mutation harness for tools/marginaliacheck.js

   A check nobody has broken on purpose is an unverified check. For every
   assertion: mutate the behaviour, PROVE the mutation reached the file, run
   the check, require it to FAIL for the stated reason, restore, and require
   it to PASS again. A mutation that did not apply is a hard stop, never a SKIP.

   usage: node tools/margmutate.js [preview.html]
*/
const fs = require('fs'), { execSync } = require('child_process');
const FILE = process.argv[2] || 'preview.html';
const ORIGINAL = fs.readFileSync(FILE, 'utf8');

/* Each entry states which assertion it exercises, the exact edit, and the
   substring the failure output must contain — "it failed" is not enough,
   it has to fail for the RIGHT reason. */
const MUTATIONS = [
  { n: 1, name: 'SOURCE authenticity — text must equal n.src',
    find: "st=n.src?String(n.src):''",
    repl: "st=(n.src?String(n.src):'')+' (ed.)'",
    expect: 'FABRICATED' },

  { n: 2, name: 'CROSS authenticity — named region must be really reached',
    find: "dt='→ '+byId[dests[0]].label.toLowerCase()",
    repl: "dt='→ '+'business'",
    expect: 'but its real edges reach' },

  { n: '2b', name: 'CROSS authenticity — the "+n" remainder must be true',
    find: "(dests.length>1?' +'+(dests.length-1):'')",
    repl: "(' +3')",
    expect: 'other regions are reached' },

  { n: 3, name: 'CROSS existence — the layer may not silently render nothing',
    find: "if(srcOk && dests.length){",
    repl: "if(false && srcOk && dests.length){",
    expect: 'MISSING cross-region marks' },

  { n: 4, name: 'no fabricated footnote / "cf. N" marks',
    find: "sw=g.measureText(st).width; sx=",
    repl: "st='cf. 3'; sw=g.measureText(st).width; sx=",
    expect: 'fabricated footnote/cf pattern' },

  { n: 5, name: 'marks stay inside the annotation margins',
    find: "sx=Math.min(W*.994-sw, Z.Rm.x0+2);",
    repl: "sx=W*.46;",
    expect: 'outside the annotation margins' },

  /* The margin IS the panel: a mark then lands squarely on the reading page,
     which is the defect P4.6 found and fixed. */
  { n: 6, name: 'no mark on the reading panel',
    edits: [{ find: "for(var r=0;r<Z.obs.length;r++){",
              repl: "for(var r=0;r<0*Z.obs.length;r++){" },
            { find: "sx=Math.min(W*.994-sw, Z.Rm.x0+2);",
              repl: "sx=Z.panel?Z.panel.x0+30:Math.min(W*.994-sw, Z.Rm.x0+2);" }],
    expect: 'on the reading panel' },

  /* Drop the obstacle clearing entirely — the right margin then spans the six
     rim labels marching down the right edge, the other half of the same bug. */
  /* Keeping a mark off a label is implemented twice — clearOf() cuts the
     annotation band around every drawn label, and margFits() tests the mark's
     own box against the same obstacles. P4.7 added the FOCUS node to that set,
     which shrank the band far enough that removing only the second test no
     longer produces a collision. Both have to go. */
  /* RUN AT 1440x900, WHICH IS THE ONLY THING THAT WAS WRONG WITH IT.

     This sat unverified for weeks and the note above records one earlier
     attempt: P4.7 added the focus node to the obstacle set, removing only the
     second guard stopped colliding, so both were removed. Both ARE removed —
     and it still caught nothing, which is where it was left.

     Measured rather than reasoned about, at four viewports with both guards
     stripped and preview.html copied rather than touched:

       2560x1080   philosophy 0   curiosity 0   c-curiosity 0
       1920x1080   philosophy 9   curiosity 2   c-curiosity 0
       1440x900    philosophy 5   curiosity 4   c-curiosity 0
       1280x800    philosophy 2   curiosity 2   c-curiosity 1

     The guards are load-bearing everywhere except the one width this was
     pinned to. At 2560 the annotation band is proportional to the width and
     the marks — which sit at their fragments' baselines — end up in a
     different band of y entirely from the rim labels. They overlap in x by
     some 25px and never in y, so nothing can be caught by removing the thing
     that keeps them apart.

     1440x900 is marginaliacheck's own default, so this is the size the
     assertion is checked at in the ordinary course of things, and the same
     size the suite already proves it PASSES at. Five collisions in one state
     and four in another is a wide margin, not a lucky pixel. */
  { n: 7, name: 'no mark over a drawn graph label', w: 1440, h: 900,
    edits: [{ find: "for(var r=0;r<Z.obs.length;r++){",
              repl: "for(var r=0;r<0*Z.obs.length;r++){" },
            { find: "clearOf({x0:marginR-W*annW*.5",
              repl: "(function(z){return z;})({x0:marginR-W*annW*.5" }],
    expect: 'over a graph label' },

  /* Feed the layer a FIXED pair of writings at baselines inside every state's
     right margin (the three Rm boxes all contain y660–680), so the painted set
     is byte-identical whatever the visitor is looking at. The previous attempt
     merely CAPPED the count and produced 2/3/3 — different sets with different
     totals — which is not the condition this assertion is about. */
  { n: 8, name: 'marginalia responds to a change of focus',
    find: "fragHits.forEach(function(h){",
    repl: "[{id:'b-kind',ty0:645,ty1:665}].forEach(function(h){",
    expect: 'does not respond to attention' },

  { n: 9, name: 'marginalia stays subordinate to the fragments',
    find: "var MARG_ALPHA={src:{strong:.30, quiet:.14}, cross:{strong:.34, quiet:.15}};",
    repl: "var MARG_ALPHA={src:{strong:.30, quiet:.14}, cross:{strong:.92, quiet:.15}};",
    expect: 'not subordinate' },

  /* Switch the whole layer off. At 1440 the annotation margin has real room,
     so "nothing painted" must be reported as a failure there — while at 768,
     where the reading panel spans the margin and no room exists, zero marks is
     correctly a pass. That distinction is measured from z.Rm, not assumed. */
  { n: 11, name: 'the layer renders at all where there is room for it',
    find: "if(Z){\n          g.textBaseline='alphabetic';",
    repl: "if(0&&Z){\n          g.textBaseline='alphabetic';",
    expect: 'no marginalia painted at all' },

  { n: 10, name: 'marginalia is not clickable',
    find: "  function fragmentAt(mx,my){\n    for(var i=fragHits.length-1;i>=0;i--){",
    repl: "  function fragmentAt(mx,my){\n    for(var q=marginalia.length-1;q>=0;q--){ var mm=marginalia[q];\n      if(mx>=mm.x&&mx<=mm.x+mm.w&&my>=mm.y&&my<=mm.y+mm.h) return byId[mm.id]; }\n    for(var i=fragHits.length-1;i>=0;i--){",
    expect: 'marginalia is clickable' }
];

/* Optional filter so a corrected mutation can be re-verified on its own:
     node tools/margmutate.js preview.html 6,7,8,9,10                       */
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
const SELECTED = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(String(m.n)) >= 0) : MUTATIONS;
if (ONLY.length && SELECTED.length !== ONLY.length){
  console.error('unknown mutation id in ' + ONLY.join(',')); process.exit(2);
}

function run(w, h){
  try { return { code: 0, out: execSync('node tools/marginaliacheck.js "' + FILE + '" ' + (w||1440) + ' ' + (h||900),
                                        { maxBuffer: 1 << 26 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout || '').toString() + (e.stderr || '').toString() }; }
}

console.log('BASELINE');
let base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline is not green — fix that before mutating'); process.exit(2); }
console.log('  green\n');

const results = [];
for (const m of SELECTED){
  const label = 'assertion ' + m.n;
  const edits = m.edits || [{ find: m.find, repl: m.repl }];
  // ── 1 & 2. mutate, and PROVE every part reached the file
  let mutated = ORIGINAL;
  for (const e of edits){
    const hits = mutated.split(e.find).length - 1;
    if (hits !== 1){
      console.error('STOP: anchor for ' + label + ' matched ' + hits + ' times, expected exactly 1: ' + e.find.slice(0,50));
      fs.writeFileSync(FILE, ORIGINAL, 'utf8'); process.exit(3);
    }
    mutated = mutated.replace(e.find, e.repl);
  }
  if (mutated === ORIGINAL){
    console.error('STOP: mutation for ' + label + ' did not change the file');
    fs.writeFileSync(FILE, ORIGINAL, 'utf8'); process.exit(3);
  }
  fs.writeFileSync(FILE, mutated, 'utf8');
  const onDisk = fs.readFileSync(FILE, 'utf8');
  const applied = onDisk !== ORIGINAL && edits.every(e => onDisk.indexOf(e.repl) >= 0);
  if (!applied){
    console.error('STOP: mutation for ' + label + ' is not present on disk');
    fs.writeFileSync(FILE, ORIGINAL, 'utf8'); process.exit(3);
  }
  // ── 3. the check must FAIL, and for the stated reason
  const bad = run(m.w, m.h);
  const failed = bad.code !== 0;
  const rightReason = bad.out.indexOf(m.expect) >= 0;
  // ── 4. restore, byte-for-byte
  fs.writeFileSync(FILE, ORIGINAL, 'utf8');
  const restored = fs.readFileSync(FILE, 'utf8') === ORIGINAL;
  // ── 5. and the check must PASS again
  const good = run(m.w, m.h);
  const passes = good.code === 0;

  const ok = applied && failed && rightReason && restored && passes;
  results.push({ n: m.n, name: m.name, applied, failed, rightReason, restored, passes, ok });
  console.log((ok ? 'OK   ' : 'BAD  ') + label + '  ' + m.name + (m.w ? '  @' + m.w + 'x' + m.h : ''));
  console.log('     applied=' + applied + ' failed=' + failed + ' rightReason=' + rightReason +
              ' restored=' + restored + ' passesAfter=' + passes);
  if (!rightReason && failed) console.log('     wanted "' + m.expect + '" in:\n' + bad.out.split('\n').map(l=>'       '+l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL — the assertion is not proving anything\n' + bad.out.split('\n').map(l=>'       '+l).join('\n'));
}

fs.writeFileSync(FILE, ORIGINAL, 'utf8');
console.log('\n──────── SUMMARY ────────');
results.forEach(r => console.log((r.ok?'PASS  ':'FAIL  ') + ('assertion ' + r.n).padEnd(14) + r.name));
const failedCount = results.filter(r => !r.ok).length;
console.log('\n' + (results.length - failedCount) + '/' + results.length + ' assertions mutation-verified');
process.exit(failedCount ? 1 : 0);
