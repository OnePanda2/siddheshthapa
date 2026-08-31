import json,sys,math
def lab(rgb):
    r,g,b=[v/255.0 for v in rgb]
    def f(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    r,g,b=f(r),f(g),f(b)
    X=r*0.4124+g*0.3576+b*0.1805; Y=r*0.2126+g*0.7152+b*0.0722; Z=r*0.0193+g*0.1192+b*0.9505
    X/=0.95047; Z/=1.08883
    def h(t): return t**(1/3.0) if t>0.008856 else 7.787*t+16/116.0
    fx,fy,fz=h(X),h(Y),h(Z)
    return (116*fy-16,500*(fx-fy),200*(fy-fz))
def dE(a,b):
    la,lb=lab(a),lab(b)
    return math.sqrt(sum((la[t]-lb[t])**2 for t in range(3)))
d=json.load(sys.stdin)
ks=sorted([k for k in d if d[k]])
for k in ks: print('  %-12s %s'%(k,d[k]))
print()
ps=[]
for i,a in enumerate(ks):
    for b in ks[i+1:]:
        ps.append((dE(d[a],d[b]),a,b))
ps.sort()
print('pairwise deltaE (closest first):')
for e,a,b in ps[:12]: print('  %6.1f  %-12s %s'%(e,a,b))
