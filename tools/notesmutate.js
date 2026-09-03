/* notesmutate.js — break the store on purpose, one rule at a time, and require
   notescheck.js to notice.

   notescheck is the only thing standing between a form and a published page, so
   "it passed" is worth nothing until each of its assertions has been shown to
   fail when the thing it guards is actually broken. Every mutation below
   corresponds to one rule in CONTENT-MODEL.md. A mutation that SURVIVES is a
   hole in the checker, and the fix is always the checker — never the mutation.

   The store under test is a fixture built here, never data/notes.json. Nothing
   in it is written in Siddhesh's voice; it exists to exercise machinery.

   usage: node tools/notesmutate.js
*/
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const tmp = (require('./scratch.js').root() + '/nm-' + process.pid).split('\\').join('/');
fs.mkdirSync(tmp, { recursive: true });

/* A VALID STORE. Deliberately dull: the point is that it passes, so that any
   later failure is attributable to the one thing the mutation changed. */
const base = () => ({
  version: 1,
  notes: [{
    id: 'zz-fixture-note',
    t: 'thought',
    label: 'FIXTURE ROW USED ONLY BY THE MUTATION HARNESS',
    mig: 'movies',
    crosses: ['philosophy'],
    state: 'formed',
    register: 'fixture — not a real note',
    src: 'Live note',
    line: 'Present so the pipeline can be exercised without inventing anything in his voice.',
    added: '2026-09-03'
  }],
  minors: [{
    id: 'zz-fixture-concept',
    label: 'FIXTURE CONCEPT',
    mig: 'movies',
    crosses: [],
    state: 'seed'
  }],
  edges: [
    ['zz-fixture-note', 'narrative', 'reads through',
     'A fixture relationship, long enough to satisfy the gloss minimum.']
  ]
});

/* Each mutation returns a broken store and the text notescheck must produce.
   The expectation is matched against the output so a mutation cannot be
   "caught" by an unrelated failure — the classic way a mutation suite lies. */
const MUTATIONS = [
  ['id collides with the locked corpus',
   s => { s.notes[0].id = 'narrative'; return s; },
   'already exists in the graph'],

  ['two rows share an id',
   s => { s.minors[0].id = s.notes[0].id; return s; },
   'appears twice in this file'],

  ['id is not a slug',
   s => { s.notes[0].id = 'Not A Slug'; return s; },
   'must be a lowercase slug'],

  ['region does not exist',
   s => { s.notes[0].mig = 'astronomy'; return s; },
   'is not a region that exists'],

  ['region exists but is hidden',
   s => { s.notes[0].mig = 'my-works'; return s; },
   'hidden'],

  ['crosses a region that does not exist',
   s => { s.notes[0].crosses = ['atlantis']; return s; },
   'crosses "atlantis" is not a region'],

  ['crosses its own region',
   s => { s.notes[0].crosses = ['movies']; return s; },
   'lists its own region'],

  ['the x trap returns',
   s => { s.notes[0].x = ['philosophy']; return s; },
   'x is a MIG-only layout field'],

  ['type outside the vocabulary',
   s => { s.notes[0].t = 'review'; return s; },
   't must be one of'],

  ['state outside the vocabulary',
   s => { s.notes[0].state = 'draft'; return s; },
   'state must be one of'],

  ['label is not uppercase',
   s => { s.notes[0].label = 'A Quiet Title'; return s; },
   'label must be uppercase'],

  ['provenance dropped',
   s => { delete s.notes[0].src; return s; },
   'src is required'],

  ['a note with no material',
   s => { s.notes[0].line = '   '; return s; },
   'line is required'],

  ['register dropped',
   s => { delete s.notes[0].register; return s; },
   'register is required'],

  ['date is not a date',
   s => { s.notes[0].added = 'yesterday'; return s; },
   'added must be an ISO date'],

  ['a concept claims authorship',
   s => { s.minors[0].src = 'Live note'; return s; },
   'a concept carries no src'],

  ['edge points at nothing',
   s => { s.edges[0][1] = 'no-such-node'; return s; },
   'is not a node that exists'],

  ['self-loop',
   s => { s.edges[0][1] = s.edges[0][0]; return s; },
   'self-loop'],

  ['the verb says nothing',
   s => { s.edges[0][2] = 'related to'; return s; },
   'must be semantic'],

  ['gloss too short to explain itself',
   s => { s.edges[0][3] = 'because'; return s; },
   'at least 25 characters'],

  ['duplicate of an edge the graph already has',
   s => { s.edges.push(['narrative', 'character', 'shapes',
                        'A duplicate of a relationship the locked graph already declares.']);
          s.edges.push(['narrative', 'character', 'shapes',
                        'And again, so the pair is seen twice within this file.']);
          return s; },
   'duplicate of an edge'],

  ['an edge inverted, which asserts the opposite claim',
   s => { s.edges.push(['zz-fixture-concept', 'zz-fixture-note', 'reads through',
                        'The same pair as the fixture edge, stated backwards.']);
          s.edges[0] = ['zz-fixture-note', 'zz-fixture-concept', 'reads through',
                        'The fixture edge, pointing the other way for the test.'];
          return s; },
   'direction is load-bearing'],

  ['the file is not the shape it claims',
   s => { s.notes = 'a string'; return s; },
   'notes must be an array']
];

function run(store) {
  const file = tmp + '/notes.json';
  fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8');
  try {
    const out = execFileSync(process.execPath, ['tools/notescheck.js', file],
                             { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status === undefined ? -1 : e.status,
             out: (e.stdout || '') + (e.stderr || '') };
  }
}

/* THE BASELINE MUST PASS. If the fixture itself fails, every "catch" below is
   really the fixture's own error and the suite proves nothing — the same
   contamination that once let a fabricated relationship pass as verified. */
const baseline = run(base());
if (baseline.code !== 0) {
  console.error('notesmutate: the unmutated fixture does not pass, so nothing below is meaningful.');
  console.error(baseline.out);
  process.exit(1);
}

let survived = 0, wrong = 0;
console.log('baseline fixture passes. ' + MUTATIONS.length + ' mutations:\n');
MUTATIONS.forEach(([name, mutate, expect]) => {
  const r = run(mutate(base()));
  if (r.code === 0) { survived++; console.log('  SURVIVED  ' + name); return; }
  if (r.out.indexOf(expect) < 0) {
    wrong++;
    console.log('  CAUGHT BY THE WRONG RULE  ' + name);
    console.log('            expected: ' + expect);
    console.log('            got:      ' + r.out.trim().split('\n').filter(Boolean).slice(0, 2).join(' / '));
    return;
  }
  console.log('  caught    ' + name);
});

fs.rmSync(tmp, { recursive: true, force: true });

console.log('');
if (survived || wrong) {
  console.error('notesmutate: ' + survived + ' survived, ' + wrong +
                ' caught by the wrong rule. The checker has holes; fix the checker.');
  process.exit(1);
}
console.log('notesmutate clean — every rule failed when the thing it guards was broken');
