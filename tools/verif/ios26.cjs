// Liquid Glass façon iOS 26 : pastille des onglets qu'on fait glisser (loupe, élastique, se pose sur l'onglet visé),
// boutons élastiques, Réglages qui sortent du bouton ⚙️ (ordinateur), reflet qui fait le tour, lueurs derrière le verre.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=process.argv[2]||'http://localhost:8131/index.html';
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const errs=[];
  for(const [w,h,tag] of [[390,844,'m'],[1366,768,'d']]){
    const c=await b.newContext({viewport:{width:w,height:h}});const p=await c.newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e));p.on('console',m=>{if(m.type()==='error'&&!/favicon|404|paper-design|WebGL/.test(m.text()))errs.push(tag+': '+m.text())});
    await p.goto(URL);await p.waitForTimeout(1200);
    const bk=await p.evaluate(()=>document.querySelectorAll('.halo i').length);if(bk!==8)errs.push(tag+': lueurs '+bk);
    // glisser la pastille de Studio vers Mes cours
    const s=await p.locator('#tab-studio').boundingBox(),m=await p.locator('#tab-cours').boundingBox();
    await p.mouse.move(s.x+s.width/2,s.y+s.height/2);await p.mouse.down();
    for(let i=1;i<=8;i++){await p.mouse.move(s.x+s.width/2+i*((m.x+m.width/2)-(s.x+s.width/2))/8*0.75,s.y+s.height/2);await p.waitForTimeout(20);}
    const mid=await p.evaluate(()=>{const t=document.querySelector('.tabs'),i=document.querySelector('.tab-ind'),cs=getComputedStyle(i);return [t.classList.contains('drag'),cs.zIndex,cs.scale,Math.round(i.getBoundingClientRect().left)];});
    console.log(tag,'pendant le glissement',mid);if(!mid[0]||mid[1]!=='3')errs.push(tag+': la pastille ne devient pas une loupe '+mid);
    await p.screenshot({path:'ios26-'+tag+'-loupe.png',clip:{x:0,y:Math.max(0,s.y-30),width:Math.min(w,520),height:s.height+60}});
    await p.mouse.up();await p.waitForTimeout(1100);
    const after=await p.evaluate(()=>{const i=document.querySelector('.tab-ind').getBoundingClientRect(),t=document.getElementById('tab-cours').getBoundingClientRect();return [document.getElementById('tab-cours').getAttribute('aria-selected'),Math.round(i.left-t.left),document.getElementById('v-cours').hidden,document.querySelector('.tabs').classList.contains('drag')];});
    console.log(tag,'après le lâcher',after);if(after[0]!=='true'||Math.abs(after[1])>1||after[2]||after[3])errs.push(tag+': la pastille ne se pose pas sur Mes cours '+after);
    // un simple clic marche toujours
    await p.click('#tab-studio');await p.waitForTimeout(700);
    if(await p.evaluate(()=>document.getElementById('tab-studio').getAttribute('aria-selected'))!=='true')errs.push(tag+': clic sur Studio cassé');
    // petit glissement qui revient : on reste sur Studio
    const s2=await p.locator('#tab-studio').boundingBox();await p.mouse.move(s2.x+s2.width/2,s2.y+10);await p.mouse.down();
    for(let i=1;i<=4;i++){await p.mouse.move(s2.x+s2.width/2+i*4,s2.y+10);await p.waitForTimeout(60);}await p.mouse.up();await p.waitForTimeout(900);
    if(await p.evaluate(()=>document.getElementById('tab-studio').getAttribute('aria-selected'))!=='true')errs.push(tag+': petit glissement a changé d\'onglet');
    // bouton élastique
    const g=await p.locator('#open-settings').boundingBox();await p.mouse.move(g.x+g.width/2,g.y+g.height/2);await p.mouse.down();await p.mouse.move(g.x+g.width/2+40,g.y+g.height/2,{steps:4});await p.waitForTimeout(150);
    const st=await p.evaluate(()=>{const e=document.getElementById('open-settings');return [e.style.translate,e.style.scale];});
    console.log(tag,'bouton étiré',st);if(!st[0]||st[0].startsWith('0px'))errs.push(tag+': le bouton ne s\'étire pas '+st);
    await p.mouse.move(g.x+g.width/2,g.y+g.height/2);await p.mouse.up();await p.waitForTimeout(900);
    const back=await p.evaluate(()=>getComputedStyle(document.getElementById('open-settings')).translate);if(back!=='none'&&back!=='0px')errs.push(tag+': le bouton ne revient pas '+back);
    // Réglages : reflet, et sur ordinateur sortie depuis ⚙️
    await p.evaluate(()=>{const d=document.getElementById('settings');if(d.open)d.close();});await p.waitForTimeout(500);
    await p.evaluate(()=>document.getElementById('open-settings').click());
    await p.waitForTimeout(60);
    const an=await p.evaluate(()=>{const d=document.getElementById('settings');return [d.classList.contains('glint'),d.getAnimations().map(a=>a.constructor.name+':'+(a.animationName||'waapi')).join(',')];});
    console.log(tag,'réglages : reflet / animations',an);if(!an[0])errs.push(tag+': pas de reflet');if(w>600&&!/waapi/.test(an[1]))errs.push(tag+': pas de sortie depuis ⚙️');
    await p.waitForTimeout(200);if(w>600)await p.screenshot({path:'ios26-'+tag+'-morph.png'});
    await p.waitForTimeout(700);
    const pos=await p.evaluate(()=>{const r=document.getElementById('settings').getBoundingClientRect();return [Math.round(r.left),Math.round(r.width),Math.round(r.bottom-innerHeight)];});
    if(w>600&&Math.abs(pos[0]-(w-pos[1])/2)>2)errs.push(tag+': réglages pas centrés après la sortie '+pos);
    await p.evaluate(()=>document.getElementById('settings').close());await p.waitForTimeout(500);
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push(tag+': débordement '+ov);
    await c.close();
  }
  await b.close();console.log('erreurs',errs);
})();
