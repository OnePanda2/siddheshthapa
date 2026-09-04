/* brainmutate.js — break the constellation on purpose, one property at a
   time, and require braincheck to notice.

   A mutation whose anchor does not match is UNVERIFIED, not a pass. A crash is
   not a catch. A mutation that applies and leaves the suite green means the
   assertion proves nothing, and the ASSERTION is what gets fixed — never the
   mutation.

   usage: node tools/brainmutate.js [B9]   one assertion
          node tools/brainmutate.js --dry  check every anchor still exists
*/
const fs = require('fs'), { execSync } = require('child_process');
const APP = 'src/v02-app.js';
const ONLY = (process.argv[2] && process.argv[2] !== '--dry') ? process.argv[2] : null;
const DRY = process.argv.includes('--dry');

const M = [
  { id: 'B1', why: 'stop emitting the figure, leaving nothing but the graph',
    find: '    buildBrainCurves(BRAIN_VIEW, phoneLine?0.5:1).forEach(function(c){',
    repl: '    [].forEach(function(c){' },

  { id: 'B2', why: 'flatten the figure onto a plane so it wraps no volume',
    find: '  var p=new THREE.Vector3(x*brainWidth(y,z), y*r*0.74, z*r);',
    repl: '  var p=new THREE.Vector3(x*brainWidth(y,z)*0.01, y*r*0.74, z*r);' },

  { id: 'B3', why: 'swing the camera to a three-quarter view',
    find: 'var BRAIN_VIEW=new THREE.Vector3(1.0,0.125,0.105).normalize();',
    repl: 'var BRAIN_VIEW=new THREE.Vector3(1.0,0.62,0.95).normalize();' },

  { id: 'B4', why: 'push the camera in until the figure is cropped',
    find: '    var k=(phoneB2?5.60:2.50)*(1+WELCOME_DIM*0.13);',
    repl: '    var k=(phoneB2?5.60:0.80)*(1+WELCOME_DIM*0.13);' },

  /* the figure must be MIRRORED: a constellation that has to read from any
     direction cannot have one side drawn and the other left out */
  { id: 'B5', why: 'draw only one hemisphere, so the figure works from one side',
    find: "  var rimL=chain(rimC,N(9),false,'fissure-L'), rimR=chain(mirror(rimC),N(9),false,'fissure-R');",
    repl: "  var rimL=chain(rimC,N(9),false,'fissure-L'), rimR=rimL;" },

  /* Removing the hemisphere offset is NOT enough to fuse them: it contributes
     only 12 of the 36 units of gap, because the fissure rims standing at
     x = 0.15 either side already do most of the separating. Putting those rims
     ON the midline is what actually closes it. */
  { id: 'B6', why: 'close the longitudinal fissure so the hemispheres fuse',
    find: `  var rimC=[[0.15,0.36,0.88],[0.17,0.74,0.62],[0.17,0.96,0.10],
            [0.16,0.88,-0.44],[0.14,0.46,-0.84]];`,
    repl: `  var rimC=[[0.0,0.36,0.88],[0.0,0.74,0.62],[0.0,0.96,0.10],
            [0.0,0.88,-0.44],[0.0,0.46,-0.84]];` },

  { id: 'B7', why: 'take the frontal lobe away, leaving the back the fullest end',
    find: 'var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,',
    repl: 'var BRAIN_PROFILE=[0.70,0.72,0.74,0.76,0.78,' },

  { id: 'B8', why: 'lift the temporal chain above the Sylvian fissure',
    find: '  var tmpC=[[0.54,-0.56,0.52],[0.70,-0.56,0.16],[0.72,-0.52,-0.20],[0.56,-0.46,-0.50]];',
    repl: '  var tmpC=[[0.54,0.56,0.52],[0.70,0.56,0.16],[0.72,0.52,-0.20],[0.56,0.46,-0.50]];' },

  { id: 'B9', why: 'move the cerebellum off the back of the head',
    find: '  var cbC=[[0.46,-0.36,-0.70],[0.50,-0.58,-0.78],[0.36,-0.76,-0.74],[0.14,-0.82,-0.58]];',
    repl: '  var cbC=[[0.46,-0.36,0.70],[0.50,-0.58,0.78],[0.36,-0.76,0.74],[0.14,-0.82,0.58]];' },

  { id: 'B10', why: 'replace the designed outline with a plain ellipse',
    find: 'var BRAIN_PROFILE=[0.96,1.00,1.04,1.07,1.08,1.07,1.05,1.02,0.99,0.96,0.93,0.89,\n                   0.85,0.75,0.71,0.80,0.72,0.60,0.52,0.50,0.60,0.66,0.72,0.88];',
    repl: 'var BRAIN_PROFILE=[1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,\n                   1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00];' },

  { id: 'B11', why: 'fix a weak shape by adding chains, the exact failure the brief bans',
    find: '  var proL=profileRing(1), proR=profileRing(-1);',
    repl: '  var proL=profileRing(1), proR=profileRing(-1);\n  for(var q=0;q<12;q++) chain([[0.15,0.36,0.88],[0.17,0.74,0.62],[0.17,0.96,0.10]],9,false,"filler-"+q);' },

  { id: 'B12', why: 'collapse the anatomy into the relationship layer',
    find: '          kinds.push(3);',
    repl: '          kinds.push(1);' },

  { id: 'B13', why: 'name the chains after relationships instead of after anatomy',
    find: "    return chain(c, N(18), true, 'profile-'+(side>0?'L':'R'));",
    repl: "    return chain(c, N(18), true, 'edge-'+(side>0?'L':'R'));" },

  { id: 'B14', why: 'let the threshold render the figure at full strength',
    find: '      var wantDim=(entered?0:1);',
    repl: '      var wantDim=0;' },

  { id: 'B15', why: 'leave the world camera driving after the return',
    find: "  var wantOpen = (mode==='universe' && !id) ? 0 : 1;",
    repl: '  var wantOpen = 1;' },

  { id: 'B16', why: 'drop a region out of the brain',
    find: 'MIGS.forEach(function(m,i){\n  if(!m.uPos) return;\n  var N=MIGS.length,',
    repl: 'MIGS.forEach(function(m,i){\n  if(!m.uPos || i===3) return;\n  var N=MIGS.length,' },

  { id: 'B17', why: 'drop a region out of the menu',
    find: `    var rows=[].slice.call(document.querySelectorAll('#groups [data-nav]'))
               .map(function(b){ return b.getAttribute('data-nav'); });`,
    repl: `    var rows=[].slice.call(document.querySelectorAll('#groups [data-nav]'))
               .map(function(b){ return b.getAttribute('data-nav'); }).slice(1);` },

  { id: 'B18', why: 'make one MIG the child of another',
    find: 'var BRAIN_SPREAD=0.46;',
    repl: 'MIGS.forEach(function(mm){ if(mm.id==="love") mm.mig="philosophy"; });\nvar BRAIN_SPREAD=0.46;' },

  /* THE GUARD THIS BREAKS IS UNREACHABLE UNTIL A WORLD HAS NO SYSTEM, and once
     MUSIC, PSYCHOLOGY and ART were charted there was no such world left. The
     mutation went on being applied and the check went on passing — not because
     the assertion was strong but because the line it corrupted could no longer
     run. That is the worst way for a mutation to fail: silently, looking
     exactly like a mutation that was caught, until someone reads the count.

     So the mutation now creates the condition first — ART loses its system, as
     a topic added tomorrow would have none — and only then invents a heritage
     for it. That is the real claim: not "this line is correct" but "a world
     with nothing behind it never claims something". */
  { id: 'B19', why: 'invent a source for a world that has none',
    also: { find: "'music':'Kepler-80', 'psychology':'Kepler-62', 'art':'HD 40307' };",
            repl: "'music':'Kepler-80', 'psychology':'Kepler-62' };" },
    find: "  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';",
    repl: "  if(p.worldType==='latent' || !p.astronomyTemplate) return 'HR 8799';" },

  /* Alternating hemispheres was supposed to keep names apart and instead put
     them in line with the camera. Turning the separation off restores exactly
     that: two pairs of region names drawn on top of each other. */
  { id: 'B21', why: 'stop spreading the regions in the plane the lateral view keeps',
    find: "m.bY!==undefined; }), MIN=30;",
    repl: "m.bY!==undefined; }), MIN=0;" },

  { id: 'B20', why: 'let visiting a world rewrite the anatomy behind it',
    find: "  var csL=chain(csC,N(5),false,'central-L'), csR=chain(mirror(csC),N(5),false,'central-R');",
    repl: "  var csL=chain(csC,N(5),false,'central-L'), csR=chain(mirror(csC),N(5),false,'central-R');\n  if(typeof state!=='undefined' && state.region) BRAIN_CHAINS.pop();" }
];

