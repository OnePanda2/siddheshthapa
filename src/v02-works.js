/* ── MY WORKS — THE MANUAL ────────────────────────────────────────────────

   Six sheets, one per thing built. Not a portfolio: a portfolio shows you the
   outside of a thing, a manual shows you how it works and what breaks.

   The content rule, from WORKS-MANUAL-SPEC §1, is the whole architecture:

     TIER 1  DERIVED   label, line, source, state, and every relationship —
                       read from the graph by node id, never restated here.
     TIER 2  DECLARED  purpose, parts, procedure, known failures — authored in
                       data/works.json and injected below.
     TIER 3  FORBIDDEN everything else.

   So this file renders; it does not know any content. A work with no Tier-2
   record is a numbered, titled sheet stamped NOT YET WRITTEN — which is a
   legitimate state and is never padded out with plausible text.

   Runs inside the app's IIFE, after the app, so byId / LINKS / travelTo /
   enterMind / invalidate are all in scope.
   ──────────────────────────────────────────────────────────────────────── */
var WORKS_DATA = /*__WORKSDATA__*/;

/* ── the six, from the graph ───────────────────────────────────────────────
   Membership is derived, never listed: everything the graph files under
   my-works that is not the region itself and not one of its concepts. Add a
   seventh work to the graph and the manual grows a seventh sheet. */
var WORK_NODES = NODES.filter(function(n){
  return n.mig === 'my-works' && n.t !== 'mig' && n.t !== 'minor';
});

var WORKS_BY_NODE = {};
(WORKS_DATA.sheets || []).forEach(function(sh){ WORKS_BY_NODE[sh.node] = sh; });

/* Documented sheets first, reserved ones last — an appendix, not a gap in the
   middle. Within each group the graph's own order is kept. */
var SHEETS = WORK_NODES.slice().sort(function(a, b){
  var ka = WORKS_BY_NODE[a.id] ? 0 : 1, kb = WORKS_BY_NODE[b.id] ? 0 : 1;
  return ka - kb;
});

/* ── the figures ───────────────────────────────────────────────────────────
   Orthographic, part-numbered, no perspective and no colour but the spot red.
   A figure's part numbers must match its sheet's parts[].n one for one; that
   is asserted rather than trusted, because a drawing that has drifted from its
   parts list is a defect and not a variation. */
var FIGURES = {
  'diagnostic-before-generation': {
    caption: 'Fig. 1.1 — the diagnostic stands before the generator',
    parts: [1, 2, 3, 4],
    svg: [
      '<svg class="wk-svg" viewBox="0 0 660 200" role="img" aria-label="Exploded view: trigger, diagnostic, level estimate, course. The diagnostic sits between the request and anything being generated.">',
      '<g class="part p1">',
      '<rect x="14" y="78" width="118" height="44" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="73" y="98" text-anchor="middle" font-size="10" fill="#1a1d1f">TRIGGER</text>',
      '<text x="73" y="112" text-anchor="middle" font-size="8.5" fill="#5e6367">+ topic</text>',
      '<text x="14" y="70" font-size="9" fill="#9a2a1f">01</text></g>',
      '<path class="lead" d="M132 100 L172 100" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3"></path>',
      '<g class="part p2">',
      '<rect x="172" y="66" width="140" height="68" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="242" y="88" text-anchor="middle" font-size="10" fill="#1a1d1f">DIAGNOSTIC</text>',
      '<text x="242" y="103" text-anchor="middle" font-size="8.5" fill="#5e6367">closed questions</text>',
      '<text x="242" y="117" text-anchor="middle" font-size="8.5" fill="#5e6367">only</text>',
      '<text x="172" y="58" font-size="9" fill="#9a2a1f">02</text></g>',
      '<path class="lead" d="M312 100 L352 100" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3"></path>',
      '<g class="part p3">',
      '<rect x="352" y="72" width="126" height="56" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="415" y="92" text-anchor="middle" font-size="10" fill="#1a1d1f">LEVEL</text>',
      '<text x="415" y="107" text-anchor="middle" font-size="8.5" fill="#5e6367">1 of 5 bands</text>',
      '<text x="352" y="64" font-size="9" fill="#9a2a1f">03</text></g>',
      '<path class="lead" d="M478 100 L518 100" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3"></path>',
      '<g class="part p4">',
      '<rect x="518" y="66" width="128" height="68" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="582" y="88" text-anchor="middle" font-size="10" fill="#1a1d1f">COURSE</text>',
      '<text x="582" y="103" text-anchor="middle" font-size="8.5" fill="#5e6367">starts at the band,</text>',
      '<text x="582" y="116" text-anchor="middle" font-size="8.5" fill="#5e6367">not at zero</text>',
      '<text x="518" y="58" font-size="9" fill="#9a2a1f">04</text></g>',
      '<line x1="14" y1="168" x2="646" y2="168" stroke="#b9bcb6" stroke-width="1"></line>',
      '</svg>'
    ].join('')
  }
};

