/* ═══════════════════════════════════════════════════════════════════════
   V02 — THE EDITOR
   Ships in editor.html only. The published page never loads this file, which
   is why v02.html keeps the property ADR-02 requires of it: one artifact,
   zero external requests. Every network call in this project lives here.

   WHAT ACTUALLY STOPS AN IMPOSTOR. Not this file. Everything below runs in a
   browser, and anything running in a browser can be edited by whoever is
   holding it — hiding a button hides nothing from someone with devtools. The
   real lock is that publishing a note means committing to
   github.com/OnePanda2/siddheshthapa, and GitHub refuses that commit to
   everyone who cannot push to it. So this file's identity check is a courtesy
   to the honest — it tells you plainly that you are signed in as the wrong
   person instead of letting you fill in a long form and fail at the end. Strip
   the check out and you still cannot publish.

   THE FORM CANNOT INVENT VOCABULARY. Regions, existing nodes and registers
   already in use are read from the live graph through window.__v02.model(),
   never typed here. A list typed here would be wrong the first time the graph
   changed, and wrong in the direction that matters: it would offer a region
   that does not exist.

   IT ALSO CANNOT SUBMIT WHAT THE BUILD WOULD REJECT. The rules below are the
   same rules as tools/notescheck.js — closed vocabularies, uppercase labels,
   required provenance, glosses that must explain themselves, no duplicate or
   inverted edges. Two enforcement points is not duplication: this one is so
   you find out while you are still typing, that one is so a hand-edited commit
   or a future version of this form can never publish something malformed.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var CFG = /*__EDITORCFG__*/;

/* the vocabularies. CONTENT-MODEL.md is the authority. */
var TYPES  = ['belief','thought','question','contradiction','project',
              'experiment','person','reference'];
var GLOSS_MIN = 25;

var TYPE_HELP = {
  belief:'something held to be true',
  thought:'an observation, not a conviction',
  question:'left open on purpose',
  contradiction:'two things held at once',
  project:'something being built',
  experiment:'something being tried',
  person:'someone who matters to the thinking',
  reference:'a source worth keeping'
};

var API = 'https://api.github.com';
var KEY = 'v02.editor.token';
var STATEKEY = 'v02.editor.oauthstate';

var token = null, me = null, canPush = false;
var model = null;                       // the live graph, fetched on demand
var pending = null;                     // the note being written

/* ── utilities ─────────────────────────────────────────────────────────── */
function el(tag, cls, text){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text != null) e.textContent = text;
  return e;
}
function slug(s){
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-')
                  .replace(/^-+|-+$/g,'').slice(0,48);
}
/* btoa is byte-oriented and the material is full of em-dashes, so the string is
   encoded to UTF-8 bytes first. Skipping this throws on the first note that
   contains a dash Siddhesh actually types. */
function b64(str){
  var bytes = new TextEncoder().encode(str), bin = '';
  for(var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function unb64(s){
  var bin = atob(String(s).replace(/\s/g,'')), bytes = new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function gh(path, opts){
  opts = opts || {};
  opts.headers = Object.assign({
    'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'
  }, opts.headers || {}, token ? {'Authorization':'Bearer ' + token} : {});
  return fetch(API + path, opts).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(body){
      if(!r.ok){
        var e = new Error((body && body.message) || ('GitHub said ' + r.status));
        e.status = r.status; e.body = body; throw e;
      }
      return body;
    });
  });
}

