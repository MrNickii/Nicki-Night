
  /* ================= Virtual Nicki Night overlay ================= */
  var W = 1920, H = 1080;
  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id || (arr[i].alias && arr[i].alias.indexOf(id) >= 0)) return arr[i]; return null; }
  var Q = new URLSearchParams(location.search);
  var KEY = 'vnn-overlay-v1', KEYBG = 'vnn-overlay-bg';
  var DEFROOM = {
    stage: { x: 960, y: 770 },
    zones: { screen: [540, 34, 663, 347], dj: [235, 25, 170, 225], host: [1625, 70, 190, 190], cmd: [0, 1030, 1920, 50], door: [1760, 770, 100, 60] },
    persp: { yh: 276, k: 0.39 },
    scale: 0.85,
    rows: [{ y: 600, x0: 560, x1: 1330 }, { y: 700, x0: 420, x1: 1380 }, { y: 810, x0: 280, x1: 1500 }, { y: 920, x0: 240, x1: 1480 }, { y: 1020, x0: 80, x1: 1840 }],
    bars: [
      { edge: [[400, 540], [330, 632], [134, 752], [40, 800]], out: [0.62, 0.78], rows: 2 },
      { edge: [[1445, 640], [1554, 731], [1627, 787], [1688, 804]], out: [-0.56, 0.83], rows: 2 }
    ],
    vip: { d: 68, rows: [345, 405, 465, 525], xmin: 1250, xmax: 1880, pitch: 82, edge: { x0: 1171, y0: 327, slope: 0.387 } },
    nicki: { x: 1357, y: 236, d: 78 },
    path: [[1800, 835], [1620, 885], [1420, 720], [1225, 552], [1340, 408], [1395, 330], [1362, 262], [1357, 236]],
    sparkle: [300, 450, 1400, 560]
  };
  var ART = '__ART__';

  /* ---------- saved state ---------- */
  var S = { session: '__SESSION__', ws: '', vip: [], mods: ['kildadj_', 'mrnicki'], room: null, need: { d: 5, c: 20 }, maxOn: 400, top5: false, np: { a: '', t: '' }, npUrl: '', nickiDone: false, users: {}, light: null, bg: true };
  try { var raw = localStorage.getItem(KEY); if (raw) { var sv = JSON.parse(raw); Object.keys(sv).forEach(function (k) { S[k] = sv[k]; }); } } catch (e) {}
  if (Q.get('session')) S.session = Q.get('session');
  if (Q.get('ws')) S.ws = Q.get('ws');
  var R = clone(DEFROOM);
  S.maxOn = Math.max(Number(S.maxOn) || 0, 400);
  if (S.room) Object.keys(S.room).forEach(function (k) { R[k] = S.room[k]; });
  var saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try {
        var us = {};
        Object.keys(users).forEach(function (k) { var u = users[k]; us[k] = { name: u.name, plat: u.plat, photo: u.photo, look: u.look, dance: u.dance, dances: u.dances, chats: u.chats, show: u.show, inside: u.inside, atBar: u.atBar, nickiLook: u.nickiLook, grant: !!u.grant }; });
        S.users = us; S.room = R;
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {}
    }, 600);
  }

  /* ---------- stage scale ---------- */
  var stage = $('stage'), preview = !(window.obsstudio);
  if (Q.get('preview') === '0') preview = false;
  if (preview) document.body.classList.add('preview');
  function fit() { var s = Math.min(innerWidth / W, innerHeight / H); if (!preview) s = innerWidth / W; stage.style.transform = 'scale(' + s + ')'; }
  addEventListener('resize', fit); fit();

  function applyHole() {
    var on = Q.get('hole') === '1' || (Q.get('hole') !== '0' && !!S.hole), z = (R.zones && R.zones.screen) || [540, 34, 663, 347], st = $('stage');
    st.classList.toggle('hole', on);
    st.style.setProperty('--hx', z[0] + 'px'); st.style.setProperty('--hy', z[1] + 'px'); st.style.setProperty('--hw', z[2] + 'px'); st.style.setProperty('--hh', z[3] + 'px');
    var ck = $('holeck'); if (ck) ck.checked = on;
  }
  function setBg() {
    var img = null;
    try { img = localStorage.getItem(KEYBG); } catch (e) {}
    $('art').style.backgroundImage = S.bg ? 'url("' + (img || ART) + '")' : 'none';
  }

  /* ---------- zones, slots ---------- */
  function rect(id) {
    if (id === 'floor') { var ys = R.rows.map(function (q) { return q.y; }); return { x: 0, y: Math.min.apply(null, ys) - 160, w: W, h: Math.max.apply(null, ys) - Math.min.apply(null, ys) + 160 }; }
    var r = R.zones[id]; return { x: r[0], y: r[1], w: r[2], h: r[3] };
  }
  /* avatar size follows the room's perspective: bigger toward the camera */
  function avW(y) { return Math.max(40, R.persp.k * (y - R.persp.yh) * R.scale / 2); }
  function segDist(px, py, a, b) {
    var vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / L2)), cx = a[0] + t * vx, cy = a[1] + t * vy;
    return { d: Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)), cx: cx, cy: cy, vx: vx, vy: vy, L: Math.sqrt(L2) };
  }
  var SL = { floor: [], bar: [], vip: [], stage: [], nicki: null }, CROWDK = 1, K_STEPS = [1, 0.92, 0.85, 0.78, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4];
  function stageBox(k) { var d = Math.max(30, avW(R.stage.y) * 1.2 * Math.max(k, 0.8)); return { d: d, x0: R.stage.x - d * 3.5, x1: R.stage.x + d * 3.5, y0: R.stage.y - d * 2.2, y1: R.stage.y + d * 1.35 }; }
  function makeSlots(k) {
    var out = { floor: [], bar: [], vip: [], stage: [], nicki: null }, i;
    /* floor rows: base rows, plus in-between and back rows as the crowd shrinks */
    var rs = R.rows.map(function (q) { return { y: q.y, x0: q.x0, x1: q.x1 }; }), rows = [];
    rs.forEach(function (q, j) { rows.push(q); if (k < 0.8 && j < rs.length - 1) { var n = rs[j + 1]; rows.push({ y: (q.y + n.y) / 2, x0: (q.x0 + n.x0) / 2, x1: (q.x1 + n.x1) / 2 }); } });
    if (k < 0.65) { var f = rs[0]; rows.push({ y: f.y - 50, x0: f.x0 + 70, x1: f.x1 - 70 }); }
    if (k < 0.5) { var f2 = rs[0]; rows.push({ y: f2.y - 95, x0: f2.x0 + 130, x1: f2.x1 - 130 }); }
    rows.sort(function (a, b) { return a.y - b.y; });
    var sb = S.top5 ? stageBox(k) : null;
    rows.forEach(function (q, r) {
      var d = Math.max(26, avW(q.y) * k), n = Math.max(1, Math.floor((q.x1 - q.x0) / (d * 1.15))), i2;
      for (i2 = 0; i2 < n; i2++) {
        var x = q.x0 + (i2 + 0.5) * (q.x1 - q.x0) / n;
        if (sb && x > sb.x0 && x < sb.x1 && q.y > sb.y0 && q.y < sb.y1) continue;
        out.floor.push({ x: x, y: q.y, d: d, r: r, z: 'floor', occ: null });
      }
    });
    if (S.top5) {
      var sd = sb.d, ord = [0, -1, 1, -2, 2];
      ord.forEach(function (o, rk) { out.stage.push({ x: R.stage.x + o * sd * 1.3, y: R.stage.y + Math.abs(o) * 0, d: sd, z: 'stage', rank: rk, occ: null }); });
    }
    R.bars.forEach(function (bar, bi) {
      var pts = bar.edge, total = 0, lens = [];
      for (i = 0; i < pts.length - 1; i++) { var l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); lens.push(l); total += l; }
      var rowsN = bar.rows || 2, rr;
      for (rr = 0; rr < rowsN; rr++) {
        var pos = 0;
        while (pos <= total) {
          var at = pos, si = 0; while (si < lens.length - 1 && at > lens[si]) { at -= lens[si]; si++; }
          var a = pts[si], b = pts[si + 1], f = Math.min(1, at / lens[si]), px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f, d = Math.max(26, avW(py + 80) * k), off = d * 0.6 + rr * d * 1.0;
          out.bar.push({ x: px + bar.out[0] * off, y: py + bar.out[1] * off, d: d, r: rr, z: 'bar', occ: null, bi: bi });
          pos += d * 1.12;
        }
      }
    });
    var v = R.vip, vk = Math.max(k, 0.55), vd = Math.max(30, v.d * vk), vp = v.pitch * vk, vrows = v.rows.slice();
    if (k < 0.8) { var ex = []; for (i = 0; i < vrows.length - 1; i++) ex.push((vrows[i] + vrows[i + 1]) / 2); vrows = vrows.concat(ex).sort(function (a, b) { return a - b; }); }
    var ed = function (x) { return x <= 1722 ? v.edge.y0 + v.edge.slope * (x - v.edge.x0) : v.edge.y0 + v.edge.slope * (1722 - v.edge.x0) + 0.1 * (x - 1722); };
    vrows.forEach(function (y, r) {
      for (var x = v.xmin; x <= v.xmax; x += vp) {
        if (y > ed(x) - 10) continue;
        var clear = true; for (var q = 3; q < R.path.length - 1; q++) if (segDist(x, y, R.path[q], R.path[q + 1]).d < 70) clear = false;
        if (clear) out.vip.push({ x: x, y: y, d: vd, r: r, z: 'vip', occ: null });
      }
    });
    out.nicki = { x: R.nicki.x, y: R.nicki.y, d: R.nicki.d, z: 'vip', occ: null, reserved: true };
    return out;
  }
  function buildSlots() { SL = makeSlots(CROWDK); }
  function nickiSpot() { return SL.nicki; }
  function pickSlot(zone, nicki) {
    var best = null, cx = 960;
    SL[zone].forEach(function (s) {
      if (s.occ) return;
      if (!best) { best = s; return; }
      if (zone === 'floor') { if (s.r > best.r || (s.r === best.r && Math.abs(s.x - cx) < Math.abs(best.x - cx))) best = s; }
      else if (zone === 'vip') { var tx = R.nicki.x, ty = R.nicki.y; if (Math.hypot(s.x - tx, s.y - ty) < Math.hypot(best.x - tx, best.y - ty)) best = s; }
      else { /* bar: fill in order along the counter, row by row */ if (s.r < best.r) best = s; }
    });
    return best;
  }

  /* ---------- users ---------- */
  var users = {}, order = [];
  var FREE_TOPS = CATALOG.looks.filter(function (l) { return l.unlock === 'free' && !l.sig && !l.dress; });
  var NICKI_LOOKS = CATALOG.looks.filter(function (l) { return l.unlock === 'nicki'; });
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function norm(s) { return String(s || '').toLowerCase().replace(/^@/, '').replace(/\s+/g, '').trim(); }
  function blankLook() { return { body: null, top: null, topColor: null, bottom: null, bottomColor: null, shoes: null, shoesColor: null, height: null, hair: null, hairColor: null, skin: null, acc: [], accColor: null }; }
  function newUser(key, name, plat, photo) {
    var h = hash(key), u = users[key];
    if (!u) {
      var sv = S.users && S.users[key];
      u = users[key] = { key: key, name: name, plat: plat, photo: photo || null, look: blankLook(), dance: DANCES[h % 6], dances: 0, chats: 0, show: 0, inside: false, atBar: false, lastActive: 0, slot: null, el: null, ox: 0, h: 0, d: 0, nickiLook: null, vip: false, overflow: false, h32: h };
      if (sv) { u.look = Object.assign(blankLook(), sv.look); u.dance = normD(sv.dance) || u.dance; u.dances = sv.dances || 0; u.chats = sv.chats || 0; u.show = sv.show || 0; u.nickiLook = sv.nickiLook || null; u.grant = !!sv.grant; u.atBar = !!sv.atBar; u._wasInside = !!sv.inside; }
    }
    if (name) u.name = name;
    if (photo) u.photo = photo;
    return u;
  }
  function isEarned(u) { return !!u.grant || (u.dances >= S.need.d && u.chats >= S.need.c); }
  function vipSet() { var o = {}; S.vip.forEach(function (h) { o[norm(h)] = 1; }); return o; }
  function refreshVip(u) { u.vip = (u.plat === 'x' && !!vipSet()[u.hnd || norm(u.name)]) || !!u.simVip; }
  function isNicki(u) { return u.plat === 'x' && u.hnd === 'nickiminaj'; }


  /* ---------- layered avatar engine ---------- */
  var AB = (Q.get('assets') || S.assets || 'vnn/').replace(/\/?$/, '/'), ENGINE = false, ENGERR = '';
  var CLRS = CATALOG.colors.clothing.filter(function (c) { return !c.hidden; }).map(function (c) { return c.id; });
  var HAIRS = CATALOG.hair.styles.map(function (x) { return x.id; }), HCOL = CATALOG.hair.colors.filter(function (c) { return !c.hidden; }).map(function (c) { return c.id; });
  var SKINS = CATALOG.skin.map(function (x) { return x.id; }), FREE_B = CATALOG.bottoms.filter(function (b) { return b.unlock === 'free'; });
  function normD(d) { if (typeof d === 'number') return DANCES[(d - 1) % 6] || null; if (!d) return null; return byId(CATALOG.dances, d) ? byId(CATALOG.dances, d).id : (CATALOG.danceAlias[d] || null); }
  function lookFor(u) {
    var h = u.h32 >>> 0;
    if (isNicki(u)) { var nl = byId(NICKI_LOOKS, u.nickiLook) || NICKI_LOOKS[h % NICKI_LOOKS.length]; return { top: nl.id, skin: u.look.skin || 'caramel' }; }
    var c = u.look, tp = byId(CATALOG.looks, c.top);
    if (!tp || tp.unlock === 'nicki') tp = FREE_TOPS[h % FREE_TOPS.length];
    var bt = byId(CATALOG.bottoms, c.bottom) || FREE_B[(h >>> 3) % FREE_B.length];
    var hair = c.hair || HAIRS[(h >>> 5) % HAIRS.length];
    return { skin: c.skin || SKINS[(h >>> 2) % SKINS.length], body: c.body || ((h >>> 9) % 3 === 0 ? 'curvy' : 'straight'), height: c.height || 'regular',
      top: tp.id, topColor: c.topColor || CLRS[(h >>> 7) % CLRS.length], bottom: bt.id, bottomColor: c.bottomColor || null,
      shoes: (byId(CATALOG.shoes, c.shoes) || CATALOG.shoes[(h >>> 4) % 4]).id, shoesColor: c.shoesColor || null,
      hair: hair, hairColor: c.hairColor || HCOL[(h >>> 11) % HCOL.length], acc: c.acc || [], accColor: c.accColor || 'gold' };
  }
  function heightIdx(u) { var id = u.look.height, k = 1; CATALOG.heights.forEach(function (h, i) { if (h.id === id) k = i; }); return isNicki(u) ? 1 : k; }
  var RING = { x: '#1d9bf0', tiktok: '#fe2c55', kick: '#53fc18' };
  function headFor(u) {
    if (u._hf) return u._hf;
    var hue = (u.h32 * 47) % 360;
    return u._hf = function (ctx, x, y, a, r) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.save(); ctx.clip();
      var im = u.pimg;
      if (im && im.complete && im.naturalWidth) { var s = Math.max(2 * r / im.naturalWidth, 2 * r / im.naturalHeight); ctx.drawImage(im, -im.naturalWidth * s / 2, -im.naturalHeight * s / 2, im.naturalWidth * s, im.naturalHeight * s); }
      else {
        var g = ctx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, 'hsl(' + hue + ',85%,72%)'); g.addColorStop(1, 'hsl(' + ((hue + 40) % 360) + ',70%,36%)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
        ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '800 ' + Math.round(r * 1.1) + 'px system-ui,Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(u.name || '?').replace(/^[@\W_]+/, '').charAt(0).toUpperCase() || '♪', 0, r * .06);
      }
      ctx.restore(); if (u.plat !== 'none') { ctx.lineWidth = r * .09; ctx.strokeStyle = RING[u.plat] || '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); } ctx.restore();
    };
  }
  function loadPhoto(u) { if (u.photo && !u.pimg && !u._pl) { u._pl = 1; var im = new Image(); im.onload = function () { u.pimg = im; }; im.onerror = function () { u._pl = 0; u.photoBad = 1; }; im.src = u.photo; } }
  function lookSig(u) { return JSON.stringify(lookFor(u)); }
  var BQ = [], BRUN = 0;
  function pumpBuild() {
    while (BRUN < 5 && BQ.length) {
      var j = BQ.shift(); if (j.u._bt !== j.my) continue; BRUN++;
      VNNA.build(j.L).then(function (r) { if (this.u._bt === this.my) { this.u.set = r.set; this.u.spec = r.spec; this.u.dirty = 1; } }.bind(j)).catch(function (e) { console.error('build', e); }).then(function () { BRUN--; pumpBuild(); });
    }
  }
  function build(u) {
    if (!ENGINE) return; var L = lookFor(u), sg = JSON.stringify(L); if (u._sg === sg && u.set) return; u._sg = sg; var my = (u._bt = (u._bt || 0) + 1);
    var j = { u: u, L: L, my: my }; if (u.stage || u.top) BQ.unshift(j); else BQ.push(j); pumpBuild();
  }
  /* soft silhouette shown for the second or two a new look is being assembled */
  function ghost(u) {
    var c = u.cx, w = u.cw, h = u.ch, s = u.s0; c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, 2005 * s); c.scale(s, s); c.globalAlpha = 0.45; c.fillStyle = '#ff8ad0';
    c.beginPath(); c.arc(0, -1330, 120, 0, 7); c.fill(); c.beginPath(); c.moveTo(-170, -1180); c.quadraticCurveTo(0, -1260, 170, -1180); c.lineTo(130, -520); c.lineTo(-130, -520); c.closePath(); c.fill();
    c.fillRect(-120, -540, 90, 520); c.fillRect(30, -540, 90, 520); c.restore();
  }
  function draw(u, d) {
    var s0 = 2.0 * d / 1700, cw = Math.ceil(1500 * s0), ch = Math.ceil(2010 * s0), hs = (byId(CATALOG.heights, isNicki(u) ? 'regular' : u.look.height) || CATALOG.heights[1]).hs;
    u.d = d; u.s0 = s0; u.fh = 1700 * s0 * hs; u.h = ch; u.w = d;
    if (!u.cv) { u.cv = document.createElement('canvas'); u.cv.style.cssText = 'display:block;pointer-events:none'; u.inner.innerHTML = ''; u.inner.appendChild(u.cv); u.cx = u.cv.getContext('2d'); }
    var old = null; if (u.cw && u.cv.width > 0 && u.set) { old = document.createElement('canvas'); old.width = u.cv.width; old.height = u.cv.height; old.getContext('2d').drawImage(u.cv, 0, 0); }
    u.cv.width = cw; u.cv.height = ch; if (old) u.cx.drawImage(old, 0, 0, cw, ch); u.cv.style.width = cw + 'px'; u.cv.style.height = ch + 'px'; u.inner.style.width = cw + 'px'; u.inner.style.height = ch + 'px';
    u.cw = cw; u.ch = ch; u.cv.style.marginLeft = '0'; u.dirty = 1; loadPhoto(u); build(u);
    if (u.pill) u.pill.style.bottom = 'calc(100% - ' + Math.round(250 * s0) + 'px)';
  }
  function makeEl(u) {
    var el = document.createElement('div'); el.className = 'p';
    el.innerHTML = '<div class="in2"></div><div class="pill"></div>';
    u.el = el; u.inner = el.firstChild; u.pill = el.lastChild; u.cv = null; u.cx = null; u.h = 0; u.ghostD = 0; u.dirty = 1;
    $('crowd').appendChild(el);
  }
  /* one shared animation loop for everyone on screen */
  var bclk = 0, lastF = 0, frameN = 0, STRIDE = 1, dtAvg = 16, fpsMs = 0;
  function crowdList() { var a = []; order.forEach(function (k) { var u = users[k]; if (u && u.el && u.inside && u.cv) { if (u.set) a.push(u); else if (u.ghostD !== u.cw) { u.ghostD = u.cw; ghost(u); } } }); BT.forEach(function (u) { if (u.cv && u.set) a.push(u); }); return a; }
  function animate(now) {
    requestAnimationFrame(animate);
    var dt = Math.min(100, now - (lastF || now)); lastF = now; if (!dt) return;
    dtAvg += (dt - dtAvg) * 0.05; bclk += dt / 1000 * LT.bpm / 60; frameN++;
    var list = crowdList(), n = list.length, base = n <= 30 ? 1 : n <= 70 ? 2 : n <= 140 ? 3 : 4;
    if (dtAvg > 26 && STRIDE < 6) STRIDE = Math.min(6, Math.max(STRIDE, base) + 1); else if (dtAvg < 19 && STRIDE > base) STRIDE--; else if (STRIDE < base) STRIDE = base;
    var t0 = performance.now();
    for (var i = 0; i < list.length; i++) {
      var u = list[i], walking = u.walkUntil > now, hot = u.stage || u.top || walking, st = hot ? 1 : STRIDE;
      if (!u.dirty && st > 1 && ((frameN + (u.h32 % st)) % st)) continue;
      var cx = u.cx; cx.clearRect(0, 0, u.cw, u.ch); u.dirty = 0;
      try {
        VNNA.draw(cx, u.set, u.spec, { x: u.cw / 2, y: 2005 * u.s0, h: u.fh, clip: walking ? 'idle' : VNNA.clipOf(u.dance), t: bclk * 0.5, beat: 0.5, ph: (u.h32 % 16) / 4, amp: (u.stage && S.top5) ? 1.25 : (u.bt ? 0.7 : 1), head: headFor(u) });
      } catch (e) { if (!u.err) { u.err = 1; console.error('draw', u.key, e); } }
      if (performance.now() - t0 > (u.dirty ? 34 : 14)) break;
    }
    fpsMs = performance.now() - t0;
  }
  function rebuildAll() { order.forEach(function (k) { var u = users[k]; if (u && u.cv) { u._sg = null; build(u); } }); BT.forEach(function (u) { if (u.cv) { u._sg = null; build(u); } }); }
  VNNA.setCache(260);
  VNNA.init(AB + 'lib_lo/', AB + 'moc.json').then(function () { ENGINE = true; rebuildAll(); }).catch(function (e) { ENGERR = String(e && e.message || e); console.error('avatar assets', e); var b = document.getElementById('cstat'); if (b) b.title = 'Avatar assets: ' + ENGERR; });
  requestAnimationFrame(animate);
  function put(u, x, y, dur, noWalk) {
    u.x = x; u.y = y;
    var el = u.el;
    el.style.transitionDuration = dur + 's, .6s';
    el.style.transform = 'translate(' + (x - (u.cw || u.d) / 2 + (u.ox || 0)) + 'px,' + (y - u.h) + 'px) scale(' + (u.sc || 1) + ')';
    el.style.zIndex = Math.round(y) + ((u.top || (u.stage && S.top5)) ? 5000 : 0);
    if (dur > 0.05 && !noWalk) {
      el.classList.add('walk'); u.walkUntil = performance.now() + dur * 1000 + 60; clearTimeout(u.wt);
      u.wt = setTimeout(function () { el.classList.remove('walk'); }, dur * 1000);
    }
    el.querySelector('.pill').style.fontSize = Math.max(11, Math.min(18, u.d * 0.16)) + 'px';
  }
  function walkTime(u, x, y) { var dx = x - (u.x || x), dy = y - (u.y || y); return Math.max(0.9, Math.min(5, Math.sqrt(dx * dx + dy * dy) / 230)); }
  function say(u, text, ms, gold) {
    if (!u.pill) return;
    u.pill.textContent = text; u.pill.className = 'pill show' + (gold ? ' gold' : '');
    clearTimeout(u.pt); u.pt = setTimeout(function () { u.pill.className = 'pill'; }, ms || 3200);
  }
  function drink(u, on) {
    var ex = u.inner.querySelector('.drink'); if (ex) ex.remove();
    if (!on) return;
    var g = document.createElement('div'); g.className = 'drink';
    g.innerHTML = '<svg viewBox="0 0 24 30"><path d="M3 3h18l-8 11v10h4v3H7v-3h4V14z" fill="#ffd86b" fill-opacity=".35" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 6h12l-4 5h-4z" fill="#ff4fb0"/></svg>';
    g.style.right = '27%'; u.inner.appendChild(g);
  }

  function zoneFor(u) { return u.stage && S.top5 ? 'stage' : (u.atBar ? 'bar' : (u.vip && !isNicki(u) ? 'vip' : 'floor')); }
  function seatedCount() { var n = 0; order.forEach(function (k) { var u = users[k]; if (u.inside && u.slot) n++; }); return n; }
  function release(u) { if (u.slot) { u.slot.occ = null; u.slot = null; } }
  function evictStalest() {
    var v = null;
    order.forEach(function (k) { var u = users[k]; if (!u.inside || !u.slot || u.vip || isNicki(u) || u.slot.z !== 'floor') return; if (!v || u.lastActive < v.lastActive) v = u; });
    return v;
  }
  function seat(u, instant) {
    var zone = zoneFor(u), s = null, nick = isNicki(u);
    release(u);
    if (nick) s = nickiSpot();
    else if (zone === 'stage') s = SL.stage[u.rank] || null;
    if (!s) s = pickSlot(zone === 'stage' ? 'floor' : zone, false);
    if (!s && zone !== 'floor' && zone !== 'stage') s = pickSlot('floor', false);
    if (!s || (seatedCount() >= S.maxOn && !nick)) { u.overflow = true; if (u.el) u.el.classList.remove('in'); scheduleFit(); return false; }
    s.occ = u.key; u.slot = s; u.overflow = false;
    if (!u.el) makeEl(u);
    var firstTime = !u.shown;
    var tall = (heightIdx(u) === 2);
    if (u.d !== s.d || !u.h) draw(u, s.d);
    u.top = nick;
    if (firstTime) {
      var dr = rect('door'); u.x = dr.x + dr.w / 2; u.y = dr.y + dr.h / 2;
      put(u, u.x, u.y, 0, true);
      void u.el.offsetWidth;
      u.shown = true;
    }
    u.el.classList.add('in');
    var dur = instant ? 0 : walkTime(u, s.x, s.y);
    put(u, s.x, s.y, dur);
    drink(u, u.atBar && s.z === 'bar');
    rankTag(u, s.z === 'stage');
    return true;
  }
  function unseat(u, walkOut) {
    release(u); u.overflow = false;
    if (!u.el) return;
    var el = u.el;
    if (walkOut) {
      var dr = rect('door'), x = dr.x + dr.w / 2, y = dr.y + dr.h / 2;
      put(u, x, y, walkTime(u, x, y));
      setTimeout(function () { el.classList.remove('in'); }, 900);
      setTimeout(function () { if (u.el === el && !u.inside) { el.remove(); u.el = null; u.shown = false; } }, 1900);
    } else { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 700); u.el = null; u.shown = false; }
  }
  function relayout() {
    buildSlots(); if (typeof stageFx === 'function') stageFx();
    order.forEach(function (k) { var u = users[k]; if (u.slot) u.slot = null; });
    var list = order.map(function (k) { return users[k]; }).filter(function (u) { return u.inside; });
    list.sort(function (a, b) { return (b.vip - a.vip) || (b.lastActive - a.lastActive); });
    list.forEach(function (u) { u.d = 0; seat(u, false); });
    overflowUI();
  }
  function overflowUI() {
    var n = 0; order.forEach(function (k) { var u = users[k]; if (u.inside && !u.slot) n++; });
    var b = $('badge'), f = rect('floor');
    b.style.display = n > 0 ? 'block' : 'none';
    b.innerHTML = '<b>+' + n + '</b> inside';
    b.style.left = '1118px'; b.style.top = '392px';
    /* silhouettes in the free back-row slots */
    Array.prototype.slice.call(document.querySelectorAll('.sil')).forEach(function (e) { e.remove(); });
    if (n > 0) {
      var back = SL.floor.filter(function (s) { return !s.occ && s.r <= 1; }), c = Math.min(n, 18, back.length), i;
      for (i = 0; i < c; i++) {
        var s = back[i * Math.floor(back.length / c)] || back[i], e = document.createElement('div');
        e.className = 'sil'; e.style.width = s.d * 0.6 + 'px'; e.style.transform = 'translate(' + (s.x - s.d * 0.3) + 'px,' + (s.y - s.d * 1.2) + 'px)'; e.style.zIndex = Math.round(s.y);
        e.innerHTML = '<i class="h"></i><i class="b"></i>'; $('crowd').appendChild(e);
      }
    }
    $('inside').textContent = String(order.filter(function (k) { return users[k].inside; }).length);
  }

  /* ---------- !look parsing ---------- */
  var CL_IDS = CATALOG.colors.clothing.map(function (c) { return c.id; }), HC_IDS = CATALOG.hair.colors.map(function (c) { return c.id; }), AC_IDS = CATALOG.accessories.colors.map(function (c) { return c.id; });
  function parseLook(text, forNicki) {
    var res = blankLook(), unknown = [], last = null;
    var accepts = { top: CL_IDS, bottom: CL_IDS, shoes: CL_IDS, hair: HC_IDS, acc: AC_IDS }, slot = { top: 'topColor', bottom: 'bottomColor', shoes: 'shoesColor', hair: 'hairColor', acc: 'accColor' };
    var has = function (k) { return k === 'acc' ? res.acc.length > 0 : !!res[k]; };
    var isColor = function (w) { return CL_IDS.indexOf(w) >= 0 || HC_IDS.indexOf(w) >= 0 || AC_IDS.indexOf(w) >= 0; };
    var topsOK = CATALOG.looks.filter(function (l) { return l.unlock !== 'nicki'; });
    var ACC_OK = CATALOG.accessories.items.filter(function (a) { return !a.hidden; });
    text.toLowerCase().replace(/^\s*!look\b/, '').split(/[\s,]+/).filter(Boolean).forEach(function (w) {
      if (byId(NICKI_LOOKS, w)) { if (forNicki) res.nicki = w; else unknown.push(w); }
      else if (byId(topsOK, w)) { res.top = w; last = 'top'; }
      else if (byId(CATALOG.bottoms, w)) { res.bottom = w; last = 'bottom'; }
      else if (byId(CATALOG.shoes, w)) { res.shoes = w; last = 'shoes'; }
      else if (w === 'curvy' || w === 'straight') res.body = w;
      else if (byId(CATALOG.heights, w)) res.height = w;
      else if (byId(CATALOG.skin, w)) res.skin = w;
      else if (byId(CATALOG.hair.styles, w)) { res.hair = w; last = 'hair'; }
      else if (byId(ACC_OK, w)) { if (res.acc.indexOf(w) < 0) res.acc.push(w); last = 'acc'; }
      else if (isColor(w)) {
        var k = null;
        if (last && accepts[last].indexOf(w) >= 0 && !res[slot[last]]) k = last;
        else ['top', 'bottom', 'shoes', 'hair', 'acc'].some(function (o) { if (has(o) && accepts[o].indexOf(w) >= 0 && !res[slot[o]]) { k = o; return true; } return false; });
        if (k) res[slot[k]] = w;
        else if (HC_IDS.indexOf(w) >= 0 && !res.hairColor) { res.hair = res.hair || 'long'; res.hairColor = w; }
        else unknown.push(w);
      } else unknown.push(w);
    });
    res.unknown = unknown; return res;
  }
  function applyLook(u, text, force) {
    var p = parseLook(text, isNicki(u)), notes = [], c = u.look;
    if (p.nicki) { u.nickiLook = p.nicki; }
    var earned = isEarned(u);
    var tp = p.top && byId(CATALOG.looks, p.top);
    if (tp && !force && ((tp.unlock === 'earned' && !earned) || (tp.unlock === 'vip' && !u.vip))) { notes.push('locked: ' + tp.name); p.top = null; }
    var bp = p.bottom && byId(CATALOG.bottoms, p.bottom);
    if (bp && !force && bp.unlock === 'earned' && !earned) { notes.push('locked: ' + bp.name); p.bottom = null; }
    if (p.acc.length && !force) p.acc = p.acc.filter(function (id) { var it = byId(CATALOG.accessories.items, id); if (it && it.unlock === 'vip' && !u.vip) { notes.push('locked: ' + it.name); return false; } return true; });
    ['top', 'topColor', 'bottom', 'bottomColor', 'shoes', 'shoesColor', 'height', 'hair', 'hairColor', 'skin', 'body'].forEach(function (k) { if (p[k]) c[k] = p[k]; });
    if (p.acc.length) { c.acc = p.acc; c.accColor = p.accColor || c.accColor; } else if (p.accColor && c.acc.length) c.accColor = p.accColor;
    if (p.hairColor && !p.hair && !c.hair) c.hair = 'long';
    if (p.unknown.length) notes.push('?: ' + p.unknown.slice(0, 3).join(' '));
    return notes;
  }

  /* ---------- commands ---------- */
  var DANCES = CATALOG.dances.map(function (d) { return d.id; });
  function isMod(u) { return u.plat === 'x' && S.mods.indexOf(u.hnd) >= 0; }
  function activate(u) { u.lastActive = Date.now(); }
  function enter(u) {
    if (u.inside && u.slot) { say(u, 'already inside', 2000); return; }
    u.inside = true; activate(u); refreshVip(u);
    if (order.indexOf(u.key) < 0) order.push(u.key);
    if (seat(u, false)) say(u, (u.vip ? 'VIP ' : '') + u.name, 3500, u.vip); else overflowUI();
    overflowUI(); save(); scheduleFit();
  }
  function leave(u) { if (!u.inside) return; u.inside = false; unseat(u, true); overflowUI(); save(); scheduleFit(); }
  function handle(u, text) {
    var t = text.trim(), tl = t.toLowerCase(), cmd = tl.split(/\s+/)[0], rest = t.slice(cmd.length).trim();
    u.chats++; u.show = (u.show || 0) + 1; activate(u);
    if (isNicki(u) && !S.nickiDone && !nickiBusy) { nickiEntrance(u, false); }
    if (cmd.charAt(0) !== '!') { if (u.inside && u.slot) bumpFront(u); save(); return; }
    var mod = isMod(u);
    if (cmd === '!enter') { if (isNicki(u) && !u.inside) { nickiEntrance(u, false); return; } enter(u); return; }
    if (!u.inside && !(mod && /^!(vip|unvip|light|top5|np|nicki)$/.test(cmd))) { return; }
    if (cmd === '!leave') { if (isNicki(u)) nickiWalkOut(u); else leave(u); return; }
    if (cmd === '!dance') {
      var w = rest.toLowerCase().split(/\s+/)[0];
      u.dance = normD(w) || DANCES[Math.floor(Math.random() * DANCES.length)];
      u.dances++; u.dirty = 1;
      say(u, byId(CATALOG.dances, u.dance).name.toLowerCase(), 2200); save(); return;
    }
    if (cmd === '!look') {
      var notes = applyLook(u, rest); u.d = 0; seat(u, true);
      say(u, notes.length ? notes.join(' · ') : 'new look', 3200); save(); return;
    }
    if (cmd === '!bar') { if (u.atBar) { say(u, 'already at the bar', 2000); return; } u.atBar = true; seat(u, false); say(u, 'cheers', 2400); save(); return; }
    if (cmd === '!floor' || cmd === '!dancefloor') { if (!u.atBar && !u.vipFloor) { say(u, 'already on the floor', 2000); return; } u.atBar = false; seat(u, false); say(u, 'let\'s dance', 2400); save(); return; }
    if (mod && (cmd === '!vip' || cmd === '!unvip')) {
      var target = norm(rest.split(/\s+/)[0]); if (!target) return;
      var list = S.vip.map(norm), i = list.indexOf(target);
      if (cmd === '!vip' && i < 0) S.vip.push('@' + target);
      if (cmd === '!unvip' && i >= 0) S.vip.splice(i, 1);
      vipUI(); order.forEach(function (k) { var x = users[k]; if (x.hnd === target) { refreshVip(x); if (x.inside) { x.d = 0; seat(x, false); say(x, cmd === '!vip' ? 'VIP' : 'back to the floor', 2600, true); } } });
      save(); return;
    }
    if (mod && cmd === '!top5') { var ar = rest.toLowerCase(); setTop5(ar === 'on' ? true : ar === 'off' ? false : !S.top5); return; }
    if (mod && cmd === '!np') { var m2 = rest.match(/^(.*?)\s+[-\u2013]\s+(.*)$/); if (/^off$/i.test(rest) || !rest) setNP('', ''); else if (m2) setNP(m2[1], m2[2]); else setNP('', rest); return; }
    if (mod && cmd === '!light') { lightCmd(rest.toLowerCase().split(/\s+/)[0]); return; }
    if (mod && cmd === '!nicki' && /test/i.test(rest)) { nickiRehearse(); return; }
  }
  function bumpFront(u) { /* chatting keeps you from drifting to the back */ }
  setInterval(function () {
    /* idle drift: people who have gone quiet slide to the smaller back rows, freeing the front */
    var now = Date.now(), idleMs = 5 * 60 * 1000;
    order.forEach(function (k) {
      var u = users[k]; if (!u.inside || !u.slot || u.vip || isNicki(u) || u.slot.z !== 'floor' || u.atBar || now - u.lastActive < idleMs || u.slot.r < 3) return;
      var back = SL.floor.filter(function (s) { return !s.occ && s.r <= 1; })[0];
      if (back) { release(u); back.occ = u.key; u.slot = back; u.d = 0; draw(u, back.d); put(u, back.x, back.y, walkTime(u, back.x, back.y)); }
    });
    /* overflow people who are chatting again earn a seat */
    order.forEach(function (k) { var u = users[k]; if (u.inside && !u.slot && now - u.lastActive < 60000) { u.d = 0; seat(u, false); } });
    overflowUI(); top5Update(); scheduleFit();
  }, 15000);
  setInterval(function () { top5Update(); }, 6000);

  /* ---------- Nicki ---------- */
  var nickiBusy = false;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function banner(t, sub, ms) {
    var b = $('banner'); b.innerHTML = t + (sub ? '<small>' + sub + '</small>' : ''); b.classList.add('show');
    setTimeout(function () { b.classList.remove('show'); }, ms || 3800);
  }
  /* the big entrance moment: light rays, slam-in letters, confetti, camera flashes, glowing carpet */
  function spectacle(ms) {
    var f = $('nfx'), i, h = '<div class="rays"></div><div class="rays r2"></div><div class="nfl"></div><div class="nbig"><div class="n1">';
    'NICKI'.split('').forEach(function (c, j) { h += '<span style="animation-delay:' + (0.25 + j * 0.09) + 's">' + c + '</span>'; });
    h += '</div><div class="n2">IS IN THE BUILDING</div><div class="n3">Everybody make some room</div></div><div class="conf">';
    var cols = ['#ff4fb0', '#ffd86b', '#ffffff', '#ff8ad0', '#a07bff'];
    for (i = 0; i < 110; i++) h += '<i style="left:' + (Math.random() * 100) + '%;--dx:' + Math.round(Math.random() * 300 - 150) + 'px;--r:' + Math.round(Math.random() * 900 - 450) + 'deg;--d:' + (3.6 + Math.random() * 3.2).toFixed(2) + 's;--dl:' + (0.5 + Math.random() * 3.4).toFixed(2) + 's;background:' + cols[i % 5] + ';width:' + (8 + Math.random() * 10).toFixed(0) + 'px;height:' + (14 + Math.random() * 14).toFixed(0) + 'px"></i>';
    h += '</div><div class="paps">';
    for (i = 0; i < 16; i++) { var sz = 70 + Math.random() * 90; h += '<i style="left:' + (Math.random() * 1700 + 100) + 'px;top:' + (Math.random() * 500 + 480) + 'px;width:' + sz + 'px;height:' + sz + 'px;animation-delay:' + (0.6 + i * 0.38 + Math.random() * 0.2).toFixed(2) + 's"></i>'; }
    h += '</div>';
    f.innerHTML = h; f.className = 'go';
    var pts = R.path.map(function (p) { return p.join(','); }).join(' ');
    $('carpet').innerHTML = '<polyline class="c1" points="' + pts + '"/><polyline class="c2" points="' + pts + '"/>'; $('carpet').classList.add('on');
    clearTimeout(spectacle.t); spectacle.t = setTimeout(function () { f.className = ''; f.innerHTML = ''; }, ms || 7600);
  }
  function carpetOff() { $('carpet').classList.remove('on'); }
  function pathDist(px, py) {
    var best = null, i; for (i = 0; i < R.path.length - 1; i++) { var s = segDist(px, py, R.path[i], R.path[i + 1]); if (!best || s.d < best.d) best = s; } return best;
  }
  function dAtY(y) { return y > 440 ? Math.max(R.nicki.d, avW(y)) : R.nicki.d; }
  async function nickiEntrance(u, test) {
    if (nickiBusy) return; nickiBusy = true;
    try {
      if (!test) { S.nickiDone = true; save(); }
      u.inside = true; if (order.indexOf(u.key) < 0) order.push(u.key);
      var P = R.path, spot = nickiSpot(), BASE = 110;
      release(u); u.top = true;
      if (!u.el) makeEl(u);
      u.d = 0; draw(u, BASE); u.shown = true; u.ox = 0; u.sc = dAtY(P[0][1]) / BASE;
      u.el.style.transitionTimingFunction = 'linear';
      u.el.classList.remove('in'); put(u, P[0][0], P[0][1], 0, true); void u.el.offsetWidth; u.el.classList.add('in');
      /* part the crowd along the whole route */
      var HALF = 120;
      order.forEach(function (k) {
        var o = users[k]; if (o === u || !o.inside || !o.slot) return;
        var s = pathDist(o.x, o.y - o.h * 0.4);
        if (s.d < HALF) {
          var nx = -s.vy / s.L, ny = s.vx / s.L, side = ((o.x - s.cx) * nx + (o.y - o.h * 0.4 - s.cy) * ny) >= 0 ? 1 : -1;
          o.ox = nx * side * (HALF - s.d + 40); put(o, o.x, o.y, 1.1, true); o.parted = true;
        } else o.parted = false;
      });
      lightFor('spot', true, u);
      spectacle(7800);
      await sleep(2600);
      var i;
      for (i = 1; i < P.length; i++) {
        var dist = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]), dur = Math.max(0.5, dist / 170);
        u.sc = dAtY(P[i][1]) / BASE; put(u, P[i][0], P[i][1], dur);
        await sleep(dur * 1000);
      }
      u.el.style.transitionTimingFunction = '';
      u.d = 0; u.sc = 1; draw(u, spot.d); put(u, spot.x, spot.y, 0, true);
      spot.occ = u.key; u.slot = spot;
      await sleep(500);
      say(u, '@NickiMinaj', 4000, true);
      await sleep(1800);
      order.forEach(function (k) { var o = users[k]; if (o.parted) { o.ox = 0; put(o, o.x, o.y, 1.4, true); o.parted = false; } });
      lightFor('spot', false); carpetOff();
    } catch (e) { console.error(e); }
    nickiBusy = false; overflowUI(); save();
  }
  async function nickiWalkOut(u) {
    if (nickiBusy || !u.inside) return; nickiBusy = true;
    try {
      var P = R.path, BASE = 110, i;
      release(u); u.top = true; u.d = 0; draw(u, BASE); u.sc = dAtY(P[P.length - 1][1]) / BASE; u.ox = 0;
      put(u, R.nicki.x, R.nicki.y, 0, true); void u.el.offsetWidth;
      u.el.style.transitionTimingFunction = 'linear';
      say(u, 'See you next time', 2400, true);
      await sleep(900);
      for (i = P.length - 2; i >= 0; i--) { var dd = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]), du = Math.max(0.5, dd / 170); u.sc = dAtY(P[i][1]) / BASE; put(u, P[i][0], P[i][1], du); await sleep(du * 1000); }
      u.el.style.transitionTimingFunction = '';
      u.inside = false; u.top = false; unseat(u, false);
    } catch (e) { console.error(e); }
    nickiBusy = false; overflowUI(); save();
  }
  function nickiRehearse() {
    var u = newUser('x:nickiminaj', 'NickiMinaj', 'x', null); u.hnd = 'nickiminaj'; u.nickiLook = u.nickiLook || NICKI_LOOKS[Math.floor(Math.random() * 4)].id;
    nickiEntrance(u, true);
  }


  /* ---------- top 5 on the floor ---------- */
  function rankTag(u, on) {
    var el = u.el; if (!el) return; var tag = el.querySelector('.rk');
    if (!on) { if (tag) tag.remove(); u.autoDance = false; return; }
    if (!tag) { tag = document.createElement('div'); tag.className = 'rk'; el.appendChild(tag); }
    tag.textContent = '#' + ((u.rank || 0) + 1); tag.style.fontSize = Math.max(14, u.d * 0.22) + 'px'; u.autoDance = true;
  }
  var top5Sig = '';
  function top5Update(force) {
    var list = [];
    if (S.top5) {
      order.forEach(function (k) { var u = users[k]; if (u.inside && !isNicki(u) && (u.show || 0) > 0) list.push(u); });
      list.sort(function (a, b) { return (b.show - a.show) || (b.lastActive - a.lastActive); });
      list = list.slice(0, 5);
    }
    var sig = S.top5 + ':' + list.map(function (u) { return u.key; }).join(',');
    if (sig === top5Sig && !force) return;
    top5Sig = sig;
    order.forEach(function (k) { var u = users[k]; var was = u.stage; u.stage = false; u.rank = null; if (was) u._unstage = true; });
    list.forEach(function (u, i) { u.stage = true; u.rank = i; });
    relayout();
    order.forEach(function (k) { var u = users[k]; if (u._unstage) { u._unstage = false; rankTag(u, false); } });
  }
  function stageFx() {
    var f = $('stagefx'), on = S.top5; f.style.display = on ? 'block' : 'none'; if (!on) return;
    var b = stageBox(CROWDK), w = b.d * 7.2, hh = b.d * 2.2; f.style.left = (R.stage.x - w / 2) + 'px'; f.style.top = (R.stage.y - hh * 0.62) + 'px'; f.style.width = w + 'px'; f.style.height = hh + 'px';
  }
  function setTop5(on) {
    S.top5 = !!on; var b = $('top5btn'); if (b) b.setAttribute('aria-pressed', String(S.top5));
    top5Sig = ''; top5Update(true); stageFx(); save();
    if (S.top5) banner('TOP 5 CHATTERS', 'Take the floor', 3600);
  }

  /* ---------- crowd auto-fit: avatars shrink when the room is full ---------- */
  var fitT = null;
  function scheduleFit() { if (fitT) return; fitT = setTimeout(function () { fitT = null; autoFit(); }, 700); }
  function autoFit() {
    var nF = 0, nB = 0, nV = 0, i;
    order.forEach(function (k) { var u = users[k]; if (!u.inside || isNicki(u) || (u.stage && S.top5)) return; if (u.atBar) nB++; else if (u.vip) nV++; else nF++; });
    function fits(k, margin) {
      var o = makeSlots(k), needF = nF + Math.max(0, nB - o.bar.length) + Math.max(0, nV - o.vip.length);
      return o.floor.length >= Math.ceil(needF * margin) + 1;
    }
    var pick = K_STEPS[K_STEPS.length - 1];
    for (i = 0; i < K_STEPS.length; i++) { if (fits(K_STEPS[i], K_STEPS[i] > CROWDK ? 1.15 : 1.0)) { pick = K_STEPS[i]; break; } }
    if (pick > CROWDK && !fits(pick, 1.15)) pick = CROWDK;
    if (pick !== CROWDK) { CROWDK = pick; relayout(); }
    else { var un = 0; order.forEach(function (k) { var u = users[k]; if (u.inside && !u.slot) un++; }); if (un) { relayout(); } }
  }

  /* ---------- bartenders ---------- */
  var BT = [];
  function buildBartenders() {
    BT.forEach(function (b) { if (b.el) b.el.remove(); }); BT = [];
    var names = ['Mimi', 'Jojo', 'Kiki', 'Lola', 'Bebe'], looks = [
      { top: 'pinkfriday', topColor: 'pink', bottom: 'miniskirt', bottomColor: 'pink', shoes: 'ankle', shoesColor: 'pink', skin: 'caramel', hair: 'ponytail', hairColor: 'black', acc: ['hoops'], accColor: 'gold' },
      { top: FREE_TOPS[1 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'shorts', bottomColor: 'pink', shoes: 'sneakers', shoesColor: 'pink', skin: 'espresso', hair: 'buns', hairColor: 'pink', acc: ['hoops'], accColor: 'pink' },
      { top: FREE_TOPS[2 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'jeans', bottomColor: 'pink', shoes: 'boots', shoesColor: 'pink', skin: 'sand', hair: 'wavy', hairColor: 'blonde', acc: ['pearls'], accColor: 'silver' },
      { top: FREE_TOPS[0].id, topColor: 'pink', bottom: 'miniskirt', bottomColor: 'pink', shoes: 'ankle', shoesColor: 'pink', skin: 'bronze', hair: 'bob', hairColor: 'burgundy', acc: ['nails'], accColor: 'gold' },
      { top: FREE_TOPS[3 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'shorts', bottomColor: 'pink', shoes: 'sneakers', shoesColor: 'pink', skin: 'porcelain', hair: 'long', hairColor: 'platinum', acc: ['headphones'], accColor: 'pink' }
    ], spots = [[0, 0.2], [0, 0.52], [0, 0.82], [1, 0.3], [1, 0.72]], dances = ['rock', 'groove', 'rock', 'groove', 'rock'];
    spots.forEach(function (sp, i) {
      var bar = R.bars[sp[0]]; if (!bar) return;
      var pts = bar.edge, total = 0, lens = [], j; for (j = 0; j < pts.length - 1; j++) { var l = Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]); lens.push(l); total += l; }
      var pos = total * sp[1], si = 0; while (si < lens.length - 1 && pos > lens[si]) { pos -= lens[si]; si++; }
      var f = Math.min(1, pos / lens[si]), px = pts[si][0] + (pts[si + 1][0] - pts[si][0]) * f, py = pts[si][1] + (pts[si + 1][1] - pts[si][1]) * f;
      var d = Math.max(30, avW(py) * 0.98), x = px - bar.out[0] * d * 0.55, y = py - bar.out[1] * d * 0.55 + d * 0.15;
      var u = { key: 'bt' + i, name: names[i], plat: 'none', photo: null, look: Object.assign(blankLook(), looks[i]), dance: dances[i], h32: 40 + i * 7, bt: true };
      makeEl(u); u.el.classList.add('bt', 'in'); u.inner.className = 'in2 btclip';
      draw(u, d); u.dance = dances[i]; draw(u, d);
      u.d = d; put(u, x, y, 0, true); u.el.style.zIndex = Math.round(y);
      u.el.style.transitionDuration = '0s';
      BT.push(u);
    });
  }

  /* ---------- glows, LED strips, now playing ---------- */
  var GLOW = [[16,155,0],[14,99,0],[1713,652,0],[263,454,1],[1911,733,0],[1788,207,0],[0,641,0],[1371,498,0],[230,518,0],[1917,195,0],[45,558,0],[270,503,0],[872,383,0],[176,441,0],[104,577,0],[452,414,0],[348,296,0],[440,134,0],[1247,15,0],[487,14,0],[547,430,0],[112,104,0],[613,422,1],[320,440,0],[1131,423,1],[1919,314,1],[205,135,0],[1717,770,0],[1245,138,0],[873,21,0],[1468,117,0],[1462,140,0],[1532,149,0],[129,506,0],[508,141,0],[177,548,0],[174,515,1],[1355,83,0],[180,486,0],[253,302,0],[1240,256,0],[132,560,0],[1547,596,1],[1910,866,0],[1906,925,1],[1917,48,0],[87,525,0],[1619,643,0],[1579,181,0],[1507,571,1],[253,381,0],[1648,698,0],[138,532,0],[437,287,0],[1464,537,0],[53,673,0],[1542,258,0],[1835,211,0],[536,378,0],[1322,133,0],[102,662,0],[1743,147,0],[506,272,0],[110,244,0],[1688,142,0],[1577,613,0],[343,357,0],[1655,191,0]];
  function buildGlows() {
    var h = '';
    GLOW.forEach(function (g, i) {
      var big = (g[1] < 300 && g[0] < 1900 && g[2] === 0) ? 1 : 0, r = g[2] ? 34 + (i % 4) * 5 : 52 + (i % 3) * 10;
      h += '<i class="' + (g[2] ? 'w' : 'p') + '" style="left:' + g[0] + 'px;top:' + g[1] + 'px;width:' + r * 2 + 'px;height:' + r * 2 + 'px;--t:' + (3.2 + (i % 7) * 0.45).toFixed(2) + 's;--dl:-' + ((i * 0.77) % 5).toFixed(2) + 's"></i>';
    });
    $('glows').innerHTML = h;
  }
  function buildLed() {
    /* thin LED tube with a tight bloom and a faint spill; cut off where the VIP platform and its railing sit in front of the screen */
    var h = '<defs><filter id="lgl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<clipPath id="ledclip"><polygon points="0,0 1920,0 1920,300 1176,300 1176,1080 0,1080"/></clipPath></defs><g clip-path="url(#ledclip)">';
    ['screen', 'dj'].forEach(function (id) {
      var r = rect(id), g = 1;
      var a = 'x="' + (r.x - g) + '" y="' + (r.y - g) + '" width="' + (r.w + g * 2) + '" height="' + (r.h + g * 2) + '" rx="3" pathLength="1000"';
      h += '<g filter="url(#lgl)"><rect class="lb" ' + a + '/><rect class="lc" ' + a + '/></g>';
    });
    $('led').innerHTML = h + '</g>';
  }
  function setNP(a, t) {
    S.np = { a: String(a || '').trim(), t: String(t || '').trim() };
    var has = !!(S.np.a || S.np.t);
    $('npa').textContent = S.np.a; $('npt').textContent = has ? S.np.t : 'DJ set live';
    $('npd').style.display = S.np.a && S.np.t ? '' : 'none';
    $('np').classList.toggle('idle', !has);
    var t2 = $('npt'); t2.classList.remove('mq'); void t2.offsetWidth;
    if ($('npbox').scrollWidth > 0 && t2.scrollWidth > $('npbox').clientWidth) t2.classList.add('mq');
    save();
  }
  var npPoll = null;
  function npStart() {
    clearInterval(npPoll); if (!S.npUrl) return;
    var go = function () { fetch(S.npUrl, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { var a = j.artist || j.a || '', t2 = j.title || j.t || ''; if (a !== S.np.a || t2 !== S.np.t) setNP(a, t2); }).catch(function () {}); };
    go(); npPoll = setInterval(go, 5000);
  }

  /* ---------- chat in ---------- */
  var seen = [], logEl = $('log');
  function log(s) { logEl.textContent = (s + '\n' + logEl.textContent).slice(0, 4000); }
  function platOf(t) { t = String(t || '').toLowerCase(); if (t.indexOf('tiktok') >= 0) return 'tiktok'; if (t.indexOf('kick') >= 0) return 'kick'; if (t === 'x' || t.indexOf('twitter') >= 0 || t === 'xcom' || t.indexOf('x.com') >= 0) return 'x'; return 'none'; }
  function strip(s) { var d = document.createElement('div'); d.innerHTML = String(s == null ? '' : s); return (d.textContent || '').trim(); }
  function onMessage(m) {
    var text = strip(m.chatmessage != null ? m.chatmessage : (m.message != null ? m.message : ''));
    var name = strip(m.chatname || m.username || m.userid || ''), id = String(m.userid || m.chatname || m.username || '');
    if (!id) return;
    if (m.id != null) { var sid = String(m.id); if (seen.indexOf(sid) >= 0) return; seen.push(sid); if (seen.length > 400) seen.shift(); }
    var plat = platOf(m.type || m.source || m.platform), photo = m.chatimg || m.userimg || m.avatar || null;
    var hnd = norm(m.userid || m.chatname), alt = norm(m.chatname);
    var key = plat + ':' + hnd;
    log((plat + ' | ' + (m.userid || '-') + ' | ' + (m.chatname || '-') + ' | ' + text).slice(0, 160));
    var u = newUser(key, name || id, plat, photo); u.hnd = hnd; u.alt = alt;
    /* X handles can arrive as userid or as chatname; match the special lists on either */
    if (plat === 'x' && alt && (alt === 'nickiminaj' || hnd === 'nickiminaj')) { u.hnd = 'nickiminaj'; }
    else if (plat === 'x') { var vs = vipSet(), ms = S.mods; if (!vs[hnd] && vs[alt]) u.hnd = alt; if (ms.indexOf(hnd) < 0 && ms.indexOf(alt) >= 0) u.hnd = alt; }
    refreshVip(u);
    if (!text) return;
    if (u._wasInside && !u.inside && u._wasInside !== 'done') { u._wasInside = 'done'; u.inside = true; if (order.indexOf(u.key) < 0) order.push(u.key); seat(u, true); }
    handle(u, text);
  }
  function handleRaw(data) {
    var j; try { j = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return; }
    (function walk(x) {
      if (!x) return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (x.overlayNinja) return walk(x.overlayNinja);
      if (x.dataReceived) return walk(x.dataReceived);
      if (x.contents) return walk(x.contents);
      if (typeof x === 'object' && (x.chatmessage != null || x.chatname || x.userid)) onMessage(x);
    })(j);
  }
  var ws = null, wsT = null, wsTry = 0;
  function cstat(ok, t) { $('dot').className = 'dot ' + (ok === true ? 'ok' : ok === false ? 'bad' : ''); $('cstat').textContent = t; }
  function connect() {
    clearTimeout(wsT); if (ws) { try { ws.onclose = null; ws.close(); } catch (e) {} ws = null; }
    if (!S.session && !S.ws) { cstat(null, 'Not connected. Add a session ID.'); return; }
    var url = S.ws || 'wss://io.socialstream.ninja';
    try { ws = new WebSocket(url); } catch (e) { cstat(false, 'Bad server address'); return; }
    cstat(null, 'Connecting…');
    ws.onopen = function () { wsTry = 0; if (S.session) ws.send(JSON.stringify({ join: S.session, out: 3, in: 4 })); cstat(true, 'Connected, waiting for chat'); };
    ws.onmessage = function (e) { cstat(true, 'Connected, chat is flowing'); handleRaw(e.data); };
    ws.onerror = function () { cstat(false, 'Connection error'); };
    ws.onclose = function () { cstat(false, 'Disconnected, retrying'); wsTry++; wsT = setTimeout(connect, Math.min(15000, 1500 * wsTry)); };
  }

  /* ---------- lighting ---------- */
  var LT = { glow: true, led: true, beams: false, lasers: false, ball: false, fog: false, spot: false, strobe: false, pulse: false, dark: false, wash: 'none', inten: 0.7, bpm: 124 };
  if (S.light) Object.keys(S.light).forEach(function (k) { if (k in LT) LT[k] = S.light[k]; });
  var WASHC = { pink: '#ff2f9e', blue: '#2f6bff', purple: '#8a3cff', cyan: '#20d8ff', amber: '#ff9a2f' };
  var LIGHTS = [['beams', 'Beams'], ['lasers', 'Lasers'], ['ball', 'Sparkles'], ['pulse', 'Beat pulse'], ['strobe', 'Strobe'], ['fog', 'Fog'], ['spot', 'Spotlight'], ['dark', 'Blackout'], ['glow', 'Glows'], ['led', 'LED strips']];
  var WASHES = [['none', 'No wash'], ['pink', 'Pink'], ['blue', 'Blue'], ['purple', 'Purple'], ['cyan', 'Cyan'], ['amber', 'Amber'], ['rainbow', 'Rainbow']];
  var PRESETS = { off: { beams: 0, lasers: 0, ball: 0, fog: 0, spot: 0, strobe: 0, pulse: 0, dark: 0, wash: 'none' }, chill: { beams: 0, lasers: 0, ball: 1, fog: 1, spot: 0, strobe: 0, pulse: 0, dark: 0, wash: 'pink' }, party: { beams: 1, lasers: 1, ball: 1, fog: 0, spot: 0, strobe: 0, pulse: 1, dark: 0, wash: 'rainbow' }, dark: { beams: 0, lasers: 0, ball: 0, fog: 1, spot: 1, strobe: 0, pulse: 0, dark: 0, wash: 'purple' } };
  var dropT = null, spotTarget = null, spotT = null;
  function applyPreset(n) { var p = PRESETS[n]; Object.keys(p).forEach(function (k) { LT[k] = k === 'wash' ? p[k] : !!p[k]; }); lightUI(); }
  function lightCmd(n) {
    if (PRESETS[n]) { clearTimeout(dropT); applyPreset(n); return; }
    if (n === 'drop') { clearTimeout(dropT); applyPreset('party'); LT.strobe = true; LT.beams = true; lightUI(); dropT = setTimeout(function () { LT.strobe = false; lightUI(); }, 8000); return; }
    if (n === 'blackout') n = 'dark';
    if (n === 'dark') { LT.dark = !LT.dark; lightUI(); return; }
    if (WASHES.some(function (w) { return w[0] === n; })) { LT.wash = n; lightUI(); return; }
    if (n in LT && typeof LT[n] === 'boolean') { LT[n] = !LT[n]; lightUI(); }
  }
  function lightFor(k, on, u) { /* temporary light that follows a person */ if (k === 'spot') { LT._spotHold = on; spotTarget = on ? u : null; lightUI(); } }
  function lightUI() {
    var I = LT.inten, on = function (k) { return !!LT[k]; };
    var beat = 60 / LT.bpm;
    $('fog').style.opacity = on('fog') ? I : 0;
    var w = $('wash'); w.classList.toggle('rainbow', LT.wash === 'rainbow');
    w.style.backgroundColor = WASHC[LT.wash] || 'transparent'; w.style.opacity = LT.wash === 'none' ? 0 : Math.min(1, I * 0.65);
    var p = $('pulse'); p.style.setProperty('--beat', beat + 's'); p.style.setProperty('--i', I * 0.7); p.classList.toggle('on', on('pulse'));
    var s = $('strobe'); s.style.setProperty('--i', I * 0.55); s.classList.toggle('on', on('strobe'));
    var sp = $('spot'), spotOn = on('spot') || LT._spotHold; sp.style.opacity = spotOn ? 1 : 0; sp.style.setProperty('--sa', 0.35 + I * 0.5);
    $('dark').style.opacity = on('dark') ? 0.82 : 0;
    $('glows').style.opacity = on('glow') ? Math.min(1, 0.35 + I * 0.8) : 0; $('led').style.opacity = on('led') ? 1 : 0;
    clearInterval(spotT);
    if (spotOn) { spotMove(); if (!LT._spotHold) spotT = setInterval(spotMove, 4500); }
    var any = LT.beams || LT.lasers || LT.ball; if (any && !raf) raf = requestAnimationFrame(frame);
    Array.prototype.forEach.call(document.querySelectorAll('#lights button, #washes button, #presets button'), function (b) {
      var k = b.dataset.k; if (!k) return;
      var pr = k.indexOf('wash:') === 0 ? LT.wash === k.slice(5) : (typeof LT[k] === 'boolean' ? LT[k] : false);
      b.setAttribute('aria-pressed', String(pr));
    });
    $('inten').value = Math.round(I * 100); $('bpm').value = LT.bpm;
    S.light = { glow: LT.glow, led: LT.led, beams: LT.beams, lasers: LT.lasers, ball: LT.ball, fog: LT.fog, spot: LT.spot, strobe: LT.strobe, pulse: LT.pulse, dark: LT.dark, wash: LT.wash, inten: LT.inten, bpm: LT.bpm }; save();
  }
  function spotMove() {
    var t = spotTarget, x, y;
    if (!t) { var ins = order.map(function (k) { return users[k]; }).filter(function (u) { return u.inside && u.slot; }); t = ins[Math.floor(Math.random() * ins.length)]; }
    if (t && t.slot) { x = t.x; y = t.y - t.h * 0.55; } else { var f = rect('floor'); x = f.x + f.w / 2; y = f.y + f.h * 0.5; }
    var sp = $('spot'); sp.style.setProperty('--sx', x + 'px'); sp.style.setProperty('--sy', y + 'px');
    if (spotTarget) { clearTimeout(spotFollow); spotFollow = setTimeout(function () { if (spotTarget) spotMove(); }, 300); }
  }
  var spotFollow = null;
  var raf = null, cv = $('fxc'), g = cv.getContext('2d'), SPK = [], lastF = 0, i0;
  for (i0 = 0; i0 < 110; i0++) SPK.push({ a: Math.random() * 6.28, r: 60 + Math.random() * 520, s: 0.5 + Math.random() * 1.5, p: Math.random() * 6.28 });
  var BCOL = ['#ff4fb0', '#4fe3ff', '#a78bff', '#ffd86b', '#9bf06b'];
  function frame(t) {
    raf = null;
    if (!(LT.beams || LT.lasers || LT.ball)) { g.clearRect(0, 0, W, H); return; }
    if (t - lastF < 33) { raf = requestAnimationFrame(frame); return; }
    lastF = t; g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    var I = LT.inten, i;
    var f = rect('floor'), fcx = f.x + f.w / 2;
    if (LT.beams) {
      for (i = 0; i < 6; i++) {
        var ox = [120, 480, 1130, 1270, 1560, 1850, 1400][i], ang = Math.sin(t / 1400 + i * 1.3) * 0.55 + (i - 3) * 0.1, half = 0.085, len = 1300, c = BCOL[i % 5];
        var x1 = ox + Math.sin(ang - half) * len, y1 = Math.cos(ang - half) * len, x2 = ox + Math.sin(ang + half) * len, y2 = Math.cos(ang + half) * len;
        var gr = g.createLinearGradient(ox, 0, ox + Math.sin(ang) * len, Math.cos(ang) * len);
        gr.addColorStop(0, c + 'cc'); gr.addColorStop(1, c + '00');
        g.globalAlpha = 0.32 * I + 0.1; g.fillStyle = gr; g.beginPath(); g.moveTo(ox, 0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
      }
    }
    if (LT.lasers) {
      g.globalAlpha = 0.85 * I + 0.1; g.lineWidth = 2.5; g.shadowBlur = 14;
      [[40, 30, 1], [W - 40, 30, -1]].forEach(function (s, si) {
        for (i = 0; i < 7; i++) {
          var a = s[2] * (0.25 + i * 0.12) + Math.sin(t / 650 + i * 0.8 + si) * 0.32, col = BCOL[(i + si * 2) % 5];
          g.strokeStyle = col; g.shadowColor = col; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[0] + Math.sin(a) * 2400, s[1] + Math.cos(a) * 2400); g.stroke();
        }
      });
      g.shadowBlur = 0;
    }
    if (LT.ball) {
      var sp = R.sparkle;
      SPK.forEach(function (s) {
        var a = s.a + t / 5000 * s.s, x = sp[0] + (0.5 + 0.5 * Math.cos(a + s.p)) * sp[2], y = sp[1] + (0.5 + 0.5 * Math.sin(a * 1.3 + s.r)) * sp[3], tw = 0.5 + 0.5 * Math.sin(t / 220 + s.p);
        g.globalAlpha = (0.2 + 0.7 * tw) * I; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 1.5 + 2.4 * tw, 0, 6.28); g.fill();
      });
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }

  /* ---------- tips strip ---------- */
  var TIPS = [['Type', '!enter', 'to join the club'], ['Pick a move:', '!dance', 'groove · pump · wave · shuffle · bboy · twerk · snake'], ['Change your fit:', '!look', 'varsity black cargo green ankle'], ['Grab a drink:', '!bar', '· back to dancing: !floor · !leave any time']], ti = 0;
  function tip() {
    var c = $('cmd'), t = TIPS[ti++ % TIPS.length]; c.innerHTML = '<span>' + t[0] + ' <b>' + t[1] + '</b> ' + t[2] + '</span>';
  }
  function placeFixed() {
    var c = rect('cmd'), cm = $('cmd'); cm.style.left = c.x + 'px'; cm.style.top = c.y + 'px'; cm.style.width = c.w + 'px'; cm.style.height = c.h + 'px'; cm.style.fontSize = Math.max(16, Math.min(34, c.h * 0.5)) + 'px';
    var zh = '', cols = { screen: '#4fe3ff', dj: '#ff7a6b', host: '#ff7a6b', cmd: '#9bf06b', door: '#ffffff' };
    Object.keys(R.zones).forEach(function (id) { var r = rect(id); zh += '<div class="z" style="left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;border-color:' + cols[id] + ';color:' + cols[id] + '">' + id + '</div>'; });
    var dots = '', zc = { floor: '#ff4fb0', bar: '#ff9a4d', vip: '#ffd86b' };
    ['floor', 'bar', 'vip'].forEach(function (z) { SL[z].forEach(function (s) { dots += '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + Math.max(4, s.d * 0.12) + '" fill="' + zc[z] + '"/><rect x="' + (s.x - s.d / 2) + '" y="' + (s.y - s.d * 2) + '" width="' + s.d + '" height="' + (s.d * 2) + '" fill="none" stroke="' + zc[z] + '" stroke-opacity=".25"/>'; }); });
    var pts = R.path.map(function (p) { return p.join(','); }).join(' ');
    zh += '<svg style="position:absolute;left:0;top:0" width="' + W + '" height="' + H + '">' + dots + '<polyline points="' + pts + '" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 8"/>' +
      R.bars.map(function (b) { return '<polyline points="' + b.edge.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#ff9a4d" stroke-width="3"/>'; }).join('') + '<circle cx="' + SL.nicki.x + '" cy="' + SL.nicki.y + '" r="8" fill="#ff4fb0"/></svg>';
    $('zones').innerHTML = zh;
  }
  var zonesOn = false;

  /* ---------- panel ---------- */
  function vipUI() { $('viptxt').value = S.vip.join('\n'); $('vipn').textContent = S.vip.length + ' on the list'; $('modn').textContent = S.mods.map(function (m) { return '@' + m; }).join(', '); }
  function layoutJSON() { return JSON.stringify(R, null, 1); }
  function applyLayout(txt) {
    var j = JSON.parse(txt);
    ['zones', 'persp', 'rows', 'bars', 'vip', 'nicki', 'path', 'sparkle'].forEach(function (k) { if (j[k]) R[k] = j[k]; });
    if (isFinite(j.scale)) R.scale = Number(j.scale);
    placeFixed(); relayout(); save();
  }
  function buildPanel() {
    $('lights').innerHTML = LIGHTS.map(function (l) { return '<button type="button" data-k="' + l[0] + '" aria-pressed="false">' + l[1] + '</button>'; }).join('');
    $('washes').innerHTML = WASHES.map(function (l) { return '<button type="button" data-k="wash:' + l[0] + '" aria-pressed="false">' + l[1] + '</button>'; }).join('');
    $('presets').innerHTML = [['chill', 'Chill'], ['party', 'Party'], ['drop', 'The drop (8s)'], ['dark', 'Dark + spot'], ['off', 'Lights off']].map(function (l) { return '<button type="button" data-p="' + l[0] + '" class="go">' + l[1] + '</button>'; }).join('');
    $('lights').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; lightCmd(b.dataset.k); };
    $('washes').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; LT.wash = b.dataset.k.slice(5); lightUI(); };
    $('presets').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; lightCmd(b.dataset.p); };
    $('inten').oninput = function () { LT.inten = this.value / 100; lightUI(); };
    $('bpm').onchange = function () { LT.bpm = Math.max(60, Math.min(200, Number(this.value) || 124)); lightUI(); };
    var taps = []; $('tap').onclick = function () { var n = Date.now(); taps = taps.filter(function (t) { return n - t < 2500; }); taps.push(n); if (taps.length > 2) { var av = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); LT.bpm = Math.max(60, Math.min(200, Math.round(60000 / av))); lightUI(); } };
    $('sess').value = S.session; $('wsurl').value = S.ws;
    $('conn').onclick = function () { S.session = $('sess').value.trim(); S.ws = $('wsurl').value.trim(); save(); connect(); };
    $('nrehearse').onclick = nickiRehearse;
    $('nout').onclick = function () { var n = users['x:nickiminaj']; if (n && n.inside) nickiWalkOut(n); else log('Nicki is not inside.'); };
    $('top5btn').setAttribute('aria-pressed', String(S.top5)); $('top5btn').onclick = function () { setTop5(!S.top5); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-sim]'), function (b) { b.onclick = function () { var p = b.dataset.sim.split(':'); addBots(Number(p[1]), p[0]); }; });
    $('npset').onclick = function () { setNP($('npa_in').value, $('npt_in').value); };
    $('npclr').onclick = function () { $('npa_in').value = ''; $('npt_in').value = ''; setNP('', ''); };
    $('npurl').value = S.npUrl || ''; $('npurl').onchange = function () { S.npUrl = this.value.trim(); save(); npStart(); };
    $('npa_in').value = S.np.a; $('npt_in').value = S.np.t;
    $('nnew').onclick = function () { S.nickiDone = false; order.forEach(function (k) { users[k].show = 0; }); top5Sig = ''; top5Update(true); save(); log('New show: her entrance will play on her next chat, and the chat counts for the top 5 start again.'); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-bots]'), function (b) { b.onclick = function () { addBots(Number(b.dataset.bots)); }; });
    $('bchat').onclick = function () { botsChat(); };
    $('bclear').onclick = function () { order.slice().forEach(function (k) { var u = users[k]; u.inside = false; unseat(u, false); }); order = []; Object.keys(users).forEach(function (k) { delete users[k]; }); S.users = {}; overflowUI(); save(); };
    $('ssend').onclick = function () {
      var h = $('sh').value.trim() || '@tester', p = $('sp').value, t = $('sm').value.trim() || '!enter';
      onMessage({ type: p === 'x' ? 'twitter' : p, userid: h.replace(/^@/, ''), chatname: h.replace(/^@/, ''), chatmessage: t });
    };
    $('sm').onkeydown = function (e) { if (e.key === 'Enter') $('ssend').click(); };
    $('vipsave').onclick = function () { S.vip = $('viptxt').value.split(/[\s,]+/).filter(Boolean).map(function (h) { return '@' + norm(h); }); vipUI(); order.forEach(function (k) { var u = users[k]; var was = u.vip; refreshVip(u); if (u.inside && was !== u.vip) { u.d = 0; seat(u, false); } }); save(); };
    $('vipexp').onclick = function () { var t = S.vip.join('\n'), ta = $('viptxt'); ta.value = t; ta.select(); try { document.execCommand('copy'); } catch (e) {} };
    $('laytxt').value = layoutJSON();
    $('layapply').onclick = function () { try { applyLayout($('laytxt').value); $('laytxt').value = layoutJSON(); log('Layout applied.'); } catch (e) { log('Layout error: ' + e.message); } };
    $('layreset').onclick = function () { R = clone(DEFROOM); placeFixed(); relayout(); $('laytxt').value = layoutJSON(); $('cscale').value = Math.round(R.scale * 100); save(); };
    $('cscale').value = Math.round(R.scale * 100);
    $('cscale').oninput = function () { R.scale = this.value / 100; placeFixed(); relayout(); $('laytxt').value = layoutJSON(); save(); };
    $('zonebtn').onclick = function () { zonesOn = !zonesOn; this.setAttribute('aria-pressed', String(zonesOn)); $('zones').style.display = zonesOn ? 'block' : 'none'; };
    $('zones').style.display = 'none';
    $('bgfile').onchange = function () { var f = this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { localStorage.setItem(KEYBG, r.result); } catch (e) { log('Image too big to keep. It will show until you reload.'); } $('art').style.backgroundImage = 'url("' + r.result + '")'; S.bg = true; $('bgtog').setAttribute('aria-pressed', 'true'); }; r.readAsDataURL(f); };
    $('bgclear').onclick = function () { try { localStorage.removeItem(KEYBG); } catch (e) {} setBg(); };
    $('bgtog').setAttribute('aria-pressed', String(S.bg));
    $('bgtog').onclick = function () { S.bg = !S.bg; this.setAttribute('aria-pressed', String(S.bg)); setBg(); save(); };
    $('holeck').onchange = function () { S.hole = this.checked; save(); applyHole(); }; applyHole();
    $('needd').value = S.need.d; $('needc').value = S.need.c; $('maxs').value = S.maxOn;
    $('rules').onclick = function () { S.need = { d: Math.max(0, Number($('needd').value) || 0), c: Math.max(0, Number($('needc').value) || 0) }; S.maxOn = Math.max(100, Number($('maxs').value) || 400); save(); relayout(); };
    var ADM = Q.get('admin') === '1'; if (!ADM) { $('hot').style.display = 'none'; } else { $('hot').onclick = function () { document.body.classList.toggle('pan'); }; }
    addEventListener('keydown', function (e) { if (!ADM) return; if (/input|textarea|select/i.test((e.target.tagName || ''))) return; if (e.key === 'p' || e.key === 'P') document.body.classList.toggle('pan'); });
    if (ADM && Q.get('panel') === '1') document.body.classList.add('pan');
    var ins = document.createElement('span'); ins.id = 'inside'; ins.style.display = 'none'; document.body.appendChild(ins);
  }

  /* ---------- test bots ---------- */
  var BN = ['Jay', 'Mia', 'Dre', 'Lux', 'Ana', 'Kai', 'Zoe', 'Rio', 'Tay', 'Nia', 'Rex', 'Eli', 'Sky', 'Bre', 'Cam', 'Dev', 'Fox', 'Gia', 'Hal', 'Ivy'];
  var botN = 0;
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function addBots(n, mode) {
    var P = ['x', 'kick', 'tiktok'], i;
    for (i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          var p = pick(P), name = pick(BN) + (++botN), key = p + ':' + norm(name), u = newUser(key, name, p, null); u.hnd = norm(name);
          u.dances = 99; u.chats = 99;
          var tops = CATALOG.looks.filter(function (l) { return l.unlock !== 'nicki' && l.unlock !== 'vip'; });
          u.look.top = pick(tops).id; u.look.bottom = pick(CATALOG.bottoms).id; u.look.shoes = pick(CATALOG.shoes).id; u.look.height = pick(CATALOG.heights).id; u.look.skin = pick(CATALOG.skin).id;
          if (Math.random() < 0.6) { u.look.hair = pick(CATALOG.hair.styles).id; u.look.hairColor = pick(CATALOG.hair.colors).id; }
          if (Math.random() < 0.4) { u.look.acc = [pick(CATALOG.accessories.items).id]; u.look.accColor = pick(CATALOG.accessories.colors).id; }
          if (Math.random() < 0.5) u.look.topColor = pick(CL_IDS);
          u.dance = pick(DANCES);
          if (mode === 'bar') u.atBar = true;
          if (mode === 'vip') { u.simVip = true; u.plat = 'x'; }
          enter(u);
        }, i * 60);
      })(i);
    }
  }
  function botsChat() {
    var ins = order.map(function (k) { return users[k]; }).filter(function (u) { return u.inside && u.slot; }), i;
    for (i = 0; i < Math.min(14, ins.length); i++) { var u = pick(ins); onMessage({ type: u.plat === 'x' ? 'twitter' : u.plat, userid: u.hnd, chatname: u.name, chatmessage: pick(['!dance', '!dance spin', '!dance twerk', '!bar', '!look chrome pink shades gold', '!look bomber black tall wavy blonde', 'lol', 'yesss', 'turn it up', '🔥🔥🔥']) }); }
  }

  /* ---------- remote control (iPad / phone panel over the Social Stream Ninja relay) ---------- */
  var RC = { ws: null, bc: null, id: Math.random().toString(36).slice(2, 8), T: null, tries: 0, up: false, lastSnap: '', lastPing: 0 };
  function ctlRoom() { return 'vnn-' + (S.session || 'local') + (S.pin ? '-' + S.pin : ''); }
  function rcSend(o) {
    o.from = RC.id; var s = JSON.stringify({ vnn: o });
    if (RC.ws && RC.ws.readyState === 1) { try { RC.ws.send(s); } catch (e) {} }
    if (RC.bc) { try { RC.bc.postMessage(s); } catch (e) {} }
  }
  function rcAck(id, ok, msg) { rcSend({ t: 'ack', id: id, ok: ok, msg: msg || '' }); }
  function rcFind(a) {
    if (a.key && users[a.key]) return users[a.key];
    if (a.h) { var h = norm(a.h), p = a.p || 'x', k = p + ':' + h; if (users[k]) return users[k]; for (var q in users) if (users[q].hnd === h) return users[q]; return null; }
    return null;
  }
  function rcUser(a) { var u = rcFind(a); if (!u && a.h) { var h = norm(a.h), p = a.p || 'x'; u = newUser(p + ':' + h, a.name || h, p, a.photo || null); u.hnd = h; refreshVip(u); } return u; }
  var RCMD = {
    ping: function () { rcSnap(true); },
    light: function (a) { lightCmd(String(a.n)); },
    wash: function (a) { LT.wash = String(a.n); lightUI(); },
    inten: function (a) { LT.inten = Math.max(0.1, Math.min(1, a.v / 100)); lightUI(); },
    bpm: function (a) { LT.bpm = Math.max(60, Math.min(200, Number(a.v) || 124)); lightUI(); },
    'nicki.rehearse': function () { nickiRehearse(); },
    'nicki.out': function () { var n = users['x:nickiminaj']; if (n && n.inside) nickiWalkOut(n); else throw new Error('Nicki is not inside'); },
    'show.new': function () { S.nickiDone = false; order.forEach(function (k) { users[k].show = 0; }); top5Sig = ''; top5Update(true); save(); },
    top5: function (a) { setTop5(a.on === undefined ? !S.top5 : !!a.on); },
    np: function (a) { setNP(String(a.a || ''), String(a.t || '')); },
    banner: function (a) { banner(String(a.t || '').slice(0, 60), String(a.s || '').slice(0, 80), 4200); },
    'crowd.clear': function () { RCMD_clear(); },
    bots: function (a) { addBots(Math.min(300, Number(a.n) || 1), a.mode); },
    botschat: function () { botsChat(); },
    chat: function (a) { var h = String(a.h || 'tester').replace(/^@/, ''), p = a.p || 'x'; onMessage({ type: p === 'x' ? 'twitter' : p, userid: h, chatname: h, chatmessage: String(a.m || '!enter') }); },
    'vip.set': function (a) { S.vip = (a.list || []).map(function (h) { return '@' + norm(h); }).filter(function (h) { return h.length > 1; }); vipUI(); order.forEach(function (k) { var u = users[k], was = u.vip; refreshVip(u); if (u.inside && was !== u.vip) { u.d = 0; seat(u, false); } }); save(); },
    'mods.set': function (a) { S.mods = (a.list || []).map(norm).filter(Boolean); vipUI(); save(); },
    rules: function (a) { S.need = { d: Math.max(0, Number(a.d) || 0), c: Math.max(0, Number(a.c) || 0) }; S.maxOn = Math.max(100, Number(a.max) || 400); save(); relayout(); },
    scale: function (a) { R.scale = Math.max(0.5, Math.min(1.3, a.v / 100)); placeFixed(); relayout(); save(); },
    'user.kick': function (a) { var u = rcFind(a); if (!u) throw new Error('not found'); leave(u); },
    'user.bar': function (a) { var u = rcFind(a); if (!u) throw new Error('not found'); u.atBar = true; seat(u, false); },
    'user.floor': function (a) { var u = rcFind(a); if (!u) throw new Error('not found'); u.atBar = false; seat(u, false); },
    'user.vip': function (a) { var u = rcUser(a); if (!u) throw new Error('need a handle'); var t = u.hnd; if (S.vip.map(norm).indexOf(t) < 0) S.vip.push('@' + t); refreshVip(u); vipUI(); if (u.inside) { u.d = 0; seat(u, false); say(u, 'VIP', 2600, true); } save(); },
    'user.unvip': function (a) { var u = rcFind(a); var t = u ? u.hnd : norm(a.h); S.vip = S.vip.filter(function (h) { return norm(h) !== t; }); if (u) { u.simVip = false; refreshVip(u); if (u.inside) { u.d = 0; seat(u, false); } } vipUI(); save(); },
    'user.spot': function (a) { var u = rcFind(a); if (!u) throw new Error('not found'); var on = !(LT._spotHold && spotTarget === u); lightFor('spot', on, u); },
    'user.grant': function (a) { var u = rcUser(a); if (!u) throw new Error('need a handle'); u.grant = a.on === false ? false : true; if (u.inside) { u.d = 0; seat(u, true); } save(); },
    'user.say': function (a) { var u = rcFind(a); if (!u) throw new Error('not found'); say(u, String(a.t || '').slice(0, 40), 3200); },
    'user.look': function (a) {
      var u = rcUser(a); if (!u) throw new Error('need a handle');
      var notes = applyLook(u, String(a.look || ''), true);
      if (a.dance && normD(a.dance)) { u.dance = normD(a.dance); u.dirty = 1; }
      u.d = 0; if (u.inside) { seat(u, true); say(u, 'new look', 2800); } save();
      return notes.length ? notes.join(' · ') : '';
    }
  };
  function RCMD_clear() { order.slice().forEach(function (k) { var u = users[k]; u.inside = false; unseat(u, false); }); order = []; Object.keys(users).forEach(function (k) { delete users[k]; }); S.users = {}; overflowUI(); save(); }
  function rcRecv(d) {
    var p = d && d.vnn; if (!p || p.from === RC.id) return;
    if (p.t === 'hello') { rcSnap(true); return; }
    if (p.t !== 'cmd') return;
    var f = RCMD[p.c];
    if (!f) { rcAck(p.id, false, 'unknown command'); return; }
    try { var r = f(p.a || {}); rcAck(p.id, true, r || ''); } catch (e) { rcAck(p.id, false, e.message); }
    setTimeout(function () { rcSnap(true); }, 120);
  }
  function rcUnwrap(data) {
    var j; try { j = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return; }
    (function walk(x, n) { if (!x || n > 5) return; if (x.vnn) return rcRecv(x); if (Array.isArray(x)) return x.forEach(function (y) { walk(y, n + 1); }); if (x.overlayNinja) walk(x.overlayNinja, n + 1); if (x.dataReceived) walk(x.dataReceived, n + 1); if (x.contents) walk(x.contents, n + 1); })(j, 0);
  }
  function rcZone(u) { return u.stage && S.top5 ? 'stage' : (u.atBar ? 'bar' : (u.vip && !isNicki(u) ? 'vip' : 'floor')); }
  function rcSnap(force) {
    var cnt = { total: 0, floor: 0, bar: 0, vip: 0, stage: 0 }, people = [];
    order.forEach(function (k) { var u = users[k]; if (!u || !u.inside) return; cnt.total++; var z = rcZone(u); cnt[z]++; people.push({ k: u.key, n: u.name, p: u.plat, h: u.hnd, z: z, c: u.chats, d: u.dances, v: !!u.vip, e: !!isEarned(u), nk: isNicki(u), la: u.lastActive || 0 }); });
    people.sort(function (a, b) { return b.la - a.la; });
    var top = []; order.forEach(function (k) { var u = users[k]; if (u && u.inside && u.stage && S.top5) top[u.rank || 0] = { n: u.name, s: u.show }; });
    var L = {}; Object.keys(LT).forEach(function (k) { if (k.charAt(0) !== '_') L[k] = LT[k]; });
    var snap = { t: 'state', ver: 1, ssn: !!(ws && ws.readyState === 1), cnt: cnt, k: CROWDK, top5: !!S.top5, top: top.filter(Boolean), light: L, np: S.np, vip: S.vip, mods: S.mods, need: S.need, maxOn: S.maxOn, scale: R.scale, nicki: { done: !!S.nickiDone, inside: !!(users['x:nickiminaj'] && users['x:nickiminaj'].inside) }, people: people.slice(0, 200), log: (logEl.textContent || '').split('\n').slice(0, 12) };
    var sig = JSON.stringify(snap); if (!force && sig === RC.lastSnap) return; RC.lastSnap = sig; rcSend(snap);
  }
  function rcStart() {
    clearTimeout(RC.T);
    try { if (!RC.bc && window.BroadcastChannel) { RC.bc = new BroadcastChannel(ctlRoom()); RC.bc.onmessage = function (e) { rcUnwrap(e.data); }; } } catch (e) {}
    if (RC.ws) { try { RC.ws.onclose = null; RC.ws.close(); } catch (e) {} RC.ws = null; }
    var url = Q.get('ctlws') || S.ctlws || S.ws || 'wss://io.socialstream.ninja';
    try { RC.ws = new WebSocket(url); } catch (e) { return; }
    RC.ws.onopen = function () { RC.tries = 0; RC.up = true; RC.ws.send(JSON.stringify({ join: ctlRoom(), in: 5, out: 6 })); rcSnap(true); };
    RC.ws.onmessage = function (e) { rcUnwrap(e.data); };
    RC.ws.onclose = function () { RC.up = false; RC.tries++; RC.T = setTimeout(rcStart, Math.min(15000, 1500 * RC.tries)); };
    RC.ws.onerror = function () {};
  }
  setInterval(function () { rcSnap(false); }, 1500);
  setInterval(function () { rcSnap(true); }, 12000);

  /* ---------- boot ---------- */
  buildSlots(); placeFixed(); buildGlows(); buildLed(); buildBartenders(); setBg(); buildPanel(); setNP(S.np.a, S.np.t); npStart(); vipUI(); lightUI(); tip(); setInterval(tip, 8000); connect(); rcStart();
  Object.keys(S.users || {}).forEach(function (k) { var sv = S.users[k]; if (sv.inside) { var u = newUser(k, sv.name, sv.plat, sv.photo); u.hnd = k.split(':')[1]; u.inside = true; refreshVip(u); order.push(k); } });
  relayout();
  window.__vnn = { perf: function () { return { stride: STRIDE, ms: +fpsMs.toFixed(1), dt: +dtAvg.toFixed(1), cache: VNNA.cacheSize(), n: crowdList().length }; }, top5: setTop5, fit: autoFit, out: function () { var n = users['x:nickiminaj']; if (n) nickiWalkOut(n); }, k: function () { return CROWDK; }, np: setNP, chat: onMessage, raw: handleRaw, users: users, state: function () { return { S: S, R: R, LT: LT }; }, light: lightCmd, bots: addBots, nicki: nickiRehearse, rc: rcRecv, snap: rcSnap };
})();
</script>
</body>
</html>
