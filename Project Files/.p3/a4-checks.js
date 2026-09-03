const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 62)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* §9 — the brain must be framed WHOLE. Report its projected bounds so a check
   can prove nothing is cropped rather than trusting the camera maths. */
edit('src/v02-app.js',
  `    out.left=bx.filter(function(v){return v<0;}).length;`,
`    if(camera && renderer){
      var W2=renderer.domElement.clientWidth, H2=renderer.domElement.clientHeight;
      var xs2=[], ys2=[], off=0;
      MIGS.forEach(function(m){
        if(!m.bPos) return;
        var v=m.bPos.clone().project(camera);
        var px=(v.x*0.5+0.5)*W2, py=(-v.y*0.5+0.5)*H2;
        xs2.push(px); ys2.push(py);
        if(v.z>=1||Math.abs(v.x)>1||Math.abs(v.y)>1) off++;
      });
      out.frame={ w:W2, h:H2, offScreen:off,
                  x0:Math.round(Math.min.apply(null,xs2)), x1:Math.round(Math.max.apply(null,xs2)),
                  y0:Math.round(Math.min.apply(null,ys2)), y1:Math.round(Math.max.apply(null,ys2)) };
      out.frame.margin=Math.round(Math.min(out.frame.x0, out.frame.y0,
                                           W2-out.frame.x1, H2-out.frame.y1));
      out.frame.fillsW=+((out.frame.x1-out.frame.x0)/W2).toFixed(3);
      out.frame.fillsH=+((out.frame.y1-out.frame.y0)/H2).toFixed(3);
    }
    out.left=bx.filter(function(v){return v<0;}).length;`);

/* the probe gathers the new evidence */
edit('tools/worldcheck.js',
`  M.highlight(null); M.settle(30);
  open.rel={ phil:b('philosophy'), love:b('love') };`,
`  M.highlight(null); M.settle(30);
  open.rel={ phil:b('philosophy'), love:b('love') };

  /* ---- Minor IG highlight, inside a world ---- */
  M.go('region','philosophy'); M.settle(140);
  var minor={ base:{ cur:b('curiosity',110), eth:b('ethics',110) } };
  M.highlightNode('curiosity'); M.settle(40);
  minor.on={ st:M.nodeHoverState(), cur:b('curiosity',110), eth:b('ethics',110) };
  M.highlightNode(null); M.settle(40);
  minor.off={ st:M.nodeHoverState(), cur:b('curiosity',110), eth:b('ethics',110) };`);

edit('tools/worldcheck.js',
  `  return { closed:closed, open:open, worlds:worlds, atUniverse:atUniverse,
           arch:M.arch(), perf:M.perf() };`,
  `  return { closed:closed, open:open, worlds:worlds, atUniverse:atUniverse, minor:minor,
           arch:M.arch(), perf:M.perf() };`);

/* the new assertions */
edit('tools/worldcheck.js',
`console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' architecture invariants hold');`,
`/* W8 — the PSYCHOLOGY identity collision is resolved without moving ownership */
const rn = (OV.renamed || [])[0] || {};
ck('W8', psy.id === 'psychology' && rn.from === 'psychology' &&
         rn.to === 'psychology-behaviour' && rn.moved === 1 &&
         rn.oldIdStillPresent === false && rn.label === 'PSYCHOLOGY' &&
         rn.ownedBy === 'behaviour' && rn.edges === 3,
   'the identity collision is resolved — the MIG takes the id psychology, the concept is re-keyed to ' +
   rn.to + ' but keeps its label ' + rn.label + ', its owner ' + rn.ownedBy +
   ' and all ' + rn.edges + ' of its relationships');

/* W9 — every MIG states its source, and an unassigned one says so */
const srcBad = (r.closed.menu || []).filter(m => !m.source || m.source !== m.expected);
const charted = (r.closed.menu || []).filter(m => m.source !== 'not yet charted');
ck('W9', srcBad.length === 0 && charted.length === 3 &&
         charted.every(m => /TRAPPIST-1|Kepler-16|Ursa Major/.test(m.source)) &&
         (r.closed.menu || []).every(m => m.aria && m.aria.indexOf(m.source) >= 0),
   'every MIG states its astronomical source and it matches its profile — ' +
   charted.map(m => m.id + '=' + m.source).join(', ') + '; the other ' +
   ((r.closed.menu || []).length - charted.length) + ' say "not yet charted" rather than inventing one' +
   (srcBad.length ? ' — WRONG: ' + srcBad.map(m => m.id).join(', ') : ''));

/* M6 — the whole brain is in frame, not cropped and not zoomed into a MIG */
const FR = B.frame || {};
ck('M6', FR.offScreen === 0 && FR.margin > 20 &&
         FR.fillsW > 0.28 && FR.fillsW < 0.98 && FR.fillsH > 0.28 && FR.fillsH < 0.98,
   'the whole brain is framed — ' + FR.offScreen + ' regions off screen, ' +
   FR.margin + 'px clear of every edge, filling ' + FR.fillsW + ' x ' + FR.fillsH +
   ' of a ' + FR.w + 'x' + FR.h + ' frame');

/* MI1-3 — naming one idea lights that idea, and only that one */
const MN = r.minor || {};
ck('MI1', MN.on && MN.on.st.hoverNode === MN.on.st.expectedIndex && MN.on.st.hoverNode >= 0 &&
          MN.on.st.hovered === 'curiosity' && MN.on.cur > MN.base.cur,
   'hovering a Minor IG lights exactly that object — curiosity is vertex ' +
   (MN.on ? MN.on.st.hoverNode : '?') + ', brightness ' + (MN.base ? MN.base.cur : '?') +
   ' -> ' + (MN.on ? MN.on.cur : '?'));
ck('MI2', MN.on && MN.on.eth < MN.base.eth && (MN.on.cur - MN.on.eth) > 25,
   'the objects it did not name recede — ethics ' + (MN.base ? MN.base.eth : '?') + ' -> ' +
   (MN.on ? MN.on.eth : '?') + ', leaving curiosity ' +
   (MN.on ? (MN.on.cur - MN.on.eth) : '?') + ' brighter');
ck('MI3', MN.off && MN.off.st.hoverNode === -1 && MN.off.st.hovered === null &&
          near(MN.off.cur, MN.base.cur, 2) && near(MN.off.eth, MN.base.eth, 2),
   'releasing restores the baseline exactly (' + (MN.base ? MN.base.cur + '/' + MN.base.eth : '?') +
   ' -> ' + (MN.off ? MN.off.cur + '/' + MN.off.eth : '?') + ')');

console.log('\\n  ' + (TOTAL - bad) + '/' + TOTAL + ' architecture invariants hold');`);

console.log(n + ' edits applied');