/* ── style ─────────────────────────────────────────────────────────────── */
var CSS = [
'#edBar{position:fixed;left:16px;bottom:16px;z-index:80;display:flex;gap:10px;',
'  align-items:center;font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;',
'  letter-spacing:.09em;text-transform:uppercase;color:#8b93a7;',
'  background:rgba(6,8,16,.86);border:1px solid #1e2436;border-radius:3px;',
'  padding:8px 11px;backdrop-filter:blur(6px)}',
'#edBar b{color:#cfd6e6;font-weight:400}',
'#edBar .dot{width:6px;height:6px;border-radius:50%;background:#4a5163}',
'#edBar.on .dot{background:#5ad07a;box-shadow:0 0 8px rgba(90,208,122,.8)}',
'#edBar button{font:inherit;letter-spacing:inherit;text-transform:inherit;',
'  color:#cfd6e6;background:none;border:1px solid #2a3145;border-radius:2px;',
'  padding:4px 9px;cursor:pointer}',
'#edBar button:hover{border-color:#495june}',
'.ed-add{display:block;width:100%;margin-top:14px;padding:11px;',
'  font:11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;',
'  text-transform:uppercase;color:#cfd6e6;background:rgba(90,208,122,.07);',
'  border:1px dashed #34506a;border-radius:3px;cursor:pointer;text-align:center}',
'.ed-add:hover{background:rgba(90,208,122,.13);border-color:#5ad07a}',
'#edForm{position:fixed;inset:0;z-index:90;background:rgba(4,6,12,.96);',
'  overflow-y:auto;display:none}',
'#edForm.open{display:block}',
'.ed-in{max-width:760px;margin:0 auto;padding:44px 26px 90px}',
'.ed-in h2{font:400 26px/1.2 Georgia,"Times New Roman",serif;color:#e8ecf5;margin:0 0 4px}',
'.ed-sub{font:11px/1.5 ui-monospace,monospace;letter-spacing:.1em;',
'  text-transform:uppercase;color:#7d859a;margin:0 0 28px}',
'.ed-f{margin:0 0 22px}',
'.ed-f>label{display:block;font:11px/1.4 ui-monospace,monospace;letter-spacing:.11em;',
'  text-transform:uppercase;color:#8b93a7;margin:0 0 7px}',
'.ed-f .hint{display:block;font:italic 12px/1.5 Georgia,serif;color:#69718a;',
'  text-transform:none;letter-spacing:0;margin-top:3px}',
'.ed-f input[type=text],.ed-f textarea,.ed-f select{width:100%;box-sizing:border-box;',
'  background:#0b0e18;border:1px solid #232a3d;border-radius:3px;color:#e2e7f2;',
'  padding:9px 11px;font:14px/1.55 Georgia,"Times New Roman",serif}',
'.ed-f textarea{min-height:120px;resize:vertical}',
'.ed-f select,.ed-f input[type=text].mono{font:13px/1.4 ui-monospace,monospace}',
'.ed-f input:focus,.ed-f textarea:focus,.ed-f select:focus{outline:none;border-color:#3d6ea8}',
'.ed-chips{display:flex;flex-wrap:wrap;gap:6px}',
'.ed-chips label{font:11px/1 ui-monospace,monospace;letter-spacing:.06em;color:#9aa2b6;',
'  border:1px solid #232a3d;border-radius:2px;padding:6px 9px;cursor:pointer;',
'  display:flex;gap:6px;align-items:center}',
'.ed-chips input{margin:0}',
'.ed-chips label.on{border-color:#3d6ea8;color:#cfd6e6;background:rgba(61,110,168,.12)}',
'.ed-rel{border:1px solid #1c2233;border-radius:3px;padding:14px;margin:0 0 10px}',
'.ed-rel .row{display:flex;gap:8px;margin-bottom:8px}',
'.ed-rel .row>*{flex:1}',
'.ed-rel .drop{flex:0 0 auto;color:#8b93a7;background:none;border:1px solid #232a3d;',
'  border-radius:2px;cursor:pointer;padding:0 10px;font:11px/1 ui-monospace,monospace}',
'.ed-small{font:11px/1.5 ui-monospace,monospace;letter-spacing:.06em;color:#69718a}',
'.ed-act{display:flex;gap:10px;align-items:center;margin-top:30px;',
'  border-top:1px solid #1c2233;padding-top:22px}',
'.ed-act button{font:11px/1 ui-monospace,monospace;letter-spacing:.12em;',
'  text-transform:uppercase;padding:12px 20px;border-radius:3px;cursor:pointer}',
'#edSave{color:#04120a;background:#5ad07a;border:1px solid #5ad07a}',
'#edSave:disabled{opacity:.45;cursor:not-allowed}',
'#edCancel{color:#9aa2b6;background:none;border:1px solid #2a3145}',
'.ed-err{border-left:2px solid #d05a5a;background:rgba(208,90,90,.08);',
'  padding:10px 14px;margin:0 0 18px;font:12px/1.7 ui-monospace,monospace;color:#e3b6b6}',
'.ed-err b{display:block;color:#f0d2d2;font-weight:400;margin-bottom:5px;',
'  letter-spacing:.08em;text-transform:uppercase;font-size:11px}',
'.ed-ok{border-left:2px solid #5ad07a;background:rgba(90,208,122,.08);',
'  padding:14px;margin:0 0 18px;font:12px/1.7 ui-monospace,monospace;color:#b6e3c4}',
'.ed-ok a{color:#8fe0a8}',
'.ed-row{display:flex;gap:5px;margin-left:auto;padding-left:8px}',
'.ed-row button{font:10px/1 ui-monospace,monospace;letter-spacing:.08em;',
'  text-transform:uppercase;color:#8b93a7;background:none;border:1px solid #232a3d;',
'  border-radius:2px;padding:4px 7px;cursor:pointer}',
'.ed-row button:hover{color:#cfd6e6;border-color:#3d6ea8}',
'.ed-row button.del:hover{color:#e8a0a0;border-color:#8a3a3a}',
'#edAsk{position:fixed;inset:0;z-index:95;background:rgba(3,4,9,.86);',
'  display:none;align-items:center;justify-content:center;padding:24px}',
'#edAsk.open{display:flex}',
'.ed-ask{max-width:520px;background:#0b0e18;border:1px solid #2a3145;',
'  border-radius:4px;padding:26px 26px 22px}',
'.ed-ask h3{font:400 20px/1.3 Georgia,serif;color:#e8ecf5;margin:0 0 12px}',
'.ed-ask p{font:13px/1.65 Georgia,serif;color:#9aa2b6;margin:0 0 10px}',
'.ed-ask .warn{color:#e3b6b6}',
'.ed-ask .keeps{font:11px/1.6 ui-monospace,monospace;color:#69718a;',
'  border-left:2px solid #2a3145;padding-left:11px;margin:14px 0 0}',
'.ed-ask .btns{display:flex;gap:10px;margin-top:20px}',
'.ed-ask button{font:11px/1 ui-monospace,monospace;letter-spacing:.12em;',
'  text-transform:uppercase;padding:11px 18px;border-radius:3px;cursor:pointer}',
'.ed-ask .go{color:#180606;background:#d98080;border:1px solid #d98080}',
'.ed-ask .no{color:#9aa2b6;background:none;border:1px solid #2a3145}'
].join('\n').replace('#495june','#495066');

