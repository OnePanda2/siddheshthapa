/* mobilecheck.js — the phone model, measured.

   Runs the six orientation questions from PRODUCT.md against every important
   state, at every required width, using a TRUE CSS viewport (see viewport.js —
   headless --window-size clamps at ~500px and lies).

   A state that could not be measured counts as a FAILURE, never a pass.

   usage: node tools/mobilecheck.js preview.html
*/
const fs = require('fs'), os = require('os'), { execSync } = require('child_process');
const file = process.argv[2] || 'preview.html';
const WIDTHS = process.env.WIDTHS ? process.env.WIDTHS.split(',').map(Number)
                                  : [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const STATES = ['philosophy', 'curiosity', 'b-kind', 'c-curiosity', 'p-statelab', 'music'];

const tmp = require('./scratch.js').root() + '/mobilecheck'; fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(tmp + '/probe.js', `(function(){
  var out={}, ST=${JSON.stringify(STATES)};
  var stage=D.getElementById('stage'), nav=D.getElementById('graphnav');
  var phone=Wn.matchMedia('(max-width:560px)').matches;
  ST.forEach(function(id){
    var n=M.byId[id]; if(!n){ out[id]={error:'missing node'}; return; }
    if(n.t==='mig'||n.t==='minor') M.open(n); else { M.open(M.byId[n.mig]); M.openReader(n); }
    var rows=[].slice.call(nav.children), txt=nav.textContent;
    var reader=D.getElementById('reader'), reading=reader.classList.contains('on');
    /* The six questions must be answerable ON SCREEN, not merely present in
       the DOM. The nav exists at every width because it is the accessibility
       layer; on a phone it must also be the visible interface. Without this
       gate the matrix passed a build whose sheet never appeared at all. */
    var nr=nav.getBoundingClientRect();
    var navShown = Wn.getComputedStyle(nav).clipPath==='none' && nr.width>200 && nr.height>100;
    var panelShown = Wn.getComputedStyle(D.getElementById('emerge')).display!=='none' &&
                     D.getElementById('emerge').classList.contains('on');
    var uiVisible = reading || (phone ? navShown : (panelShown || navShown));
    var rects=rows.map(function(b){return b.getBoundingClientRect();});
    var interactive = reading ? reader.querySelectorAll('button').length : rows.length;
    var smallest = reading
      ? Math.min.apply(null, [].slice.call(reader.querySelectorAll('button')).map(function(b){
          var r=b.getBoundingClientRect(); return Math.round(Math.min(r.width,r.height)); }).concat([999]))
      : Math.min.apply(null, rects.map(function(r){return Math.round(r.height);}).concat([999]));
    out[id]={
      q1_whereAmI:  reading ? !!D.querySelector('.dochead .dh-c') : /You are here/.test(txt),
      q2_whatIsIt:  reading ? !!D.querySelector('.pkind') : rows.length>0,
      q3_canTouch:  interactive>0 && uiVisible,
      q4_connected: reading ? !!D.querySelector('.lnk') || !!D.querySelector('.rlinks')
                            : (/Connected|Concept|Writing/.test(txt)),
      q5_whatOnTap: reading ? true : rows.every(function(b){return b.hasAttribute('data-nav');}),
      q6_howBack:   reading ? !!D.getElementById('readerClose')
                            : (/Leads to/.test(txt) || M.byId[id].t==='mig'),
      touchOK: smallest>=44 || !phone,
      smallestTarget: smallest,
      overflowX: D.documentElement.scrollWidth > D.documentElement.clientWidth+1,
      rows: rows.length
    };
    if(reading) M.goBack();
  });
  out._phone=phone;
  return out;
})()`, 'utf8');

let bad = 0, ran = 0;
WIDTHS.forEach(w => {
  const h = w <= 560 ? 812 : 900;
  let res;
  try {
    const raw = execSync('node tools/viewport.js probe "' + file + '" ' + w + ' ' + h +
                         ' mind "' + tmp + '/probe.js"', { maxBuffer: 1 << 26, stdio:['pipe','pipe','pipe'] }).toString();
    res = JSON.parse(raw.slice(raw.indexOf('{')));
  } catch (e){
    console.log('  FAIL  ' + w + 'px — probe did not run (' + String(e.message).split('\n')[0] + ')');
    bad++; return;
  }
  if (Math.abs(res.viewport.cssWidth - w) > 24){ console.log('  FAIL  ' + w + 'px — viewport reported ' + res.viewport.cssWidth); bad++; return; }
  const r = res.result, phone = r._phone;
  const problems = [];
  STATES.forEach(id => {
    const s = r[id];
    if (!s || s.error){ problems.push(id + ': NOT MEASURED'); return; }
    ran++;
    ['q1_whereAmI','q2_whatIsIt','q3_canTouch','q4_connected','q5_whatOnTap','q6_howBack']
      .forEach(q => { if (!s[q]) problems.push(id + ' fails ' + q.split('_')[1]); });
    if (!s.touchOK) problems.push(id + ' touch target ' + s.smallestTarget + 'px < 44');
    if (s.overflowX) problems.push(id + ' scrolls horizontally');
  });
  if (problems.length){ bad += problems.length; console.log('  FAIL  ' + String(w).padStart(4) + 'px' + (phone?' (phone model)':'') );
    problems.forEach(p => console.log('           ' + p)); }
  else console.log('  PASS  ' + String(w).padStart(4) + 'px' + (phone ? ' (phone model) ' : ' (desktop model)') +
                   ' — ' + STATES.length + ' states, six questions each');
});
console.log('\n' + (bad ? bad + ' PROBLEM(S)' : ran + ' state/viewport checks clear across ' + WIDTHS.length + ' widths'));
process.exit(bad ? 1 : 0);
