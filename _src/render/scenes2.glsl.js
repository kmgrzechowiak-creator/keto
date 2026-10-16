/* Dodatkowe sceny: bułki, sernik, pierniki, mąki, zbliżenie na kromki. */
const SHARED = `
#define M_BOARD 1.
#define M_TABLE 2.
#define M_WALL 8.
float sdBoard(vec3 p){ return sdRoundBox(p-vec3(0.,-0.085,0.),vec3(2.85,0.085,1.22),0.035); }
float sdTable(vec3 p){ return p.y+0.17-0.07*fbm2(p*vec3(.7,0.,.7)); }
vec3 wallColor(vec2 xy){
#ifdef WARM
  vec3 base=mix(vec3(.20,.13,.08), vec3(.50,.38,.26), smoothstep(-0.5,3.6,xy.y));
#else
  vec3 base=mix(vec3(.30,.22,.15), vec3(.72,.64,.52), smoothstep(-0.5,3.6,xy.y));
#endif
  float g=exp(-pow(length(xy-vec2(-3.6,2.9))*.34,2.));
  base+=vec3(.95,.82,.55)*g*.9;
  float shelf=smoothstep(.12,.0,abs(xy.y-1.15))*.18 + smoothstep(.10,.0,abs(xy.y-2.6))*.12;
  base*=1.-shelf*(.5+.5*vnoise(vec3(xy*.5,1.)));
  for(int i=0;i<26;i++){
    vec2 c=vec2(hash11(float(i)*3.7)*13.-6.5, hash11(float(i)*7.3)*4.6+0.1);
    float rad=.30+hash11(float(i)*11.1)*.8;
    float m=smoothstep(rad,rad*.80,length(xy-c));
#ifdef WARM
    vec3 tint=mix(vec3(1.0,.72,.30), vec3(1.0,.90,.60), hash11(float(i)*2.3));
    base+=tint*m*(.18+.42*hash11(float(i)*5.5));
#else
    vec3 tint=mix(vec3(.85,.62,.28), vec3(.95,.88,.70), hash11(float(i)*2.3));
    base+=tint*m*(.07+.16*hash11(float(i)*5.5));
#endif
  }
  base*=mix(.50,1.0,smoothstep(-0.2,1.6,xy.y));
  float leaf=smoothstep(1.7,.4,length((xy-vec2(4.2,1.7))*vec2(1.0,.55)));
  base=mix(base, vec3(.25,.36,.16), leaf*.7);
  float leaf2=smoothstep(1.2,.3,length((xy-vec2(5.3,2.7))*vec2(.6,1.0)));
  base=mix(base, vec3(.33,.45,.21), leaf2*.5);
  return base;
}
void matBoard(vec3 p){
  float ring=sin(p.z*22.+fbm(vec3(p.x*1.1,0.,p.z*3.))*7.);
  float fine=fbm(vec3(p.x*1.3,p.y*3.,p.z*46.));
  vec3 w=mix(vec3(.62,.42,.22), vec3(.50,.32,.16), .5+.28*ring);
  w*=.86+.28*fine;
  gAlbedo=w; gRough=.55; gSpec=.18;
  float flour=smoothstep(.62,.80,vnoise(p*vec3(26.,1.,26.)))*.16*smoothstep(.45,.8,vnoise(p*1.7));
  gAlbedo=mix(gAlbedo, vec3(.92,.88,.80), flour);
}
void matTable(vec3 p){
  float wv=.5+.5*sin(p.x*240.)*sin(p.z*240.);
  float wr=fbm(vec3(p.x*2.,0.,p.z*2.));
  gAlbedo=vec3(.74,.62,.46)*(.93+.07*wv)*(.88+.22*wr);
  gRough=.95; gSpec=.02;
}
// pory miękiszu (twarz kromki / bułki)
void crumbFace(vec2 uv, float scale, inout vec3 alb, inout vec3 n, float depth){
  float m=holeField(uv*scale,4.1), m2=holeField(uv*scale*2.3,9.7);
  float dm=holeField(uv*scale+vec2(0.0,0.045),4.1)-m;
  float dm2=holeField(uv*scale*2.3+vec2(0.0,0.045),9.7)-m2;
  vec3 crumb=mix(vec3(.88,.70,.44), vec3(.96,.84,.60), smoothstep(0.0,.28,depth));
  crumb*=0.93+0.14*fbm(vec3(uv*14.0,2.0));
  float h1=1.-smoothstep(.78,1.0,m);
  float h2=(1.-smoothstep(.70,1.0,m2))*.7;
  vec3 holeCol=mix(vec3(.46,.30,.14), vec3(.80,.62,.36), smoothstep(0.,1.,m)*.9);
  alb=mix(crumb, holeCol, clamp(h1+h2*(1.-h1),0.,1.)*.88);
  float rim=smoothstep(.55,1.05,m)*(1.-smoothstep(1.0,1.15,m));
  alb+=vec3(.14,.11,.06)*rim*clamp(dm*6.,0.,1.);
  n=normalize(n+vec3(0.,-dm*.55-dm2*.25,0.)*h1);
}
float sdPlate(vec3 p){
  float disc=sdCylY(p-vec3(0,0.03,0),0.03,2.05);
  float rim=length(vec2(length(p.xz)-1.97,p.y-0.07))-0.065;
  return smin(disc,rim,0.10);
}
void matPlate(vec3 p, inout vec3 n){
  gAlbedo=vec3(.93,.92,.89)*(.97+.03*fbm(p*8.)); gRough=.18; gSpec=.7; gSss=.2;
}
vec2 sceneCommon(vec3 p, vec2 r){
  float b=sdBoard(p); 
  float tb=sdTable(p); if(tb<r.x) r=vec2(tb,M_TABLE);
  float w=p.z+4.2; if(w<r.x) r=vec2(w,M_WALL);
  return r;
}
`;

