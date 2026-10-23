const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const p=await (await b.newContext({viewport:{width:+process.argv[3]||390,height:+process.argv[4]||844},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(900);await p.click('#rec');const t0=Date.now();
const ts=(process.env.TS||"500,1500,2600,3600,4700,6200,6800,7500,8600,9300,9800,10600").split(",").map(Number);
for(let i=0;i<ts.length;i++){while(Date.now()-t0<ts[i])await p.waitForTimeout(20);await p.screenshot({path:`${process.argv[2]}-${i}.png`});}
await p.waitForTimeout(4000);
console.log('restant',await p.$$eval('.link-ov',x=>x.length),'chrono',await p.textContent('#timer'),'erreurs',errs);await b.close();})();
