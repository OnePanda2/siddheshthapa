/* Does the pair READ as two stars? Not "are there two vertices" — sample the
   rendered luminance along the A-B axis and require two separated maxima with
   a real trough between them. This is measured off the framebuffer, so it
   fails if the two lights merge, if one is missing, or if one is too faint to
   register — none of which a geometry assertion would catch. */
const fs = require('fs');
const F = 'src/v02-app.js';
let s = fs.readFileSync(F, 'utf8');
function sub(find, repl) {
  const hits = s.split(find).length - 1;
  if (hits !== 1) { console.error('ANCHOR x' + hits + ': ' + find.slice(0, 70)); process.exit(1); }
  s = s.replace(find, repl);
}

sub(`  binary:function(){`,
`  binaryProfile:function(mid){
    if(!glOK||!BINARY[mid]) return null;
    var b=BINARY[mid], A=byId[mid], iB=STARB_INDEX[mid];
    if(!A||!A.pos||iB===undefined||!pts) return null;
    var arr=pts.geometry.attributes.position.array;
    var pB=new THREE.Vector3(arr[iB*3],arr[iB*3+1],arr[iB*3+2]);
    var w=renderer.domElement.clientWidth, h=renderer.domElement.clientHeight;
    function sc(p){ var v=p.clone().project(camera);
      return {x:(v.x*0.5+0.5)*w, y:(-v.y*0.5+0.5)*h}; }
    var a=sc(A.pos), c=sc(pB);
    var g=renderer.getContext(), ratio=renderer.getPixelRatio();
    var cw=renderer.domElement.width, ch=renderer.domElement.height;
    /* walk from a little before A to a little past B */
    var N=121, out=[], EXT=0.22;
    for(var i=0;i<N;i++){
      var t=-EXT+(1+2*EXT)*(i/(N-1));
      var px=Math.round((a.x+(c.x-a.x)*t)*ratio);
      var py=Math.round((a.y+(c.y-a.y)*t)*ratio);
      if(px<0||py<0||px>=cw||py>=ch){ out.push(0); continue; }
      var buf=new Uint8Array(4);
      g.readPixels(px, ch-py, 1, 1, g.RGBA, g.UNSIGNED_BYTE, buf);
      out.push(Math.round(255-(buf[0]*0.299+buf[1]*0.587+buf[2]*0.114)));
    }
    /* the two stars sit at t=0 and t=1 of the walk */
    var iA=Math.round((0+EXT)/(1+2*EXT)*(N-1));
    var iBx=Math.round((1+EXT)/(1+2*EXT)*(N-1));
    function localMax(c0){ var m=0;
      for(var k=Math.max(0,c0-7);k<=Math.min(N-1,c0+7);k++) if(out[k]>m) m=out[k];
      return m; }
    var peakA=localMax(iA), peakB=localMax(iBx), trough=1e9;
    for(var q=iA+8;q<=iBx-8;q++) if(out[q]<trough) trough=out[q];
    if(trough===1e9) trough=Math.min(peakA,peakB);
    return { samples:out, peakA:peakA, peakB:peakB, trough:trough,
             sepPx:Math.round(Math.sqrt(Math.pow(a.x-c.x,2)+Math.pow(a.y-c.y,2))),
             /* separated when the dip falls well below the weaker star */
             separated:(trough < Math.min(peakA,peakB)*0.62),
             bothVisible:(peakA>18 && peakB>18) };
  },
  binary:function(){`);

fs.writeFileSync(F, s, 'utf8');
console.log('binaryProfile() added');
