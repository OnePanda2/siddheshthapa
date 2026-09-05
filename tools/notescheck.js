/* notescheck.js — the gate between a commit and a published page.

   data/notes.json is the only input to this site that a form can write. Every
   other input is authored by hand by someone reading CONTENT-MODEL.md while
   they type. A form has no such reader, so the rules that file states in prose
   are restated here as assertions, and the build refuses rather than publishing
   something the graph would have to render as nonsense.

   WHAT THIS PROTECTS AGAINST AND WHAT IT DOES NOT. It catches malformed,
   contradictory or graph-breaking content — a note pointing at a region that
   does not exist, an id that collides with the locked corpus and would be
   silently dropped, an edge whose direction inverts a claim that already
   exists. It does NOT and cannot decide whether a well-formed note is really
   Siddhesh's. Nothing running after the fact can. That question is answered
   earlier, by GitHub refusing a push from anyone else.

   TRUTH COMES FROM THE GRAPH, NOT FROM A LIST TYPED HERE. The region ids, the
   existing node ids and the existing edges are all extracted from preview.html
   and src/v02-app.js at run time, the same material the build extracts, so
   this file cannot quietly disagree with what actually ships.

   usage: node tools/notescheck.js [data/notes.json]
*/
const fs = require('fs');

const FILE = process.argv[2] || process.env.NOTES_FILE || 'data/notes.json';

/* ── the vocabularies. CONTENT-MODEL.md is the authority; these are its lists,
      and a value outside them is a typo rather than a new category. ───────── */
const TYPES = ['belief', 'thought', 'question', 'contradiction', 'project',
               'experiment', 'person', 'reference'];
const STATES = ['seed', 'growing', 'formed', 'tested', 'proven', 'changed', 'open'];
const GLOSS_MIN = 25;

const fails = [];
const fail = (where, msg) => fails.push(where + ' — ' + msg);

/* ── the locked graph, extracted exactly as tools/build-v02.js extracts it ── */
function lockedGraph() {
  const src = fs.readFileSync('preview.html', 'utf8');
  const a = src.indexOf('  var MIGS=[');
  const b = src.indexOf('  var NODES=[],byId={},owned={};');
  if (a < 0 || b < 0 || b <= a) throw new Error('could not locate the data block in preview.html');
  const block = src.slice(a, b);
  return new Function(block + '\nreturn {MIGS:MIGS,MINORS:MINORS,THOUGHTS:THOUGHTS,EDGES:EDGES};')();
}

/* ── the overlay, sliced out of the app by matching braces. It is pure data,
      but it is data written in JavaScript, so it is read as JavaScript rather
      than guessed at with a regex. ─────────────────────────────────────────── */
