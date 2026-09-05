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

/* WRITE AN ADDRESS, UNLESS THE ADDRESS IS WHAT MOVED US. Going back to
   #works:<sheet> must OPEN that sheet, not push another entry for it — without
   this, walking backwards would lay a fresh trail behind itself and Back would
   never reach the threshold. Declared here rather than beside the functions
   that read it: a var assigned late hoists as undefined, and this file is read
   top to bottom by three of them. */
var silentUrl = false;

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
    caption: 'the diagnostic stands before the generator',
    parts: [1, 2, 3, 4],
    svg: [
      '<svg class="wk-svg" viewBox="0 0 660 200" role="img" aria-label="Assembly drawing: trigger, diagnostic, level estimate, course. The diagnostic sits between the request and anything being generated.">',
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
  },

  /* Five inputs, one file. Drawn as an assembly rather than a flow, because
     that is what it is: nothing is fetched at run time, so every part has to
     be inside the artifact before it leaves the bench. */
  'five-parts-one-file': {
    caption: 'assembly: five parts, one file, nothing fetched',
    parts: [1, 2, 3, 4, 5],
    svg: [
      /* Pitch 46 against a box height of 32, so the nine-pixel gap under each
         box is clear for the next part's number. At a pitch of 42 the number
         sat on the box above it. */
      '<svg class="wk-svg wk-svg--stack" viewBox="0 -12 660 276" role="img" aria-label="Assembly drawing: the graph, the shell, the renderer, the scene and the manual compose into one self-contained file that makes no external requests.">',
      '<g class="part p1">',
      '<rect x="14" y="12" width="150" height="32" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="89" y="27" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE GRAPH</text>',
      '<text x="89" y="39" text-anchor="middle" font-size="8" fill="#5e6367">143 objects · 126 links</text>',
      '<text x="14" y="7" font-size="9" fill="#9a2a1f">01</text></g>',
      '<g class="part p2">',
      '<rect x="14" y="58" width="150" height="32" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="89" y="73" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE SHELL</text>',
      '<text x="89" y="85" text-anchor="middle" font-size="8" fill="#5e6367">21KB · structure</text>',
      '<text x="14" y="53" font-size="9" fill="#9a2a1f">02</text></g>',
      '<g class="part p3">',
      '<rect x="14" y="104" width="150" height="32" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="89" y="119" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE RENDERER</text>',
      '<text x="89" y="131" text-anchor="middle" font-size="8" fill="#5e6367">three r149 · 594KB</text>',
      '<text x="14" y="99" font-size="9" fill="#9a2a1f">03</text></g>',
      '<g class="part p4">',
      '<rect x="14" y="150" width="150" height="32" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="89" y="165" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE SCENE</text>',
      '<text x="89" y="177" text-anchor="middle" font-size="8" fill="#5e6367">228KB · 6 draw calls</text>',
      '<text x="14" y="145" font-size="9" fill="#9a2a1f">04</text></g>',
      '<g class="part p5">',
      '<rect x="14" y="196" width="150" height="32" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="89" y="211" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE MANUAL</text>',
      '<text x="89" y="223" text-anchor="middle" font-size="8" fill="#5e6367">21KB · this</text>',
      '<text x="14" y="191" font-size="9" fill="#9a2a1f">05</text></g>',
      /* the leaders gather on one bus, then run to the artifact once */
      '<path class="lead" d="M164 28 L232 28 L232 120" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      '<path class="lead" d="M164 74 L232 74 L232 120" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      '<path class="lead" d="M164 120 L292 120" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      '<path class="lead" d="M164 166 L232 166 L232 120" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      '<path class="lead" d="M164 212 L232 212 L232 120" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      /* the artifact */
      '<rect x="292" y="76" width="176" height="88" fill="none" stroke="#1a1d1f" stroke-width="1.6"></rect>',
      '<text x="380" y="108" text-anchor="middle" font-size="11" fill="#1a1d1f">v02.html</text>',
      '<text x="380" y="126" text-anchor="middle" font-size="8.5" fill="#5e6367">953KB · one file</text>',
      '<text x="380" y="140" text-anchor="middle" font-size="8.5" fill="#5e6367">idle: 0 frames</text>',
      /* and the thing that never happens */
      '<path d="M468 120 L556 120" stroke="#9a2a1f" stroke-width="1" stroke-dasharray="4 3"></path>',
      '<line x1="502" y1="106" x2="522" y2="134" stroke="#9a2a1f" stroke-width="1.4"></line>',
      '<line x1="522" y1="106" x2="502" y2="134" stroke="#9a2a1f" stroke-width="1.4"></line>',
      '<text x="562" y="117" font-size="8.5" fill="#9a2a1f">NO NETWORK</text>',
      '<text x="562" y="129" font-size="8" fill="#5e6367">nothing is fetched</text>',
      '<line x1="14" y1="252" x2="646" y2="252" stroke="#b9bcb6" stroke-width="1"></line>',
      '</svg>'
    ].join('')
  },

  /* The asymmetry IS the drawing. One part is drawn solid because something is
     written down about it; six are drawn open because nothing is, and an
     honest parts list of a collection like this looks exactly like that. */
  'one-documented-six-named': {
    caption: 'one part documented, six named',
    parts: [1, 2, 3, 4, 5, 6, 7],
    svg: (function(){
      var out = ['<svg class="wk-svg" viewBox="0 -10 660 210" role="img" ' +
        'aria-label="Seven parts in the repository. One, cotsi, is drawn solid because its behaviour is written down. The other six are drawn open because only their names are.">'];
      /* 01 — the one with something written about it */
      out.push('<g class="part p1">');
      out.push('<rect x="14" y="26" width="150" height="70" fill="none" stroke="#1a1d1f" stroke-width="1.6"></rect>');
      out.push('<text x="89" y="52" text-anchor="middle" font-size="10" fill="#1a1d1f">COTSI</text>');
      out.push('<text x="89" y="68" text-anchor="middle" font-size="8" fill="#5e6367">a folder, and</text>');
      out.push('<text x="89" y="80" text-anchor="middle" font-size="8" fill="#5e6367">an argument</text>');
      out.push('<text x="14" y="20" font-size="9" fill="#9a2a1f">01</text></g>');
      out.push('<path class="lead" d="M89 96 L89 126" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3"></path>');
      out.push('<text x="89" y="140" text-anchor="middle" font-size="8" fill="#5e6367">sheet 01</text>');
      /* 02-07 — named only, drawn open on three sides */
      var names = ['job-hunter', 'out-of-the-box3.5', 'primis',
                   'prospect-intel1.0', 'unfair-advantage', 'wave-predict (1)'];
      names.forEach(function(nm, i){
        var col = i % 3, row = (i / 3) | 0;
        var x = 214 + col * 148, y = 26 + row * 76;
        out.push('<g class="part p' + (i + 2) + '">');
        /* open on the right: nothing states where it ends or what it is for */
        out.push('<path d="M' + (x + 118) + ' ' + y + ' L' + x + ' ' + y +
                 ' L' + x + ' ' + (y + 52) + ' L' + (x + 118) + ' ' + (y + 52) + '" ' +
                 'fill="none" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="2 3"></path>');
        out.push('<text x="' + (x + 8) + '" y="' + (y + 22) + '" font-size="8.5" fill="#1a1d1f">' + nm + '</text>');
        out.push('<text x="' + (x + 8) + '" y="' + (y + 38) + '" font-size="7.5" fill="#9a2a1f">no description</text>');
        out.push('<text x="' + x + '" y="' + (y - 6) + '" font-size="9" fill="#9a2a1f">0' + (i + 2) + '</text>');
        out.push('</g>');
      });
      out.push('<line x1="14" y1="190" x2="646" y2="190" stroke="#b9bcb6" stroke-width="1"></line>');
      out.push('</svg>');
      return out.join('');
    })()
  },

  /* NOTE ON THE CONNECTORS. These are drawn as plain paths, not as .lead —
     a leader line is an annotation that appears when an exploded view pulls
     its parts apart, and hiding these until then left three unconnected boxes
     and a floating word. Here the connections ARE the subject.

     Two bodies of work that look unrelated on a CV, drawn as what they
     actually share: the same loop, with the people who will use the thing
     inside it rather than surveyed from outside. The constraints are drawn as
     a bracket around the whole loop because that is where they sat. */
  'two-halves-one-habit': {
    caption: 'the same loop, run twice, under a bracket',
    parts: [1, 2, 3, 4],
    svg: [
      '<svg class="wk-svg" viewBox="0 -14 660 250" role="img" aria-label="Two bodies of work — freelance across businesses, and a defence startup — both feeding one loop in which the people who will use the thing are consulted before and during the build. Constraints bracket the whole loop.">',
      /* 01 · 02 — the two halves */
      '<g class="part p1">',
      '<rect x="14" y="20" width="158" height="52" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="93" y="42" text-anchor="middle" font-size="9.5" fill="#1a1d1f">FREELANCE</text>',
      '<text x="93" y="56" text-anchor="middle" font-size="8" fill="#5e6367">copy · positioning</text>',
      '<text x="93" y="67" text-anchor="middle" font-size="8" fill="#5e6367">sites · proofreading</text>',
      '<text x="14" y="14" font-size="9" fill="#9a2a1f">01</text></g>',
      '<g class="part p2">',
      '<rect x="14" y="106" width="158" height="52" fill="none" stroke="#1a1d1f" stroke-width="1.2"></rect>',
      '<text x="93" y="128" text-anchor="middle" font-size="9.5" fill="#1a1d1f">DEFENCE STARTUP</text>',
      '<text x="93" y="142" text-anchor="middle" font-size="8" fill="#5e6367">research &amp; technology,</text>',
      '<text x="93" y="153" text-anchor="middle" font-size="8" fill="#5e6367">bootstrapped</text>',
      '<text x="14" y="100" font-size="9" fill="#9a2a1f">02</text></g>',
      '<path d="M172 46 L226 46 L226 89 L246 89" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      '<path d="M172 132 L226 132 L226 89" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3" fill="none"></path>',
      /* 03 — the loop, with the user inside it */
      '<g class="part p3">',
      '<rect x="246" y="34" width="196" height="110" fill="none" stroke="#1a1d1f" stroke-width="1.6"></rect>',
      '<text x="344" y="56" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE PEOPLE WHO USE IT</text>',
      '<text x="344" y="72" text-anchor="middle" font-size="8" fill="#5e6367">consulted before the design</text>',
      '<text x="344" y="83" text-anchor="middle" font-size="8" fill="#5e6367">and present during it</text>',
      /* the loop itself */
      '<path d="M286 96 L402 96" stroke="#1a1d1f" stroke-width="1"></path>',
      '<path d="M402 96 L396 92 M402 96 L396 100" stroke="#1a1d1f" stroke-width="1"></path>',
      '<path d="M402 96 C 418 104, 418 120, 402 126 L286 126 C 270 120, 270 104, 286 96" ' +
        'fill="none" stroke="#1a1d1f" stroke-width="1"></path>',
      '<text x="344" y="119" text-anchor="middle" font-size="8" fill="#5e6367">build · show · iterate</text>',
      '<text x="246" y="28" font-size="9" fill="#9a2a1f">03</text></g>',
      /* 04 — the bracket */
      '<g class="part p4">',
      '<path d="M232 168 L232 182 L456 182 L456 168" fill="none" stroke="#9a2a1f" stroke-width="1.2"></path>',
      '<text x="344" y="198" text-anchor="middle" font-size="8.5" fill="#9a2a1f">NO BUDGET · NOWHERE TO TEST</text>',
      '<text x="232" y="162" font-size="9" fill="#9a2a1f">04</text></g>',
      '<path d="M442 89 L512 89" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="3 3"></path>',
      '<path d="M512 89 L506 85 M512 89 L506 93" stroke="#1a1d1f" stroke-width="1"></path>',
      '<text x="520" y="86" font-size="8.5" fill="#1a1d1f">SHIPPED</text>',
      '<text x="520" y="98" font-size="8" fill="#5e6367">for people watching</text>',
      '<text x="520" y="109" font-size="8" fill="#5e6367">the result</text>',
      '<line x1="14" y1="220" x2="646" y2="220" stroke="#b9bcb6" stroke-width="1"></line>',
      '</svg>'
    ].join('')
  },

  /* THE GAP IS DRAWN TO SCALE, AND THAT IS THE ARGUMENT. A 3% step next to the
     distance still to cover says the thing the sentence says: a real result,
     and nowhere near a reason to switch. Exaggerating the step for legibility
     would have made the drawing disagree with the sheet. */
  'three-percent-is-not-enough': {
    caption: 'a real step, against the distance still to cover',
    parts: [1, 2, 3],
    svg: [
      '<svg class="wk-svg" viewBox="0 -14 660 200" role="img" aria-label="A speed axis. The incumbent generator sits at the baseline, the candidate 3 percent further along, and the margin that would make anyone switch is far beyond both. Every candidate must run without a special chip.">',
      /* 02 — the constraint, bracketing the whole hunt */
      '<path d="M40 30 L40 18 L620 18 L620 30" fill="none" stroke="#1a1d1f" stroke-width="1"></path>',
      '<text x="330" y="12" text-anchor="middle" font-size="8.5" fill="#1a1d1f">EVERY CANDIDATE MUST RUN WITHOUT A SPECIAL CHIP</text>',
      '<text x="24" y="24" font-size="9" fill="#9a2a1f">02</text>',
      /* the axis */
      '<line x1="40" y1="120" x2="600" y2="120" stroke="#1a1d1f" stroke-width="1"></line>',
      '<path d="M600 120 L592 116 M600 120 L592 124" stroke="#1a1d1f" stroke-width="1"></path>',
      '<text x="606" y="123" font-size="8" fill="#5e6367">faster</text>',
      /* 01 — the incumbent */
      '<line x1="110" y1="104" x2="110" y2="136" stroke="#1a1d1f" stroke-width="1.6"></line>',
      '<text x="110" y="96" text-anchor="middle" font-size="9.5" fill="#1a1d1f">THE INCUMBENT</text>',
      '<text x="110" y="84" text-anchor="middle" font-size="8" fill="#5e6367">securing most of the internet</text>',
      '<text x="82" y="112" font-size="9" fill="#9a2a1f">01</text>',
      /* 03 — the candidate, three per cent along */
      '<line x1="127" y1="110" x2="127" y2="130" stroke="#9a2a1f" stroke-width="1.6"></line>',
      '<text x="127" y="152" text-anchor="middle" font-size="8.5" fill="#9a2a1f">+3%</text>',
      '<text x="127" y="164" text-anchor="middle" font-size="8" fill="#5e6367">one candidate</text>',
      '<text x="140" y="112" font-size="9" fill="#9a2a1f">03</text>',
      /* the bar nobody has reached */
      '<line x1="430" y1="98" x2="430" y2="142" stroke="#1a1d1f" stroke-width="1" stroke-dasharray="4 3"></line>',
      /* right-aligned and ABOVE the axis: run leftward from a fixed right edge
         and these labels cannot reach the arrowhead, which is what they did
         when they were set left-aligned from the threshold line */
      '<text x="596" y="94" text-anchor="end" font-size="8.5" fill="#1a1d1f">ENOUGH TO MAKE ANYONE SWITCH</text>',
      '<text x="596" y="106" text-anchor="end" font-size="8" fill="#5e6367">not known, but further than this</text>',
      /* the distance between them */
      '<path d="M127 140 L430 140" stroke="#5e6367" stroke-width="0.8" stroke-dasharray="2 3"></path>',
      '<text x="278" y="134" text-anchor="middle" font-size="8" fill="#5e6367">the hunt continues</text>',
      '<line x1="14" y1="176" x2="646" y2="176" stroke="#b9bcb6" stroke-width="1"></line>',
      '</svg>'
    ].join('')
  },

  /* ONE PIPELINE, BUILT THREE TIMES AT THREE DEPTHS. Drawn as bars of ten, six
     and three segments against a shared scale, because that comparison is the
     finding: the collection is not five unrelated automations, it is one idea
     at decreasing depth — and then two that cannot be measured at all, drawn
     as the empty bars they are. */
  'one-pipeline-three-depths': {
    caption: 'one pipeline, built three times, and two that are not described',
    parts: [1, 2, 3, 4, 5],
    svg: (function(){
      var rows = [
        { n:1, name:'RevenuePilot OS',        segs:10, note:'lead to cash' },
        { n:2, name:'RevFlow AI',             segs:6,  note:'capture to opportunity' },
        { n:3, name:'CRM Lead Capture',       segs:3,  note:'validate · store · alert' },
        { n:4, name:'Pipeline-Leak-Engine',   segs:0,  note:'not described' },
        { n:5, name:'02-crm-slack-onboarding',segs:0,  note:'not described' }
      ];
      /* X and W leave room for the note that follows the longest bar: at
         X=196/W=400 the ten-segment row put its label past the right edge of
         the viewBox, where it was simply clipped. */
      var X = 180, W = 340, SEG = W / 10, out = [];
      out.push('<svg class="wk-svg" viewBox="0 -10 660 226" role="img" ' +
        'aria-label="Five automation projects. Three are the same lead-to-cash pipeline at ten, six and three workflows; two are present in the repository with no description, drawn as empty bars.">');
      /* the shared scale */
      out.push('<text x="' + X + '" y="4" font-size="8" fill="#5e6367">1</text>');
      out.push('<text x="' + (X + W) + '" y="4" text-anchor="end" font-size="8" fill="#5e6367">10 workflows</text>');
      rows.forEach(function(r, i){
        var y = 20 + i * 38;
        out.push('<g class="part p' + r.n + '">');
        out.push('<text x="14" y="' + (y + 14) + '" font-size="9" fill="#9a2a1f">0' + r.n + '</text>');
        out.push('<text x="38" y="' + (y + 14) + '" font-size="9" fill="#1a1d1f">' + r.name + '</text>');
        if(r.segs){
          for(var k = 0; k < r.segs; k++){
            out.push('<rect x="' + (X + k * SEG) + '" y="' + y + '" width="' + (SEG - 3) +
                     '" height="18" fill="none" stroke="#1a1d1f" stroke-width="1"></rect>');
          }
          out.push('<text x="' + (X + r.segs * SEG + 6) + '" y="' + (y + 13) +
                   '" font-size="8" fill="#5e6367">' + r.segs + ' · ' + r.note + '</text>');
        } else {
          /* an empty bar is the honest drawing of a project with no description */
          out.push('<rect x="' + X + '" y="' + y + '" width="' + W +
                   '" height="18" fill="none" stroke="#9a2a1f" stroke-width="1" ' +
                   'stroke-dasharray="2 4"></rect>');
          out.push('<text x="' + (X + 8) + '" y="' + (y + 13) +
                   '" font-size="8" fill="#9a2a1f">' + r.note + '</text>');
        }
        out.push('</g>');
      });
      out.push('<line x1="14" y1="204" x2="646" y2="204" stroke="#b9bcb6" stroke-width="1"></line>');
      out.push('</svg>');
      return out.join('');
    })()
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

/* A TEST SEAM, AND THE REASON FOR IT.
   Every one of the six works is now written, so nothing a visitor can reach
   renders the reserved path — and the check that guards it had nothing left to
   measure. The guarantee still matters: the day a seventh work is added to the
   graph it must render as a numbered, stamped, reserved sheet rather than as a
   broken one. This makes that state reachable by asking for it, through the
   same renderSheet the real path uses, rather than by faking a record. */
var RESERVED_PREVIEW = null;

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
  /* COUNTED, NOT TYPED. This opened "Six things built" beside a derived
     "N of M sheets are written", so the same page stated the number twice and
     only one of the two could survive a seventh sheet. */
  var reserved = SHEETS.filter(function(n){ return !WORKS_BY_NODE[n.id] && !n.brief; }).length;
  lede.textContent = 'The things built, and the manual for each: what it is for, ' +
    'what it is made of, how it runs, and what is known to break. ' +
    written + ' of ' + SHEETS.length + ' sheets carry a manual. ' +
    (reserved ? 'The rest are reserved — listed, numbered, and left blank until ' +
                'there is something true to put on them.' : '');
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
    /* the contents must agree with the sheet it opens: a brief sheet is not
       waiting for anything, so the list does not label it as if it were */
    if(has || !n.brief){
      var st = el('span', 'wk-state' + (has ? '' : ' latent'),
                  has ? String(n.state || '') : 'not yet written');
      b.appendChild(st);
    }
    b.appendChild(el('span', 'wk-sub', n.line || ''));
    b.addEventListener('click', function(){ renderSheet(n.id); });
    li.appendChild(b);
    ol.appendChild(li);
  });
  wkBody.appendChild(ol);
  /* THE EDITOR'S DOOR INTO THE MANUAL. Inert in the published artifact, which
     never loads an editor. The contents page is the right place for it: it is
     the only view that lists every work at once, written and unwritten alike,
     so a sheet that has never been written is as reachable as one that has. */
  if(window.__editor && window.__editor.paintWorks) window.__editor.paintWorks(ol);
  wkLayer.scrollTop = 0;
  say('My works. ' + SHEETS.length + ' sheets, ' + written + ' written.');
}