/* ================= BUŁKI ================= */
window.SCENES.buns = SHARED + `
#define M_BUN 3.
#define M_HALF 4.
#define M_BUTTER 6.
vec3 bunC(int i){ return i==0 ? vec3(-1.40,0.30,-0.40) : (i==1 ? vec3(-0.22,0.30,-0.66) : vec3(-0.72,0.30,0.52)); }
float bunD(vec3 p, int i){
  vec3 q=p-bunC(i);
  float bd=length(q)-1.0; if(bd>.25) return bd;
  float d=sdEllipsoid(q, vec3(.68,.47,.68));
  d=smax(d,-p.y+0.005,0.05);
  d+=(fbm2(p*4.+float(i)*3.)-.5)*0.02;
  return d;
}
const vec3 HALF_C=vec3(1.50,0.36,0.12);
float halfD(vec3 p){
  vec3 q=p-HALF_C;
  float d=sdEllipsoid(q, vec3(.66,.40,.66));
  d=max(d,q.y);
  return d;
}
vec2 map(vec3 p){
  vec2 r=vec2(bunD(p,0),M_BUN);
  float d1=bunD(p,1); if(d1<r.x) r=vec2(d1,M_BUN);
  float d2=bunD(p,2); if(d2<r.x) r=vec2(d2,M_BUN);
  float h=halfD(p); if(h<r.x) r=vec2(h,M_HALF);
  float bt=sdRoundBox(p-vec3(1.42,0.405,0.10),vec3(.21,.045,.14),0.03); if(bt<r.x) r=vec2(bt,M_BUTTER);
  float b=sdBoard(p); if(b<r.x) r=vec2(b,M_BOARD);
  return sceneCommon(p,r);
}
float seedMask(vec2 uv){
  vec2 g=floor(uv), f=fract(uv); float m=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)); vec2 c=g+o;
    if(hash13(vec3(c,5.5))<.18) continue;
    vec2 pt=o+hash22(c)*.65+.17; vec2 d=f-pt;
    d=rot2(hash13(vec3(c,1.7))*3.14)*d; d*=vec2(1.0,2.4);
    m=max(m,1.-smoothstep(.15,.23,length(d)));
  }
  return m;
}
void material(float mat, vec3 p, inout vec3 n){
  if(mat<1.5){ matBoard(p); }
  else if(mat<2.5){ matTable(p); }
  else if(mat<3.5){
    float h=clamp(p.y/.7,0.,1.), bl=fbm(p*2.2+3.), rg=fbm(p*10.);
    vec3 dark=vec3(.20,.075,.018), mid=vec3(.46,.21,.055), light=vec3(.70,.39,.13);
    float shape=h*.6+bl*.7-.2;
    vec3 c=mix(dark,mid,smoothstep(.0,.55,shape)); c=mix(c,light,smoothstep(.5,1.0,shape)*.8);
    c*=.80+.4*rg;
    float up=smoothstep(.45,.85,n.y);
    float sm=seedMask(p.xz*9.+vec2(2.,7.))*up;
    float sm2=seedMask((p.xz+vec2(.003,0.))*9.+vec2(2.,7.))*up;
    c=mix(c, vec3(.93,.85,.64)*(.9+.2*vnoise(p*60.)), sm*.97);
    gAlbedo=c; gRough=.28; gSpec=.5; gSss=.3;
    n=normalize(n+vec3(-(sm2-sm)*6., 0., 0.) + (vec3(vnoise(p*30.),vnoise(p*30.+3.),vnoise(p*30.+6.))-.5)*.28);
  } else if(mat<4.5){
    vec3 q=p-HALF_C;
    if(q.y>-0.012){ // przekrój
      float r=length(q.xz)/.66; float depth=(1.-r)*.66;
      if(depth>.05){ vec3 a; crumbFace(q.xz, 7.0, a, n, depth); gAlbedo=a; gRough=.9; gSpec=.03; gSss=.8; }
      else { gAlbedo=vec3(.62,.34,.10); gRough=.4; gSpec=.3; }
    } else { gAlbedo=mix(vec3(.45,.21,.06),vec3(.72,.40,.14), fbm(p*3.)); gRough=.4; gSpec=.35; gSss=.3; }
  } else if(mat>5.5&&mat<6.5){ gAlbedo=vec3(.93,.80,.42)*(.95+.1*fbm(p*20.)); gRough=.3; gSpec=.3; gSss=.9; }
  else { gUnlit=true; gEmit=wallColor(p.xy); }
}
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus){
  ro=vec3(0.35,3.0,5.5); ta=vec3(0.25,0.12,0.05); fl=3.35; aperture=0.065; focus=length(ta-ro);
}
`;

