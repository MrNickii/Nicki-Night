import json, os, math
from PIL import Image
LIBD='/tmp/claude-0/-home-claude/932a9474-b5a9-51c3-b72c-125d04efc675/scratchpad/rig8/lib/'
LIB=json.load(open(LIBD+'lib.json'))
L=LIB['lib']
def ent(sheet,key,v=None):
    s=L.get(sheet) or {}
    return s.get((v+' · '+key) if v else key)
# ---- the whole wardrobe, straight from the 2D catalog ----
CAT=json.load(open('/tmp/work/v3d/out/catalog.json'))
pieces={}
def add(e, mode, tint=False, extra=None):
    if not e: return None
    k=e['f'][:-4]
    if k not in pieces:
        d={'file':e['f'],'ox':float(e.get('ox',0)),'oy':float(e.get('oy',0)),'w':e['w'],'h':e['h'],'mode':mode,'tint':bool(tint)}
        for a in ('ank','ball','slot','tx0','tx1'):
            if a in e: d[a]=e[a]
        pieces[k]=d
    elif tint: pieces[k]['tint']=True
    return k
items={'tops':{},'bottoms':{},'shoes':{},'hair':{},'acc':{}}
for it in CAT['looks']:
    nk=it.get('nk'); sh=it['sheet']+('-TOP' if nk else ''); v=None if nk else it.get('v')
    tint=not (it.get('sig') or nk)
    r={}
    for p in ('torso','torsoB','sleeveU','sleeveF','dskF','dskB','mdskF','mdskB'):
        k=add(ent(sh,p,v),'g',tint)
        if k: r[p]=k
    if r: items['tops'][it['id']]=r
    if nk:
        n=it['sheet'].split('-')[1]; rb={}
        for p in ('pelvis','pelvisB','thigh','thighB','shin','shinB'):
            k=add(ent(it['sheet']+'-BOTTOM',p),'g',False)
            if k: rb[p]=k
        items['bottoms']['nickiB'+n]=rb
for it in CAT['bottoms']:
    tint=not it.get('fixed'); r={}
    for p in ('pelvis','pelvisB','thigh','thighB','shin','shinB','skF','skB','mskF','mskB'):
        k=add(ent(it['sheet'],p,it.get('v')),'g',tint)
        if k: r[p]=k
    if r: items['bottoms'][it['id']]=r
for it in CAT['shoes']:
    tint=not it.get('fixed'); r={}
    for p in ('shoeF','shoeS','shoeB'):
        k=add(ent(it['sheet'],p,it.get('v')),'g',tint)
        if k: r[p]=k
    sf=it.get('shaft')
    if sf:
        for p in ('shaft','shaftB'):
            k=add(ent(sf['sheet'],p,sf.get('v')),'g',True)
            if k: r[p]=k
    if r.get('shoeF'): items['shoes'][it['id']]=r
for it in CAT['hair']['styles']:
    r={p:add(ent(it['sheet'],p,it.get('v')),'g',True) for p in ('hairF','hairB')}
    if r['hairF'] and r['hairB']: items['hair'][it['id']]=r
BODYKEY={'HIPBAG':'HIP BAG'}
for it in CAT['accessories']['items']:
    slot=it['slot']; tint=not it.get('full')
    if slot in ('head','face','ears'): e=ent(it['sheet'],it['key'])
    elif slot in ('neck','waist','carry'): e=ent('ACC-BODY',BODYKEY.get(it['key'],it['key']))
    elif slot in ('wrist','arm'): e=ent('ACC-HANDS',it['key'])
    elif slot=='hands': e=ent('ACC-HANDS','NAILS_RELAXED')
    else: e=None
    k=add(e,'g',tint)
    if k: items['acc'][it['id']]={'slot':slot,'img':k}
skin={}
for t in 'LMD':
    for p in ('torso','pelvis','neck','uarm','farm','thigh','shin','hand_relax'):
        skin[t+':'+p]=add(ent('BODY-%s-A'%t,p),'s')
    for p in ('torsoB','pelvisB','neckB','thighB','shinB'):
        skin[t+':'+p]=add(ent('BODY-%s-C'%t,p),'s')
