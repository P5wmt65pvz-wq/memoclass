const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-audio-capture='+process.argv[3]+'']});
const p=await (await b.newContext({viewport:{width:1280,height:800},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.addInitScript(()=>{try{localStorage.setItem('dictavox.hq','1');}catch(e){}window.webkitSpeechRecognition=window.SpeechRecognition=class{start(){}stop(){}};});
await p.goto('http://localhost:8131/index.html?whisper='+(process.argv[2]||'tiny'));await p.waitForTimeout(800);
console.log('gpu ?',await p.evaluate(()=>!!navigator.gpu));
await p.click('#rec');await p.waitForTimeout(500);await p.mouse.click(5,5);
const t0=Date.now();while(Date.now()-t0<91000){await p.waitForTimeout(15000);console.log(Math.round((Date.now()-t0)/1000)+'s',JSON.stringify((await p.textContent('#t-live').catch(()=>''))),'|',(await p.textContent('#t-body')).slice(-120));}
await p.click('#stop');
for(let i=0;i<40;i++){await p.waitForTimeout(3000);if(await p.evaluate(()=>document.getElementById('fin').open&&!/en cours/.test(document.getElementById('f-sum').textContent)))break;}
console.log('résumé',await p.textContent('#f-sum'));console.log('titre',await p.inputValue('#f-titre'),'|',await p.inputValue('#f-mat'));
const txt=await p.$eval('#f-txt',e=>e.textContent);require('fs').writeFileSync('live-out.txt',txt);console.log(txt);
console.log('erreurs',errs);await b.close();})();
