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
function overlay() { return objectLiteral('var V02_OVERLAY={', 'V02_OVERLAY'); }
/* the same reader, pointed at the assignment table. MIG_SYSTEM says which
   regions were GIVEN a system by hand, which is what decides which ones have
   to claim one — so the gate has to read it rather than assume a count. */
function migSystem() { return objectLiteral('var MIG_SYSTEM={', 'MIG_SYSTEM'); }
function objectLiteral(anchor, name) {
  const app = fs.readFileSync('src/v02-app.js', 'utf8');
  const start = app.indexOf(anchor);
  if (start < 0) throw new Error(name + ' not found in src/v02-app.js');
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
  if (end < 0) throw new Error('could not find the end of ' + name);
  return new Function('return ' + app.slice(app.indexOf('{', start), end + 1) + ';')();
}

const G = lockedGraph();
const OV = overlay();

/* the regions that actually exist once the overlay has had its say: a note
   filed under a hidden region would render nowhere, and one filed under a
   region the overlay added is perfectly legal */
const hidden = new Set((OV.hideMIGs || []).map(h => h.id));
/* A NOTE IN A HIDDEN REGION IS INVISIBLE, WITH ONE EXCEPTION.

   Hiding a region leaves its objects in the graph with no position, so they are
   drawn nowhere and listed nowhere. A note filed into one would be accepted by
   the editor, committed, built, and then simply not exist on the page — the
   worst failure this gate can allow, because everything reports success.

   MY WORKS is the exception and always has been. Its objects are not lost when
   the region is hidden: they become the sheets of the manual, which is the
   whole reason the region was hidden in the first place. A project filed there
   is not invisible, it is somewhere else.

   So the rule is not "no hidden regions" but "no region a note would vanish
   into", which is the same distinction the edge sweep draws when it decides
   whose relationships die with the room.

   AND THE EXEMPTION IS NARROWER THAN THE REGION. Written as "my-works is
   allowed" it let a THOUGHT be filed into the manual, which notesmutate caught
   by surviving: a thought there is not lost, but it stops being a thought —
   isWork takes anything in my-works that is not the region or a concept, so it
   would be rendered as a numbered sheet with parts and known failures, and
   nothing would say so. A destination that changes what a note IS is not a
   destination for that note. So the exemption records what the place actually
   holds, and only that kind may go there. */
const WITH_A_DESTINATION = {
  'my-works': { takes: 'project', called: 'the manual' }
};
const migIds = new Set(
  G.MIGS.map(m => m.id)
   .concat((OV.addMIGs || []).map(m => m.id))
   .filter(id => !hidden.has(id) ||
                 Object.prototype.hasOwnProperty.call(WITH_A_DESTINATION, id)));

/* every id the graph already knows. addOnce SILENTLY skips a duplicate, so a
   colliding note would simply never appear — the worst failure mode there is,
   because the editor would report success and the page would show nothing. */
const takenIds = new Set(
  G.MIGS.map(n => n.id)
   .concat(G.MINORS.map(n => n.id), G.THOUGHTS.map(n => n.id),
           (OV.addMIGs || []).map(n => n.id), (OV.addMinors || []).map(n => n.id),
           (OV.addWritings || []).map(n => n.id),
           /* addWorks was missing, so a project written in the editor could
              take the id of one the overlay declares and be silently dropped */
           (OV.addWorks || []).map(n => n.id)));

const existingEdges = G.EDGES.concat(OV.addEdges || []);

/* ── the store ────────────────────────────────────────────────────────────── */
let store;
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
catch (e) { console.error('notescheck: ' + FILE + ' is not valid JSON — ' + e.message); process.exit(1); }

if (store.version !== 1) fail('store', 'version must be 1, found ' + JSON.stringify(store.version));
['notes', 'minors', 'edges', 'retired', 'regions', 'retiredRegions'].forEach(k => {
  if (k !== 'notes' && k !== 'minors' && k !== 'edges' && store[k] === undefined) return;
  if (!Array.isArray(store[k])) fail('store', k + ' must be an array');
});
if (fails.length) { report(); process.exit(1); }

const notes  = store.notes;
const minors = store.minors;
const edges  = store.edges;
const retired = store.retired || [];
const regions = store.regions || [];
const retiredRegions = store.retiredRegions || [];

