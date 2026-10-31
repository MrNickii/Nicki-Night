import json, os, math
from PIL import Image
LIBD='/tmp/claude-0/-home-claude/932a9474-b5a9-51c3-b72c-125d04efc675/scratchpad/rig8/lib/'
LIB=json.load(open(LIBD+'lib.json'))
L=LIB['lib']
def ent(sheet,key,v=None):
    s=L.get(sheet) or {}
    return s.get((v+' · '+key) if v else key)
# ---- the first quarter of the wardrobe ----
TOPS={'tee':('TOP-SLEEVED-1','A'),'croptop':('TOP-SLEEVED-1','B'),'hoodie':('TOP-SLEEVED-2','A'),'cropbomber':('TOP-SLEEVED-3','A'),
 'tank':('TOP-SLEEVELESS-1','A'),'halter':('TOP-SLEEVELESS-1','B'),'corset':('TOP-SLEEVELESS-2','A'),'bodysuit':('TOP-SLEEVELESS-3','A'),
 'denimtrucker':('TOP-SLEEVED-5','A'),'pinkfriday':('SIG-TOP-1','A'),'queen':('SIG-TOP-1','B'),'barbtee':('SIG-TOP-4','A'),'varsity':('SIG-TOP-5','A'),
 'bomber':('SIG-TOP-5','B'),'nickitee':('SIG-TOP-7','A'),'velourtrack':('SIG-TOP-12','B'),
 'slipdress':('DRESS-1',None),'bodycon':('DRESS-2',None),'skater':('DRESS-3',None),'satindress':('DRESS-4',None),'tennisdress':('DRESS-6',None),'babydoll':('DRESS-8',None)}
for i in range(1,7): TOPS['nicki' if i==1 else 'nicki%d'%i]=('NICKI-%d-TOP'%i,None)
BOTS={'jeans':('BOTTOM-PANTS-1',None),'cargo':('BOTTOM-PANTS-2',None),'joggers':('BOTTOM-PANTS-4',None),'leathertrousers':('BOTTOM-PANTS-6',None),
 'cutoffs':('BOTTOM-SHORTS-1',None),'bikers':('BOTTOM-SHORTS-2',None),'miniskirt':('BOTTOM-SKIRTS-1','A'),'pleated':('BOTTOM-SKIRTS-2','A')}
for i in range(1,7): BOTS['nickiB%d'%i]=('NICKI-%d-BOTTOM'%i,None)
SHOES={'sneakers':('SHOES-1','A',None),'chunky':('SHOES-1','B',None),'ankle':('SHOES-1','C',None),'combat':('SHOES-2','A',None),'heels':('SHOES-2','B',None),
 'boots':('SHOES-2','C',('SHOES-3','A')),'courtlowtops':('SHOES-7','A',None),'cloudslides':('SHOES-4','C',None)}
HAIR={'long':('HAIR-1','A'),'wavy':('HAIR-1','B'),'bob':('HAIR-2','A'),'ponytail':('HAIR-2','B'),'buns':('HAIR-3','A'),'fade':('HAIR-3','B'),
 'locs':('HAIR-6','B'),'afro':('HAIR-7','A'),'boxbraids':('HAIR-7','B'),'puffs':('HAIR-8','B')}
ACCH={'shades':('ACC-HEAD','SHADES','face'),'heartshades':('ACC-HEAD','HEART_SHADES','face'),'cap':('ACC-HEAD','BASEBALL_CAP','head'),'beanie':('ACC-HEAD','BEANIE','head'),
 'headphones':('ACC-HEAD','HEADPHONES','head'),'hoops':('ACC-HEAD','HOOP_EARRINGS','ears'),'crown':('ACC-SPECIAL','CROWN','head'),'visor':('ACC-SPECIAL','GOLD_VISOR','face')}
ACCN={'chain':('ACC-BODY','NECKLACE'),'pearls':('ACC-BODY','PEARLS'),'choker':('ACC-BODY','CHOKER')}
pieces={}   # key -> dict(file, ox, oy, w, h, mode)
def add(e, mode, extra=None):
    if not e: return None
    k=e['f'][:-4]
    if k not in pieces:
        d={'file':e['f'],'ox':float(e.get('ox',0)),'oy':float(e.get('oy',0)),'w':e['w'],'h':e['h'],'mode':mode}
        for a in ('ank','ball','slot','tx0','tx1'):
            if a in e: d[a]=e[a]
        if extra: d.update(extra)
        pieces[k]=d
    return k
items={'tops':{},'bottoms':{},'shoes':{},'hair':{},'acc':{}}
for iid,(sh,v) in TOPS.items():
    r={}
    for p in ('torso','torsoB','sleeveU','sleeveF','dskF','dskB','mdskF','mdskB'):
        k=add(ent(sh,p,v),'g')
        if k: r[p]=k
    items['tops'][iid]=r
for iid,(sh,v) in BOTS.items():
    r={}
    for p in ('pelvis','pelvisB','thigh','thighB','shin','shinB','skF','skB','mskF','mskB'):
        k=add(ent(sh,p,v),'g')
        if k: r[p]=k
    items['bottoms'][iid]=r
for iid,(sh,v,shaft) in SHOES.items():
    r={}
    for p in ('shoeF','shoeS','shoeB'):
        k=add(ent(sh,p,v),'g')
        if k: r[p]=k
    if shaft:
        for p in ('shaft','shaftB'):
            k=add(ent(shaft[0],p,shaft[1]),'g')
            if k: r[p]=k
    items['shoes'][iid]=r
for iid,(sh,v) in HAIR.items():
    items['hair'][iid]={p:add(ent(sh,p,v),'g') for p in ('hairF','hairB')}
for iid,(sh,key,slot) in ACCH.items():
    items['acc'][iid]={'slot':slot,'img':add(ent(sh,key),'g')}
for iid,(sh,key) in ACCN.items():
    items['acc'][iid]={'slot':'neck','img':add(ent(sh,key),'g')}
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
    if k.startswith('BODY-'): return False
    if k.startswith(SIGPREF): return False
    return True
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
    d['tint']=is_tint(k)
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
    p.save('/tmp/work/v3d/out/atlas%d.png'%i, optimize=True)
meta={'scale':SC,'page':PAGE,'pages':len(pages),'pieces':pieces,'items':items,'skin':skin,'side':side,'defs':LIB['defs'],'skinBase':LIB['skinBase'],'libscale':LIB['scale']}
json.dump(meta,open('/tmp/work/v3d/out/atlas.json','w'),separators=(',',':'))
print('pieces',len(pieces),'pages',len(pages),'last y',cy+rowh)