function pad(n){ return (n < 10 ? '0' : '') + n; }

/* ── a sheet ───────────────────────────────────────────────────────────── */
function renderSheet(id){
  var n = byId[id];
  if(!n) return renderContents();
  /* a sheet is its own address, so Back walks sheet by sheet instead of leaping
     out of the manual from wherever you happened to stop reading */
  var pushAfter = WORKS_OPEN && !silentUrl && wkView !== id;
  var sh = (RESERVED_PREVIEW === id) ? null : WORKS_BY_NODE[id];
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
  /* a brief sheet carries no stamp at all: "not yet written" would be untrue
     and its state would be a fact about the work rather than about the sheet */
  if(sh || !n.brief)
    top.appendChild(el('div', 'wk-stamp', sh ? String(n.state || '') : 'not yet written'));
  wkBody.appendChild(top);

  /* the graph's own sentence about this work — derived, never retyped */
  if(n.line) wkBody.appendChild(el('p', 'wk-line', n.line));

  if(sh)          renderWritten(sh, n, idx);
  else if(!n.brief) renderReserved(n);

  /* the title block, bottom, where a drawing puts it */
  var plate = el('div', 'wk-plate');
  plate.appendChild(el('span', null, 'Sheet ' + pad(idx + 1) + ' of ' + pad(SHEETS.length)));
  /* the source line is gone from the manual too - see src/v02-app.js */
  wkBody.appendChild(plate);

  renderNight(id);
  wkLayer.scrollTop = 0;
  say(n.label + ', sheet ' + (idx + 1) + ' of ' + SHEETS.length + '.');
  if(pushAfter) pushUrl();
}

