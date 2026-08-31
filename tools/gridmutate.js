/* gridmutate.js — mutation harness for the P4.7 assertions in gridcheck.js.

   Same protocol as tools/margmutate.js: mutate, PROVE the mutation reached the
   file, require the check to fail FOR THE STATED REASON, restore byte-for-byte,
   require it to pass again. A mutation that does not apply is a hard stop.

   usage: node tools/gridmutate.js [preview.html] [ids]
*/
const fs = require('fs'), { execSync } = require('child_process');
const FILE = process.argv[2] || 'preview.html';
const ORIGINAL = fs.readFileSync(FILE, 'utf8');

const MUTATIONS = [
  /* The interleave itself. Without this the field is offered slots and nothing
     is ever placed in one — the exact "green while the feature is gone" class
     that P4.6 was built to catch. */
  { n: 'P4.7-1', name: 'the graph field is actually inhabited',
    find: "if(Z.G.length && byW[1].length>2)",
    repl: "if(false && Z.G.length && byW[1].length>2)",
    expect: 'the P4.7 interleave has regressed' },

  /* Containment must still bite for a field fragment, not just a column one. */
  { n: 'P4.7-2', name: 'a field fragment is held to its slot',
    find: "return {fr:f, x:s.x0, y:s.y0+15, zone:s, tier:0.5};",
    repl: "return {fr:f, x:s.x0-260, y:s.y0+15, zone:s, tier:0.5};",
    expect: 'outside their zone' },

  /* The descent reservation. Reverting to "the next line's height alone" puts
     a quiet line straight through the second line of a wrapped fragment. */
  /* "Nothing collides with a wrapped dominant" is now implemented THREE times:
     the zone's tail reservation, the compaction's descent term, and the
     pairwise rejection against tall boxes. Disabling any two leaves the third
     holding the line, so the behaviour is only genuinely removed when all
     three go — the same situation as P4.6's twice-subtracted reading panel. */
  { n: 'P4.7-3', name: "room is reserved for a wrapped line",
    edits: [{ find: "var need=lastDesc+asc+12;", repl: "var need=asc+12;" },
            { find: "layZone(byW[3],Z.A,3,0,TS.dom,Math.round(TS.dom*1.14*(W<1100?2:1))),",
              repl: "layZone(byW[3],Z.A,3,0,TS.dom,0)," },
            { find: "if(tallBox.length) keep=keep.filter(function(q){",
              repl: "if(false && tallBox.length) keep=keep.filter(function(q){" }],
    expect: 'stacked on each other' },

  /* Remove the WRAP BRANCH itself, so the dominant falls back to the
     single-line crop path — which is precisely the pre-P4.7 behaviour and the
     P4.4 defect at a larger size. Capping the line count inside the branch was
     too weak a mutation: the fallback still recovered a usable size. */
  { n: 'P4.7-4', name: 'the dominant fragment wraps to a measure',
    find: "if(inZone && big){",
    repl: "if(false && inZone && big){",
    expect: 'cut to death' }
];

const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
const SEL = ONLY.length ? MUTATIONS.filter(m => ONLY.indexOf(String(m.n)) >= 0) : MUTATIONS;

function run(w,h){
  try { return { code: 0, out: execSync('node tools/gridcheck.js "' + FILE + '" ' + (w||1440) + ' ' + (h||900),
                                        { maxBuffer: 1 << 26 }).toString() }; }
  catch (e){ return { code: e.status || 1, out: (e.stdout||'').toString() + (e.stderr||'').toString() }; }
}

console.log('BASELINE');
const base = run();
if (base.code !== 0){ console.log(base.out); console.error('baseline not green'); process.exit(2); }
console.log('  green\n');

let bad = 0;
for (const m of SEL){
  const edits = m.edits || [{ find: m.find, repl: m.repl }];
  let mutated = ORIGINAL;
  for (const e of edits){
    const hits = mutated.split(e.find).length - 1;
    if (hits !== 1){
      console.error('STOP: anchor for ' + m.n + ' matched ' + hits + ' times: ' + e.find.slice(0,50));
      fs.writeFileSync(FILE, ORIGINAL, 'utf8'); process.exit(3);
    }
    mutated = mutated.replace(e.find, e.repl);
  }
  fs.writeFileSync(FILE, mutated, 'utf8');
  const applied = edits.every(e => fs.readFileSync(FILE, 'utf8').indexOf(e.repl) >= 0);
  const r = run(m.w, m.h);
  const failed = r.code !== 0, right = r.out.indexOf(m.expect) >= 0;
  fs.writeFileSync(FILE, ORIGINAL, 'utf8');
  const restored = fs.readFileSync(FILE, 'utf8') === ORIGINAL;
  const after = run(m.w, m.h).code === 0;
  const ok = applied && failed && right && restored && after;
  if (!ok) bad++;
  console.log((ok ? 'OK   ' : 'BAD  ') + m.n + '  ' + m.name);
  console.log('     applied=' + applied + ' failed=' + failed + ' rightReason=' + right +
              ' restored=' + restored + ' passesAfter=' + after);
  if (failed && !right) console.log(r.out.split('\n').map(l => '       ' + l).join('\n'));
  if (!failed) console.log('     CHECK DID NOT FAIL\n' + r.out.split('\n').map(l => '       ' + l).join('\n'));
}
fs.writeFileSync(FILE, ORIGINAL, 'utf8');
console.log('\n' + (SEL.length - bad) + '/' + SEL.length + ' P4.7 assertions mutation-verified');
process.exit(bad ? 1 : 0);
