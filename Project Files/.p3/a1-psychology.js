/* §7 — resolve the PSYCHOLOGY identity collision.

   The authoritative graph owns a Minor IG `psychology`, belonging to HUMAN
   BEHAVIOUR, with three real relationships. The requested top-level MIG needs
   that same name. Previously the MIG took the id `psyche` to avoid a byId
   collision, which left an ugly internal name and two things called PSYCHOLOGY.

   The brief's resolution: the MIG takes `psychology`; the existing concept
   takes the collision-safe id `psychology-behaviour`. Its LABEL, its owner and
   its three relationships are untouched — only the internal key moves, and it
   moves inside the declared V02 overlay, so preview.html is not edited. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  addMIGs:[
    { id:'psyche', label:'PSYCHOLOGY',`,
`  /* an internal key moves; nothing else does */
  renameIds:[
    { from:'psychology', to:'psychology-behaviour',
      why:'frees the id psychology for the top-level MIG. The concept keeps its PSYCHOLOGY label, its owner HUMAN BEHAVIOUR, and all of its relationships.' }
  ],
  addMIGs:[
    { id:'psychology', label:'PSYCHOLOGY',`);

sub(`      idNote:'id is psyche, not psychology, because a Minor IG owned by HUMAN BEHAVIOUR already holds the id psychology. Reusing it would collide in byId and make that concept unreachable.',
      conflict:'HUMAN BEHAVIOUR owns a Minor IG also labelled PSYCHOLOGY. Promoting it into this region would change ownership and was NOT done. Flagged for a decision.' }`,
`      idNote:'takes the id psychology because the Minor IG that held it has been re-keyed to psychology-behaviour by the declared rename above.',
      conflict:null }`);

/* apply the rename before ANYTHING is indexed — ids, edges, cross-references */
sub(`(function(){
  V02_OVERLAY.relabel.forEach(function(r){`,
`(function(){
  /* every place an id can appear: the object itself, both ends of every edge,
     and the crosses[] hints. Miss one and the object silently disappears. */
  (V02_OVERLAY.renameIds||[]).forEach(function(rn){
    var moved=0;
    MINORS.concat(THOUGHTS).forEach(function(o){
      if(o.id===rn.from){ o.id=rn.to; moved++; }
      if(o.crosses) o.crosses=o.crosses.map(function(c){ return c===rn.from?rn.to:c; });
    });
    EDGES.forEach(function(e){
      if(e[0]===rn.from){ e[0]=rn.to; }
      if(e[1]===rn.from){ e[1]=rn.to; }
    });
    rn.movedObjects=moved;
  });
  V02_OVERLAY.relabel.forEach(function(r){`);

/* the species follows the new id */
sub(`  'psyche'      :{family:'nascent',  branches:0, len:0.00, spread:0.00, rings:0, core:0.30}`,
    `  'psychology'  :{family:'nascent',  branches:0, len:0.00, spread:0.00, rings:0, core:0.30}`);

/* the harness must report the rename so a check can audit it */
sub(`    /* the object the conflict is about, so a check can prove it did not move */
    var p=byId['psychology'];
    out.existingPsychologyConcept = p ? {id:p.id, label:p.label, ownedBy:p.mig, type:p.t} : null;`,
`    out.renamed=(V02_OVERLAY.renameIds||[]).map(function(rn){
      var o=byId[rn.to];
      return { from:rn.from, to:rn.to, moved:rn.movedObjects||0,
               oldIdStillPresent:!!byId[rn.from],
               label:o?o.label:null, ownedBy:o?o.mig:null, type:o?o.t:null,
               edges:LINKS.filter(function(l){ return l.a===rn.to||l.b===rn.to; }).length };
    });
    /* the object the rename is about, so a check can prove it did not move */
    var p=byId['psychology-behaviour'];
    out.existingPsychologyConcept = p ? {id:p.id, label:p.label, ownedBy:p.mig, type:p.t} : null;`);

console.log(n + ' edits applied');
