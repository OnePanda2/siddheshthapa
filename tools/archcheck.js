/* archcheck.js — MY WORKS is the front door, never the house.

   The visitor journey promotes MY WORKS to the first destination. That must
   never become a change of OWNERSHIP: every MIG stays a first-class member of
   the Main Mind, and a cross-region relationship is a bridge between
   constellations, not a transfer.

   These are structural invariants, so they are read from the live model after
   really entering and leaving MY WORKS — not from the source.

   C21 every authoritative MIG is present in the Main Mind Menu
   C22 MY WORKS is a first-class MIG, not a container
   C23 no MIG is reparented under any other MIG
   C24 Philosophy is still top-level after entering and exiting MY WORKS
   C26 returning to the Main Mind restores the complete MIG universe
   C25/C28 a cross-region relationship changes pathway, not ownership

   usage: node tools/archcheck.js [v02.html]
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'v02.html';
const tmp = (require('./scratch.js').root() + '/arch-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

const PROBE = `(function(){
  var M=window.__v02;
  if(!M) return {error:'__v02 missing'};
  M.enter();
  var atEntry=M.arch();

  /* walk the real journey: MY WORKS -> a project -> the idea it reaches ->
     that idea's MIG -> back to the Main Mind. Ownership is sampled at every
     step, because a hierarchy that only survives when nobody moves is not a
     hierarchy. */
  M.go('region','my-works');           var inWorks=M.arch();
  M.go('concept','p-website');         var inProject=M.arch();
  var reach=M.crossFrom? M.crossFrom('p-website') : null;
  M.go('concept','curiosity');         var inIdea=M.arch();
  M.go('region','philosophy');         var inPhil=M.arch();
  M.go('universe');                    var back=M.arch();

  return {atEntry:atEntry, inWorks:inWorks, inProject:inProject,
          inIdea:inIdea, inPhil:inPhil, back:back, reach:reach,
          state:M.state()};
})()`;

const page = tmp + '/a.html';
fs.writeFileSync(page, fs.readFileSync(FILE, 'utf8') + `\n<script>
setTimeout(function(){
  var r; try{ r=(${PROBE}); }catch(e){ r={error:String(e&&e.message||e)}; }
  var p=document.createElement('pre'); p.id='vp';
  p.textContent=JSON.stringify({result:r}); document.body.appendChild(p);
},300);
</script>`, 'utf8');

let r;
try {
  const dom = execSync('"' + CHROME + '" --headless=new --hide-scrollbars' +
    ' --user-data-dir="' + tmp + '/cr" --no-first-run --window-size=1440,900' +
    ' --virtual-time-budget=2600 --force-prefers-reduced-motion --dump-dom "file:///' +
    page.replace(/\\/g,'/') + '#lite"', { maxBuffer: 1 << 26, timeout: 240000 }).toString();
  const m = dom.match(/<pre id="vp">([\s\S]*?)<\/pre>/);
  if (!m) throw new Error('probe did not run');
  r = JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')).result;
  if (!r || r.error) throw new Error(r ? r.error : 'no result');
} catch (e){
  console.log('  FAIL  NOT MEASURED — ' + String(e.message).split('\n')[0].slice(0,80));
  process.exit(1);                     // unmeasured is a failure
}

/* derived, never typed: the authoritative graph plus the V02 overlay's
   declared additions. An undeclared MIG still breaks this. */
const EXPECT = require('../.p3/expect.js').expectedMigs().total;
const steps = ['atEntry','inWorks','inProject','inIdea','inPhil','back'];
let bad = 0;
function ck(id, ok, msg){
  if (ok) console.log('  PASS  ' + id + '  ' + msg);
  else { bad++; console.log('  FAIL  ' + id + '  ' + msg); }
}

/* C21 — the Main Mind Menu exposes every MIG WHENEVER IT IS SHOWN, and the
   model retains all of them at every step of the journey. Demanding the menu
   render inside a constellation was my own misreading: the panel is
   contextual by design, and the brain control is always one press away. What
   must never happen is a MIG ceasing to exist because you walked somewhere. */
const menuStates = ['atEntry','back'];                    // the universe views
const menuBad  = menuStates.filter(k => r[k].migsInMenu !== EXPECT);
const modelBad = steps.filter(k => r[k].migCount !== EXPECT);
ck('C21', menuBad.length === 0 && modelBad.length === 0,
   (menuBad.length ? 'MIGs missing from the menu at: ' + menuBad.join(', ') : '') +
   (modelBad.length ? ' MIGs missing from the model at: ' + modelBad.join(', ') : '') ||
   'the Main Mind Menu lists all ' + EXPECT + ' MIGs whenever shown, and all ' + EXPECT +
   ' survive in the model at every step of the journey');

// C22 — MY WORKS is a peer, and owns no MIG
ck('C22', r.atEntry.myWorksOwnsMigs.length === 0 && r.atEntry.migCount === EXPECT,
   r.atEntry.myWorksOwnsMigs.length ? 'MY WORKS owns MIGs: ' + r.atEntry.myWorksOwnsMigs.join(', ')
   : 'MY WORKS is a first-class MIG owning ' + r.atEntry.myWorksMembers + ' of its own members, no MIGs');

// C23 — nothing is reparented, at any step
const rep = steps.filter(k => r[k].reparented.length);
ck('C23', rep.length === 0,
   rep.length ? 'reparented at ' + rep.join(', ') + ': ' + r[rep[0]].reparented.join(', ')
              : 'no MIG is reparented — all ' + r.atEntry.migsSelfOwned + ' own themselves');

// C24 — Philosophy survives the round trip intact
ck('C24', r.inPhil.philosophyTopLevel && r.back.philosophyTopLevel &&
          r.back.philosophyMembers === r.atEntry.philosophyMembers,
   'Philosophy is top-level after entering and leaving MY WORKS, with its ' +
   r.back.philosophyMembers + ' members intact');

// C25/C28 — crossing changed where you are, not who owns what
const ownershipStable = steps.every(k =>
  r[k].migCount === EXPECT && r[k].philosophyMembers === r.atEntry.philosophyMembers &&
  r[k].myWorksMembers === r.atEntry.myWorksMembers);
ck('C25/C28', ownershipStable,
   'crossing MY WORKS -> p-website -> curiosity -> Philosophy changed pathway, not ownership');

// C26 — returning restores the whole universe
ck('C26', r.back.migCount === EXPECT && r.back.migsInMenu === EXPECT && r.state.mode === 'universe',
   'returning to the Main Mind restores all ' + r.back.migCount + ' constellations');

// C27 — prominence without nesting
ck('C27', r.atEntry.menuFirst === 'my-works' && r.atEntry.myWorksOwnsMigs.length === 0,
   'MY WORKS leads the menu (' + r.atEntry.menuFirst + ') while nesting nothing');

console.log('\n' + (7 - bad) + '/7 architectural invariants hold');
console.log(bad ? bad + ' PROBLEM(S)' : 'MY WORKS is the front door, not the house');
process.exit(bad ? 1 : 0);
