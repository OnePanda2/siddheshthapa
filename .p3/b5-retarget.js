const fs = require('fs');
const F = 'tools/worldmutate.js';
let s = fs.readFileSync(F, 'utf8');
let n = 0;
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 64)); process.exit(1); }
  s = s.replace(find, repl); n++;
}

const BT = String.fromCharCode(96);   // backtick, kept out of the literals below

/* H2: the brightening comes from the EMPHASIS, not the size lift. Removing only
   the brighten half leaves H3's dimming intact, so the two stay distinct. */
sub(
  "  { n: 'H2', file: APP, name: 'the hovered world actually brightens',\n" +
  "    find: " + BT + "      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;'," + BT + ",\n" +
  "    repl: " + BT + "      '  float lift = 1.0;'," + BT + " },",
  "  /* the brighten comes from the EMPHASIS, not the size lift; removing only\n" +
  "     the brighten half leaves H3's dimming intact, so the two stay distinct */\n" +
  "  { n: 'H2', file: APP, name: 'the hovered world actually brightens',\n" +
  "    find: " + BT + "      '    here *= (abs(region-hoverRegion)<0.5) ? 2.15 : 0.45;'," + BT + ",\n" +
  "    repl: " + BT + "      '    here *= (abs(region-hoverRegion)<0.5) ? 1.0 : 0.45;'," + BT + " },");

/* H4: the same mechanism M4 tests, asserted from the universe side. A release
   that does nothing leaves the last world lit. */
sub(
  "  { n: 'H4', file: APP, name: 'releasing restores the baseline',\n" +
  "    find: " + BT + "  if(pts) pts.material.uniforms.hoverRegion.value=idx;" + BT + ",\n" +
  "    repl: " + BT + "  if(pts) pts.material.uniforms.hoverRegion.value=(idx<0?2:idx);  // never clears" + BT + " },",
  "  { n: 'H4', file: APP, name: 'releasing restores the baseline',\n" +
  "    find: " + BT + "function highlightMIG(migId){\n  if(hoveredMIG===migId) return;" + BT + ",\n" +
  "    repl: " + BT + "function highlightMIG(migId){\n" +
  "  if(!migId) return;                           // mutation: release does nothing\n" +
  "  if(hoveredMIG===migId) return;" + BT + " },");

fs.writeFileSync(F, s, 'utf8');
console.log(n + ' mutations retargeted');
