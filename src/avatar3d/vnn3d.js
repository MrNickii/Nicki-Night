/* Virtual Nicki Night: 3D avatar engine (Three.js).
   The 2D style-guide art IS the 3D wardrobe: every body part and garment is a shell grown from its own 2D
   silhouette, and the original artwork is projected back onto it. Dancers share a small set of animated
   skeletons (one per dance and phase), so a big crowd costs about the same CPU as a small one. */
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0), ZF = new THREE.Vector3(0, 0, 1), IDENT = new THREE.Matrix4();
const SHORT = { LeftLeg: .62, RightLeg: .62, LeftFoot: .62, RightFoot: .62, LeftForeArm: .74, RightForeArm: .74, LeftHand: .74, RightHand: .74, LeftArm: .9, RightArm: .9, Spine1: .8, Spine2: .8, Neck: .55, Head: .6 };
const DANCE_CLIP = { groove: 'Hip_Hop_Dancing', bounce: 'Hip_Hop_Dancing_1', rock: 'Hip_Hop_Dancing_2', shuffle: 'Hip_Hop_Dancing_3', pump: 'Hip_Hop_Dancing_4', wave: 'Hip_Hop_Dancing_5', bboy: 'Bboy_Hip_Hop_Move', twerk: 'Dancing_Twerk', snake: 'Snake_Hip_Hop_Dance' };
const DANCES = Object.keys(DANCE_CLIP);
const PHASES = 4;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex3 = h => { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

/* ------------------------------------------------------------------ geometry accumulator */
class GB {
  constructor() { this.p = []; this.s = []; this.w = []; this.uv = []; this.t = []; this.i = []; this.n = 0; }
  v(pos, sk, uv4, tint) { this.p.push(pos.x, pos.y, pos.z); const a = sk.slice(0, 4); let tot = 0; a.forEach(x => tot += x[1]); for (let k = 0; k < 4; k++) { const e = a[k]; this.s.push(e ? e[0] : 0); this.w.push(e ? e[1] / (tot || 1) : 0); } this.uv.push(uv4[0], uv4[1], uv4[2], uv4[3]); this.t.push(tint[0], tint[1], tint[2]); return this.n++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.s, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.w, 4));
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(this.uv, 4));
    g.setAttribute('aTint', new THREE.Float32BufferAttribute(this.t, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeVertexNormals();
    /* smooth normals across seams: vertices sharing a position share a normal */
    const P = g.attributes.position, N = g.attributes.normal, H = new Map();
    for (let i = 0; i < P.count; i++) { const k = Math.round(P.getX(i) * 20) + ',' + Math.round(P.getY(i) * 20) + ',' + Math.round(P.getZ(i) * 20); let e = H.get(k); if (!e) H.set(k, e = [0, 0, 0, []]); e[0] += N.getX(i); e[1] += N.getY(i); e[2] += N.getZ(i); e[3].push(i); }
    for (const e of H.values()) { if (e[3].length < 2) continue; const l = Math.hypot(e[0], e[1], e[2]) || 1; for (const i of e[3]) N.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); }
    return g;
  }
}

