// Logo en métal liquide, appui sur les boutons, fenêtre Réglages (ouverture + vraie sortie), « réduire les animations »
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL='http://localhost:8131/index.html';
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const errs=[];
  for(const [w,h] of [[390,844],[1366,768]]){
    const p=await b.newPage({viewport:{width:w,height:h}});
    p.on('pageerror',e=>errs.push(w+': '+e));p.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push(w+': '+m.text())});
    await p.goto(URL);
    await p.waitForFunction("document.querySelector('.logo').classList.contains('metal')",null,{timeout:40000}).catch(()=>errs.push(w+': logo métal absent'));
    const r=await p.evaluate(()=>{const a=document.querySelector('.logo .lm').getBoundingClientRect(),m=document.querySelector('.logo svg.mark').getBoundingClientRect();return [Math.round(a.x-m.x),Math.round(a.y-m.y),Math.round(a.width),Math.round(a.height)];});
    console.log(w,'logo métal décalage/taille',r);await p.locator('.logo').screenshot({path:'test-logo-'+w+'.png'});if(r.join()!=='0,0,34,34')errs.push(w+': logo métal mal placé '+r);
    // appui : rétrécit dès l'appui
    const bt=p.locator('#open-settings');const bb=await bt.boundingBox();
    await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(400);   // carte graphique simulée : les images sont lentes
    const sc=await bt.evaluate(e=>{e.style.transition='none';const t=getComputedStyle(e).transform;e.style.transition='';return t+' '+e.className;});   // valeur visée (la carte graphique simulée rend les transitions très lentes)await p.mouse.up();
    console.log(w,'appui',sc);if(!/^matrix\(0\.97/.test(sc))errs.push(w+': pas de réaction à l\'appui '+sc);
    await p.waitForTimeout(400);
    await p.evaluate(()=>{const d=document.getElementById('settings');if(!d.open)document.getElementById('open-settings').click();});await p.waitForTimeout(800);
    const open=await p.evaluate(()=>document.getElementById('settings').open);if(!open)errs.push(w+': réglages pas ouverts');
    await p.evaluate(()=>document.getElementById('settings').close());
    await p.waitForTimeout(40);
    const mid=await p.evaluate(()=>{const d=document.getElementById('settings');return [getComputedStyle(d).display,+getComputedStyle(d).opacity];});
    await p.waitForTimeout(3500);   // avec la carte graphique simulée, une image peut prendre 1 s
    const end=await p.evaluate(()=>getComputedStyle(document.getElementById('settings')).display);
    console.log(w,'fermeture : pendant',mid,'après',end);
    if(mid[0]==='none')errs.push(w+': pas de sortie animée '+mid);if(end!=='none')errs.push(w+': fenêtre pas refermée');
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push(w+': débordement '+ov);
    await p.close();
  }
  const c=await b.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});const p=await c.newPage();
  await p.goto(URL);await p.waitForTimeout(3000);
  const st=await p.evaluate(()=>[document.querySelector('.logo').classList.contains('metal'),!!document.querySelector('.logo .lm'),getComputedStyle(document.querySelector('.logo svg.mark')).opacity]);
  console.log('réduire les animations : métal',st);if(st[0]||st[1]||st[2]!=='1')errs.push('réduit : le logo dessiné doit rester');
  const bt=p.locator('#open-settings');const bb=await bt.boundingBox();await p.mouse.move(bb.x+20,bb.y+20);await p.mouse.down();await p.waitForTimeout(150);
  const o=await bt.evaluate(e=>[getComputedStyle(e).transform,getComputedStyle(e).opacity]);await p.mouse.up();
  console.log('réduit, appui',o);if(o[0]!=='none'||+o[1]>.8)errs.push('réduit : appui sans retour visible '+o);
  await b.close();console.log('erreurs',errs);
})();
