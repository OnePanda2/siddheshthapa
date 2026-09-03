/* The generic fit worked but overshot: it pulled Philosophy's camera from 115
   to 262, which flattens the dense composition that is LOCKED.

   Two corrections, both principled:

   1. Bounds are measured from a world's PRINCIPAL bodies — its concepts and its
      centre — not from every writing. Writings sit outside the orbits by design
      and were never inside the approved frame.

   2. Each profile declares a framingBias, which §17 explicitly allows. A
      constellation must be whole, so its bias is 1.0. Philosophy's approved
      composition deliberately crops its outermost orbits, so its bias is lower.
      The rule stays shared; only the parameter differs. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`  var maxR=0;
  (owned[migId]||[]).forEach(function(oid){
    var nd=byId[oid], p=nd&&(nd.uPos||nd.pos);
    if(p) maxR=Math.max(maxR, p.distanceTo(c));
  });`,
`  var maxR=0;
  /* PRINCIPAL bodies only. Writings sit outside the orbits by design and were
     never part of any world's intended frame. */
  (owned[migId]||[]).forEach(function(oid){
    var nd=byId[oid];
    if(!nd || nd.t!=='minor') return;
    var p=nd.uPos||nd.pos;
    if(p) maxR=Math.max(maxR, p.distanceTo(c));
  });`);

sub(`function frameWorldPos(migId, centre, dir, preferred){
  var need=fitDistance(migId);
  var d=Math.max(preferred, need);`,
`function frameWorldPos(migId, centre, dir, preferred){
  var p=MIG_WORLD_PROFILE[migId]||{};
  var bias=(p.framingBias===undefined)?1.0:p.framingBias;
  var need=fitDistance(migId)*bias;
  var d=Math.max(preferred, need);`);

/* the profile declares it */
sub(`      labelStyle: type==='constellation' ? {minor:470, writing:190} : {minor:160, writing:80},`,
`      labelStyle: type==='constellation' ? {minor:470, writing:190} : {minor:160, writing:80},
      /* how much of the world must fit the readable area. A constellation is a
         FIGURE and must be whole; a dense planetary system is allowed to crop
         its outer orbits, which is what its approved composition does. */
      framingBias: type==='constellation' ? 1.00
                 : type==='circumbinary'  ? 0.88
                 : type==='planetary'     ? 0.66
                 : 0.90,`);

console.log(n + ' edits applied');
