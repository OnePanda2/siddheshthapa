/* H2 and H4 had no mutations, which under the protocol makes them UNVERIFIED
   rather than passing. Adding both — and strengthening H2, which asserted
   `> base * 0.98` and would therefore have accepted the hovered world getting
   slightly DARKER. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 62)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

edit('tools/worldcheck.js',
`ck('H2', r.open.hLove.love > r.open.base.love * 0.98,`,
`/* strictly brighter: `+"`> base * 0.98`"+` would have accepted it getting darker */
ck('H2', r.open.hLove.love > r.open.base.love,`);

edit('tools/worldmutate.js',
`  { n: 'H3', file: APP, name: 'the other worlds recede under hover',`,
`  { n: 'H2', file: APP, name: 'the hovered world actually brightens',
    find: \`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',\`,
    repl: \`      '  float lift = 1.0;',\` },

  { n: 'H4', file: APP, name: 'releasing restores the baseline',
    find: \`  if(pts) pts.material.uniforms.hoverRegion.value=idx;\`,
    repl: \`  if(pts) pts.material.uniforms.hoverRegion.value=(idx<0?2:idx);  // never clears\` },

  { n: 'H3', file: APP, name: 'the other worlds recede under hover',`);

console.log(n + ' edits applied');
