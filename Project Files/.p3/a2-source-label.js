/* §12 — every MIG shows the astronomical system it is built from, in smaller
   type under its name. It is part of the storytelling: PHILOSOPHY / TRAPPIST-1
   says the region is a real place before you have entered it.

   A region with no world yet says so rather than inventing a source. The label
   is read from the world profile, never typed per MIG, and it exists in the
   accessible DOM as well as on screen. */
const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 66)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the profile already knows the template; expose it as a display string */
edit('src/v02-app.js',
  `function profileOf(mid){ return MIG_WORLD_PROFILE[mid]||null; }`,
`function profileOf(mid){ return MIG_WORLD_PROFILE[mid]||null; }
/* the source line under a MIG's name. Never invented: a region with no world
   yet is labelled as such. */
function sourceLabelOf(mid){
  var p=MIG_WORLD_PROFILE[mid];
  if(!p) return 'unassigned';
  if(p.worldType==='latent' || !p.astronomyTemplate) return 'not yet charted';
  return p.astronomyTemplate;
}`);

/* the row carries it, and so does the accessible name */
edit('src/v02-app.js',
`  var l=document.createElement('span'); l.className='lbl'; l.textContent=n.label||n.id;
  b.appendChild(l);`,
`  var l=document.createElement('span'); l.className='lbl'; l.textContent=n.label||n.id;
  b.appendChild(l);
  if(n.t==='mig'){
    var src=document.createElement('span');
    src.className='src'; src.setAttribute('data-src',n.id);
    src.textContent=sourceLabelOf(n.id);
    b.appendChild(src);
    b.setAttribute('aria-label',(n.label||n.id)+' — '+sourceLabelOf(n.id));
  }`);

/* subordinate to the name, above the counts */
edit('src/v02-shell.html',
  '.nav .meta{',
'.nav .src{display:block;font-family:var(--mono);font-size:9px;letter-spacing:.14em;' +
  'text-transform:uppercase;color:var(--ink-subtle);opacity:.66;margin:3px 0 1px}
' +
  '.nav [data-nav]:hover .src,.nav [data-nav]:focus-visible .src{opacity:1}
' +
  '.nav .meta{');

/* the harness reports it so a check can compare it against the profile */
edit('src/v02-app.js',
`  menuRows:function(){
    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){
      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\\s+/g,' ').trim() };
    });
  },`,
`  menuRows:function(){
    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){
      var s=b.querySelector('.src');
      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\\s+/g,' ').trim(),
               source:s?s.textContent:null, aria:b.getAttribute('aria-label')||null,
               expected:sourceLabelOf(b.getAttribute('data-nav')) };
    });
  },`);

console.log(n + ' edits applied');