/* ── the operable part ─────────────────────────────────────────────────────
   COTSI's argument is that a course should start where the student is, and
   the cheapest way to make that argument is to let it happen to the visitor.
   Three closed questions, and the milestones they already hold are struck
   through rather than taught. The questions are about the skill's own
   subject, so answering them is not a quiz about Siddhesh. */
var DIAGNOSTIC = {
  questions: [
    'Have you written a prompt that changes its own behaviour based on the answer to an earlier question?',
    'Do you know what happens when a set of instructions contradicts the request it was given?',
    'Have you published something other people use without you being there to explain it?'
  ],
  bands: ['beginner', 'familiar', 'intermediate', 'advanced'],
  course: [
    'What a skill is, and why a prompt is not one',
    'Triggering — when the instruction should be reached for',
    'Branching on what the person already knows',
    'Failure modes, and writing the rules that prevent them',
    'Publishing something a stranger can run'
  ]
};

/* ── DOM ──────────────────────────────────────────────────────────────── */
var wkLayer   = document.getElementById('works');
var wkBody    = document.getElementById('wkBody');
var wkClose   = document.getElementById('wkClose');
var wkIndex   = document.getElementById('wkIndex');
var wkRunning = document.getElementById('wkRunning');

var wkView = null;          /* null = shut · 'contents' · a node id */
var wkReturnFocus = null;

function el(tag, cls, txt){
  var e = document.createElement(tag);
  if(cls) e.className = cls;
  if(txt !== undefined && txt !== null) e.textContent = txt;
  return e;
}

/* every relationship this work actually has, in the graph's own words */
function seeAlso(id){
  var out = [];
  LINKS.forEach(function(l){
    var other = l.a === id ? l.b : (l.b === id ? l.a : null);
    if(!other || !byId[other]) return;
    out.push({ id:other, node:byId[other], verb:l.verb, gloss:l.gloss, outbound:l.a === id });
  });
  return out;
}

/* ── the contents page ─────────────────────────────────────────────────── */
function renderContents(){
  wkView = 'contents';
  wkBody.innerHTML = '';
  wkIndex.hidden = true;
  wkRunning.textContent = 'My works — the manual';

  var lede = el('p', 'wk-lede');
  var written = SHEETS.filter(function(n){ return WORKS_BY_NODE[n.id]; }).length;
  lede.textContent = 'Six things built, and the manual for each: what it is for, ' +
    'what it is made of, how it runs, and what is known to break. ' +
    written + ' of ' + SHEETS.length + ' sheets are written. ' +
    'The rest are reserved — listed, numbered, and left blank until there is ' +
    'something true to put on them.';
  wkBody.appendChild(lede);

  var ol = el('ul', 'wk-toc');
  SHEETS.forEach(function(n, i){
    var has = !!WORKS_BY_NODE[n.id];
    var li = el('li');
    var b = el('button');
    b.type = 'button';
    b.setAttribute('data-sheet', n.id);
    b.appendChild(el('span', 'wk-no', pad(i + 1)));
    b.appendChild(el('span', 'wk-ttl', n.label));
    var st = el('span', 'wk-state' + (has ? '' : ' latent'),
                has ? String(n.state || '') : 'not yet written');
    b.appendChild(st);
    b.appendChild(el('span', 'wk-sub', n.line || ''));
    b.addEventListener('click', function(){ renderSheet(n.id); });
    li.appendChild(b);
    ol.appendChild(li);
  });
  wkBody.appendChild(ol);
  wkLayer.scrollTop = 0;
  say('My works. ' + SHEETS.length + ' sheets, ' + written + ' written.');
}

function pad(n){ return (n < 10 ? '0' : '') + n; }