function renderWritten(sh, n, idx){
  var grid = el('div', 'wk-grid');

  var c1 = el('div', 'wk-col');
  c1.appendChild(el('p', 'wk-h', 'Purpose'));
  c1.appendChild(el('p', null, sh.purpose));
  c1.appendChild(el('p', 'wk-h', 'Procedure'));
  /* A SHEET CAN BE PART-WRITTEN. Purpose and parts can be known while the
     steps are not — a collection whose contents state only their names has no
     procedure anyone can honestly write down. An empty <ol> rendered as a
     silent gap, which reads as an oversight rather than as a fact. */
  var steps = sh.procedure || [];
  if(steps.length){
    var ol = el('ol', 'wk-steps');
    steps.forEach(function(step){ ol.appendChild(el('li', null, step)); });
    c1.appendChild(ol);
  } else {
    c1.appendChild(el('p', 'wk-none',
      'Not yet written. The parts are known and what they do, step by step, ' +
      'is not stated anywhere that can be quoted.'));
  }
  grid.appendChild(c1);

  var c2 = el('div', 'wk-col');
  c2.appendChild(el('p', 'wk-h', 'Parts'));
  /* Same rule as the procedure: a section with nothing in it says so rather
     than rendering an empty list, which reads as an oversight. */
  var parts = sh.parts || [];
  if(parts.length){
    var ul = el('ul', 'wk-parts');
    parts.forEach(function(p){
      var li = el('li');
      li.appendChild(el('b', null, pad(p.n)));
      li.appendChild(document.createTextNode(p.name + ' — ' + p.note));
      ul.appendChild(li);
    });
    c2.appendChild(ul);
  } else {
    c2.appendChild(el('p', 'wk-none',
      'Not yet written. What this is made of has not been set down anywhere ' +
      'that can be quoted.'));
  }

  grid.appendChild(c2);
  wkBody.appendChild(grid);

  /* KNOWN FAILURES GETS THE FULL WIDTH. It sat in the right rail under the
     parts list, which balanced while a sheet had two of them and stopped
     balancing the moment a sheet had four — one column ran three times the
     length of the other. It is also the section that makes this format worth
     choosing over a gallery, and a column it has to share is the wrong place
     to put it. */
  var fw = el('div', 'wk-failwrap');
  fw.appendChild(el('p', 'wk-h', 'Known failures'));
  var fails = sh.knownFailures || [];
  if(fails.length){
    var fl = el('ul', 'wk-fail');
    fails.forEach(function(f){
      var li = el('li');
      li.appendChild(el('b', null, f.name));
      li.appendChild(document.createTextNode(f.note));
      fl.appendChild(li);
    });
    fw.appendChild(fl);
  } else {
    fw.appendChild(el('p', 'wk-none',
      'Not yet written. This section stays empty until something has actually ' +
      'broken and been understood.'));
  }
  wkBody.appendChild(fw);

  if(sh.figure && FIGURES[sh.figure]) renderFigure(FIGURES[sh.figure], idx);
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

/* THE FIGURE NUMBER IS DERIVED, like the sheet number. It was typed into each
   caption, and the moment a third sheet was written the ordering changed and
   "Fig. 3.1" appeared on sheet 02. A number a person maintains by hand next to
   a number the code derives will disagree eventually. */
function renderFigure(fig, idx){
  var wrap = el('div', 'wk-fig');
  var bar = el('div', 'wk-figbar');
  bar.appendChild(el('span', 'wk-cap',
    'Fig. ' + pad(idx + 1) + '.1 — ' + fig.caption));
  /* NO EXPLODE CONTROL. Every figure carried a button that pulled its parts
     apart and pushed them back. The drawings are already part-numbered and
     already read as assemblies, so the control was offering a second way to
     look at something that was legible the first way — and it was the only
     interactive element on a sheet that is otherwise a document.

     The .exploded CSS in the shell is deliberately left in place: it is what
     the transform would need if the view is ever wanted again, it costs
     nothing when no element carries the class, and deleting it would make
     restoring the feature a rewrite rather than a line. */
  wrap.appendChild(bar);

  var scroll = el('div', 'wk-figscroll');
  scroll.innerHTML = fig.svg;
  wrap.appendChild(scroll);
  wkBody.appendChild(wrap);
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
  /* THE ENTRY THAT WAS MISSING, and the whole of the bug: without it Back from
     the manual found nothing belonging to this page and left the site. */
  if(!silentUrl) pushUrl();
}

function closeWorks(silent, quietUrl){
  if(!WORKS_OPEN) return;
  WORKS_OPEN = false;
  wkView = null;
  wkLayer.classList.remove('on');
  wkLayer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('works-open');
  invalidate(140);
  if(wkReturnFocus && wkReturnFocus.focus) wkReturnFocus.focus();
  if(!silent) say('Closed the manual.');
  if(!quietUrl && !silentUrl) pushUrl();
}

/* the door on the threshold */
onWorksDoor = function(){ openWorks(null); };
/* and the route the other way: a row in the mind that points at one of the
   works opens its sheet, rather than trying to travel to a region that no
   longer exists. The band of night at the foot of each sheet is the same
   crossing in reverse. */
onWorksSheet = function(id){
  var sheetIds = SHEETS.map(function(x){ return x.id; });
  openWorks(sheetIds.indexOf(id) >= 0 ? id : null);
};

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

/* WHAT THE ADDRESS MACHINERY ASKS OF THE MANUAL. Declared in v02-app.js and
   filled in here, because this file runs inside the same closure and after it. */
worksGo = function(id){
  silentUrl = true;
  try{
    if(!WORKS_OPEN) openWorks(id || null);
    else if(id && id !== wkView) renderSheet(id);
    else if(!id && wkView) renderContents();
  } finally { silentUrl = false; }
};
worksShut = function(){
  silentUrl = true;
  try{ closeWorks(true, true); } finally { silentUrl = false; }
};

/* the harness, for the suites */
window.__v02.works = {
  open:     function(id){ openWorks(id || null); return WORKS_OPEN; },
  close:    function(){ closeWorks(true); return WORKS_OPEN; },
  isOpen:   function(){ return WORKS_OPEN; },
  view:     function(){ return wkView; },
  sheets:   function(){ return SHEETS.map(function(n){ return n.id; }); },
  written:  function(){ return Object.keys(WORKS_BY_NODE); },
  brief:    function(){ return SHEETS.filter(function(n){ return n.brief; })
                                     .map(function(n){ return n.id; }); },
  data:     function(){ return WORKS_DATA; },
  figures:  function(){ return FIGURES; },
  /* navigate whether or not the layer is already up. openWorks returns early
     when it is, so routing every jump through it silently did nothing. */
  show:     function(id){ if(WORKS_OPEN) renderSheet(id); else openWorks(id);
              return wkView; },
  seeAlso:  function(id){ return seeAlso(id).map(function(r){
              return { id:r.id, verb:r.verb }; }); },
  /* render a written sheet the way an undocumented one is rendered, so the
     reserved-sheet guarantee stays measurable once every work is written */
  asReserved:function(id){ RESERVED_PREVIEW = id;
    if(WORKS_OPEN) renderSheet(id); else openWorks(id);
    RESERVED_PREVIEW = null; return wkView; },
  /* ask the scene for frames, so a suite can prove the manual stops them */
  nudge:    function(n){ invalidate(n || 400); return true; },
  /* graph truth, so a suite can check the manual against the mind rather
     than against another copy of the manual */
  node:     function(id){ var n=byId[id];
              return n ? { id:n.id, mig:n.mig, t:n.t, label:n.label,
                           state:n.state||null, src:n.src||null } : null; }
};