/* ── the bar ───────────────────────────────────────────────────────────── */
var bar, barText, signBtn;
function buildBar(){
  bar = el('div'); bar.id = 'edBar';
  bar.appendChild(el('span','dot'));
  barText = el('span'); bar.appendChild(barText);
  signBtn = el('button'); bar.appendChild(signBtn);
  document.body.appendChild(bar);
  paintBar();
}
function paintBar(){
  var authorised = !!(token && me && canPush && me.login.toLowerCase() === CFG.owner.toLowerCase());
  bar.className = authorised ? 'on' : '';
  if(!token){
    barText.innerHTML = 'Editor &middot; <b>signed out</b>';
    signBtn.textContent = 'Sign in';
    signBtn.onclick = signIn;
  } else if(!me){
    barText.innerHTML = 'Editor &middot; <b>checking&hellip;</b>';
    signBtn.textContent = 'Cancel';
    signBtn.onclick = signOut;
  } else if(!authorised){
    barText.innerHTML = 'Editor &middot; <b>' + esc(me.login) + '</b> cannot publish here';
    signBtn.textContent = 'Sign out';
    signBtn.onclick = signOut;
  } else {
    barText.innerHTML = 'Editor &middot; <b>' + esc(me.login) + '</b>';
    signBtn.textContent = 'Sign out';
    signBtn.onclick = signOut;
  }
  if(window.__v02 && window.__v02.repaint) window.__v02.repaint();
}
function esc(s){
  return String(s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}
function authorised(){
  return !!(token && me && canPush && me.login.toLowerCase() === CFG.owner.toLowerCase());
}

/* ── auth ──────────────────────────────────────────────────────────────── */
function redirectUri(){
  return location.origin + location.pathname;
}
function signIn(){
  if(!CFG.exchange){
    /* THE HONEST FAILURE. Without the exchange there is no way to turn a code
       into a token from a browser, because the swap needs the client secret.
       Saying so here beats bouncing to GitHub and dying on the way back. */
    var t = prompt(
      'The OAuth token exchange is not deployed yet, so the GitHub sign-in ' +
      'round trip cannot complete.\n\n' +
      'You can paste a fine-grained personal access token instead ' +
      '(Contents: read and write on ' + CFG.owner + '/' + CFG.repo + ').\n\n' +
      'It is stored in this browser only, and never leaves it except to ' +
      'api.github.com.');
    if(t && t.trim()){ setToken(t.trim()); identify(); }
    return;
  }
  var st = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try{ sessionStorage.setItem(STATEKEY, st); }catch(_){}
  location.href = 'https://github.com/login/oauth/authorize' +
    '?client_id=' + encodeURIComponent(CFG.clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri()) +
    '&scope=' + encodeURIComponent(CFG.scope) +
    '&state=' + encodeURIComponent(st);
}
function setToken(t){
  token = t;
  try{ localStorage.setItem(KEY, t); }catch(_){}
}
function signOut(){
  token = null; me = null; canPush = false;
  try{ localStorage.removeItem(KEY); }catch(_){}
  paintBar();
}
function identify(){
  paintBar();
  loadLiveIds();
  gh('/user').then(function(u){
    me = u;
    /* THE AUTHORITY IS GITHUB'S, NOT THIS FILE'S. Asking whether the account
       can push is the same question the eventual commit will ask, so a person
       who would be refused at the end is told at the beginning. */
    return gh('/repos/' + CFG.owner + '/' + CFG.repo).then(function(r){
      canPush = !!(r.permissions && r.permissions.push);
      paintBar();
    });
  }).catch(function(e){
    if(e.status === 401){ signOut(); alert('That token is not valid (or has expired).'); }
    else { me = null; paintBar(); alert('GitHub: ' + e.message); }
  });
}
function completeOAuth(){
  var q = new URLSearchParams(location.search);
  var code = q.get('code'), st = q.get('state');
  if(!code) return false;
  var want = null;
  try{ want = sessionStorage.getItem(STATEKEY); }catch(_){}
  history.replaceState({}, '', redirectUri());
  if(!want || st !== want){
    alert('Sign-in was not completed here, so it was refused. Try again.');
    return true;
  }
  fetch(CFG.exchange, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ code: code, redirect_uri: redirectUri() })
  }).then(function(r){ return r.json(); }).then(function(d){
    if(d && d.access_token){ setToken(d.access_token); identify(); }
    else alert('The token exchange refused: ' + ((d && (d.error_description || d.error)) || 'no token returned'));
  }).catch(function(e){ alert('Could not reach the token exchange: ' + e.message); });
  return true;
}