/* ================= SERNIK ================= */
window.SCENES.cake = SHARED + `
#define M_CAKE 3.
#define M_RASP 4.
#define M_MINT 5.
#define M_PLATE 6.
#define M_COULIS 7.
const vec3 CAKE_C=vec3(-0.25,0.48,0.00);
vec3 cakeP(vec3 p){ vec3 q=p-CAKE_C; q.xz=rot2(0.30)*q.xz; return q; }
vec3 raspC(int i){ return i==0 ? vec3(-0.58,0.99,0.10) : (i==1 ? vec3(-0.30,1.00,-0.14) : (i==2 ? vec3(-0.36,0.96,0.26) : (i==3 ? vec3(0.95,0.20,0.52) : vec3(1.25,0.19,-0.05)))); }
vec3 mintP(vec3 p){ vec3 q=p-vec3(-0.05,0.93,0.02); q.xz=rot2(-0.5)*q.xz; q.xy=rot2(0.35)*q.xy; return q; }
vec2 map(vec3 p){
  float pl=sdPlate(p); vec2 r=vec2(pl,M_PLATE);
  float cd=sdRoundBox(cakeP(p),vec3(.64,.42,.44),0.022); if(cd<r.x) r=vec2(cd,M_CAKE);
  for(int i=0;i<5;i++){ vec3 c=raspC(i); float rd=sdSphere(p-c,.155); if(rd<r.x) r=vec2(rd,M_RASP); }
  float ml=sdEllipsoid(mintP(p),vec3(.26,.020,.12)); if(ml<r.x) r=vec2(ml,M_MINT);
  float cl=sdEllipsoid(p-vec3(0.78,0.075,0.50),vec3(.55,.022,.20)); if(cl<r.x) r=vec2(cl,M_COULIS);
  return sceneCommon(p,r);
}
void material(float mat, vec3 p, inout vec3 n){
  if(mat<1.5){ matBoard(p); }
  else if(mat<2.5){ matTable(p); }
  else if(mat<3.5){
    vec3 q=cakeP(p); float ly=q.y+.42; // 0..0.84
    if(ly<.17){ // spód
      float s=fbm(p*38.), s2=vnoise(p*120.);
      gAlbedo=mix(vec3(.28,.13,.045), vec3(.55,.30,.12), s)*(.8+.4*s2); gRough=.8; gSpec=.05;
      n=normalize(n+(vec3(vnoise(p*60.),vnoise(p*60.+4.),vnoise(p*60.+8.))-.5)*.7);
    } else if(ly>.80){ // wierzch
      float br=smoothstep(.45,.75,fbm(p*5.+2.));
      gAlbedo=mix(vec3(.96,.82,.50), vec3(.78,.52,.20), br*.7); gRough=.5; gSpec=.18; gSss=.6;
      n=normalize(n+(vec3(vnoise(p*22.),vnoise(p*22.+4.),vnoise(p*22.+8.))-.5)*.10);
    } else { // krem
      gAlbedo=vec3(.97,.89,.64)*(.96+.06*fbm(p*14.)); gRough=.6; gSpec=.10; gSss=.95;
      float ln=smoothstep(.0,.015,abs(ly-.17)-.004);
      gAlbedo*=mix(.72,1.,ln);
      n=normalize(n+(vec3(vnoise(p*40.),vnoise(p*40.+4.),vnoise(p*40.+8.))-.5)*.05);
    }
  } else if(mat<4.5){
    int bi=0; float bd=1e9; for(int i=0;i<5;i++){ float d=length(p-raspC(i)); if(d<bd){bd=d; bi=i;} }
    vec3 dir=normalize(p-raspC(bi));
    float lump=smoothstep(.30,.62,vnoise(dir*10.+float(bi)*3.));
    float e=.04; float gx=vnoise((dir+vec3(e,0,0))*10.+float(bi)*3.)-vnoise((dir-vec3(e,0,0))*10.+float(bi)*3.);
    float gy=vnoise((dir+vec3(0,e,0))*10.+float(bi)*3.)-vnoise((dir-vec3(0,e,0))*10.+float(bi)*3.);
    float gz=vnoise((dir+vec3(0,0,e))*10.+float(bi)*3.)-vnoise((dir-vec3(0,0,e))*10.+float(bi)*3.);
    gAlbedo=mix(vec3(.30,.01,.04), vec3(.80,.07,.14), lump); gRough=.30; gSpec=.55; gSss=.5;
    n=normalize(n+vec3(gx,gy,gz)*1.6);
  } else if(mat<5.5){
    vec3 q=mintP(p); float vein=smoothstep(.02,.0,abs(q.z)-.004)+smoothstep(.02,0.,abs(abs(q.z)-(.04+.12*abs(q.x)))-.003)*.5;
    gAlbedo=mix(vec3(.10,.30,.06), vec3(.30,.50,.16), vein*.6+.2*fbm(p*20.)); gRough=.4; gSpec=.3; gSss=.6;
    n=normalize(n+vec3(0.,vein*.2,0.));
  } else if(mat<6.5){ matPlate(p,n); }
  else if(mat<7.5){ gAlbedo=vec3(.38,.01,.05); gRough=.15; gSpec=.9; gSss=.4; }
  else { gUnlit=true; gEmit=wallColor(p.xy); }
}
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus){
  ro=vec3(0.25,3.2,5.9); ta=vec3(0.15,0.25,0.15); fl=3.0; aperture=0.06; focus=length(ta-ro);
}
`;

