"use strict";
/* ================= shared ================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer=matchMedia("(hover:hover) and (pointer:fine)").matches;
function setMenu(){}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,seg=(p,a,b)=>clamp((p-a)/(b-a)),sstep=t=>t*t*(3-2*t);
const ST={s:0,vel:0,warp:0,warpT:0,ring:-1,mx:0,my:0,mOn:0,px:innerWidth/2,py:innerHeight/2,lastMove:0};
const SECS=$$("main .sec");
const TICKS=[];
let centers=[];
function measure(){
  const maxS=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  centers=SECS.map(s=>{const top=s.getBoundingClientRect().top+scrollY;return clamp(top+s.offsetHeight/2-innerHeight/2,0,maxS)});
  centers[0]=0;centers[centers.length-1]=maxS;
  for(let i=1;i<centers.length;i++)centers[i]=Math.max(centers[i],centers[i-1]+1);
}
function rawS(){const y=scrollY;if(y<=centers[0])return 0;for(let i=0;i<centers.length-1;i++){if(y<centers[i+1])return i+(y-centers[i])/(centers[i+1]-centers[i])}return centers.length-1}

/* ================= interface ================= */
(function(){
/* boot */
const boot=$("#boot");let booted=false;
function bootDone(){if(booted)return;booted=true;boot.classList.add("done");startScramble()}
if(reduce){bootDone()}else{
  const lines=["Calibrating foam cannons","Warming up the rinse","Polishing the particles","Docking at Chloorkop"],t0=performance.now();
  (function f(now){const p=clamp((now-t0)/1300);$("#bootBar").style.setProperty("--p",p.toFixed(3));$("#bootPct").textContent=String(Math.round(p*100)).padStart(3,"0")+"%";
    $("#bootLine").textContent=lines[Math.min(3,Math.floor(p*4))];if(p<1)requestAnimationFrame(f);else setTimeout(bootDone,140)})(t0);
  setTimeout(bootDone,2600);
}

/* decode-style headings */
const GLY="▓▒░<>/\\=+*#01";
function textNodes(el){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode())a.push(w.currentNode);return a}
$$("h2[data-scramble]").forEach(h=>h.setAttribute("aria-label",h.textContent));
function scramble(el){if(el._done)return;el._done=true;if(reduce)return;
  const nodes=textNodes(el).map(n=>({n,fin:n.nodeValue}));const total=28,t0=performance.now();let f=0;
  (function go(){f=Math.min(total,(performance.now()-t0)/32);nodes.forEach(({n,fin})=>{let out="";const L=fin.length;for(let i=0;i<L;i++){const at=total*.25+(i/L)*total*.65;out+=(f>=at||fin[i]===" ")?fin[i]:GLY[(Math.random()*GLY.length)|0]}n.nodeValue=out});
    if(f<total)requestAnimationFrame(go);else nodes.forEach(({n,fin})=>n.nodeValue=fin)})();
}
function startScramble(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){scramble(e.target);io.unobserve(e.target)}}),{threshold:.35});$$("[data-scramble]").forEach(el=>io.observe(el))}

/* depth parallax for floating layers */
const depthEls=$$("[data-depth]");const vis=new Set();
const dio=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?vis.add(e.target):vis.delete(e.target)),{rootMargin:"20% 0px"});
depthEls.forEach(el=>dio.observe(el));
function parallax(){if(reduce)return;const h=innerHeight;vis.forEach(el=>{const r=el.getBoundingClientRect();const d=(r.top+r.height/2-h/2)/h;const k=+el.dataset.depth;
  el.style.translate=`0 ${(-d*k*70).toFixed(1)}px`;el.style.setProperty("--drx",(d*k*10).toFixed(2)+"deg")})}

/* holographic tilt */
if(finePointer&&!reduce){$$("[data-tilt]").forEach(c=>{
  c.addEventListener("pointermove",e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.classList.add("tilting");
    c.style.setProperty("--ry",((x-.5)*12).toFixed(2)+"deg");c.style.setProperty("--rx",((.5-y)*10).toFixed(2)+"deg");c.style.setProperty("--gx",(x*100).toFixed(1)+"%");c.style.setProperty("--gy",(y*100).toFixed(1)+"%")});
  c.addEventListener("pointerleave",()=>{c.classList.remove("tilting");c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg")});
})}

/* magnetic buttons */
if(finePointer&&!reduce){$$(".magnet").forEach(b=>{
  b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.translate=`${((e.clientX-r.left-r.width/2)*.22).toFixed(1)}px ${((e.clientY-r.top-r.height/2)*.35).toFixed(1)}px`});
  b.addEventListener("pointerleave",()=>{b.style.translate="0 0"});
})}

/* ring highlight from package cards */
$$("[data-ring]").forEach(c=>{c.addEventListener("pointerenter",()=>ST.ring=+c.dataset.ring);c.addEventListener("pointerleave",()=>ST.ring=-1);c.addEventListener("focusin",()=>ST.ring=+c.dataset.ring);c.addEventListener("focusout",()=>ST.ring=-1)});

/* pointer, cursor, trail, warp */
const cur=$(".cur"),dot=$(".cur .dot"),ring=$(".cur .ring"),lab=$(".cur .ring span");
let rx=ST.px,ry=ST.py;
if(finePointer&&!reduce)document.documentElement.classList.add("has-cursor");
addEventListener("pointermove",e=>{ST.px=e.clientX;ST.py=e.clientY;if(e.pointerType==="mouse"){ST.mx=e.clientX/innerWidth*2-1;ST.my=-(e.clientY/innerHeight)*2+1;ST.lastMove=performance.now()}},{passive:true});
document.addEventListener("pointerover",e=>{const t=e.target.closest("a,button,[data-cursor]");cur.classList.toggle("hover",!!t);lab.textContent=t?(t.dataset.cursor||""):""});
let warpTimer=0;
function interactive(t){return t.closest("a,button,input,.chat,.holo,.tag,.bar")}
addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"||e.button!==0||interactive(e.target))return;clearTimeout(warpTimer);warpTimer=setTimeout(()=>{ST.warpT=1;cur.classList.add("warp")},160)});
function endWarp(){clearTimeout(warpTimer);ST.warpT=0;cur.classList.remove("warp")}
addEventListener("pointerup",endWarp);addEventListener("blur",endWarp);document.addEventListener("pointerleave",endWarp);

const tc=$("#trail"),tx=tc.getContext("2d");const TP=[];
function sizeTrail(){const d=Math.min(devicePixelRatio||1,2);tc.width=innerWidth*d;tc.height=innerHeight*d;tx.setTransform(d,0,0,d,0,0)}
sizeTrail();
function trail(){if(!finePointer||reduce)return;tx.clearRect(0,0,innerWidth,innerHeight);
  TP.unshift([rx,ry]);if(TP.length>26)TP.pop();if(performance.now()-ST.lastMove>600){TP.length=Math.max(0,TP.length-3)}
  if(TP.length<3)return;tx.globalCompositeOperation="source-over";tx.lineCap="round";
  for(let i=1;i<TP.length;i++){const a=TP[i-1],b=TP[i],k=1-i/TP.length;tx.strokeStyle=`rgba(${Math.round(lerp(138,47,k))},${Math.round(lerp(168,91,k))},255,${(k*.4).toFixed(3)})`;
    tx.lineWidth=k*5+.5;tx.beginPath();tx.moveTo(a[0],a[1]);tx.lineTo(b[0],b[1]);tx.stroke()}
}