/* ── the add affordance, painted into the region the reader is standing in ─ */
window.__editor = {
  /* ── THE TEST HARNESS ──────────────────────────────────────────────────
     The same surface window.__v02 offers, for the same reason: a check that
     drives the real form proves more than one that re-implements it. Exposing
     it costs nothing, because the form is not the lock — anyone may open it
     and fill it in, and the publish at the end still has to satisfy GitHub. */
  open: function(migId){ openForm(migId); },
  validate: function(n, rels){ return validate(n, rels, getModel()); },
  authorised: function(){ return authorised(); },
  who: function(){ return me ? me.login : null; },

  paintRegion: function(migId, groups){
    if(!authorised()) return;
    var M = getModel();
    var m = (M.migs.filter(function(x){ return x.id === migId; })[0]) || {label:migId};

    /* EDIT AND DELETE SIT ON THE ROW THEY ACT ON. A separate panel listing
       everything would make you match a name against a name; a control on the
       row is unambiguous about what it is about to change. They are appended
       to rows the app has already painted, so this cannot disagree with what
       the page is showing. */
    var byId = {};
    M.nodes.forEach(function(n){ byId[n.id] = n; });
    [].forEach.call(groups.querySelectorAll("[data-nav]"), function(btn){
      var n = byId[btn.getAttribute("data-nav")];
      if(!n || n.t === 'mig' || n.t === 'minor' || n.vacant) return;
      var bar = el("div", "ed-row");
      var ed = el("button", null, "edit"); ed.type = "button";
      var rm = el("button", "del", "delete"); rm.type = "button";
      /* the row itself navigates, so these must not */
      ed.onclick = function(e){ e.stopPropagation(); openForm(migId, n); };
      rm.onclick = function(e){
        e.stopPropagation();
        confirmDelete(n, function(done){ retire(n, done); });
      };
      bar.appendChild(ed); bar.appendChild(rm);
      btn.appendChild(bar);
    });

    var vac = M.nodes.filter(function(n){ return n.vacant && n.mig === migId; }).length;
    var b = el('button','ed-add','+ Add to ' + m.label +
              (vac ? "   \u00b7   " + vac + " empty star" + (vac>1?"s":"") + " waiting" : ""));
    b.type = 'button';
    b.onclick = function(){ openForm(migId); };
    groups.appendChild(b);
  }
};
function getModel(){
  if(!model && window.__v02 && window.__v02.model) model = window.__v02.model();
  return model || {migs:[],nodes:[],registers:[]};
}

/* ── ASKING FIRST ──────────────────────────────────────────────────────────
   EVERY deletion is confirmed, not only the ones that touch the corpus. A
   writing is not a row in a list; it is the only copy of something somebody
   sat down and meant, and one stray click on a small button should not be
   able to end it. The sheet names the writing and quotes its opening words,
   so the thing being confirmed is the thing you think it is.

   An original carries an extra line, because retiring one hides a piece of the
   corpus the whole site was extracted from. Nothing is ever destroyed either
   way: the text stays in preview.html or in the store, and the retirement is
   one line that can be deleted to bring it back. */
var ask, askIn;
function confirmDelete(node, onYes){
  askIn.innerHTML = "";
  var box = el("div", "ed-ask");
  box.appendChild(el("h3", null, "Delete " + node.label + "?"));

  var isOriginal = !liveNoteIds()[node.id];
  if(isOriginal){
    var w = el("p", "warn");
    w.textContent = "This is one of the original writings, taken from your own " +
      "documents rather than written here.";
    box.appendChild(w);
  }
  if(node.line){
    box.appendChild(el("p", null, "\u201C" +
      node.line.slice(0, 160).replace(/\s+/g, " ") + (node.line.length > 160 ? "\u2026" : "") +
      "\u201D"));
  }
  var keeps = el("div", "keeps");
  keeps.appendChild(el("div", null, "Its star stays lit where it is, carrying nothing."));
  keeps.appendChild(el("div", null, "The next writing you add here takes that star."));
  keeps.appendChild(el("div", null, "Its connections go with it."));
  keeps.appendChild(el("div", null, "The text is not destroyed \u2014 this is reversible."));
  box.appendChild(keeps);

  var btns = el("div", "btns");
  var go = el("button", "go", "Delete it"); go.type = "button";
  var no = el("button", "no", "Keep it");  no.type = "button";
  no.onclick = function(){ ask.classList.remove("open"); };
  go.onclick = function(){
    go.disabled = true; go.textContent = "Deleting\u2026";
    onYes(function(err){
      if(err){ go.disabled = false; go.textContent = "Delete it";
               var e = el("p", "warn", err); box.appendChild(e); return; }
      ask.classList.remove("open");
    });
  };
  btns.appendChild(go); btns.appendChild(no);
  box.appendChild(btns);
  askIn.appendChild(box);
  ask.classList.add("open");
  no.focus();
}

