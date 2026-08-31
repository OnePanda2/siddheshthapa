const fs = require('fs');
let n = 0;
function edit(F, find, repl) {
  let s = fs.readFileSync(F, 'utf8');
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error(F + ' ANCHOR x' + hits + ': ' + find.slice(0, 60)); process.exit(1); }
  fs.writeFileSync(F, s.replace(find, repl), 'utf8'); n++;
}

/* the source line sits under the MIG name, above the counts, and stays
   subordinate to both until you point at it */
edit('src/v02-shell.html',
  '.nav .meta{',
  '.nav .src{display:block;font-family:var(--mono);font-size:9px;letter-spacing:.14em;\n' +
  '  text-transform:uppercase;color:var(--ink-subtle);opacity:.62;margin:3px 0 1px}\n' +
  '.nav [data-nav]:hover .src,.nav [data-nav]:focus-visible .src{opacity:1}\n' +
  '.nav .meta{');

edit('src/v02-app.js',
  "  menuRows:function(){\n" +
  "    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){\n" +
  "      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\\s+/g,' ').trim() };\n" +
  "    });\n" +
  "  },",
  "  menuRows:function(){\n" +
  "    return [].slice.call(document.querySelectorAll('#groups [data-nav]')).map(function(b){\n" +
  "      var s=b.querySelector('.src');\n" +
  "      return { id:b.getAttribute('data-nav'), text:(b.textContent||'').replace(/\\s+/g,' ').trim(),\n" +
  "               source:s?s.textContent:null, aria:b.getAttribute('aria-label')||null,\n" +
  "               expected:sourceLabelOf(b.getAttribute('data-nav')) };\n" +
  "    });\n" +
  "  },");

console.log(n + ' edits applied');
