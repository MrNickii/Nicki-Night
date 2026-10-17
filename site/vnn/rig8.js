/* paper-doll rig v6 (multi-view hands, shoes, 3/4 torso/pelvis): puppet driven by real motion-capture joints (CMU mocap, free to use), 3D->2D retarget with foreshortening, depth-sorted arms */
var RIG = (function () {
  var PART = {}, CFG = { hk: 1.09, ak: 1.16, skTop: -100, nOff: 18 }, MOC = null, D2R = Math.PI / 180, U = 1, NS = 5;
  var HIP = [104, 78], WAIST = [0, -110], SHO_Y = -255, SHO_X = 138, NECKB_Y = -318, GROUND = 740, HEADR = 116, HEADUP = 70, FOOTH = 128;
  var STRIP = [466, 306, 224, 142, 60, 0], NODE = [382, 306, 224, 142, 60];
  var JI = {}, CL = {};
  function load(mocap) {
    MOC = mocap; mocap.joints.forEach(function (j, i) { JI[j] = i; });
    Object.keys(mocap.clips).forEach(function (k) { prep(k, mocap.clips[k]); });
  }
  /* build a part: canvas (or Image) + def {piv,bone,ank,ball,disc} -> tiers (mip chain) */
  function mkPart(im, d, q) {
    q = q || 1; var w = im.width / q, h = im.height / q, tiers = [{ c: im, k: q }], prev = im, kk = q, i;
    for (i = 0; i < 4; i++) { kk /= 2; var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * kk)); c.height = Math.max(1, Math.round(h * kk)); var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(prev, 0, 0, c.width, c.height); tiers.push({ c: c, k: kk }); prev = c; }
    return { ball: d.ball, ank: d.ank, disc: d.disc, w: w, h: h, piv: d.piv || [w / 2, 0], bone: d.bone || [0, 1], len: d.bone ? Math.hypot(d.bone[0], d.bone[1]) : 0, tiers: tiers };
  }
  function use(P) { PART = P; }
  /* ---- mocap clips ---- */
  function prep(name, c) {
    var n = c.n, J = MOC.joints.length, mean = new Float32Array(J * 3), i, k;
    c.raw = c.f.map(function (r) { return Float32Array.from(r); });
    for (i = 0; i < n; i++) for (k = 0; k < J * 3; k++) mean[k] += c.raw[i][k] / n;
    c.mean = mean; c.cf = Math.max(3, Math.floor(n * 0.16)); c.M = n - c.cf; c.dur = c.M / c.fps;
    var amin = 9, y3;
    for (i = 0; i < n; i++) { y3 = Math.min(c.raw[i][JI.LeftFoot * 3 + 1], c.raw[i][JI.RightFoot * 3 + 1]); if (y3 < amin) amin = y3; }
    c.aRest = amin; c.cb = Math.max(4, Math.round(c.dur * 2 / 2) * 2); CL[name] = c;
  }
  function frameAt(c, idx, out) {
    var n = c.n, cf = c.cf, a, b, w, k, J3 = out.length;
    var i = c.cf + idx; // idx in [0,M)
    if (i >= n - cf) { w = (i - (n - cf) + 1) / cf; a = c.raw[i]; b = c.raw[i - (n - cf)]; for (k = 0; k < J3; k++) out[k] = a[k] + (b[k] - a[k]) * w; }
    else { a = c.raw[i]; for (k = 0; k < J3; k++) out[k] = a[k]; }
  }
  function sample(name, u, amp) { // u = cycle position in [0,1)
    var c = CL[name] || CL.salsa, J3 = MOC.joints.length * 3, f = u * c.M, i0 = Math.floor(f), fr = f - i0, A = new Float32Array(J3), B = new Float32Array(J3), k;
    frameAt(c, i0 % c.M, A); frameAt(c, (i0 + 1) % c.M, B);
    for (k = 0; k < J3; k++) { var v = A[k] + (B[k] - A[k]) * fr; A[k] = c.mean[k] + (v - c.mean[k]) * amp; }
    return { j: A, aRest: c.aRest };
  }
  /* ---- drawing helpers ---- */
  function rot(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function tier(p, px) { var t = p.tiers[0], i; for (i = 0; i < p.tiers.length; i++) if (p.tiers[i].k >= px * 0.9) t = p.tiers[i]; return t; }
  function blit(ctx, p, T, sx, sy, sw, sh, dx, dy) { ctx.drawImage(T.c, sx * T.k, sy * T.k, Math.max(1, sw * T.k), Math.max(1, sh * T.k), dx, dy, sw, sh); }
  function drawRot(ctx, name, x, y, a, flip, sy, px, sx) {
    var p = PART[name], T = tier(p, px); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale((flip ? -1 : 1) * (sx || 1), sy || 1); blit(ctx, p, T, 0, 0, p.w, p.h, -p.piv[0], -p.piv[1]); ctx.restore();
  }
  function drawDir(ctx, name, x, y, dir, flip, px) {
    var p = PART[name], bx = flip ? -p.bone[0] : p.bone[0]; drawRot(ctx, name, x, y, dir - Math.atan2(p.bone[1], bx), flip, 1, px);
  }
  function drawLimb(ctx, name, x, y, dir, flip, sy, px) { var p = PART[name]; var bx = flip ? -p.bone[0] : p.bone[0]; drawRot(ctx, name, x, y, dir - Math.atan2(-bx, p.bone[1]) * 1, flip, sy, px); }
  function ik(H, A, side, L1, L2) {
    var dx = A[0] - H[0], dy = A[1] - H[1], d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.5), base = Math.atan2(dy, dx);
    var c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), a = Math.acos(Math.max(-1, Math.min(1, c)));
    var t1 = base + side * a, K = [H[0] + Math.cos(t1) * L1, H[1] + Math.sin(t1) * L1];
    return { K: K, t1: t1, t2: Math.atan2(A[1] - K[1], A[0] - K[0]) };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function len3(v) { return Math.hypot(v[0], v[1], v[2]); }
  function figure(ctx, o, headFn) {
    var P = o.pose, J = P.j, px = o.px || 0.3, base0 = ctx.globalAlpha, ST = o.st || {}, NOW = o.now || 0;
    function g(n) { var i = JI[n] * 3; return [J[i], J[i + 1], J[i + 2]]; }
    var c0 = CL.salsa.mean; function g0(n) { var i = JI[n] * 3; return [c0[i], c0[i + 1], c0[i + 2]]; }
    var th = PART.thigh, sn = PART.shin, ua = PART.uarm, fm = PART.farm;
    var LEGK = o.legk || 1, CURVY = o.body === 'curvy', SX = CURVY ? [1.07, 0.94, 1.05, 1.01, 1] : [1, 1, 1, 1, 1], PK = CURVY ? 1.09 : 1;
    var kleg = LEGK * (th.len + sn.len) / (len3(sub(g0('LeftUpLeg'), g0('LeftLeg'))) + len3(sub(g0('LeftLeg'), g0('LeftFoot'))));
    var YF = GROUND + 41;
    function wy(y) { return YF - FOOTH - kleg * (y - P.aRest); }
    var UL = g('LeftUpLeg'), UR = g('RightUpLeg'), HC = [(UL[0] + UR[0]) / 2, (UL[1] + UR[1]) / 2, (UL[2] + UR[2]) / 2], HC0 = g0('LeftUpLeg');
    var hc0 = [(g0('LeftUpLeg')[0] + g0('RightUpLeg')[0]) / 2, 0, 0];
    var pelC = [kleg * (HC[0] - hc0[0]) * 0.9, wy(HC[1]) - HIP[1]];
    var hv = [UL[0] - UR[0], -(UL[1] - UR[1])], pr = Math.atan2(hv[1], hv[0]);
    var hw0 = len3(sub(g0('LeftUpLeg'), g0('RightUpLeg'))), rp = clamp(Math.hypot(hv[0], hv[1]) / hw0, 0.9, 1);
    /* spine */
    var NK = g('Neck'), HP = g('Hips'), LA = g('LeftArm'), RA = g('RightArm'), SP1 = g('Spine1');
    var sv = [LA[0] - RA[0], -(LA[1] - RA[1])], cr = Math.atan2(sv[1], sv[0]), sw0 = len3(sub(g0('LeftArm'), g0('RightArm')));
    var cy = clamp(Math.hypot(sv[0], sv[1]) / sw0, 0.9, 1), yawC = Math.asin(clamp((LA[2] - RA[2]) / sw0, -1, 1)), wT = clamp(Math.abs(yawC) / 0.65, 0, 1), mirT = yawC > 0;
    var yawH = Math.asin(clamp((UL[2] - UR[2]) / hw0, -1, 1)), wH = clamp(Math.abs(yawH) / 0.65, 0, 1), mirH = yawH > 0;
    var lean = Math.atan2(NK[0] - HP[0], NK[1] - HP[1]);
    var sp0 = len3(sub(g0('Neck'), g0('Hips'))), sq = clamp(Math.hypot(NK[0] - HP[0], NK[1] - HP[1]) / sp0, 0.86, 1.02);
    var W = rot(WAIST, pr); W = [W[0] + pelC[0], W[1] + pelC[1]];
    var nodes = [], pos = W.slice(), i, ang;
    for (i = 0; i < NS; i++) {
      var t = i / (NS - 1); ang = pr * (1 - t) + cr * t + lean * 0.55;
      if (i > 0) { var v = rot([0, (NODE[i] - NODE[i - 1]) * sq], nodes[i - 1].a); pos = [nodes[i - 1].p[0] + v[0], nodes[i - 1].p[1] + v[1]]; }
      nodes.push({ p: pos.slice(), a: ang });
    }
    function spt(yl, xl) { var k = 0; for (var j = 0; j < NS; j++) if (yl <= STRIP[j] && yl >= STRIP[j + 1]) { k = j; break; } var v = rot([xl, (yl - NODE[k]) * sq], nodes[k].a); return [nodes[k].p[0] + v[0], nodes[k].p[1] + v[1]]; }
    var tl = PART.torso, torsoTop = nodes[NS - 1].a;
    var S = [spt(382 + SHO_Y, SHO_X * cy), spt(382 + SHO_Y, -SHO_X * cy)], nb = spt(382 + NECKB_Y, 0);
    /* legs */
    var legs = [[1, 'Left'], [-1, 'Right']].map(function (z) {
      var sd = z[0], s = z[1], U0 = g(s + 'UpLeg'), K0 = g(s + 'Leg'), F0 = g(s + 'Foot'), T0 = g(s + 'ToeBase');
      var H = rot([sd * HIP[0] * rp, HIP[1]], pr); H = [H[0] + pelC[0], H[1] + pelC[1]];
      var Kp = [H[0] + kleg * (K0[0] - U0[0]), H[1] - kleg * (K0[1] - U0[1])];
      var A = [Kp[0] + kleg * (F0[0] - K0[0]), Kp[1] - kleg * (F0[1] - K0[1])];
      var r = { K: Kp, d1: Math.atan2(-(Kp[0] - H[0]), Kp[1] - H[1]), f1: clamp(Math.hypot(Kp[0] - H[0], Kp[1] - H[1]) / th.len, 0.42, 1.2), d2: Math.atan2(-(A[0] - Kp[0]), A[1] - Kp[1]), f2: clamp(Math.hypot(A[0] - Kp[0], A[1] - Kp[1]) / sn.len, 0.42, 1.2) };
      var tx = T0[0] - F0[0], tz = T0[2] - F0[2], th0 = Math.atan2(F0[1] - T0[1], Math.hypot(tx, tz) + 1e-4);
      var pitch = clamp(th0 - 0.62, -0.6, 0.9), flip = Math.abs(tx) > 0.06 ? tx < 0 : (Math.abs(tx) > 0.015 && ST['fl' + s] != null ? ST['fl' + s] : (Math.abs(tx) > 0.03 ? tx < 0 : sd < 0)); ST['fl' + s] = flip;
      var beta = Math.atan2(Math.abs(tx), tz) / D2R, th2 = 18 + beta * 0.9;
      var wF = 0, wA = 0, wS = 0, wB = 0;
      if (th2 <= 45) { wF = (45 - th2) / 45; wA = 1 - wF; } else if (th2 <= 90) { wA = (90 - th2) / 45; wS = 1 - wA; } else { wS = clamp((180 - th2) / 90, 0, 1); wB = 1 - wS; }
      var W4 = { shoeF: wF, shoeA: wA, shoeS: wS, shoeB: wB }, best = 'shoeF', bk; for (bk in W4) if (PART[bk] && (!PART[best] || W4[bk] > W4[best])) best = bk; var prv = ST['sv' + s]; if (prv && PART[prv] && W4[prv] >= W4[best] - 0.2) best = prv; ST['sv' + s] = best;
      return { sd: sd, H: H, A: A, ik: r, psi: pitch * (flip ? -1 : 1) * 0.9 * (1 - wB), flip: flip, view: best, w: W4 };
    });
    function drawFoot(gl) {
      var sq0 = ST['sx' + gl.sd];
      if (!sq0 || sq0.cur !== gl.view) ST['sx' + gl.sd] = sq0 = { cur: gl.view, prev: sq0 ? sq0.cur : null, t0: NOW };
      var sf = clamp((NOW - sq0.t0) / 0.08, 0, 1);
      if (sq0.prev && sf < 1 && PART[sq0.prev]) { var pp = PART[sq0.prev], TT = tier(pp, px), ddy = FOOTH - (pp.h - pp.ank[1]); ctx.save(); ctx.translate(gl.A[0], gl.A[1] + ddy); ctx.rotate(gl.psi); ctx.scale(gl.flip ? -1 : 1, 1); blit(ctx, pp, TT, 0, 0, pp.w, pp.h, -pp.ank[0], -pp.ank[1]); ctx.restore(); }
      var order = PART[gl.view] ? [gl.view] : [];
      order.forEach(function (n, i) {
        var pt = PART[n], T = tier(pt, px), dy = FOOTH - (pt.h - pt.ank[1]);
        ctx.save(); ctx.globalAlpha = base0 * ((sq0.prev && sf < 1) ? sf : 1); ctx.translate(gl.A[0], gl.A[1] + dy); ctx.rotate(gl.psi); ctx.scale(gl.flip ? -1 : 1, 1); blit(ctx, pt, T, 0, 0, pt.w, pt.h, -pt.ank[0], -pt.ank[1]); ctx.restore();
      });
    }
    function drawLegs() { legs.forEach(function (gl) {
      drawLimb(ctx, 'shin', gl.ik.K[0], gl.ik.K[1], gl.ik.d2, gl.sd < 0, gl.ik.f2, px);
      drawLimb(ctx, 'thigh', gl.H[0], gl.H[1], gl.ik.d1, gl.sd < 0, gl.ik.f1, px);
      drawFoot(gl);
    }); }
    /* hair back */
    var hasHair = o.hair !== false && PART.hairb;
    var head = g('Head'), hang = Math.atan2(head[0] - NK[0], head[1] - NK[1]);
    var hrot = hang * 0.85 + torsoTop * 0.15, hcr = HEADR;
    var na = (torsoTop + hrot) / 2, nt = rot([0, -PART.neck.len], na), hco = rot([0, -HEADUP], hrot); var hc = [nb[0] + nt[0] + hco[0], nb[1] + nt[1] + hco[1]];
    var sw = (o.sway || 0);
    function hair(front) {
      if (!hasHair || front && !o.fronthair) return;
      var pt = PART[front ? 'hairf' : 'hairb'], k = CFG.hk;
      ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(hrot + (front ? 0 : sw * 0.5)); ctx.scale(k, k);
      blit(ctx, pt, tier(pt, px * k), 0, 0, pt.w, pt.h, -pt.disc[0], -pt.disc[1]); ctx.restore();
    }
    var hsw = ST.hsw || (ST.hsw = { x: hc[0], a: 0, t: NOW }), hdt = clamp(NOW - hsw.t, 0.001, 0.1), hvx = (hc[0] - hsw.x) / hdt; hsw.x = hc[0]; hsw.t = NOW;
    hsw.a += (clamp(-hvx * 0.0009, -0.4, 0.4) - hsw.a) * Math.min(1, hdt * 9); sw += hsw.a;
    hair(false);
    /* arms */
    var arms = [[1, 'Left', S[0]], [-1, 'Right', S[1]]].map(function (z) {
      var ak = z[1];
      var sd = z[0], s = z[1], Sh = z[2], A0 = g(s + 'Arm'), E0 = g(s + 'ForeArm'), W0 = g(s + 'Hand');
      var v1 = [E0[0] - A0[0], -(E0[1] - A0[1])], v2 = [W0[0] - E0[0], -(W0[1] - E0[1])], l1 = len3(sub(E0, A0)), l2 = len3(sub(W0, E0));
      var f1 = clamp(Math.hypot(v1[0], v1[1]) / l1, 0.34, 1), f2 = clamp(Math.hypot(v2[0], v2[1]) / l2, 0.3, 1);
      var a1 = Math.atan2(-v1[0], v1[1]), a2 = Math.atan2(-v2[0], v2[1]);
      var Ep = rot([0, ua.len * f1], a1); Ep = [Sh[0] + Ep[0], Sh[1] + Ep[1]];
      var Wp = rot([0, fm.len * f2], a2); Wp = [Ep[0] + Wp[0], Ep[1] + Wp[1]];
      var z2 = ((E0[2] + W0[2]) / 2) - SP1[2], dz = W0[2] - E0[2], rise = W0[1] - A0[1];
      var towards = ST['tw' + ak] ? dz > -0.03 : dz > 0.03; ST['tw' + ak] = towards;
      var fullF = towards && (ST['ff' + ak] ? f2 < 0.5 : f2 < 0.38); ST['ff' + ak] = fullF;
      var curlF = towards && (ST['cf' + ak] ? f2 < 0.86 : f2 < 0.76); ST['cf' + ak] = curlF;
      var openH = ST['oh' + ak] ? rise > 0.06 : rise > 0.14; ST['oh' + ak] = openH;
      var frontF = ST['fr' + ak] ? z2 > 0.06 : z2 > 0.16; ST['fr' + ak] = frontF;
      return { ak: ak, hand: openH ? 'hand_open' : 'hand_relax', sd: sd, Sh: Sh, Ep: Ep, Wp: Wp, a1: a1, a2: a2, f1: f1, f2: f2, front: frontF, fist: fullF, curl: curlF };
    });
    function bH0() { return clamp((wH - 0.36) / 0.04, 0, 1); }
    if (o.dbg) o.dbg.push({ hc: hc.slice(), arms: arms.map(function (q) { return { h: q.fist ? 'ffarm' : (q.curl ? 'fist' : q.hand), fr: q.front, Wp: q.Wp.slice(), Ep: q.Ep.slice() }; }), foot: legs.map(function (gl) { return gl.view; }), bH: bH0(), wT: wT });
    function drawArm(a) {
      var fl = a.sd < 0;
      drawRot(ctx, 'uarm', a.Sh[0], a.Sh[1], a.a1, fl, a.f1, px);
      if (a.fist) drawRot(ctx, 'ffarm', a.Ep[0], a.Ep[1], a.a2, fl, clamp(a.f2 * 1.15, 0.5, 0.85), px);
      else { drawRot(ctx, 'farm', a.Ep[0], a.Ep[1], a.a2, fl, a.f2, px);
        if (PART.wacc) { var pw = PART.wacc, wk = 0.9; ctx.save(); ctx.translate(a.Wp[0], a.Wp[1] - 8); ctx.rotate(a.a2); ctx.scale(wk, a.f2 * 0.9 + 0.1); blit(ctx, pw, tier(pw, px), 0, 0, pw.w, pw.h, -pw.piv[0], -pw.piv[1]); ctx.restore(); }
        var hn = (a.curl && PART.fist) ? 'fist' : a.hand, hq = ST['hs' + a.ak];
        if (!hq || hq.cur !== hn) ST['hs' + a.ak] = hq = { cur: hn, prev: hq ? hq.cur : null, t0: NOW };
        var hf = clamp((NOW - hq.t0) / 0.09, 0, 1), hsc = 0.65 + 0.35 * a.f2;
        if (hq.prev && hf < 1 && PART[hq.prev]) drawRot(ctx, hq.prev, a.Wp[0], a.Wp[1], a.a2, fl, hsc, px);
        ctx.globalAlpha = base0 * ((hq.prev && hf < 1) ? hf : 1); drawRot(ctx, hn, a.Wp[0], a.Wp[1], a.a2, fl, hsc, px); ctx.globalAlpha = base0; }
    }
    arms.forEach(function (a) { if (!a.front) drawArm(a); });
    function drawPelvis(name, alpha, mir) { ctx.save(); ctx.globalAlpha = base0 * alpha; ctx.translate(pelC[0], pelC[1]); ctx.rotate(pr); ctx.scale((mir ? -1 : 1) * rp * PK, 1); ctx.translate(-pelC[0], -pelC[1]); drawRot(ctx, name, pelC[0], pelC[1], 0, false, 1, px); ctx.restore(); }
    function pelvisBlock() {
    bH = clamp((wH - 0.36) / 0.04, 0, 1); if (bH < 1) drawPelvis('pelvis', 1, false); if (bH > 0) drawPelvis('pelvis34', bH, mirH);
    if (PART.skirt) {
      var dsp = legs[0].ik.d1 - legs[1].ik.d1, fl = 1 + 0.32 * Math.min(1.4, Math.abs(dsp)), swy = clamp((legs[0].ik.d1 + legs[1].ik.d1) * 0.4, -0.35, 0.35);
      var drawSk = function (name, alpha, mir) { var pt = PART[name]; ctx.save(); ctx.globalAlpha = base0 * alpha; ctx.translate(pelC[0], pelC[1]); ctx.rotate(pr + swy); ctx.scale((mir ? -1 : 1) * rp * PK * fl, 1); blit(ctx, pt, tier(pt, px), 0, 0, pt.w, pt.h, -pt.piv[0], CFG.skTop); ctx.restore(); };
      if (bH < 1 || !PART.skirt34) drawSk('skirt', 1, false); if (bH > 0 && PART.skirt34) drawSk('skirt34', bH, mirH);
    }
    }
    var bH;
    if (o.under) { pelvisBlock(); drawLegs(); } else { drawLegs(); pelvisBlock(); }
    if (PART.gacc) { legs.forEach(function (gl, gi) { if (gi) return; var pt = PART.gacc; ctx.save(); ctx.translate(pelC[0], pelC[1]); ctx.rotate(pr); ctx.translate((mirH ? -1 : 1) * 118, -20); ctx.scale(0.75, 0.75); blit(ctx, pt, tier(pt, px * 0.75), 0, 0, pt.w, pt.h, -pt.piv[0], -pt.piv[1]); ctx.restore(); }); }
    var SXC = []; for (i = 0; i < NS; i++) SXC.push((STRIP[i] + STRIP[i + 1]) / 2);
    function sxAt(y) { if (!CURVY) return 1; for (var q = 0; q < NS - 1; q++) { if (y <= SXC[q] && y >= SXC[q + 1]) { var f = (SXC[q] - y) / (SXC[q] - SXC[q + 1]); return SX[q] + (SX[q + 1] - SX[q]) * f; } } return y > SXC[0] ? SX[0] : SX[NS - 1]; }
    function drawStrips(name, alpha, mir) {
      var tp = PART[name], T2 = tier(tp, px), fy = tp.h / 466;
      for (i = 0; i < NS; i++) {
        var sy0 = STRIP[i + 1], sy1 = STRIP[i], top = Math.max(0, sy0 - (i === NS - 1 ? 0 : 10)), bot = Math.min(466, sy1), nb2 = CURVY ? Math.max(1, Math.round((bot - top) / 14)) : 1, kq;
        for (kq = 0; kq < nb2; kq++) {
          var t0 = top + (bot - top) * kq / nb2, t1 = top + (bot - top) * (kq + 1) / nb2, tt0 = kq ? t0 - 1 : t0;
          ctx.save(); ctx.globalAlpha = base0 * alpha; ctx.translate(nodes[i].p[0], nodes[i].p[1]); ctx.rotate(nodes[i].a); ctx.scale((mir ? -1 : 1) * cy * (CURVY ? sxAt((t0 + t1) / 2) : 1), sq);
          blit(ctx, tp, T2, 0, tt0 * fy, tp.w, (t1 - tt0) * fy, -tp.piv[0], tt0 - NODE[i]);
          ctx.restore();
        }
      }
    }
    var bT = clamp((wT - 0.36) / 0.04, 0, 1); if (bT < 1) drawStrips('torso', 1, false); if (bT > 0) drawStrips('torso34', bT, mirT);
    drawRot(ctx, 'neck', nb[0], nb[1], na, false, 1, px);
    if (PART.bacc) { var pt = PART.bacc; ctx.save(); ctx.translate(nodes[0].p[0], nodes[0].p[1] - 22); ctx.rotate(nodes[0].a); ctx.scale(0.8 * cy, 0.8); blit(ctx, pt, tier(pt, px * 0.8), 0, 0, pt.w, pt.h, -pt.piv[0], -pt.piv[1]); ctx.restore(); }
    if (PART.nacc) { var pn = PART.nacc; ctx.save(); ctx.translate(nb[0], nb[1] + CFG.nOff); ctx.rotate(na); ctx.scale(0.62 * cy, 0.62); blit(ctx, pn, tier(pn, px * 0.62), 0, 0, pn.w, pn.h, -pn.piv[0], -pn.piv[1]); ctx.restore(); }
    arms.forEach(function (a) { if (a.front) drawArm(a); });
    if (PART.scap) arms.forEach(function (a) { drawRot(ctx, 'scap', a.Sh[0] + (a.sd > 0 ? -2 : 2), a.Sh[1] - 30, clamp(a.a1 * 0.6, -0.5, 0.5) + torsoTop * 0.4, a.sd < 0, 1, px); });
    headFn(ctx, hc[0], hc[1], hrot, HEADR, px);
    hair(true);
    if (PART.hacc) { var ph = PART.hacc, kk = CFG.ak; ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(hrot); ctx.scale(kk, kk); blit(ctx, ph, tier(ph, px * kk), 0, 0, ph.w, ph.h, -ph.disc[0], -ph.disc[1]); ctx.restore(); }
  }
  function pose(name, t, o) {
    o = o || {}; var beat = o.beat || 0.5, c = CL[name] || CL.salsa, A = o.amp || 1;
    var u = ((t / beat + (o.ph || 0)) / c.cb) % 1; if (u < 0) u += 1;
    return sample(CL[name] ? name : 'salsa', u, name === 'idle' ? 0.3 : A);
  }
  CL.idle = null;
  return { load: load, mkPart: mkPart, use: use, CFG: CFG, figure: figure, pose: pose, CL: CL, DANCES: ['idle','hh1','hh2','hh3','hh4','hh5','hh6','bboy','twerk','snake'], LOOPB: function (n) { return (CL[n] || CL.salsa).cb; }, H: 1700, FEET: 810 };
})();