side={}
for p in ('torsoS','pelvisS'):
    side[p]=add(ent('BODY-M-B',p),'x')
# ---- process images ----
SC=0.5; PAD=3; PAGE=2048
def silhouette(im, step=3):
    a=im.split()[3]; W,H=im.size; px=a.load(); rows=[]
    for y in range(0,H,step):
        xl=-1;xr=-1
        for x in range(W):
            if px[x,y]>96:
                if xl<0: xl=x
                xr=x
        rows.append([y,xl,xr])
    if rows[-1][0]!=H-1:
        y=H-1;xl=-1;xr=-1
        for x in range(W):
            if px[x,y]>96:
                if xl<0: xl=x
                xr=x
        rows.append([y,xl,xr])
    return rows
def colsil(im, step=3):  # for side views of shoes: per row we already have; also per column extents
    return None
proc=[]
for k,d in pieces.items():
    im=Image.open(LIBD+d['file']).convert('RGBA')
    d['rows']=silhouette(im)
    if d['mode']=='x': continue
    if d['mode']=='g':
        # decide tintable later at runtime; store grey-normalised copy only for tintable families
        pass
    w=max(1,round(im.width*SC)); h=max(1,round(im.height*SC))
    proc.append((k,im,w,h))
# tintable families: anything except signature / nicki / fixed shoes; we store two variants when needed
SIGPREF=('SIG-TOP','NICKI-','ACC-SPECIAL')
FIXED_SHOES=set()
def is_tint(k):
    return bool(pieces[k].get('tint'))
def grey(im):
    px=im.load(); W,H=im.size; hist=[0]*256; cnt=0
    for y in range(H):
        for x in range(W):
            r,g,b,a=px[x,y]
            if a>128: hist[int(r*.3+g*.59+b*.11)]+=1; cnt+=1
    acc=0; ref=255
    for i in range(255,-1,-1):
        acc+=hist[i]
        if acc>=cnt*0.08: ref=max(60,i); break
    out=Image.new('RGBA',im.size)
    op=out.load()
    for y in range(H):
        for x in range(W):
            r,g,b,a=px[x,y]
            L=(r*.3+g*.59+b*.11)/ref
            v=int(max(0,min(1,L/1.28))*255+0.5)
            op[x,y]=(v,v,v,a)
    return out
# pack
proc.sort(key=lambda t:-t[3])
pages=[Image.new('RGBA',(PAGE,PAGE),(0,0,0,0))]
cx=PAD;cy=PAD;rowh=0;pg=0
for k,im,w,h in proc:
    d=pieces[k]
    src=grey(im) if is_tint(k) else im
    small=src.resize((w,h),Image.LANCZOS)
    if cx+w+PAD>PAGE: cx=PAD; cy+=rowh+PAD; rowh=0
    if cy+h+PAD>PAGE:
        pages.append(Image.new('RGBA',(PAGE,PAGE),(0,0,0,0))); pg+=1; cx=PAD; cy=PAD; rowh=0
    pages[pg].alpha_composite(small,(cx,cy))
    d['at']=[pg,cx,cy,w,h]
    cx+=w+PAD; rowh=max(rowh,h)
for i,p in enumerate(pages):
    # bleed colour into transparent pixels (premultiplied blur trick) to avoid dark mip fringes
    from PIL import ImageFilter
    p.save('/tmp/work/v3d/out/atlas%d.webp'%i, quality=92, method=4)
meta={'scale':SC,'page':PAGE,'pages':len(pages),'pieces':pieces,'items':items,'skin':skin,'side':side,'defs':LIB['defs'],'skinBase':LIB['skinBase'],'libscale':LIB['scale']}
json.dump(meta,open('/tmp/work/v3d/out/atlas.json','w'),separators=(',',':'))
print('pieces',len(pieces),'pages',len(pages),'last y',cy+rowh)