/* ── TOPICS THE STORE DECLARES ─────────────────────────────────────────────
   A topic used to be the one thing here that could not be added from the
   editor, because a topic needs a star and the fourteen stars were typed into
   src/. They are claimed from a reserve pool now, so the store may declare a
   region — and this is the gate on it, checked BEFORE the notes, because a
   note may legitimately be filed into a topic that only exists here. */
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const REGION_FIELDS = new Set(['id', 'label', 'line', 'added']);
const RETIRE_FIELDS = new Set(['id', 'at', 'why']);
const regionIds = new Set();

regions.forEach((r, i) => {
  const where = 'regions[' + i + ']';
  if (!r || typeof r !== 'object' || Array.isArray(r)) return fail(where, 'must be an object');
  Object.keys(r).forEach(k => {
    if (!REGION_FIELDS.has(k))
      fail(where, 'unknown field ' + JSON.stringify(k) + '; a topic carries id, label, line and added');
  });
  if (typeof r.id !== 'string' || !SLUG.test(r.id))
    fail(where, 'id must be a lowercase slug, found ' + JSON.stringify(r.id));
  else if (takenIds.has(r.id))
    fail(where, 'id "' + r.id + '" already exists in the graph; the merge would silently drop this topic');
  else if (regionIds.has(r.id))
    fail(where, 'id "' + r.id + '" is declared twice');
  else regionIds.add(r.id);
  if (typeof r.label !== 'string' || !r.label.trim())
    fail(where, 'a topic needs a name');
  else if (r.label !== r.label.toUpperCase())
    fail(where, 'the name must be uppercase, found ' + JSON.stringify(r.label));
  /* THE SENTENCE IS NOT OPTIONAL. It is the first prose a reader meets on
     arriving, and a topic that says nothing about itself is a door with no
     sign on it. Every region in the corpus has one. */
  if (typeof r.line !== 'string' || !r.line.trim())
    fail(where, 'a topic needs a description — it is the sentence a reader meets on arriving');
  if (r.added !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(r.added))
    fail(where, 'added must be an ISO date, found ' + JSON.stringify(r.added));
});

/* ── AND THE ONES IT RETIRES ────────────────────────────────────────────────
   Retiring a topic closes the room: it leaves MIGS, its objects keep their
   ids and their books, and every relationship that pointed into it is swept
   rather than left drawing a door onto nothing. So it must name a room that
   is actually open, or it is a statement about nothing. */
const openRegionIds = new Set([...migIds, ...regionIds]);
const retiredRegionIds = new Set();
retiredRegions.forEach((r, i) => {
  const where = 'retiredRegions[' + i + ']';
  if (!r || typeof r !== 'object' || Array.isArray(r)) return fail(where, 'must be an object');
  Object.keys(r).forEach(k => {
    if (!RETIRE_FIELDS.has(k))
      fail(where, 'unknown field ' + JSON.stringify(k) + '; a retirement carries id, at and why');
  });
  if (typeof r.id !== 'string' || !SLUG.test(r.id))
    fail(where, 'id must be a lowercase slug, found ' + JSON.stringify(r.id));
  else if (!openRegionIds.has(r.id))
    fail(where, '"' + r.id + '" is not a topic that is open — nothing would be retired');
  else if (retiredRegionIds.has(r.id))
    fail(where, '"' + r.id + '" is retired twice');
  else retiredRegionIds.add(r.id);
  if (r.at !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(r.at))
    fail(where, 'at must be an ISO date, found ' + JSON.stringify(r.at));
});

/* THE TOPICS ARE NOW PART OF THE GRAPH, for everything checked after this
   point: a note may be filed into one the store declared, no note may collide
   with a topic's id, and no note may be filed into one that has been retired,
   because a retired room is exactly as invisible as a hidden one. */
regionIds.forEach(id => { takenIds.add(id); if (!retiredRegionIds.has(id)) migIds.add(id); });
retiredRegionIds.forEach(id => { migIds.delete(id); hidden.add(id); });

/* ── IS THERE A WORLD LEFT FOR IT? ─────────────────────────────────────────
   A region with no system renders as a bare star with a name under it — not a
   planetary system at all. Every topic on this page has a sky, and publishing
   one that does not would be a visible downgrade nobody asked for. The pool is
   finite and this project does not invent astronomy, so when it runs out the
   answer is to retrieve more from the NASA archive, exactly as the last six
   were. The gate says so here rather than letting it ship. */