/* HUD + orbit nav */
const navA=$$(".orbit a"),barA=$$(".bar nav a"),secNum=$("#secNum"),secName=$("#secName"),velEl=$("#vel");let act=-1;
function hud(){const i=clamp(Math.round(ST.s),0,SECS.length-1);if(i!==act){act=i;secNum.textContent=String(i+1).padStart(2,"0");secName.textContent=SECS[i].dataset.name;
  navA.forEach((a,k)=>a.classList.toggle("on",k===i));barA.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+SECS[i].id))}
  velEl.textContent=(ST.vel*.6+ST.warp*9.9).toFixed(2)}
$$('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const id=a.getAttribute("href");if(id==="#contact")return;const t=document.querySelector(id);if(!t)return;e.preventDefault();
  const y=id==="#arrival"?0:centers[SECS.indexOf(t)]??t.offsetTop;scrollTo({top:y,behavior:reduce?"auto":"smooth"})}));

/* copy phone */
$("#copyPhone").addEventListener("click",e=>{const b=e.currentTarget,num="0788326806";
  const ok=()=>{b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1600)};
  const fallback=()=>{const r=document.createRange();r.selectNodeContents($("#phoneNum"));const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="Selected"};
  try{navigator.clipboard.writeText(num).then(ok,fallback)}catch(err){fallback()}});

/* main loop */
let angT=0,lastL=performance.now();
const damp=(k,dt)=>1-Math.exp(-k*dt);
function loop(now){
  const dt=Math.min(.1,Math.max(.001,(now-lastL)/1000));lastL=now;
  const raw=rawS(),prev=ST.s;ST.s=reduce?raw:ST.s+(raw-ST.s)*damp(4.2,dt);if(Math.abs(raw-ST.s)<.0005)ST.s=raw;
  ST.vel=lerp(ST.vel,Math.abs(ST.s-prev)/dt,damp(4,dt));
  ST.warp=lerp(ST.warp,ST.warpT,damp(ST.warpT?2.4:3.5,dt));
  ST.mOn=lerp(ST.mOn,now-ST.lastMove<1500?1:0,damp(3,dt));
  rx=lerp(rx,ST.px,damp(14,dt));ry=lerp(ry,ST.py,damp(14,dt));
  if(finePointer&&!reduce){dot.style.transform=`translate3d(${ST.px}px,${ST.py}px,0)`;ring.style.transform=`translate3d(${rx}px,${ry}px,0)`}
  if(!reduce&&(angT++%2===0))document.documentElement.style.setProperty("--ang",((now*.04)%360).toFixed(1)+"deg");
  parallax();trail();hud();
  TICKS.forEach(f=>f(now));
  requestAnimationFrame(loop);
}
measure();addEventListener("load",measure);
let rT;addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(()=>{measure();sizeTrail()},120)});
if(document.fonts)document.fonts.ready.then(measure);
requestAnimationFrame(loop);
})();

/* ================= universe (three.js) ================= */
(function(){
const T=window.THREE,cv=$("#gl");
if(!T){document.documentElement.classList.add("no3d");return}
let R;try{R=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:"high-performance"})}catch(e){R=null}
if(!R||!R.getContext()){document.documentElement.classList.add("no3d");return}
const phone=innerWidth<820||matchMedia("(pointer:coarse)").matches;
const DPR=Math.min(devicePixelRatio||1,phone?1.5:1.6);
R.setPixelRatio(DPR);R.setClearColor(0xf4f5f7,1);
const scene=new T.Scene();scene.fog=new T.FogExp2(0xf4f5f7,.03);
const cam=new T.PerspectiveCamera(50,1,.1,500);scene.add(cam);

/* ---------- particle sculptures ---------- */
const N=phone?16000:40000;
const rnd=Math.random,gauss=()=>{let u=0;while(!u)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*rnd())};
const C={plasma:[.18,.36,1],ion:[.54,.66,1],flare:[.3,.34,.42],white:[.05,.07,.09],gold:[.85,.6,0]};
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const mk=()=>({p:new Float32Array(N*3),c:new Float32Array(N*3)});
function put(S,i,x,y,z,c){const k=i*3;S.p[k]=x;S.p[k+1]=y;S.p[k+2]=z;S.c[k]=c[0];S.c[k+1]=c[1];S.c[k+2]=c[2]}

function galaxy(){const S=mk(),ct=Math.cos(.42),st=Math.sin(.42);
  for(let i=0;i<N;i++){let x,y,z,col;
    if(rnd()<.16){const r=Math.abs(gauss())*.5,th=rnd()*6.283,ph=Math.acos(2*rnd()-1);x=r*Math.sin(ph)*Math.cos(th);y=r*Math.cos(ph)*.55;z=r*Math.sin(ph)*Math.sin(th);col=mixc(C.white,C.flare,rnd()*.5)}
    else{const arm=i%3,r=.35+Math.pow(rnd(),1.35)*5.8,a=arm*2.0944+r*.95+gauss()*.2*(1+r*.12);
      x=Math.cos(a)*r+gauss()*.08*r*.4;z=Math.sin(a)*r+gauss()*.08*r*.4;y=gauss()*.14*(1.3-r/6.5);const t=r/6.2;col=t<.3?mixc(C.white,C.plasma,t/.3):mixc(C.plasma,C.ion,(t-.3)/.7)}
    put(S,i,x,y*ct-z*st,y*st+z*ct,col)}
  return S}

