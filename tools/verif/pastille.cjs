const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
for(const [w,h,t] of [[390,844,'m'],[1366,768,'d']]){const p=await (await b.newContext({viewport:{width:w,height:h},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(700);await p.click('#rec');
for(const s of [1.5,4,7,13]){await p.waitForTimeout(s===1.5?1500:(s===4?2500:s===7?3000:6000));await p.screenshot({path:`pas-${t}-${s}.png`});}
console.log(t,'pastille:',await p.$eval('#mini',e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return Math.round(r.top)+'px opacité '+c.opacity+' z '+c.zIndex+' '+e.innerText.replace(/\s+/g,' ');}),'erreurs',errs);
await p.waitForTimeout(6000);console.log(t,'après l’animation :',await p.$eval('#mini',e=>getComputedStyle(e).opacity),'classe linkfx',await p.evaluate(()=>document.body.classList.contains('linkfx')));}
await b.close();})();
