/* PARTS 7 + 8 — ART rename, and PSYCHOLOGY as a first-class MIG.

   preview.html is the published P4.7 fallback and must not be edited, and
   build-v02 extracts its data VERBATIM. So every divergence the V02 layer
   makes is declared here, in one auditable list, rather than smuggled into the
   extracted block. A check can read this list and hold us to it.

   PART 7 — MY WORKS keeps its id, its ten concepts, its six writings, its
   relationships and its ownership. Only the displayed label becomes ART. The
   welcome-page "My Works" entry point is NOT built here.

   PART 8 — PSYCHOLOGY becomes a MIG. It is created EMPTY on purpose: the brief
   forbids inventing concepts, and the repository's only Psychology object is a
   Minor IG that HUMAN BEHAVIOUR already owns. Promoting that object would
   change ownership, which is not mine to do, so it stays where it is and the
   new region starts unpopulated. Its id is `psyche` for one concrete reason:
   the id `psychology` is already taken by that Minor IG, and reusing it would
   collide in byId and make the existing concept unreachable. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`MIGS.forEach(function(m){ m.t='mig'; m.mig=m.id; NODES.push(m); owned[m.id]=[]; });`,
`/* ── THE V02 OVERLAY ──────────────────────────────────────────────────
   Everything V02 changes about the extracted P4.7 graph, declared in one
   place. Nothing else may diverge. */
var V02_OVERLAY={
  relabel:[
    { id:'my-works', from:'MY WORKS', to:'ART',
      why:'the MMM entry becomes ART; the welcome page will later own a separate My Works door. Identity, ownership, concepts, writings and relationships are untouched.' }
  ],
  addMIGs:[
    { id:'psyche', label:'PSYCHOLOGY',
      gloss:'Not yet written. The region exists; the thinking has not been filed here.',
      empty:true,
      why:'required as a first-class MIG. Created EMPTY on purpose — no concepts were invented.',
      idNote:'id is psyche, not psychology, because a Minor IG owned by HUMAN BEHAVIOUR already holds the id psychology. Reusing it would collide in byId and make that concept unreachable.',
      conflict:'HUMAN BEHAVIOUR owns a Minor IG also labelled PSYCHOLOGY. Promoting it into this region would change ownership and was NOT done. Flagged for a decision.' }
  ]
};
(function(){
  V02_OVERLAY.relabel.forEach(function(r){
    for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===r.id){
      r.observedFrom=MIGS[i].label; MIGS[i].label=r.to;
    }
  });
  V02_OVERLAY.addMIGs.forEach(function(a){
    for(var i=0;i<MIGS.length;i++) if(MIGS[i].id===a.id) return;   // never twice
    MIGS.push({ id:a.id, label:a.label, gloss:a.gloss, v02Added:true, v02Empty:!!a.empty });
  });
})();
MIGS.forEach(function(m){ m.t='mig'; m.mig=m.id; NODES.push(m); owned[m.id]=[]; });`);

/* the harness must be able to report the overlay so a check can audit it */
sub(`  worlds:function(){`,
`  overlay:function(){
    var out={ relabel:[], added:[], migCount:MIGS.length, migs:MIGS.map(function(m){
      return {id:m.id, label:m.label, added:!!m.v02Added, empty:!!m.v02Empty,
              owns:(owned[m.id]||[]).length}; }) };
    V02_OVERLAY.relabel.forEach(function(r){
      var m=byId[r.id];
      out.relabel.push({ id:r.id, from:r.from, observedFrom:r.observedFrom||null,
                         to:r.to, nowLabel:m?m.label:null,
                         owns:(owned[r.id]||[]).length });
    });
    V02_OVERLAY.addMIGs.forEach(function(a){
      var m=byId[a.id];
      out.added.push({ id:a.id, label:m?m.label:null, empty:!!a.empty,
                       owns:(owned[a.id]||[]).length, conflict:a.conflict||null });
    });
    /* the object the conflict is about, so a check can prove it did not move */
    var p=byId['psychology'];
    out.existingPsychologyConcept = p ? {id:p.id, label:p.label, ownedBy:p.mig, type:p.t} : null;
    return out;
  },
  worlds:function(){`);

console.log(n + ' edits applied');
