/* PART 2 — formalise the world grammars.

   The three worlds were special cases scattered through the renderer. They
   become one declared profile per MIG, and the renderer reads the profile.
   A MIG with no world yet is NOT a silent fallback: it is explicitly `latent`,
   so "has no world" is a stated fact a check can hold us to. */
const fs = require('fs');
const F = 'src/v02-app.js';
let n = 0;
function sub(find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

sub(`var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};`,
`/* ── THE WORLD PROFILE ────────────────────────────────────────────────
   One entry per MIG. The graph stays the source of truth; this is only the
   visual interpretation of it. Every field the renderer actually consults
   lives here, so a new world is a profile rather than a new branch. */
var WORLD_TYPES=['planetary','circumbinary','constellation','latent'];
var MIG_WORLD_PROFILE={};
(function(){
  MIGS.forEach(function(m){
    var sys=MIG_SYSTEM[m.id]||null;
    var tpl=sys?ASTRO[sys]:null;
    var kon=MIG_CONSTELLATION[m.id]||null;
    var type = kon ? 'constellation'
             : (tpl && tpl.sourceType==='circumbinary-system') ? 'circumbinary'
             : tpl ? 'planetary'
             : 'latent';
    /* how far the camera stands when it arrives — the one number that sets the
       scale of everything range-based in that world */
    var arrive = kon ? (CONST_DATA.derived.meanDistanceLy*CONST_SCALE)
               : (type==='circumbinary') ? 2.5*scaleFor(m.id)*0.70+2.5*scaleFor(m.id)*0.42
               : (type==='planetary') ? 115
               : 96;
    MIG_WORLD_PROFILE[m.id]={
      worldType:type,
      astronomyTemplate: kon || sys || null,
      centralObject: type==='circumbinary' ? 'two stars about an empty barycentre'
                   : type==='constellation' ? 'none — the figure itself is the emblem'
                   : type==='planetary' ? 'one star'
                   : 'none yet',
      palette: MIG_PALETTE[m.id]?'own':'neutral',
      geometry: type==='constellation' ? 'measured RA/Dec/distance, true relative 3D'
              : type==='latent' ? 'spherical placeholder'
              : 'measured semi-major axis ratios',
      motion: type==='circumbinary' ? 'the pair swings while the camera travels'
            : type==='constellation' ? 'parallax on pointer — the figure depends on where you stand'
            : 'still',
      /* WORLD-LOCAL relationship visibility. Range is derived from the world's
         own arrival distance, so every world's relationships are equally
         legible when you get there — the shared rule, parameterised. */
      relationshipStyle:{ range:+(arrive*2.2).toFixed(1), arrival:+arrive.toFixed(1) },
      labelStyle: type==='constellation' ? {minor:470, writing:190} : {minor:160, writing:80},
      atmosphere: MIG_PALETTE[m.id]?'own fog and body tones':'shared neutral',
      mobileMode: type==='constellation' ? 'stand back 2.02x and aim below the figure'
                : type==='circumbinary' ? 'stand back and lift the pair out of the sheet'
                : type==='planetary' ? 'stand back and aim high'
                : 'default'
    };
  });
})();
function profileOf(mid){ return MIG_WORLD_PROFILE[mid]||null; }
function relRangeOf(mid){
  var p=MIG_WORLD_PROFILE[mid];
  return (p && p.relationshipStyle && p.relationshipStyle.range) || 260;
}

var GENERIC_SPECIES={family:'star', branches:0, len:0, spread:0, rings:0, core:0.5};`);

/* label ranges come from the profile, not from a constellation test */
sub(`    var isStar=(n.star!==undefined);
    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : isStar ? ((n.t==='minor' ? d<470 : d<190) && !elsewhere)
             : (n.t==='minor' ? (d<160 && !elsewhere) : (d<80 && !elsewhere));`,
`    var lp=(profileOf(n.mig)||{}).labelStyle||{minor:160,writing:80};
    var isStar=(n.star!==undefined);
    var want = n.t==='mig' ? (d<620 && !elsewhere)
             : ((n.t==='minor' ? d<lp.minor : d<lp.writing) && !elsewhere);`);

sub(`    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))
             : isStar ? Math.max(0,Math.min(1,(n.t==='minor'?(470-d)/240:(190-d)/90)))
             : Math.max(0,Math.min(1,(120-d)/70));`,
`    var lr=(n.t==='minor'?lp.minor:lp.writing);
    var near = n.t==='mig' ? Math.max(0,Math.min(1,(620-d)/380))
             : Math.max(0,Math.min(1,(lr-d)/(lr*0.5)));`);

sub(`  species:function(){`,
`  worlds:function(){
    var out={profiles:{}, types:{}, migs:MIGS.length};
    MIGS.forEach(function(m){
      var p=MIG_WORLD_PROFILE[m.id];
      out.profiles[m.id]=p;
      out.types[p.worldType]=(out.types[p.worldType]||0)+1;
    });
    out.validTypes=WORLD_TYPES;
    out.undeclared=MIGS.filter(function(m){ return !MIG_WORLD_PROFILE[m.id]; }).map(function(m){return m.id;});
    return out;
  },
  species:function(){`);

console.log(n + ' edits applied');
