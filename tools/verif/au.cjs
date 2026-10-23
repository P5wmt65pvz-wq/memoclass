const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const p=await (await b.newContext({viewport:{width:1280,height:800},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.addInitScript(()=>{const O=window.AudioContext;window.AudioContext=function(){window.__n=(window.__n||0)+1;if(window.__n<2)return new O({sampleRate:48000,latencyHint:'playback'});window.__oac=new OfflineAudioContext(2,44100*20,44100);window.__oac.resume=()=>Promise.resolve();return window.__oac;};});
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(600);
await p.click('#rec');await p.waitForTimeout(800);
const res=await p.evaluate(async()=>{const buf=await window.__oac.startRendering();const d=buf.getChannelData(0),sr=buf.sampleRate,out=[];let pk=0;for(let s=0;s<20;s++){let m=0,r=0;for(let i=s*sr;i<(s+1)*sr&&i<d.length;i++){const v=Math.abs(d[i]);if(v>m)m=v;r+=v*v;}pk=Math.max(pk,m);out.push(m.toFixed(2)+'/'+Math.sqrt(r/sr).toFixed(3));}return {pk,out};});
console.log('pic',res.pk.toFixed(2));console.log(res.out.join(' '));console.log('erreurs',errs);await b.close();})();
