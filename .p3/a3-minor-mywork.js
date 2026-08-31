/* §15 — hovering a Minor IG's name lights the exact object it names in the
   world around it, and nothing else. Same shape as highlightMIG: one generic
   entry point, the renderer decides how each world answers, no per-world code.

   §28 — the welcome page keeps its MY WORKS door alongside ENTER THE MIND. It
   is not the future My Works experience; for now it enters the mind and travels
   to ART, so the two paths exist without duplicating the project corpus. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* ── §15: the object index every vertex knows about itself ──────────── */
edit('src/v02-app.js',
  `  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));`,
`  geo.setAttribute('isMig',new THREE.BufferAttribute(ISMIG,1));
  /* each vertex knows which object it is, so ONE uniform can name any of them */
  var NIDX=new Float32Array(TOTV);
  for(var q9=0;q9<TOTV;q9++) NIDX[q9]=(q9<placed.length)?q9:-1;
  geo.setAttribute('nodeIdx',new THREE.BufferAttribute(NIDX,1));`);

edit('src/v02-app.js',
  `      'uniform float focusRegion; uniform float hoverRegion; uniform float mindOpen;',`,
  `      'uniform float focusRegion; uniform float hoverRegion; uniform float mindOpen;',
      'uniform float hoverNode; attribute float nodeIdx;',`);

edit('src/v02-app.js',
`      '  if(isMig < 0.5) here *= (0.78 + 0.22*mindOpen);',`,
`      '  if(isMig < 0.5) here *= (0.78 + 0.22*mindOpen);',
      /* pointing at one idea by name lifts that idea and lets the rest settle
         back — never a flash across the whole environment */
      '  if(hoverNode >= 0.0){',
      '    here *= (abs(nodeIdx-hoverNode)<0.5) ? 2.30 : 0.44;',
      '  }',`);

edit('src/v02-app.js',
`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',`,
`      '  float lift = (hoverRegion>=0.0 && abs(region-hoverRegion)<0.5) ? 1.22 : 1.0;',
      '  if(hoverNode >= 0.0 && abs(nodeIdx-hoverNode)<0.5) lift *= 1.34;',`);

edit('src/v02-app.js',
  `               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0},
               mindOpen:{value:0.0} },`,
  `               focusRegion:{value:-1.0}, hoverRegion:{value:-1.0},
               hoverNode:{value:-1.0}, mindOpen:{value:0.0} },`);

/* the generic entry point, beside highlightMIG */
edit('src/v02-app.js',
`var hoveredMIG=null;`,
`var hoveredNode=null;
/* highlightNode(id) — name one object and the world answers. The renderer
   decides how; there is no per-world and no per-object implementation. */
function highlightNode(id){
  if(hoveredNode===id) return;
  hoveredNode=id;
  if(!glOK||!pts) return;
  var i=(id && nodeIndex[id]!==undefined) ? nodeIndex[id] : -1;
  pts.material.uniforms.hoverNode.value=i;
  invalidate(40);
}

var hoveredMIG=null;`);

/* wire the Minor IG rows — pointer and keyboard, never a touch pseudo-hover */
edit('src/v02-app.js',
`  if(n.t==='mig'){
    b.addEventListener('pointerenter',function(e){ if(e.pointerType!=='touch') highlightMIG(n.id); });
    b.addEventListener('pointerleave',function(){ highlightMIG(null); });`,
`  if(n.t!=='mig'){
    b.addEventListener('pointerenter',function(e){ if(e.pointerType!=='touch') highlightNode(n.id); });
    b.addEventListener('pointerleave',function(){ highlightNode(null); });
    b.addEventListener('focus',function(){ if(kbNav) highlightNode(n.id); });
    b.addEventListener('blur',function(){ if(hoveredNode===n.id) highlightNode(null); });
  }
  if(n.t==='mig'){
    b.addEventListener('pointerenter',function(e){ if(e.pointerType!=='touch') highlightMIG(n.id); });
    b.addEventListener('pointerleave',function(){ highlightMIG(null); });`);

/* harness */
edit('src/v02-app.js',
  `  highlight:function(id){ highlightMIG(id); return this.hoverState(); },`,
  `  highlight:function(id){ highlightMIG(id); return this.hoverState(); },
  highlightNode:function(id){ highlightNode(id); return this.nodeHoverState(); },
  nodeHoverState:function(){
    return { hovered:hoveredNode,
             hoverNode:pts?pts.material.uniforms.hoverNode.value:null,
             expectedIndex:(hoveredNode&&nodeIndex[hoveredNode]!==undefined)?nodeIndex[hoveredNode]:-1 };
  },`);

/* ── §28: the welcome page keeps both doors ─────────────────────────── */
edit('src/v02-shell.html',
  `<button id="enterBtn" type="button">Enter the mind <span aria-hidden="true">&rarr;</span></button>`,
  `<div class="th-doors">\n` +
  `      <button id="worksBtn" type="button">My works</button>\n` +
  `      <button id="enterBtn" type="button">Enter the mind <span aria-hidden="true">&rarr;</span></button>\n` +
  `    </div>`);

edit('src/v02-shell.html',
  `#enterBtn:hover{background:var(--ground-2);border-color:var(--ink)}`,
  `#enterBtn:hover,#worksBtn:hover{background:var(--ground-2);border-color:var(--ink)}\n` +
  `.th-doors{display:flex;gap:10px;flex-wrap:wrap;align-items:center}\n` +
  `#worksBtn{font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;\n` +
  `  padding:13px 20px;background:transparent;border:1px solid var(--rule);color:var(--ink);\n` +
  `  cursor:pointer;border-radius:2px}\n` +
  `#worksBtn:focus-visible{outline:2px solid var(--focus);outline-offset:2px}`);

edit('src/v02-app.js',
  "var threshold=document.getElementById('threshold'), enterBtn=document.getElementById('enterBtn');",
`var threshold=document.getElementById('threshold'), enterBtn=document.getElementById('enterBtn');
var worksBtn=document.getElementById('worksBtn');
/* the second door. NOT the future My Works experience — it opens the mind and
   travels to ART, so both paths exist without a second project corpus. */
if(worksBtn) worksBtn.addEventListener('click',function(){
  enterMind();
  travelTo('region','my-works');
});`);

console.log(n + ' edits applied');