if (regions.length) {
  const chosen = new Set(Object.values(migSystem()));
  const pool = (JSON.parse(fs.readFileSync('data/astronomy-systems.json', 'utf8')).systems || [])
    .filter(s => s.reserve && !chosen.has(s.system));
  /* the queue is every region declared beyond the corpus that was not given a
     system by hand, retired ones included — a retired topic keeps its place so
     that retiring one cannot move another topic's star */
  const queue = (OV.addMIGs || []).map(m => m.id).filter(id => !chosen.has(id))
    .concat(regions.map(r => r.id));
  if (queue.length > pool.length)
    fail('store', 'there are ' + queue.length + ' topic(s) waiting for a world and only ' +
                  pool.length + ' unclaimed system(s) in data/astronomy-systems.json. ' +
                  'Retrieve more from the NASA Exoplanet Archive before adding another; ' +
                  'a topic without a system draws as a bare star.');
}

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
  /* a hidden region with a destination takes only what that destination holds;
     crosses is deliberately not restricted this way, because reaching INTO the
     manual from the mind is a relationship, not a change of address */
  const dest = WITH_A_DESTINATION[row.mig];
  if (dest && row.t !== dest.takes)
    fail(where, 'mig "' + row.mig + '" is hidden and ' + dest.called + ' holds only ' +
                dest.takes + 's — a ' + JSON.stringify(row.t) + ' filed there would be ' +
                'rendered as a sheet and stop being a ' + row.t);
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

/* ── EDITS, WHICH THIS GATE HAD NEVER LOOKED AT ────────────────────────────
   store.edits is folded onto THOUGHTS, MINORS and MIGS by applyEdits and was
   the one input reaching the graph with nothing standing in front of it. That
   was survivable while it carried a description and nothing else. It carries a
   topic's NAME now, so it is checked like everything else.

   THE SILENTLY IGNORED FIELDS ARE THE POINT. applyEdits refuses id, mig and t
   because all three decide where an object sits and what draws it, and the
   graph is built from them before an override could be honoured — so it drops
   them without a word. An editor that offered one would report a success that
   never happened, which is the exact failure this file exists to stop. */
const EDIT_FIELDS = new Set(['label', 'line', 'src', 'register', 'state', 'crosses', 'sections']);
const EDIT_IGNORED = new Set(['id', 'mig', 't']);
/* a region takes only the two things a region has */
const REGION_EDIT_FIELDS = new Set(['label', 'line']);
const allRegionIds = new Set([...migIds, ...hidden, ...regionIds]);
const edits = store.edits || {};
if (typeof edits !== 'object' || Array.isArray(edits)) fail('store', 'edits must be an object');
else Object.keys(edits).forEach(id => {
  const where = 'edits["' + id + '"]';
  const e = edits[id];
  if (!e || typeof e !== 'object' || Array.isArray(e)) return fail(where, 'must be an object');
  const isRegion = allRegionIds.has(id);
  if (!isRegion && !takenIds.has(id) && !seen.has(id))
    return fail(where, 'nothing with the id "' + id + '" exists to correct');
  if (retiredIds.has(id))
    fail(where, 'is retired — correcting a blanked object writes text nobody will ever see');
  const allowed = isRegion ? REGION_EDIT_FIELDS : EDIT_FIELDS;
  Object.keys(e).forEach(k => {
    if (EDIT_IGNORED.has(k))
      return fail(where, k + ' cannot be corrected — the graph is built from it before an ' +
                         'override could be honoured, so applyEdits drops it without a word');
    if (!allowed.has(k))
      return fail(where, 'unknown field ' + JSON.stringify(k) + '; ' +
                         (isRegion ? 'a topic has a name and a description'
                                   : 'an override may carry ' + [...EDIT_FIELDS].join(', ')));
    if (k === 'label') {
      if (typeof e.label !== 'string' || !e.label.trim()) fail(where, 'label cannot be emptied');
      else if (e.label !== e.label.toUpperCase())
        fail(where, 'label must be uppercase, found ' + JSON.stringify(e.label));
    }
    if (k === 'line' && (typeof e.line !== 'string' || !e.line.trim()))
      fail(where, 'line cannot be emptied' + (isRegion
        ? ' — it is the sentence a reader meets on arriving in the topic' : ''));
    if (k === 'crosses' && !Array.isArray(e.crosses)) fail(where, 'crosses must be an array');
    if (k === 'state' && !STATES.includes(e.state))
      fail(where, 'state must be one of ' + STATES.join('|') + ', found ' + JSON.stringify(e.state));
  });
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
