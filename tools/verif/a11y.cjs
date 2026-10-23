const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844}});
for(const u of ['index.html','mentions-legales.html']){await p.goto('http://localhost:8131/'+u);await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>(v/=255)<=.03928?v/12.92:((v+.055)/1.055)**2.4;return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]);};
 const bad=[];const nolabel=[...document.querySelectorAll('button,input,select,a')].filter(e=>e.offsetParent&&!(e.textContent.trim()||e.getAttribute('aria-label')||e.labels&&e.labels.length||e.title)).map(e=>e.outerHTML.slice(0,80));
 const imgs=[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
 /* contraste approximatif sur fond sombre estimé #1c1c1e */
 const bg=lum('rgb(28,28,30)');[...document.querySelectorAll('p,span,small,b,a,button,h1,h2,h3,label,strong')].forEach(e=>{if(!e.offsetParent||!e.textContent.trim())return;const c=getComputedStyle(e).color;if(!/rgb/.test(c))return;const L=lum(c),ratio=(Math.max(L,bg)+.05)/(Math.min(L,bg)+.05);if(ratio<4.5)bad.push(e.tagName+' '+c+' '+ratio.toFixed(2)+' '+e.textContent.trim().slice(0,30));});
 return {lang:document.documentElement.lang,title:document.title,h1:document.querySelectorAll('h1').length,nolabel,imgs,bad:bad.slice(0,8),overflow:document.documentElement.scrollWidth};});
console.log(u,JSON.stringify(r));}
await b.close();})();
