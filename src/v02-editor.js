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
'.ed-row{display:flex;gap:5px;justify-content:flex-end;padding:0 2px 10px}',
'.wk-toc .ed-row{padding:0 0 14px}',
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
  /* the harness takes the same two arguments the edit control passes, so a
     check drives the form the way the page does rather than a simpler version
     of it - the first attempt to test edit mode through here opened the NEW
     note form and looked like a broken feature. */
  /* FORWARDS EVERYTHING, deliberately. This took two arguments where the
     page passed three, so driving it through the harness opened the writing
     form while the button opened the concept form - a check exercising a
     simpler thing than the page does, which is how the last one hid a bug
     rather than finding one. Apply the arguments rather than naming them, and
     it cannot fall behind the call again. */
  open: function(){ return openForm.apply(null, arguments); },
  validate: function(n, rels){ return validate(n, rels, getModel()); },
  authorised: function(){ return authorised(); },
  who: function(){ return me ? me.login : null; },

  /* every work, written or not, gets a way in from the contents page */
  paintWorks: function(list){
    if(!authorised()) return;
    var W = window.__v02 && window.__v02.works;
    var written = W ? W.written() : [];
    [].forEach.call(list.querySelectorAll("[data-sheet]"), function(btn){
      var id = btn.getAttribute("data-sheet");
      var bar = el("div", "ed-row");
      var b = el("button", null, written.indexOf(id) >= 0 ? "edit sheet" : "write sheet");
      b.type = "button";
      b.onclick = function(e){ e.stopPropagation(); openWorksForm(id); };
      bar.appendChild(b);
      (btn.parentNode || btn).appendChild(bar);
    });
  },

  worksForm: function(id){ openWorksForm(id); },
  topicForm: function(id){ openTopicForm(id); },

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
      /* CONCEPTS GET THE SAME TWO CONTROLS. They are structure rather than
         prose, so the form they open asks fewer questions - but a concept is
         as much his as a writing is, and there is no reason one may be
         corrected and the other not. */
      if(!n || n.t === 'mig' || n.vacant) return;
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
      /* BESIDE THE ROW, NEVER INSIDE IT. These went inside the row's own
         button first, which puts a button inside a button - invalid, and a
         thing browsers are entitled to reshuffle or drop. The row's parent is
         a list item and has no such problem, so the controls go there and the
         row stays a plain button that navigates. */
      (btn.parentNode || btn).appendChild(bar);
    });

    var vac = M.nodes.filter(function(n){ return n.vacant && n.mig === migId; }).length;
    /* counted by kind, because a writing and a concept cannot take each
       other's star and it would be a lie to offer one the other's vacancy */
    var vacW = M.nodes.filter(function(n){ return n.vacant && n.mig === migId && n.t !== "minor"; }).length;
    var vacC = M.nodes.filter(function(n){ return n.vacant && n.mig === migId && n.t === "minor"; }).length;

    var b = el('button','ed-add','+ Add a writing' +
              (vacW ? "   \u00b7   " + vacW + " empty star" + (vacW>1?"s":"") + " waiting" : ""));
    b.type = 'button';
    b.onclick = function(){ openForm(migId); };
    groups.appendChild(b);

    var c = el('button','ed-add','+ Add a concept' +
              (vacC ? "   \u00b7   " + vacC + " empty star" + (vacC>1?"s":"") + " waiting" : ""));
    c.type = 'button';
    c.onclick = function(){ openForm(migId, null, true); };
    groups.appendChild(c);

    var t = el('button','ed-add','\u270e  Edit what ' + m.label + ' is');
    t.type = 'button';
    t.onclick = function(){ openTopicForm(migId); };
    groups.appendChild(t);
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
  if(node.t === "minor")
    box.appendChild(el("p", null, "A concept \u2014 one of the ideas this topic is built out of, " +
      "rather than something written."));

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
  /* WHAT A CONCEPT LEAVES BEHIND IS NOT WHAT A WRITING LEAVES BEHIND, and the
     sheet must not promise otherwise. A writing's empty star is claimed by the
     next writing added to that region. A concept's is not: concepts and
     writings are placed by different rules - in a planetary region the concepts
     take the orbits and the writings hang off them - so handing a concept's
     orbit to a writing would put the wrong kind of body in it.

     So a retired concept leaves a star that stays empty until another concept
     takes it, and the editor cannot yet add one. Saying so here is better than
     letting the sheet imply a reuse that will not come. */
  var isMinor = node.t === "minor";
  var keeps = el("div", "keeps");
  keeps.appendChild(el("div", null, "Its star stays lit where it is, carrying nothing."));
  keeps.appendChild(el("div", null, isMinor
    ? "That star waits for another concept \u2014 a writing cannot take it."
    : "The next writing you add here takes that star."));
  keeps.appendChild(el("div", null, "Its connections go with it."));
  keeps.appendChild(el("div", null, "Nothing is destroyed \u2014 this is reversible."));
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
function openForm(migId, editing, asConcept){
  var M = getModel();
  pending = { mig: migId, rels: [] };
  formIn.innerHTML = '';

  var region = (M.migs.filter(function(x){ return x.id === migId; })[0]) || {label:migId};
  var isOriginal = editing && !liveNoteIds()[editing.id];
  /* A CONCEPT HAS NO PROSE AND NO PROVENANCE. It is a name and the regions it
     reaches, and CONTENT-MODEL.md is explicit that it carries no src - that
     absence is the honesty signal saying the words are not his. Offering the
     writing fields for one would invite exactly the claim the absence denies. */
  var isConcept = asConcept || (editing && editing.t === 'minor');
  if(editing){
    formIn.appendChild(el('h2', null, 'Editing ' + editing.label));
    formIn.appendChild(el('p','ed-sub', isOriginal
      ? 'One of the originals. The source document is never rewritten \u2014 your change is recorded beside it and laid over the top, so the original text survives.'
      : 'A note you wrote. Saving rewrites it where it stands.'));
  } else {
    formIn.appendChild(el('h2', null, (asConcept ? 'A new concept in ' : 'A new note in ') + region.label));
    /* THE OLDEST EMPTY STAR OF THE RIGHT KIND. A concept may only take a
       concept's star and a writing only a writing's, because the two are
       placed by different rules - so the vacancies are filtered by kind before
       the oldest is chosen. */
    var vacancies = M.nodes.filter(function(n){
        return n.vacant && n.mig === migId &&
               (asConcept ? n.t === "minor" : n.t !== "minor");
      })
      .sort(function(a,b){ return String(a.retiredAt||"") < String(b.retiredAt||"") ? -1 : 1; });
    pending.takes = vacancies.length ? vacancies[0].id : null;
    formIn.appendChild(el('p','ed-sub', pending.takes
      ? 'It takes the ' + (asConcept ? 'concept' : 'writing') + ' star that has been empty longest here.'
      : (asConcept
          ? 'A new idea this topic is built out of. It joins as a body of its own.'
          : 'It joins the constellation as an object of its own, owned by this topic.')));
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

  /* A CONCEPT IS ASKED FOR LESS, because a concept HAS less. It is a name and
     the regions it reaches. It has no kind, no prose and no provenance, and the
     absence of provenance is load-bearing: CONTENT-MODEL.md says a concept
     carries no src precisely so the page can tell his words from the file's
     scaffolding. A form offering those fields would invite the claim that
     absence exists to deny. */
  if(!isConcept){
    formIn.appendChild(field('Kind', 'what sort of statement this is', fType));
  }
  formIn.appendChild(field('Title', 'uppercase, as everything in the mind is', fLabel));
  if(!isConcept){
    formIn.appendChild(field('The writing', 'the material itself', fLine));
    formIn.appendChild(field('Register',
      'so a joke can never be read as a conviction. A disclaimer after an em-dash is doing safety work.',
      fRegister));
    formIn.appendChild(field('Provenance',
      'an absent source would say "not his writing", which of a live note would be untrue', fSrc));
    formIn.appendChild(dl);
  }

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

  /* DELETE LIVES HERE TOO, not only on the row. By the time a writing is open
     you are already looking at the whole of it - the title, the material, what
     it crosses into - which is a far better place to decide it should go than
     a one-line row in a list. It is the same confirmation either way, and it
     is set apart from Save so the two are never reached for by accident. */
  if(editing){
    var del = el("button", null, isConcept ? "Delete this concept" : "Delete this writing");
    del.type = "button";
    del.style.cssText = "margin-left:auto;color:#c98b8b;background:none;" +
      "border:1px solid #4a2a2a;border-radius:3px;font:11px/1 ui-monospace,monospace;" +
      "letter-spacing:.12em;text-transform:uppercase;padding:12px 18px;cursor:pointer";
    del.onclick = function(){
      confirmDelete(editing, function(done){
        retire(editing, function(err){
          done(err);
          if(!err){
            closeForm();
            if(window.__v02 && window.__v02.repaint) window.__v02.repaint();
          }
        });
      });
    };
    act.appendChild(del);
  }

  var note = el('span','ed-small', editing
    ? 'Saving commits to ' + CFG.owner + '/' + CFG.repo + '.'
    : 'Publishing commits to ' + CFG.owner + '/' + CFG.repo + '.');
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
    if(isConcept) note2.isConcept = true;   // read by validate, never stored
    /* an id that already exists is a collision when writing something new and
       simply the subject when editing, so the check is told which it is */
    var problems = validate(note2, rels, M, editing ? editing.id : null);
    /* it was set for the validator and must not travel any further: nothing in
       the store has an isConcept field, and a stray one would be a field the
       schema does not know and the checker would rightly refuse. */
    delete note2.isConcept;
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
    if(!editing && isConcept){
      save.disabled = true; save.textContent = "Publishing\u2026";
      var concept = { id: note2.id, label: note2.label, mig: migId, crosses: note2.crosses };
      if(pending.takes) concept.takes = pending.takes;
      commit("Concept: " + concept.label, function(store){
        if(store.minors.some(function(x){ return x.id === concept.id; }))
          throw new Error("A concept with the reference \"" + concept.id + "\" is already published.");
        store.minors.push(concept);
        rels.forEach(function(r){ store.edges.push([concept.id, r.to, r.verb, r.gloss]); });
      }).then(function(){
        errBox.innerHTML = "";
        var ok3 = el("div","ed-ok");
        ok3.appendChild(el("div", null, "Published. " + concept.label + " is in the repository."));
        ok3.appendChild(el("div", null, "It appears on the site once the build finishes."));
        errBox.appendChild(ok3);
        save.textContent = "Published";
        window.scrollTo({top:0, behavior:"smooth"});
      }).catch(function(e){
        save.disabled = false; save.textContent = "Publish";
        var bx3 = el("div","ed-err");
        bx3.appendChild(el("b", null, "Nothing was published"));
        bx3.appendChild(el("div", null, e.message));
        errBox.appendChild(bx3);
      });
      return;
    }
    if(editing){
      saveEdit(editing, isConcept
        ? { label: note2.label, crosses: note2.crosses }
        : { label: note2.label, line: note2.line, register: note2.register,
            crosses: note2.crosses, src: note2.src },
        function(err){
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
  /* a concept answers for none of these, and requiring them would make it
     impossible to correct the name of one */
  if(!n.isConcept){
    if(!n.register) p.push('A register is required — it is what stops a joke being read as a conviction.');
    if(!n.src) p.push('Provenance is required. An absent source means "not his writing".');
    if(!n.line) p.push('A note with no material is not a note.');
  }
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
function commit(message, change){ return commitTo(CFG.path, message, change); }

/* THE SAME ONE PATH SERVES BOTH STORES. The manual lives in data/works.json
   and the notes in data/notes.json, and there is no reason for two ways to
   read-change-write a file - the sha check, the conflict message and the
   apply-to-what-is-there-now behaviour all matter equally to both. */
function commitTo(file, message, change){
  var path = "/repos/" + CFG.owner + "/" + CFG.repo + "/contents/" + file;
  return gh(path + "?ref=" + encodeURIComponent(CFG.branch)).then(function(file){
    var store;
    try { store = JSON.parse(unb64(file.content)); }
    catch(e){ throw new Error("The store in the repository is not valid JSON; nothing was changed."); }
    if(file === CFG.path){
      store.notes   = store.notes   || [];
      store.minors  = store.minors  || [];
      store.edges   = store.edges   || [];
      store.retired = store.retired || [];
      store.edits   = store.edits   || {};
    }
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
      throw new Error("Could not find " + file + " on " + CFG.branch + ".");
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

/* ── THE SENTENCE A TOPIC OWNS ─────────────────────────────────────────────
   The line under a topic's name is the first prose anyone meets on arriving in
   it, and until now it was the only writing on this page that could be changed
   nowhere but in the corpus. It is an override like any other: the locked text
   stays, the correction is declared beside it. */
function openTopicForm(migId){
  var M = getModel();
  var mig = M.migs.filter(function(x){ return x.id === migId; })[0] || {id:migId, label:migId};
  var node = M.nodes.filter(function(n){ return n.id === migId; })[0] || {};
  formIn.innerHTML = "";
  formIn.appendChild(el("h2", null, "Editing " + mig.label));
  formIn.appendChild(el("p", "ed-sub",
    "The sentence a reader meets on arriving in this topic."));
  var errBox = el("div"); formIn.appendChild(errBox);

  var fLine = el("textarea");
  fLine.value = node.line || "";
  fLine.placeholder = "What this topic is, in your own words.";
  formIn.appendChild(field("Description", "shown under the name of the topic", fLine));

  var act = el("div", "ed-act");
  var save = el("button", null, "Save"); save.id = "edSave"; save.type = "button";
  var cancel = el("button", null, "Cancel"); cancel.id = "edCancel"; cancel.type = "button";
  cancel.onclick = closeForm;
  act.appendChild(save); act.appendChild(cancel);
  act.appendChild(el("span", "ed-small", "Saving commits to " + CFG.owner + "/" + CFG.repo + "."));
  formIn.appendChild(act);

  save.onclick = function(){
    var line = fLine.value.trim();
    errBox.innerHTML = "";
    if(!line){
      var e = el("div", "ed-err");
      e.appendChild(el("b", null, "Nothing to save"));
      e.appendChild(el("div", null, "A topic with no description says nothing about itself."));
      errBox.appendChild(e);
      return;
    }
    save.disabled = true; save.textContent = "Saving\u2026";
    commit("Topic: " + mig.label, function(store){
      store.edits[migId] = Object.assign(store.edits[migId] || {}, { line: line });
    }).then(function(){
      var ok = el("div", "ed-ok");
      ok.appendChild(el("div", null, "Saved. It appears once the build finishes."));
      errBox.appendChild(ok);
      save.textContent = "Saved";
    }).catch(function(err){
      save.disabled = false; save.textContent = "Save";
      var bx = el("div", "ed-err");
      bx.appendChild(el("b", null, "Nothing was saved"));
      bx.appendChild(el("div", null, err.message));
      errBox.appendChild(bx);
    });
  };

  form.classList.add("open");
  fLine.focus();
}

/* ── THE MANUAL ────────────────────────────────────────────────────────────
   MY WORKS is a different kind of writing and gets a different form. A sheet
   carries what a manual needs and the graph does not: purpose, parts,
   procedure, known failures.

   IT OFFERS NOTHING ELSE, AND THAT IS THE POINT. data/works.json states the
   rule in its own first line - a sheet may never restate label, line, src,
   state, register, mig or any relationship, because a second copy of those is
   a second truth. A form that offered those fields would be an invitation to
   create one. So the title, the sentence under it and everything about where
   the work sits in the mind are shown here as READ-ONLY context, derived live
   from the graph, and cannot be typed into.

   An unwritten sheet is a legitimate state, not a gap to be filled with
   plausible text - the manual stamps it NOT YET WRITTEN and says so. This form
   will happily leave it that way; it saves nothing until you write something.
*/
var WORKS_FILE = "data/works.json";
var worksStore = null;

function loadWorks(then){
  if(worksStore) return then(worksStore);
  gh("/repos/" + CFG.owner + "/" + CFG.repo + "/contents/" + WORKS_FILE +
     "?ref=" + encodeURIComponent(CFG.branch))
    .then(function(file){ worksStore = JSON.parse(unb64(file.content)); then(worksStore); })
    .catch(function(e){ alert("Could not read the manual: " + e.message); });
}

/* a repeatable block of rows, which is what three of these four fields are */
function rowsField(items, fields, addLabel){
  var wrap = el("div");
  function add(v){
    v = v || {};
    var r = el("div", "ed-rel");
    fields.forEach(function(f){
      var input = f.big ? el("textarea") : el("input");
      if(!f.big) input.type = "text";
      input.className = "wf-" + f.key;
      input.placeholder = f.placeholder || f.key;
      if(f.big) input.style.minHeight = "62px";
      input.value = v[f.key] == null ? "" : String(v[f.key]);
      r.appendChild(input);
    });
    var drop = el("button", "drop", "remove"); drop.type = "button";
    drop.onclick = function(){ r.remove(); };
    r.appendChild(drop);
    wrap.appendChild(r);
  }
  (items || []).forEach(add);
  var more = el("button", "drop", addLabel); more.type = "button";
  more.style.cssText = "margin-bottom:14px";
  more.onclick = function(){ add({}); };
  return { wrap: wrap, more: more,
    read: function(){
      return [].slice.call(wrap.children).map(function(r){
        var o = {};
        fields.forEach(function(f){ o[f.key] = r.querySelector(".wf-" + f.key).value.trim(); });
        return o;
      }).filter(function(o){ return fields.some(function(f){ return o[f.key]; }); });
    } };
}

function openWorksForm(nodeId){
  loadWorks(function(store){
    var W = window.__v02 && window.__v02.works;
    var node = W ? W.node(nodeId) : null;
    var sheet = (store.sheets || []).filter(function(x){ return x.node === nodeId; })[0] || null;
    formIn.innerHTML = "";

    formIn.appendChild(el("h2", null, (sheet ? "Editing the sheet for " : "Writing the sheet for ") +
                                     ((node && node.label) || nodeId)));
    formIn.appendChild(el("p", "ed-sub", sheet
      ? "A manual sheet. Everything the graph already says about this work is read from the graph."
      : "Not yet written. Leave it and it stays honestly blank."));

    var errBox = el("div"); formIn.appendChild(errBox);

    /* WHAT THE GRAPH ALREADY SAYS, shown so it is not retyped */
    if(node){
      var ctx = el("div", "keeps");
      ctx.style.cssText = "margin:0 0 26px;border-left:2px solid #2a3145;padding-left:12px";
      ctx.appendChild(el("div", null, "from the mind, not editable here:"));
      ctx.appendChild(el("div", null, "  " + (node.label || nodeId)));
      if(node.line) ctx.appendChild(el("div", null, "  " + node.line.slice(0, 120)));
      formIn.appendChild(ctx);
    }

    var fPurpose = el("textarea");
    fPurpose.value = sheet && sheet.purpose ? sheet.purpose : "";
    fPurpose.placeholder = "What this exists to do, and what it refuses to do.";
    formIn.appendChild(field("Purpose", "what the thing is for", fPurpose));

    var parts = rowsField(sheet && sheet.parts,
      [{key:"name", placeholder:"part name"},
       {key:"note", big:true, placeholder:"what it does, and what breaks without it"}],
      "+ part");
    formIn.appendChild(field("Parts", "numbered in the order you put them in", parts.wrap));
    formIn.appendChild(parts.more);

    var proc = rowsField((sheet && sheet.procedure || []).map(function(t){ return {step:t}; }),
      [{key:"step", big:true, placeholder:"one step"}], "+ step");
    formIn.appendChild(field("Procedure", "the steps, in order", proc.wrap));
    formIn.appendChild(proc.more);

    var fails = rowsField(sheet && sheet.knownFailures,
      [{key:"name", placeholder:"the failure"},
       {key:"note", big:true, placeholder:"how it happens, and what it costs"}],
      "+ known failure");
    formIn.appendChild(field("Known failures",
      "the ones you have actually seen. An empty list here claims the thing has never failed.",
      fails.wrap));
    formIn.appendChild(fails.more);

    var auth = rowsField((sheet && sheet.authority || []).map(function(t){ return {ref:t}; }),
      [{key:"ref", placeholder:"where this sheet's content came from"}], "+ source");
    formIn.appendChild(field("Authority",
      "what this sheet is drawn from, so a reader can check it", auth.wrap));
    formIn.appendChild(auth.more);

    var act = el("div", "ed-act");
    var save = el("button", null, sheet ? "Save the sheet" : "Write the sheet");
    save.id = "edSave"; save.type = "button";
    var cancel = el("button", null, "Cancel"); cancel.id = "edCancel"; cancel.type = "button";
    cancel.onclick = closeForm;
    act.appendChild(save); act.appendChild(cancel);
    act.appendChild(el("span", "ed-small", "Publishing commits to " + CFG.owner + "/" + CFG.repo + "."));
    formIn.appendChild(act);

    save.onclick = function(){
      var record = {
        node: nodeId,
        authority: auth.read().map(function(o){ return o.ref; }),
        purpose: fPurpose.value.trim(),
        parts: parts.read().map(function(o, i){ return { n: i + 1, name: o.name, note: o.note }; }),
        procedure: proc.read().map(function(o){ return o.step; }),
        knownFailures: fails.read()
      };
      if(sheet && sheet.figure) record.figure = sheet.figure;
      if(sheet && sheet.operable !== undefined) record.operable = sheet.operable;

      var problems = [];
      if(!record.purpose) problems.push("A sheet with no purpose is not a sheet. Say what the thing is for.");
      if(!record.parts.length) problems.push("List at least one part.");
      if(!record.procedure.length) problems.push("List at least one step.");
      record.parts.forEach(function(pt, i){
        if(!pt.name) problems.push("Part " + (i + 1) + " has no name.");
        if(!pt.note) problems.push("Part " + (i + 1) + " has no note saying what it does.");
      });
      record.knownFailures.forEach(function(kf, i){
        if(!kf.name || !kf.note) problems.push("Known failure " + (i + 1) + " needs both a name and a note.");
      });

      errBox.innerHTML = "";
      if(problems.length){
        var e = el("div", "ed-err");
        e.appendChild(el("b", null, problems.length + " thing" + (problems.length > 1 ? "s" : "") + " to fix"));
        problems.forEach(function(t){ e.appendChild(el("div", null, "\u00b7 " + t)); });
        errBox.appendChild(e);
        return;
      }

      save.disabled = true; save.textContent = "Saving\u2026";
      commitTo(WORKS_FILE, (sheet ? "Manual: " : "Manual, new sheet: ") + ((node && node.label) || nodeId),
        function(st){
          st.sheets = st.sheets || [];
          for(var i = 0; i < st.sheets.length; i++)
            if(st.sheets[i].node === nodeId){ st.sheets[i] = record; return; }
          st.sheets.push(record);
        })
        .then(function(){
          worksStore = null;
          errBox.innerHTML = "";
          var ok = el("div", "ed-ok");
          ok.appendChild(el("div", null, "Saved. The sheet is in the repository."));
          ok.appendChild(el("div", null, "It appears in the manual once the build finishes."));
          errBox.appendChild(ok);
          save.textContent = "Saved";
          window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(function(e){
          save.disabled = false; save.textContent = sheet ? "Save the sheet" : "Write the sheet";
          var bx = el("div", "ed-err");
          bx.appendChild(el("b", null, "Nothing was saved"));
          bx.appendChild(el("div", null, e.message));
          errBox.appendChild(bx);
        });
    };

    form.classList.add("open");
    fPurpose.focus();
  });
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