/* ── a sheet ───────────────────────────────────────────────────────────── */
function renderSheet(id){
  var n = byId[id];
  if(!n) return renderContents();
  var sh = WORKS_BY_NODE[id];
  var idx = SHEETS.map(function(x){ return x.id; }).indexOf(id);

  wkView = id;
  wkBody.innerHTML = '';
  wkIndex.hidden = false;
  wkRunning.textContent = 'My works — sheet ' + pad(idx + 1) + ' of ' + pad(SHEETS.length);

  /* title block, top */
  var top = el('div', 'wk-top');
  var left = el('div');
  left.appendChild(el('p', 'wk-proc',
    'Sheet ' + pad(idx + 1) + ' of ' + pad(SHEETS.length) + ' · ' +
    String(n.register || n.t || '')));
  left.appendChild(el('h2', 'wk-name', n.label));
  top.appendChild(left);
  top.appendChild(el('div', 'wk-stamp', sh ? String(n.state || '') : 'not yet written'));
  wkBody.appendChild(top);

  /* the graph's own sentence about this work — derived, never retyped */
  if(n.line) wkBody.appendChild(el('p', 'wk-line', n.line));

  if(sh) renderWritten(sh, n);
  else   renderReserved(n);

  /* the title block, bottom, where a drawing puts it */
  var plate = el('div', 'wk-plate');
  plate.appendChild(el('span', null, 'Sheet ' + pad(idx + 1) + ' of ' + pad(SHEETS.length)));
  plate.appendChild(el('span', null, 'Source — ' + String(n.src || '—')));
  wkBody.appendChild(plate);

  renderNight(id);
  wkLayer.scrollTop = 0;
  say(n.label + ', sheet ' + (idx + 1) + ' of ' + SHEETS.length + '.');
}

function renderWritten(sh, n){
  var grid = el('div', 'wk-grid');

  var c1 = el('div', 'wk-col');
  c1.appendChild(el('p', 'wk-h', 'Purpose'));
  c1.appendChild(el('p', null, sh.purpose));
  c1.appendChild(el('p', 'wk-h', 'Procedure'));
  var ol = el('ol', 'wk-steps');
  (sh.procedure || []).forEach(function(step){ ol.appendChild(el('li', null, step)); });
  c1.appendChild(ol);
  grid.appendChild(c1);

  var c2 = el('div', 'wk-col');
  c2.appendChild(el('p', 'wk-h', 'Parts'));
  var ul = el('ul', 'wk-parts');
  (sh.parts || []).forEach(function(p){
    var li = el('li');
    li.appendChild(el('b', null, pad(p.n)));
    li.appendChild(document.createTextNode(p.name + ' — ' + p.note));
    ul.appendChild(li);
  });
  c2.appendChild(ul);

  c2.appendChild(el('p', 'wk-h', 'Known failures'));
  var fails = sh.knownFailures || [];
  if(fails.length){
    var fl = el('ul', 'wk-fail');
    fails.forEach(function(f){
      var li = el('li');
      li.appendChild(el('b', null, f.name));
      li.appendChild(document.createTextNode(f.note));
      fl.appendChild(li);
    });
    c2.appendChild(fl);
  } else {
    c2.appendChild(el('p', 'wk-none',
      'Not yet written. This section stays empty until something has actually ' +
      'broken and been understood.'));
  }
  grid.appendChild(c2);
  wkBody.appendChild(grid);

  if(sh.figure && FIGURES[sh.figure]) renderFigure(FIGURES[sh.figure]);
  if(sh.operable) renderDiagnostic();
}

/* A reserved sheet carries its whole derived tier and nothing invented. It is
   numbered and titled like the others, because a manual with a sheet held for
   a part not yet documented is still a manual. */
function renderReserved(n){
  var box = el('div', 'wk-col');
  box.style.borderRight = '0';
  box.appendChild(el('p', 'wk-h', 'Reserved'));
  box.appendChild(el('p', 'wk-none',
    'There is no procedure here yet, and nothing has been invented to fill the ' +
    'space. What the graph holds about this work is above; what it does, step ' +
    'by step, is not written down anywhere that can be quoted.'));
  wkBody.appendChild(box);
}