/* WHICH IDS THIS STORE WROTE, as opposed to inherited from the corpus. The
   difference decides how an edit is saved - rewriting a note in place, or
   declaring an override beside a locked original - and what the delete sheet
   warns about. It is read from the store itself rather than guessed from the
   id, because a slug says nothing about where a writing came from.

   Until it arrives, everything is treated as an original: that is the cautious
   way round. The worst case is an extra warning on a note you wrote, rather
   than a missing one on a piece of the corpus. */
var liveIds = null;
function liveNoteIds(){ return liveIds || {}; }
function loadLiveIds(){
  gh("/repos/" + CFG.owner + "/" + CFG.repo + "/contents/" + CFG.path +
     "?ref=" + encodeURIComponent(CFG.branch))
    .then(function(file){
      var store = JSON.parse(unb64(file.content));
      var map = {};
      (store.notes || []).forEach(function(n){ map[n.id] = true; });
      liveIds = map;
    })
    .catch(function(){ liveIds = {}; });
}

/* ── the form ──────────────────────────────────────────────────────────── */
var form, formIn;
function field(label, hint, control){
  var f = el('div','ed-f'), l = el('label', null, label);
  if(hint){ var h = el('span','hint', hint); l.appendChild(h); }
  f.appendChild(l); f.appendChild(control);
  return f;
}
function select(options, value, describe){
  var s = el('select');
  options.forEach(function(o){
    var op = el('option', null, describe ? (o + ' — ' + describe[o]) : o);
    op.value = o; if(o === value) op.selected = true;
    s.appendChild(op);
  });
  return s;
}
/* ONE FORM, TWO JOBS. Writing something new and correcting something already
   written ask for the same fields, so they get the same form rather than two
   that can drift apart. What changes is where the answer goes: a new writing
   is appended to the store, an edit to a live note rewrites it in place, and an
   edit to an original is DECLARED as an override beside the locked corpus. */
