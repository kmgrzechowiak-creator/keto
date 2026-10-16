// Sceny: każda definiuje map(), material(), setupCamera() i funkcje tła. Wspólny render() jest poniżej.
window.GLSL_RENDER = `
void material(float mat, vec3 p, inout vec3 n);
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus);

vec3 render(vec3 ro, vec3 rd){
  float t=.2, mat=0.; bool hit=false;
  for(int i=0;i<220;i++){
    vec3 p=ro+rd*t; vec2 h=map(p);
    if(h.x<.0005*t){ mat=h.y; hit=true; break; }
    t+=h.x*.88;
    if(t>30.) break;
  }
  if(!hit) return vec3(.6,.5,.4);
  vec3 p=ro+rd*t; vec3 n=calcNormal(p);
  gAlbedo=vec3(.5); gRough=.5; gSpec=.1; gSss=0.; gEmit=vec3(0.); gUnlit=false;
  material(mat,p,n);
  if(gUnlit) return gEmit;
  float ao=calcAO(p,n);
  float ndl=dot(n,L_KEY);
  float sh=softShadow(p+n*.012, L_KEY, 7.0, 6.0);
  float wrap=max((ndl+gSss)/(1.+gSss),0.);
  vec3 keyCol=vec3(1.0,.89,.72)*3.1;
  vec3 fillCol=vec3(.72,.80,1.0)*.30;
  vec3 skyAmb=mix(vec3(.50,.36,.22), vec3(.92,.89,.84), n.y*.5+.5)*.38;
  vec3 rimC=vec3(1.0,.82,.55)*1.1*pow(max(dot(n,normalize(vec3(.6,.4,-.7))),0.),1.5)*(1.-.6*max(ndl,0.));
  vec3 lin=rimC+keyCol*wrap*mix(1.,sh,1.-gSss*.35) + fillCol*max(dot(n,L_FILL),0.)*ao + skyAmb*ao;
  vec3 col=gEmit + gAlbedo*lin;
  vec3 r=reflect(rd,n);
  float fres=pow(1.-max(dot(-rd,n),0.),5.);
  vec3 e=mix(envMap(r), vec3(.80,.72,.60), gRough);
  col+=e*gSpec*(.12+.88*fres)*ao;
  vec3 hv=normalize(L_KEY-rd);
  col+=keyCol*pow(max(dot(n,hv),0.), mix(220.,14.,gRough))*gSpec*.9*sh;
  return col;
}
void main(){
  vec2 frag=gl_FragCoord.xy+uJit-.5;
  vec2 uv=(2.*frag-uRes)/uRes.y;
  vec3 ro,ta; float fl,ap,focus; setupCamera(ro,ta,fl,ap,focus);
  vec3 ww=normalize(ta-ro), uu=normalize(cross(ww,vec3(0,1,0))), vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+fl*ww);
  vec3 fp=ro+rd*focus; ro+=(uu*uLens.x+vv*uLens.y)*ap; rd=normalize(fp-ro);
  vec3 col=render(ro,rd);
  vec3 prev=texelFetch(uPrev, ivec2(gl_FragCoord.xy), 0).rgb;
  fragColor=vec4(mix(prev,col,uMix),1.);
}
`;

window.SCENES = {};

