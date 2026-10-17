# post-process lib.json: skirt waist widths, pelvis top, hollow-fill (NICKI-4), skin base colours
import json,numpy as np
from PIL import Image
J=json.load(open('lib/lib.json'));L=J['lib']
def topw(f,rows=14):
    a=np.asarray(Image.open('lib/'+f).convert('RGBA'))[...,3]>128
    seg=a[2:2+rows].any(0);xs=np.where(seg)[0];return int(xs.min()),int(xs.max())
for sh,ents in L.items():
    for k,e in ents.items():
        n=k.split(' · ')[-1]
        if n in('skF','sk34','skB','mskF','msk34','mskB','dskF','dskB','mdskF','mdskB'):
            x0,x1=topw(e['f']);e['tx0']=x0;e['tx1']=x1
p=L['BODY-M-A']['pelvis'];x0,x1=topw(p['f']);J['defs']['pelvisTop']=[x0,x1,p['w']]
def fill(sheet,keys,rt,rb):
    for k,e in L[sheet].items():
        if k.split(' · ')[-1] not in keys: continue
        a=np.array(Image.open('lib/'+e['f']).convert('RGBA'));h=a.shape[0]
        m=np.zeros(a.shape[:2],bool)
        if rt:m[:rt]=True
        if rb:m[h-rb:]=True
        inter=(a[...,1]<95)&(a[...,0]>140)&(a[...,3]>0)&m
        surf=(a[...,3]>200)&~inter&m
        c=np.median(a[surf][:,:3],axis=0) if surf.any() else np.array([250,130,180])
        a[inter,:3]=(c*0.93).astype('uint8')
        Image.fromarray(a).save('lib/'+e['f'])
fill('NICKI-4-BOTTOM',('thigh','thighB','shin','shinB'),52,52)
fill('NICKI-4-BOTTOM',('pelvis','pelvis34','pelvisB'),0,95)
sb={}
for t in 'LMD':
    a=np.asarray(Image.open('lib/'+L[f'BODY-{t}-A']['torso']['f']).convert('RGBA')).astype(float)
    m=a[...,3]>200;sb[t]=[round(float(x),1) for x in a[m][:,:3].mean(0)]
J['skinBase']=sb
json.dump(J,open('lib/lib.json','w'));print('skinBase',sb)