function inside(pt,x,y){let c=false;for(let i=0,j=pt.length-1;i<pt.length;j=i++){const a=pt[i],b=pt[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))c=!c}return c}
function car(){const S=mk();const s=new T.Shape();
  s.moveTo(-2.0,.36);s.lineTo(-2.06,.62);s.quadraticCurveTo(-2.08,.92,-1.9,1.14);s.lineTo(-1.45,1.42);s.quadraticCurveTo(-1.2,1.48,-.8,1.48);
  s.lineTo(.1,1.46);s.quadraticCurveTo(.35,1.44,.55,1.28);s.lineTo(.98,1.0);s.quadraticCurveTo(1.5,.94,1.9,.86);s.quadraticCurveTo(2.08,.8,2.08,.6);s.lineTo(2.04,.36);
  s.lineTo(1.76,.36);s.absarc(1.3,.36,.46,0,Math.PI,false);s.lineTo(-.84,.36);s.absarc(-1.3,.36,.46,0,Math.PI,false);s.lineTo(-2.0,.36);
  const poly=s.getPoints(28);
  const g=[{x:-1.8,y:1.06},{x:-1.42,y:1.36},{x:-.8,y:1.41},{x:.08,y:1.39},{x:.48,y:1.24},{x:.86,y:1.02}];
  const segs=[];let L=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],l=Math.hypot(b.x-a.x,b.y-a.y);if(l>0){segs.push([a,b,l,L]);L+=l}}
  function edge(){let d=rnd()*L;for(const q of segs){if(d<=q[3]+q[2]){const t=(d-q[3])/q[2];return [q[0].x+(q[1].x-q[0].x)*t,q[0].y+(q[1].y-q[0].y)*t]}}return [0,.4]}
  const D=.92,SC=1.3,YO=.86;
  for(let i=0;i<N;i++){const k=rnd();let x,y,z,col;
    if(k<.4){[x,y]=edge();z=(rnd()*2-1)*D;col=mixc(C.plasma,C.white,rnd()*.45)}
    else if(k<.7){do{x=-2.1+rnd()*4.2;y=.36+rnd()*1.14}while(!inside(poly,x,y));z=(rnd()<.5?-1:1)*D*(1+gauss()*.01);col=inside(g,x,y)?mixc(C.ion,C.flare,rnd()*.35):mixc(C.plasma,C.ion,rnd()*.3)}
    else if(k<.88){const wx=rnd()<.5?-1.3:1.3,a=rnd()*6.283,rr=.16+rnd()*.26;x=wx+Math.cos(a)*rr;y=.36+Math.sin(a)*rr;z=(rnd()<.5?-1:1)*(D+.04)+(rnd()-.5)*.14;col=rr>.38?C.white:mixc(C.ion,C.plasma,rnd()*.5)}
    else{const a=rnd()*6.283,r=2.75+gauss()*.04;x=Math.cos(a)*r;z=Math.sin(a)*r*.62;y=.02;col=mixc(C.plasma,C.ion,rnd()*.4)}
    put(S,i,x*SC,(y-YO)*SC,z*SC,col)}
  return S}

function nodes(){const S=mk();const NP=[[0,0,0,.85]];for(let k=0;k<6;k++){const a=k/6*6.2832+.26;NP.push([Math.cos(a)*2.9,Math.sin(a)*1.9,Math.sin(a*2)*.6,.5])}
  for(let i=0;i<N;i++){const k=rnd();let x,y,z,col;
    if(k<.62){const n=NP[i%7],u=rnd()*2-1,a=rnd()*6.283,s2=Math.sqrt(1-u*u),r=n[3]*(1+gauss()*.02);x=n[0]+s2*Math.cos(a)*r;y=n[1]+u*r;z=n[2]+s2*Math.sin(a)*r;col=i%7===0?C.plasma:mixc(C.plasma,C.ion,rnd()*.6)}
    else{const e=Math.floor(rnd()*12),A=e<6?NP[0]:NP[1+(e-6)],B=e<6?NP[1+e]:NP[1+((e-5)%6)],t=rnd();x=A[0]+(B[0]-A[0])*t+gauss()*.02;y=A[1]+(B[1]-A[1])*t+gauss()*.02;z=A[2]+(B[2]-A[2])*t+gauss()*.02;col=C.flare}
    put(S,i,x,y,z,col)}
  return S}
function rings(){const S=mk();const RR=[1.4,2.2,3.0,3.8],TL=[[.35,.05],[-.55,.45],[.95,-.3],[-.2,-.85]],CL=[C.plasma,C.ion,C.flare,C.white];
  for(let i=0;i<N;i++){const g=i%4;let x,y,z;
    if(rnd()<.06){const r=Math.abs(gauss())*.28;const th=rnd()*6.283,ph=Math.acos(2*rnd()-1);x=r*Math.sin(ph)*Math.cos(th);y=r*Math.cos(ph);z=r*Math.sin(ph)*Math.sin(th);put(S,i,x,y,z,C.white);continue}
    const a=rnd()*6.283,r=RR[g]+gauss()*.05;x=Math.cos(a)*r;y=gauss()*.035;z=Math.sin(a)*r;
    const [tx,tz]=TL[g];let y2=y*Math.cos(tx)-z*Math.sin(tx),z2=y*Math.sin(tx)+z*Math.cos(tx);const x3=x*Math.cos(tz)-y2*Math.sin(tz),y3=x*Math.sin(tz)+y2*Math.cos(tz);
    put(S,i,x3,y3,z2,mixc(CL[g],C.white,rnd()*.25))}
  return S}

function photoGrid(img){const S=mk();const W=Math.round(Math.sqrt(N*4/3)),H=Math.ceil(N/W);let d=null;
  if(img){try{const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.drawImage(img,0,0,W,H);d=g.getImageData(0,0,W,H).data}catch(e){d=null}}
  for(let i=0;i<N;i++){const u=i%W,v=Math.floor(i/W);let r=.3,gg=.6,b=.7;if(d){const k=(v*W+u)*4;r=d[k]/255;gg=d[k+1]/255;b=d[k+2]/255}
    const l=.3*r+.59*gg+.11*b;put(S,i,(u/W-.5)*7.6,(.5-v/H)*5.7,(.5-l)*.8+gauss()*.015,[Math.pow(r,1.15),Math.pow(gg,1.15),Math.pow(b,1.1)])}
  return S}

function score(){const S=mk();const W=640,H=380,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";
  g.font="700 230px Sora, 'Arial Black', Arial, sans-serif";g.fillText("5.0",W/2,150);g.font="70px Arial, sans-serif";g.fillText("★★★★★",W/2,320);
  const d=g.getImageData(0,0,W,H).data,pts=[];for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(d[(y*W+x)*4+3]>128)pts.push(x,y);
  for(let i=0;i<N;i++){const j=(rnd()*pts.length/2|0)*2,px=pts[j]+rnd()*2,py=pts[j+1]+rnd()*2;put(S,i,(px/W-.5)*8,(.5-py/H)*4.75,gauss()*.14,py>255?mixc(C.gold,C.white,rnd()*.2):mixc(C.white,C.plasma,px/W))}
  return S}

function pin(){const S=mk();
  for(let i=0;i<N;i++){const k=rnd();let x,y,z,col;
    if(k<.36){if(rnd()<.6){const th=rnd()*6.283,ph=Math.acos(2*rnd()-1),r=.85;x=r*Math.sin(ph)*Math.cos(th);y=1.9+r*Math.cos(ph);z=r*Math.sin(ph)*Math.sin(th)}
      else{const t=rnd(),r=.78*(1-t),a=rnd()*6.283;x=Math.cos(a)*r;z=Math.sin(a)*r;y=1.62-t*1.47}col=mixc(C.plasma,C.white,rnd()*.45)}
    else if(k<.42){const a=rnd()*6.283,r=.3+gauss()*.015;x=Math.cos(a)*r;y=1.92+Math.sin(a)*r;z=.8+gauss()*.02;col=C.flare}
    else{const ri=Math.floor(rnd()*10),a=rnd()*6.283,base=.45+ri*.52,r=base*(1+.1*Math.sin(a*3+ri)+.05*Math.sin(a*7-ri));x=Math.cos(a)*r;z=Math.sin(a)*r;y=.1*Math.sin(x*.8+ri)*Math.cos(z*.6);
      col=mixc(C.plasma,C.ion,ri/9)}
    put(S,i,x,y-1.15,z,col)}
  return S}