function openForm(migId, editing){
  var M = getModel();
  pending = { mig: migId, rels: [] };
  formIn.innerHTML = '';

  var region = (M.migs.filter(function(x){ return x.id === migId; })[0]) || {label:migId};
  var isOriginal = editing && !liveNoteIds()[editing.id];
  if(editing){
    formIn.appendChild(el('h2', null, 'Editing ' + editing.label));
    formIn.appendChild(el('p','ed-sub', isOriginal
      ? 'One of the originals. The source document is never rewritten \u2014 your change is recorded beside it and laid over the top, so the original text survives.'
      : 'A note you wrote. Saving rewrites it where it stands.'));
  } else {
    formIn.appendChild(el('h2', null, 'A new note in ' + region.label));
    /* the oldest empty star in this region is the one it will take */
    var vacancies = M.nodes.filter(function(n){ return n.vacant && n.mig === migId; })
      .sort(function(a,b){ return String(a.retiredAt||"") < String(b.retiredAt||"") ? -1 : 1; });
    pending.takes = vacancies.length ? vacancies[0].id : null;
    formIn.appendChild(el('p','ed-sub', pending.takes
      ? 'It takes the star that has been empty longest in this region.'
      : 'It joins the constellation as an object of its own, owned by this region.'));
  }

  var errBox = el('div'); formIn.appendChild(errBox);

  var fType = select(TYPES, 'thought', TYPE_HELP);
  var fLabel = el('input'); fLabel.type = 'text';
  fLabel.placeholder = 'The title, as it appears in the mind';
  var fId = el('input'); fId.type = 'text'; fId.className = 'mono';
  var fRegister = el('input'); fRegister.type = 'text'; fRegister.className = 'mono';
  fRegister.setAttribute('list','edRegisters');
  fRegister.placeholder = 'e.g. observation, or "joke — not a belief"';
  var dl = el('datalist'); dl.id = 'edRegisters';
  M.registers.forEach(function(r){ var o = el('option'); o.value = r; dl.appendChild(o); });
  var fSrc = el('input'); fSrc.type = 'text'; fSrc.className = 'mono';
  fSrc.value = 'Live note';
  var fLine = el('textarea');
  fLine.placeholder = 'What you actually want to say.';

  /* the id follows the title until the moment it is edited by hand, after
     which it is left alone — an id that kept rewriting itself under the
     cursor would be unusable */
  var idTouched = false;
  fId.oninput = function(){ idTouched = true; };
  fLabel.oninput = function(){
    fLabel.value = fLabel.value.toUpperCase();
    if(!idTouched) fId.value = 'n-' + slug(fLabel.value);
  };

  formIn.appendChild(field('Kind', 'what sort of statement this is', fType));
  formIn.appendChild(field('Title', 'uppercase, as everything in the mind is', fLabel));
  formIn.appendChild(field('The writing', 'the material itself', fLine));
  formIn.appendChild(field('Register',
    'so a joke can never be read as a conviction. A disclaimer after an em-dash is doing safety work.',
    fRegister));
  formIn.appendChild(field('Provenance',
    'an absent source would say "not his writing", which of a live note would be untrue', fSrc));
  formIn.appendChild(dl);

  /* crossings */
  var chips = el('div','ed-chips');
  M.migs.forEach(function(m){
    if(m.id === migId) return;
    var lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.value = m.id;
    cb.onchange = function(){ lab.className = cb.checked ? 'on' : ''; };
    lab.appendChild(cb); lab.appendChild(el('span', null, m.label));
    chips.appendChild(lab);
  });
  formIn.appendChild(field('Crosses into',
    'other regions this reaches. It surfaces after a selection, never in the opening view.', chips));

  formIn.appendChild(field('Reference', 'the id it is filed under; derived from the title', fId));

  /* relationships */
  var relWrap = el('div');
  var addRel = el('button','drop','+ relationship'); addRel.type = 'button';
  addRel.style.cssText = 'margin-bottom:14px';
  addRel.onclick = function(){ relWrap.appendChild(relRow(M)); };
  formIn.appendChild(field('Relationships',
    'a relationship is a claim with a direction. The gloss says why it exists, in at least ' +
    GLOSS_MIN + ' characters.', relWrap));
  formIn.appendChild(addRel);

  var act = el('div','ed-act');
  var save = el('button', null, 'Publish'); save.id = 'edSave'; save.type = 'button';
  var cancel = el('button', null, 'Cancel'); cancel.id = 'edCancel'; cancel.type = 'button';
  cancel.onclick = closeForm;
  act.appendChild(save); act.appendChild(cancel);
  var note = el('span','ed-small', 'Publishing commits to ' + CFG.owner + '/' + CFG.repo + '.');
  act.appendChild(note);
  formIn.appendChild(act);

  save.onclick = function(){
    var crosses = [].slice.call(chips.querySelectorAll('input:checked')).map(function(c){ return c.value; });
    var rels = [].slice.call(relWrap.children).map(function(r){
      return { to: r.querySelector('.rel-to').value,
               verb: r.querySelector('.rel-verb').value.trim(),
               gloss: r.querySelector('.rel-gloss').value.trim() };
    });
    var note2 = {
      id: editing ? editing.id : fId.value.trim(), t: fType.value, label: fLabel.value.trim(),
      mig: migId, crosses: crosses,
      register: fRegister.value.trim(), src: fSrc.value.trim(),
      line: fLine.value.trim(), added: new Date().toISOString().slice(0,10)
    };
    if(pending.takes) note2.takes = pending.takes;
    /* an id that already exists is a collision when writing something new and
       simply the subject when editing, so the check is told which it is */
    var problems = validate(note2, rels, M, editing ? editing.id : null);
    errBox.innerHTML = '';
    if(problems.length){
      var e = el('div','ed-err');
      e.appendChild(el('b', null, problems.length + ' thing' + (problems.length>1?'s':'') + ' to fix'));
      problems.forEach(function(p){ e.appendChild(el('div', null, '· ' + p)); });
      errBox.appendChild(e);
      errBox.scrollIntoView({behavior:'smooth', block:'nearest'});
      return;
    }
    save.disabled = true; save.textContent = editing ? "Saving\u2026" : "Publishing\u2026";
    if(editing){
      saveEdit(editing, {
        label: note2.label, line: note2.line, register: note2.register,
        crosses: note2.crosses, src: note2.src
      }, function(err){
        errBox.innerHTML = "";
        if(err){
          save.disabled = false; save.textContent = "Save changes";
          var bx = el("div","ed-err");
          bx.appendChild(el("b", null, "Nothing was saved"));
          bx.appendChild(el("div", null, err));
          errBox.appendChild(bx);
          return;
        }
        var ok2 = el("div","ed-ok");
        ok2.appendChild(el("div", null, "Saved. " + note2.label + " is updated in the repository."));
        ok2.appendChild(el("div", null, "It appears on the site once the build finishes."));
        errBox.appendChild(ok2);
        save.textContent = "Saved";
        window.scrollTo({top:0, behavior:"smooth"});
      });
      return;
    }
    publish(note2, rels).then(function(res){
      errBox.innerHTML = '';
      var ok = el('div','ed-ok');
      ok.appendChild(el('div', null, 'Published. ' + note2.label + ' is in the repository.'));
      var a = el('a', null, 'View the commit');
      a.href = res.commit.html_url; a.target = '_blank'; a.rel = 'noopener';
      ok.appendChild(a);
      ok.appendChild(el('div', null,
        'It appears on the site once the build finishes and Pages redeploys.'));
      errBox.appendChild(ok);
      save.textContent = 'Published';
      window.scrollTo({top:0, behavior:'smooth'});
    }).catch(function(e){
      save.disabled = false; save.textContent = 'Publish';
      var box = el('div','ed-err');
      box.appendChild(el('b', null, 'Nothing was published'));
      box.appendChild(el('div', null, e.message));
      errBox.appendChild(box);
    });
  };

  /* PRE-FILLED FROM WHAT IS ON THE PAGE, not from a copy kept here. The values
     come through model(), so the form always opens showing what a reader is
     actually seeing - including a correction made earlier. */
  if(editing){
    fType.value = editing.t || "thought";
    fLabel.value = editing.label || "";
    fLine.value = editing.line || "";
    fRegister.value = editing.register || "";
    fSrc.value = editing.src || "Live note";
    fId.value = editing.id;
    fId.disabled = true;
    (editing.crosses || []).forEach(function(c){
      var cb = chips.querySelector('input[value="' + c + '"]');
      if(cb){ cb.checked = true; cb.onchange(); }
    });
    save.textContent = "Save changes";
  }
  form.classList.add('open');
  fLabel.focus();
}
function relRow(M){
  var r = el('div','ed-rel');
  var row1 = el('div','row');
  var to = el('select'); to.className = 'rel-to';
  M.nodes.slice().sort(function(a,b){ return a.label < b.label ? -1 : 1; }).forEach(function(n){
    var o = el('option', null, n.label + '  (' + n.t + ')'); o.value = n.id; to.appendChild(o);
  });
  var verb = el('input'); verb.type = 'text'; verb.className = 'rel-verb mono';
  verb.placeholder = 'verb — interrogates, complicates, evolved into…';
  row1.appendChild(verb); row1.appendChild(to);
  var drop = el('button','drop','remove'); drop.type = 'button';
  drop.onclick = function(){ r.remove(); };
  row1.appendChild(drop);
  var gloss = el('textarea'); gloss.className = 'rel-gloss';
  gloss.style.minHeight = '64px';
  gloss.placeholder = 'Why this relationship exists.';
  r.appendChild(row1); r.appendChild(gloss);
  return r;
}
function closeForm(){ form.classList.remove('open'); pending = null; }

