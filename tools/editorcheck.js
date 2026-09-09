/* editorcheck.js — does the editor actually commit what it says it committed?
 *
 * EVERY OTHER HARNESS WRITES THE STORE DIRECTLY. sectioncheck, projectcheck,
 * regioncheck and menucheck all put JSON on disk, rebuild, and inspect the
 * page — which proves the pipeline and says nothing whatever about the form
 * that is supposed to produce that JSON. The whole path from a filled-in field
 * to a commit body had never been exercised by anything.
 *
 * Two defects lived in that blind spot, and both were found by reading rather
 * than by testing:
 *
 *   - commitTo() named its callback parameter `file`, shadowing the path, so
 *     `file === CFG.path` compared a response object to a string and was false
 *     every time. The store therefore reached the change function without
 *     `retired` or `edits` — neither of which the live file has ever had — so
 *     Retire, correct-an-original and edit-a-topic all threw on a real store.
 *   - the edit path called saveEdit() with the fields and not the
 *     relationships, so anything typed into "add a relationship" while editing
 *     was silently discarded. The editor said Saved and the edge never existed.
 *
 * So this drives the real form in a real browser and reads the real PUT body.
 * GitHub is replaced at the fetch boundary and nowhere else: every line of the
 * editor between the button and the request runs exactly as it ships.
 *
 *   E1  the editor reaches an authorised state and paints its controls
 *   E2  a NEW writing commits itself and its relationships
 *   E3  editing an existing writing commits the changed fields
 *   E4  and the relationships typed while editing — the ones that used to be
 *       thrown away — arrive in the same commit
 *   E5  a store with no `retired` and no `edits` keys, which is exactly what
 *       the live file is, survives the round trip rather than throwing
 *   E6  and nothing is ever sent anywhere but api.github.com
 *
 * usage: node tools/editorcheck.js [editor.html]
 */
const fs = require('fs'), { execSync } = require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = process.argv[2] || 'editor.html';
const tmp = (require('./scratch.js').root() + '/editor-' + process.pid).replace(/\\/g, '/');
fs.mkdirSync(tmp, { recursive: true });

let bad = 0, TOTAL = 0;
const ck = (id, ok, msg) => { TOTAL++; if (ok) console.log('  PASS  ' + id.padEnd(4) + msg);
                              else { bad++; console.log('  FAIL  ' + id.padEnd(4) + msg); } };

/* THE STORE THE FAKE GITHUB HANDS BACK is deliberately the shape of the real
   one: version, notes, minors, edges and NOTHING ELSE. data/notes.json has
   never carried `retired` or `edits`, and a harness that invented them would
   have hidden the exact bug this file exists to catch. */
const PRELUDE = `<script>(function(){
  var mem = {};
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(mem,k) ? mem[k] : null; },
      setItem: function(k,v){ mem[k] = String(v); },
      removeItem: function(k){ delete mem[k]; }
    }});
  } catch(e){}
  window.localStorage.setItem('v02.editor.token', 'TEST-TOKEN-NOT-A-REAL-ONE');

  window.__puts = [];      /* every commit body the editor produced */
  window.__urls = [];      /* every URL it asked for */
  window.__store = { version:1, notes:[], minors:[], edges:[] };

  function b64(str){
    var bytes = new TextEncoder().encode(str), bin = '';
    for(var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(s){
    var bin = atob(String(s).replace(/\\s/g,'')), bytes = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function reply(o, ok){
    return Promise.resolve({ ok: ok !== false, status: ok === false ? 404 : 200,
      json: function(){ return Promise.resolve(o); } });
  }
  window.fetch = function(url, opts){
    url = String(url); opts = opts || {};
    window.__urls.push(url);
    if(/\\/user$/.test(url)) return reply({ login:'OnePanda2' });
    if(/contents\\/data\\/notes\\.json/.test(url)){
      if((opts.method||'GET').toUpperCase() === 'PUT'){
        var body = JSON.parse(opts.body);
        var sent = JSON.parse(unb64(body.content));
        window.__puts.push({ message: body.message, store: sent });
        window.__store = sent;                       /* as GitHub would */
        return reply({ commit:{ html_url:'https://example.invalid/commit/1' } });
      }
      return reply({ sha:'0000000000000000000000000000000000000000',
                     content: b64(JSON.stringify(window.__store)) });
    }
    if(/contents\\//.test(url)) return reply({ message:'Not Found' }, false);
    /* the repository itself, asked for push permission */
    if(/\\/repos\\/[^\\/]+\\/[^\\/]+$/.test(url)) return reply({ permissions:{ push:true } });
    return reply({}, false);
  };
})();</script>
`;

