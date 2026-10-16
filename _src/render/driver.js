const q = new URLSearchParams(location.search);
const W = +q.get('w') || 640, H = +q.get('h') || 480, PASSES = +q.get('n') || 6, SCENE = q.get('scene') || 'loaf', STRIP = +q.get('strip') || 32;
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
gl.getExtension('EXT_color_buffer_float');
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { window.__error = gl.getShaderInfoLog(s); console.error(window.__error); throw new Error(window.__error); } return s; }
function prog(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
const VS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;
const accum = prog(VS, GLSL_COMMON + '\n' + SCENES[SCENE] + '\n' + GLSL_RENDER);
const disp = prog(VS, `#version 300 es
precision highp float;
uniform vec2 uRes; uniform sampler2D uTex; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec3 c = texelFetch(uTex, ivec2(gl_FragCoord.xy), 0).rgb * 0.30;
  c = (c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
  vec2 uv = gl_FragCoord.xy/uRes - .5;
  c *= 1.0 - 0.55*pow(length(uv*vec2(1.0,1.05)), 2.6);
  float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, 1.12);
  c = pow(clamp(c,0.,1.), vec3(1./2.2));
  c += (h(gl_FragCoord.xy)-.5)*.022;
  o = vec4(c,1.);
}`);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
function tex() { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return t; }
const T = [tex(), tex()]; const F = T.map(t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; });
function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
function bind(p) { gl.useProgram(p); const loc = gl.getAttribLocation(p, 'a'); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); }
const sleep = () => new Promise(r => setTimeout(r, 0));
async function run() {
  const t0 = performance.now(); let cur = 0;
  for (let n = 0; n < PASSES; n++) {
    const src = T[cur], dst = T[1 - cur];
    gl.bindFramebuffer(gl.FRAMEBUFFER, F[1 - cur]); gl.viewport(0, 0, W, H);
    bind(accum);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(gl.getUniformLocation(accum, 'uPrev'), 0);
    gl.uniform2f(gl.getUniformLocation(accum, 'uRes'), W, H);
    gl.uniform2f(gl.getUniformLocation(accum, 'uJit'), halton(n + 1, 2) - .5, halton(n + 1, 3) - .5);
    const a = halton(n + 1, 5) * 6.2831853, r = Math.sqrt(halton(n + 1, 7));
    gl.uniform2f(gl.getUniformLocation(accum, 'uLens'), Math.cos(a) * r, Math.sin(a) * r);
    gl.uniform1f(gl.getUniformLocation(accum, 'uMix'), 1 / (n + 1));
    gl.enable(gl.SCISSOR_TEST);
    for (let y = 0; y < H; y += STRIP) { gl.scissor(0, y, W, Math.min(STRIP, H - y)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish(); await sleep(); }
    gl.disable(gl.SCISSOR_TEST);
    cur = 1 - cur;
    window.__progress = n + 1;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
  bind(disp); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T[cur]);
  gl.uniform1i(gl.getUniformLocation(disp, 'uTex'), 0); gl.uniform2f(gl.getUniformLocation(disp, 'uRes'), W, H);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.finish();
  window.__ms = Math.round(performance.now() - t0); window.__done = true;
}
run().catch(e => { window.__error = String(e); });