function renderFigure(fig){
  var wrap = el('div', 'wk-fig');
  var bar = el('div', 'wk-figbar');
  bar.appendChild(el('span', 'wk-cap', fig.caption));
  var btn = el('button', 'wk-btn', 'Explode');
  btn.type = 'button';
  bar.appendChild(btn);
  wrap.appendChild(bar);

  var scroll = el('div', 'wk-figscroll');
  scroll.innerHTML = fig.svg;
  wrap.appendChild(scroll);
  wkBody.appendChild(wrap);

  var svg = scroll.querySelector('.wk-svg');
  btn.addEventListener('click', function(){
    var on = svg.classList.toggle('exploded');
    btn.textContent = on ? 'Assemble' : 'Explode';
    say(on ? 'Exploded view.' : 'Assembled view.');
  });
}

function renderDiagnostic(){
  var wrap = el('div', 'wk-run');
  wrap.appendChild(el('p', 'wk-h', 'Run the diagnostic'));
  var prog = el('p', 'wk-prog');
  var q = el('p', 'wk-q');
  var btns = el('div', 'wk-btns');
  var out = el('div');
  wrap.appendChild(prog); wrap.appendChild(q); wrap.appendChild(btns); wrap.appendChild(out);
  wkBody.appendChild(wrap);

  var i = 0, score = 0;

  function ask(){
    out.innerHTML = '';
    prog.hidden = false; q.hidden = false; btns.hidden = false;
    prog.textContent = 'Question ' + (i + 1) + ' of ' + DIAGNOSTIC.questions.length;
    q.textContent = DIAGNOSTIC.questions[i];
    btns.innerHTML = '';
    [['Yes', 1], ['No', 0]].forEach(function(pair){
      var b = el('button', 'wk-btn', pair[0]);
      b.type = 'button';
      b.addEventListener('click', function(){
        score += pair[1]; i++;
        if(i >= DIAGNOSTIC.questions.length) finish(); else ask();
      });
      btns.appendChild(b);
    });
  }

  function finish(){
    prog.hidden = true; q.hidden = true; btns.hidden = true;
    out.innerHTML = '';
    var band = DIAGNOSTIC.bands[Math.min(score, DIAGNOSTIC.bands.length - 1)];
    out.appendChild(el('p', 'wk-h', 'Level estimate — ' + band));
    var ul = el('ul', 'wk-course');
    DIAGNOSTIC.course.forEach(function(t, k){
      var li = el('li', k < score ? 'skipped' : null, t);
      if(k < score) li.title = 'skipped — you already hold this';
      ul.appendChild(li);
    });
    out.appendChild(ul);
    out.appendChild(el('p', 'wk-none',
      'That is the argument of the work, and it just happened to you rather ' +
      'than being described. Different answers strike out different milestones.'));
    var again = el('button', 'wk-btn', 'Run again');
    again.type = 'button';
    again.addEventListener('click', function(){ i = 0; score = 0; ask(); });
    out.appendChild(again);
    say('Level estimate: ' + band + '. ' + score + ' of ' +
        DIAGNOSTIC.course.length + ' milestones skipped.');
  }

  ask();
}

/* ── the band of night, and the way back ───────────────────────────────────
   Every entry here is a relationship the graph already declares, printed in
   the graph's own verb and sentence. Nothing is authored, so nothing can be
   fabricated. Choosing one closes the manual, enters the mind and travels to
   that node — the section's only outbound route, and the whole point of it. */
