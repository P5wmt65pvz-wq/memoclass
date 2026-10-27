// Panneau « Verre liquide » des Réglages : teinte au minimum par défaut (glace transparente), curseurs en direct,
// 🎲 Au hasard, Valeurs d'origine, réglages gardés après rechargement ; cartes de Mes cours en cascade.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=process.argv[2]||'http://localhost:8131/index.html';
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs=[];
  for(const [w,h,tag] of [[390,844,'m'],[1366,768,'d']]){
    const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e));p.on('console',m=>{if(m.type()==='error'&&!/favicon|404|paper-design|WebGL/.test(m.text()))errs.push(tag+': '+m.text())});
    await p.goto(URL);await p.waitForTimeout(1200);
    const v0=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return [s.getPropertyValue('--lg-t1').trim(),s.getPropertyValue('--lg-blur').trim(),getComputedStyle(document.querySelector('.head')).backgroundImage.slice(0,80)];});
    console.log(tag,'par défaut',v0);if(v0[0]!=='0.012'||v0[1]!=='4px')errs.push(tag+': teinte/flou par défaut '+v0);
    await p.screenshot({path:'verre-'+tag+'-clair.png'});
    await p.click('#open-settings');await p.waitForTimeout(600);
    await p.locator('#lg-tint').scrollIntoViewIfNeeded();
    // curseur Teinte au maximum, en direct
    await p.evaluate(()=>{const i=document.getElementById('lg-tint');i.value=.8;i.dispatchEvent(new Event('input',{bubbles:true}));});
    await p.waitForTimeout(300);
    const t1=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--lg-t1').trim());
    console.log(tag,'teinte max',t1);if(t1!=='0.412')errs.push(tag+': teinte pas appliquée '+t1);
    // effet loupe + ondulation : le verre est recalculé (Chrome)
    const before=await p.evaluate(()=>document.querySelector('.head').style.backdropFilter);
    await p.evaluate(()=>{const i=document.getElementById('lg-ripple');i.value=.9;i.dispatchEvent(new Event('input',{bubbles:true}));const k=document.getElementById('lg-warp');k.checked=true;k.dispatchEvent(new Event('change',{bubbles:true}));});
    await p.waitForTimeout(900);
    const lg=await p.evaluate(()=>[window.LG.ripple,window.LG.warp,document.querySelector('.head').dataset.lg]);
    console.log(tag,'ondulation/loupe',lg,'verre avant',before.slice(0,30));if(lg[0]!==.9||lg[1]!==true||!lg[2])errs.push(tag+': réfraction pas recalculée '+lg);
    await p.screenshot({path:'verre-'+tag+'-reglages.png'});
    // 🎲
    await p.locator('#lg-rand').scrollIntoViewIfNeeded();await p.click('#lg-rand');await p.waitForTimeout(500);
    const r=await p.evaluate(()=>JSON.parse(localStorage.getItem('memovox.reglages')).lg);
    console.log(tag,'au hasard',JSON.stringify(r));if(!(r.tint<=.3&&r.blur>=1&&r.blur<=10))errs.push(tag+': hasard hors limites');
    const sl=await p.evaluate(()=>+document.getElementById('lg-blur').value);if(Math.abs(sl-r.blur)>.26)errs.push(tag+': curseur pas mis à jour');
    // rechargement : réglage gardé
    await p.reload();await p.waitForTimeout(900);
    const kept=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--lg-blur').trim());
    if(kept!==r.blur+'px')errs.push(tag+': réglage pas gardé '+kept);
    // valeurs d'origine
    await p.click('#open-settings');await p.waitForTimeout(600);await p.locator('#lg-reset').scrollIntoViewIfNeeded();await p.click('#lg-reset');await p.waitForTimeout(400);
    const z=await p.evaluate(()=>{const s=getComputedStyle(document.documentElement);return [s.getPropertyValue('--lg-t1').trim(),s.getPropertyValue('--lg-blur').trim(),document.getElementById('lg-tint').value,document.getElementById('lg-warp').checked];});
    console.log(tag,"valeurs d'origine",z);if(z.join()!=='0.012,4px,0,false')errs.push(tag+': retour aux valeurs d\'origine raté '+z);
    await p.keyboard.press('Escape');await p.waitForTimeout(500);
    // cascade des cartes
    await p.evaluate(()=>new Promise(ok=>{const r=indexedDB.open('memovox',2);r.onsuccess=()=>{const t=r.result.transaction('cours','readwrite');const st=t.objectStore('cours');for(let i=0;i<4;i++)st.put({id:String(2e12+i),title:'Cours '+i,subject:'Histoire',date:Date.now()-i*864e5,duration:60000,mime:'audio/webm',blob:new Blob([new Uint8Array(10)],{type:'audio/webm'}),transcript:'',docs:[]});t.oncomplete=ok;};}));
    const casc=await p.evaluate(()=>new Promise(ok=>{document.getElementById('tab-cours').click();setTimeout(()=>ok([...document.querySelectorAll('.course')].map(e=>e.classList.contains('rise')?e.style.getPropertyValue('--d'):'-')),120);}));
    console.log(tag,'cascade',casc);if(casc.length<4||casc[1]!=='45ms')errs.push(tag+': pas de cascade '+casc);
    await p.waitForTimeout(900);
    const done=await p.evaluate(()=>document.querySelectorAll('.course.rise').length);if(done)errs.push(tag+': cascade pas finie');
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push(tag+': débordement '+ov);
    await c.close();
  }
  await b.close();console.log('erreurs',errs);
})();
