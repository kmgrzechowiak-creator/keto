// Wspólna część shadera: szum, prymitywy SDF, kamera, oświetlenie, marsz promieni.
window.GLSL_COMMON = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uRes;
uniform vec2 uJit;
uniform vec2 uLens;
uniform float uMix;
uniform sampler2D uPrev;
out vec4 fragColor;
#define PI 3.14159265

float hash11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float hash13(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
vec3 hash33(vec3 p3){ p3=fract(p3*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x), mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x), mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y), f.z);
}
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5;} return s; }
float fbm2(vec3 p){ float a=.5,s=0.; for(int i=0;i<2;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5;} return s; }
mat2 rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float sdBox2(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
float sdEllipsoid(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdSphere(vec3 p, float r){ return length(p)-r; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdCylY(vec3 p, float h, float r){ vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h); return min(max(d.x,d.y),0.)+length(max(d,0.)); }
float smin(float a,float b,float k){ float h=max(k-abs(a-b),0.)/k; return min(a,b)-h*h*k*.25; }
float smax(float a,float b,float k){ return -smin(-a,-b,k); }

// pory miękiszu: zwraca (m, dm) – m<1 wewnątrz pory, dm = pochodna kierunkowa do cieniowania
float holeField(vec2 uv, float seed){
  vec2 g=floor(uv), f=fract(uv); float best=9.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)); vec2 c=g+o;
    vec2 h=hash22(c+seed); float r=.10+.34*pow(hash22(c*1.7+seed+3.1).x,2.2);
    vec2 pt=o+h; vec2 d=(f-pt)*vec2(1.0,.78);
    best=min(best,length(d)/r);
  }
  return best;
}

vec3 gAlbedo; float gRough, gSpec, gSss; vec3 gEmit; bool gUnlit;
vec3 L_KEY = normalize(vec3(-0.62,0.78,0.52));
vec3 L_FILL = normalize(vec3(0.75,0.30,0.55));

// środowisko do odbić: miękka bryła okienna + niebo
vec3 envMap(vec3 rd){
  vec3 sky = mix(vec3(.72,.62,.50), vec3(1.05,.98,.88), smoothstep(-.2,.9,rd.y));
  float win = smoothstep(.93,.985,dot(rd,L_KEY));
  return sky*0.75 + vec3(1.0,.93,.80)*win*5.0;
}

float softShadow(vec3 ro, vec3 rd, float tmax, float k);
float calcAO(vec3 p, vec3 n);
vec2 map(vec3 p);

vec3 calcNormal(vec3 p){
  const vec2 e=vec2(1.,-1.)*.0007;
  return normalize(e.xyy*map(p+e.xyy).x + e.yyx*map(p+e.yyx).x + e.yxy*map(p+e.yxy).x + e.xxx*map(p+e.xxx).x);
}
float softShadow(vec3 ro, vec3 rd, float tmax, float k){
  float res=1., t=.03;
  for(int i=0;i<36;i++){
    float h=map(ro+rd*t).x;
    res=min(res,k*h/t);
    t+=clamp(h,.02,.30);
    if(res<.003||t>tmax) break;
  }
  res=clamp(res,0.,1.);
  return res*res*(3.-2.*res);
}
float calcAO(vec3 p, vec3 n){
  float occ=0., sca=1.;
  for(int i=0;i<5;i++){
    float h=.015+.11*float(i)/4.;
    float d=map(p+h*n).x;
    occ+=(h-d)*sca; sca*=.9;
  }
  return clamp(1.-1.9*occ,0.,1.);
}
`;