/* ================= BOCHENEK ================= */
window.SCENES.loaf = `
#define M_BOARD 1.
#define M_TABLE 2.
#define M_CRUST 3.
#define M_SLICE 4.
#define M_WALL 8.
const vec3 LOAF_C = vec3(-0.50, 0.20, -0.12);

vec2 slashField(vec3 q){
  float groove=0., ear=0.;
  for(int i=0;i<3;i++){
    float cx=-0.66+float(i)*0.66;
    vec2 s=rot2(0.50)*(q.xz-vec2(cx,0.0));
    float along=smoothstep(0.66,0.40,abs(s.y));
    groove+=exp(-s.x*s.x/0.0028)*along;
    ear+=exp(-pow(s.x-0.085,2.)/0.0055)*along;
  }
  return vec2(groove,ear);
}
float loafSDF(vec3 p){
  vec3 q=p-LOAF_C;
  float bd=length(q)-2.0; if(bd>0.3) return bd;
  q.z+=0.05*q.x*q.x*q.x*.5;
  float d=sdEllipsoid(q, vec3(1.58,0.64,0.80));
  d=smax(d,-p.y+0.005,0.06);
  vec2 sf=slashField(q);
  float topMask=smoothstep(0.12,0.46,q.y);
  d+=sf.x*0.070*topMask - sf.y*0.034*topMask;
  d+=(fbm2(p*3.1)-.5)*0.028;
  return d;
}
vec3 sliceP(vec3 p, int i){
  vec3 c = i==0 ? vec3(0.98,0.0,-0.32) : vec3(1.28,0.0,0.30);
  vec3 q=p-c;
  q.xz = rot2(i==0 ? 0.62 : 0.34)*q.xz;
  q.xy = rot2(i==0 ? -0.13 : 0.15)*q.xy;
  return q;
}
float sdSlice(vec3 q){
  vec2 a=q.xy-vec2(0.0,0.30);
  float box=sdBox2(a,vec2(0.40,0.30))-0.02;
  vec2 b=q.xy-vec2(0.0,0.64);
  float cap=(length(b/vec2(0.54,0.32))-1.0)*0.32;
  float d2=smin(box,cap,0.11);
  float w=abs(q.z)-0.072;
  return length(max(vec2(d2,w),0.))+min(max(d2,w),0.)-0.013;
}
float sliceD2(vec3 q){
  vec2 a=q.xy-vec2(0.0,0.30);
  float box=sdBox2(a,vec2(0.40,0.30))-0.02;
  vec2 b=q.xy-vec2(0.0,0.64);
  float cap=(length(b/vec2(0.54,0.32))-1.0)*0.32;
  return smin(box,cap,0.11);
}
float crumbsD(vec3 p){
  if(p.y>0.12||p.y<-0.05||abs(p.x)>2.7||abs(p.z)>1.08) return 1.0;
  vec2 c=floor(p.xz*7.0);
  float best=1.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 cc=c+vec2(float(i),float(j));
    float h=hash13(vec3(cc,3.3));
    if(h<0.80) continue;
    vec2 o=hash22(cc+7.7);
    vec3 cp=vec3((cc.x+o.x)/7.0,0.012,(cc.y+o.y)/7.0);
    float r=0.012+0.020*hash13(vec3(cc,9.1));
    best=min(best,sdEllipsoid(p-cp,vec3(r*1.3,r*.8,r)));
  }
  return best;
}
vec2 map(vec3 p){
  vec2 r=vec2(loafSDF(p),M_CRUST);
  float s0=sdSlice(sliceP(p,0)); if(s0<r.x) r=vec2(s0,M_SLICE);
  float s1=sdSlice(sliceP(p,1)); if(s1<r.x) r=vec2(s1,M_SLICE+.5);
  float b=sdRoundBox(p-vec3(0.,-0.085,0.),vec3(2.85,0.085,1.22),0.035); if(b<r.x) r=vec2(b,M_BOARD);
  float bt=sdRoundBox(p-vec3(1.55,0.10,-0.78),vec3(0.34,0.10,0.21),0.035); if(bt<r.x) r=vec2(bt,6.);
  float cr=crumbsD(p); if(cr<r.x) r=vec2(cr,7.);
  float tb=p.y+0.17-0.07*fbm2(p*vec3(.7,0.,.7)); if(tb<r.x) r=vec2(tb,M_TABLE);
  float w=p.z+4.2; if(w<r.x) r=vec2(w,M_WALL);
  return r;
}
vec3 wallColor(vec2 xy){
  vec3 base=mix(vec3(.30,.22,.15), vec3(.72,.64,.52), smoothstep(-0.5,3.6,xy.y));
  float g=exp(-pow(length(xy-vec2(-3.6,2.9))*.34,2.));
  base+=vec3(.95,.82,.55)*g*.9;
  // rozmyte półki / szafki
  float shelf=smoothstep(.12,.0,abs(xy.y-1.15))*.18 + smoothstep(.10,.0,abs(xy.y-2.6))*.12;
  base*=1.-shelf*(.5+.5*vnoise(vec3(xy*.5,1.)));
  for(int i=0;i<26;i++){
    vec2 c=vec2(hash11(float(i)*3.7)*13.-6.5, hash11(float(i)*7.3)*4.6+0.1);
    float rad=.30+hash11(float(i)*11.1)*.8;
    float m=smoothstep(rad,rad*.80,length(xy-c));
    vec3 tint=mix(vec3(.85,.62,.28), vec3(.95,.88,.70), hash11(float(i)*2.3));
    base+=tint*m*(.07+.16*hash11(float(i)*5.5));
  }
  base*=mix(.50,1.0,smoothstep(-0.2,1.6,xy.y));
  float leaf=smoothstep(1.7,.4,length((xy-vec2(4.2,1.7))*vec2(1.0,.55)));
  base=mix(base, vec3(.25,.36,.16), leaf*.7);
  float leaf2=smoothstep(1.2,.3,length((xy-vec2(5.3,2.7))*vec2(.6,1.0)));
  base=mix(base, vec3(.33,.45,.21), leaf2*.5);
  return base;
}
void crumbFace(vec2 uv, inout vec3 alb, inout vec3 n, float depth){
  // uv w jednostkach kromki; depth: odległość od skórki
  float m=holeField(uv*9.0,4.1);
  float m2=holeField(uv*21.0,9.7);
  float dm=holeField(uv*9.0+vec2(0.0,0.045),4.1)-m;
  float dm2=holeField(uv*21.0+vec2(0.0,0.045),9.7)-m2;
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
void material(float mat, vec3 p, inout vec3 n){
  if(mat<1.5){ // deska
    float ring=sin(p.z*22.+fbm(vec3(p.x*1.1,0.,p.z*3.))*7.);
    float fine=fbm(vec3(p.x*1.3,p.y*3.,p.z*46.));
    vec3 w=mix(vec3(.62,.42,.22), vec3(.50,.32,.16), .5+.28*ring);
    w*=.86+.28*fine;
    gAlbedo=w; gRough=.55; gSpec=.18;
    float edge=smoothstep(.0,.10,abs(p.y+.085)-.085+.05);
    gAlbedo*=1.-0.18*edge;
  } else if(mat<2.5){ // len
    float wv=.5+.5*sin(p.x*240.)*sin(p.z*240.);
    float wr=fbm(vec3(p.x*2.,0.,p.z*2.));
    vec3 lc=vec3(.74,.62,.46)*(.93+.07*wv)*(.88+.22*wr);
    gAlbedo=lc;
    gRough=.95; gSpec=.02;
  } else if(mat<3.5){ // skórka
    vec3 q=p-LOAF_C;
    vec2 sf=slashField(q);
    float topMask=smoothstep(0.12,0.46,q.y);
    float h=clamp((q.y+.2)/.85,0.,1.);
    float blotch=fbm(p*2.4+3.);
    float rough=fbm(p*11.0);
    vec3 dark=vec3(.16,.065,.018), mid=vec3(.50,.235,.058), light=vec3(.80,.47,.17);
    float shape=h*.55+blotch*.75-.12+(rough-.5)*.25;
    vec3 c=mix(dark, mid, smoothstep(.02,.58,shape));
    c=mix(c, light, smoothstep(.58,1.0,shape+(h-.5)*.3)*.75);
    c*=.70+.60*rough;
    float fl=smoothstep(.58,.74, fbm(p*3.4+7.))*smoothstep(.2,.75,h);
    float fs=smoothstep(.60,.82,vnoise(p*110.));
    c=mix(c, vec3(.95,.90,.80), clamp(fl*.50+fs*fl*.55,0.,.8));
    float g=clamp(sf.x*topMask,0.,1.);
    c=mix(c, vec3(.88,.70,.42), smoothstep(.30,.85,g)*.95);
    c=mix(c, c*vec3(.75,.58,.42), clamp(sf.y*topMask,0.,1.)*.7);
    gAlbedo=c; gRough=.50; gSpec=.26; gSss=.30;
    float e=.012;
    float bx=fbm(p*14.+vec3(e,0,0))-fbm(p*14.-vec3(e,0,0));
    float by=fbm(p*14.+vec3(0,e,0))-fbm(p*14.-vec3(0,e,0));
    float bz=fbm(p*14.+vec3(0,0,e))-fbm(p*14.-vec3(0,0,e));
    n=normalize(n+vec3(bx,by,bz)*(1.5+.9*(1.-g)) + (vec3(vnoise(p*45.),vnoise(p*45.+4.),vnoise(p*45.+8.))-.5)*.35);
  } else if(mat<4.8){ // kromka
    int i = mat>4.25 ? 1 : 0;
    vec3 q=sliceP(p,i);
    float d2=sliceD2(q);
    float depth=-d2;
    bool face=abs(q.z)>0.060;
    if(face && depth>0.055){
      vec3 a; crumbFace(q.xy*vec2(1.0,1.0)+vec2(float(i)*3.1,0.0), a, n, depth);
      gAlbedo=a; gRough=.9; gSpec=.03; gSss=.8;
    } else {
      float rn=fbm(p*22.);
      vec3 c=mix(vec3(.50,.25,.08), vec3(.72,.42,.16), smoothstep(.0,1.,rn+q.y*.4));
      gAlbedo=c; gRough=.6; gSpec=.2; gSss=.3;
      n=normalize(n+(vec3(fbm(p*30.),fbm(p*30.+5.),fbm(p*30.+9.))-.5)*.5);
    }
  } else if(mat>5.5&&mat<6.5){ // masło
    gAlbedo=vec3(.90,.76,.42)*(.95+.1*fbm(p*20.)); gRough=.35; gSpec=.25; gSss=.9;
  } else if(mat>6.5&&mat<7.5){ // okruszki
    gAlbedo=mix(vec3(.80,.60,.34), vec3(.62,.38,.16), vnoise(p*160.)); gRough=.8; gSpec=.04; gSss=.3;
  } else { gUnlit=true; gEmit=wallColor(p.xy); }
}
void setupCamera(out vec3 ro, out vec3 ta, out float fl, out float aperture, out float focus){
  ro=vec3(0.25,3.05,5.15); ta=vec3(0.00,0.12,0.10); fl=3.55; aperture=0.07; focus=length(ta-ro);
}
`;
