import json,os,math
from PIL import Image
S='/tmp/claude-0/-home-claude/932a9474-b5a9-51c3-b72c-125d04efc675/scratchpad/'
os.chdir(S)
cat=json.load(open('lib2/catalog.json'))
old=json.load(open('png/parts7.json'))
OLD={'torso':'torso','pelvis':'pelvis','neck':'neck','uarm':'uarm','farm':'farm','thigh':'thigh','shin':'shin','hand_open':'hand_open','hand_relax':'hand_relax','fist':'fist','torso34':'torso34','pelvis34':'pelvis34','farmcam':'ffarm'}
# body key -> (body sheet suffix)
BS={'torso':'A','pelvis':'A','neck':'A','uarm':'A','farm':'A','thigh':'A','shin':'A','hand_open':'A','hand_relax':'A','fist':'A','torso34':'B','pelvis34':'B','farmcam':'B','torsoS':'B','pelvisS':'B','torsoB':'C','pelvisB':'C','neckB':'C','thighB':'C','shinB':'C'}
SK={'torsoB':'torso','torsoS':'torso','pelvisB':'pelvis','pelvisS':'pelvis','neckB':'neck','thighB':'thigh','shinB':'shin'}  # scale source key
GK={'sleeveU':'uarm','sleeveF':'farm','shaft':'shin','shaftB':'shinB'}   # garment key -> body key
def slotrel(sheet,key):
    p=cat[sheet]['parts'][key];return p['x']-p['sx0'],p['y']-p['sy0'],p['w'],p['h']
# body reference (M) bboxes and scales
ref={};scale={}
for k,b in BS.items():
    ref[k]=slotrel(f'BODY-M-{b}',k)
for k in ref:
    sk=SK.get(k,k);scale[k]=old[OLD[sk]]['h']/ref[sk][3]
# check tone geometry match
for t in 'DL':
    for k,b in BS.items():
        a=slotrel(f'BODY-{t}-{b}',k);m=ref[k]
        assert all(abs(a[i]-m[i])<=3 for i in range(4)),(t,k,a,m)
print('tone geometry ok')
os.makedirs('rig8/lib',exist_ok=True)
LIB={}
def save(sheet,key,im,ox,oy,extra=None):
    fn=f'rig8/lib/{sheet}__{key}.png'.replace(' ','').replace('·','_');im.save(fn,optimize=True)
    d=dict(f=fn[9:],ox=round(ox,2),oy=round(oy,2),w=im.width,h=im.height)
    if extra:d.update(extra)
    LIB.setdefault(sheet,{})[key]=d
FRONT_BODYKEYS=set(BS)
for sheet,c in cat.items():
    for key,p in c['parts'].items():
        k=key.split(' · ')[-1]
        im=Image.open(p['file']).convert('RGBA')
        sx,sy,w,h=p['x']-p['sx0'],p['y']-p['sy0'],p['w'],p['h']
        if sheet.startswith('BODY') or k in BS or k in GK:
            bk=GK.get(k,k)
            if bk not in ref: # e.g. unknown
                continue
            s=scale[bk];rx,ry,_,_=ref[bk]
            ox=(sx-rx)*s;oy=(sy-ry)*s
            im2=im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS)
            save(sheet,key,im2,ox,oy)
        elif sheet=='ACC-HANDS' and key in ('NAILS_OPEN','NAILS_RELAXED','NAILS_FIST'):
            bk={'NAILS_OPEN':'hand_open','NAILS_RELAXED':'hand_relax','NAILS_FIST':'fist'}[key]
            hp=cat['BODY-M-A']['parts'][bk];hsw=hp['sx1']-hp['sx0'];nsw=p['sx1']-p['sx0']
            s=scale[bk];rx,ry,_,_=ref[bk]
            ox=((sx-nsw/2)-(rx-hsw/2))*s;oy=(sy-ry)*s
            save(sheet,key,im.resize((max(1,round(w*s)),max(1,round(h*s))),Image.LANCZOS),ox,oy)
        elif k.startswith('shoe'):
            pass
        elif sheet.startswith('HAIR'):
            save(sheet,key,im,sx,sy,{'slot':[p['sx1']-p['sx0'],p['sy1']-p['sy0']]})
        else:
            save(sheet,key,im,sx,sy,{'slot':[p['sx1']-p['sx0'],p['sy1']-p['sy0']]})
# shoes: one global scale from classic high-top views
sc=[]
for k,o in (('shoe34','shoeA'),('shoeS','shoeS'),('shoeF','shoeF'),('shoeB','shoeB')):
    p=cat['SHOES-1']['parts']['A · '+k];sc.append(old[o]['w']/p['w'])
ss=sum(sc)/len(sc);print('shoe scale',sc,ss)
FR={'shoe34':'shoeA','shoeS':'shoeS','shoeF':'shoeF','shoeB':'shoeB'}
for sheet in ('SHOES-1','SHOES-2'):
    for key,p in cat[sheet]['parts'].items():
        v,k=key.split(' · ');o=old[FR[k]]
        im=Image.open(p['file']).convert('RGBA');w,h=round(p['w']*ss),round(p['h']*ss)
        im=im.resize((w,h),Image.LANCZOS)
        save(sheet,key,im,0,0,{'ank':[o['ank'][0]/o['w']*w,o['ank'][1]/o['h']*h],'ball':[o['ball'][0]/o['w']*w,o['ball'][1]/o['h']*h]})
defs={}
for k,ok in OLD.items():
    o=old[ok];s=scale[k];w=ref[k][2]*s
    d=dict(w=round(o['w']),h=round(o['h']),piv=[o['piv'][0]/o['w']*ref[k][2]*s if False else o['piv'][0],o['piv'][1]])
    if 'bone' in o:d['bone']=o['bone']
    defs[k]=d
# real widths from new art
for k in defs: defs[k]['w']=round(ref[k][2]*scale[k]);defs[k]['h']=round(ref[k][3]*scale[k])
# keep old pivot x as fraction of old width
for k,ok in OLD.items():
    o=old[ok];defs[k]['piv']=[o['piv'][0]/o['w']*defs[k]['w'],o['piv'][1]]
    if 'bone' in o:defs[k]['bone']=[o['bone'][0]/o['w']*defs[k]['w'],o['bone'][1]]
for k in BS:
    if k not in defs:
        b=SK.get(k,k);defs[k]=dict(defs[b]);defs[k]['w']=round(ref[k][2]*scale[k]);defs[k]['h']=round(ref[k][3]*scale[k]);defs[k]['piv']=[old[OLD[b]]['piv'][0]/old[OLD[b]]['w']*defs[k]['w'],old[OLD[b]]['piv'][1]]
json.dump(dict(lib=LIB,defs=defs,scale=scale,hairdisc=[145,180]),open('rig8/lib/lib.json','w'))
print(len(LIB),sum(len(v) for v in LIB.values()),'layers');print({k:(round(v,3)) for k,v in scale.items()})
