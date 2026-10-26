// rend les deux bandes-son hors ligne avec le vrai code du site, mesure le volume et enregistre des .wav pour écoute
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(600);
for(const [name,fn,len] of [['debut','mvFxStart',19],['fin','mvFxEnd',10]]){
 const r=await p.evaluate(async([fn,len])=>{const ac=new OfflineAudioContext(2,44100*len,44100);window[fn](ac,0);const buf=await ac.startRendering();
  const L=buf.getChannelData(0),R=buf.getChannelData(1),sr=44100,out=[];let pk=0,tot=0;for(let s=0;s<len;s++){let m=0,q=0;for(let i=s*sr;i<(s+1)*sr;i++){const v=Math.max(Math.abs(L[i]),Math.abs(R[i]));if(v>m)m=v;q+=L[i]*L[i];}pk=Math.max(pk,m);tot+=q;out.push((20*Math.log10(m+1e-9)).toFixed(0)+'/'+(10*Math.log10(q/sr+1e-12)).toFixed(0));}
  const i16=new Int16Array(L.length*2);for(let i=0;i<L.length;i++){i16[2*i]=Math.max(-32767,Math.min(32767,L[i]*32767));i16[2*i+1]=Math.max(-32767,Math.min(32767,R[i]*32767));}
  return {pk:20*Math.log10(pk),rms:10*Math.log10(tot/(sr*len)),out,pcm:Array.from(new Uint8Array(i16.buffer))};},[fn,len]);
 console.log(name,'pic',r.pk.toFixed(1),'dB · moyenne',r.rms.toFixed(1),'dB');console.log('  par seconde (pic/moyenne dB):',r.out.join(' '));
 const pcm=Buffer.from(r.pcm),h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(44100,24);h.writeUInt32LE(44100*4,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
 fs.writeFileSync('son-'+name+'.wav',Buffer.concat([h,pcm]));}
console.log('erreurs',errs);await b.close();})();