function bubble(){const S=mk();const bs=[[0,0,0,2.3,.8],[2.7,1.3,-.6,.62,.09],[-2.5,-1.2,.4,.75,.08],[1.9,-1.7,1,.4,.03]];
  for(let i=0;i<N;i++){let k=rnd(),b=bs[0],acc=0;for(const q of bs){acc+=q[4];if(k<acc){b=q;break}}
    const u=rnd()*2-1,a=rnd()*6.283,s=Math.sqrt(1-u*u),r=b[3]*(1+gauss()*.006);const t=(Math.sin(a*2+u*3.2)+1)/2;
    put(S,i,b[0]+s*Math.cos(a)*r,b[1]+u*r,b[2]+s*Math.sin(a)*r,t<.5?mixc(C.plasma,C.ion,t*2):mixc(C.ion,C.flare,(t-.5)*2))}
  return S}

const SZK=[1,1,1,1,1.45,1.1,1,1];
const SH=[galaxy(),car(),nodes(),rings(),photoGrid(null),score(),pin(),bubble()];
let loaded=-1;
const img=$("#bayPhoto");
function loadPhoto(){SH[4]=photoGrid(img);loaded=-1}
if(img.complete&&img.naturalWidth)loadPhoto();else img.addEventListener("load",loadPhoto);
if(document.fonts){Promise.race([document.fonts.load("700 100px Sora"),new Promise(r=>setTimeout(r,2500))]).then(()=>{SH[5]=score();loaded=-1}).catch(()=>{})}

const geo=new T.BufferGeometry();
const aPos=new Float32Array(N*3),aTo=new Float32Array(N*3),aCF=new Float32Array(N*3),aCT=new Float32Array(N*3),aR=new Float32Array(N),aI=new Float32Array(N);
for(let i=0;i<N;i++){aR[i]=rnd();aI[i]=i%4}
const at=(a,n)=>new T.BufferAttribute(a,n);
geo.setAttribute("position",at(aPos,3));geo.setAttribute("aTo",at(aTo,3));geo.setAttribute("aCF",at(aCF,3));geo.setAttribute("aCT",at(aCT,3));geo.setAttribute("aRand",at(aR,1));geo.setAttribute("aIdx",at(aI,1));
const U={uMix:{value:0},uTime:{value:0},uVel:{value:0},uSize:{value:phone?30:26},uSizeK:{value:1},uPR:{value:DPR},uWarp:{value:0},uRing:{value:0},uHi:{value:-1},uMouse:{value:new T.Vector2(9,9)},uAspect:{value:1},uMOn:{value:0}};
const pMat=new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:T.NormalBlending,
  vertexShader:`
  attribute vec3 aTo,aCF,aCT;attribute float aRand,aIdx;
  uniform float uMix,uTime,uVel,uSize,uSizeK,uPR,uWarp,uRing,uHi,uAspect,uMOn;uniform vec2 uMouse;
  varying vec3 vC;varying float vA;
  void main(){
    float d=aRand*.5;float m=smoothstep(d,d+.5,uMix);
    vec3 p=mix(position,aTo,m);
    float mid=sin(m*3.14159);
    vec3 n=vec3(sin(p.y*1.7+uTime*.9+aRand*6.),sin(p.z*1.9+uTime*.8+aRand*5.),sin(p.x*1.5+uTime*.7+aRand*4.));
    p+=n*(.03+mid*1.3+uVel*.18);
    float ang=mid*2.4*(aRand-.5)+uTime*.22*(1.+aIdx*.4)*uRing;
    float c=cos(ang),s=sin(ang);p.xz=mat2(c,-s,s,c)*p.xz;
    p+=normalize(p+vec3(.001))*uWarp*(1.2+aRand*5.);
    vec4 mv=modelViewMatrix*vec4(p,1.);
    vec4 cp=projectionMatrix*mv;vec2 nd=cp.xy/cp.w;vec2 dv=nd-uMouse;dv.x*=uAspect;float dl=length(dv);
    float f=uMOn*smoothstep(.3,0.,dl);
    mv.xy+=normalize(dv+vec2(1e-4))*f*(-mv.z)*.09;
    gl_Position=projectionMatrix*mv;
    float hi=(uRing>.01&&abs(aIdx-uHi)<.5)?uRing:0.;
    gl_PointSize=uSize*uSizeK*(.55+aRand*.9)*(1.+hi*.9+f*1.4)*uPR/(-mv.z);
    vC=mix(mix(aCF,aCT,m),vec3(.18,.36,1.),clamp(hi*.9+f*.7,0.,1.));
    if(hi<.01&&uHi>-.5&&uRing>.01)vC=mix(vC,vec3(.96),.6);
    vA=(.7+mid*.3)*(.75+.25*sin(uTime*2.+aRand*40.));
  }`,
  fragmentShader:`varying vec3 vC;varying float vA;
  void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.18,r);if(a<.01)discard;gl_FragColor=vec4(vC,a*vA*.82);}`});
const pts=new T.Points(geo,pMat);pts.frustumCulled=false;
const sculpt=new T.Group();sculpt.add(pts);scene.add(sculpt);

function loadSeg(k){const A=SH[k],B=SH[Math.min(k+1,SH.length-1)];aPos.set(A.p);aCF.set(A.c);aTo.set(B.p);aCT.set(B.c);
  ["position","aTo","aCF","aCT"].forEach(n=>geo.attributes[n].needsUpdate=true);loaded=k}

/* ---------- environment ---------- */
const SN=phone?2500:6000,sp=new Float32Array(SN*3),sc=new Float32Array(SN*3),ss=new Float32Array(SN);
for(let i=0;i<SN;i++){const u=rnd()*2-1,a=rnd()*6.283,s=Math.sqrt(1-u*u),r=60+rnd()*110;sp.set([s*Math.cos(a)*r,u*r,s*Math.sin(a)*r],i*3);sc.set(rnd()<.6?C.flare:(rnd()<.5?C.plasma:C.ion),i*3);ss[i]=.4+rnd()*rnd()*2.2}
const sg=new T.BufferGeometry();sg.setAttribute("position",at(sp,3));sg.setAttribute("aC",at(sc,3));sg.setAttribute("aS",at(ss,1));
const SU={uTime:U.uTime,uPR:U.uPR,uVel:U.uVel,uWarp:U.uWarp};
const stars=new T.Points(sg,new T.ShaderMaterial({uniforms:SU,transparent:true,depthWrite:false,blending:T.NormalBlending,
  vertexShader:`attribute vec3 aC;attribute float aS;uniform float uTime,uPR,uVel,uWarp;varying vec3 vC;varying float vA;
  void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=aS*uPR*(1.+uVel*.8+uWarp*2.5)*(260./-mv.z);vC=aC;vA=.55+.45*sin(uTime*1.5+position.x*3.);}`,
  fragmentShader:`varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.1,r);gl_FragColor=vec4(vC,a*vA*.35);}`}));
