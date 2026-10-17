import json,os,shutil
from PIL import Image
J=json.load(open('lib/lib.json'))
for name,q,ql in (('lo',0.4,88),('mid',0.6,89),('hi',1.0,90)):
    out=f'dist/lib_{name}';shutil.rmtree(out,ignore_errors=True);os.makedirs(out)
    K=json.loads(json.dumps(J));K['q']=q
    tot=0
    for sh,ents in K['lib'].items():
        for k,e in ents.items():
            im=Image.open('lib/'+e['f']).convert('RGBA')
            if q!=1: im=im.resize((max(1,round(im.width*q)),max(1,round(im.height*q))),Image.LANCZOS)
            fn=e['f'].replace('.png','.webp');im.save(f'{out}/{fn}','WEBP',quality=ql,method=4);e['f']=fn;tot+=os.path.getsize(f'{out}/{fn}')
    json.dump(K,open(f'{out}/lib.json','w'),separators=(',',':'))
    print(name,round(tot/1e6,1),'MB')