/* ── the same rules as tools/notescheck.js ─────────────────────────────── */
function validate(n, rels, M, editingId){
  /* when editing, the writing's own id is not a collision - it is the subject */
  var p = [];
  var ids = {}; M.nodes.forEach(function(x){ ids[x.id] = true; });
  var migs = {}; M.migs.forEach(function(x){ migs[x.id] = true; });

  if(!/^[a-z0-9][a-z0-9-]*$/.test(n.id)) p.push('The reference must be a lowercase slug.');
  else if(ids[n.id] && n.id !== editingId) p.push('The reference "' + n.id + '" already exists in the mind — it would be silently dropped.');
  if(TYPES.indexOf(n.t) < 0) p.push('Unknown kind.');
  if(!n.label) p.push('A title is required.');
  else if(n.label !== n.label.toUpperCase()) p.push('The title must be uppercase.');
  if(!n.register) p.push('A register is required — it is what stops a joke being read as a conviction.');
  if(!n.src) p.push('Provenance is required. An absent source means "not his writing".');
  if(!n.line) p.push('A note with no material is not a note.');
  if(!migs[n.mig]) p.push('That region does not exist.');
  n.crosses.forEach(function(c){
    if(!migs[c]) p.push('Crosses a region that does not exist: ' + c);
    if(c === n.mig) p.push('It cannot cross into its own region.');
  });

  var pairs = {};
  rels.forEach(function(r, i){
    var at = 'Relationship ' + (i+1) + ': ';
    if(!r.to || !ids[r.to]) p.push(at + 'points at nothing.');
    if(r.to === n.id) p.push(at + 'is a self-loop.');
    if(!r.verb) p.push(at + 'needs a verb.');
    else if(/^related to$/i.test(r.verb)) p.push(at + 'the verb must be semantic — "related to" says nothing.');
    if(!r.gloss || r.gloss.length < GLOSS_MIN)
      p.push(at + 'the gloss must be at least ' + GLOSS_MIN + ' characters; it answers why the edge exists.');
    if(pairs[r.to]) p.push(at + 'the same pair appears twice.');
    pairs[r.to] = true;
  });
  return p;
}

/* ── ONE WAY IN AND OUT OF THE STORE ───────────────────────────────────────
   Every change - a new writing, an edit, a deletion - is the same operation:
   read the file, hand it to a function that changes it, write it back with the
   sha we actually read. The sha is the concurrency check, so two devices
   editing at once cannot silently discard one another.

   Passing a FUNCTION rather than a finished document matters: the change is
   applied to whatever is on the server right now, not to a copy this browser
   loaded some minutes ago. */
