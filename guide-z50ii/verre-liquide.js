/* Verre liquide — repris de Mémoclass (même auteur). */
/* ---------- Liquid Glass : un filtre par élément, calculé à sa taille ----------
   Comme chez Apple : le centre du verre reste net, ses bords bombés
   courbent ce qui passe derrière (réfraction), et un liseré de lumière
   souligne le contour (reflet). Chrome, Edge et Chromebook seulement ;
   ailleurs, verre dépoli classique. */
(function(){
  var ok=!!window.chrome&&!/Firefox/.test(navigator.userAgent)&&!matchMedia('(prefers-reduced-transparency: reduce)').matches;
  if(!ok)return;
  var NS='http://www.w3.org/2000/svg',defs=document.querySelector('#lg-defs defs'),n=0;
  function map(w,h,r,bezel){
    var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d'),im=g.createImageData(w,h),D=im.data;
    var hw=w/2,hh=h/2;r=Math.min(r,hw,hh);
    for(var y=0;y<h;y++)for(var x=0;x<w;x++){
      var px=x+.5-hw,py=y+.5-hh,ax=Math.abs(px),ay=Math.abs(py),qx=ax-(hw-r),qy=ay-(hh-r),d,nx=0,ny=0;
      if(qx>0&&qy>0){var L=Math.hypot(qx,qy)||1;d=r-L;nx=qx/L*Math.sign(px);ny=qy/L*Math.sign(py);}
      else if(hw-ax<hh-ay){d=hw-ax;nx=Math.sign(px);}else{d=hh-ay;ny=Math.sign(py);}
      var i=(y*w+x)*4,dx=0,dy=0;
      if(d<bezel&&d>-1){var t=Math.max(0,d)/bezel,m=Math.pow(1-t,2.4);dx=nx*m;dy=ny*m;}
      D[i]=128+dx*127;D[i+1]=128+dy*127;D[i+2]=128;D[i+3]=255;}
    g.putImageData(im,0,0);return c.toDataURL();
  }
  function apply(el){
    var r=el.getBoundingClientRect(),w=Math.round(r.width),h=Math.round(r.height);if(w<8||h<8)return;
    var key=w+'x'+h;if(el.dataset.lg===key)return;el.dataset.lg=key;
    var rad=parseFloat(getComputedStyle(el).borderTopLeftRadius)||0,big=w*h>60000;
    var id=el.dataset.lgid||('lg'+(n++));el.dataset.lgid=id;
    var old=document.getElementById(id);if(old)old.remove();
    var f=document.createElementNS(NS,'filter');f.id=id;
    f.setAttribute('x','0');f.setAttribute('y','0');f.setAttribute('width','1');f.setAttribute('height','1');
    f.setAttribute('primitiveUnits','objectBoundingBox');f.setAttribute('color-interpolation-filters','sRGB');
    var bl=big?7:2,sc=(big?55:34)/((w+h)/2);
    var url=map(w,h,rad,Math.min(big?26:16,Math.min(w,h)/2));
    f.innerHTML='<feGaussianBlur in="SourceGraphic" stdDeviation="'+(bl/w)+' '+(bl/h)+'" result="b"/>'+
      '<feImage href="'+url+'" x="0" y="0" width="1" height="1" preserveAspectRatio="none" color-interpolation-filters="sRGB" result="m"/>'+
      '<feDisplacementMap in="b" in2="m" scale="'+sc+'" xChannelSelector="R" yChannelSelector="G" color-interpolation-filters="sRGB"/>';
    defs.appendChild(f);
    var v='url(#'+id+') saturate(165%) brightness(1.12)',im=new Image();
    /* n'activer la réfraction qu'une fois la carte chargée, sinon Chrome peint un bord décalé */
    im.onload=function(){requestAnimationFrame(function(){requestAnimationFrame(function(){el.style.webkitBackdropFilter=v;el.style.backdropFilter=v;});});};im.src=url;
  }
  function all(){[].forEach.call(document.querySelectorAll('.glass'),apply);}
  var ro=new ResizeObserver(function(es){es.forEach(function(e){apply(e.target);});});
  function watch(){[].forEach.call(document.querySelectorAll('.glass'),function(el){if(!el.dataset.lgw){el.dataset.lgw=1;ro.observe(el);}});all();}
  var pend=0;new MutationObserver(function(ms){if(pend)return;for(var i=0;i<ms.length;i++){for(var j=0;j<ms[i].addedNodes.length;j++){var nd=ms[i].addedNodes[j];if(nd.nodeType===1&&(nd.classList.contains('glass')||nd.querySelector&&nd.querySelector('.glass'))){pend=requestAnimationFrame(function(){pend=0;watch();});return;}}}}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',watch);watch();
})();