function overlay() {
  const app = fs.readFileSync('src/v02-app.js', 'utf8');
  const start = app.indexOf('var V02_OVERLAY={');
  if (start < 0) throw new Error('V02_OVERLAY not found in src/v02-app.js');
  let i = app.indexOf('{', start), depth = 0, end = -1, inStr = null, inCmt = null;
  for (; i < app.length; i++) {
    const c = app[i], n = app[i + 1];
    if (inCmt) { if (inCmt === '*' && c === '*' && n === '/') { inCmt = null; i++; }
                 else if (inCmt === '/' && c === '\n') inCmt = null; continue; }
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '/' && n === '*') { inCmt = '*'; i++; continue; }
    if (c === '/' && n === '/') { inCmt = '/'; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('could not find the end of V02_OVERLAY');
  return new Function('return ' + app.slice(app.indexOf('{', start), end + 1) + ';')();
}

const G = lockedGraph();
const OV = overlay();

/* the regions that actually exist once the overlay has had its say: a note
   filed under a hidden region would render nowhere, and one filed under a
   region the overlay added is perfectly legal */
const hidden = new Set((OV.hideMIGs || []).map(h => h.id));
const migIds = new Set(
  G.MIGS.map(m => m.id)
   .concat((OV.addMIGs || []).map(m => m.id))
   .filter(id => !hidden.has(id)));

/* every id the graph already knows. addOnce SILENTLY skips a duplicate, so a
   colliding note would simply never appear — the worst failure mode there is,
   because the editor would report success and the page would show nothing. */
const takenIds = new Set(
  G.MIGS.map(n => n.id)
   .concat(G.MINORS.map(n => n.id), G.THOUGHTS.map(n => n.id),
           (OV.addMIGs || []).map(n => n.id), (OV.addMinors || []).map(n => n.id),
           (OV.addWritings || []).map(n => n.id)));

const existingEdges = G.EDGES.concat(OV.addEdges || []);

/* ── the store ────────────────────────────────────────────────────────────── */
let store;
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
catch (e) { console.error('notescheck: ' + FILE + ' is not valid JSON — ' + e.message); process.exit(1); }

if (store.version !== 1) fail('store', 'version must be 1, found ' + JSON.stringify(store.version));
['notes', 'minors', 'edges', 'retired'].forEach(k => {
  if (k === 'retired' && store[k] === undefined) return;   // a store may retire nothing
  if (!Array.isArray(store[k])) fail('store', k + ' must be an array');
});
if (fails.length) { report(); process.exit(1); }

const notes  = store.notes;
const minors = store.minors;
const edges  = store.edges;
const retired = store.retired || [];

/* ids introduced by this store, checked against each other as well as against
   the graph, because two notes can collide with one another */
const seen = new Set();
function checkId(row, where) {
  if (typeof row.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(row.id))
    return fail(where, 'id must be a lowercase slug, found ' + JSON.stringify(row.id));
  if (takenIds.has(row.id))
    fail(where, 'id "' + row.id + '" already exists in the graph; the merge would silently drop this note');
  if (seen.has(row.id)) fail(where, 'id "' + row.id + '" appears twice in this file');
  seen.add(row.id);
}

function checkRegion(row, where) {
  if (!migIds.has(row.mig))
    fail(where, 'mig "' + row.mig + '" is not a region that exists' +
                (hidden.has(row.mig) ? ' any more (it is hidden)' : ''));
  if (!Array.isArray(row.crosses)) return fail(where, 'crosses must be an array');
  row.crosses.forEach(c => {
    if (!migIds.has(c)) fail(where, 'crosses "' + c + '" is not a region that exists');
    if (c === row.mig) fail(where, 'crosses lists its own region "' + c + '"');
  });
  if (new Set(row.crosses).size !== row.crosses.length) fail(where, 'crosses repeats a region');
  /* THE HISTORICAL TRAP, kept as an assertion. Minor IGs once used x for
     crossings and the layout pass overwrote it, destroying every crossing at
     load. Nothing below a MIG may carry x. */
  if ('x' in row) fail(where, 'x is a MIG-only layout field; use crosses');
}

notes.forEach((n, i) => {
  const where = 'notes[' + i + ']' + (n && n.id ? ' (' + n.id + ')' : '');
  if (!n || typeof n !== 'object') return fail(where, 'not an object');
  checkId(n, where);
  if (!TYPES.includes(n.t)) fail(where, 't must be one of ' + TYPES.join('|') + ', found ' + JSON.stringify(n.t));
  /* STATE IS NO LONGER ASKED FOR, so it is no longer required. It is still
     CHECKED when present, because the locked corpus is full of it and a typo
     there would be as wrong as it ever was - what changed is that the editor
     stopped inventing a classification nobody reads. The vocabulary was the
     file's own judgement of how settled a thought is, and with it off the
     page there is nothing for a writer to answer. */
  if ('state' in n && !STATES.includes(n.state))
    fail(where, 'state, when given, must be one of ' + STATES.join('|') + ', found ' + JSON.stringify(n.state));
  if (typeof n.label !== 'string' || !n.label.trim()) fail(where, 'label is required');
  else if (n.label !== n.label.toUpperCase()) fail(where, 'label must be uppercase, found ' + JSON.stringify(n.label));
  if (typeof n.register !== 'string' || !n.register.trim()) fail(where, 'register is required');
  /* "No src = not his writing." A live note IS his writing, so an absent src
     would be a lie about provenance rather than a missing field. */
  if (typeof n.src !== 'string' || !n.src.trim()) fail(where, 'src is required — an absent src means "not his writing"');
  if (typeof n.line !== 'string' || !n.line.trim()) fail(where, 'line is required — a note with no material is not a note');
  if (typeof n.added !== 'string' || isNaN(Date.parse(n.added))) fail(where, 'added must be an ISO date');

  /* SECTIONS — WHAT COMES AFTER THE STATEMENT.

     Optional: most notes are one sentence and always will be. When present it
     is an ORDERED list, because position is the only thing that says which
     explanation belongs to which part of a reading.

     The heading is optional and the body is not. A section with a heading and
     no body would render as a title over nothing — the reader skips it, so the
     page would silently drop something the editor believed it had saved, which
     is the kind of quiet disagreement between store and page this gate exists
     to stop at the commit rather than discover on the site. */
  if ('sections' in n) {
    if (!Array.isArray(n.sections)) fail(where, 'sections, when given, must be an array');
    else n.sections.forEach((sc, si) => {
      const w2 = where + '.sections[' + si + ']';
      if (!sc || typeof sc !== 'object') return fail(w2, 'not an object');
      if ('heading' in sc && typeof sc.heading !== 'string')
        fail(w2, 'heading, when given, must be a string');
      if (typeof sc.body !== 'string' || !sc.body.trim())
        fail(w2, 'body is required — a section with only a heading renders as a title over nothing');
      Object.keys(sc).forEach(k => {
        if (k !== 'heading' && k !== 'body')
          fail(w2, 'unknown field ' + JSON.stringify(k) + ' — a section is a heading and a body');
      });
    });
  }
  checkRegion(n, where);
});

minors.forEach((m, i) => {
  const where = 'minors[' + i + ']' + (m && m.id ? ' (' + m.id + ')' : '');
  if (!m || typeof m !== 'object') return fail(where, 'not an object');
  checkId(m, where);
  if (typeof m.label !== 'string' || !m.label.trim()) fail(where, 'label is required');
  else if (m.label !== m.label.toUpperCase()) fail(where, 'label must be uppercase');
  if ('state' in m && !STATES.includes(m.state))
    fail(where, 'state, when given, must be one of ' + STATES.join('|'));
  /* scaffolding is not his words, and the ABSENCE of src is how the page says
     so. Giving a concept a src would claim authorship the file cannot support. */
  if ('src' in m) fail(where, 'a concept carries no src — that absence is the honesty signal');
  if ('t' in m) fail(where, 't is implied by being a concept; remove it');
  checkRegion(m, where);
});

/* ── relationships ────────────────────────────────────────────────────────── */
/* RETIRED WRITINGS. A deletion names an id that must really exist, or the star
   it claims to have emptied is a star nobody has. Retiring twice is a
   bookkeeping error rather than a stronger deletion, and a note may only CLAIM
   a vacancy that has actually been made. The date is required because it is
   what decides which vacancy is the oldest, and the oldest is the one the next
   writing takes. */
const retiredIds = new Set();
retired.forEach((r, i) => {
  const where = 'retired[' + i + ']' + (r && r.id ? ' (' + r.id + ')' : '');
  if (!r || typeof r !== 'object') return fail(where, 'not an object');
  if (typeof r.id !== 'string' || !r.id) return fail(where, 'id is required');
  if (!takenIds.has(r.id) && !seen.has(r.id))
    fail(where, 'nothing with the id "' + r.id + '" exists to retire');
  if (retiredIds.has(r.id)) fail(where, 'retired twice');
  if (typeof r.at !== 'string' || isNaN(Date.parse(r.at)))
    fail(where, 'at must be an ISO date - it is what decides which vacancy is oldest');
  retiredIds.add(r.id);
});

/* A CLAIM MUST MATCH THE KIND OF THE STAR IT TAKES. Concepts and writings are
   placed by different rules - in a planetary world the concepts take the orbits
   and the writings hang off them - so a writing dropped into a concept's orbit
   is the wrong sort of body in it. The merge searches each list only for its
   own claims, which means a mismatched claim would not fail loudly: it would
   simply never be applied, and the writing would quietly appear as a new star
   somewhere else while the vacancy it named stayed empty. Silence is the worst
   outcome available, so it is refused here.

   Kind is decided by which list an id lives in, not by any field: that is what
   the layout itself reads. */
const conceptIds = new Set(G.MINORS.map(n => n.id)
  .concat((OV.addMinors || []).map(n => n.id), minors.map(n => n && n.id)));

function checkClaims(rows, listName, wantConcept) {
  rows.forEach((n, i) => {
    if (!n || !n.takes) return;
    const where = listName + '[' + i + '] (' + n.id + ')';
    if (!retiredIds.has(n.takes))
      return fail(where, 'takes "' + n.takes + '", which is not retired; there is no such vacancy');
    if (n.takes === n.id) fail(where, 'takes its own id');
    const targetIsConcept = conceptIds.has(n.takes);
    if (targetIsConcept !== wantConcept)
      fail(where, 'takes "' + n.takes + '", which is ' +
        (targetIsConcept ? "the star of a concept; a writing cannot stand in it"
                         : "the star of a writing; a concept cannot stand in it"));
  });
  const taken = rows.filter(n => n && n.takes).map(n => n.takes);
  taken.forEach((t, i) => {
    if (taken.indexOf(t) !== i)
      fail(listName, 'two rows claim the same vacancy "' + t + '"');
  });
}
checkClaims(notes,  'notes',  false);
checkClaims(minors, 'minors', true);

/* and never from both lists at once */
const allClaims = notes.concat(minors).filter(n => n && n.takes).map(n => n.takes);
allClaims.forEach((t, i) => {
  if (allClaims.indexOf(t) !== i)
    fail('store', 'a note and a concept both claim "' + t + '"');
});

const knownId = id => takenIds.has(id) || seen.has(id);
const pairSeen = new Map();
existingEdges.forEach(e => pairSeen.set(e[0] + ' ' + e[1], 'the graph'));

edges.forEach((e, i) => {
  const where = 'edges[' + i + ']';
  if (!Array.isArray(e) || e.length !== 4)
    return fail(where, 'must be [fromId, toId, verb, gloss], found ' + JSON.stringify(e));
  const [from, to, verb, gloss] = e;
  if (!knownId(from)) fail(where, 'from "' + from + '" is not a node that exists');
  if (!knownId(to)) fail(where, 'to "' + to + '" is not a node that exists');
  if (from === to) fail(where, 'self-loop');
  if (typeof verb !== 'string' || !verb.trim()) fail(where, 'verb is required');
  else if (/^related to$/i.test(verb.trim()))
    fail(where, 'the verb must be semantic — "related to" says nothing');
  if (typeof gloss !== 'string' || gloss.trim().length < GLOSS_MIN)
    fail(where, 'gloss must be at least ' + GLOSS_MIN + ' characters; it answers why this edge exists');
  /* DIRECTION IS LOAD-BEARING. An inverted duplicate does not merely repeat an
     edge, it asserts the opposite claim — V0.2 shipped exactly that bug and
     rendered "VALUE INTERROGATES PHILOSOPHY". */
  const key = from + ' ' + to, inv = to + ' ' + from;
  if (pairSeen.has(key)) fail(where, 'duplicate of an edge already in ' + pairSeen.get(key));
  else if (pairSeen.has(inv)) fail(where, 'inverts an edge already in ' + pairSeen.get(inv) + ' — direction is load-bearing');
  else pairSeen.set(key, 'this file');
});

function report() {
  fails.forEach(f => console.error('  ' + f));
}

if (fails.length) {
  console.error('\nnotescheck: ' + fails.length + ' problem(s) in ' + FILE);
  report();
  console.error('\nnothing was published.');
  process.exit(1);
}

console.log('notescheck clean — ' + notes.length + ' note(s), ' + minors.length +
            ' concept(s), ' + edges.length + ' relationship(s) checked against ' +
            migIds.size + ' regions and ' + takenIds.size + ' existing ids');