function commit(message, change){
  var path = "/repos/" + CFG.owner + "/" + CFG.repo + "/contents/" + CFG.path;
  return gh(path + "?ref=" + encodeURIComponent(CFG.branch)).then(function(file){
    var store;
    try { store = JSON.parse(unb64(file.content)); }
    catch(e){ throw new Error("The store in the repository is not valid JSON; nothing was changed."); }
    store.notes   = store.notes   || [];
    store.minors  = store.minors  || [];
    store.edges   = store.edges   || [];
    store.retired = store.retired || [];
    store.edits   = store.edits   || {};
    change(store);
    return gh(path, {
      method: "PUT",
      body: JSON.stringify({
        message: message,
        content: b64(JSON.stringify(store, null, 2) + "\n"),
        sha: file.sha,
        branch: CFG.branch
      })
    });
  }).catch(function(e){
    if(e.status === 409 || /does not match/i.test(e.message || ""))
      throw new Error("The store changed while you were working. Reload and try again.");
    if(e.status === 404)
      throw new Error("Could not find " + CFG.path + " on " + CFG.branch + ".");
    throw e;
  });
}

/* DELETION IS A LINE ADDED, NOT A LINE REMOVED. Nothing is cut out of the
   store or out of preview.html: the id is recorded as retired, with the date
   that decides which vacancy is oldest, and the build blanks the node in place
   so its star keeps burning. Deleting the retirement brings the writing back. */
function retire(node, done){
  commit("Retire: " + node.label, function(store){
    if(store.retired.some(function(r){ return r.id === node.id; })) return;
    store.retired.push({ id: node.id, at: new Date().toISOString().slice(0,10) });
  }).then(function(){ done(null); reloadSoon(); })
    .catch(function(e){ done(e.message); });
}

/* AN EDIT TO A LIVE NOTE REWRITES IT; AN EDIT TO AN ORIGINAL IS AN OVERRIDE.
   The corpus is locked, so a correction to something extracted from the source
   documents is DECLARED beside it rather than performed on it - the original
   text stays where it was and the page renders it with the correction laid
   over. Same principle as V02_OVERLAY, for the same reason. */
function saveEdit(node, fields, done){
  var live = !!liveNoteIds()[node.id];
  commit((live ? "Edit: " : "Correct: ") + (fields.label || node.label), function(store){
    if(live){
      for(var i=0;i<store.notes.length;i++)
        if(store.notes[i].id === node.id){
          Object.keys(fields).forEach(function(k){ store.notes[i][k] = fields[k]; });
          return;
        }
      throw new Error("That note is not in the store any more.");
    }
    store.edits[node.id] = Object.assign(store.edits[node.id] || {}, fields);
  }).then(function(){ done(null); reloadSoon(); })
    .catch(function(e){ done(e.message); });
}

/* the page is built from the store, so the honest way to show a change is to
   let the build produce it - until then the page in front of you is stale */
function reloadSoon(){
  say("Committed. The site rebuilds in about a minute; reload then to see it.");
}
function say(msg){
  var b = document.getElementById("edBar");
  if(b) b.title = msg;
  console.log("[editor] " + msg);
}

/* ── publish ───────────────────────────────────────────────────────────── */
function publish(note, rels){
  var path = '/repos/' + CFG.owner + '/' + CFG.repo + '/contents/' + CFG.path;
  return gh(path + '?ref=' + encodeURIComponent(CFG.branch)).then(function(file){
    var store;
    try{ store = JSON.parse(unb64(file.content)); }
    catch(e){ throw new Error('The store in the repository is not valid JSON; nothing was changed.'); }
    store.notes = store.notes || [];
    store.minors = store.minors || [];
    store.edges = store.edges || [];
    if(store.notes.some(function(x){ return x.id === note.id; }))
      throw new Error('A note with the reference "' + note.id + '" is already published.');
    store.notes.push(note);
    rels.forEach(function(r){ store.edges.push([note.id, r.to, r.verb, r.gloss]); });

    /* THE SHA IS THE CONCURRENCY CHECK. Passing the sha we actually read means
       GitHub refuses the write if the file changed underneath us, so two
       devices writing at once cannot silently discard one another's note. */
    return gh(path, {
      method:'PUT',
      body: JSON.stringify({
        message: 'Note: ' + note.label,
        content: b64(JSON.stringify(store, null, 2) + '\n'),
        sha: file.sha,
        branch: CFG.branch
      })
    });
  }).catch(function(e){
    if(e.status === 409 || /does not match/i.test(e.message || ''))
      throw new Error('The store changed while you were writing. Reload and add it again.');
    if(e.status === 404)
      throw new Error('Could not find ' + CFG.path + ' on ' + CFG.branch +
                      ' — is the repository pushed yet?');
    throw e;
  });
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function boot(){
  var s = document.createElement('style'); s.textContent = CSS;
  document.head.appendChild(s);

  form = el('div'); form.id = 'edForm';
  formIn = el('div','ed-in'); form.appendChild(formIn);
  document.body.appendChild(form);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && form.classList.contains('open')) closeForm();
  });

  ask = el("div"); ask.id = "edAsk";
  askIn = el("div"); ask.appendChild(askIn);
  document.body.appendChild(ask);
  ask.addEventListener("click", function(e){ if(e.target === ask) ask.classList.remove("open"); });

  buildBar();
  try{ token = localStorage.getItem(KEY); }catch(_){}
  if(!completeOAuth() && token) identify();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