/* ================= PIERNIKI (święta) ================= */
window.SCENES.holiday = `#define WARM 1\n` + SHARED + `
#define M_COOKIE 3.
#define M_CINN 4.
#define M_BERRY 5.
float sdStar(vec2 p, float r, float m){
  const float an=PI/5.; float en=PI/m; vec2 acs=vec2(cos(an),sin(an)); vec2 ecs=vec2(cos(en),sin(en));
  float bn=mod(atan(p.x,p.y),2.0*an)-an;
  p=length(p)*vec2(cos(bn),abs(sin(bn)));
  p-=r*acs; p+=ecs*clamp(-dot(p,ecs),0.0,r*acs.y/ecs.y);
  return length(p)*sign(p.x);
}
vec3 cookC(int i){ return i==0 ? vec3(-1.20,0.0,0.15) : (i==1 ? vec3(0.10,0.0,-0.50) : vec3(0.45,0.0,0.70)); }
float cookA(int i){ return i==0 ? 0.25 : (i==1 ? 0.95 : 0.55); }
vec3 cookP(vec3 p, int i){ vec3 q=p-cookC(i); q.xz=rot2(cookA(i))*q.xz; return q; }
float sdCookie(vec3 q){
  float d2=sdStar(q.xz,0.70,3.1)-0.06;
  float w=abs(q.y-0.055)-0.055;
  return length(max(vec2(d2,w),0.))+min(max(d2,w),0.)-0.02;
}
vec3 berryC(int i){ return i==0 ? vec3(1.75,0.085,0.00) : (i==1 ? vec3(1.98,0.085,0.30) : (i==2 ? vec3(1.62,0.085,0.38) : (i==3 ? vec3(2.05,0.085,-0.28) : vec3(1.85,0.085,0.62)))); }
vec2 map(vec3 p){
  vec2 r=vec2(sdCookie(cookP(p,0)),M_COOKIE);
  float c1=sdCookie(cookP(p,1)); if(c1<r.x) r=vec2(c1,M_COOKIE);
  float c2=sdCookie(cookP(p,2)); if(c2<r.x) r=vec2(c2,M_COOKIE);
  float s1=sdCapsule(p,vec3(-2.25,0.07,0.92),vec3(-0.85,0.07,1.00),0.07); if(s1<r.x) r=vec2(s1,M_CINN);
  float s2=sdCapsule(p,vec3(-2.15,0.07,0.68),vec3(-1.05,0.07,0.52),0.07); if(s2<r.x) r=vec2(s2,M_CINN);
  for(int i=0;i<5;i++){ float bd=sdSphere(p-berryC(i),.088); if(bd<r.x) r=vec2(bd,M_BERRY); }
  float b=sdBoard(p); if(b<r.x) r=vec2(b,M_BOARD);
  return sceneCommon(p,r);
}
float icing(vec2 xz, float d2){
  float line=1.-smoothstep(.010,.026,abs(d2+0.20));
  float dot0=1.-smoothstep(.055,.075,length(xz));
  float tips=0.; 
  for(int k=0;k<5;k++){ float a=float(k)*1.2566; vec2 t=vec2(sin(a),cos(a))*.50; tips=max(tips,1.-smoothstep(.030,.045,length(xz-t))); }
  return clamp(line+dot0+tips,0.,1.);
}
void material(float mat, vec3 p, inout vec3 n){
  if(mat<1.5){ matBoard(p); }
  else if(mat<2.5){ matTable(p); }
  else if(mat<3.5){
    int bi=0; float bd=1e9; for(int i=0;i<3;i++){ float d=length(p-cookC(i)-vec3(0,.05,0)); if(d<bd){bd=d;bi=i;} }
    vec3 q=cookP(p,bi); float d2=sdStar(q.xz,0.70,3.1)-0.06;
    float depth=-d2;
    float sp=vnoise(p*70.), sp2=fbm(p*9.);
    vec3 body=mix(vec3(.30,.135,.045), vec3(.48,.24,.09), sp2);
    body*=.78+.4*sp; body=mix(body, body*.65, smoothstep(.07,.0,depth)); 
    float ic=0.;
    if(q.y>.085){
      ic=icing(q.xz,d2);
      float e=.012;
      float ix=icing(q.xz+vec2(e,0.),d2)-icing(q.xz-vec2(e,0.),d2);
      float iz=icing(q.xz+vec2(0.,e),d2)-icing(q.xz-vec2(0.,e),d2);
      n=normalize(n+vec3(-ix,0.,-iz)*.9);
    }
    gAlbedo=mix(body, vec3(.96,.94,.90), ic); gRough=mix(.85,.45,ic); gSpec=mix(.05,.25,ic); gSss=.3;
    n=normalize(n+(vec3(vnoise(p*44.),vnoise(p*44.+4.),vnoise(p*44.+8.))-.5)*.28*(1.-ic));
  } else if(mat<4.5){
    float stripe=sin(p.x*70.+fbm(p*8.)*5.);
    gAlbedo=mix(vec3(.46,.23,.085), vec3(.62,.34,.14), .5+.5*stripe)*(.85+.3*vnoise(p*50.));
    gRough=.7; gSpec=.08; gSss=.2;
    n=normalize(n+vec3(0.,.25*stripe,0.));
  } else if(mat<5.5){ gAlbedo=vec3(.60,.03,.07)*(.9+.2*vnoise(p*30.)); gRough=.18; gSpec=.9; gSss=.4; }
  else { gUnlit=true; gEmit=wallColor(p.xy); }
}
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus){
  ro=vec3(0.30,3.2,5.4); ta=vec3(0.30,0.05,0.20); fl=3.25; aperture=0.07; focus=length(ta-ro);
}
`;