const list = ONLY ? M.filter(m => m.id === ONLY) : M;
if (!list.length) { console.error('no mutation named ' + ONLY); process.exit(1); }

const original = fs.readFileSync(APP, 'utf8');
let bad = 0;
if (DRY) {
  M.forEach(m => {
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) { bad++; console.log('  x' + hits + '  ' + m.id + '  "' + m.find.slice(0, 58) + '"'); }
    if (m.also) {
      const h2 = original.split(m.also.find).length - 1;
      if (h2 !== 1) { bad++; console.log('  x' + h2 + '  ' + m.id + ' (precondition)  "' + m.also.find.slice(0, 46) + '"'); }
    }
  });
  console.log(bad ? '\n' + bad + ' BAD ANCHOR(S) of ' + M.length
                  : '\nall ' + M.length + ' anchors match exactly once');
  process.exit(bad ? 1 : 0);
}

let verified = 0;
try {
  for (const m of list) {
    const hits = original.split(m.find).length - 1;
    if (hits !== 1) {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' anchor matched ' + hits + ' times — UNVERIFIED');
      continue;
    }
    /* the precondition is applied FIRST and audited exactly as strictly: an
       'also' that silently matched nothing would hand back a mutation that
       once again corrupts an unreachable line. */
    let mutated = original;
    if (m.also) {
      const h2 = mutated.split(m.also.find).length - 1;
      if (h2 !== 1) {
        bad++;
        console.log('BAD  ' + m.id.padEnd(4) + ' precondition anchor matched ' + h2 + ' times — UNVERIFIED');
        continue;
      }
      mutated = mutated.replace(m.also.find, m.also.repl);
    }
    fs.writeFileSync(APP, mutated.replace(m.find, m.repl), 'utf8');
    execSync('node tools/build-v02.js', { stdio: 'pipe' });
    let failed = false, line = '';
    try {
      execSync('node tools/braincheck.js v02.html', { stdio: 'pipe', encoding: 'utf8' });
    } catch (e) {
      failed = true;
      const out = (e.stdout || '') + (e.stderr || '');
      const f = out.split('\n').filter(l => /^\s*FAIL/.test(l));
      line = f.length ? f.map(l => l.trim().split(/\s+/)[1]).join(',') : 'crashed';
    }
    if (failed && line !== 'crashed' && line.split(',').indexOf(m.id) >= 0) {
      verified++;
      console.log('OK   ' + m.id.padEnd(4) + ' ' + m.why + '  →  caught by ' + line);
    } else {
      bad++;
      console.log('BAD  ' + m.id.padEnd(4) + ' ' + m.why);
      console.log('     ' + (line === 'crashed'
        ? 'the page CRASHED — a crash is not the assertion catching anything'
        : failed ? 'a DIFFERENT assertion failed (' + line + ') — ' + m.id + ' still proves nothing'
                 : 'CHECK DID NOT FAIL — the assertion proves nothing'));
    }
  }
} finally {
  fs.writeFileSync(APP, original, 'utf8');
  execSync('node tools/build-v02.js', { stdio: 'pipe' });
}
console.log('\n' + verified + '/' + list.length + ' brain assertions mutation-verified');
process.exit(bad ? 1 : 0);