/* the prelude must run BEFORE the editor's own script, so it is inserted at
   the top of <body> rather than appended like every other probe in this suite */
const page = tmp + '/e.html';
const src = fs.readFileSync(FILE, 'utf8');
const at = src.indexOf('<body');
const bodyEnd = at >= 0 ? src.indexOf('>', at) + 1 : 0;
fs.writeFileSync(page, src.slice(0, bodyEnd) + '\n' + PRELUDE + src.slice(bodyEnd), 'utf8');

const PROBE = `(function(){
  var M = window.__v02, E = window.__editor;
  if(!M || !E) return { ERROR: 'the page did not boot (__v02 ' + !!M + ', __editor ' + !!E + ')' };
  var out = { authorised: E.authorised(), who: E.who(), urls: [], puts: [] };
  if(!out.authorised) return out;

  var mdl = M.model();
  /* a writing that comes from the LOCKED CORPUS, so the edit path takes the
     overrides branch — the one that reaches into store.edits */
  var subject = mdl.nodes.filter(function(n){
    return n.t !== 'mig' && n.t !== 'minor' && !n.vacant && n.mig === 'philosophy'; })[0];
  var other = mdl.nodes.filter(function(n){
    return n.t === 'minor' && n.id !== (subject && subject.id); })[0];
  if(!subject || !other) return { ERROR: 'no subject to edit' };
  out.subject = subject.id; out.other = other.id;

  /* BY CLASS, NOT BY POSITION. The relationship row carries .rel-to, .rel-verb
     and .rel-gloss precisely so it can be addressed; picking "the last
     textarea" would silently target the wrong field the moment a control is
     added above it, and a harness that fills the wrong box proves nothing. */
  function fill(rel){
    var add = [].slice.call(document.querySelectorAll('#edForm button'))
      .filter(function(b){ return /\\+\\s*relationship/i.test(b.textContent); })[0];
    if(!add) return 'no + relationship button';
    add.click();
    var to    = [].slice.call(document.querySelectorAll('#edForm .rel-to')).pop();
    var verb  = [].slice.call(document.querySelectorAll('#edForm .rel-verb')).pop();
    var gloss = [].slice.call(document.querySelectorAll('#edForm .rel-gloss')).pop();
    if(!to || !verb || !gloss) return 'the relationship row did not appear';
    to.value = rel.to; verb.value = rel.verb; gloss.value = rel.gloss;
    if(to.value !== rel.to) return 'the target ' + rel.to + ' is not offered';
    return null;
  }

  window.__step2 = function(){
    /* ---- E3/E4: edit an existing writing AND give it a relationship ---- */
    E.open('philosophy', subject);
    var line = document.querySelectorAll('#edForm textarea')[0];
    if(!line) return 'the edit form has no line field';
    line.value = 'Edited by editorcheck, then put back.';
    var err = fill({ to: other.id, verb: 'answers to',
                     gloss: 'A relationship typed while editing, which used to be discarded in silence.' });
    if(err) return err;
    document.getElementById('edSave').click();
    return null;
  };

  /* ---- E2: a NEW writing, which is the path that already worked ------- */
  E.open('philosophy');
  var fields = document.querySelectorAll('#edForm input[type=text]');
  var title = fields[0], ref = null;
  [].forEach.call(fields, function(f){ if(/mono/.test(f.className)) ref = f; });
  var body = document.querySelectorAll('#edForm textarea')[0];
  if(!title || !body) return { ERROR: 'the new-writing form is not the shape expected' };
  title.value = 'ZZ EDITORCHECK WRITING';
  if(title.oninput) title.oninput();          /* the id derives from the title */
  body.value = 'Written by the harness to prove a new writing carries its relationships, then removed.';
  var reg = document.querySelector('#edForm input[list=edRegisters]');
  if(reg) reg.value = 'fixture — written by the harness, not by anyone';
  var srcF = [].slice.call(document.querySelectorAll('#edForm input[type=text]'))
    .filter(function(f){ return /provenance|source/i.test(f.placeholder || ''); })[0];
  if(srcF) srcF.value = 'Live note';
  var err2 = fill({ to: other.id, verb: 'argues with',
                    gloss: 'A relationship on a brand-new writing, which has always worked and now has a check.' });
  if(err2) return { ERROR: err2 };
  document.getElementById('edSave').click();
  return out;
})()`;

const AFTER = `(function(){
  return { puts: window.__puts, urls: window.__urls };
})()`;

/* TWO COMMITS, ONE AFTER THE OTHER RATHER THAN BOTH AT ONCE. commitTo reads
   the store fresh before every write, so firing the publish and the edit in
   the same tick would have the second read the store as it was BEFORE the
   first landed — a race the harness would have created and then blamed on the
   editor. Each step waits for the previous commit to resolve. */