function renderNight(id){
  var rel = seeAlso(id);
  var night = el('div', 'wk-night');
  night.appendChild(el('h3', null,
    rel.length ? 'See also — back into the mind' : 'See also'));

  if(!rel.length){
    night.appendChild(el('p', 'wk-see-s', 'No relationships declared yet.'));
    wkBody.appendChild(night);
    return;
  }

  var sheetIds = SHEETS.map(function(x){ return x.id; });

  var ul = el('ul', 'wk-see');
  rel.forEach(function(r){
    /* A RELATION TO ANOTHER WORK STAYS IN THE MANUAL. COTSI is contained by
       CLAUDE-SKILLS, and sending a reader into the mind to find a sheet that
       is two pages away would be perverse. It also avoids printing the
       region's label for a sibling: my-works is relabelled ART in the V02
       overlay, so that line read "contains · ART", which is true of the data
       and meaningless to a reader. */
    var sib = sheetIds.indexOf(r.id);
    var li = el('li');
    var b = el('button');
    b.type = 'button';
    b.setAttribute('data-see', r.id);
    if(sib >= 0) b.setAttribute('data-sheet-link', r.id);
    var dot = el('span', 'wk-dot');
    dot.setAttribute('aria-hidden', 'true');
    var nm = el('span', 'wk-see-n', r.node.label);
    nm.insertBefore(dot, nm.firstChild);
    b.appendChild(nm);
    b.appendChild(el('span', 'wk-see-v',
      (r.outbound ? '' : '↑ ') + r.verb + ' · ' +
      (sib >= 0 ? 'sheet ' + pad(sib + 1) + ' of this manual'
                : (byId[r.node.mig] ? byId[r.node.mig].label : ''))));
    if(r.gloss) b.appendChild(el('span', 'wk-see-s', r.gloss));
    b.addEventListener('click', function(){
      if(sib >= 0) renderSheet(r.id); else leaveFor(r.id);
    });
    li.appendChild(b);
    ul.appendChild(li);
  });
  night.appendChild(ul);
  wkBody.appendChild(night);
}

function leaveFor(id){
  var n = byId[id];
  closeWorks(true);
  if(!n) return;
  enterMind();
  travelTo(n.t === 'mig' ? 'region' : 'concept', id, false);
  invalidate(200);
  say('Into the mind, at ' + n.label + '.');
}

/* ── open / close ──────────────────────────────────────────────────────── */
function openWorks(id){
  if(WORKS_OPEN) return;
  WORKS_OPEN = true;
  wkReturnFocus = document.activeElement;
  wkLayer.classList.add('on');
  wkLayer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('works-open');
  if(id && byId[id]) renderSheet(id); else renderContents();
  wkClose.focus();
}

function closeWorks(silent){
  if(!WORKS_OPEN) return;
  WORKS_OPEN = false;
  wkView = null;
  wkLayer.classList.remove('on');
  wkLayer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('works-open');
  invalidate(140);
  if(wkReturnFocus && wkReturnFocus.focus) wkReturnFocus.focus();
  if(!silent) say('Closed the manual.');
}

/* the door on the threshold */
onWorksDoor = function(){ openWorks(null); };

wkClose.addEventListener('click', function(){ closeWorks(); });
wkIndex.addEventListener('click', function(){ renderContents(); wkIndex.focus(); });

/* Escape steps back one level rather than closing outright: a sheet returns to
   the contents, the contents return to where you came from. */
document.addEventListener('keydown', function(e){
  if(!WORKS_OPEN || e.key !== 'Escape') return;
  e.stopPropagation();
  if(wkView && wkView !== 'contents') renderContents();
  else closeWorks();
});

/* deep links: #works and #works:<node> */
(function bootWorks(){
  var h = decodeURIComponent(location.hash.slice(1));
  if(!h) return;
  h.split('&').forEach(function(part){
    var m = part.split(':'), kind = m.shift();
    if(kind === 'works') openWorks(m[0] || null);
  });
})();

/* the harness, for the suites */
window.__v02.works = {
  open:     function(id){ openWorks(id || null); return WORKS_OPEN; },
  close:    function(){ closeWorks(true); return WORKS_OPEN; },
  isOpen:   function(){ return WORKS_OPEN; },
  view:     function(){ return wkView; },
  sheets:   function(){ return SHEETS.map(function(n){ return n.id; }); },
  written:  function(){ return Object.keys(WORKS_BY_NODE); },
  data:     function(){ return WORKS_DATA; },
  figures:  function(){ return FIGURES; },
  /* navigate whether or not the layer is already up. openWorks returns early
     when it is, so routing every jump through it silently did nothing. */
  show:     function(id){ if(WORKS_OPEN) renderSheet(id); else openWorks(id);
              return wkView; },
  seeAlso:  function(id){ return seeAlso(id).map(function(r){
              return { id:r.id, verb:r.verb }; }); },
  /* ask the scene for frames, so a suite can prove the manual stops them */
  nudge:    function(n){ invalidate(n || 400); return true; },
  /* graph truth, so a suite can check the manual against the mind rather
     than against another copy of the manual */
  node:     function(id){ var n=byId[id];
              return n ? { id:n.id, mig:n.mig, t:n.t, label:n.label,
                           state:n.state||null, src:n.src||null } : null; }
};
