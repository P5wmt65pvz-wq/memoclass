// Finitions « Apple » : barre du haut qui reste (compacte au défilement), pastille des onglets qui glisse,
// Réglages en feuille du bas sur téléphone (fermeture en tirant), cartes de Mes cours qui s'ouvrent ET se referment.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=process.argv[2]||'http://localhost:8131/index.html';
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const errs=[];
  for(const [w,h,tag] of [[390,844,'m'],[1366,768,'d']]){
    const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<600});const p=await c.newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e));p.on('console',m=>{if(m.type()==='error'&&!/favicon|404|paper-design|WebGL/.test(m.text()))errs.push(tag+': '+m.text())});
    await p.goto(URL);await p.waitForTimeout(900);
    // faux cours pour Mes cours
    await p.evaluate(()=>new Promise(ok=>{const r=indexedDB.open('memovox',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('cours'))d.createObjectStore('cours',{keyPath:'id'});if(!d.objectStoreNames.contains('brouillon'))d.createObjectStore('brouillon',{autoIncrement:true});};
      r.onsuccess=()=>{const t=r.result.transaction('cours','readwrite');const st=t.objectStore('cours');for(let i=0;i<6;i++)st.put({id:String(1e12+i),title:'Cours '+(i+1)+' : la Révolution française',subject:i%2?'Histoire':'Français',date:Date.now()-i*864e5,duration:1800000,mime:'audio/webm',blob:new Blob([new Uint8Array(2000)],{type:'audio/webm'}),transcript:'Bonjour à tous. '.repeat(30),docs:[]});t.oncomplete=ok;};}));
    // pastille des onglets
    const ind0=await p.evaluate(()=>{const i=document.querySelector('.tab-ind').getBoundingClientRect(),t=document.getElementById('tab-studio').getBoundingClientRect();return [Math.round(i.left-t.left),Math.round(i.width-t.width)];});
    if(ind0.join()!=='0,0')errs.push(tag+': pastille pas sous Studio '+ind0);
    const mid=await p.evaluate(()=>new Promise(ok=>{const i=document.querySelector('.tab-ind'),xs=[];document.getElementById('tab-cours').click();const t0=performance.now();
      (function f(){xs.push(i.getBoundingClientRect().left);if(performance.now()-t0<700)requestAnimationFrame(f);else ok(xs.filter((x,k)=>k>0&&k<xs.length-1&&x!==xs[0]&&x!==xs[xs.length-1]).length);})();}));   // nombre d'images intermédiaires
    await p.waitForTimeout(500);   // laisser finir la glissade (images lentes sans carte graphique)
    const ind1=await p.evaluate(()=>{const i=document.querySelector('.tab-ind').getBoundingClientRect(),t=document.getElementById('tab-cours').getBoundingClientRect(),s=document.getElementById('tab-studio').getBoundingClientRect();return [Math.round(i.left-t.left),Math.round(i.width-t.width),Math.round(s.left)];});
    console.log(tag,'pastille : studio',ind0,'images intermédiaires',mid,'fin',ind1);
    if(Math.abs(ind1[0])>1||Math.abs(ind1[1])>1)errs.push(tag+': pastille pas sous Mes cours '+ind1);
    if(mid<3)errs.push(tag+': la pastille ne glisse pas');
    await p.screenshot({path:'apple-'+tag+'-cours.png'});
    // cartes : la 1re est ouverte ; on la referme puis on rouvre la 2e
    const card=p.locator('.course').first();
    const hOpen=await card.evaluate(e=>e.offsetHeight);
    await card.locator('.c-row').click();await p.waitForTimeout(700);
    const hClosed=await card.evaluate(e=>[e.offsetHeight,e.querySelector('.c-wrap').inert]);
    console.log(tag,'carte ouverte',hOpen,'refermée',hClosed);
    if(!(hClosed[0]<hOpen-60)||!hClosed[1])errs.push(tag+': la carte ne se referme pas '+hOpen+' → '+hClosed);
    const c2=p.locator('.course').nth(1);const h2a=await c2.evaluate(e=>e.offsetHeight);
    const [h2m,h2b]=await c2.evaluate(e=>new Promise(ok=>{const hs=[];e.querySelector('.c-row').click();const t0=performance.now();
      (function f(){hs.push(e.offsetHeight);if(performance.now()-t0<800)requestAnimationFrame(f);else{const a=hs[0],z=hs[hs.length-1];ok([hs.filter(h=>h>a&&h<z).length,z]);}})();}));   // images intermédiaires, hauteur finale
    console.log(tag,'2e carte : fermée',h2a,'images intermédiaires',h2m,'ouverte',h2b);
    if(!(h2b>h2a+60))errs.push(tag+': 2e carte pas ouverte');if(h2m<3)errs.push(tag+': ouverture pas progressive');
    // barre du haut : reste en haut et devient compacte
    await p.mouse.wheel(0,900);await p.waitForTimeout(700);
    const hd=await p.evaluate(()=>[scrollY,Math.round(document.querySelector('header').getBoundingClientRect().top),document.body.classList.contains('scrolled'),getComputedStyle(document.querySelector('header'),'::before').opacity]);
    console.log(tag,'défilement',hd);if(hd[0]<100)errs.push(tag+': page trop courte pour tester');if(hd[1]<0||hd[1]>30||!hd[2]||hd[3]!=='1')errs.push(tag+': barre du haut pas collée '+hd);
    await p.screenshot({path:'apple-'+tag+'-defile.png'});
    await p.mouse.wheel(0,-2000);await p.waitForTimeout(500);
    // Réglages
    await p.click('#open-settings');await p.waitForTimeout(700);
    const r=await p.evaluate(()=>{const d=document.getElementById('settings').getBoundingClientRect();return [Math.round(d.bottom-innerHeight),Math.round(d.width),Math.round(d.left)];});
    console.log(tag,'réglages',r);
    await p.screenshot({path:'apple-'+tag+'-reglages.png'});
    if(w<600){
      if(Math.abs(r[0])>1||r[1]!==w)errs.push(tag+': la feuille n\'est pas collée en bas '+r);
      const g=await p.locator('#settings .grab').boundingBox();
      await p.mouse.move(g.x+g.width/2,g.y+10);await p.mouse.down();
      for(let i=1;i<=6;i++){await p.mouse.move(g.x+g.width/2,g.y+10+i*25);await p.waitForTimeout(16);}
      const mv=await p.evaluate(()=>Math.round(document.getElementById('settings').getBoundingClientRect().top));
      await p.mouse.up();await p.waitForTimeout(700);
      const op=await p.evaluate(()=>document.getElementById('settings').open);
      console.log(tag,'tirée vers le bas : haut de la feuille',mv,'ouverte après lâcher',op);
      if(op)errs.push(tag+': la feuille ne se ferme pas en la tirant');
      // petit tirage lent : elle revient
      await p.click('#open-settings');await p.waitForTimeout(700);
      const g2=await p.locator('#settings .grab').boundingBox();await p.mouse.move(g2.x+20,g2.y+10);await p.mouse.down();
      for(let i=1;i<=5;i++){await p.mouse.move(g2.x+20,g2.y+10+i*8);await p.waitForTimeout(120);}
      await p.waitForTimeout(200);await p.mouse.up();await p.waitForTimeout(700);
      const back=await p.evaluate(()=>{const d=document.getElementById('settings');return [d.open,Math.round(d.getBoundingClientRect().bottom-innerHeight)];});
      console.log(tag,'petit tirage lent',back);if(!back[0]||Math.abs(back[1])>1)errs.push(tag+': la feuille ne revient pas '+back);
      await p.evaluate(()=>document.getElementById('settings').close());
    }else{
      if(Math.abs(r[2]-(w-r[1])/2)>2)errs.push(tag+': réglages pas centrés '+r);
      await p.keyboard.press('Escape');
    }
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push(tag+': débordement '+ov);
    await c.close();
  }
  await b.close();console.log('erreurs',errs);
})();