/* ================= MĄKI (miski) ================= */
window.SCENES.flours = SHARED + `
#define M_BOWL 3.
#define M_FLOUR 4.
#define M_SPOON 5.
const float BX = 1.80;
vec3 bowlC(int i){ return vec3((float(i)-1.)*BX, 0., 0.10); }
float bowlShell(vec3 q){
  vec3 c=q-vec3(0,0.52,0);
  float outer=length(c)-0.80, inner=length(c)-0.72;
  float sh=max(outer,-inner); sh=max(sh,c.y);
  float foot=sdCylY(q-vec3(0,0.03,0),0.03,0.36);
  return min(sh,foot);
}
float flourMound(vec3 q){
  vec3 c=q-vec3(0,0.50,0);
  float d=sdEllipsoid(c-vec3(0,0.0,0), vec3(.715,.20,.715));
  return max(d, length(c)-0.715);
}
vec2 map(vec3 p){
  vec2 r=vec2(1e5,0.);
  for(int i=0;i<3;i++){
    vec3 q=p-bowlC(i);
    float s=bowlShell(q); if(s<r.x) r=vec2(s,M_BOWL+float(i)*.1);
    float f=flourMound(q); if(f<r.x) r=vec2(f,M_FLOUR+float(i)*.1);
  }
  float sh=sdCapsule(p,vec3(-0.20,0.05,1.00),vec3(1.30,0.05,0.82),0.04);
  vec3 bq=p-vec3(-0.34,0.05,1.03); float sb=sdEllipsoid(bq,vec3(.22,.045,.15)); 
  float sp=min(sh,sb); if(sp<r.x) r=vec2(sp,M_SPOON);
  float b=sdBoard(p); if(b<r.x) r=vec2(b,M_BOARD);
  return sceneCommon(p,r);
}
void material(float mat, vec3 p, inout vec3 n){
  if(mat<1.5){ matBoard(p); }
  else if(mat<2.5){ matTable(p); }
  else if(mat<4.0){
    int i=int(floor((mat-M_BOWL)*10.+.5));
    vec3 col = i==0 ? vec3(.40,.50,.38) : (i==1 ? vec3(.86,.80,.68) : vec3(.66,.36,.24));
    float sp=vnoise(p*160.);
    gAlbedo=col*(.92+.16*fbm(p*9.))*(1.-.08*step(.86,sp)); gRough=.28; gSpec=.55; gSss=.1;
  } else if(mat<5.0){
    int i=int(floor((mat-M_FLOUR)*10.+.5));
    vec3 col = i==0 ? vec3(.84,.70,.48) : (i==1 ? vec3(.97,.95,.90) : vec3(.88,.78,.40));
    float grain=vnoise(p*140.), rip=fbm(p*7.);
    gAlbedo=col*(.90+.14*grain)*(.94+.10*rip); gRough=1.; gSpec=.01; gSss=.6;
    n=normalize(n+(vec3(vnoise(p*95.),vnoise(p*95.+3.),vnoise(p*95.+6.))-.5)*.45+vec3(0.,.1*(rip-.5),0.));
  } else if(mat<6.0){
    float gr=sin(p.x*60.+fbm(p*5.)*6.);
    gAlbedo=mix(vec3(.56,.36,.18), vec3(.42,.26,.12), .5+.5*gr)*(.9+.2*vnoise(p*40.)); gRough=.55; gSpec=.2;
  } else { gUnlit=true; gEmit=wallColor(p.xy); }
}
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus){
  ro=vec3(0.0,2.9,6.3); ta=vec3(0.0,0.22,0.22); fl=3.1; aperture=0.06; focus=length(ta-ro);
}
`;

/* ================= ZBLIŻENIE NA KROMKI ================= */
window.SCENES.slices = window.SCENES.loaf.replace(/ro=vec3\(0\.25,3\.05,5\.15\);[^\n]*\n/, "ro=vec3(2.7,1.55,3.7); ta=vec3(1.05,0.38,0.0); fl=3.0; aperture=0.10; focus=length(ta-ro);\n");

/* ================= HERO (16:9, bochenek po prawej) ================= */
window.SCENES.hero = window.SCENES.loaf.replace(/ro=vec3\(0\.25,3\.05,5\.15\);[^\n]*\n/, "ro=vec3(0.7,2.75,5.9); ta=vec3(-1.20,0.20,0.10); fl=3.05; aperture=0.07; focus=length(ta-ro);\n");