/* rows: [[y, xl, xr], ...] sampled every few px -> value at any y (linear), or null when empty */
function rowAt(rows, y) {
  if (!rows || !rows.length) return null;
  if (y <= rows[0][0]) return rows[0][1] < 0 ? null : rows[0];
  for (let i = 1; i < rows.length; i++) {
    const b = rows[i]; if (y > b[0]) continue; const a = rows[i - 1];
    if (a[1] < 0 && b[1] < 0) return null; if (a[1] < 0) return b; if (b[1] < 0) return a;
    const f = (y - a[0]) / Math.max(1, b[0] - a[0]); return [y, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  const z = rows[rows.length - 1]; return z[1] < 0 ? null : z;
}
function rowSpan(rows) { let a = 1e9, b = -1e9; for (const r of rows) if (r[1] >= 0) { a = Math.min(a, r[0]); b = Math.max(b, r[0]); } return a > b ? null : [a, b]; }

/* ------------------------------------------------------------------ engine */
export async function create(opts) {
  const base = opts.base || 'vnn3d/', CAT = opts.catalog, W = opts.w || 1920, H = opts.h || 1080;
  const yh = opts.horizon != null ? opts.horizon : 276, F = 2000 * H / 1080, CAMH = 3.0;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  canvas.style.cssText = opts.css != null ? opts.css : 'position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none;z-index:1';
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.capture });
  if (!R.capabilities.isWebGL2) throw new Error('WebGL2 not available');
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), rigRoot = new THREE.Group(); scene.add(rigRoot);
  /* a level camera with its lens shifted so the horizon sits exactly where the 2D room's perspective puts it */
  const Hf = 2 * (H - yh), cam = new THREE.PerspectiveCamera(2 * Math.atan((Hf / 2) / F) * 180 / Math.PI, W / Hf, 0.5, 4000);
  cam.position.set(0, CAMH, 0); cam.lookAt(0, CAMH, -1); cam.setViewOffset(W, Hf, 0, Hf / 2 - yh, W, H); cam.updateMatrixWorld();

  /* lights: soft club sky, a white key from the front, pink rim from behind, two colour lights that breathe with the beat */
  const hemi = new THREE.HemisphereLight(0xffe4f2, 0x40142f, 1.55); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(2, 8, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6fc4, 1.1); rim.position.set(0, 5, -12); scene.add(rim);
  const pk = new THREE.PointLight(0xff3fa4, 0, 0, 0), cy = new THREE.PointLight(0x46c8ff, 0, 0, 0); pk.position.set(-6, 5, -10); cy.position.set(6, 5, -10); scene.add(pk, cy);

  /* ---------------- assets */
  const j = u => fetch(base + u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  const [RIG, AT, CLB] = await Promise.all([j('rig.json'), j('atlas.json'), fetch(base + 'clips.bin').then(r => r.arrayBuffer())]);
  const PAGE = AT.page, NPG = AT.pages + 1, FACEPG = AT.pages;
  const pix = new Uint8Array(PAGE * PAGE * 4 * NPG);
  const cv = document.createElement('canvas'); cv.width = cv.height = PAGE; const cx = cv.getContext('2d', { willReadFrequently: true });
  for (let p = 0; p < AT.pages; p++) {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('atlas' + p)); i.src = base + 'atlas' + p + '.' + (AT.ext || 'webp') + '?v=' + (opts.ver || 1); });
    cx.clearRect(0, 0, PAGE, PAGE); cx.drawImage(im, 0, 0); pix.set(cx.getImageData(0, 0, PAGE, PAGE).data, p * PAGE * PAGE * 4);
  }
  const BTIM = {}; for (const [k, src] of Object.entries(opts.btFaces || {})) { try { BTIM[k] = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); } catch (e) {} }
  const FACES = drawFaces(cx, PAGE); pix.set(cx.getImageData(0, 0, PAGE, PAGE).data, FACEPG * PAGE * PAGE * 4);
  const atlas = new THREE.DataArrayTexture(pix, PAGE, PAGE, NPG);
  atlas.format = THREE.RGBAFormat; atlas.type = THREE.UnsignedByteType; atlas.colorSpace = THREE.NoColorSpace;
  atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter; atlas.anisotropy = 4; atlas.needsUpdate = true;

  /* ---------------- shared materials */
  const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 165, 255, 215, 212, 222, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const U = { uAtlas: { value: atlas }, uFace: { value: new THREE.Vector2() }, uOut: { value: 0.55 } };
  const VDECL = 'attribute vec4 aUv;\nattribute vec3 aTint;\nout vec2 vAUv;\nflat out float vLayer;\nflat out float vMode;\nout vec3 vTint;\n';
  const FDECL = 'uniform highp sampler2DArray uAtlas;\nuniform vec2 uFace;\nin vec2 vAUv;\nflat in float vLayer;\nflat in float vMode;\nin vec3 vTint;\n';
  const FCORE = `
    vec4 tx = vec4(1.0); vec3 col = vTint; int md = int(vMode + 0.5);
    if (md != 3) {
      vec2 uv = vAUv; if (md == 4) uv += uFace;
      tx = texture(uAtlas, vec3(uv, vLayer));
      if (md == 4) { col = mix(vTint, tx.rgb, tx.a); tx.a = 1.0; }
      else if (md == 1) { float k = tx.r * 1.28; float dk = 1.0 - dot(vTint, vec3(.3, .59, .11)); float lift = 0.063 * k * k * dk * dk; col = k <= 1.0 ? vTint * k + lift : vTint + (1.0 - vTint) * (k - 1.0) * 1.6 + lift; }
      else if (md == 2) col = min(tx.rgb * vTint, vec3(1.0));
      else col = tx.rgb;
      if (tx.a < 0.5) discard;
    }`;
  const MAT = new THREE.MeshToonMaterial({ gradientMap: ramp });
  MAT.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = VDECL + sh.vertexShader.replace('void main() {', 'void main() {\n vAUv = aUv.xy; vLayer = aUv.z; vMode = aUv.w; vTint = aTint;');
    sh.fragmentShader = FDECL + sh.fragmentShader.replace('#include <map_fragment>', '{' + FCORE + '\n diffuseColor.rgb *= pow(clamp(col, 0.0, 1.0), vec3(2.2)); }')
      .replace('#include <dithering_fragment>', 'float rimF = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 3.0); gl_FragColor.rgb += vec3(1.0, 0.42, 0.78) * rimF * 0.22;\n#include <dithering_fragment>');
  };
  MAT.customProgramCacheKey = () => 'vnn3d-main';
  const OMAT = new THREE.MeshBasicMaterial({ color: 0x1a0a22, side: THREE.BackSide });
  OMAT.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'uniform float uOut;\n' + VDECL + sh.vertexShader.replace('void main() {', 'void main() {\n vAUv = aUv.xy; vLayer = aUv.z; vMode = aUv.w; vTint = aTint;').replace('#include <begin_vertex>', 'vec3 transformed = vec3(position) + normalize(normal) * uOut;');
    sh.fragmentShader = FDECL + sh.fragmentShader.replace('#include <map_fragment>', '{ int md2 = int(vMode + 0.5); if (md2 != 3 && md2 != 4) { vec4 t2 = texture(uAtlas, vec3(vAUv, vLayer)); if (t2.a < 0.5) discard; } }');
  };
  OMAT.customProgramCacheKey = () => 'vnn3d-out';

  /* ---------------- skeleton */
  const BN = RIG.bones.map(b => b.n), BIX = {}; BN.forEach((n, i) => BIX[n] = i);
  function makeBones(hipW) {
    const bones = RIG.bones.map(b => { const o = new THREE.Bone(); o.name = b.n; o.position.fromArray(b.pos); o.quaternion.fromArray(b.q); if (SHORT[b.n]) o.position.multiplyScalar(SHORT[b.n]); return o; });
    RIG.bones.forEach((b, i) => { if (b.p) bones[BIX[b.p]].add(bones[i]); });
    if (hipW) for (const s of ['Left', 'Right']) { const p = bones[BIX[s + 'UpLeg']].position; p.x = Math.sign(p.x || (s === 'Left' ? 1 : -1)) * hipW; }
    bones[0].updateMatrixWorld(true); return bones;
  }
  let BONES = makeBones(0);
  const J0 = {}; BONES.forEach(b => J0[b.name] = b.getWorldPosition(new THREE.Vector3()));
  /* lateral scale (world units per 2D rig unit) from the shoulders; then the hips get the 2D template's width */
  const LATR = Math.abs(J0.LeftArm.x - J0.Spine2.x) / 138;
  BONES = makeBones(104 * LATR * 0.92);
  const J = {}; BONES.forEach(b => J[b.name] = b.getWorldPosition(new THREE.Vector3()));
  const SKEL0 = new THREE.Skeleton(BONES); const INV = SKEL0.boneInverses;
  const hipsRestY = RIG.bones[0].pos[1], KLEG = (J.Hips.y - Math.min(J.LeftFoot.y, J.RightFoot.y)) / (hipsRestY - 8.5);

  /* ---------------- clips */
  const CLIPS = {};
  for (const [name, c] of Object.entries(RIG.clips)) {
    const q = new Int16Array(CLB, c.off, c.len), nb = c.bones.length, n = c.n, times = new Float32Array(n);
    for (let i = 0; i < n; i++) times[i] = i / c.fps;
    const tracks = [], hipI = c.bones.indexOf('Hips');
    /* keep the dancer facing the room: hip yaw is centred and softened */
    let sy = 0, cyy = 0; const e = new THREE.Euler(), qq = new THREE.Quaternion();
    for (let i = 0; i < n; i++) { qq.set(q[(i * nb + hipI) * 4] / 32767, q[(i * nb + hipI) * 4 + 1] / 32767, q[(i * nb + hipI) * 4 + 2] / 32767, q[(i * nb + hipI) * 4 + 3] / 32767).normalize(); e.setFromQuaternion(qq, 'YXZ'); sy += Math.sin(e.y); cyy += Math.cos(e.y); }
    const mean = Math.atan2(sy, cyy), keepYaw = name === 'Dancing_Twerk' ? 0.25 : 0.38;
    for (let b = 0; b < nb; b++) {
      const v = new Float32Array(n * 4); const prev = new THREE.Quaternion();
      for (let i = 0; i < n; i++) {
        qq.set(q[(i * nb + b) * 4] / 32767, q[(i * nb + b) * 4 + 1] / 32767, q[(i * nb + b) * 4 + 2] / 32767, q[(i * nb + b) * 4 + 3] / 32767).normalize();
        if (b === hipI) { e.setFromQuaternion(qq, 'YXZ'); let d = e.y - mean; d = Math.atan2(Math.sin(d), Math.cos(d)); e.y = d * keepYaw; qq.setFromEuler(e); }
        if (i && qq.dot(prev) < 0) qq.set(-qq.x, -qq.y, -qq.z, -qq.w); prev.copy(qq); v.set([qq.x, qq.y, qq.z, qq.w], i * 4);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(c.bones[b] + '.quaternion', times, v));
    }
    let mx = 0, mz = 0; for (let i = 0; i < n; i++) { mx += c.hp[i * 3]; mz += c.hp[i * 3 + 2]; } mx /= n; mz /= n;
    const hv = new Float32Array(n * 3), cs = Math.cos(-mean * (1 - keepYaw)), sn = Math.sin(-mean * (1 - keepYaw));
    for (let i = 0; i < n; i++) { const x = (c.hp[i * 3] - mx) * 0.35, z = (c.hp[i * 3 + 2] - mz) * 0.35; hv[i * 3] = x * cs + z * sn; hv[i * 3 + 1] = c.hp[i * 3 + 1] * KLEG; hv[i * 3 + 2] = -x * sn + z * cs; }
    tracks.push(new THREE.VectorKeyframeTrack('Hips.position', times, hv));
    CLIPS[name] = new THREE.AnimationClip(name, c.dur, tracks);
  }
  /* procedural clips (walk, idle) posed in world space on top of the rest pose */
  function poseClip(name, dur, fps, fn) {
    const bones = makeBones(104 * LATR * 0.92), B = {}; bones.forEach(b => B[b.name] = b);
    const n = Math.round(dur * fps), times = new Float32Array(n + 1), vals = {}, hp = new Float32Array((n + 1) * 3), rest = bones.map(b => b.quaternion.clone()), hip0 = bones[0].position.clone();
    BN.forEach(k => vals[k] = new Float32Array((n + 1) * 4));
    const pq = new THREE.Quaternion(), rq = new THREE.Quaternion();
    const rot = (bn, axis, ang) => { const b = B[bn]; if (b.parent) { b.parent.updateWorldMatrix(true, false); b.parent.getWorldQuaternion(pq); } else pq.identity(); rq.setFromAxisAngle(axis, ang); const t = pq.clone().invert().multiply(rq).multiply(pq); b.quaternion.premultiply(t); b.updateMatrixWorld(true); };
    for (let i = 0; i <= n; i++) {
      const t = (i / n) % 1; bones.forEach((b, k) => b.quaternion.copy(rest[k])); bones[0].position.copy(hip0); bones[0].updateMatrixWorld(true);
      fn(t, rot, bones[0].position);
      times[i] = i / fps; bones.forEach(b => vals[b.name].set(b.quaternion.toArray(), i * 4)); hp.set(bones[0].position.toArray(), i * 3);
    }
    const tracks = BN.filter(k => !/End|Middle1/.test(k)).map(k => new THREE.QuaternionKeyframeTrack(k + '.quaternion', times, vals[k]));
    tracks.push(new THREE.VectorKeyframeTrack('Hips.position', times, hp));
    return new THREE.AnimationClip(name, dur, tracks);
  }
  const X = new THREE.Vector3(1, 0, 0), Zv = new THREE.Vector3(0, 0, 1), Yv = new THREE.Vector3(0, 1, 0);
  const armsDown = (rot, k) => { rot('LeftArm', Zv, -1.22 * k); rot('RightArm', Zv, 1.22 * k); rot('LeftForeArm', Zv, -0.12); rot('RightForeArm', Zv, 0.12); };
  CLIPS.walk = poseClip('walk', 0.9, 30, (t, rot, hp) => {
    const s = Math.sin(t * Math.PI * 2), c2 = Math.cos(t * Math.PI * 4);
    hp.y += -Math.abs(Math.cos(t * Math.PI * 2)) * 1.2 + 0.6; rot('Hips', Yv, s * 0.12); rot('Spine1', Yv, -s * 0.16);
    armsDown(rot, 1); rot('LeftArm', X, s * 0.42); rot('RightArm', X, -s * 0.42); rot('LeftForeArm', X, -0.35); rot('RightForeArm', X, -0.35);
    rot('LeftUpLeg', X, -s * 0.5); rot('RightUpLeg', X, s * 0.5);
    rot('LeftLeg', X, Math.max(0, Math.sin(t * Math.PI * 2 - 1.2)) * 0.95); rot('RightLeg', X, Math.max(0, Math.sin(t * Math.PI * 2 + Math.PI - 1.2)) * 0.95);
    rot('Head', X, c2 * 0.03);
  });
  CLIPS.idle = poseClip('idle', 2.0, 15, (t, rot, hp) => {
    const s = Math.sin(t * Math.PI * 2), b = Math.sin(t * Math.PI * 4);
    hp.y += b * 0.5; armsDown(rot, 0.94); rot('Hips', Zv, s * 0.04); rot('Spine', Zv, -s * 0.05); rot('Spine1', X, b * 0.02); rot('Head', Zv, s * 0.06);
    rot('LeftForeArm', X, -0.25); rot('RightForeArm', X, -0.25); rot('LeftUpLeg', Zv, -0.04); rot('RightUpLeg', Zv, 0.04);
  });

  /* ---------------- shared animated skeletons: one per (clip, phase) */
  const RIGS = {}, allRigs = [];
  function makeRig(clip, phase, speed) {
    const bones = makeBones(104 * LATR * 0.92); rigRoot.add(bones[0]);
    const skel = new THREE.Skeleton(bones, INV), mixer = new THREE.AnimationMixer(bones[0]), act = mixer.clipAction(clip); act.play(); act.time = phase * clip.duration;
    const r = { bones, skel, mixer, act, speed: speed || 1, users: 0, B: Object.fromEntries(bones.map(b => [b.name, b])) }; allRigs.push(r); return r;
  }
  for (const d of DANCES) RIGS[d] = Array.from({ length: PHASES }, (_, k) => makeRig(CLIPS[DANCE_CLIP[d]], k / PHASES, 1.05));
  RIGS.walk = [0, 1, 2].map(k => makeRig(CLIPS.walk, k / 3, 1));
  RIGS.idle = [0, 1].map(k => makeRig(CLIPS.idle, k / 2, 1));

  /* ---------------- 2D template -> 3D body */
  const P = AT.pieces, D = AT.defs, LS = AT.libscale;
  const piece = k => k && P[k];
  const HR = 24, HC = J.Head.clone().add(new THREE.Vector3(0, 21, 1.2));
  /* torso: navel row and shoulder row of the 2D art pinned to the skeleton */
  const TS = LATR * LS.torso, TPIV = D.torso.piv, NAV = TPIV[1], SHROW = 112;
  const TVS = (J.LeftArm.y - J.Spine.y) / (NAV - SHROW);
  const torsoY = y => J.Spine.y + (NAV - y) * TVS;
  const PS = LATR * LS.pelvis, PVS = PS * (TVS / TS), HIPROW = 181;
  const pelvisY = y => J.LeftUpLeg.y + (HIPROW - y) * PVS;
  const sideT = piece(AT.side.torsoS).rows, sideP = piece(AT.side.pelvisS).rows;
  const SIDEPIV = { torso: D.torsoS.piv[0], pelvis: D.pelvisS.piv[0] };

  function skinTone(hex) {
    const t = hex3(hex).map(v => v * 255), sb = AT.skinBase; let best = 'M', bd = 1e9; const lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
    for (const k of Object.keys(sb)) { const d = Math.abs(lum(sb[k]) - lum(t)); if (d < bd) { bd = d; best = k; } }
    const b = sb[best], lr = lum(t) / lum(b); return { base: best, r: t.map((v, i) => clamp(lr + (v / b[i] - lr) * 0.55, 0.5, 1.7)), hex: hex3(hex) };
  }
  const uvOf = (pc, ux, vy) => { const at = pc.at, sc = at[3] / pc.w; const u = clamp(ux - pc.ox, -5, pc.w + 5), v = clamp(vy - pc.oy, -5, pc.h + 5); return [(at[1] + u * sc) / PAGE, (at[2] + v * sc) / PAGE, at[0]]; };

  /* body cross-section of a segment at a 2D row: half widths L (to -X), R (to +X), depth F (front), B (back) in world units */
  function bodySection(seg, y, curvy) {
    if (seg === 'torso' || seg === 'pelvis') {
      const fr = rowAt(piece(seg === 'torso' ? 'BODY-M-A__torso' : 'BODY-M-A__pelvis').rows, y), sd = rowAt(seg === 'torso' ? sideT : sideP, y), sc = seg === 'torso' ? TS : PS, pv = seg === 'torso' ? TPIV[0] : D.pelvis.piv[0];
      if (!fr) return null; let L = (pv - fr[1]) * sc, Rr = (fr[2] - pv) * sc, Fd = sd ? (sd[2] - SIDEPIV[seg]) * sc : (L + Rr) * 0.34, Bd = sd ? (SIDEPIV[seg] - sd[1]) * sc : (L + Rr) * 0.34;
      if (!curvy) { if (seg === 'torso' && y > 140 && y < 330) Fd = Math.min(Fd, Bd * 0.98 + 0.4); if (seg === 'pelvis') { Bd = Math.min(Bd, Fd * 1.05); const k = 0.86 + 0.14 * smooth(150, 40, y); L *= k; Rr *= k; } }
      return { L: Math.max(0.3, L), R: Math.max(0.3, Rr), F: Math.max(0.3, Fd), B: Math.max(0.3, Bd) };
    }
    const pc = piece('BODY-M-A__' + seg); const fr = rowAt(pc.rows, y); if (!fr) return null; const df = D[seg], sc = LATR * LS[seg] * (LATK[seg] || 1);
    const L = (df.piv[0] - fr[1]) * sc, Rr = (fr[2] - df.piv[0]) * sc, hw = (L + Rr) / 2, th = seg === 'hand_relax' ? 0.36 : seg === 'shin' ? 0.82 : 0.86;
    return { L: Math.max(0.2, L), R: Math.max(0.2, Rr), F: Math.max(0.2, hw * th), B: Math.max(0.2, hw * th) };
  }
  /* segment frames: where a 2D row lands in 3D and which way its sides point */
  const LATK = { shin: 0.76, thigh: 0.9, uarm: 0.95, farm: 0.92, hand_relax: 0.95, neck: 1 };
  const LIMB = {
    uarm: ['Arm', 'ForeArm'], farm: ['ForeArm', 'Hand'], thigh: ['UpLeg', 'Leg'], shin: ['Leg', 'Foot'], hand_relax: ['Hand', 'HandMiddle1']
  };
  function segFrame(seg, side) {
    if (seg === 'torso') return { at: y => new THREE.Vector3(J.Spine.x, torsoY(y), J.Spine.z + 0.6), lat: X, dep: Zv, sc: TS, piv: TPIV[0] };
    if (seg === 'pelvis') return { at: y => new THREE.Vector3(J.Hips.x, pelvisY(y), J.Hips.z + 0.4), lat: X, dep: Zv, sc: PS, piv: D.pelvis.piv[0] };
    if (seg === 'neck') { const a = J.Neck.clone().add(new THREE.Vector3(0, -3.5, 0)), b = J.Head.clone().add(new THREE.Vector3(0, 6, 0)), df = D.neck; return { at: y => a.clone().lerp(b, (df.piv[1] - y) / Math.abs(df.bone[1])), lat: X, dep: Zv, sc: LATR * LS.neck, piv: df.piv[0] }; }
    const [ja, jb] = LIMB[seg], A = J[side + ja], Bp = J[side + jb], df = D[seg], len = Math.hypot(df.bone[0], df.bone[1]);
    const dir = Bp.clone().sub(A).normalize(); let L3 = A.distanceTo(Bp); if (seg === 'hand_relax') L3 = len * LATR * LS[seg] * 0.8;
    const lat = new THREE.Vector3().crossVectors(Zv, dir).normalize(); const dep = new THREE.Vector3().crossVectors(dir, lat).normalize();
    return { at: y => A.clone().addScaledVector(dir, (y - df.piv[1]) / len * L3), lat, dep, sc: LATR * LS[seg] * (LATK[seg] || 1), piv: df.piv[0], dir, A, B: Bp, L3 };
  }
  /* skin weights for a vertex on a segment */
  function segWeights(seg, side, y, pos, lat) {
    const b = n => BIX[n];
    if (seg === 'torso') {
      const t = (NAV - y) / (NAV - 30); let w;
      if (t < 0) w = [[b('Hips'), 0.6], [b('Spine'), 0.4]];
      else if (t < 0.45) w = [[b('Spine'), 1 - t / 0.45], [b('Spine1'), t / 0.45]];
      else w = [[b('Spine1'), 1 - smooth(0.45, 0.9, t)], [b('Spine2'), smooth(0.45, 0.9, t)]];
      if (y < 40) w = [[b('Spine2'), 0.6], [b('Neck'), 0.4]];
      const ax = Math.abs(pos.x - J.Spine.x), shx = Math.abs(J.LeftArm.x - J.Spine.x);
      const ws = smooth(shx * 0.55, shx * 1.0, ax) * smooth(250, 140, y) * 0.55;
      if (ws > 0.01) { const sd = pos.x > J.Spine.x ? 'Left' : 'Right'; w = w.map(e => [e[0], e[1] * (1 - ws)]); w.push([b(sd + 'Shoulder'), ws * 0.55], [b(sd + 'Arm'), ws * 0.45]); }
      return w;
    }
    if (seg === 'pelvis') {
      const ax = pos.x - J.Hips.x, sd = ax > 0 ? 'Left' : 'Right', leg = smooth(HIPROW - 60, 216, y) * smooth(15 * LATR * 6, 55 * LATR * 6, Math.abs(ax)) * 0.85;
      const top = smooth(70, 20, y) * 0.4;
      return [[b('Hips'), 1 - leg - top], [b(sd + 'UpLeg'), leg + 0.0001], [b('Spine'), top + 0.0001]];
    }
    if (seg === 'neck') return [[b('Neck'), 0.7], [b('Head'), 0.3 * smooth(40, 0, y)], [b('Spine2'), 0.3 * smooth(60, 112, y) + 0.0001]];
    const [ja, jb] = LIMB[seg], df = D[seg], len = Math.hypot(df.bone[0], df.bone[1]), t = (y - df.piv[1]) / len;
    if (seg === 'hand_relax') return [[b(side + 'Hand'), 1]];
    const wb = smooth(0.8, 1.12, t) * 0.5, up = seg === 'thigh' ? smooth(0.02, -0.25, t) * 0.5 : seg === 'uarm' ? smooth(0.05, -0.2, t) * 0.4 : 0;
    const w = [[b(side + ja), 1 - wb - up], [b(side + jb), wb + 0.0001]];
    if (up > 0) w.push([seg === 'thigh' ? b('Hips') : b(side + 'Shoulder'), up]);
    return w;
  }

  /* the shell builder: rings over 2D rows, quarter strips each mapped to one 2D image (front, back, sides) */
  function shell(gb, o) {
    /* o: {fr (frame), rows: [y...], sec(y)->{L,R,F,B}, strips:[{a0,a1,pc,u(xw,zw,y)->px, v(y)->px, mode, tint}], w(y,pos)->weights, nseg, sup} */
    const rows = o.rows, ns = o.nseg || 6;
    for (const st of o.strips) {
      const idx = [];
      for (let r = 0; r < rows.length; r++) {
        const y = rows[r], s = o.sec(y), c = o.fr.at(y), line = [];
        for (let k = 0; k <= ns; k++) {
          const ph = st.a0 + (st.a1 - st.a0) * k / ns, sn = Math.sin(ph), cs = Math.cos(ph);
          let xw = sn * (sn > 0 ? s.R : s.L), zw = cs * (cs > 0 ? s.F : s.B);
          if (o.sup) { xw = Math.sign(sn) * Math.pow(Math.abs(sn), o.sup) * (sn > 0 ? s.R : s.L); zw = Math.sign(cs) * Math.pow(Math.abs(cs), o.sup) * (cs > 0 ? s.F : s.B); }
          const pos = c.clone().addScaledVector(o.fr.lat, xw).addScaledVector(o.fr.dep, zw);
          let uv4, tnt = st.tint; const ov = st.fx ? st.fx(xw, zw, y, s) : null;
          if (ov) { uv4 = ov[0]; tnt = ov[1]; }
          else if (st.mode === 3 || !st.pc) uv4 = [0, 0, 0, 3];
          else { const q = uvOf(st.pc, st.u(xw, zw, y), st.v(y)); uv4 = [q[0], q[1], q[2], st.mode]; }
          line.push(gb.v(pos, o.w(y, pos), uv4, tnt));
        }
        idx.push(line);
      }
      for (let r = 0; r + 1 < rows.length; r++) for (let k = 0; k < ns; k++) { const a = idx[r][k], b2 = idx[r][k + 1], c2 = idx[r + 1][k], d = idx[r + 1][k + 1]; gb.tri(a, c2, b2); gb.tri(b2, c2, d); }
    }
  }
  const HALF = Math.PI / 2;
  const range = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) r.push(a + (b - a) * i / n); return r; };

  /* 2D catalog helpers */
  const byId = (arr, id) => arr && arr.find(e => e.id === id || (e.alias && e.alias.indexOf(id) >= 0));
  const clothHex = (id, d) => { const c = byId(CAT.colors.clothing, id); return c ? c.hex : d; };

  /* ---------------- build one look -> geometry */
  const GEO = new Map();
  function sigOf(L) { return JSON.stringify([L.skin, L.body, L.top, L.topColor, L.bottom, L.bottomColor, L.shoes, L.shoesColor, L.hair, L.hairColor, (L.acc || []).slice().sort(), L.accColor, L.face]); }
  const FALLBACK = { top: { sleeved: 'tee', sleeveless: 'tank', dress: 'bodycon', sig: 'barbtee' }, bottom: { pants: 'jeans', shorts: 'cutoffs', skirt: 'miniskirt' }, shoes: 'sneakers', hair: 'long' };
  function resolveTop(id) {
    const it = byId(CAT.looks, id) || CAT.looks[0];
    if (AT.items.tops[it.id]) return { it, k: it.id };
    const fam = it.dress ? 'dress' : it.sig ? 'sig' : /SLEEVELESS/.test(it.sheet) ? 'sleeveless' : 'sleeved';
    return { it, k: FALLBACK.top[fam], fb: true };
  }
  function resolveBottom(id) {
    const it = byId(CAT.bottoms, id) || CAT.bottoms[0];
    if (AT.items.bottoms[it.id]) return { it, k: it.id };
    return { it, k: it.skirt ? 'miniskirt' : /SHORTS/.test(it.sheet) ? 'cutoffs' : 'jeans', fb: true };
  }
  function buildLook(L) {
    { const t0 = byId(CAT.looks, L.top); if (t0 && t0.nk) L = Object.assign({}, L, { hair: t0.hair, hairColor: t0.hairColor, shoes: t0.shoes, shoesColor: t0.shoesColor, acc: (t0.acc || []).filter(x => x !== 'crown'), accColor: t0.accColor, body: 'curvy', crown: true }); }
    const gb = new GB(), tone = skinTone((byId(CAT.skin, L.skin) || CAT.skin[3]).hex), curvy = L.body === 'curvy';
    const skinK = seg => AT.skin[tone.base + ':' + seg], SKR = tone.r, SKH = tone.hex;
    const top = resolveTop(L.top), nk = top.it.nk;
    const TP = AT.items.tops[nk ? top.it.id : top.k] || {};
    const topTint = (top.it.sig || nk) ? null : hex3(clothHex(L.topColor, top.it.col));
    let BOT = null, botTint = null, bot = null;
    if (nk) { BOT = AT.items.bottoms['nickiB' + (top.it.sheet.match(/NICKI-(\d)/) || [0, 1])[1]]; }
    else if (!top.it.dress) { bot = resolveBottom(L.bottom); BOT = AT.items.bottoms[bot.k]; botTint = bot.it.fixed ? null : hex3(clothHex(L.bottomColor, bot.it.col)); }
    const isDress = !!(TP.dskF || TP.mdskF), skirtTop = BOT && (BOT.skF || BOT.mskF);
    const gm = t => t ? 1 : 0, tintOr = t => t || [1, 1, 1];
    /* ---- body segments with the skin art ---- */
    const bodySeg = (seg, side, frontK, backK, ys, ns, fx) => {
      const fr = segFrame(seg, side), mir = side === 'Right' && seg !== 'torso' && seg !== 'pelvis' && seg !== 'neck';
      const fpc = piece(skinK(frontK)), bpc = piece(skinK(backK || frontK));
      const u = (pc, back) => (xw) => { let x = xw / fr.sc; if (back) x = -x; return fr.piv + x + (pc === bpc && backK && seg === 'pelvis' ? (D.pelvisB.piv[0] - D.pelvis.piv[0]) : 0); };
      shell(gb, { fr, rows: ys, nseg: ns || 6, sec: y => bodySection(seg, y, curvy) || { L: .3, R: .3, F: .3, B: .3 }, w: (y, p) => segWeights(seg, side, y, p, fr.lat),
        strips: [{ a0: -HALF, a1: HALF, pc: fpc, u: u(fpc, mir), v: y => y, mode: 2, tint: SKR, fx }, { a0: HALF, a1: 3 * HALF, pc: bpc, u: u(bpc, !mir), v: y => y, mode: 2, tint: SKR, fx }] });
    };
    const span = (k) => rowSpan(piece(skinK(k)).rows);
    const ysOf = (sp, n) => range(sp[0] + 1, sp[1] - 1, n);
    /* like the 2D clipSkin: under a sleeved top the body's shoulders and sides become the inside of the garment (neckline and a cropped belly stay skin) */
    let torsoFx = null;
    if (TP.sleeveU && TP.torso) { const tpc = piece(TP.torso), hem = rowSpan(tpc.rows.map(r => [r[0] + tpc.oy, r[1], r[2]])), mid = rowAt(tpc.rows, (hem[0] + hem[1]) / 2 - tpc.oy);
      const q = uvOf(tpc, tpc.ox + (mid[1] + mid[2]) / 2 + (mid[2] - mid[1]) * 0.3, (hem[0] + hem[1]) / 2), fab = [[q[0], q[1], q[2], topTint ? 1 : 0], topTint || [1, 1, 1]];
      torsoFx = (xw, zw, y, sec) => (y > 48 && y < hem[1] - 6 && Math.abs(xw) > 0.42 * Math.max(sec.L, sec.R)) ? [[fab[0][0], fab[0][1], fab[0][2], fab[0][3]], fab[1].map(v => v * 0.82)] : null; }
    bodySeg('torso', '', 'torso', 'torsoB', ysOf(span('torso'), 24), 8, torsoFx);
    bodySeg('pelvis', '', 'pelvis', 'pelvisB', ysOf(span('pelvis'), 10), 8);
    bodySeg('neck', '', 'neck', 'neckB', ysOf(span('neck'), 4), 6);
    for (const s of ['Left', 'Right']) {
      bodySeg('uarm', s, 'uarm', null, ysOf(span('uarm'), 9), 6);
      bodySeg('farm', s, 'farm', null, ysOf(span('farm'), 9), 6);
      bodySeg('hand_relax', s, 'hand_relax', null, ysOf(span('hand_relax'), 7), 6);
      bodySeg('thigh', s, 'thigh', 'thighB', ysOf(span('thigh'), 9), 6);
      bodySeg('shin', s, 'shin', 'shinB', ysOf(span('shin'), 9), 6);
    }
    /* joint caps so elbows and knees never open up */
    const ball = (p, r, boneA, boneB, tint, mode = 3, uv4) => {
      const g = new THREE.SphereGeometry(r, 10, 7); const pa = g.attributes.position, idx0 = gb.n;
      for (let i = 0; i < pa.count; i++) gb.v(new THREE.Vector3(pa.getX(i) + p.x, pa.getY(i) + p.y, pa.getZ(i) + p.z), boneB ? [[BIX[boneA], 0.5], [BIX[boneB], 0.5]] : [[BIX[boneA], 1]], uv4 || [0, 0, 0, mode], tint);
      const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) gb.tri(idx0 + ix[i], idx0 + ix[i + 1], idx0 + ix[i + 2]);
    };
    const skinFlat = SKH;
    /* joint balls take the colour of whatever covers that joint (sleeve, trouser leg) so bends never show a gap */
    const fabricAt = (k, fy, tint) => { const pc = piece(k); if (!pc) return null; const sp = rowSpan(pc.rows); if (!sp) return null; const yy = sp[0] + (sp[1] - sp[0]) * fy, r = rowAt(pc.rows, yy); if (!r) return null; const q = uvOf(pc, pc.ox + (r[1] + r[2]) / 2, pc.oy + yy); return [[q[0], q[1], q[2], tint ? 1 : 0], tint || [1, 1, 1]]; };
    const covers = (k, y) => { const pc = piece(k); if (!pc) return false; const sp = rowSpan(pc.rows.map(r => [r[0] + pc.oy, r[1], r[2]])); return sp && sp[0] <= y && sp[1] >= y; };
    for (const s of ['Left', 'Right']) {
      const sl = TP.sleeveU ? fabricAt(TP.sleeveU, 0.06, topTint) : null, el = TP.sleeveU && covers(TP.sleeveU, D.uarm.piv[1] + Math.hypot(...D.uarm.bone) - 4) ? fabricAt(TP.sleeveU, 0.97, topTint) : null;
      const kn = BOT && BOT.thigh && covers(BOT.thigh, D.thigh.piv[1] + Math.hypot(...D.thigh.bone) - 4) ? fabricAt(BOT.thigh, 0.96, botTint) : null;
      ball(J[s + 'ForeArm'], 2.5 + (el ? 0.7 : 0), s + 'Arm', s + 'ForeArm', el ? el[1] : skinFlat, 3, el ? el[0] : null);
      ball(J[s + 'Leg'], 3.6 + (kn ? 0.5 : 0), s + 'UpLeg', s + 'Leg', kn ? kn[1] : skinFlat, 3, kn ? kn[0] : null);
      ball(J[s + 'Arm'], 3.4 + (sl ? 0.9 : 0), s + 'Shoulder', s + 'Arm', sl ? sl[1] : skinFlat, 3, sl ? sl[0] : null);
    }

    /* ---- garments: shells grown from each garment's own silhouette ---- */
    const garment = (seg, side, fk, bk, off, tint, layerMin) => {
      const fpc = piece(fk), bpc = piece(bk || fk); if (!fpc) return;
      const fr = segFrame(seg, side), mir = side === 'Right' && seg !== 'torso' && seg !== 'pelvis';
      const bshift = (seg === 'pelvis' && bk) ? (D.pelvisB.piv[0] - D.pelvis.piv[0]) : 0;
      const fRows = fpc.rows.map(r => [r[0] + fpc.oy, r[1] < 0 ? -1 : r[1] + fpc.ox, r[2] < 0 ? -1 : r[2] + fpc.ox]);
      const bRows = bpc.rows.map(r => [r[0] + bpc.oy, r[1] < 0 ? -1 : r[1] + bpc.ox - bshift, r[2] < 0 ? -1 : r[2] + bpc.ox - bshift]);
      const sp1 = rowSpan(fRows), sp2 = rowSpan(bRows); if (!sp1 && !sp2) return;
      const y0 = Math.min(sp1 ? sp1[0] : 1e9, sp2 ? sp2[0] : 1e9), y1 = Math.max(sp1 ? sp1[1] : -1e9, sp2 ? sp2[1] : -1e9);
      const n = Math.max(4, Math.round((y1 - y0) / (seg === 'torso' ? 16 : 22)));
      const sec = y => {
        const bs = bodySection(seg, clamp(y, 2, 1e4), curvy) || bodySection(seg, y < 100 ? y0 + 6 : y1 - 6, curvy) || { L: 1, R: 1, F: 1, B: 1 };
        const a = rowAt(fRows, y), b = rowAt(bRows, y); let gl = 0, gr = 0;
        for (const r of [a, b]) if (r) { gl = Math.max(gl, (fr.piv - r[1]) * fr.sc); gr = Math.max(gr, (r[2] - fr.piv) * fr.sc); }
        if (mir) { const t = gl; gl = gr; gr = t; }
        const lmin = Math.max(layerMin || 0, 0);
        const L = Math.max(bs.L + off + lmin, gl + off * 0.4), Rr = Math.max(bs.R + off + lmin, gr + off * 0.4);
        const kx = Math.max(L / Math.max(bs.L, 0.1), Rr / Math.max(bs.R, 0.1)), kd = 0.55 + 0.45 * kx;
        return { L, R: Rr, F: Math.max(bs.F + off + lmin, bs.F * kd + off * 0.5), B: Math.max(bs.B + off + lmin, bs.B * kd + off * 0.5) };
      };
      const u = (back) => (xw) => { let x = xw / fr.sc; if (back !== mir) x = -x; return fr.piv + x + (back ? bshift : 0); };
      shell(gb, { fr, rows: range(y0 - 2, y1 + 2, n), nseg: seg === 'torso' || seg === 'pelvis' ? 9 : 6, sec, w: (y, p) => segWeights(seg, side, y, p, fr.lat),
        strips: [{ a0: -HALF, a1: HALF, pc: fpc, u: u(false), v: y => y, mode: gm(tint), tint: tintOr(tint) }, { a0: HALF, a1: 3 * HALF, pc: bpc, u: u(true), v: y => y, mode: gm(tint), tint: tintOr(tint) }] });
    };
    const OFFB = 0.45, OFFT = 0.95;
    if (BOT) {
      if (BOT.pelvis) garment('pelvis', '', BOT.pelvis, BOT.pelvisB, OFFB, botTint);
      for (const s of ['Left', 'Right']) { if (BOT.thigh) garment('thigh', s, BOT.thigh, BOT.thighB, OFFB, botTint); if (BOT.shin) garment('shin', s, BOT.shin, BOT.shinB, OFFB, botTint); }
    }
    if (TP.torso) garment('torso', '', TP.torso, TP.torsoB, OFFT, topTint);
    for (const s of ['Left', 'Right']) { if (TP.sleeveU) garment('uarm', s, TP.sleeveU, null, OFFT * 0.8, topTint); if (TP.sleeveF) garment('farm', s, TP.sleeveF, null, OFFT * 0.8, topTint); }
    /* skirts (dress skirts and skirt bottoms): flared shells hung from the waist */
    const skirt = (fk, bk, tint) => {
      const fpc = piece(fk), bpc = piece(bk || fk); if (!fpc) return;
      const fsp = rowSpan(fpc.rows), top = rowAt(fpc.rows, fsp[0] + 4), cxp = fpc.w / 2;
      const waistY = pelvisY(30), waist = bodySection('pelvis', 34, curvy), hw = Math.max(waist.L, waist.R) * 1.04 + 0.6;
      const k = hw / Math.max(20, (top[2] - top[1]) / 2), vk = k * 0.78;
      const at = y => new THREE.Vector3(J.Hips.x, waistY - (y - fsp[0]) * vk, J.Hips.z + 0.4);
      const fr = { at, lat: X, dep: Zv, sc: k, piv: cxp };
      const sec = y => { const a = rowAt(fpc.rows, y), b = rowAt(bpc.rows, y); let L = hw, Rr = hw; for (const r of [a, b]) if (r) { L = Math.max(L, (cxp - r[1]) * k); Rr = Math.max(Rr, (r[2] - cxp) * k); }
        const yy = at(y).y, hip = bodySection('pelvis', clamp(HIPROW - (yy - J.LeftUpLeg.y) / PVS, 30, 214), curvy) || waist; const d = Math.max(hip.F, hip.B) + 1.2; return { L, R: Rr, F: Math.max(d, (L + Rr) * 0.36), B: Math.max(d, (L + Rr) * 0.4) }; };
      const n = Math.max(6, Math.round((fsp[1] - fsp[0]) / 22));
      const w = (y, p) => { const t = clamp((y - fsp[0]) / (fsp[1] - fsp[0]), 0, 1), sd = p.x > J.Hips.x ? 'Left' : 'Right'; return [[BIX.Hips, 1 - t * 0.55], [BIX[sd + 'UpLeg'], t * 0.55 + 0.0001]]; };
      shell(gb, { fr, rows: range(fsp[0], fsp[1] + 2, n), nseg: 10, sec, w, strips: [{ a0: -HALF, a1: HALF, pc: fpc, u: xw => fpc.ox + cxp + xw / k, v: y => y + fpc.oy, mode: gm(tint), tint: tintOr(tint) }, { a0: HALF, a1: 3 * HALF, pc: bpc, u: xw => bpc.ox + cxp - xw / k, v: y => y + bpc.oy, mode: gm(tint), tint: tintOr(tint) }] });
    };
    if (isDress) skirt(TP.dskF || TP.mdskF, TP.dskB || TP.mdskB, topTint);
    if (skirtTop) skirt(BOT.skF || BOT.mskF, BOT.skB || BOT.mskB, botTint);

    /* ---- shoes: four views of the 2D shoe wrapped round a rounded last ---- */
    const shId = (byId(CAT.shoes, L.shoes) || CAT.shoes[0]).id, shIt = byId(CAT.shoes, shId), SH = AT.items.shoes[shId] || AT.items.shoes[FALLBACK.shoes];
    const shTint = (shIt && shIt.fixed) ? null : hex3(clothHex(L.shoesColor, shIt ? shIt.col : '#f4f0fa'));
    if (SH && SH.shaft) for (const s of ['Left', 'Right']) garment('shin', s, SH.shaft, SH.shaftB, OFFB + 0.7, shTint);
    for (const s of ['Left', 'Right']) {
      const S = piece(SH.shoeS), Fp = piece(SH.shoeF), Bp = piece(SH.shoeB) || Fp; if (!S || !Fp) break;
      const ankS = S.ank || [S.w * 0.27, S.h * 0.37], ballS = S.ball || [S.w * 0.77, S.h * 0.79], ankF = Fp.ank || [Fp.w / 2, Fp.h * 0.33];
      const A = J[s + 'Foot'], T = J[s + 'ToeBase'], fwd = new THREE.Vector3(T.x - A.x, 0, T.z - A.z).normalize(), lat = new THREE.Vector3().crossVectors(UP, fwd).normalize().negate();
      const k = Math.hypot(T.x - A.x, T.z - A.z) * 0.98 / (ballS[0] - ankS[0]);
      const ssp = rowSpan(S.rows), fsp = rowSpan(Fp.rows), fh = fsp[1] - fsp[0], sh = ssp[1] - ssp[0];
      const fr = { at: y => new THREE.Vector3(A.x, A.y - (y - ankS[1]) * k, A.z), lat, dep: fwd, sc: k, piv: 0 };
      const fy = y => fsp[0] + (y - ssp[0]) / sh * fh;
      const sec = y => { const a = rowAt(S.rows, y) || [y, ankS[0] - 20, ankS[0] + 20], f = rowAt(Fp.rows, fy(y)) || [0, ankF[0] - 25, ankF[0] + 25];
        return { L: Math.max(0.5, (ankF[0] - f[1]) * k * 0.92), R: Math.max(0.5, (f[2] - ankF[0]) * k * 0.92), F: Math.max(0.5, (a[2] - ankS[0]) * k), B: Math.max(0.5, (ankS[0] - a[1]) * k) }; };
      const flip = s === 'Right';
      const w = () => [[BIX[s + 'Foot'], 1]];
      const strips = [
        { a0: -HALF / 2, a1: HALF / 2, pc: Fp, u: xw => ankF[0] + (flip ? -xw : xw) / k / 0.92, v: fy, mode: gm(shTint), tint: tintOr(shTint) },
        { a0: HALF / 2, a1: HALF * 1.5, pc: S, u: (xw, zw) => ankS[0] + zw / k, v: y => y, mode: gm(shTint), tint: tintOr(shTint) },
        { a0: HALF * 1.5, a1: HALF * 2.5, pc: Bp, u: xw => (Bp.ank ? Bp.ank[0] : Bp.w / 2) - (flip ? -xw : xw) / k / 0.92, v: fy, mode: gm(shTint), tint: tintOr(shTint) },
        { a0: HALF * 2.5, a1: HALF * 3.5, pc: S, u: (xw, zw) => ankS[0] + zw / k, v: y => y, mode: gm(shTint), tint: tintOr(shTint) }];
      const ys = range(ssp[0] + 1, ssp[1] - 0.5, 9);
      shell(gb, { fr, rows: ys, nseg: 5, sup: 0.6, sec, w, strips });
      /* sole cap */
      const yb = ys[ys.length - 1], sb = sec(yb), c0 = fr.at(yb), q = uvOf(S, ankS[0] + (ballS[0] - ankS[0]) * 0.5, yb - 3), centre = gb.v(c0.clone().add(new THREE.Vector3(0, -0.2, 0)).addScaledVector(fwd, (sb.F - sb.B) / 2), w(), [q[0], q[1], q[2], gm(shTint)], tintOr(shTint)), ring = [];
      for (let i = 0; i <= 16; i++) { const ph = i / 16 * Math.PI * 2, sn = Math.sin(ph), cs = Math.cos(ph); ring.push(gb.v(c0.clone().addScaledVector(lat, Math.sign(sn) * Math.pow(Math.abs(sn), 0.6) * (sn > 0 ? sb.R : sb.L)).addScaledVector(fwd, Math.sign(cs) * Math.pow(Math.abs(cs), 0.6) * (cs > 0 ? sb.F : sb.B)), w(), [q[0], q[1], q[2], gm(shTint)], tintOr(shTint))); }
      for (let i = 0; i < 16; i++) gb.tri(centre, ring[i + 1], ring[i]);
    }

    /* ---- head with a drawn face ---- */
    const face = FACES[L.face] || FACES[0];
    const btFace = typeof L.face === 'string' && FACES[L.face];
    { const g = new THREE.SphereGeometry(HR, 28, 20); const pa = g.attributes.position, i0 = gb.n, FS = HR * 1.15;
      for (let i = 0; i < pa.count; i++) {
        let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const yy = y / HR, kk = yy < 0 ? 1 - 0.16 * yy * yy : 1; x *= kk * 1.04; z *= kk * 0.94;
        const front = z > -2; const fu = (face.x + (0.5 + x / (2 * FS)) * face.s) / PAGE, fv = (face.y + (0.5 - y / (2 * FS)) * face.s) / PAGE;
        gb.v(new THREE.Vector3(x + HC.x, y + HC.y, z + HC.z), [[BIX.Head, 1]], front ? [fu, fv, FACEPG, 4] : [0, 0, 0, 3], SKH);
      }
      const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) gb.tri(i0 + ix[i], i0 + ix[i + 1], i0 + ix[i + 2]); }
    for (const sx of [-1, 1]) ball(new THREE.Vector3(HC.x + sx * HR * 1.02, HC.y - 2, HC.z), 3.2, 'Head', null, SKH);

    /* ---- hair: the 2D hair's front and back paintings on a shell around the head ---- */
    const hs = byId(CAT.hair.styles, L.hair), HI = AT.items.hair[hs && AT.items.hair[hs.id] ? hs.id : FALLBACK.hair];
    if (L.hair !== 'none' && HI && HI.hairF) {
      const hcol = byId(CAT.hair.colors, L.hairColor) || CAT.hair.colors[1], om = hcol.ombre ? hcol.ombre.map(hex3) : null, hc = om ? om[0] : hex3(hcol.hex);
      const fpc = piece(HI.hairF), bpc = piece(HI.hairB), HSX = HR / 106.4 * 1.06;
      const DF = [145, 180], DB = [145, 205];
      const fRows = fpc.rows.map(r => [r[0] + fpc.oy, r[1] < 0 ? -1 : r[1] + fpc.ox, r[2] < 0 ? -1 : r[2] + fpc.ox]);
      const bRows = bpc.rows.map(r => [r[0] + bpc.oy - (DB[1] - DF[1]), r[1] < 0 ? -1 : r[1] + bpc.ox, r[2] < 0 ? -1 : r[2] + bpc.ox]);
      const s1 = rowSpan(fRows), s2 = rowSpan(bRows), y0 = Math.min(s1[0], s2[0]), y1 = Math.max(s1[1], s2[1]);
      const fr = { at: y => new THREE.Vector3(HC.x, HC.y - (y - DF[1]) * HSX, HC.z), lat: X, dep: Zv, sc: HSX, piv: DF[0] };
      const sec = y => {
        const a = rowAt(fRows, y), b = rowAt(bRows, y); let L = 0, Rr = 0; for (const r of [a, b]) if (r) { L = Math.max(L, (DF[0] - r[1]) * HSX); Rr = Math.max(Rr, (r[2] - DF[0]) * HSX); }
        const dy = (HC.y - fr.at(y).y), inHead = Math.abs(dy) < HR * 0.98, hd = inHead ? Math.sqrt(HR * HR - dy * dy) : 0, sideW = inHead ? hd * 1.04 : 0;
        L = Math.max(L, sideW + 1.1); Rr = Math.max(Rr, sideW + 1.1);
        let Fd, Bd; if (dy > -HR * 0.7) { Fd = hd * 0.94 + 1.4; Bd = Math.max(hd * 0.94 + 1.6, (L + Rr) * 0.42); }
        else { Fd = Math.max(2.5, (L + Rr) * 0.16); Bd = Math.max(8.5, (L + Rr) * 0.34); }
        return { L, R: Rr, F: Fd, B: Bd };
      };
      const chinY = HC.y - HR * 0.75;
      const w = (y, p) => { const t = clamp((chinY - p.y) / (HR * 1.6), 0, 1); return t <= 0 ? [[BIX.Head, 1]] : [[BIX.Head, 1 - t * 0.75], [BIX.Spine2, t * 0.75 + 0.0001]]; };
      const tintAt = om ? (y => { const t = clamp((y - y0) / (y1 - y0), 0, 1) * 2; const a = t < 1 ? om[0] : om[1], b = t < 1 ? om[1] : om[2], f = t < 1 ? t : t - 1; return a.map((v, i) => v + (b[i] - v) * f); }) : null;
      /* scalp: in 2D the round photo filled the hair's face hole, so give the 3D head a hairline painted with the hair's own strands */
      { const seg = 26, rings = 9, i0 = gb.n, Rs = HR + 0.7;
        for (let r = 0; r <= rings; r++) for (let c = 0; c <= seg; c++) {
          const az = c / seg * Math.PI * 2, front = Math.cos(az), lim = 0.95 + (1 - front) * 0.5 + Math.pow(Math.max(0, -front), 2) * 0.5, th = lim * r / rings;
          const x = Math.sin(th) * Math.sin(az) * Rs * 1.05, y = Math.cos(th) * Rs, z = Math.sin(th) * Math.cos(az) * Rs * 0.96;
          const q = uvOf(bpc, DB[0] - x / HSX, DB[1] - y / HSX + 6); gb.v(new THREE.Vector3(HC.x + x, HC.y + y, HC.z + z), [[BIX.Head, 1]], [q[0], q[1], q[2], 1], tintAt ? tintAt(y0) : hc); }
        for (let r = 0; r < rings; r++) for (let c = 0; c < seg; c++) { const a = i0 + r * (seg + 1) + c, b = a + 1, c2 = a + seg + 1, d = c2 + 1; gb.tri(a, c2, b); gb.tri(b, c2, d); } }
      const n = Math.max(8, Math.round((y1 - y0) / 14));
      const ys = range(y0 - 1, y1 + 1, n);
      if (!tintAt) shell(gb, { fr, rows: ys, nseg: 10, sec, w, strips: [{ a0: -HALF, a1: HALF, pc: fpc, u: xw => DF[0] + xw / HSX, v: y => y - fpc.oy + fpc.oy, mode: 1, tint: hc }, { a0: HALF, a1: 3 * HALF, pc: bpc, u: xw => DF[0] - xw / HSX, v: y => y + (DB[1] - DF[1]), mode: 1, tint: hc }] });
      else for (let r = 0; r + 1 < ys.length; r++) { const t = tintAt(ys[r]); shell(gb, { fr, rows: [ys[r], ys[r + 1]], nseg: 10, sec, w, strips: [{ a0: -HALF, a1: HALF, pc: fpc, u: xw => DF[0] + xw / HSX, v: y => y, mode: 1, tint: t }, { a0: HALF, a1: 3 * HALF, pc: bpc, u: xw => DF[0] - xw / HSX, v: y => y + (DB[1] - DF[1]), mode: 1, tint: t }] }); }
    }

    /* ---- accessories ---- */
    const accColor = hex3((byId(CAT.colors.clothing, L.accColor) || {}).hex || ({ gold: '#ffd25e', silver: '#cfd6e2' })[L.accColor] || '#ffd25e');
    const accs = (L.acc || []).slice(); if (L.crown) accs.push('crown');
    for (const id of accs) {
      const A = AT.items.acc[id]; if (!A || !A.img) continue; const aIt = byId(CAT.accessories.items, id) || {}, pc = piece(A.img), tint = (aIt.full || /ACC-SPECIAL/.test(A.img)) ? null : accColor;
      if (A.slot === 'hands') { for (const s of ['Left', 'Right']) garment('hand_relax', s, A.img, null, 0.12, tint); continue; }
      if (A.slot === 'wrist' || A.slot === 'arm') {
        /* bracelets, watch and arm band: a band wrapped round the arm with the 2D art on it */
        for (const s of ['Left', 'Right']) { if (A.slot === 'wrist' && s === 'Left' && id === 'watch') continue;
          const seg = A.slot === 'wrist' ? 'farm' : 'uarm', fr0 = segFrame(seg, s), df = D[seg], len = Math.hypot(df.bone[0], df.bone[1]), yc = df.piv[1] + len * (A.slot === 'wrist' ? 0.86 : 0.42), bh = pc.h * LATR * 0.5, kpx = len / fr0.L3;
          const fr = { at: y => fr0.at(yc + (y - pc.h / 2) * LATR * 0.5 * kpx), lat: fr0.lat, dep: fr0.dep, sc: fr0.sc, piv: fr0.piv };
          const sec = () => { const b = bodySection(seg, yc, curvy) || { L: 2, R: 2, F: 2, B: 2 }, o = (TP.sleeveU && covers(TP.sleeveU, yc)) ? OFFT + 0.5 : 0.35; return { L: b.L + o, R: b.R + o, F: b.F + o, B: b.B + o }; };
          const ang = (xw, zw) => Math.atan2(xw, zw), u = (xw, zw) => pc.ox + pc.w / 2 + ang(xw, zw) / Math.PI * pc.w * 0.98;
          shell(gb, { fr, rows: range(0, pc.h, 3), nseg: 8, sec, w: (y, p) => segWeights(seg, s, yc, p, fr.lat), strips: [{ a0: -HALF, a1: HALF, pc, u, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }, { a0: HALF, a1: 3 * HALF, pc, u: (xw, zw) => pc.ox + pc.w / 2 - (Math.PI - Math.abs(ang(xw, zw))) * Math.sign(xw) / Math.PI * pc.w * 0.98, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }] }); }
        continue;
      }
      if (A.slot === 'waist') {
        const k = LATR * 0.8, yb = 34, b0 = bodySection('pelvis', yb, curvy), lay = (TP.torso && covers(TP.torso, 470)) ? OFFT + 0.5 : OFFB + 0.5;
        const fr = { at: y => new THREE.Vector3(J.Hips.x, pelvisY(yb) - (y - pc.h / 2) * k * 0.8, J.Hips.z + 0.4), lat: X, dep: Zv, sc: k, piv: pc.w / 2 };
        const sec = () => ({ L: b0.L + lay, R: b0.R + lay, F: b0.F + lay, B: b0.B + lay });
        const u = (xw, zw) => pc.ox + pc.w / 2 + Math.atan2(xw, zw) / Math.PI * pc.w * 0.98;
        shell(gb, { fr, rows: range(0, pc.h, 4), nseg: 12, sec, w: (y, p) => segWeights('pelvis', '', 30, p, X), strips: [{ a0: -HALF, a1: HALF, pc, u, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }, { a0: HALF, a1: 3 * HALF, pc, u: (xw, zw) => pc.ox + pc.w / 2 + (Math.PI - Math.abs(Math.atan2(xw, zw))) * Math.sign(xw) / Math.PI * pc.w * 0.98, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }] });
        continue;
      }
      if (A.slot === 'carry') {
        /* hip bag: a card on the right hip */
        const kk = LATR * 0.75 * 0.55, b0 = bodySection('pelvis', 60, curvy), sd = -1, i0 = gb.n, nx = 6, ny = 8;
        const c0 = new THREE.Vector3(J.Hips.x + sd * (b0.R * 0.92), pelvisY(40), J.Hips.z + b0.F * 0.25), nrm = new THREE.Vector3(sd * 0.75, 0, 0.66).normalize(), side = new THREE.Vector3().crossVectors(UP, nrm).normalize();
        for (let r = 0; r <= ny; r++) for (let c = 0; c <= nx; c++) { const ix = pc.w * c / nx, iy = pc.h * r / ny, pos = c0.clone().addScaledVector(side, -(ix - pc.w / 2) * kk * sd).addScaledVector(UP, -iy * kk).addScaledVector(nrm, 1.6 + Math.sin(c / nx * Math.PI) * 1.2);
          const q = uvOf(pc, ix + pc.ox, iy + pc.oy); gb.v(pos, [[BIX.Hips, 0.7], [BIX.RightUpLeg, 0.3]], [q[0], q[1], q[2], gm(tint)], tintOr(tint)); }
        for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const a2 = i0 + r * (nx + 1) + c, b2 = a2 + 1, c2 = a2 + nx + 1, d2 = c2 + 1; gb.tri(a2, c2, b2); gb.tri(b2, c2, d2); gb.tri(a2, b2, c2); gb.tri(b2, d2, c2); }
        continue;
      }
      if (A.slot === 'neck') {
        const k = LATR * 0.62 * 1.0, topY = J.Neck.y - 2.4, rows = rowSpan(pc.rows);
        const fr = { at: y => new THREE.Vector3(J.Spine2.x, topY - y * k * 0.85, J.Spine2.z), lat: X, dep: Zv, sc: k, piv: pc.w / 2 };
        const sec = y => { const yy = fr.at(y).y, ty = NAV - (yy - J.Spine.y) / TVS, bs = bodySection('torso', clamp(ty, 4, 480), curvy) || { L: 4, R: 4, F: 4, B: 4 }, r = rowAt(pc.rows, y) || [0, pc.w / 2 - 5, pc.w / 2 + 5];
          const lay = TP.torso ? OFFT + 0.5 : 0.5; return { L: Math.max((pc.w / 2 - r[1]) * k, bs.L * 0.6), R: Math.max((r[2] - pc.w / 2) * k, bs.R * 0.6), F: bs.F + lay, B: bs.B + lay }; };
        shell(gb, { fr, rows: range(rows[0], rows[1], 6), nseg: 8, sec, w: () => [[BIX.Spine2, 0.8], [BIX.Neck, 0.2]], strips: [{ a0: -HALF * 0.95, a1: HALF * 0.95, pc, u: xw => pc.ox + pc.w / 2 + xw / k, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }] });
        continue;
      }
      /* head pieces live on the 2D 300x300 head frame (centre 150,150, radius 100) */
      const HS = HR / 100 * 1.04, fr = { at: y => new THREE.Vector3(HC.x, HC.y - (y + pc.oy - 150) * HS, HC.z), lat: X, dep: Zv, sc: HS, piv: 150 - pc.ox };
      const rs = rowSpan(pc.rows); if (!rs) continue;
      const wrap = A.slot === 'head';
      if (A.slot === 'ears') {
        /* earrings hang from each ear lobe on their own little card, like the 2D pair */
        const it = byId(CAT.accessories.items, id) || {}, sc = it.sc || 0.8, hw = pc.w / 2, hh = pc.h, kk = HS * sc;
        for (const sd of [-1, 1]) {
          const ear = new THREE.Vector3(HC.x + sd * HR * 1.0, HC.y - HR * 0.3, HC.z - 1), nrm = new THREE.Vector3(sd * 0.85, 0, 0.53).normalize(), side = new THREE.Vector3().crossVectors(UP, nrm).normalize();
          const i0 = gb.n, xa = sd < 0 ? 0 : hw, nx = 6, ny = 6;
          let mnx = 1e9, mxx = -1e9; for (const r of pc.rows) if (r[1] >= 0) { const l = Math.max(r[1], xa), rr = Math.min(r[2], xa + hw); if (rr > l) { mnx = Math.min(mnx, l); mxx = Math.max(mxx, rr); } }
          if (mnx > mxx) continue; const cxl = (mnx + mxx) / 2;
          for (let r = 0; r <= ny; r++) for (let c = 0; c <= nx; c++) { const ix = xa + hw * c / nx, iy = hh * r / ny, pos = ear.clone().addScaledVector(side, -(ix - cxl) * kk * sd).addScaledVector(UP, -iy * kk).addScaledVector(nrm, 0.6);
            const q = uvOf(pc, ix + pc.ox, iy + pc.oy); gb.v(pos, [[BIX.Head, 1]], [q[0], q[1], q[2], gm(tint)], tintOr(tint)); }
          for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const a2 = i0 + r * (nx + 1) + c, b2 = a2 + 1, c2 = a2 + nx + 1, d2 = c2 + 1; gb.tri(a2, c2, b2); gb.tri(b2, c2, d2); gb.tri(a2, b2, c2); gb.tri(b2, d2, c2); }
        }
        continue;
      }
      const sec = y => { const r = rowAt(pc.rows, y); const dy = HC.y - fr.at(y).y, hd = Math.abs(dy) < HR ? Math.sqrt(HR * HR - dy * dy) : 0;
        let L = r ? (150 - pc.ox - r[1]) * HS : 1, Rr = r ? (r[2] - (150 - pc.ox)) * HS : 1;
        if (wrap) { L = Math.max(L, hd + 2.6); Rr = Math.max(Rr, hd + 2.6); return { L, R: Rr, F: Math.max(hd * 0.95 + 2.8, (L + Rr) * 0.45), B: Math.max(hd * 0.95 + 3.2, (L + Rr) * 0.45) }; }
        const R0 = HR * 1.06 + 1.2; return { L: Math.max(L, 0.5), R: Math.max(Rr, 0.5), F: R0 * 0.94, B: R0 }; };
      const w = () => [[BIX.Head, 1]];
      const ys = range(rs[0] - 1, rs[1] + 1, Math.max(4, Math.round((rs[1] - rs[0]) / 10)));
      if (wrap) shell(gb, { fr, rows: ys, nseg: 10, sec, w, strips: [{ a0: -HALF, a1: HALF, pc, u: xw => 150 + xw / HS, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }, { a0: HALF, a1: 3 * HALF, pc, u: xw => 150 - xw / HS, v: y => y + pc.oy, mode: gm(tint), tint: tintOr(tint) }] });
      else {
        /* glasses and earrings: a curved card that hugs the face */
        const Rf = HR * 1.04 + 1.6, i0 = gb.n, nx = 14, ny = ys.length - 1, x0 = -(150 - pc.ox) * HS, x1 = (pc.w - (150 - pc.ox)) * HS;
        for (let r = 0; r <= ny; r++) for (let c = 0; c <= nx; c++) { const xw = x0 + (x1 - x0) * c / nx, y = ys[r], p = fr.at(y), ang = clamp(xw / Rf, -1.5, 1.5);
          const pos = new THREE.Vector3(HC.x + Math.sin(ang) * Rf, p.y, HC.z + Math.cos(ang) * Rf * 0.96); const q = uvOf(pc, 150 - pc.ox + xw / HS + pc.ox, y + pc.oy); gb.v(pos, w(), [q[0], q[1], q[2], gm(tint)], tintOr(tint)); }
        for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++) { const a = i0 + r * (nx + 1) + c, b = a + 1, c2 = a + nx + 1, d = c2 + 1; gb.tri(a, c2, b); gb.tri(b, c2, d); }
      }
    }
    const g = gb.geometry();
    /* model metrics */
    g.computeBoundingBox(); g.userData = { ground: g.boundingBox.min.y, top: HC.y + HR };
    return g;
  }

  /* ---------------- faces: drawn once into their own atlas page */
  function drawFaces(c, S) {
    c.clearRect(0, 0, S, S); const out = []; const cell = 256;
    const EYES = ['#5a3418', '#2a1810', '#7a5a2a', '#3d6b4a'];
    let n = 0;
    for (const fem of [true, false]) for (const iris of EYES) {
      const bx = (n % 4) * cell * 2, by = Math.floor(n / 4) * cell * 2; out.push({ x: bx, y: by, s: cell, fem, iris }); n++;
      for (let st = 0; st < 4; st++) { const ox = bx + (st & 1) * cell, oy = by + (st >> 1) * cell; drawFace(c, ox, oy, cell, fem, iris, !!(st & 1), !!(st & 2)); }
    }
    /* bartenders keep the painted faces made for them */
    for (const [k, im] of Object.entries(BTIM)) {
      const bx = (n % 4) * cell * 2, by = Math.floor(n / 4) * cell * 2; out[k] = { x: bx, y: by, s: cell }; n++;
      for (let st = 0; st < 4; st++) { const ox = bx + (st & 1) * cell, oy = by + (st >> 1) * cell, w = cell * 0.82, h = w * im.height / im.width; c.drawImage(im, ox + (cell - w) / 2, oy + (cell - h) / 2 + 6, w, h); }
    }
    return out;
  }
  function drawFace(g, ox, oy, s, fem, iris, blink, talk) {
    g.save(); g.translate(ox, oy); g.scale(s / 256, s / 256);
    const cx = 128, ey = 134;
    g.fillStyle = 'rgba(255,90,140,.30)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 64, ey + 30, 17, 9, 0, 0, 7); g.fill(); }
    for (const sx of [-1, 1]) {
      const x = cx + sx * 38;
      if (blink) { g.strokeStyle = '#1b0f14'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 15, ey + 2); g.quadraticCurveTo(x, ey + 12, x + 15, ey + 2); g.stroke(); }
      else {
        g.fillStyle = '#1b0f14'; g.beginPath(); g.ellipse(x, ey, 14, 19, 0, 0, 7); g.fill();
        g.fillStyle = iris; g.beginPath(); g.ellipse(x, ey + 3.5, 10.5, 14, 0, 0, 7); g.fill();
        g.fillStyle = '#1b0f14'; g.beginPath(); g.ellipse(x, ey + 5, 6, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - sx * 4 - 1.5, ey - 7, 5.2, 6, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + 4.5, ey + 9, 2.6, 0, 7); g.fill();
        g.strokeStyle = '#1b0f14'; g.lineCap = 'round'; g.lineWidth = fem ? 4.6 : 3.4; g.beginPath(); g.ellipse(x, ey + 1, 16.5, 21.5, 0, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
      }
      if (fem) { g.strokeStyle = '#1b0f14'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x + sx * 14, ey - 12); g.lineTo(x + sx * 22, ey - 18); g.stroke(); g.beginPath(); g.moveTo(x + sx * 16, ey - 6); g.lineTo(x + sx * 24, ey - 10); g.stroke(); }
      g.strokeStyle = 'rgba(42,24,16,.95)'; g.lineWidth = fem ? 4 : 6.4; g.beginPath(); g.moveTo(x - 13, ey - 32 + (fem ? 0 : 3)); g.quadraticCurveTo(x, ey - 39, x + 13, ey - 32 + sx * (fem ? 1.4 : -1.4)); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(cx, ey + 25, 3.4, 2.4, 0, 0, 7); g.fill();
    if (talk) { g.fillStyle = '#3a1020'; g.beginPath(); g.ellipse(cx, ey + 46, 10, 9, 0, 0, 7); g.fill(); g.fillStyle = '#ff6f9c'; g.beginPath(); g.ellipse(cx, ey + 50, 6, 3.6, 0, 0, 7); g.fill(); }
    else { g.fillStyle = '#3a1020'; g.beginPath(); g.moveTo(cx - 11, ey + 40); g.quadraticCurveTo(cx, ey + 56, cx + 11, ey + 40); g.quadraticCurveTo(cx, ey + 45, cx - 11, ey + 40); g.fill(); g.fillStyle = fem ? '#ff6f9c' : '#e07a7a'; g.beginPath(); g.ellipse(cx, ey + 47.5, 5, 2.4, 0, 0, 7); g.fill(); }
    g.restore();
  }

  /* ---------------- drinks and phones: a personal skeleton for whoever is holding something */
  const PRIGS = [], SP2 = BONES[BIX.Spine2].getWorldQuaternion(new THREE.Quaternion()).invert();
  function personalRig(clip, t) {
    let r = PRIGS.find(x => !x.busy); if (!r) { const bones = makeBones(104 * LATR * 0.92); rigRoot.add(bones[0]); r = { bones, skel: new THREE.Skeleton(bones, INV), mixer: new THREE.AnimationMixer(bones[0]), B: Object.fromEntries(bones.map(b => [b.name, b])), users: 0, personal: true }; PRIGS.push(r); }
    r.busy = true; r.mixer.stopAllAction(); r.clip = clip; r.act = r.mixer.clipAction(clip); r.act.reset().play(); r.act.time = t || 0; r.speed = 1.05; return r;
  }
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion(), va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  function aimBone(b, child, dir, w) {
    b.updateWorldMatrix(true, false); child.updateWorldMatrix(false, false);
    va.setFromMatrixPosition(b.matrixWorld); vb.setFromMatrixPosition(child.matrixWorld).sub(va).normalize();
    qa.setFromUnitVectors(vb, dir); qa.slerp(qc.identity(), 1 - w);
    b.getWorldQuaternion(qb); qb.premultiply(qa); b.parent.getWorldQuaternion(qc); b.quaternion.copy(qc.invert().multiply(qb)); b.updateMatrixWorld(true);
  }
  const POSE = { base: [[0.3, -0.92, 0.25], [-0.15, 0.2, 1]], mouth: [[0.45, -0.25, 0.55], [-0.7, 0.7, 0.2]], up: [[0.35, 0.9, 0.2], [0.05, 1, 0.15]], phone: [[0.5, -0.35, 0.6], [-0.35, 0.85, 0.35]] };
  const dU = new THREE.Vector3(), dF = new THREE.Vector3(), tU = new THREE.Vector3(), tF = new THREE.Vector3();
  function holdPose(r, h, w) {
    const sd = h.hand === 'Left' ? 'Left' : 'Right', sx = sd === 'Left' ? 1 : -1, B = r.B;
    const base = h.kind === 'phone' ? null : POSE.base, tg = POSE[h.to === 'up' ? 'up' : h.kind === 'phone' ? 'phone' : 'mouth'];
    const sq = B.Spine2.getWorldQuaternion(new THREE.Quaternion()).multiply(SP2);
    const set = (v, a) => v.set(a[0] * sx, a[1], a[2]);
    if (base) { set(dU, base[0]); set(dF, base[1]); set(tU, tg[0]); set(tF, tg[1]); dU.lerp(tU, h.arm); dF.lerp(tF, h.arm); }
    else { set(dU, tg[0]); set(dF, tg[1]); }
    dU.normalize().applyQuaternion(sq); dF.normalize().applyQuaternion(sq);
    const ww = base ? w : w * h.arm;
    aimBone(B[sd + 'Arm'], B[sd + 'ForeArm'], dU, ww); aimBone(B[sd + 'ForeArm'], B[sd + 'Hand'], dF, ww);
  }
  const PMAT = {}; const pm = (c, o) => PMAT[c + (o ? 'o' : '')] || (PMAT[c + (o ? 'o' : '')] = o ? new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false }) : new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }));
  const LIQ = { martini: '#ff4fa8', beer: '#ffb627', shot: '#ff9a1f', cocktail: '#ff7a3c', champagne: '#ffe58a', wine: '#9e1238', starships: '#ff3fd0', cybertruck: '#4fd8ff', daq: '#ff2f4f', barbz: '#ff5f8f' };
  const SHAPE = { martini: 'cone', beer: 'mug', shot: 'shot', cocktail: 'tall', champagne: 'flute', wine: 'bowl', starships: 'tall', cybertruck: 'tall', daq: 'tall', barbz: 'bowl' };
  function makeProp(kind) {
    const g = new THREE.Group();
    if (kind === 'phone') { const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 6, 0.6), pm('#1a1020')); const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 5.3), new THREE.MeshBasicMaterial({ color: '#9fe8ff' })); sc.position.z = -0.31; sc.rotation.y = Math.PI; b.add(sc); b.position.y = 2.5; g.add(b); return g; }
    const sh = SHAPE[kind] || 'tall', lc = LIQ[kind] || '#ff7ab8';
    const prof = { cone: [[0.2, 0], [2.2, 0], [0.3, 0.3], [0.3, 4], [3.6, 7.2]], mug: [[2.2, 0], [2.4, 6.4]], shot: [[1.3, 0], [1.7, 3]], tall: [[1.6, 0], [2, 7.5]], flute: [[1.4, 0], [0.3, 0.3], [0.3, 3.4], [1.2, 4], [1.3, 8.5]], bowl: [[1.5, 0], [0.3, 0.3], [0.3, 3.2], [2.4, 4.6], [2.2, 7]] }[sh];
    const glass = new THREE.Mesh(new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 14), pm('#e8f6ff', 0.38)); g.add(glass);
    const top = prof[prof.length - 1][1], bot = sh === 'cone' ? 4.4 : sh === 'flute' ? 4.2 : sh === 'bowl' ? 3.6 : 0.4, rl = prof[prof.length - 1][0] * 0.9;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(rl, sh === 'cone' ? 0.4 : rl * 0.9, top - bot - 0.6, 12), pm(lc)); liq.geometry.translate(0, (top - bot - 0.6) / 2, 0); liq.position.y = bot; g.add(liq); g.userData.liq = liq;
    if (sh === 'tall') { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 6), pm('#ff3fa4')); st.position.set(0.8, 6, 0); st.rotation.z = -0.25; g.add(st); }
    if (sh === 'mug') { const hd = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.35, 6, 12, Math.PI), pm('#e8f6ff', 0.5)); hd.position.set(2.4, 3.4, 0); hd.rotation.z = -Math.PI / 2; g.add(hd); const fo = new THREE.Mesh(new THREE.SphereGeometry(2.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), pm('#fff8e6')); fo.position.y = 6.2; g.add(fo); }
    return g;
  }
  function placeProp(a, st, s) {
    const h = st.hold; if (!h || !a.prig) { if (a.prop) a.prop.visible = false; return; }
    if (!a.prop || a.prop.userData.kind !== h.kind) { if (a.prop) scene.remove(a.prop); a.prop = makeProp(h.kind); a.prop.userData.kind = h.kind; scene.add(a.prop); }
    const sd = h.hand === 'Left' ? 'Left' : 'Right', hb = a.prig.B[sd + 'Hand'], fb = a.prig.B[sd + 'ForeArm'];
    hb.getWorldPosition(va); fb.getWorldPosition(vb); vc.copy(va).sub(vb).normalize(); va.addScaledVector(vc, 3.8);
    va.applyMatrix4(a.mesh.matrixWorld); a.prop.position.copy(va); a.prop.visible = a.mesh.visible;
    a.prop.scale.setScalar(s * 1.7 * Math.max(0.01, h.s == null ? 1 : h.s)); a.prop.rotation.order = 'YXZ'; a.prop.rotation.set(-0.1 * (h.aim || 0), a.yaw, (h.kind === 'phone' ? 0 : -(sd === 'Left' ? 1 : -1) * ((h.aim || 0) * 1.0 + (h.over || 0) * (h.aim || 0))) + (h.tilt || 0));
    if (a.prop.userData.liq) a.prop.userData.liq.scale.y = Math.max(0.02, h.lvl == null ? 1 : h.lvl);
  }

  /* ---------------- blob shadows: one instanced draw */
  const MAXS = 600, shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(10,0,14,.62)'); gr.addColorStop(0.6, 'rgba(10,0,14,.3)'); gr.addColorStop(1, 'rgba(10,0,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
  const shGeo = new THREE.PlaneGeometry(1, 1); shGeo.rotateX(-Math.PI / 2);
  const shadows = new THREE.InstancedMesh(shGeo, new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }), MAXS); shadows.count = 0; shadows.frustumCulled = false; shadows.renderOrder = -1; scene.add(shadows);
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();

  /* ---------------- avatars */
  const AV = new Map(), queue = [];
  let geoBytes = 0;
  function acquireGeo(L) {
    const sig = sigOf(L); let e = GEO.get(sig);
    if (e) { e.refs++; return e; }
    return null;
  }
  function releaseGeo(e) { if (!e) return; e.refs--; if (e.refs <= 0) { e.t = performance.now(); } }
  function gcGeo() { if (GEO.size < 140) return; for (const [k, e] of GEO) if (e.refs <= 0 && performance.now() - e.t > 20000) { e.geo.dispose(); GEO.delete(k); } }
  function buildNow(L) { const sig = sigOf(L); let e = GEO.get(sig); if (!e) { const geo = buildLook(L); e = { geo, refs: 0, t: 0 }; GEO.set(sig, e); } e.refs++; return e; }
  function pump(budget) {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < budget) {
      const a = queue.shift(); if (!a.want || a.dead) continue; const L = a.want; a.want = null;
      try { const e = buildNow(L); attach(a, e); } catch (err) { console.error('vnn3d build', err); a.err = String(err && err.message || err); }
    }
  }
  function attach(a, e) {
    const old = a.ge; a.ge = e;
    if (!a.mesh) { a.mesh = new THREE.SkinnedMesh(e.geo, MAT); a.out = new THREE.SkinnedMesh(e.geo, OMAT); for (const m of [a.mesh, a.out]) { m.bindMode = 'detached'; m.frustumCulled = false; m.matrixAutoUpdate = true; } a.mesh.onBeforeRender = faceHook; a.mesh.userData.av = a; const r0 = RIGS.idle[0]; a.mesh.bind(r0.skel, IDENT); a.out.bind(r0.skel, IDENT); a.rig = r0; r0.users++; a.mesh.visible = a.out.visible = false; scene.add(a.mesh, a.out); }
    else { a.mesh.geometry = e.geo; a.out.geometry = e.geo; }
    releaseGeo(old);
  }
  function faceHook(r, s, c, g, m) { const a = this.userData.av; U.uFace.value.set(a.blink ? 256 / PAGE : 0, a.talkOn ? 256 / PAGE : 0); m.uniformsNeedUpdate = true; }
  function remove(a) { a.dead = true; if (a.prig) { a.prig.busy = false; a.prig = null; } if (a.prop) scene.remove(a.prop); if (a.mesh) { scene.remove(a.mesh, a.out); } releaseGeo(a.ge); if (a.rig && !a.rig.personal) a.rig.users--; AV.delete(a.key); }
  function pickRig(a, st) {
    if (st.walk) return RIGS.walk[(st.ph >>> 0) % 3];
    if (st.idle) return RIGS.idle[(st.ph >>> 0) % 2];
    const d = RIGS[st.dance] ? st.dance : DANCES[(st.ph >>> 0) % 6];
    return RIGS[d][(st.ph >>> 3) % PHASES];
  }
  const ease = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  let lastT = 0, statN = 0, frameMs = 0, outlineCut = 1e9; const SIZEK = opts.size || 0.86;
  const tmpV = new THREE.Vector3();
  function frame(now, beat, states) {
    const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 0.016); lastT = now;
    const t0 = performance.now();
    const seen = new Set();
    let n = 0, sh = 0;
    for (const st of states) {
      let a = AV.get(st.key);
      if (!a) { a = { key: st.key, sig: '', ge: null, mesh: null, out: null, rig: null, yaw: 0, born: now, pop: 0, blinkT: now + 1500 + Math.random() * 3000, blink: false, talkOn: false, vis: 0 }; AV.set(st.key, a); }
      seen.add(st.key);
      const sig = sigOf(st.look);
      if (sig !== a.sig) { a.sig = sig; const e = acquireGeo(st.look); if (e) attach(a, e); else { a.want = st.look; if (queue.indexOf(a) < 0) (st.front ? queue.unshift(a) : queue.push(a)); } }
      if (!a.mesh) continue;
      /* where the 2D overlay says this person stands, at the size it gives them */
      const yy = Math.max(st.y - yh, 45), z = F * CAMH / yy, Xw = (st.x - W / 2) * z / F, Yf = CAMH - (st.y - yh) * z / F;
      const gd = a.ge.geo.userData, H3 = gd.top - gd.ground;
      /* pop in / out */
      const tv = st.vis ? 1 : 0; a.vis += (tv - a.vis) * Math.min(1, dt * (tv ? 6 : 8));
      if (a.vis < 0.02 && !st.vis) { a.mesh.visible = a.out.visible = false; continue; }
      const pk2 = st.vis ? ease(Math.min(1, a.vis * 1.02)) : a.vis;
      const s = st.fh * SIZEK * z / (F * H3) * Math.max(0.01, pk2);
      a.mesh.visible = true; a.mesh.position.set(Xw, Yf - gd.ground * s, -z); a.mesh.scale.setScalar(s);
      /* facing: the way they walk, otherwise towards the camera */
      let yawT;
      if (st.walk && (Math.abs(st.walk.dx) + Math.abs(st.walk.dy) > 0.5)) yawT = Math.atan2(st.walk.dx / F, st.walk.dy / yy);
      else yawT = Math.atan2(-Xw, z) * 0.85 + (st.yaw || 0);
      let dyaw = Math.atan2(Math.sin(yawT - a.yaw), Math.cos(yawT - a.yaw)); a.yaw += dyaw * Math.min(1, dt * 7); a.mesh.rotation.y = a.yaw;
      a.out.position.copy(a.mesh.position); a.out.scale.copy(a.mesh.scale); a.out.rotation.y = a.yaw;
      const showOut = st.fh > outlineCut ? true : st.fh > 80; a.out.visible = showOut;
      /* animation rig */
      let rg = pickRig(a, st);
      if (st.hold) { if (!a.prig) { a.prig = personalRig(rg.act.getClip(), rg.act.time); } else if (a.prig.clip !== rg.act.getClip()) { a.prig.mixer.stopAllAction(); a.prig.clip = rg.act.getClip(); a.prig.act = a.prig.mixer.clipAction(a.prig.clip); a.prig.act.play(); a.prig.act.time = rg.act.time; } a.hw = Math.min(1, (a.hw || 0) + dt * 4); a.lastHold = st.hold; rg = a.prig; }
      else if (a.prig) { a.hw = Math.max(0, (a.hw || 0) - dt * 4); if (a.hw > 0) rg = a.prig; else { a.prig.busy = false; a.prig = null; } }
      if (rg !== a.rig) { if (a.rig && !a.rig.personal) a.rig.users--; if (!rg.personal) rg.users++; a.rig = rg; a.mesh.bind(rg.skel, IDENT); a.out.bind(rg.skel, IDENT); }
      /* face life: blinks, mouth moves while their bubble is up */
      if (now > a.blinkT) { a.blink = !a.blink; a.blinkT = now + (a.blink ? 120 : 2200 + Math.random() * 3800); }
      if (a.prig) { a.prig.mixer.update(dt * 1.05 * (opts.speed || 1)); a.prig.bones[0].updateMatrixWorld(true); const h = st.hold || a.lastHold; if (h) holdPose(a.prig, h, a.hw); }
      a.mesh.updateMatrixWorld(); placeProp(a, st.hold ? st : { hold: null }, s);
      a.talkOn = !!st.talk && Math.sin(now / 1000 * 17 + (st.ph & 7)) > -0.1;
      /* where the head is on screen this frame (for the profile-pic pin and chat bubbles) */
      if (a.rig && a.rig.B.Head) { const hb = a.rig.B.Head; hb.getWorldPosition(tmpV); tmpV.y += (HC.y - J.Head.y) + HR * 1.12; a.mesh.updateMatrixWorld(); tmpV.applyMatrix4(a.mesh.matrixWorld).project(cam); st.hy = (1 - tmpV.y) / 2 * H; st.fy = st.y; }
      /* blob shadow */
      if (sh < MAXS) { tmpS.set(s * H3 * 0.42, 1, s * H3 * 0.42 * 0.55); tmpP.set(Xw, Yf + 0.002, -z); tmpQ.identity(); tmpM.compose(tmpP, tmpQ, tmpS); shadows.setMatrixAt(sh++, tmpM); }
      n++;
    }
    for (const [k, a] of AV) if (!seen.has(k)) { if (a.mesh && a.vis > 0.02) { a.vis *= 0.8; a.mesh.scale.multiplyScalar(0.8); a.out.scale.copy(a.mesh.scale); } else remove(a); }
    shadows.count = sh; shadows.instanceMatrix.needsUpdate = true;
    /* advance only the skeletons someone is using */
    for (const r of allRigs) if (r.users > 0) r.mixer.update(dt * r.speed * (opts.speed || 1));
    /* club lights breathe with the beat */
    const ph = beat % 1, kick = Math.exp(-ph * 6);
    pk.intensity = 0; cy.intensity = 0; hemi.intensity = 1.5 + kick * 0.12; rim.intensity = 1.0 + kick * 0.5;
    pump(n > 60 ? 3 : 6);
    if (!opts.noRender) R.render(scene, cam); else { scene.updateMatrixWorld(); for (const r of allRigs) if (r.users > 0) r.skel.update(); }
    frameMs = frameMs * 0.92 + (performance.now() - t0) * 0.08; statN = n; gcGeo();
  }
  return {
    canvas, frame, renderer: R, scene, camera: cam,
    stats: () => ({ avatars: statN, ms: +frameMs.toFixed(2), calls: R.info.render.calls, tris: R.info.render.triangles, geos: GEO.size, queue: queue.length, rigsLive: allRigs.filter(r => r.users > 0).length }),
    clear() { for (const a of [...AV.values()]) remove(a); queue.length = 0; },
    setOutlineAll(v) { outlineCut = v ? 0 : 1e9; },
    buildLook, sigOf, J, HC, HR, LATR, CLIPS
  };
}
