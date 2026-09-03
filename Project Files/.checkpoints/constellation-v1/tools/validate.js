const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');

function grab(name, open='['){
  const i = src.indexOf('var ' + name + '=' + open);
  if (i < 0) throw new Error('missing ' + name);
  const close = open === '[' ? ']' : '}';
  let j = src.indexOf(open, i), depth = 0, k = j;
  for (; k < src.length; k++){
    if (src[k] === open) depth++;
    else if (src[k] === close){ depth--; if (!depth) break; }
  }
  return eval('(' + src.slice(j, k + 1) + ')');
}

const MIGS = grab('MIGS'), MINORS = grab('MINORS'), THOUGHTS = grab('THOUGHTS'),
      EDGES = grab('EDGES'), WORLDS = grab('WORLDS', '{');

const nodes = [
  ...MIGS.map(m => ({ ...m, t: 'mig', mig: m.id })),
  ...MINORS.map(m => ({ ...m, t: 'minor' })),
  ...THOUGHTS
];
const byId = {}; const dupes = [];
nodes.forEach(n => { if (byId[n.id]) dupes.push(n.id); byId[n.id] = n; });
const migIds = new Set(MIGS.map(m => m.id));

// Music is empty on purpose: no source material exists for it, and an invented
// region is worse than an unfurnished one. Anything else empty is a defect.
const EMPTY_BY_DESIGN = new Set(['music']);

const problems = [];
const owned = {}; MIGS.forEach(m => owned[m.id] = []);

if (dupes.length) problems.push('duplicate ids: ' + dupes.join(', '));

// ── V0.4 rule: exactly one owning MIG per node
nodes.forEach(n => {
  if (n.t === 'mig') return;
  if (!n.mig) { problems.push(`${n.id}: no owning MIG`); return; }
  if (!migIds.has(n.mig)) { problems.push(`${n.id}: unknown MIG "${n.mig}"`); return; }
  owned[n.mig].push(n.id);
  (n.crosses || []).forEach(m => {
    if (!migIds.has(m)) problems.push(`${n.id}: unknown crossing "${m}"`);
    if (m === n.mig) problems.push(`${n.id}: lists its own MIG as a crossing`);
  });
  if (new Set(n.crosses || []).size !== (n.crosses || []).length) problems.push(`${n.id}: duplicate crossings`);
});

const minorsOf = id => owned[id].filter(x => byId[x].t === 'minor');

// ── every MIG is a real place, and the three priority worlds are furnished
MIGS.forEach(m => {
  if (EMPTY_BY_DESIGN.has(m.id)) {
    if (minorsOf(m.id).length) problems.push(`MIG ${m.id}: declared empty but has members`);
    return;
  }
  const mn = minorsOf(m.id).length;
  if (mn < 4) problems.push(`MIG ${m.id}: only ${mn} minor IGs (need 4+)`);
});
['philosophy', 'business', 'society', 'my-works'].forEach(id => {
  const mn = minorsOf(id).length;
  const need = (id === 'my-works' || id === 'society') ? 4 : 6;
  if (mn < need) problems.push(`priority MIG ${id}: only ${mn} minor IGs (need ${need}+)`);
});

// ── a MIG environment may never contain another MIG's minor IG
MIGS.forEach(m => {
  minorsOf(m.id).forEach(id => {
    if (byId[id].mig !== m.id) problems.push(`LEAK: ${id} shown inside ${m.id}`);
  });
});

// ── every MIG has its own visual world, and no two are the same
const seenWorld = new Map();
MIGS.forEach(m => {
  const w = WORLDS[m.id];
  if (!w) { problems.push(`MIG ${m.id}: no visual world defined`); return; }
  if (!w.env || !w.ring || !w.ground || !w.ink || !w.accent) problems.push(`MIG ${m.id}: incomplete world config`);
  const sig = w.env + '/' + w.ring;
  if (seenWorld.has(sig)) problems.push(`MIG ${m.id}: world identical to ${seenWorld.get(sig)}`);
  seenWorld.set(sig, m.id);
});

// ── relationship contract, unchanged since V0.2
const seenPair = new Set();
EDGES.forEach((e, i) => {
  const [a, b, verb, why] = e;
  if (!byId[a]) problems.push(`edge ${i}: unknown from "${a}"`);
  if (!byId[b]) problems.push(`edge ${i}: unknown to "${b}"`);
  if (a === b) problems.push(`edge ${i}: self loop`);
  if (!verb || !verb.trim()) problems.push(`edge ${i}: missing verb (${a}→${b})`);
  if (!why || why.trim().length < 25) problems.push(`edge ${i}: weak gloss (${a}→${b})`);
  if (seenPair.has(`${a}>${b}`)) problems.push(`edge ${i}: duplicate ${a}→${b}`);
  if (seenPair.has(`${b}>${a}`)) problems.push(`edge ${i}: INVERTED DUPLICATE of ${b}→${a}`);
  seenPair.add(`${a}>${b}`);
});

const adj = {}; nodes.forEach(n => adj[n.id] = []);
EDGES.forEach(([a, b]) => { if (byId[a] && byId[b]) { adj[a].push(b); adj[b].push(a); } });
const orphans = nodes.filter(n => n.t !== 'mig' && adj[n.id].length === 0).map(n => n.id);
if (orphans.length) problems.push('nodes with no relationships: ' + orphans.join(', '));

// ── crossings actually exist: each MIG must be leavable and enterable
MIGS.forEach(m => {
  const outbound = new Set(), inbound = new Set();
  owned[m.id].forEach(id => {
    (byId[id].crosses || []).forEach(o => outbound.add(o));
    adj[id].forEach(o => { if (byId[o].mig !== m.id) outbound.add(byId[o].mig); });
  });
  nodes.forEach(n => {
    if (n.t === 'mig' || n.mig === m.id) return;
    if ((n.crosses || []).includes(m.id)) inbound.add(n.mig);
    adj[n.id].forEach(o => { if (byId[o].mig === m.id) inbound.add(n.mig); });
  });
  if (EMPTY_BY_DESIGN.has(m.id)) return;
  if (!outbound.size) problems.push(`MIG ${m.id}: no way out`);
  if (!inbound.size) problems.push(`MIG ${m.id}: no way in`);
});

const counts = {}; nodes.forEach(n => counts[n.t] = (counts[n.t] || 0) + 1);
console.log('nodes:', nodes.length, JSON.stringify(counts));
console.log('edges:', EDGES.length);
console.log('minor IGs per MIG:', MIGS.map(m => `${m.id}:${minorsOf(m.id).length}`).join(' '));
console.log('worlds:', MIGS.map(m => WORLDS[m.id] ? WORLDS[m.id].env : 'MISSING').join(' '));
console.log(problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'PROBLEMS: none');
process.exit(problems.length ? 1 : 0);