stars.frustumCulled=false;scene.add(stars);

const glowTex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(.35,"rgba(255,255,255,.35)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,128,128);return new T.CanvasTexture(c)})();
const neb=new T.Group();scene.add(neb);
[[0x8aa8ff,-50,20,-90,95],[0x2f5bff,60,-10,-80,80],[0xc9d6ff,20,40,-110,70],[0x8aa8ff,80,30,40,90],[0xdfe6ff,-80,-20,30,85],[0x2f5bff,0,-40,90,110]].forEach(([col,x,y,z,s])=>{
  const m=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:col,transparent:true,opacity:.1,depthWrite:false,fog:false}));m.position.set(x,y,z);m.scale.set(s,s,1);neb.add(m)});

const env=new T.Group();scene.add(env);
const shapes=[()=>new T.IcosahedronGeometry(1.1,1),()=>new T.OctahedronGeometry(1.3,0),()=>new T.TorusKnotGeometry(.8,.24,70,8),()=>new T.DodecahedronGeometry(1,0),()=>new T.TorusGeometry(1.1,.32,8,28),()=>new T.IcosahedronGeometry(.8,0),()=>new T.OctahedronGeometry(.7,0),()=>new T.TetrahedronGeometry(1,0),()=>new T.IcosahedronGeometry(1.6,0),()=>new T.TorusGeometry(2.2,.05,6,64)];
const floaters=[];
shapes.forEach((f,i)=>{const g0=f();const wire=i===2||i===4?new T.WireframeGeometry(g0):new T.EdgesGeometry(g0);
  const col=[0x2f5bff,0x0d1117,0x8aa8ff][i%3];const l=new T.LineSegments(wire,new T.LineBasicMaterial({color:col,transparent:true,opacity:i===2||i===4?.12:.3,depthWrite:false}));
  const a=i/shapes.length*6.283+rnd()*.4,r=10+rnd()*8;l.position.set(Math.cos(a)*r,-3+rnd()*9,Math.sin(a)*r);l.userData={ax:new T.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize(),sp:.15+rnd()*.35,y:l.position.y,ph:rnd()*6};
  env.add(l);floaters.push(l)});
const grid=new T.GridHelper(260,130,0x9fb2e8,0xd3d9e4);grid.material.transparent=true;grid.material.opacity=.6;grid.material.depthWrite=false;grid.position.y=-7;scene.add(grid);

/* portal rings that fly past the camera between sectors */
const portals=[0x2f5bff,0x8aa8ff,0x0d1117].map(c=>{const m=new T.Mesh(new T.TorusGeometry(3.4,.02,8,160),new T.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false,fog:false}));m.visible=false;cam.add(m);return m});

/* ---------- camera keyframes, one per sector ---------- */
const KF=[
  {p:[0,2.4,10.5],fov:50,pm:1.55,amp:.5},
  {p:[6.4,2.3,6.4],fov:46,pm:1.75,amp:.3},
  {p:[-3.2,1.4,8.2],fov:48,pm:1.8,amp:.35},
  {p:[0,7.6,6.4],fov:50,pm:1.6,amp:.4},
  {p:[0,0,8.6],fov:46,pm:2.0,amp:0},
  {p:[-1.6,.5,8.6],fov:46,pm:1.95,amp:.08},
  {p:[0,6.4,7.4],fov:48,pm:1.6,amp:.45},
  {p:[0,.3,8.2],fov:50,pm:1.45,amp:.35}];
const SIDES=SECS.map(s=>+s.dataset.side||0);

