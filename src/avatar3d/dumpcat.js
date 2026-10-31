const vm=require('vm'),fs=require('fs');const ctx={window:{},document:{createElement:()=>({getContext:()=>({})})},console,Image:function(){},navigator:{}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['rig8.js','vnn-avatar.js'])vm.runInContext(fs.readFileSync('/tmp/work/Nicki-Night/site/vnn/'+f,'utf8'),ctx);
const C=vm.runInContext('VNNA.CATALOG',ctx);fs.writeFileSync('out/catalog.json',JSON.stringify(C));
console.log(C.looks.length,C.bottoms.length,C.shoes.length,C.hair.styles.length,C.accessories.items.length);
console.log(JSON.stringify(C.accessories.items.filter(a=>!['head','face','ears'].includes(a.slot)).map(a=>[a.id,a.slot,a.key,a.sheet])));
