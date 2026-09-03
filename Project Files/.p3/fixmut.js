/* Mutation testing found three weak points. Fixing the ASSERTIONS, not the
   mutations — except where the mutation itself was the problem.

   CST-3 was circular: it compared the rendered order against K.order, which is
     read from the same data field the mutation edits. Both sides moved
     together, so it could never fail. Pin it to the mapping the approved
     research document states instead.
   CST-5's mutation crashed the app rather than failing cleanly; a gentler one
     that maps a FOREIGN object onto a star exercises the same claim.
   CST-13 only watched MIG-level reparenting, so moving OBSERVATION's objects
     into Philosophy slipped past it and tripped CST-15 instead.
*/
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 62)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the harness must report which region each star still belongs to */
edit('src/v02-app.js',
  `      stars.push({ id:id, star:k.map[id], kind:nd.t, vMag:nd.starV, ly:nd.starLy,`,
  `      stars.push({ id:id, star:k.map[id], kind:nd.t, mig:nd.mig, vMag:nd.starV, ly:nd.starLy,`);

/* CST-3 — pin to the research, not to the data the mutation edits */
edit('tools/constellationcheck.js',
`// CST-3
const order = K.order || [];
const chainMapped = (K.chain || []).map(id => K.map[id]);
ck('CST-3', JSON.stringify(chainMapped) === JSON.stringify(order),
   'the chain maps to the Dipper in the declared draw order — ' + chainMapped.join(' → '));`,
`/* CST-3 — the mapping the APPROVED RESEARCH states, written out here so the
   assertion cannot move when the data moves. Comparing the render against
   K.order was circular: the mutation edited that very field and both sides
   changed together, so it could never fail. */
const order = K.order || [];
const RESEARCH_MAP = {
  'attention':'Alkaid', 't-reels':'Mizar', 'c-absurd':'Alioth', 'evidence':'Megrez',
  't-manager':'Phecda', 'patterns':'Merak', 't-magicians':'Dubhe', 'anomaly':'Alcor'
};
const chainMapped = (K.chain || []).map(id => K.map[id]);
const mapWrong = Object.keys(RESEARCH_MAP).filter(id => K.map[id] !== RESEARCH_MAP[id]);
ck('CST-3', mapWrong.length === 0 && Object.keys(K.map || {}).length === 8,
   'the mapping is exactly the one the research fixed' +
   (mapWrong.length ? ' — WRONG: ' + mapWrong.map(id => id + '→' + K.map[id]).join(', ')
                    : ' — ' + chainMapped.join(' → ')));`);

/* CST-13 — object-level ownership, not just MIG-level */
edit('tools/constellationcheck.js',
`ck('CST-13', r.arch.migCount === 14 && r.arch.reparented.length === 0 &&
            (r.arch.owners ? r.arch.owners['observation'] !== undefined : true),
   'ownership untouched — ' + r.arch.migCount + ' MIGs, nothing reparented');`,
`/* MIG-level reparenting was all this watched, so moving OBSERVATION's own
   objects into another region slipped straight past it. */
const strayed = stars.filter(s => s.mig !== 'observation');
ck('CST-13', r.arch.migCount === 14 && r.arch.reparented.length === 0 &&
            strayed.length === 0 && srcObsObjects.length === 8,
   'ownership untouched — ' + r.arch.migCount + ' MIGs, nothing reparented, and all ' +
   stars.length + ' stars still belong to OBSERVATION' +
   (strayed.length ? ' — STRAYED: ' + strayed.map(s => s.id + '→' + s.mig).join(', ') : ''));`);

/* CST-5 — a mutation that fails cleanly instead of crashing */
edit('tools/constellationmutate.js',
`    find: \`    Object.keys(kon.map).forEach(function(id){
      var s=kon.byName[kon.map[id]], node=byId[id];\`,
    repl: \`    if(!byId['fake-star']){ var fk={id:'fake-star',label:'FAKE',t:'minor',mig:m.id};
      NODES.push(fk); byId[fk.id]=fk; kon.map[fk.id]='Alcor'; (owned[m.id]||[]).push(fk.id); }
    Object.keys(kon.map).forEach(function(id){
      var s=kon.byName[kon.map[id]], node=byId[id];\` },`,
`    /* injecting a brand-new node mid-layout crashed the app instead of failing
       the named assertion, which proves nothing. Map a FOREIGN object onto a
       star instead — same claim, clean failure. */
    find: \`  return { data:D, local:local, byName:byName, map:map, starOf:starOf,\`,
    repl: \`  map['curiosity']=order[0];              // mutation: a star from another region
  return { data:D, local:local, byName:byName, map:map, starOf:starOf,\` },`);

console.log(n + ' fixes applied');