/* ---------- post: bloom + lens ---------- */
let comp=null,bloom=null,lens=null;
const usePost=false&&T.EffectComposer&&T.RenderPass&&T.UnrealBloomPass&&T.ShaderPass;
if(usePost){try{
  comp=new T.EffectComposer(R);comp.addPass(new T.RenderPass(scene,cam));
  bloom=new T.UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.95,.6,.08);comp.addPass(bloom);
  lens=new T.ShaderPass({uniforms:{tDiffuse:{value:null},uAb:{value:.004},uTime:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float uAb,uTime;varying vec2 vUv;
    void main(){vec2 c=vUv-.5;float d=length(c);vec2 o=c*uAb*(.5+d);
      vec3 col=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);
      col*=mix(1.,.55,smoothstep(.35,.85,d));
      float n=fract(sin(dot(vUv*vec2(1311.,733.)+fract(uTime),vec2(12.9898,78.233)))*43758.5453);col+=(n-.5)*.03;
      gl_FragColor=vec4(col,1.);}`});
  comp.addPass(lens);
}catch(e){comp=null}}

let W=0,H=0;
function resize(){W=innerWidth;H=innerHeight;R.setSize(W,H,false);cam.aspect=W/H;U.uAspect.value=W/H;if(comp){comp.setSize(W,H);bloom.setSize(W,H)}}
resize();let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(resize,120)});

/* ---------- frame ---------- */
const tmp=new T.Vector3(),pa=new T.Vector3(),pb=new T.Vector3();let t=0,lastT=performance.now(),camX=0,camY=0;
function frame(now){
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;t+=reduce?0:dt;
  const s=clamp(ST.s,0,SH.length-1),k=Math.min(Math.floor(s),SH.length-2),fr=s-k;
  if(k!==loaded)loadSeg(k);
  const mix=sstep(seg(fr,.16,.84));U.uMix.value=mix;U.uTime.value=t;U.uVel.value=Math.min(1.2,ST.vel*.3);U.uWarp.value=ST.warp;
  U.uRing.value=k===3?1-mix:k===2?mix:0;U.uSizeK.value=lerp(SZK[k],SZK[k+1],mix);U.uHi.value=ST.ring;
  U.uMouse.value.set(ST.mx,ST.my);U.uMOn.value=ST.mOn;

  /* camera flight between sector keyframes */
  const e=sstep(seg(fr,.08,.92)),A=KF[k],B=KF[k+1],port=W/H<.8;
  const pm=port?lerp(A.pm,B.pm,e):1;
  pa.fromArray(A.p);pb.fromArray(B.p);tmp.copy(pa).lerp(pb,e);
  const arc=Math.sin(e*Math.PI);tmp.multiplyScalar((1+arc*.45)*pm);tmp.y+=arc*2.4;
  camX=lerp(camX,ST.mx*ST.mOn,1-Math.exp(-2.5*dt));camY=lerp(camY,ST.my*ST.mOn,1-Math.exp(-2.5*dt));
  cam.position.set(tmp.x+camX*.7,tmp.y+camY*.45,tmp.z);cam.lookAt(0,0,0);
  cam.fov=lerp(A.fov,B.fov,e)+ST.warp*22+arc*6;
  const side=lerp(SIDES[k]||0,SIDES[k+1]||0,e);
  if(port)cam.setViewOffset(W,H,0,H*.17,W,H);else cam.setViewOffset(W,H,-side*W*.2,0,W,H);
  cam.updateProjectionMatrix();

  sculpt.rotation.y=Math.sin(t*.18)*lerp(A.amp,B.amp,e)+(k===0?t*.04*(1-e):0);
  sculpt.rotation.x=Math.sin(t*.13)*.05;

  /* portals during flight */
  const q=seg(fr,.12,.88);
  portals.forEach((m,j)=>{const tj=clamp(q*1.5-j*.25);const o=Math.sin(tj*Math.PI)*.6*(fr>.1&&fr<.9?1:0);m.visible=o>.01;if(!m.visible)return;
    m.position.set(0,0,lerp(-70,5,Math.pow(tj,1.7)));m.rotation.z=t*.3+j*1.3;m.material.opacity=o});

  env.rotation.y=ST.s*.55+t*.01;
  floaters.forEach(l=>{const u=l.userData;l.rotateOnAxis(u.ax,u.sp*dt);l.position.y=u.y+Math.sin(t*.5+u.ph)*.6});
  stars.rotation.y=ST.s*.18+t*.004;neb.rotation.y=ST.s*.1;
  grid.position.z=(ST.s*6)%2;

  if(comp){lens.uniforms.uAb.value=.0015+Math.min(.008,ST.vel*.004)+ST.warp*.02;lens.uniforms.uTime.value=t;comp.render()}else R.render(scene,cam);
}
TICKS.push(frame);
})();


/* ---------- Bubbles: booking chatbot ---------- */
/* Edit these to match the business. Prices left as "R[__]" show as placeholders. */
const BUSINESS={
  name:"Laz Gentle Touch Carwash",
  whatsapp:"27788326806",                 /* e.g. "27712345678" (no +, no spaces). Empty = customer picks the chat in WhatsApp */
  phone:"078 832 6806",
  address:"288 Nancy Ndamase St, Klipfontein View, Lethabong, 1685 (Chloorkop)",
  maps:"https://www.google.com/maps/search/?api=1&query=288+Nancy+Ndamase+St,+Klipfontein+View,+Lethabong,+1685",
  packages:[
    {id:"quick",name:"Quick wash",price:"R[__]",info:"Foam, hand wash, rinse and dry"},
    {id:"vac",name:"Wash & vac",price:"R[__]",info:"Quick wash plus vacuum, mats and windows"},
    {id:"valet",name:"Full valet",price:"R[__]",info:"Inside and out: dash, seats, tyres, rims"},
    {id:"wax",name:"Wax & polish",price:"R[__]",info:"Hand wax for shine and protection"}
  ],
  services:["Car wash","Auto detailing","Car waxing","Polishing","Scratch removal","Vacuuming","Vehicle interior vacuuming"],
  cars:["Hatchback / sedan","SUV / bakkie","Minibus taxi","Other"],
  bigCarExtra:"R[__]",
  /* opening hours per weekday (0 = Sunday) in minutes from midnight */
  hours:{0:[480,900],1:[450,1080],2:[450,1080],3:[450,1080],4:[450,1080],5:[450,1080],6:[450,1080]},
  slots:[[450,600,"Morning (07:30–10:00)"],[600,720,"Late morning (10:00–12:00)"],[720,900,"Afternoon (12:00–15:00)"],[900,1080,"Late afternoon (15:00–18:00)"]]
};

const chat=$("#chat"),logEl=$("#chatLog"),inp=$("#chatInput"),nudge=$("#nudge");
let chatOpen=false,started=false,step=null,editing=false;
const B={name:"",car:"",pkg:null,day:null,dayLabel:"",slot:"",phone:"",notes:""};
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const fmtDay=d=>d.toLocaleDateString("en-ZA",{weekday:"short",day:"numeric",month:"short"});
const sleep=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));

function scrollLog(){logEl.scrollTop=logEl.scrollHeight}
function addMsg(text,who="bot"){const d=document.createElement("div");d.className="bm "+who;d.innerHTML=text;logEl.appendChild(d);scrollLog();return d}
function esc(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
async function say(text,delay=520){const t=document.createElement("div");t.className="typing";t.setAttribute("aria-label","Bubbles is typing");t.innerHTML="<i></i><i></i><i></i>";logEl.appendChild(t);scrollLog();await sleep(delay);t.remove();return addMsg(text,"bot")}
function chips(list){
  clearChips();const w=document.createElement("div");w.className="chips";w.setAttribute("role","group");
  list.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="chip"+(c.cls?" "+c.cls:"");b.innerHTML=c.html||esc(c.label);
    b.addEventListener("click",()=>{if(c.echo!==false)addMsg(esc(c.label),"me");clearChips();c.go()});w.appendChild(b)});
  logEl.appendChild(w);scrollLog();return w;
}
function clearChips(){logEl.querySelectorAll(".chips").forEach(c=>c.remove())}

/* ---------- conversation steps ---------- */
const FAQ_CHIPS=[{label:"Our services",go:()=>faq("services")},{label:"See prices",go:()=>faq("prices")},{label:"Opening hours",go:()=>faq("hours")},{label:"Where are you?",go:()=>faq("where")}];

async function start(){
  started=true;
  await say(`Hi! I'm <b>Bubbles</b>, the booking assistant for ${esc(BUSINESS.name)}.`,350);
  await say("I can book your wash in about a minute. What's your name?");
  step="name";chips([{label:"Just browsing: see prices",go:()=>faq("prices")},...FAQ_CHIPS.slice(1)]);
}
async function askCar(){step="car";await say(`Nice to meet you, ${esc(B.name)}! What are we washing?`);
  chips(BUSINESS.cars.map(c=>({label:c,go:()=>setCar(c)})))}
async function setCar(c){B.car=c;if(editing)return summary();
  if(/SUV|Minibus/.test(c))await say(`Got it. Bigger vehicles are ${esc(BUSINESS.bigCarExtra)} extra on any package.`);
  askPkg()}
async function askPkg(){step="pkg";await say("Which package would you like?");
  chips(BUSINESS.packages.map(p=>({label:`${p.name} · ${p.price}`,html:`${esc(p.name)}<small>${esc(p.price)}</small>`,go:()=>setPkg(p)})))}
async function setPkg(p){B.pkg=p;if(editing)return summary();await say(`<b>${esc(p.name)}</b>: ${esc(p.info.toLowerCase())}. Good choice.`,420);askDay()}

function nextDays(n){const out=[],d=new Date();d.setHours(0,0,0,0);for(let i=0;i<n;i++){const x=new Date(d);x.setDate(d.getDate()+i);out.push(x)}return out}
function slotsFor(date){
  const [o,c]=BUSINESS.hours[date.getDay()]||[0,0];const now=new Date();const isToday=date.toDateString()===now.toDateString();
  const nowM=now.getHours()*60+now.getMinutes();
  return BUSINESS.slots.filter(([a,b])=>a>=o&&b<=c&&(!isToday||b-30>nowM)).map(s=>s[2]);
}
async function askDay(){step="day";await say("Which day suits you?");
  const days=nextDays(6).filter(d=>slotsFor(d).length);
  chips(days.map((d,i)=>{const lab=i===0&&d.toDateString()===new Date().toDateString()?"Today":(d.getTime()-nextDays(1)[0].getTime()===864e5?"Tomorrow":fmtDay(d));
    return{label:lab,go:()=>setDay(d,lab)}}))}
async function setDay(d,lab){B.day=d;B.dayLabel=lab==="Today"||lab==="Tomorrow"?`${lab} (${fmtDay(d)})`:fmtDay(d);askTime()}
async function askTime(){step="time";const s=slotsFor(B.day);
  if(!s.length){await say("Sorry, we're fully closed for the rest of that day. Pick another day?");return askDay()}
  await say(`What time on ${esc(B.dayLabel)}?`);chips(s.map(x=>({label:x,go:()=>setTime(x)})))}
async function setTime(x){B.slot=x;if(editing)return summary();askPhone()}
async function askPhone(){step="phone";await say("Last thing: what's your phone number? We'll confirm your slot on WhatsApp.");}
function cleanPhone(t){const d=t.replace(/[^\d+]/g,"");if(/^0\d{9}$/.test(d))return d.replace(/^0(\d{2})(\d{3})(\d{4})$/,"0$1 $2 $3");if(/^\+?27\d{9}$/.test(d)){const n=d.replace(/^\+?27/,"");return "+27 "+n.replace(/^(\d{2})(\d{3})(\d{4})$/,"$1 $2 $3")}return null}
async function askNotes(){step="notes";await say("Anything we should know? Pet hair, very muddy mats, a scratch to look out for…");
  chips([{label:"No, that's all",go:()=>{B.notes="";summary()}}])}

function bookingText(){return `Carwash booking · ${BUSINESS.name}\nName: ${B.name}\nPhone: ${B.phone}\nCar: ${B.car}\nPackage: ${B.pkg.name} (${B.pkg.price})\nDay: ${B.dayLabel}\nTime: ${B.slot}${B.notes?"\nNotes: "+B.notes:""}`}
async function summary(){editing=false;step="confirm";
  await say("Here's your booking. Does everything look right?",420);
  const c=document.createElement("div");c.className="summary";
  c.innerHTML=`<h4>Your booking</h4><dl><dt>Name</dt><dd>${esc(B.name)}</dd><dt>Car</dt><dd>${esc(B.car)}</dd><dt>Package</dt><dd>${esc(B.pkg.name)} · ${esc(B.pkg.price)}</dd><dt>Day</dt><dd>${esc(B.dayLabel)}</dd><dt>Time</dt><dd>${esc(B.slot)}</dd><dt>Phone</dt><dd>${esc(B.phone)}</dd>${B.notes?`<dt>Notes</dt><dd>${esc(B.notes)}</dd>`:""}</dl>`;
  logEl.appendChild(c);scrollLog();
  chips([{label:"Confirm on WhatsApp",cls:"wa",go:confirm},{label:"Change something",go:change},{label:"Copy booking",echo:false,go:copyBooking}]);
}
async function confirm(){
  const url=(BUSINESS.whatsapp?`https://wa.me/${BUSINESS.whatsapp}`:"https://wa.me/")+"?text="+encodeURIComponent(bookingText());
  const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();
  step="done";
  await say(`Opening WhatsApp with your booking. Just tap <b>send</b>${BUSINESS.whatsapp?"":` to ${esc(BUSINESS.name)} (${esc(BUSINESS.phone)})`}.`);
  await say(`See you ${esc(B.dayLabel)}, ${esc(B.name)}! If WhatsApp didn't open, copy the booking and send it to ${esc(BUSINESS.phone)}.`);
  chips([{label:"Copy booking",echo:false,go:copyBooking},{label:"Book another car",go:()=>{Object.assign(B,{car:"",pkg:null,day:null,slot:"",notes:""});askCar()}}]);
}
async function copyBooking(){const t=bookingText();let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(_){}
  await say(ok?"Copied. Paste it into WhatsApp or an SMS.":"Here it is, select and copy it:\n\n"+esc(t),300);
  if(step==="confirm")chips([{label:"Confirm on WhatsApp",cls:"wa",go:confirm},{label:"Change something",go:change}]);
}
async function change(){editing=true;await say("Sure, what would you like to change?",300);
  chips([{label:"Car",go:()=>{step="car";say("What are we washing?").then(()=>chips(BUSINESS.cars.map(c=>({label:c,go:()=>setCar(c)}))))}},
    {label:"Package",go:()=>{step="pkg";say("Which package?").then(()=>chips(BUSINESS.packages.map(p=>({label:`${p.name} · ${p.price}`,html:`${esc(p.name)}<small>${esc(p.price)}</small>`,go:()=>setPkg(p)}))))}},
    {label:"Day & time",go:()=>{editing=true;askDay()}},
    {label:"Phone",go:()=>{step="phone";say("What's the best number?")}},
    {label:"Nothing, it's fine",go:summary}]);
}

/* ---------- FAQs (work at any step) ---------- */
async function faq(kind){
  if(kind==="prices"){await say("<b>Prices</b> (hatchback / sedan):\n"+BUSINESS.packages.map(p=>`• ${esc(p.name)}: ${esc(p.price)}`).join("\n")+`\nSUVs, bakkies and minibuses: ${esc(BUSINESS.bigCarExtra)} extra.`)}
  else if(kind==="services"){await say("<b>Our services</b>:\n"+BUSINESS.services.map(x=>"• "+esc(x)).join("\n")+"\nFor detailing, polishing or scratch removal, add a note when you book and the team will advise.")}
  else if(kind==="hours"){const h=BUSINESS.hours,f=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
    await say(`<b>Opening hours</b>\nMon–Sat: ${f(h[1][0])}–${f(h[1][1])}\nSunday: ${f(h[0][0])}–${f(h[0][1])}\nWalk-ins welcome; booking skips the queue.`)}
  else if(kind==="where"){await say(`We're at <b>${esc(BUSINESS.address)}</b>. Look for the covered wash bay. <a href="${BUSINESS.maps}" target="_blank" rel="noopener">Open in Google Maps ↗</a>`)}
  else if(kind==="human"){await say(`Call or WhatsApp us on <b>${esc(BUSINESS.phone)}</b> and the team will help.`)}
  resume();
}
function resume(){
  if(!started)return;
  const back={name:()=>{say("Shall we book? What's your name?",300)},car:askCar,pkg:askPkg,day:askDay,time:askTime,phone:()=>say("What's your phone number?",300),notes:askNotes,confirm:summary,done:()=>chips([{label:"Book another car",go:()=>{Object.assign(B,{car:"",pkg:null,day:null,slot:"",notes:""});askCar()}}])}[step];
  if(back)setTimeout(back,reduce?0:250);
}

/* ---------- typed replies ---------- */
async function onText(raw){
  const t=raw.trim();if(!t)return;addMsg(esc(t),"me");clearChips();const s=t.toLowerCase();
  if(/^(restart|start over|reset)\b/.test(s)){Object.assign(B,{name:"",car:"",pkg:null,day:null,slot:"",phone:"",notes:""});logEl.innerHTML="";return start()}
  if(/price|cost|how much|rand|\br\d/.test(s)&&step!=="notes")return faq("prices");
  if(/\b(hours|open|close|closing|opening|time do you)\b/.test(s)&&!["time","notes"].includes(step))return faq("hours");
  if(/where|address|location|directions|find you/.test(s)&&step!=="notes")return faq("where");
  if(/\b(services?|what do you (do|offer)|detailing|polish|scratch)/.test(s)&&!["pkg","notes"].includes(step))return faq("services");
  if(/human|person|call|speak to|manager/.test(s)&&step!=="notes")return faq("human");
  switch(step){
    case "name":{const n=t.replace(/^(hi|hey|hello|my name is|i am|i'm|its|it's)\s*/i,"").replace(/[^A-Za-zÀ-ÿ' -]/g,"").trim().split(/\s+/).slice(0,2).join(" ");
      if(!n){await say("Sorry, I didn't catch your name. What should we call you?");return}
      B.name=n.charAt(0).toUpperCase()+n.slice(1);return askCar()}
    case "car":{const m=/suv|bakkie|4x4|double cab/.test(s)?1:/taxi|minibus|quantum|kombi/.test(s)?2:/hatch|sedan|polo|corolla|car|bmw|golf|small/.test(s)?0:3;
      return setCar(BUSINESS.cars[m])}
    case "pkg":{const p=BUSINESS.packages.find(p=>s.includes(p.id)||s.includes(p.name.toLowerCase().split(" ")[0])||(p.id==="vac"&&/vac|vacuum/.test(s))||(p.id==="valet"&&/valet|full|inside/.test(s))||(p.id==="wax"&&/wax|polish/.test(s)));
      if(!p){await say("Which one: quick wash, wash & vac, full valet or wax & polish?");return askPkg()}return setPkg(p)}
    case "day":{const ds=nextDays(7);let d=null,lab="";
      if(/today|now/.test(s)){d=ds[0];lab="Today"}else if(/tomorrow|tmrw|tomoro/.test(s)){d=ds[1];lab="Tomorrow"}
      else{const i=DAYS.findIndex(x=>s.includes(x.toLowerCase().slice(0,3)));if(i>=0){d=ds.find(x=>x.getDay()===i);lab=fmtDay(d)}}
      if(!d){await say("Tap a day below, or type something like “Saturday” or “tomorrow”.");return askDay()}
      if(!slotsFor(d).length){await say("We're closed or fully past opening hours that day. Pick another?");return askDay()}
      return setDay(d,lab)}
    case "time":{const opts=slotsFor(B.day);let pick=null;const hm=s.match(/(\d{1,2})(?:[:h.](\d{2}))?\s*(am|pm)?/);
      if(/late afternoon|evening/.test(s))pick=opts.find(o=>o.startsWith("Late afternoon"));
      else if(/afternoon/.test(s))pick=opts.find(o=>o.startsWith("Afternoon"));
      else if(/late morning/.test(s))pick=opts.find(o=>o.startsWith("Late morning"));
      else if(/morning|early/.test(s))pick=opts.find(o=>o.startsWith("Morning"));
      else if(hm){let h=+hm[1];if(hm[3]==="pm"&&h<12)h+=12;if(!hm[3]&&h<7)h+=12;const m=h*60+(+hm[2]||0);
        const sl=BUSINESS.slots.find(([a,b])=>m>=a&&m<b);pick=sl&&opts.includes(sl[2])?sl[2]:null}
      if(!pick){await say("That time isn't available. Choose one of these:");return askTime()}
      return setTime(pick)}
    case "phone":{const p=cleanPhone(t);if(!p){await say("That doesn't look like a South African number. Try 10 digits like 071 234 5678, or +27…");return}
      B.phone=p;if(editing)return summary();return askNotes()}
    case "notes":{B.notes=t;return summary()}
    case "confirm":{if(/yes|confirm|correct|good|ok|sure|yebo/.test(s))return confirm();if(/no|change|wrong/.test(s))return change();
      await say("Tap <b>Confirm on WhatsApp</b> if it's all right, or <b>Change something</b>.");return summary()}
    default:{await say("I can help you book a wash, or tell you our services, prices, hours and location.");chips([{label:"Book a wash",go:()=>{Object.assign(B,{car:"",pkg:null,day:null,slot:"",notes:""});B.name?askCar():start()}},...FAQ_CHIPS])}
  }
}

/* ---------- open / close ---------- */
let opener=null;
function openChat(from){opener=from||document.activeElement;chat.classList.add("on");chat.setAttribute("aria-hidden","false");chat.inert=false;chatOpen=true;
  $("#fab").setAttribute("aria-expanded","true");nudge.classList.remove("on");nudgeDone=true;
  if(!started)start();setTimeout(()=>{if(matchMedia("(hover:hover)").matches)inp.focus({preventScroll:true})},120)}
function closeChat(){chat.classList.remove("on");chat.setAttribute("aria-hidden","true");chat.inert=true;chatOpen=false;$("#fab").setAttribute("aria-expanded","false");
  if(opener&&document.contains(opener))opener.focus({preventScroll:true})}
$("#chatClose").addEventListener("click",closeChat);
$("#fab").addEventListener("click",()=>chatOpen?closeChat():openChat($("#fab")));
nudge.addEventListener("click",()=>openChat($("#fab")));
document.addEventListener("click",e=>{const a=e.target.closest('a[href="#contact"],[data-chat]');if(!a||chat.contains(a))return;
  if(a.closest(".sheet"))setMenu(false);e.preventDefault();openChat(a)});
addEventListener("keydown",e=>{if(e.key==="Escape"&&chatOpen)closeChat()});
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const v=inp.value;inp.value="";onText(v)});
/* show a small nudge once the visitor has scrolled past the hero */
let nudgeDone=false;addEventListener("scroll",()=>{if(!nudgeDone&&!chatOpen&&scrollY>innerHeight*3.4){nudge.classList.add("on");nudgeDone=true;setTimeout(()=>nudge.classList.remove("on"),9000)}},{passive:true});
/* keep the chat above the phone keyboard */
function vv(){const v=window.visualViewport;if(!v)return;document.documentElement.style.setProperty("--vvh",v.height+"px");document.documentElement.style.setProperty("--vvt",v.offsetTop+"px");if(chatOpen)scrollLog()}
if(window.visualViewport){visualViewport.addEventListener("resize",vv);visualViewport.addEventListener("scroll",vv);vv()}
