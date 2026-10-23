const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.addInitScript(()=>{try{localStorage.setItem('dictavox.hq','1');}catch(e){}});
await p.goto('http://localhost:8131/index.html?whisper=tiny');await p.waitForTimeout(800);
await p.click('#tab-cours');await p.waitForTimeout(300);
await p.setInputFiles('#imp-in',process.argv[2]);
await p.waitForTimeout(1500);
console.log('carte',await p.$eval('.course',e=>e.innerText.replace(/\n+/g,' | ').slice(0,300)));
console.log('copier audio proposé ?',!!(await p.$('text=Copier l’audio')));
await p.click('.player .btn');console.log('vitesse',await p.$eval('.player .btn',e=>e.textContent),await p.$eval('.player audio',e=>e.playbackRate));
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('text=Télécharger l’audio')]);console.log('téléchargé',dl.suggestedFilename());
await p.screenshot({path:'imp-1.png'});
for(let i=0;i<60;i++){await p.waitForTimeout(3000);const t=await p.$eval('.course',e=>e.innerText);if(/précis ✓/.test(t)||/impossible/.test(t))break;}
await p.waitForTimeout(800);
console.log('après',await p.$eval('.course',e=>e.innerText.replace(/\n+/g,' | ').slice(0,600)));
await p.screenshot({path:'imp-2.png'});
console.log('erreurs',errs);await b.close();})();
