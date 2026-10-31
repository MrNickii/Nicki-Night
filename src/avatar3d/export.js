const {chromium}=require('/opt/node-tools/node_modules/playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8301/export.html');await p.waitForFunction(()=>window.OUT,null,{timeout:300000});
const o=await p.evaluate(()=>window.OUT);
const meta={bones:o.bones,hipsParents:o.hipsParents,clips:{}};const bufs=[];let off=0;
for(const [k,c] of Object.entries(o.clips)){const a=Int16Array.from(c.q);bufs.push(Buffer.from(a.buffer));meta.clips[k]={n:c.n,fps:c.fps,dur:c.dur,bones:c.bones,off:off,len:a.length,hp:c.hp};off+=a.length*2;console.log(k,c.n,c.dur.toFixed(2),c.tracks);}
fs.writeFileSync('out/clips.bin',Buffer.concat(bufs));fs.writeFileSync('out/rig.json',JSON.stringify(meta));console.log(JSON.stringify(o.bones.slice(0,8)));console.log(JSON.stringify(o.hipsParents));
await b.close()})();
