/* §13 — the regions are laid out FOR the lateral view.

   Their brain positions were inherited from the universe: a direction on a
   sphere, warped onto the shell. That was fine while the camera stood at a
   three-quarter angle, because the sphere's spread survived the projection.
   A lateral view collapses the left-right axis, and an inherited spherical
   spread collapses with it — eleven of the fifteen regions piled into the
   lower-left quadrant, overlapping each other's names.

   So the regions are now placed across the SAGITTAL plane, which is the plane
   the visitor actually sees, and the left-right axis carries hemisphere and
   depth instead of layout. Their universe positions are untouched: this
   changes where a region sits inside the organ, never what it owns, what it
   is connected to, or where its world is. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 72)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`MIGS.forEach(function(m){
  if(!m.uPos) return;
  /* a region is INSIDE the mind, not a dot on its shell */
  m.bPos=brainShell(m.uPos.clone().normalize()).multiplyScalar(0.68);
});`,
`/* Where does a region sit in the organ? Spread across the plane the visitor
   is looking at, in the order the universe already puts them in — so the
   arrangement is derived from the data rather than typed out region by region,
   and adding a sixteenth MIG re-spaces the lot instead of needing a new case.

   The lattice is deliberately uneven. A clean 5x3 grid of names over a brain
   would read as a diagram of a brain; the offsets keep it a mind. */
MIGS.forEach(function(m,i){
  if(!m.uPos) return;
  var N=MIGS.length, COLS=Math.ceil(Math.sqrt(N*1.9));   // wider than tall, as the organ is
  var ROWS=Math.ceil(N/COLS);
  var cx=(i%COLS+0.5)/COLS, cy=(Math.floor(i/COLS)+0.5)/ROWS;
  /* deterministic per-region offsets from the index — no hand placement */
  cx+=(((i*7)%5)/5-0.5)*0.11;
  cy+=(((i*11)%7)/7-0.5)*0.20;
  /* front is +Z and the crown is +Y, so a column walks the brain back to front
     and a row walks it top to bottom */
  var z=(0.5-cx)*1.58, y=(0.62-cy)*1.06;
  /* the hemispheres alternate, which puts neighbours at different depths and
     stops two names from ever landing on the same pixel */
  var side=(i%2===0)?1:-1;
  var lat=0.40+((i*13)%4)/4*0.34;
  var dir=new THREE.Vector3(lat*side,y,z).normalize();
  var rad=0.62+((i*5)%3)/3*0.14;
  m.bPos=brainShell(dir).multiplyScalar(rad);
});`);

/* a 3D label states a source only when there IS one */
sub(`            var src=sourceLabelOf(n.id);
            if(src){`,
`            /* 29 — the source is intrigue, and twelve repetitions of "not yet
               charted" floating over an organ is not intrigue, it is noise.
               The three charted worlds say what they borrow; the rest say
               nothing here and are still declared uncharted in the menu, which
               is where the claim is auditable. */
            var src=sourceLabelOf(n.id);
            if(src==='not yet charted') src=null;
            if(src){`);

console.log(n + ' edits applied');
