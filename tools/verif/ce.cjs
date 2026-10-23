const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const [w,h]=(process.argv[2]||'390x844').split('x').map(Number),tag=process.argv[3]||'a';
const p=await (await b.newContext({viewport:{width:w,height:h},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(700);await p.screenshot({path:`ce-${tag}-0.png`});
await p.click('#rec');await p.waitForTimeout(400);await p.mouse.click(5,5);await p.waitForTimeout(2500);await p.screenshot({path:`ce-${tag}-1.png`});
await p.click('#stop');
for(let i=0;i<4;i++){await p.waitForTimeout(i==0?900:1000);await p.screenshot({path:`ce-${tag}-${2+i}.png`});}
await p.waitForTimeout(1500);console.log('fin',await p.$eval('#fin',d=>d.open),'erreurs',errs);await b.close();})();
