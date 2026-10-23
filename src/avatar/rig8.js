/* paper-doll rig v6 (multi-view hands, shoes, 3/4 torso/pelvis): puppet driven by real motion-capture joints (CMU mocap, free to use), 3D->2D retarget with foreshortening, depth-sorted arms */
var RIG = (function () {
  var PART = {}, CFG = { armK: 0.86, hk: 1.09, ak: 1.16, skTop: -100, nOff: 18 }, MOC = null, D2R = Math.PI / 180, U = 1, NS = 5;
  var HIP = [104, 78], WAIST = [0, -110], SHO_Y = -255, SHO_X = 138, NECKB_Y = -318, GROUND = 740, HEADR = 116, HEADUP = 70, FOOTH = 128;
  var STRIP = [466, 306, 224, 142, 60, 0], NODE = [382, 306, 224, 142, 60];
  var JI = {}, CL = {};
  function load(mocap) {
    MOC = mocap; mocap.joints.forEach(function (j, i) { JI[j] = i; });
    Object.keys(mocap.clips).forEach(function (k) { prep(k, mocap.clips[k]); });
  }
  /* build a part: canvas (or Image) + def {piv,bone,ank,ball,disc} -> tiers (mip chain) */
  /* look pass, done once per part when an avatar is built (no cost while dancing): a little more contrast and colour so avatars pop on the dark floor,
     and a light sharpen on the shrunken copies the crowd actually displays (shrinking is what made them look soft) */
  function popImg(im) { try { var c = document.createElement('canvas'); c.width = im.width; c.height = im.height; var x = c.getContext('2d'); x.filter = 'contrast(1.08) saturate(1.16) brightness(1.05)'; x.drawImage(im, 0, 0); return c; } catch (e) { return im; } }
  function sharpen(c, amt) { try { var w = c.width, h = c.height; if (w < 3 || h < 3) return;
    /* work on a scratch copy kept in main memory, then paint the result back once, so the copy the overlay draws every frame stays on the graphics card */
    var t = document.createElement('canvas'); t.width = w; t.height = h; var tx = t.getContext('2d', { willReadFrequently: true }); tx.drawImage(c, 0, 0);
    var b = document.createElement('canvas'); b.width = w; b.height = h; var bx = b.getContext('2d', { willReadFrequently: true }); bx.filter = 'blur(0.8px)'; bx.drawImage(c, 0, 0);
    var A = tx.getImageData(0, 0, w, h), B = bx.getImageData(0, 0, w, h), a = A.data, bb = B.data, i, k, v; for (i = 0; i < a.length; i += 4) { if (a[i + 3] < 8) continue; for (k = 0; k < 3; k++) { v = a[i + k] + amt * (a[i + k] - bb[i + k]); a[i + k] = v < 0 ? 0 : v > 255 ? 255 : v; } } tx.putImageData(A, 0, 0);
    var x = c.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(t, 0, 0); } catch (e) { } }
  function mkPart(im, d, q) {
    im = popImg(im);
    q = q || 1; var w = im.width / q, h = im.height / q, tiers = [{ c: im, k: q }], prev = im, kk = q, i;
    for (i = 0; i < 4; i++) { kk /= 2; var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * kk)); c.height = Math.max(1, Math.round(h * kk)); var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(prev, 0, 0, c.width, c.height); tiers.push({ c: c, k: kk }); prev = c; }
    for (i = 1; i < tiers.length; i++) sharpen(tiers[i].c, 0.55);
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
    var p = PART[name], T = tier(p, px), pv = p.piv; if (name === 'hand_open') { pv = [p.w * 0.49, p.h - 3]; a += Math.PI; } ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale((flip ? -1 : 1) * (sx || 1), sy || 1); blit(ctx, p, T, 0, 0, p.w, p.h, -pv[0], -pv[1]); ctx.restore();
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
  /* ---- held drinks: vector sprites drawn in the hand, units match the rig (head radius = 116) ---- */
  function glassPath(c, pts) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); }
  var PROPK = 1.6, RIMS = { martini: 92, beer: 84, shot: 52, cocktail: 112, champagne: 128, wine: 96, starships: 120, cybertruck: 64, daq: 70, barbz: 64, phone: 110 };
  function drawProp(ctx, H, a, mouth) {
    var kind = H.kind, S0 = (H.s == null ? 1 : H.s); if (S0 <= 0.01) return;
    var gl = 30, gx = a.Wp[0] - Math.sin(a.a2) * gl, gy = a.Wp[1] + Math.cos(a.a2) * gl, lv = H.lvl == null ? 1 : H.lvl;
    var tl = H.tilt || 0;
    if (H.to !== 'up' && H.aim > 0) { /* tip the glass so its rim meets the mouth */
      var R = (RIMS[kind] || 100) * PROPK, sgn = a.sd > 0 ? -1 : 1; sgn = (gx >= mouth[0]) ? 1 : -1;
      var th = Math.asin(clamp((mouth[0] - gx) / R, -0.95, 0.95)); tl = th * H.aim - sgn * (H.over || 0) * H.aim;
    }
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(tl); ctx.scale(S0 * PROPK, S0 * PROPK); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var OUT = 'rgba(255,255,255,.92)', GLASS = 'rgba(235,245,255,.22)', c = ctx, y;
    function liquid(clipFn, top, bot, c1, c2) { c.save(); clipFn(); c.clip(); var yy = bot - (bot - top) * lv; var g = c.createLinearGradient(0, yy, 0, bot); g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.fillRect(-80, yy, 160, bot - yy + 2); c.restore(); }
    if (kind === 'martini') {
      var bowl = function () { glassPath(c, [[-50, -92], [50, -92], [0, -24]]); };
      c.strokeStyle = OUT; c.lineWidth = 7; c.beginPath(); c.moveTo(0, -24); c.lineTo(0, 34); c.stroke(); c.beginPath(); c.moveTo(-30, 36); c.lineTo(30, 36); c.stroke();
      bowl(); c.fillStyle = GLASS; c.fill(); liquid(bowl, -92, -24, '#ff8cc6', '#ff3f9f');
      bowl(); c.lineWidth = 7; c.stroke();
      if (lv > 0.3) { c.strokeStyle = '#d9c36a'; c.lineWidth = 4; c.beginPath(); c.moveTo(34, -112); c.lineTo(-14, -56); c.stroke(); c.fillStyle = '#7ccf3c'; c.beginPath(); c.arc(-12, -58, 10, 0, 7); c.fill(); c.fillStyle = '#e0452f'; c.beginPath(); c.arc(-10, -60, 3.5, 0, 7); c.fill(); }
    } else if (kind === 'beer') {
      var mug = function () { glassPath(c, [[-36, -84], [32, -84], [28, 34], [-32, 34]]); };
      c.strokeStyle = OUT; c.lineWidth = 7; c.beginPath(); c.moveTo(32, -58); c.bezierCurveTo(72, -62, 72, 8, 30, 10); c.stroke();
      mug(); c.fillStyle = GLASS; c.fill(); liquid(mug, -84, 34, '#ffd24a', '#e88a00');
      mug(); c.lineWidth = 7; c.stroke();
      if (lv > 0.15) { c.fillStyle = '#fff8e6'; var fy = -84 - 12; c.beginPath(); c.arc(-24, fy + 8, 14, 0, 7); c.arc(-4, fy, 17, 0, 7); c.arc(18, fy + 6, 15, 0, 7); c.arc(30, fy + 14, 9, 0, 7); c.fill(); c.fillRect(-36, -90, 68, 14); }
    } else if (kind === 'shot') {
      var sh = function () { glassPath(c, [[-26, -52], [26, -52], [20, 30], [-20, 30]]); };
      sh(); c.fillStyle = GLASS; c.fill(); liquid(sh, -52, 30, '#ffd36b', '#ff9a1f'); sh(); c.strokeStyle = OUT; c.lineWidth = 7; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-22, 20, 44, 8);
      if (lv > 0.3) { c.fillStyle = '#8ed13a'; c.beginPath(); c.moveTo(14, -60); c.lineTo(34, -48); c.lineTo(10, -46); c.closePath(); c.fill(); }
    } else if (kind === 'cocktail') {
      var hb = function () { glassPath(c, [[-34, -112], [34, -112], [26, 34], [-26, 34]]); };
      c.strokeStyle = '#ff4f6a'; c.lineWidth = 7; c.beginPath(); c.moveTo(12, -40); c.lineTo(38, -150); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.setLineDash([9, 9]); c.beginPath(); c.moveTo(12, -40); c.lineTo(38, -150); c.stroke(); c.setLineDash([]);
      hb(); c.fillStyle = GLASS; c.fill(); liquid(hb, -112, 34, '#ffb347', '#ff3f9f');
      c.fillStyle = 'rgba(255,255,255,.55)'; [[-12, -50, 14], [8, -20, 13], [-8, 4, 12]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(0.4); c.fillRect(-q[2] / 2, -q[2] / 2, q[2], q[2]); c.restore(); });
      hb(); c.strokeStyle = OUT; c.lineWidth = 7; c.stroke();
      c.fillStyle = '#ff9a1f'; c.beginPath(); c.arc(-34, -112, 20, 0, 7); c.fill(); c.strokeStyle = '#fff3c4'; c.lineWidth = 4; c.beginPath(); c.arc(-34, -112, 14, 0, 7); c.stroke();
      c.fillStyle = '#d6203a'; c.beginPath(); c.arc(26, -118, 9, 0, 7); c.fill();
    } else if (kind === 'champagne') {
      var fl = function () { c.beginPath(); c.moveTo(-19, -128); c.lineTo(19, -128); c.bezierCurveTo(22, -84, 12, -46, 3, -22); c.lineTo(-3, -22); c.bezierCurveTo(-12, -46, -22, -84, -19, -128); c.closePath(); };
      c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -22); c.lineTo(0, 34); c.stroke(); c.beginPath(); c.moveTo(-24, 36); c.lineTo(24, 36); c.stroke();
      fl(); c.fillStyle = GLASS; c.fill(); liquid(fl, -128, -22, '#fff0a8', '#f2c14e'); c.fillStyle = 'rgba(255,255,255,.85)';
      [[-5, -52, 3], [5, -78, 3.5], [-3, -98, 3], [6, -112, 3]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, 7); c.fill(); });
      fl(); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke();
    } else if (kind === 'phone') { /* phone held up to record: lit screen, red REC dot, the odd camera flash */
      var rr = function (x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); };
      rr(-34, -130, 68, 120, 12); c.fillStyle = '#121218'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.stroke();
      var sg2 = c.createLinearGradient(0, -122, 0, -18); sg2.addColorStop(0, '#ffd6f0'); sg2.addColorStop(1, '#ff6cc0'); c.fillStyle = sg2; rr(-27, -122, 54, 104, 7); c.fill();
      c.fillStyle = '#ff2a3d'; c.beginPath(); c.arc(-14, -110, 6, 0, 7); c.fill();
      if (H.flash) { var fg = c.createRadialGradient(0, -140, 2, 0, -140, 90); fg.addColorStop(0, 'rgba(255,255,255,1)'); fg.addColorStop(.3, 'rgba(255,255,255,.55)'); fg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = fg; c.beginPath(); c.arc(0, -140, 90, 0, 7); c.fill(); }
    } else if (kind === 'starships') { /* Starships Punch: hurricane glass, sunset rum punch, pineapple + cherry */
      var hu = function () { c.beginPath(); c.moveTo(-30, -122); c.lineTo(30, -122); c.bezierCurveTo(40, -86, 14, -66, 18, -40); c.bezierCurveTo(22, -14, 30, 6, 10, 18); c.lineTo(-10, 18); c.bezierCurveTo(-30, 6, -22, -14, -18, -40); c.bezierCurveTo(-14, -66, -40, -86, -30, -122); c.closePath(); };
      c.strokeStyle = '#ff4fa0'; c.lineWidth = 6; c.beginPath(); c.moveTo(8, -60); c.lineTo(30, -158); c.stroke();
      c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, 34); c.stroke(); c.beginPath(); c.moveTo(-24, 36); c.lineTo(24, 36); c.stroke();
      hu(); c.fillStyle = GLASS; c.fill(); liquid(hu, -122, 18, '#ffc247', '#ff3f6f'); hu(); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke();
      if (lv > 0.3) { c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(-40, -118); c.lineTo(-6, -136); c.lineTo(-14, -108); c.closePath(); c.fill(); c.fillStyle = '#5fbf3a'; c.beginPath(); c.moveTo(-30, -130); c.lineTo(-34, -152); c.lineTo(-22, -134); c.closePath(); c.fill(); c.fillStyle = '#d6203a'; c.beginPath(); c.arc(22, -128, 9, 0, 7); c.fill(); c.strokeStyle = '#3c7a1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(22, -136); c.lineTo(30, -150); c.stroke(); }
    } else if (kind === 'cybertruck' || kind === 'barbz') { /* rocks glass: Cybertruck Smash (purple, blackberries, lime) or Barbz on the Rocks (watermelon pink, ice, wedge) */
      var cy = kind === 'cybertruck', rk = function () { glassPath(c, [[-40, -64], [40, -64], [34, 34], [-34, 34]]); };
      c.strokeStyle = cy ? '#1a1a1a' : '#ff6fae'; c.lineWidth = 6; c.beginPath(); c.moveTo(10, -20); c.lineTo(34, -112); c.stroke();
      rk(); c.fillStyle = GLASS; c.fill(); liquid(rk, -64, 34, cy ? '#cfa6ff' : '#ffb0bf', cy ? '#7a2bd6' : '#ff4f6a');
      c.fillStyle = 'rgba(255,255,255,.55)'; [[-16, -30, 18], [10, -8, 17], [-10, 14, 15]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(0.35); c.fillRect(-q[2] / 2, -q[2] / 2, q[2], q[2]); c.restore(); });
      if (cy && lv > 0.25) { c.fillStyle = '#2b1240'; [[-14, -50, 8], [-2, -56, 8], [-24, -58, 7]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, 7); c.fill(); }); }
      rk(); c.strokeStyle = OUT; c.lineWidth = 7; c.stroke();
      if (lv > 0.3) { if (cy) { c.fillStyle = '#9be15d'; c.beginPath(); c.arc(-34, -64, 19, 0, 7); c.fill(); c.strokeStyle = '#e9ffc9'; c.lineWidth = 3; c.beginPath(); c.arc(-34, -64, 13, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-47, -64); c.lineTo(-21, -64); c.moveTo(-34, -77); c.lineTo(-34, -51); c.stroke(); }
        else { c.save(); c.translate(-30, -66); c.rotate(-0.5); c.fillStyle = '#2f8f3a'; c.beginPath(); c.arc(0, 0, 26, Math.PI, 0); c.fill(); c.fillStyle = '#ff4f6a'; c.beginPath(); c.arc(0, 0, 21, Math.PI, 0); c.fill(); c.fillStyle = '#2a1010'; [[-10, -8], [0, -12], [10, -8]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 2.5, 0, 7); c.fill(); }); c.restore(); } }
    } else if (kind === 'daq') { /* Nicki's Strawberry Daq': frozen coupe, strawberry on the rim */
      var cp = function () { c.beginPath(); c.moveTo(-60, -84); c.lineTo(60, -84); c.bezierCurveTo(56, -40, 26, -28, 0, -28); c.bezierCurveTo(-26, -28, -56, -40, -60, -84); c.closePath(); };
      c.strokeStyle = '#ff4fa0'; c.lineWidth = 6; c.beginPath(); c.moveTo(12, -60); c.lineTo(34, -140); c.stroke();
      c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -28); c.lineTo(0, 34); c.stroke(); c.beginPath(); c.moveTo(-28, 36); c.lineTo(28, 36); c.stroke();
      cp(); c.fillStyle = GLASS; c.fill(); liquid(cp, -84, -28, '#ff8a96', '#e8243f');
      if (lv > 0.2) { c.fillStyle = '#ff8a96'; c.beginPath(); c.arc(-30, -84, 16, Math.PI, 0); c.arc(0, -86, 20, Math.PI, 0); c.arc(30, -84, 16, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; [[-20, -70], [8, -76], [26, -62], [-6, -52]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 3, 0, 7); c.fill(); }); }
      cp(); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke();
      if (lv > 0.3) { c.fillStyle = '#e8243f'; c.beginPath(); c.moveTo(-58, -86); c.bezierCurveTo(-78, -104, -62, -122, -48, -112); c.bezierCurveTo(-34, -122, -24, -100, -40, -82); c.closePath(); c.fill(); c.fillStyle = '#4caf3a'; c.beginPath(); c.moveTo(-58, -112); c.lineTo(-50, -126); c.lineTo(-42, -112); c.closePath(); c.fill(); c.fillStyle = '#ffe08a'; [[-56, -100], [-48, -94], [-52, -106]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.8, 0, 7); c.fill(); }); }
    } else if (kind === 'wine') {
      var bw = function () { c.beginPath(); c.moveTo(-36, -96); c.bezierCurveTo(-44, -30, -22, -14, 0, -14); c.bezierCurveTo(22, -14, 44, -30, 36, -96); c.closePath(); };
      c.strokeStyle = OUT; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, 34); c.stroke(); c.beginPath(); c.moveTo(-28, 36); c.lineTo(28, 36); c.stroke();
      bw(); c.fillStyle = GLASS; c.fill(); liquid(bw, -96, -14, '#b3264f', '#6e0f2e'); bw(); c.strokeStyle = OUT; c.lineWidth = 7; c.stroke();
    }
    ctx.restore();
  }
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
      var HO = o.hold, ho = !!(HO && HO.hand === ak);
      if (ho && HO.arm > 0.002) {
        /* two-bone IK: bring the hand to the mouth (sip) or up beside the head (cheers) */
        var L1 = ua.len * CFG.armK, L2 = fm.len * CFG.armK, sg = Sh[0] >= hc[0] ? 1 : -1;
        var RIM = (RIMS[HO.kind] || 100) * PROPK;
        var T = HO.to === 'phone' ? [Sh[0] + sg * HEADR * 0.7, hc[1] - HEADR * 0.6] : HO.to === 'up' ? [Sh[0] + sg * HEADR * 0.95, hc[1] - HEADR * 0.35] : [hc[0] + sg * HEADR * 0.9, hc[1] + HEADR * 0.5 + 30 + 0.55 * RIM];
        var dx = T[0] - Sh[0], dy = T[1] - Sh[1], D = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 4, L1 + L2 - 2), ph = Math.atan2(dy, dx);
        var cA = clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1), A = Math.acos(cA);
        var e1 = [Sh[0] + L1 * Math.cos(ph + A), Sh[1] + L1 * Math.sin(ph + A)], e2 = [Sh[0] + L1 * Math.cos(ph - A), Sh[1] + L1 * Math.sin(ph - A)];
        var E = e1[1] > e2[1] ? e1 : e2, W2 = [Sh[0] + D * Math.cos(ph), Sh[1] + D * Math.sin(ph)];
        var ia1 = Math.atan2(-(E[0] - Sh[0]), E[1] - Sh[1]), ia2 = Math.atan2(-(W2[0] - E[0]), W2[1] - E[1]), w = clamp(HO.arm, 0, 1);
        var la = function (x, y, t) { var d = ((y - x + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return x + d * t; };
        a1 = la(a1, ia1, w); a2 = la(a2, ia2, w); f1 += (1 - f1) * w; f2 += (1 - f2) * w;
      }
      var AK = CFG.armK, Ep = rot([0, ua.len * f1 * AK], a1); Ep = [Sh[0] + Ep[0], Sh[1] + Ep[1]];
      var Wp = rot([0, fm.len * f2 * AK], a2); Wp = [Ep[0] + Wp[0], Ep[1] + Wp[1]];
      var z2 = ((E0[2] + W0[2]) / 2) - SP1[2], dz = W0[2] - E0[2], rise = W0[1] - A0[1];
      var towards = ST['tw' + ak] ? dz > -0.03 : dz > 0.03; ST['tw' + ak] = towards;
      var fullF = towards && (ST['ff' + ak] ? f2 < 0.5 : f2 < 0.38); ST['ff' + ak] = fullF;
      var curlF = towards && (ST['cf' + ak] ? f2 < 0.86 : f2 < 0.76); ST['cf' + ak] = curlF;
      var openH = ST['oh' + ak] ? rise > 0.06 : rise > 0.14; ST['oh' + ak] = openH;
      var frontF = ST['fr' + ak] ? z2 > 0.06 : z2 > 0.16; ST['fr' + ak] = frontF;
      return { ak: ak, hand: (openH && !ho) ? 'hand_open' : 'hand_relax', sd: sd, Sh: Sh, Ep: Ep, Wp: Wp, a1: a1, a2: a2, f1: f1, f2: f2, front: frontF, fist: ho ? false : fullF, curl: ho ? true : curlF, hold: ho };
    });
    function bH0() { return clamp((wH - 0.36) / 0.04, 0, 1); }
    if (o.dbg) o.dbg.push({ hc: hc.slice(), arms: arms.map(function (q) { return { h: q.fist ? 'ffarm' : (q.curl ? 'fist' : q.hand), fr: q.front, Wp: q.Wp.slice(), Ep: q.Ep.slice() }; }), foot: legs.map(function (gl) { return gl.view; }), bH: bH0(), wT: wT });
    function drawArm(a) {
      var fl = a.sd < 0;
      drawRot(ctx, 'uarm', a.Sh[0], a.Sh[1], a.a1, fl, a.f1 * CFG.armK, px, 0.97);
      if (a.fist) drawRot(ctx, 'ffarm', a.Ep[0], a.Ep[1], a.a2, fl, clamp(a.f2 * 1.15, 0.5, 0.85) * CFG.armK, px);
      else { drawRot(ctx, 'farm', a.Ep[0], a.Ep[1], a.a2, fl, a.f2 * CFG.armK, px, 0.97);
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
    if (o.hold) arms.forEach(function (a) { if (a.hold) drawProp(ctx, o.hold, a, [hc[0], hc[1] + HEADR * 0.5]); });
    if (PART.hacc) { var ph = PART.hacc, kk = CFG.ak; ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(hrot); ctx.scale(kk, kk); blit(ctx, ph, tier(ph, px * kk), 0, 0, ph.w, ph.h, -ph.disc[0], -ph.disc[1]); ctx.restore(); }
  }
  function pose(name, t, o) {
    o = o || {}; var beat = o.beat || 0.5, c = CL[name] || CL.salsa, A = o.amp || 1;
    var u = ((t / beat + (o.ph || 0)) / c.cb) % 1; if (u < 0) u += 1;
    return sample(CL[name] ? name : 'salsa', u, name === 'idle' ? 0.3 : A);
  }
  /* ---- procedural walk: any phase, any facing; same pose format as sample() so figure() draws it unchanged ---- */
  var WK = { L1: 0.5075, L2: 0.530, TOE: 0.145, HW: 0.216, UA: 0.367, FA: 0.361, ANK: 0.105 };
  function wrapA(a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; }
  function walkPose(ph, yaw, k) {
    k = k == null ? 1 : k; var a = ph * 2 * Math.PI, J = new Float32Array(57), sy = Math.sin(yaw), cyw = Math.cos(yaw);
    function leg(phi) {
      var th = 0.46 * k * Math.sin(phi + 0.3) + 0.04;
      var d1 = wrapA(phi + 0.25), d2 = wrapA(phi - 1.9);
      var kn = 0.09 + 0.8 * k * Math.exp(-d1 * d1 / (2 * 0.6 * 0.6)) + 0.2 * k * Math.exp(-d2 * d2 / (2 * 0.4 * 0.4));
      var ko = th - kn, kf = WK.L1 * Math.sin(th), ky = -WK.L1 * Math.cos(th), af = kf + WK.L2 * Math.sin(ko), ay = ky - WK.L2 * Math.cos(ko);
      var hs = Math.max(0, Math.cos(phi - 1.27)), to = Math.max(0, Math.cos(phi - 4.41 - 0.25)), pitch = 0.62 - 0.4 * hs * hs + 0.45 * to * to;
      return { kf: kf, ky: ky, af: af, ay: ay, tf: af + WK.TOE * Math.cos(pitch), ty: ay - WK.TOE * Math.sin(pitch) };
    }
    var L = leg(a), R = leg(a + Math.PI), drop = Math.max(-L.ay, -R.ay), cy = drop + WK.ANK;
    var pyaw = -0.1 * k * Math.sin(a + 0.3), syaw = 0.15 * k * Math.sin(a + 0.3), lean = 0.07, bob = 0;
    function put(i, x, y, z) { /* x lateral, y up, z forward -> yaw about the hip centre */ J[i * 3] = x * cyw + z * sy; J[i * 3 + 1] = y; J[i * 3 + 2] = -x * sy + z * cyw; }
    function rotx(x, z, t) { return [x * Math.cos(t) + z * Math.sin(t), -x * Math.sin(t) + z * Math.cos(t)]; }
    var hw = WK.HW / 2, hl = rotx(hw, 0, pyaw), hr = rotx(-hw, 0, pyaw);
    put(0, 0, cy + 0.13, 0);
    put(1, hl[0], cy, hl[1]); put(2, hl[0] + 0, cy + L.ky, hl[1] + L.kf); put(3, hl[0], cy + L.ay, hl[1] + L.af); put(4, hl[0], cy + L.ty, hl[1] + L.tf);
    put(5, hr[0], cy, hr[1]); put(6, hr[0], cy + R.ky, hr[1] + R.kf); put(7, hr[0], cy + R.ay, hr[1] + R.af); put(8, hr[0], cy + R.ty, hr[1] + R.tf);
    function up(h) { return [h * Math.sin(lean), cy + h * Math.cos(lean)]; }
    var sp = up(0.289), s1 = up(0.445), hd = up(0.70), sh = up(0.53), sl = rotx(0.235, 0, syaw), sr = rotx(-0.235, 0, syaw);
    put(9, 0, sp[1], sp[0]); put(10, 0, s1[1], s1[0]); put(11, 0, s1[1], s1[0]); put(12, 0, hd[1], hd[0]);
    function arm(base, ang, out, i0) {
      var f1 = ang, f2 = ang + 0.16 + 0.4 * Math.max(0, ang / 0.32) * k;
      var ef = base[1] + WK.UA * Math.sin(f1), ey = sh[1] - WK.UA * Math.cos(f1), wf = ef + WK.FA * Math.sin(f2), wy = ey - WK.FA * Math.cos(f2);
      put(i0, base[0], sh[1], base[1] + sh[0]); put(i0 + 1, base[0] + out * 0.02, ey, ef + sh[0]); put(i0 + 2, base[0] + out * 0.03, wy, wf + sh[0]);
    }
    arm(sl, -0.32 * k * Math.sin(a + 0.3), 1, 13); arm(sr, 0.32 * k * Math.sin(a + 0.3), -1, 16);
    return { j: J, aRest: WK.ANK };
  }
  function mixPose(A, B, w) {
    if (w <= 0) return A; if (w >= 1) return B;
    var n = A.j.length, o = new Float32Array(n), i; for (i = 0; i < n; i++) o[i] = A.j[i] + (B.j[i] - A.j[i]) * w;
    return { j: o, aRest: A.aRest + (B.aRest - A.aRest) * w };
  }
  CL.idle = null;
  return { load: load, mkPart: mkPart, use: use, CFG: CFG, figure: figure, pose: pose, walkPose: walkPose, mixPose: mixPose, CL: CL, DANCES: ['idle','hh1','hh2','hh3','hh4','hh5','hh6','bboy','twerk','snake'], LOOPB: function (n) { return (CL[n] || CL.salsa).cb; }, H: 1700, FEET: 810 };
})();
