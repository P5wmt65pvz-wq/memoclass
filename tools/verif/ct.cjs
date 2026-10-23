const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h] of [[390,844],[1366,768],[1920,1080]]){const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(600);
const r=await p.$eval('#rec',e=>{const r=e.getBoundingClientRect(),c=e.closest('.studio').getBoundingClientRect();return [Math.round(r.left+r.width/2),Math.round(c.left+c.width/2)]});
console.log(w,'bouton',r[0],'carte',r[1],r[0]===r[1]?'centré':'PAS centré',errs);await p.close();}
await b.close();})();