fs.writeFileSync(page, fs.readFileSync(page, 'utf8') + `
<script>window.addEventListener('load',function(){
  setTimeout(function(){
    var r; try{ r=${PROBE}; }catch(e){ r={ERROR:String((e&&e.stack)||e)}; }
    setTimeout(function(){
      if(!r.ERROR && window.__step2){
        var e2 = null;
        try{ e2 = window.__step2(); }catch(e){ e2 = String((e&&e.stack)||e); }
        if(e2) r.ERROR = e2;
      }
      setTimeout(function(){
        var a; try{ a=${AFTER}; }catch(e){ a={ERROR:String(e)}; }
        r.puts = a.puts; r.urls = a.urls;
        document.title = JSON.stringify(r);
      }, 1000);
    }, 1000);
  }, 1200);
});</script>`, 'utf8');

const dom = execSync('"' + CHROME + '" --headless=new --disable-gpu --hide-scrollbars' +
  ' --user-data-dir="' + tmp + '/u" --no-first-run --no-default-browser-check' +
  ' --window-size=1440,900 --virtual-time-budget=20000 --dump-dom "' + page + '"',
  { encoding: 'utf8', maxBuffer: 1e8, timeout: 300000 });
const mm = dom.match(/<title>([\s\S]*?)<\/title>/);
if (!mm) { console.error('the page never reported'); process.exit(1); }
const r = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
if (r.ERROR) { console.error(r.ERROR); process.exit(1); }

/* ---- E1 ---------------------------------------------------------------- */
ck('E1', r.authorised === true && r.who === 'OnePanda2',
   'the editor reaches an authorised state as ' + r.who + ' — every line between the ' +
   'button and the request is the shipped one; only fetch is replaced');

const puts = r.puts || [];
const put = puts[puts.length - 1];
const store = put && put.store;

/* ---- E2 — the path that already worked, now with a check --------------- */
const first = puts[0] && puts[0].store;
const fresh = first && (first.notes || []).filter(n => /EDITORCHECK/.test(n.label || ''))[0];
const freshEdge = first && (first.edges || []).filter(e => fresh && e[0] === fresh.id)[0];
ck('E2', !!fresh && !!freshEdge && freshEdge[2] === 'argues with',
   fresh && freshEdge
     ? 'a new writing commits itself and its relationship together — ' + fresh.id +
       ' ' + freshEdge[2] + ' ' + freshEdge[1]
     : 'a new writing did not commit ' + (fresh ? 'its relationship' : 'at all'));

/* ---- E5 ---------------------------------------------------------------- */
ck('E5', puts.length >= 2 && !!store,
   puts.length >= 2
     ? 'a store carrying only version/notes/minors/edges — the shape the live file ' +
       'actually has — went through commitTo twice and came back as commit bodies, ' +
       'rather than throwing on a key that was never there'
     : 'only ' + puts.length + ' commit(s) landed; the round trip threw before a PUT');

/* ---- E3 ---------------------------------------------------------------- */
const edits = (store && store.edits) || {};
const edited = edits[r.subject] || null;
ck('E3', !!edited && /Edited by editorcheck/.test(edited.line || ''),
   edited ? 'editing a corpus writing commits an override for ' + r.subject +
            ' carrying the changed line'
          : 'the edit committed no override for ' + r.subject);

/* ---- E4 — the one that was silently dropped ---------------------------- */
const edges = (store && store.edges) || [];
const mine = edges.filter(e => e[0] === r.subject && e[1] === r.other);
ck('E4', mine.length === 1 && mine[0][2] === 'answers to' && /used to be discarded/.test(mine[0][3]),
   mine.length === 1
     ? 'and the relationship typed while editing arrives in the SAME commit — ' +
       r.subject + ' ' + mine[0][2] + ' ' + r.other + ' — which is what used to be ' +
       'thrown away while the editor reported success'
     : 'the relationship typed while editing was not committed (' + edges.length +
       ' edge(s) in the body)');

/* ---- E6 ---------------------------------------------------------------- */
const offsite = (r.urls || []).filter(u => u.indexOf('https://api.github.com') !== 0);
ck('E6', (r.urls || []).length > 0 && offsite.length === 0,
   (r.urls || []).length + ' request(s), every one to api.github.com' +
   (offsite.length ? ' — EXCEPT: ' + offsite.slice(0, 3).join(', ') : ''));

console.log('\n' + (TOTAL - bad) + '/' + TOTAL + ' editor invariants hold');
console.log(bad ? bad + ' PROBLEM(S)'
                : 'the editor commits what it says it commits, relationships included');
process.exit(bad ? 1 : 0);
