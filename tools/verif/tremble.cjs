const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const p=await (await b.newContext({viewport:{width:390,height:844},permissions:['microphone']})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8131/index.html');await p.waitForTimeout(700);
await p.click('#rec');await p.waitForTimeout(400);await p.mouse.click(5,5);await p.waitForTimeout(2500);
await p.click('#stop');
const log=await p.evaluate(()=>new Promise(ok=>{const out=[],t0=performance.now();(function f(){const t=(performance.now()-t0)/1000;out.push([t.toFixed(2),getComputedStyle(document.body).translate,document.getElementById('fin').open]);if(t<9)requestAnimationFrame(f);else ok(out);})();}));
const sh=log.filter(x=>x[1]!=='none');console.log('tremblement de',sh[0]&&sh[0][0],'à',sh.length&&sh[sh.length-1][0],'s ; carte ouverte à',(log.find(x=>x[2])||[])[0]);
console.log('erreurs',errs);await b.close();})();
