
  /* ================= Virtual Nicki Night overlay ================= */
  var W = 1920, H = 1080;
  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id || (arr[i].alias && arr[i].alias.indexOf(id) >= 0)) return arr[i]; return null; }
  var Q = new URLSearchParams(location.search);
  /* avatar polish (on by default, ?polish=0 turns it off): sharper avatar scaling, outline + floor shadow, full-speed animation when the machine keeps up */
  var POL = Q.get('polish') !== '0', STG = 1; if (POL) document.documentElement.classList.add('polish');
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
  var S = { session: '__SESSION__', ws: '', vip: [], mods: ['kildadj_', 'mrnicki'], room: null, need: { d: 5, c: 20 }, maxOn: 400, top5: false, np: { a: '', t: '' }, npUrl: '', nickiDone: false, users: {}, light: null, bg: true, bub: { on: true, words: [], emoji: true } };
  try { var raw = localStorage.getItem(KEY); if (raw) { var sv = JSON.parse(raw); Object.keys(sv).forEach(function (k) { S[k] = sv[k]; }); } } catch (e) {}
  var CL = { on: false, ph: '', t: [] };
  var RW = { on: false, phase: '', picks: [], ords: [0, -1, 1, -2, 2], votes: {}, t: [], end: 0 };
  function stageOn() { return S.top5 || RW.on; }
  S.ss = Object.assign({ peak: 0, ent: {}, sd: {}, win: [] }, S.ss || {}); S.closing = S.closing || 'Thanks for coming! See you next time.';
  S.codes = Object.assign({ x_barb: { word: 'barbz', on: false }, x_pf2: { word: 'flight', on: false }, x_pink: { word: 'pinkprint', on: false }, x_gag: { word: 'gagcity', on: false } }, S.codes || {});
  S.spk = Object.assign({ on: true, amt: 0.7 }, S.spk || {});
  S.lite = S.lite === true || S.lite === 'auto' ? S.lite : false;
  S.blocked = S.blocked || {}; S.nophoto = S.nophoto || {}; var lastMsg = 0;
  S.bub = Object.assign({ on: true, words: [], emoji: true }, S.bub || {}); if (!Array.isArray(S.bub.words)) S.bub.words = [];
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
        Object.keys(users).forEach(function (k) { var u = users[k]; us[k] = { name: u.name, plat: u.plat, photo: u.photo, look: u.look, dance: u.dance, dances: u.dances, chats: u.chats, show: u.show, inside: u.inside, atBar: u.atBar, sx: u.slot ? Math.round(u.slot.x) : (u._sx != null ? u._sx : null), sy: u.slot ? Math.round(u.slot.y) : (u._sy != null ? u._sy : null), nickiLook: u.nickiLook, grant: !!u.grant, ear: u.ear, pg: u.pg }; });
        S.users = us; S.room = R; S.k = CROWDK;
        localStorage.setItem(KEY, JSON.stringify(S));
      } catch (e) {}
    }, 600);
  }

  /* ---------- stage scale ---------- */
  var stage = $('stage'), preview = !(window.obsstudio);
  if (Q.get('preview') === '0') preview = false;
  if (preview) document.body.classList.add('preview');
  function fit() { var s = Math.min(innerWidth / W, innerHeight / H); if (!preview) s = innerWidth / W; STG = s; stage.style.transform = 'scale(' + s + ')'; }
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
    if (typeof CITY !== 'undefined') CITY.set(S.bg && !img && S.cityOn !== false);
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
  var SL = { floor: [], bar: [], vip: [], stage: [], nicki: null }, CROWDK = 1, K_STEPS = [1, 0.92, 0.85, 0.78, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4, 0.35, 0.3, 0.26, 0.22];
  function stageBox(k) { var d = Math.max(30, avW(R.stage.y) * 1.2 * Math.max(k, 0.8)); return { d: d, x0: R.stage.x - d * 3.5, x1: R.stage.x + d * 3.5, y0: R.stage.y - d * 2.2, y1: R.stage.y + d * 1.35 + (RW.on ? 70 : 0) }; }
  function makeSlots(k) {
    var out = { floor: [], bar: [], vip: [], stage: [], nicki: null }, i;
    /* floor rows: base rows, plus in-between and back rows as the crowd shrinks */
    var rs = R.rows.map(function (q) { return { y: q.y, x0: q.x0, x1: q.x1 }; }), rows = [];
    rs.forEach(function (q, j) { rows.push(q); if (k < 0.8 && j < rs.length - 1) { var n = rs[j + 1]; rows.push({ y: (q.y + n.y) / 2, x0: (q.x0 + n.x0) / 2, x1: (q.x1 + n.x1) / 2 }); } });
    if (k < 0.65) { var f = rs[0]; rows.push({ y: f.y - 50, x0: f.x0 + 70, x1: f.x1 - 70 }); }
    if (k < 0.5) { var f2 = rs[0]; rows.push({ y: f2.y - 95, x0: f2.x0 + 130, x1: f2.x1 - 130 }); }
    if (k < 0.4) { var f3 = rs[0]; rows.push({ y: f3.y - 135, x0: f3.x0 + 190, x1: f3.x1 - 190 }); }
    if (k < 0.3) { var f4 = rs[0]; rows.push({ y: f4.y - 170, x0: f4.x0 + 240, x1: f4.x1 - 240 }); }
    rows.sort(function (a, b) { return a.y - b.y; });
    var sb = stageOn() ? stageBox(k) : null;
    rows.forEach(function (q, r) {
      var d = Math.max(18, avW(q.y) * k), n = Math.max(1, Math.floor((q.x1 - q.x0) / (d * (k < 0.4 ? 1.0 : 1.15)))), i2;
      for (i2 = 0; i2 < n; i2++) {
        var x = q.x0 + (i2 + 0.5) * (q.x1 - q.x0) / n;
        if (sb && x > sb.x0 && x < sb.x1 && q.y > sb.y0 && q.y < sb.y1) continue;
        out.floor.push({ x: x, y: q.y, d: d, r: r, z: 'floor', occ: null });
      }
    });
    if (stageOn()) {
      var sd = sb.d, ord = RW.on ? RW.ords : [0, -1, 1, -2, 2];
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

  /* the free slot closest to a point (used to keep people where they already are) */
  function nearestFree(zone, x, y) {
    var best = null, bd = 1e18;
    (SL[zone] || []).forEach(function (q) { if (q.occ) return; var dx = q.x - x, dy = (q.y - y) * 1.4, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = q; } });
    return best;
  }
  function slotKey(q) { return q.z + '|' + Math.round(q.x) + '|' + Math.round(q.y); }

  /* ---------- users ---------- */
  var users = {}, order = [];
  var FREE_TOPS = CATALOG.looks.filter(function (l) { return l.unlock === 'free' && !l.sig && !l.dress; });
  var NICKI_LOOKS = CATALOG.looks.filter(function (l) { return l.unlock === 'nicki'; });
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function norm(s) { return String(s || '').toLowerCase().replace(/^@/, '').replace(/\s+/g, '').trim(); }
  function blankLook() { return { body: null, top: null, topColor: null, bottom: null, bottomColor: null, shoes: null, shoesColor: null, height: null, hair: null, hairColor: null, skin: null, acc: [], accColor: null }; }
  function newUser(key, name, plat, photo) {
    if (S.nophoto && S.nophoto[key]) photo = null;
    var h = hash(key), u = users[key];
    if (!u) {
      var sv = S.users && S.users[key];
      u = users[key] = { key: key, name: name, plat: plat, photo: photo || null, look: blankLook(), dance: DANCES[h % 6], dances: 0, chats: 0, show: 0, inside: false, atBar: false, lastActive: 0, slot: null, el: null, ox: 0, h: 0, d: 0, nickiLook: null, vip: false, overflow: false, h32: h };
      if (sv) { u.look = Object.assign(blankLook(), sv.look); u.dance = normD(sv.dance) || u.dance; u.dances = sv.dances || 0; u.chats = sv.chats || 0; u.show = sv.show || 0; u.nickiLook = sv.nickiLook || null; u.grant = !!sv.grant; u.ear = sv.ear || {}; u.pg = sv.pg || null; u.atBar = !!sv.atBar; u._wasInside = !!sv.inside; u._sx = sv.sx != null ? sv.sx : null; u._sy = sv.sy != null ? sv.sy : null; }
    }
    if (name) u.name = name;
    if (photo) u.photo = photo;
    return u;
  }
  var EARN = VNNA.EARN;
  function PG(u) { return u.pg || (u.pg = { dnm: 0, dc: 0, lk: 0, it: {}, dr: 0, che: 0, sec: 0, early: 0, rwp: 0, rww: 0, t5: 0, lc: 0, cd: {} }); }
  function popc(n) { var c = 0; while (n) { c += n & 1; n >>= 1; } return c; }
  var TFN = {
    dn3: function (u) { return popc(PG(u).dnm) >= 3; }, dn7: function (u) { return popc(PG(u).dnm) >= 7; },
    lk2: function (u) { return PG(u).lk >= 2; }, lk8: function (u) { return Object.keys(PG(u).it).length >= 8; },
    dr1: function (u) { return PG(u).dr >= 1; }, dr3: function (u) { return PG(u).dr >= 3; },
    ch5: function (u) { return (u.show || 0) >= 5; }, ch25: function (u) { return (u.show || 0) >= 25; },
    che3: function (u) { return PG(u).che >= 3; }, st30: function (u) { return PG(u).sec >= 1800; },
    early: function (u) { return !!PG(u).early; }, rwp: function (u) { return !!PG(u).rwp; }, rww: function (u) { return !!PG(u).rww; },
    t5: function (u) { return !!PG(u).t5; }, lc: function (u) { return !!PG(u).lc; },
    reg: function (u) { return PG(u).dc >= S.need.d && (u.show || 0) >= S.need.c; },
    x_barb: function (u) { return !!PG(u).cd.x_barb; }, x_pf2: function (u) { return !!PG(u).cd.x_pf2; }, x_pink: function (u) { return !!PG(u).cd.x_pink; }, x_gag: function (u) { return !!PG(u).cd.x_gag; }
  };
  function itemName(id) { var all = [].concat(CATALOG.looks, CATALOG.bottoms, CATALOG.shoes, CATALOG.hair.styles, CATALOG.accessories.items), i; for (i = 0; i < all.length; i++) if (all[i].id === id) return all[i].name; return id; }
  function itemEarned(u, id) { var t = EARN.items[id]; return !!u.grant || !t || !!(u.ear && u.ear[t]); }
  function isEarned(u) { return !!u.grant || !!(u.ear && Object.keys(u.ear).length); }
  function hintFor(id) { var t = EARN.items[id]; return t ? EARN.tasks[t] : ''; }
  function evalTasks(u) {
    if (!u || isNicki(u)) return; u.ear = u.ear || {};
    var got = [];
    Object.keys(TFN).forEach(function (t) { if (!u.ear[t] && TFN[t](u)) { u.ear[t] = 1; got = got.concat(Object.keys(EARN.items).filter(function (i) { return EARN.items[i] === t; })); } });
    if (!got.length) return;
    var nm = got.map(itemName), txt = '🔓 ' + nm[0] + (nm.length > 1 ? ' +' + (nm.length - 1) : '');
    if (u.inside) { say(u, txt, 5200, true); try { emojiPop(u, '✨'); } catch (e) { } }
    log(u.name + ' unlocked ' + nm.join(', ')); u.dirty = 1; save();
  }
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
      else if (u.bt) { btFace(ctx, r, u); }
      else {
        var g = ctx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, 'hsl(' + hue + ',85%,72%)'); g.addColorStop(1, 'hsl(' + ((hue + 40) % 360) + ',70%,36%)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
        ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = '800 ' + Math.round(r * 1.1) + 'px system-ui,Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(u.name || '?').replace(/^[@\W_]+/, '').charAt(0).toUpperCase() || '♪', 0, r * .06);
      }
      ctx.restore(); if (u.plat !== 'none') { ctx.lineWidth = r * .09; ctx.strokeStyle = RING[u.plat] || '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); } ctx.restore();
    };
  }
  /* bartender faces: a drawn beauty-portrait face (until a generated photo is dropped into vnn/bartenders/) */
  function btFace(ctx, r, u) {
    var sk = byId(CATALOG.skin, u.look.skin) || CATALOG.skin[2], hx = sk.hex, rgb = [parseInt(hx.substr(1, 2), 16), parseInt(hx.substr(3, 2), 16), parseInt(hx.substr(5, 2), 16)];
    var lt = 'rgb(' + Math.min(255, rgb[0] + 38) + ',' + Math.min(255, rgb[1] + 30) + ',' + Math.min(255, rgb[2] + 26) + ')', dk = 'rgb(' + Math.round(rgb[0] * .72) + ',' + Math.round(rgb[1] * .66) + ',' + Math.round(rgb[2] * .64) + ')';
    var dark = (rgb[0] + rgb[1] + rgb[2]) < 330, g = ctx.createRadialGradient(-r * .25, -r * .35, r * .1, 0, 0, r * 1.05);
    g.addColorStop(0, lt); g.addColorStop(.55, hx); g.addColorStop(1, dk); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    /* cheek blush */
    [-1, 1].forEach(function (sd) { var bg = ctx.createRadialGradient(sd * r * .52, r * .26, 0, sd * r * .52, r * .26, r * .3); bg.addColorStop(0, dark ? 'rgba(255,90,130,.38)' : 'rgba(255,100,130,.45)'); bg.addColorStop(1, 'rgba(255,100,130,0)'); ctx.fillStyle = bg; ctx.fillRect(sd * r * .52 - r * .3, r * .26 - r * .3, r * .6, r * .6); });
    /* nose shadow */
    ctx.fillStyle = 'rgba(70,30,20,.16)'; ctx.beginPath(); ctx.ellipse(0, r * .2, r * .07, r * .1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-r * .02, r * .06, r * .035, r * .09, 0, 0, 7); ctx.fill();
    /* brows */
    ctx.strokeStyle = 'rgba(40,22,18,.85)'; ctx.lineCap = 'round'; ctx.lineWidth = r * .075;
    [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(sd * r * .17, -r * .36); ctx.quadraticCurveTo(sd * r * .4, -r * .5, sd * r * .62, -r * .33); ctx.stroke(); });
    /* eyes: almond, iris, highlight, winged liner + lashes */
    [-1, 1].forEach(function (sd) {
      var ex = sd * r * .38, ey = -r * .1;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ex - r * .24, ey + r * .01); ctx.quadraticCurveTo(ex, ey - r * .22, ex + r * .24, ey + r * .01); ctx.quadraticCurveTo(ex, ey + r * .15, ex - r * .24, ey + r * .01); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.moveTo(ex - r * .24, ey + r * .01); ctx.quadraticCurveTo(ex, ey - r * .22, ex + r * .24, ey + r * .01); ctx.quadraticCurveTo(ex, ey + r * .15, ex - r * .24, ey + r * .01); ctx.clip();
      var ig = ctx.createRadialGradient(ex, ey, 0, ex, ey, r * .13); ig.addColorStop(0, '#2a1208'); ig.addColorStop(.6, '#6b3a1c'); ig.addColorStop(1, '#2a1208'); ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ex, ey - r * .01, r * .125, 0, 7); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ex, ey - r * .01, r * .06, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(ex - r * .045, ey - r * .06, r * .035, 0, 7); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#1a0c0a'; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.moveTo(ex - sd * r * .26, ey + r * .02); ctx.quadraticCurveTo(ex, ey - r * .24, ex + sd * r * .24, ey + r * .0); ctx.lineTo(ex + sd * r * .36, ey - r * .09); ctx.stroke();
      ctx.lineWidth = r * .028; for (var l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(ex + sd * r * (.06 + l * .08), ey - r * (.17 - l * .01)); ctx.lineTo(ex + sd * r * (.1 + l * .1), ey - r * (.27 - l * .02)); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,150,190,.25)'; ctx.beginPath(); ctx.ellipse(ex, ey - r * .21, r * .2, r * .05, 0, 0, 7); ctx.fill();
    });
    /* lips: full, glossy */
    var lc = u.name === 'Kiki' || u.name === 'Bebe' ? '#e0306a' : '#d4204e', lg = ctx.createLinearGradient(0, r * .42, 0, r * .66); lg.addColorStop(0, lc); lg.addColorStop(1, '#a0123a');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(-r * .27, r * .52); ctx.quadraticCurveTo(-r * .13, r * .4, 0, r * .46); ctx.quadraticCurveTo(r * .13, r * .4, r * .27, r * .52); ctx.quadraticCurveTo(r * .12, r * .68, 0, r * .68); ctx.quadraticCurveTo(-r * .12, r * .68, -r * .27, r * .52); ctx.fill();
    ctx.strokeStyle = 'rgba(80,0,20,.55)'; ctx.lineWidth = r * .02; ctx.beginPath(); ctx.moveTo(-r * .26, r * .52); ctx.quadraticCurveTo(0, r * .57, r * .26, r * .52); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-r * .05, r * .6, r * .09, r * .025, 0, 0, 7); ctx.fill();
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
    var R = 1; u.R = R;
    u.cv.width = Math.round(cw * R); u.cv.height = Math.round(ch * R); if (R !== 1) u.cx.setTransform(R, 0, 0, R, 0, 0); if (old) u.cx.drawImage(old, 0, 0, cw, ch);
    if (u.sh) { var shw = u.fh * 0.46, shh = u.fh * 0.075; u.sh.style.width = shw + 'px'; u.sh.style.height = shh + 'px'; u.sh.style.left = (cw - shw) / 2 + 'px'; u.sh.style.top = (2003 * s0 - shh / 2) + 'px'; } u.cv.style.width = cw + 'px'; u.cv.style.height = ch + 'px'; u.inner.style.width = cw + 'px'; u.inner.style.height = ch + 'px';
    u.cw = cw; u.ch = ch; u.cv.style.marginLeft = '0'; u.dirty = 1; loadPhoto(u); build(u);
    if (u.pill) u.pill.style.bottom = 'calc(100% - ' + Math.round(250 * s0) + 'px)';
  }
  function makeEl(u) {
    var el = document.createElement('div'); el.className = 'p';
    el.innerHTML = '<div class="sh"></div><div class="in2"></div><div class="pill"></div>';
    u.el = el; u.sh = el.firstChild; u.inner = el.children[1]; u.pill = el.lastChild; u.cv = null; u.cx = null; u.h = 0; u.ghostD = 0; u.dirty = 1;
    $('crowd').appendChild(el);
  }
  /* one shared animation loop for everyone on screen */
  var FPSCAP = Math.max(10, Math.min(60, Number(new URLSearchParams(location.search).get('fps')) || 30)), lastDraw = 0;
  var dtRef = 17, dtSamp = [], bclk = 0, lastF = 0, frameN = 0, STRIDE = 1, dtAvg = 16, fpsMs = 0;
  function crowdList() { var a = []; order.forEach(function (k) { var u = users[k]; if (u && u.el && u.inside && u.cv) { if (u.set) a.push(u); else if (u.ghostD !== u.cw) { u.ghostD = u.cw; ghost(u); } } }); BT.forEach(function (u) { if (u.cv && u.set) a.push(u); }); return a; }
  /* speakers: placed on the room's floor planes; they thump with the beat clock (set the BPM in Lights) */
  var SPKR = [{ f: 'pal', x: 80, y: 338, h: 175, k: 'pa' }, { f: 'par', x: 1872, y: 352, h: 175, k: 'pa' }, { f: 'wl', x: 70, y: 455, h: 100, k: 'wl' }, { f: 'wr', x: 1868, y: 520, h: 100, k: 'wl' }, { f: 'sl', x: 585, y: 470, h: 58, k: 'sub' }, { f: 'sr', x: 1565, y: 392, h: 56, k: 'sub' }], SPKRE = [];
  function spkBuild() {
    var h = $('spk'); if (!h) return; h.innerHTML = ''; SPKRE = [];
    SPKR.forEach(function (c) { var im = new Image(); im.src = 'vnn/spk/' + c.f + '.png'; im.alt = ''; im.style.height = c.h + 'px'; im.style.left = '0'; im.style.top = '0'; im.dataset.x = c.x; im.dataset.y = c.y; im.dataset.k = c.k; im.onload = function () { im.style.left = Math.round(c.x - im.naturalWidth * c.h / im.naturalHeight / 2) + 'px'; im.style.top = Math.round(c.y - c.h) + 'px'; }; h.appendChild(im); SPKRE.push({ el: im, k: c.k, last: '' }); });
    spkShow();
  }
  function liteApply() { document.body.classList.toggle('lite', !!S.lite); }
  var slowT = 0;
  function spkShow() { var h = $('spk'); if (h) h.style.display = S.spk.on === false ? 'none' : ''; }
  function spkTick() {
    if (S.spk.on === false || !SPKRE.length) return;
    var ph = bclk % 1, kick = Math.exp(-ph * 7), a = (S.spk.amt == null ? 0.7 : S.spk.amt);
    SPKRE.forEach(function (o) {
      var sc = 1 + a * kick * (o.k === 'sub' ? 0.085 : o.k === 'pa' ? 0.04 : 0.05), v = 'scale(' + sc.toFixed(3) + (o.k === 'sub' ? ',' + (1 - a * kick * 0.04).toFixed(3) : '') + ')';
      if (v !== o.last) { o.last = v; o.el.style.transform = v; }
    });
  }
  function animate(now) {
    requestAnimationFrame(animate);
    var dt = Math.min(100, now - (lastF || now)); lastF = now; if (!dt) return;
    if (dtSamp && dtSamp.length < 140) { dtSamp.push(dt); if (dtSamp.length === 140) { var sm = dtSamp.slice(20).sort(function (a, b) { return a - b; }); dtRef = Math.max(15, Math.min(34, sm[Math.floor(sm.length * 0.25)])); dtSamp = null; } }
    dtAvg += (dt - dtAvg) * 0.05; bclk += dt / 1000 * LT.bpm / 60; spkTick();
    if (now - lastDraw < 1000 / FPSCAP - 4) return; lastDraw = now; frameN++;
    var list = crowdList(), n = list.length, base = n <= 30 ? 1 : n <= 70 ? 2 : n <= 140 ? 3 : 4;
    if (dtAvg > dtRef * 1.5 && STRIDE < 6) STRIDE = Math.min(6, Math.max(STRIDE, base) + 1); else if (dtAvg < dtRef * 1.2 && STRIDE > base) STRIDE--; else if (STRIDE < base) STRIDE = base;
    var t0 = performance.now();
    for (var i = 0; i < list.length; i++) {
      var u = list[i], wk = u.wk, nowMs = performance.now(), walkOpt = null, walking = false;
      if (wk) { var el0 = nowMs - wk.t0, wi = Math.min(1, el0 / 240), wo = nowMs > wk.t1 ? 1 - Math.min(1, (nowMs - wk.t1) / 300) : 1; if (nowMs > wk.t1 + 300) { u.wk = null; wk = null; } else { walking = true; if (nowMs < wk.t1) { var cp = curPos(u, nowMs); u.el.style.zIndex = zOf(u, cp[1]); } wk.cyc = Math.min(el0, wk.t1 - wk.t0) / 1000 * wk.spd / (u.fh * WALKCYC); walkOpt = { ph: wk.cyc, yaw: wk.yaw, k: 1, w: Math.min(wi, wo) }; } }
      var hot = u.stage || u.top || walking || (u.dr && (u.dr.act || u.dr.born > performance.now() / 1000 - 0.5)), st = hot ? 1 : STRIDE;
      if (!u.dirty && st > 1 && ((frameN + (u.h32 % st)) % st)) continue;
      var cx = u.cx; cx.clearRect(0, 0, u.cw, u.ch); u.dirty = 0;
      try {
        VNNA.draw(cx, u.set, u.spec, { st: u.rst || (u.rst = {}), now: performance.now() / 1000, x: u.cw / 2, y: 2005 * u.s0, h: u.fh, clip: VNNA.clipOf(u.dance), walk: walkOpt, t: bclk * 0.5, beat: 0.5, ph: (u.h32 % 16) / 4, amp: (u.stage && S.top5) ? 1.25 : (u.bt ? 0.7 : (u.dr ? 0.8 : 1)), hold: u.dr ? holdOf(u, performance.now() / 1000) : null, head: headFor(u) });
      } catch (e) { if (!u.err) { u.err = 1; console.error('draw', u.key, e); } }
      if (performance.now() - t0 > (u.dirty ? 34 : 14)) break;
    }
    fpsMs = performance.now() - t0;
    if (!S.lite && STRIDE >= 6 && dtAvg > Math.max(45, dtRef * 2.2)) { slowT += dt; if (slowT > 20000) { S.lite = 'auto'; liteApply(); save(); try { log('Performance mode switched on automatically (slow frames)'); } catch (e) {} rcSnap(true); } } else slowT = Math.max(0, slowT - dt);
  }
  function rebuildAll() { order.forEach(function (k) { var u = users[k]; if (u && u.cv) { u._sg = null; build(u); } }); BT.forEach(function (u) { if (u.cv) { u._sg = null; build(u); } }); }
  VNNA.setCache(260);
  VNNA.init(AB + 'lib_lo/', AB + 'moc.json').then(function () { ENGINE = true; rebuildAll(); }).catch(function (e) { ENGERR = String(e && e.message || e); console.error('avatar assets', e); var b = document.getElementById('cstat'); if (b) b.title = 'Avatar assets: ' + ENGERR; });
  requestAnimationFrame(animate);
  /* walking: straight lines at a pace that follows the avatar's size; the legs follow the distance travelled */
  var WALKSP = 2.1, WALKCYC = 0.95;
  function curPos(u, nowMs) { var w = u.wk; if (w && nowMs < w.t1) { var f = (nowMs - w.t0) / (w.t1 - w.t0); return [w.x0 + (w.x1 - w.x0) * f, w.y0 + (w.y1 - w.y0) * f]; } return [u.x == null ? 0 : u.x, u.y == null ? 0 : u.y]; }
  function zOf(u, y) { return Math.round(y) + ((u.top || (u.stage && stageOn())) ? 5000 : 0) + (u.pop ? 4000 : 0); }
  function put(u, x, y, dur, noWalk) {
    var now = performance.now(), from = curPos(u, now);
    u.x = x; u.y = y;
    var el = u.el;
    el.style.transitionDuration = dur + 's, .6s';
    el.style.transform = 'translate(' + (x - (u.cw || u.d) / 2 + (u.ox || 0)) + 'px,' + (y - u.h) + 'px) scale(' + ((u.sc || 1) * (u.pop ? 1.12 : 1)) + ')';
    el.style.zIndex = zOf(u, y);
    var dx = x - from[0], dy = y - from[1], dist = Math.hypot(dx, dy);
    if (dur > 0.05 && !noWalk && dist > 8) {
      el.style.transitionTimingFunction = 'linear, ease';
      var sgn = Math.abs(dx) > 3 ? (dx > 0 ? 1 : -1) : ((u.h32 & 1) ? 1 : -1), share = Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) + 1e-6);
      u.wk = { t0: now, t1: now + dur * 1000, x0: from[0], y0: from[1], x1: x, y1: y, yaw: sgn * (0.3 + 0.62 * share), spd: dist / dur, cyc: 0 };
      u.walkUntil = now + dur * 1000 + 320;
    } else { el.style.transitionTimingFunction = ''; if (!noWalk || dur <= 0.05) { if (u.wk && now >= u.wk.t1) u.wk = null; } }
    el.querySelector('.pill').style.fontSize = Math.max(11, Math.min(18, u.d * 0.16)) + 'px';
  }
  function walkTime(u, x, y) { var f = curPos(u, performance.now()), dx = x - f[0], dy = y - f[1], dist = Math.sqrt(dx * dx + dy * dy), sp = Math.max(70, Math.min(420, (u.d || 60) * 2 * WALKSP)); return Math.max(0.5, Math.min(8, dist / sp)); }
  function say(u, text, ms, gold) {
    if (!u.pill) return;
    u.pill.textContent = text; u.pill.className = 'pill show' + (gold ? ' gold' : '');
    clearTimeout(u.pt); u.pt = setTimeout(function () { u.pill.className = 'pill'; }, ms || 3200);
  }
  /* drink(): see the bar drinks section below */

  function zoneFor(u) { return u.stage && stageOn() ? 'stage' : (u.atBar ? 'bar' : (u.vip && !isNicki(u) ? 'vip' : 'floor')); }
  function seatedCount() { var n = 0; order.forEach(function (k) { var u = users[k]; if (u.inside && u.slot) n++; }); return n; }
  function release(u) { if (u.slot) { u.slot.occ = null; u.slot = null; } }
  function evictStalest() {
    var v = null;
    order.forEach(function (k) { var u = users[k]; if (!u.inside || !u.slot || u.vip || isNicki(u) || u.slot.z !== 'floor') return; if (!v || u.lastActive < v.lastActive) v = u; });
    return v;
  }
  function seat(u, instant) {
    var zone = zoneFor(u), s = null, nick = isNicki(u), old = u.slot;
    /* same zone as before? stay exactly where you are (a new look or a refresh must never move you) */
    if (old && !nick && old.z === zone && (SL[zone] || []).indexOf(old) >= 0 && old.occ === u.key) s = old;
    else release(u);
    if (nick) s = nickiSpot();
    else if (zone === 'stage' && !s) s = SL.stage[u.rank] || null;
    if (!s && u._sx != null) { s = nearestFree(zone === 'stage' ? 'floor' : zone, u._sx, u._sy); }
    u._sx = null;
    if (!s) s = pickSlot(zone === 'stage' ? 'floor' : zone, false);
    if (!s && zone !== 'floor' && zone !== 'stage') s = pickSlot('floor', false);
    if (!s) { u.overflow = true; if (u.el) u.el.classList.remove('in'); scheduleFit(); return false; }
    return place(u, s, instant);
  }
  /* put a person on a slot. Short shuffles glide; real trips walk. */
  function place(u, s, instant) {
    var nick = isNicki(u);
    s.occ = u.key; u.slot = s; u.overflow = false;
    if (!u.el) makeEl(u);
    var firstTime = !u.shown;
    if (u.d !== s.d || !u.h) draw(u, s.d);
    u.top = nick; if (u._restore) { instant = true; u._restore = false; }
    if (firstTime) {
      var dr = rect('door'); u.x = dr.x + dr.w / 2; u.y = dr.y + dr.h / 2;
      put(u, u.x, u.y, 0, true);
      void u.el.offsetWidth;
      u.shown = true;
    }
    u.el.classList.add('in');
    var cp = curPos(u, performance.now()), dist = Math.hypot(s.x - cp[0], s.y - cp[1]), dur = instant ? 0 : walkTime(u, s.x, s.y), short = !firstTime && dist < Math.max(18, s.d * 0.8);
    if (short && !instant) put(u, s.x, s.y, 0.5, true); else put(u, s.x, s.y, dur);
    drink(u, u.atBar && s.z === 'bar', short ? 0.5 : dur);
    rankTag(u, s.z === 'stage');
    return true;
  }
  function unseat(u, walkOut) {
    release(u); u.overflow = false;
    if (!u.el) return;
    var el = u.el;
    if (walkOut) {
      var dr = rect('door'), x = dr.x + dr.w / 2, y = dr.y + dr.h / 2, wd = walkTime(u, x, y);
      put(u, x, y, wd);
      setTimeout(function () { el.classList.remove('in'); }, Math.max(300, wd * 1000 - 450));
      setTimeout(function () { if (u.el === el && !u.inside) { el.remove(); u.el = null; u.shown = false; u.wk = null; } }, wd * 1000 + 1100);
    } else { el.classList.remove('in'); setTimeout(function () { el.remove(); }, 700); u.el = null; u.shown = false; }
  }
  /* rebuild the slots (crowd size / top-5 / rules changed) WITHOUT shuffling anyone:
     people whose spot still exists stay on it; the rest take the nearest free spot to where they stand */
  function relayout() {
    var list = order.map(function (k) { return users[k]; }).filter(function (u) { return u.inside; }), keys = {};
    list.forEach(function (u) { u._pk = u.slot ? slotKey(u.slot) : null; u._ox = u._back ? u._back[0] : (u.shown ? u.x : u._sx); u._oy = u._back ? u._back[1] : (u.shown ? u.y : u._sy); u._back = null; u.slot = null; });
    buildSlots(); if (typeof stageFx === 'function') stageFx();
    ['floor', 'bar', 'vip', 'stage'].forEach(function (z) { SL[z].forEach(function (q) { keys[slotKey(q)] = q; }); });
    var pend = [];
    list.forEach(function (u) {
      var zone = zoneFor(u), q = u._pk && keys[u._pk];
      if (isNicki(u)) { place(u, nickiSpot(), true); return; }
      if (zone === 'stage') { pend.push(u); return; }
      if (q && !q.occ && q.z === zone) { q.occ = u.key; u.slot = q; u.overflow = false; if (u.d !== q.d) { draw(u, q.d); put(u, q.x, q.y, 0.5, true); } return; }
      pend.push(u);
    });
    pend.sort(function (a, b) { return ((a.stage ? a.rank : 99) - (b.stage ? b.rank : 99)) || ((b.vip ? 1 : 0) - (a.vip ? 1 : 0)) || (order.indexOf(a.key) - order.indexOf(b.key)); });
    pend.forEach(function (u) {
      var zone = zoneFor(u), q = null;
      if (zone === 'stage') q = SL.stage[u.rank] || null;
      if (!q && u._ox != null) q = nearestFree(zone === 'stage' ? 'floor' : zone, u._ox, u._oy);
      if (!q && zone !== 'floor' && zone !== 'stage') q = (u._ox != null ? nearestFree('floor', u._ox, u._oy) : pickSlot('floor', false));
      if (!q) q = pickSlot(zone === 'stage' ? 'floor' : zone, false);
      if (!q) { u.overflow = true; if (u.el) u.el.classList.remove('in'); return; }
      place(u, q, false);
    });
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
    var nIn = order.filter(function (k) { return users[k].inside; }).length; $('inside').textContent = String(nIn); if (nIn > S.ss.peak) S.ss.peak = nIn;
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
  function lockNote(it) { return it.unlock === 'earned' ? '\uD83D\uDD12 ' + it.name + ' \u2014 ' + hintFor(it.id) : 'locked: ' + it.name; }
  function applyLook(u, text, force) {
    var p = parseLook(text, isNicki(u)), notes = [], c = u.look;
    if (p.nicki) { u.nickiLook = p.nicki; }
        var tp = p.top && byId(CATALOG.looks, p.top);
    if (tp && !force && ((tp.unlock === 'earned' && !itemEarned(u, tp.id)) || (tp.unlock === 'vip' && !u.vip))) { notes.push(lockNote(tp)); p.top = null; }
    var bp = p.bottom && byId(CATALOG.bottoms, p.bottom);
    var lk = function (it) { return it && ((it.unlock === 'earned' && !itemEarned(u, it.id)) || (it.unlock === 'vip' && !u.vip)); };
    if (bp && !force && lk(bp)) { notes.push(lockNote(bp)); p.bottom = null; }
    var shp = p.shoes && byId(CATALOG.shoes, p.shoes); if (shp && !force && lk(shp)) { notes.push(lockNote(shp)); p.shoes = null; }
    var hrp = p.hair && byId(CATALOG.hair.styles, p.hair); if (hrp && !force && lk(hrp)) { notes.push(lockNote(hrp)); p.hair = null; }
    if (p.acc.length && !force) p.acc = p.acc.filter(function (id) { var it = byId(CATALOG.accessories.items, id); if (lk(it)) { notes.push(lockNote(it)); return false; } return true; });
    ['top', 'topColor', 'bottom', 'bottomColor', 'shoes', 'shoesColor', 'height', 'hair', 'hairColor', 'skin', 'body'].forEach(function (k) { if (p[k]) c[k] = p[k]; });
    if (!force) { var pgi = PG(u).it; ['top', 'bottom', 'shoes', 'hair'].forEach(function (k) { if (p[k]) pgi[p[k]] = 1; }); (p.acc || []).forEach(function (a) { pgi[a] = 1; }); }
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
    if (CL.on && CL.ph !== 'last') return;
    S.ss.ent[u.key] = 1;
    if (u.inside && u.slot) { say(u, 'already inside', 2000); return; }
    u.inside = true; activate(u); refreshVip(u);
    if (order.indexOf(u.key) < 0) order.push(u.key);
    var pe = PG(u); if (!pe.entered) { pe.entered = 1; if (Object.keys(S.ss.ent).length <= 10) pe.early = 1; }
    if (seat(u, false)) say(u, (u.vip ? 'VIP ' : '') + u.name, 3500, u.vip); else overflowUI();
    evalTasks(u);
    overflowUI(); save(); scheduleFit();
  }
  function leave(u) { if (!u.inside) return; if (RW.on) rwDrop(u); u.inside = false; bubEnd(BUB.map[u.key]); unseat(u, true); overflowUI(); save(); scheduleFit(); }
  function handle(u, text) {
    var t = text.trim(), tl = t.toLowerCase(), cmd = tl.split(/\s+/)[0], rest = t.slice(cmd.length).trim();
    u.chats++; u.show = (u.show || 0) + 1; activate(u);
    if (isNicki(u) && !S.nickiDone && !nickiBusy) { nickiEntrance(u, false); }
    if (RW.on && RW.phase === 'vote' && /^[1-9]$/.test(t)) { rwVote(u, Number(t)); return; }
    if (cmd.charAt(0) !== '!') { if (u.inside) { bumpFront(u, t); evalTasks(u); } save(); return; }
    var mod = isMod(u);
    if (cmd === '!enter') { if (isNicki(u) && !u.inside) { nickiEntrance(u, false); return; } enter(u); return; }
    if (!u.inside && !(mod && /^!(vip|unvip|light|top5|np|nicki)$/.test(cmd))) { return; }
    if (cmd === '!leave') { if (isNicki(u)) nickiWalkOut(u); else leave(u); return; }
    if (cmd === '!dance') {
      var w = rest.toLowerCase().split(/\s+/)[0];
      u.dance = normD(w) || DANCES[Math.floor(Math.random() * DANCES.length)];
      var pgd = PG(u); pgd.dc++; pgd.dnm |= 1 << Math.max(0, DANCES.indexOf(u.dance)); evalTasks(u);
      u.dances++; u.dirty = 1; var sd = S.ss.sd[u.key] || (S.ss.sd[u.key] = [u.name, 0]); sd[1]++;
      say(u, byId(CATALOG.dances, u.dance).name.toLowerCase(), 2200); save(); return;
    }
    if (cmd === '!look') {
      var notes = applyLook(u, rest); PG(u).lk++; evalTasks(u); u.d = 0; seat(u, true);
      say(u, notes.length ? notes.join(' · ') : 'new look', 3200); save(); return;
    }
    if (cmd === '!drink' || cmd === '!order' || DRINKS[cmd.slice(1)]) {
      var dw = (cmd === '!drink' || cmd === '!order') ? rest.split(/\s+/)[0] : cmd.slice(1), dk = dw ? drinkKind(dw) : null;
      if (dw && !dk) { say(u, 'try: ' + DRINK_IDS.join(' \u00b7 '), 3600); return; }
      if (!orderDrink(u, dk, dk === 'shot' ? 'shot' : null)) say(u, 'the bar is full', 2400);
      return;
    }
    if (cmd === '!cheers') {
      if (!u.dr) { say(u, 'grab a drink first: !bar', 2800); return; }
      PG(u).che++; evalTasks(u); startAct(u, 'cheers', Math.max(0, u.dr.born - nowS()) + 0.1); say(u, '\uD83E\uDD42 cheers', 2400); emojiPop(u, '\uD83E\uDD42'); return;
    }
    if (cmd === '!earned' && rest) {
      var qh = norm(rest.split(/\s+/)[0]), tu = null; order.forEach(function (k) { var x = users[k]; if (x && !tu && (x.hnd === qh || norm(x.name) === qh)) tu = x; });
      if (!tu) { say(u, 'no one called @' + qh + ' here', 2800); return; }
      var tl2 = tu.grant ? 'everything' : Object.keys(EARN.items).filter(function (i) { return itemEarned(tu, i); }).map(itemName), tot = Object.keys(EARN.items).length;
      if (tu.grant || tl2.length === tot) { say(u, '@' + qh + ' \uD83D\uDD13 has everything unlocked', 5200, true); return; }
      say(u, '@' + qh + ' \uD83D\uDD13 ' + tl2.length + '/' + tot + (tl2.length ? ' \u00b7 ' + tl2.slice(0, 3).join(', ') + (tl2.length > 3 ? ' +' + (tl2.length - 3) : '') : ' \u00b7 nothing yet'), 6200); return;
    }
    if (cmd === '!earned') {
      var allE = Object.keys(EARN.items), nE = allE.filter(function (i) { return itemEarned(u, i); }).length, left = allE.filter(function (i) { return !itemEarned(u, i); });
      if (!left.length) { say(u, '\uD83D\uDD13 Everything unlocked \u2014 you did it all', 4200, true); return; }
      var hs = {}; left.forEach(function (i) { hs[EARN.items[i]] = 1; }); var ks = Object.keys(hs), hk = ks[Math.floor(Math.random() * ks.length)];
      say(u, '\uD83D\uDD13 ' + nE + '/' + allE.length + ' \u00b7 ' + EARN.tasks[hk], 4800); return;
    }
    if (cmd === '!code') {
      var cw = rest.toLowerCase().replace(/[^a-z0-9]/g, ''), ct = Object.keys(S.codes).filter(function (t) { return S.codes[t].on && S.codes[t].word === cw; })[0];
      if (!cw) return; if (!ct) { say(u, 'hmm \u2014 not that one', 2200); return; }
      PG(u).cd[ct] = 1; evalTasks(u); return;
    }
    if (cmd === '!bar') { if (u.atBar) { say(u, 'already at the bar \u00b7 try !drink', 2400); return; } u.atBar = true; seat(u, false); say(u, (u.dr ? DRINKS[u.dr.kind] + ' ' : '') + 'cheers', 2400); save(); return; }
    if (cmd === '!floor' || cmd === '!dancefloor') { if (!u.atBar && !u.vipFloor) { say(u, 'already on the floor', 2000); return; } u.atBar = false; seat(u, false); say(u, 'let\'s dance', 2400); save(); return; }
    if (mod && (cmd === '!vip' || cmd === '!unvip')) {
      var target = norm(rest.split(/\s+/)[0]); if (!target) return;
      var list = S.vip.map(norm), i = list.indexOf(target);
      if (cmd === '!vip' && i < 0) S.vip.push('@' + target);
      if (cmd === '!unvip' && i >= 0) S.vip.splice(i, 1);
      vipUI(); order.forEach(function (k) { var x = users[k]; if (x.hnd === target) { refreshVip(x); if (x.inside) { x.d = 0; seat(x, false); say(x, cmd === '!vip' ? 'VIP' : 'back to the floor', 2600, true); } } });
      save(); return;
    }
    if (mod && cmd === '!runway') { try { rest.toLowerCase() === 'off' ? runwayStop() : runwayStart(Number(rest) || 4, 30); } catch (e) { say(u, e.message, 3000); } return; }
    if (mod && cmd === '!top5') { var ar = rest.toLowerCase(); setTop5(ar === 'on' ? true : ar === 'off' ? false : !S.top5); return; }
    if (mod && cmd === '!np') { var m2 = rest.match(/^(.*?)\s+[-\u2013]\s+(.*)$/); if (/^off$/i.test(rest) || !rest) setNP('', ''); else if (m2) setNP(m2[1], m2[2]); else setNP('', rest); return; }
    if (mod && cmd === '!light') { lightCmd(rest.toLowerCase().split(/\s+/)[0]); return; }
    if (mod && cmd === '!nicki' && /test/i.test(rest)) { nickiRehearse(); return; }
  }
  function bumpFront(u, text) { if (!emojiPop(u, text)) bubble(u, text); }
  function earnTick() {
    var ins = order.map(function (k) { return users[k]; }).filter(function (u) { return u && u.inside && !isNicki(u); });
    ins.forEach(function (u) { PG(u).sec += 15; });
    ins.slice().sort(function (a, b) { return (b.show || 0) - (a.show || 0); }).slice(0, 5).forEach(function (u) { if ((u.show || 0) >= 8) PG(u).t5 = 1; });
    ins.forEach(evalTasks);
  }
  setInterval(function () {
    var now = Date.now();
    /* overflow people who are chatting again earn a seat */
    order.forEach(function (k) { var u = users[k]; if (u.inside && !u.slot && now - u.lastActive < 60000) { u.d = 0; seat(u, false); } });
    earnTick();
    overflowUI(); top5Update(); scheduleFit();
  }, 15000);
  setInterval(function () { top5Update(); }, 6000);

  /* ---------- Nicki ---------- */
  var nickiBusy = false;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function banner(t, sub, ms) {
    var b = $('banner'); b.innerHTML = '<span class="bt">' + t + '</span>' + (sub ? '<small>' + sub + '</small>' : ''); b.classList.add('show');
    var bt = b.firstChild, bs = b.querySelector('small'), sc = 1;
    if (bt.offsetWidth > 670) { sc = 670 / bt.offsetWidth; bt.style.transform = 'scale(' + sc.toFixed(3) + ')'; bt.style.marginBottom = (-(1 - sc) * 20) + 'px'; }
    if (bs && bs.offsetWidth > 670) bs.style.transform = 'scale(' + (670 / bs.offsetWidth).toFixed(3) + ')';
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
    tag.className = 'rk r' + Math.min(5, (u.rank || 0) + 1); tag.textContent = String((u.rank || 0) + 1); tag.style.fontSize = Math.max(14, u.d * 0.22) + 'px'; u.autoDance = true;
  }
  function rankSync() {
    order.forEach(function (k) {
      var u = users[k]; if (!u || !u.el) return; var has = !!u.el.querySelector('.rk'), want = !!(u.inside && u.stage && u.slot && u.slot.z === 'stage' && u.rank != null);
      if (want) { var t = u.el.querySelector('.rk'); if (!t || t.textContent !== String((u.rank || 0) + 1)) rankTag(u, true); } else if (has) rankTag(u, false);
    });
  }
  setInterval(rankSync, 1200);
  var top5Sig = '';
  function top5Update(force) {
    if (RW.on) return;
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
    var f = $('stagefx'), on = stageOn(); f.style.display = on ? 'block' : 'none'; if (!on) return;
    var b = stageBox(CROWDK), w = b.d * 7.2, hh = b.d * 2.2; f.style.left = (R.stage.x - w / 2) + 'px'; f.style.top = (R.stage.y - hh * 0.62) + 'px'; f.style.width = w + 'px'; f.style.height = hh + 'px';
  }
  function setTop5(on) {
    S.top5 = !!on; var b = $('top5btn'); if (b) b.setAttribute('aria-pressed', String(S.top5));
    top5Sig = ''; top5Update(true); stageFx(); save();
    if (S.top5) banner('TOP 5 CHATTERS', 'Take the floor', 3600);
  }


  /* ---------- runway: best-dressed contest ---------- */
  function rwOrds(n) { return n <= 3 ? [-1, 0, 1] : n === 4 ? [-1.5, -0.5, 0.5, 1.5] : [-2, -1, 0, 1, 2]; }
  function rwClear() { RW.t.forEach(function (h) { clearTimeout(h); clearInterval(h); }); RW.t = []; }
  function rwAt(ms, f) { var h = setTimeout(f, ms); RW.t.push(h); return h; }
  function rwHud() {
    var h = $('rwhud'); if (!h) return;
    if (!RW.on || RW.phase === '' || RW.phase === 'enter') { h.classList.remove('show'); return; }
    var tot = 0, cnt = RW.picks.map(function () { return 0; }), k;
    for (k in RW.votes) { cnt[RW.votes[k] - 1]++; tot++; }
    var left = Math.max(0, Math.ceil((RW.end - Date.now()) / 1000)), win = RW.phase === 'result' ? RW.win : -1, html = '<div class="rwh">' + (RW.phase === 'result' ? 'BEST DRESSED' : 'VOTE NOW · type ' + (RW.picks.length > 1 ? '1 to ' + RW.picks.length : '1')) + '<b>' + (RW.phase === 'vote' ? left + 's' : '') + '</b></div><div class="rwc">';
    RW.picks.forEach(function (u, i) { if (!u) { html += '<div class="rwi"><span class="rwn">' + (i + 1) + '</span><span class="rwm">left</span></div>'; return; } var pc = tot ? Math.round(cnt[i] * 100 / tot) : 0; html += '<div class="rwi' + (win === i ? ' win' : '') + '"><span class="rwn">' + (i + 1) + '</span><span class="rwm">' + esc2(u.name) + '</span><i style="width:' + pc + '%"></i><em>' + cnt[i] + '</em></div>'; });
    h.innerHTML = html + '</div>'; h.classList.add('show');
  }
  function esc2(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rwVote(u, n) {
    if (n < 1 || n > RW.picks.length || !RW.picks[n - 1] || RW.picks[n - 1] === u) return;
    RW.votes[u.key] = n; rwHud();
  }
  function rwDrop(u) {
    var i = RW.picks.indexOf(u); if (i < 0) return;
    u.stage = false; u.rank = null; rankTag(u, false);
    if (RW.phase === 'vote' || RW.phase === 'enter') { RW.picks[i] = null; }
    var left = RW.picks.filter(function (x) { return x && x.inside; }).length;
    if (left < 2) setTimeout(runwayStop, 200);
  }
  function runwayStart(n, sec) {
    if (RW.on) throw new Error('Runway is already running');
    if (S.top5) throw new Error('Turn off Top 5 first');
    n = Math.max(2, Math.min(5, Number(n) || 4)); sec = Math.max(10, Math.min(90, Number(sec) || 30));
    var c = order.map(function (k) { return users[k]; }).filter(function (u) { return u && u.inside && !isNicki(u) && u.slot && u.set && !u.overflow; });
    if (c.length < 2) throw new Error('Need at least 2 people with avatars inside');
    c.sort(function () { return Math.random() - 0.5; });
    c.sort(function (a, b) { return (b.look && b.look.top ? 1 : 0) - (a.look && a.look.top ? 1 : 0); });
    var picks = c.slice(0, Math.min(n, c.length));
    RW.on = true; RW.phase = 'enter'; RW.picks = picks; RW.ords = rwOrds(picks.length); RW.votes = {}; RW.win = -1;
    relayout();
    banner('RUNWAY', 'Best dressed wins · vote with a number', 4200);
    picks.forEach(function (u, i) {
      rwAt(1800 + i * 2600, function () {
        if (!RW.on || !u.inside) return;
        u._back = [u.x, u.y]; u.stage = true; u.rank = i; PG(u).rwp = 1; evalTasks(u); seat(u, false);
      });
    });
    var tIn = 1800 + picks.length * 2600 + 2500;
    rwAt(tIn, function () {
      if (!RW.on) return;
      RW.phase = 'vote'; RW.end = Date.now() + sec * 1000; rwHud();
      banner('VOTE NOW', 'Type 1 to ' + picks.length + ' in chat', 3800);
      RW.t.push(setInterval(rwHud, 500));
      rwAt(sec * 1000, rwResult);
    });
    rcSnap(true);
  }
  function rwResult() {
    if (!RW.on || RW.phase !== 'vote') return;
    var cnt = RW.picks.map(function () { return 0; }), k, best = -1, i;
    for (k in RW.votes) cnt[RW.votes[k] - 1]++;
    cnt.forEach(function (v, j) { if (RW.picks[j] && (best < 0 || v > cnt[best] || (v === cnt[best] && Math.random() < 0.5))) best = j; });
    RW.phase = 'result';
    if (best < 0 || cnt[best] === 0) { RW.win = -1; banner('NO VOTES', 'Everyone looked amazing', 4000); RW.end = Date.now(); rwHud(); rwAt(5000, runwayStop); return; }
    RW.win = best; var w = RW.picks[best]; PG(w).rww = 1; evalTasks(w); RW.end = Date.now(); rwHud(); S.ss.win.push({ n: w.name, v: cnt[best] }); save();
    banner('BEST DRESSED', esc2(w.name) + ' · ' + cnt[best] + ' vote' + (cnt[best] === 1 ? '' : 's'), 6500);
    lightFor('spot', true, w); CITY.fire(3); say(w, '👑 Best dressed!', 7000, true);
    rwAt(9000, function () { lightFor('spot', false, null); });
    rwAt(10500, runwayStop);
  }
  function runwayStop() {
    if (!RW.on) return;
    rwClear(); RW.phase = ''; var picks = RW.picks.slice(); RW.on = false; RW.picks = [];
    picks.forEach(function (u) { if (u) { u.stage = false; u.rank = null; rankTag(u, false); } });
    var h = $('rwhud'); if (h) h.classList.remove('show');
    lightFor('spot', false, null); stageFx(); relayout(); rcSnap(true);
  }


  /* ---------- closing the club: last call, walk-out, recap ---------- */
  function clAt(ms, f) { var h = setTimeout(f, ms); CL.t.push(h); return h; }
  function clClear() { CL.t.forEach(clearTimeout); CL.t = []; }
  function recapHtml() {
    var top = function (arr, n) { return arr.sort(function (a, b) { return b[1] - a[1]; }).slice(0, n); };
    var dancers = top(Object.keys(S.ss.sd).map(function (k) { return [S.ss.sd[k][0], S.ss.sd[k][1]]; }), 3);
    var chatters = top(order.map(function (k) { return users[k]; }).filter(function (u) { return u && (u.show || 0) > 0 && !isNicki(u); }).map(function (u) { return [u.name, u.show]; }), 3);
    var col = function (title, rows, unit) { return '<div class="rcc"><h4>' + title + '</h4>' + (rows.length ? rows.map(function (r, i) { return '<div class="rcr"><b>' + (i + 1) + '</b><span>' + esc2(r[0]) + '</span><em>' + r[1] + (unit ? ' ' + unit : '') + '</em></div>'; }).join('') : '<div class="rcr none">—</div>') + '</div>'; };
    var wins = S.ss.win.slice(-3).reverse().map(function (w) { return [w.n, w.v]; });
    return '<div class="rct">THANK YOU FOR PARTYING</div><div class="rcg">' + col('Most dance moves', dancers, '') + col('Most chatty', chatters, 'msgs') + col('Best dressed', wins, 'votes') + '</div><div class="rcs"><span><b>' + S.ss.peak + '</b> peak crowd</span><span><b>' + Object.keys(S.ss.ent).length + '</b> partied tonight</span></div><div class="rcm">' + esc2(S.closing) + '</div>';
  }
  function closingStart(sec) {
    if (CL.on) throw new Error('Already closing');
    if (RW.on) runwayStop(); if (S.top5) setTop5(false);
    sec = Math.max(5, Math.min(120, Number(sec) || 30));
    order.forEach(function (k) { var x = users[k]; if (x && x.inside && !isNicki(x)) { PG(x).lc = 1; evalTasks(x); } });
    CL.on = true; CL.ph = 'last'; CL.end = Date.now() + sec * 1000;
    banner('LAST CALL', 'The club closes in ' + sec + ' seconds', 5000); lightCmd('chill');
    clAt(Math.max(1000, sec * 1000 - 8000), function () { banner('LAST CALL', 'Final songs', 4000); });
    clAt(sec * 1000, function () {
      CL.ph = 'out'; banner('THANK YOU FOR PARTYING', 'Safe travels', 5000);
      var list = order.map(function (k) { return users[k]; }).filter(function (u) { return u && u.inside && !isNicki(u); }), gap = Math.min(220, 9000 / Math.max(1, list.length));
      list.sort(function () { return Math.random() - 0.5; });
      list.forEach(function (u, i) { clAt(i * gap, function () { if (u.inside) leave(u); }); });
      var tOut = list.length * gap + 4500;
      clAt(tOut, function () {
        CL.ph = 'recap'; var r = $('recap'); r.innerHTML = recapHtml(); r.classList.add('show'); CITY.fire(4); rcSnap(true);
        clAt(45000, function () { r.classList.remove('show'); CL.ph = 'done'; rcSnap(true); });
      });
    });
    rcSnap(true);
  }
  function closingReopen() {
    clClear(); CL.on = false; CL.ph = ''; var r = $('recap'); if (r) r.classList.remove('show'); rcSnap(true);
  }

  /* ---------- crowd auto-fit: avatars shrink when the room is full ---------- */
  var fitT = null;
  function scheduleFit() { if (fitT) return; fitT = setTimeout(function () { fitT = null; autoFit(); }, 700); }
  function autoFit() {
    var nF = 0, nB = 0, nV = 0, i;
    order.forEach(function (k) { var u = users[k]; if (!u.inside || isNicki(u) || (u.stage && stageOn())) return; if (u.atBar) nB++; else if (u.vip) nV++; else nF++; });
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
    var names = ['Priya', 'Amara', 'Freya', 'Valentina', 'Mei'], looks = [
      { top: 'pinkfriday', topColor: 'pink', bottom: 'miniskirt', bottomColor: 'pink', shoes: 'ankle', shoesColor: 'pink', skin: 'caramel', hair: 'ponytail', hairColor: 'black', acc: ['hoops'], accColor: 'gold' },
      { top: FREE_TOPS[1 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'shorts', bottomColor: 'pink', shoes: 'sneakers', shoesColor: 'pink', skin: 'cocoa', hair: 'buns', hairColor: 'pink', acc: ['hoops'], accColor: 'pink' },
      { top: FREE_TOPS[2 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'jeans', bottomColor: 'pink', shoes: 'boots', shoesColor: 'pink', skin: 'sand', hair: 'wavy', hairColor: 'blonde', acc: ['pearls'], accColor: 'silver' },
      { top: FREE_TOPS[0].id, topColor: 'pink', bottom: 'miniskirt', bottomColor: 'pink', shoes: 'ankle', shoesColor: 'pink', skin: 'honey', hair: 'bob', hairColor: 'burgundy', acc: ['nails'], accColor: 'gold' },
      { top: FREE_TOPS[3 % FREE_TOPS.length].id, topColor: 'pink', bottom: 'shorts', bottomColor: 'pink', shoes: 'sneakers', shoesColor: 'pink', skin: 'porcelain', hair: 'long', hairColor: 'platinum', acc: ['headphones'], accColor: 'pink' }
    ], spots = [[0, 0.2], [0, 0.52], [0, 0.82], [1, 0.3], [1, 0.72]], dances = ['rock', 'groove', 'rock', 'groove', 'rock'];
    spots.forEach(function (sp, i) {
      var bar = R.bars[sp[0]]; if (!bar) return;
      var pts = bar.edge, total = 0, lens = [], j; for (j = 0; j < pts.length - 1; j++) { var l = Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]); lens.push(l); total += l; }
      var pos = total * sp[1], si = 0; while (si < lens.length - 1 && pos > lens[si]) { pos -= lens[si]; si++; }
      var f = Math.min(1, pos / lens[si]), px = pts[si][0] + (pts[si + 1][0] - pts[si][0]) * f, py = pts[si][1] + (pts[si + 1][1] - pts[si][1]) * f;
      var d = Math.max(30, avW(py) * 0.98), x = px - bar.out[0] * d * 0.55, y = py - bar.out[1] * d * 0.55 + d * 0.15;
      var u = { key: 'bt' + i, name: names[i], plat: 'none', photo: 'vnn/bartenders/' + names[i].toLowerCase() + '.png', look: Object.assign(blankLook(), looks[i]), dance: dances[i], h32: 40 + i * 7, bt: true };
      makeEl(u); u.el.classList.add('bt', 'in'); u.inner.className = 'in2 btclip';
      draw(u, d); u.dance = dances[i]; draw(u, d);
      u.d = d; put(u, x, y, 0, true); u.el.style.zIndex = Math.round(y);
      u.el.style.transitionDuration = '0s';
      BT.push(u);
    });
  }

  /*__CITY__*/
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

  /* ---------- chat bubbles ---------- */
  /* Rules: quiet club = everyone gets a bubble and it stays up longer. Busy club = shorter, smaller, solid-colour bubbles.
     Packed club = only the front half of the room (plus VIPs and Nicki), newest messages win, capped. */
  var BUBK = { deep: 12, packed: 24 };
  var BUB = { map: {}, list: [], run: false };
  var BAD_AUTO = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|gg|tv|ly|co|me|xyz|live|ru|cn|info|shop|store)\b|\d[\d\s().-]{8,}\d)/i;
  var LEET = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't' };
  function leet(s) { return String(s).toLowerCase().replace(/[01!345@$7]/g, function (c) { return LEET[c]; }); }
  function badWord(t) {
    var ws = S.bub.words; if (!ws || !ws.length) return false;
    var toks = leet(t).split(/[^a-z0-9]+/).filter(Boolean), joined = leet(t).replace(/[^a-z]/g, ''), i, j, w;
    for (i = 0; i < ws.length; i++) {
      w = leet(ws[i]).replace(/[^a-z]/g, ''); if (!w) continue;
      for (j = 0; j < toks.length; j++) { if (toks[j] === w || (w.length >= 4 && toks[j].indexOf(w) === 0) || (w.length >= 5 && toks[j].indexOf(w) >= 0)) return true; }
      if (w.length >= 6 && joined.indexOf(w) >= 0) return true;
    }
    return false;
  }
  function bubText(raw, max) {
    var t = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!t || /^[!\/]/.test(t) || BAD_AUTO.test(t) || badWord(t)) return '';
    t = t.replace(/(.)\1{4,}/g, '$1$1$1');
    var ch = Array.from(t);
    if (ch.length > max) { var c = ch.slice(0, max).join(''), sp = c.lastIndexOf(' '); t = (sp > max * 0.55 ? c.slice(0, sp) : c) + '…'; }
    return t;
  }
  var BUBH = [338, 18, 46, 84, 140, 170, 196, 216, 250, 276, 302, 2];
  function bubColor(u, skip) {
    if (isNicki(u)) return { c: '#ffd86b', g: 'rgba(255,216,107,.5)' };
    /* each person keeps their own colour; if someone speaking right now already has it, borrow the nearest free one */
    var used = {}; BUB.list.forEach(function (x) { if (x.u !== u && !x.fading && x.hi != null) used[x.hi] = 1; });
    var i = (u.h32 || 0) % BUBH.length, n;
    for (n = 0; n < BUBH.length && used[i]; n++) i = (i + 1) % BUBH.length;
    var hue = BUBH[i]; return { c: 'hsl(' + hue + ' 92% 68%)', g: 'hsl(' + hue + ' 92% 68% / .5)', i: i };
  }
  function bubRule() {
    var n = 0, ys = [];
    order.forEach(function (k) { var u = users[k]; if (u && u.inside && u.slot) { n++; ys.push(u.y || 0); } });
    ys.sort(function (a, b) { return a - b; });
    return { n: n, hold: Math.max(3200, Math.min(10000, 10600 - n * 260)), cap: n < BUBK.deep ? 14 : n < BUBK.packed ? 10 : 7, solid: n >= BUBK.deep, dense: n >= BUBK.deep, packed: n >= BUBK.packed, cut: ys.length ? ys[Math.floor(ys.length / 2)] : 0 };
  }
  function talk(u, col, on) {
    var el = u.el; if (!el) return;
    var moving = u.walkUntil && u.walkUntil > performance.now();
    if (on) {
      el.style.setProperty('--c', col.c); el.style.setProperty('--cg', col.g);
      if (!u.ring) { u.ring = document.createElement('i'); u.ring.className = 'ring'; el.insertBefore(u.ring, el.firstChild); }
      el.classList.add('talk');
      if (!u.pop) { u.pop = 1; if (!moving && u.x != null) put(u, u.x, u.y, 0.35, true); }
    } else {
      el.classList.remove('talk');
      if (u.pop) { u.pop = 0; if (!moving && u.x != null) put(u, u.x, u.y, 0.5, true); }
    }
  }
  function bubble(u, text) {
    if (!S.bub || S.bub.on === false || !$('bubs')) return;
    var nk = isNicki(u);
    if (!(u.inside && u.el && u.x != null && (u.slot || nk))) return;
    var rl = bubRule(), t = bubText(text, rl.packed ? 32 : rl.dense ? 40 : 56);
    if (!t) return;
    if (rl.packed && !nk && !u.vip && (u.y || 0) < rl.cut) return;
    var b = BUB.map[u.key], now = performance.now(), col = bubColor(u);
    if (!b) {
      b = BUB.map[u.key] = { u: u, el: document.createElement('div'), w: 0, h: 0 };
      b.el.className = 'bub'; b.el.innerHTML = '<div class="bbox"><b class="bn"></b><span class="bt"></span></div><i class="bstem"></i>';
      b.box = b.el.firstChild; b.nm = b.box.firstChild; b.tx = b.nm.nextSibling; b.stem = b.box.nextSibling;
      $('bubs').appendChild(b.el); BUB.list.push(b);
    } else { clearTimeout(b.rm); b.fading = 0; b.box.style.animation = 'none'; void b.box.offsetWidth; b.box.style.animation = ''; }
    b.el.className = 'bub' + (rl.solid ? ' solid' : '') + (rl.dense ? ' dense' : '') + (nk ? ' gold' : '');
    b.el.style.setProperty('--c', col.c); b.el.style.setProperty('--cg', col.g);
    b.nm.textContent = (u.vip && !nk ? '★ ' : '') + String(u.name || '').slice(0, 22);
    b.hi = col.i; b.tx.textContent = t; b.born = now; b.until = now + rl.hold * (nk ? 1.6 : 1); b.w = 0;
    var act = BUB.list.filter(function (x) { return !x.fading; });
    while (act.length > rl.cap) {
      var old = null; act.forEach(function (x) { if (x !== b && !isNicki(x.u) && (!old || x.born < old.born)) old = x; });
      if (!old) break; bubEnd(old); act.splice(act.indexOf(old), 1);
    }
    talk(u, col, true); bubKick();
  }
  function bubEnd(b) {
    if (!b || b.fading) return; b.fading = 1; b.el.classList.add('out'); talk(b.u, null, false);
    b.rm = setTimeout(function () { bubDrop(b); }, 340);
  }
  function bubDrop(b) {
    clearTimeout(b.rm); if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
    var i = BUB.list.indexOf(b); if (i >= 0) BUB.list.splice(i, 1); if (BUB.map[b.u.key] === b) delete BUB.map[b.u.key];
  }
  function bubClear() { BUB.list.slice().forEach(function (b) { talk(b.u, null, false); bubDrop(b); }); }
  function bubKick() { if (BUB.run) return; BUB.run = true; requestAnimationFrame(bubTick); }
  /* keep speech bubbles off the video windows (main screen unless it is see-through, DJ screen, host cam) */
  function clearZones(x, y, w, h, ay) {
    var hole = $('stage').classList.contains('hole'), zs = R.zones || {}, out = y;
    ['screen', 'dj', 'host'].forEach(function (id) {
      var z = zs[id]; if (!z || (id === 'screen' && hole)) return;
      var zx = z[0] - 6, zy = z[1] - 6, zw = z[2] + 12, zh = z[3] + 12;
      if (x < zx + zw && x + w > zx && out < zy + zh && out + h > zy) out = Math.min(zy + zh + 2, ay - h - 2 > zy + zh ? ay - h - 2 : zy + zh + 2);
    });
    return out;
  }
  function bubTick() {
    if (!BUB.list.length) { BUB.run = false; return; }
    requestAnimationFrame(bubTick);
    var now = performance.now(), sr = $('stage').getBoundingClientRect(), k = (sr.width / W) || 1, items = [];
    BUB.list.slice().forEach(function (b) { if (!b.fading && (now > b.until || !b.u.inside)) bubEnd(b); });
    BUB.list.forEach(function (b) {
      var u = b.u, el = u.el; if (!el || !u.cw) return;
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var ratio = r.height / (u.ch || r.height), headTop = r.top + (2005 * u.s0 - u.fh * 0.88) * ratio;
      if (!b.w) { b.w = b.el.offsetWidth; b.h = b.box.offsetHeight; }
      items.push({ b: b, ax: (r.left + r.width / 2 - sr.left) / k, ay: (headTop - sr.top) / k - 4 });
      if (u.ring && now - (u.rgT || 0) > 500) { u.rgT = now; var rw = Math.max(50, Math.round(u.d * 1.2)), rh = Math.round(rw * 0.3); u.ring.style.cssText = 'top:' + Math.round(2005 * u.s0 - 2) + 'px;width:' + rw + 'px;height:' + rh + 'px;margin:' + (-rh / 2) + 'px 0 0 ' + (-rw / 2) + 'px'; }
    });
    items.sort(function (a, b) { return b.ay - a.ay; });
    var placed = [];
    items.forEach(function (it) {
      var b = it.b, w = b.w, h = b.h, bx = Math.max(8, Math.min(W - w - 8, it.ax - w / 2)), by = it.ay - 14 - h, n, j, hit;
      for (n = 0; n < 14; n++) {
        hit = null;
        for (j = 0; j < placed.length; j++) { var p = placed[j]; if (bx < p.x + p.w + 6 && bx + w + 6 > p.x && by < p.y + p.h + 6 && by + h + 6 > p.y) { hit = p; break; } }
        if (!hit) break; by = hit.y - h - 8;
      }
      by = clearZones(bx, by, w, h, it.ay);
      if (by < 4) by = 4;
      placed.push({ x: bx, y: by, w: w, h: h });
      b.el.style.transform = 'translate3d(' + Math.round(bx) + 'px,' + Math.round(by) + 'px,0)'; b.el.style.zIndex = String(Math.round(it.ay) + 100);
      b.stem.style.cssText = 'left:' + Math.round(Math.max(10, Math.min(w - 10, it.ax - bx))) + 'px;top:' + (h - 1) + 'px;height:' + Math.max(8, Math.round(it.ay - (by + h)) + 1) + 'px';
    });
  }

  /* ---------- emoji pop-ups: a message that is only emoji shoots up from the character instead of showing a bubble ---------- */
  var EMO = { n: 0 };
  var EMO_RE = /(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])?(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])?)*)/gu;
  function emojiOnly(text) {
    var t = String(text || '').replace(/[\s️]+/g, ''); if (!t) return null;
    var m = String(text).replace(/\s+/g, '').match(EMO_RE);
    if (!m || m.join('').replace(/️/g, '').length !== t.length) return null;
    return m;
  }
  function headPos(u) {
    var el = u.el; if (!el || !u.cw || u.s0 == null) return null;
    var sr = $('stage').getBoundingClientRect(), k = (sr.width / W) || 1, r = el.getBoundingClientRect(); if (!r.width) return null;
    var ratio = r.height / (u.ch || r.height), headTop = r.top + (2005 * u.s0 - u.fh * 0.88) * ratio;
    return { x: (r.left + r.width / 2 - sr.left) / k, y: (headTop - sr.top) / k };
  }
  function emojiPop(u, text) {
    var em = emojiOnly(text); if (!em) return false;
    /* emoji-only chats never become text bubbles, whether or not the pop-up shows */
    if (S.bub.emoji === false) return true;
    if (!(u.inside && u.el && u.x != null && (u.slot || isNicki(u)))) return true;
    var now = performance.now(); if (u.emoAt && now - u.emoAt < 900) return true; u.emoAt = now;
    var rl = bubRule(), cap = rl.packed ? 10 : rl.dense ? 18 : 28, hp = headPos(u); if (!hp) return true;
    var list = em.length === 1 ? [em[0], em[0], em[0]] : em.slice(0, 5);
    list.forEach(function (ch, i) {
      if (EMO.n >= cap) return; EMO.n++;
      var echo = em.length === 1 && i > 0, sz = Math.max(30, Math.min(62, u.d * 0.42)) * (echo ? 0.62 : 1.12);
      var rise = Math.max(150, Math.min(330, u.d * 2.4)) * (echo ? 0.8 : 1) * (0.9 + Math.random() * 0.25);
      var x0 = em.length === 1 ? (echo ? (i === 1 ? -1 : 1) * sz * 1.1 : 0) : (i - (list.length - 1) / 2) * sz * 1.0;
      var dx = (Math.random() - 0.5) * 70, rot = (Math.random() - 0.5) * 50, el = document.createElement('span');
      el.className = 'emo'; el.textContent = ch; el.style.cssText = 'left:' + Math.round(hp.x) + 'px;top:' + Math.round(hp.y - 6) + 'px;font-size:' + Math.round(sz) + 'px';
      $('bubs').appendChild(el);
      var tr = function (px, py, sc, r) { return 'translate(-50%,-50%) translate(' + Math.round(px) + 'px,' + Math.round(py) + 'px) scale(' + sc + ') rotate(' + Math.round(r) + 'deg)'; };
      var an = el.animate([
        { transform: tr(x0, 0, 0.3, 0), opacity: 0, offset: 0 },
        { transform: tr(x0 + dx * 0.2, -rise * 0.18, 1.28, rot * 0.3), opacity: 1, offset: 0.15 },
        { transform: tr(x0 + dx * 0.8, -rise * 0.86, 1, rot * 0.8), opacity: 1, offset: 0.72 },
        { transform: tr(x0 + dx, -rise, 0.9, rot), opacity: 0, offset: 1 }
      ], { duration: 1500 + Math.random() * 500, delay: i * 140, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
      an.onfinish = function () { if (el.parentNode) el.parentNode.removeChild(el); EMO.n = Math.max(0, EMO.n - 1); };
    });
    return true;
  }

  /* ---------- bar drinks: a drink in the hand, sips, shots and cheers ---------- */
  var DRINKS = { martini: '🍸', shot: '🥃', beer: '🍺', cocktail: '🍹', champagne: '🥂', wine: '🍷' };
  var DRINK_IDS = Object.keys(DRINKS);
  var DRINK_ALIAS = { cosmo: 'martini', martinis: 'martini', shots: 'shot', tequila: 'shot', whiskey: 'shot', beers: 'beer', pint: 'beer', cocktails: 'cocktail', mojito: 'cocktail', margarita: 'cocktail', tropical: 'cocktail', bubbly: 'champagne', champ: 'champagne', prosecco: 'champagne', flute: 'champagne', red: 'wine' };
  var ACTS = { sip: 2.4, shot: 1.9, cheers: 2.7 };
  function drinkKind(w) { w = String(w || '').toLowerCase().replace(/[^a-z]/g, ''); if (DRINKS[w]) return w; return DRINK_ALIAS[w] || null; }
  function nowS() { return performance.now() / 1000; }
  function sstep(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function newDrink(u, kind, delay) {
    var t = nowS() + (delay || 0), k = kind || DRINK_IDS[Math.floor(Math.random() * DRINK_IDS.length)];
    return { kind: k, hand: (u.h32 % 2) ? 'Left' : 'Right', born: t, act: null, t0: 0, dur: 0, next: t + 4 + Math.random() * 7, lv: 1, from: 1, to: 1, refillAt: 0, last: 'sip' };
  }
  function drink(u, on, delay) {
    if (on) { if (!u.dr) { if (!u.drKind) u.drKind = DRINK_IDS[(u.h32 || 0) % DRINK_IDS.length]; u.dr = newDrink(u, u.drKind, delay); } }
    else if (u.dr) u.dr = null;
    u.dirty = 1;
  }
  function startAct(u, act, delay) {
    var d = u.dr; if (!d) return false; var t = nowS();
    if (d.act && t < d.t0 + d.dur) return false;
    d.act = act; d.last = act; d.t0 = t + (delay || 0); d.dur = ACTS[act]; d.from = d.lv;
    d.to = act === 'shot' ? 0 : act === 'sip' ? Math.max(0.15, d.lv - 0.28) : d.lv; u.dirty = 1; return true;
  }
  /* what the rig draws this frame: glass size, liquid, how far the arm has lifted, tilt */
  function holdOf(u, t) {
    var d = u.dr; if (!d) return null;
    var pop = (t - d.born) / 0.4; if (pop <= 0) return null;
    var sc = pop >= 1 ? 1 : 1 + 2.70158 * Math.pow(pop - 1, 3) + 1.70158 * Math.pow(pop - 1, 2);
    var arm = 0, tilt = 0, aim = 0, over = 0, to = 'mouth', lvl = d.lv;
    if (d.act) {
      var p = (t - d.t0) / d.dur;
      if (p >= 1) { d.act = null; d.lv = d.to; lvl = d.lv; if (d.lv < 0.2) d.refillAt = t + (d.last === 'shot' ? 5 : 3.5); d.next = t + (d.last === 'shot' ? 14 : 6) + Math.random() * 9; }
      else if (p >= 0) {
        if (d.act === 'sip') { arm = sstep(p / 0.28) - sstep((p - 0.62) / 0.38); aim = sstep((p - 0.2) / 0.2) * (1 - sstep((p - 0.6) / 0.2)); lvl = d.from + (d.to - d.from) * sstep((p - 0.35) / 0.3); }
        else if (d.act === 'shot') { arm = sstep(p / 0.22) - sstep((p - 0.72) / 0.28); aim = sstep((p - 0.2) / 0.2) * (1 - sstep((p - 0.55) / 0.2)); over = 0.55; lvl = d.from + (d.to - d.from) * sstep((p - 0.3) / 0.25); }
        else { to = 'up'; arm = sstep(p / 0.3) - sstep((p - 0.78) / 0.22); tilt = Math.sin(p * 20) * 0.12 * arm; }
        u.dirty = 1;
      }
    } else if (t >= d.next) startAct(u, d.kind === 'shot' ? 'shot' : 'sip');
    if (!d.act && d.lv < 0.2 && d.refillAt && t > d.refillAt) { d.lv = 1; d.from = d.to = 1; d.refillAt = 0; d.born = t - 0.02; }
    return { kind: d.kind, hand: d.hand, arm: Math.max(0, arm), to: to, tilt: tilt, aim: aim, over: over, s: sc, lvl: lvl };
  }
  function orderDrink(u, kind, then) {
    var k = kind;
    if (!k) { var others = DRINK_IDS.filter(function (x) { return x !== u.drKind; }); k = others[Math.floor(Math.random() * others.length)]; }
    u.drKind = k;
    var wasBar = !!(u.atBar && u.slot && u.slot.z === 'bar' && u.dr);
    if (!wasBar) { u.atBar = true; seat(u, false); }
    if (!u.dr) return false;
    if (wasBar) u.dr = newDrink(u, k, 0.0);
    u.dirty = 1; PG(u).dr++; evalTasks(u); say(u, DRINKS[k] + ' ' + k, 2600);
    if (then) startAct(u, then, Math.max(0, u.dr.born - nowS()) + 0.5);
    save(); return true;
  }
  function barRound() {
    var bar = order.map(function (k) { return users[k]; }).filter(function (u) { return u && u.inside && u.dr; });
    if (!bar.length) throw new Error('Nobody is at the bar. Add guests at the bar first.');
    bar.forEach(function (u, i) { var k = DRINK_IDS[Math.floor(Math.random() * DRINK_IDS.length)]; u.drKind = k; u.dr = newDrink(u, k, i * 0.05); u.dirty = 1; say(u, DRINKS[k] + ' ' + k, 2200); startAct(u, 'cheers', 1.0 + Math.random() * 0.9); });
    banner('ROUND ON THE HOUSE', 'cheers!', 3200);
  }

  /* ---------- test helpers (control panel rehearsal tools) ---------- */
  var CHATTER = ['this song is fire', 'who is the DJ tonight??', 'hiii from tiktok', 'turn it up!', 'best club ever', 'where is the bar', 'I love this track so much omg play it again', 'lol yes', 'LETS GOOO', 'love the outfits in here', 'this is so cool', 'can we get a drink round', 'vibes immaculate', 'first time here, wow'];
  var EMO_POOL = ['🔥', '❤️', '😍', '👏', '😂', '🎉', '💃', '🥂', '✨', '💖', '🙌', '😎'];
  function insideUsers() { return order.map(function (k) { return users[k]; }).filter(function (u) { return u && u.inside && u.slot && !isNicki(u); }); }
  function shuffled(a) { var b = a.slice(), i, j, t; for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function chatAs(u, m) { onMessage({ type: u.plat === 'x' ? 'twitter' : u.plat, userid: u.hnd, chatname: u.name, chatmessage: m }); }
  function botsTalk(n) { shuffled(insideUsers()).slice(0, n).forEach(function (u, i) { setTimeout(function () { chatAs(u, pick(CHATTER)); }, i * 170); }); }
  function botsEmoji(n) { shuffled(insideUsers()).slice(0, n).forEach(function (u, i) { setTimeout(function () { var m = pick(EMO_POOL); if (Math.random() < 0.3) m += pick(EMO_POOL) + (Math.random() < 0.5 ? pick(EMO_POOL) : ''); chatAs(u, m); }, i * 220); }); }
  function botsRank() { insideUsers().forEach(function (u) { u.show = 1 + Math.floor(Math.random() * 60); }); S.top5 = false; setTop5(true); top5Update(true); }
  var demoT = [];
  function demoStop() { demoT.forEach(clearTimeout); demoT = []; bubClear(); RCMD_clear(); if (S.top5) setTop5(false); lightCmd('chill'); }
  function demoRun() {
    demoStop();
    var at = function (sec, fn) { demoT.push(setTimeout(function () { try { fn(); } catch (e) { log('demo: ' + e.message); } }, sec * 1000)); };
    at(0.3, function () { applyPreset('party'); banner('DEMO REEL', 'every feature, about a minute', 3000); addBots(14); addBots(8, 'bar'); addBots(3, 'vip'); });
    at(7, function () { botsTalk(6); });
    at(11, function () { botsEmoji(5); });
    at(15, function () { barRound(); });
    at(22, function () { botsRank(); });
    at(28, function () { lightCmd('drop'); botsEmoji(8); });
    at(36, function () { botsTalk(8); });
    at(41, function () { order.forEach(function (k) { var u = users[k]; if (u && u.inside) { u.dance = pick(DANCES); u.dirty = 1; } }); });
    at(46, function () { addBots(40); });
    at(54, function () { botsTalk(12); botsEmoji(6); });
    at(62, function () { barRound(); });
    at(72, function () { lightCmd('chill'); });
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
    if (S.blocked[key] || (alt && S.blocked[plat + ':' + alt])) return;
    lastMsg = Date.now();
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
  /* chat intake: messages are queued and handled a few at a time so a burst can never freeze the show */
  var MQ = [], mqT = 0, RATE = {}, mqDrop = 0;
  function qMsg(x) {
    var t = String(x.chatmessage != null ? x.chatmessage : (x.message != null ? x.message : '')), cmd = t.charAt(0) === '!';
    if (!cmd) {
      var k = String(x.userid || x.chatname || x.username || ''), now = Date.now(), r = RATE[k] || (RATE[k] = []);
      while (r.length && now - r[0] > 3000) r.shift();
      if (r.length >= 6) { mqDrop++; return; }
      r.push(now);
    }
    MQ.push(x);
    if (MQ.length > 250) { var keep = [], over = MQ.length - 120; for (var i = 0; i < MQ.length; i++) { var q = MQ[i], qt = String(q.chatmessage != null ? q.chatmessage : (q.message != null ? q.message : '')); if (over > 0 && qt.charAt(0) !== '!') { over--; mqDrop++; } else keep.push(q); } MQ = keep; }
    if (!mqT) mqT = setTimeout(mqRun, 0);
  }
  function mqRun() {
    mqT = 0; var t0 = performance.now(), n = 0;
    while (MQ.length && n < 12 && performance.now() - t0 < 8) { n++; try { onMessage(MQ.shift()); } catch (e) { console.error('msg', e); } }
    if (MQ.length) mqT = setTimeout(mqRun, 30);
    if (Object.keys(RATE).length > 600) RATE = {};
  }
  function handleRaw(data) {
    var j; try { j = typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return; }
    (function walk(x) {
      if (!x) return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (x.overlayNinja) return walk(x.overlayNinja);
      if (x.dataReceived) return walk(x.dataReceived);
      if (x.contents) return walk(x.contents);
      if (typeof x === 'object' && (x.chatmessage != null || x.chatname || x.userid)) qMsg(x);
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
  var TIPS = [['Type', '!enter', 'to join the club'], ['Pick a move:', '!dance', 'groove · pump · wave · shuffle · bboy · twerk · snake'], ['Change your fit:', '!look', 'varsity black cargo green ankle'], ['Grab a drink:', '!bar', '· then !drink martini · shot · beer · !cheers'], ['Back to dancing:', '!floor', '· !leave any time']], ti = 0;
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
    $('nnew').onclick = function () { S.nickiDone = false; order.forEach(function (k) { users[k].show = 0; users[k].pg = null; users[k].ear = {}; }); top5Sig = ''; top5Update(true); save(); log('New show: her entrance will play on her next chat, and the chat counts for the top 5 start again.'); };
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
    'lite.set': function (a) { S.lite = a.on ? true : false; slowT = 0; liteApply(); save(); rcSnap(true); },
    'spk.set': function (a) { if (a.on != null) S.spk.on = !!a.on; if (a.amt != null) S.spk.amt = Math.max(0, Math.min(1.5, Number(a.amt) || 0)); spkShow(); save(); rcSnap(true); },
    'city.set': function (a) { S.cityOn = a.on !== false; setBg(); save(); rcSnap(true); },
    'city.fire': function (a) { CITY.fire(Math.max(1, Math.min(6, Number(a.n) || 3))); },
    wash: function (a) { LT.wash = String(a.n); lightUI(); },
    inten: function (a) { LT.inten = Math.max(0.1, Math.min(1, a.v / 100)); lightUI(); },
    bpm: function (a) { LT.bpm = Math.max(60, Math.min(200, Number(a.v) || 124)); lightUI(); },
    'nicki.rehearse': function () { nickiRehearse(); },
    'nicki.out': function () { var n = users['x:nickiminaj']; if (n && n.inside) nickiWalkOut(n); else throw new Error('Nicki is not inside'); },
    'show.new': function () { S.ss = { peak: 0, ent: {}, sd: {}, win: [] }; S.nickiDone = false; order.forEach(function (k) { users[k].show = 0; users[k].pg = null; users[k].ear = {}; }); top5Sig = ''; top5Update(true); save(); },
    top5: function (a) { setTop5(a.on === undefined ? !S.top5 : !!a.on); },
    np: function (a) { setNP(String(a.a || ''), String(a.t || '')); },
    banner: function (a) { banner(String(a.t || '').slice(0, 60), String(a.s || '').slice(0, 80), 4200); },
    'user.drink': function (a) { var u = rcFind(a); if (!u || !u.inside) throw new Error('not inside'); var k = drinkKind(a.kind); if (!orderDrink(u, k, k === 'shot' ? 'shot' : null)) throw new Error('the bar is full'); },
    'user.cheers': function (a) { var u = rcFind(a); if (!u || !u.inside) throw new Error('not inside'); if (!u.dr) throw new Error('not at the bar'); startAct(u, 'cheers', 0.05); say(u, '\uD83E\uDD42 cheers', 2400); emojiPop(u, '\uD83E\uDD42'); },
    'user.dance': function (a) { var u = rcFind(a); if (!u || !u.inside) throw new Error('not inside'); u.dance = normD(a.dance) || pick(DANCES); u.dances++; u.dirty = 1; var sd2 = S.ss.sd[u.key] || (S.ss.sd[u.key] = [u.name, 0]); sd2[1]++; say(u, byId(CATALOG.dances, u.dance).name.toLowerCase(), 2200); save(); },
    'crowd.dance': function (a) { var d = a.d && a.d !== 'random' ? normD(a.d) : null; var n = 0; order.forEach(function (k) { var u = users[k]; if (u && u.inside) { u.dance = d || pick(DANCES); u.dirty = 1; n++; } }); if (!n) throw new Error('nobody is inside'); save(); },
    'bar.round': function () { barRound(); },
    'bots.talk': function (a) { if (!insideUsers().length) throw new Error('add guests first'); botsTalk(Math.min(16, Number(a.n) || 6)); },
    'bots.emoji': function (a) { if (!insideUsers().length) throw new Error('add guests first'); botsEmoji(Math.min(16, Number(a.n) || 6)); },
    'bots.rank': function () { if (!insideUsers().length) throw new Error('add guests first'); botsRank(); },
    'demo.run': function () { demoRun(); },
    'demo.stop': function () { demoStop(); },
    'crowd.clear': function () { RCMD_clear(); },
    'bub.set': function (a) {
      if (a.on !== undefined) { S.bub.on = !!a.on; if (!S.bub.on) bubClear(); }
      if (a.emoji !== undefined) S.bub.emoji = !!a.emoji;
      if (a.words !== undefined) S.bub.words = String(Array.isArray(a.words) ? a.words.join(',') : a.words).toLowerCase().split(/[\s,;]+/).map(function (w) { return w.replace(/[^a-z0-9]/g, ''); }).filter(function (w) { return w.length > 1; }).slice(0, 300);
      save();
    },
    bots: function (a) { addBots(Math.min(300, Number(a.n) || 1), a.mode); },
    botschat: function () { botsChat(); },
    chat: function (a) { var h = String(a.h || 'tester').replace(/^@/, ''), p = a.p || 'x'; onMessage({ type: p === 'x' ? 'twitter' : p, userid: h, chatname: h, chatmessage: String(a.m || '!enter') }); },
    'vip.set': function (a) { S.vip = (a.list || []).map(function (h) { return '@' + norm(h); }).filter(function (h) { return h.length > 1; }); vipUI(); order.forEach(function (k) { var u = users[k], was = u.vip; refreshVip(u); if (u.inside && was !== u.vip) { u.d = 0; seat(u, false); } }); save(); },
    'mods.set': function (a) { S.mods = (a.list || []).map(norm).filter(Boolean); vipUI(); save(); },
    rules: function (a) { S.need = { d: Math.max(0, Number(a.d) || 0), c: Math.max(0, Number(a.c) || 0) }; S.maxOn = Math.max(100, Number(a.max) || 400); save(); relayout(); },
    scale: function (a) { R.scale = Math.max(0.5, Math.min(1.3, a.v / 100)); placeFixed(); relayout(); save(); },
    'code.set': function (a) { var c = S.codes[a.t]; if (!c) throw new Error('unknown code'); var w = String(a.word || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20); if (!w) throw new Error('empty word'); c.word = w; save(); },
    'code.reveal': function (a) { var c = S.codes[a.t]; if (!c) throw new Error('unknown code'); c.on = !!a.on; save(); if (c.on) { banner('SECRET CODE', 'Type  !code ' + c.word, 7000); try { CITY.fire(2); } catch (e) { } } },
    'club.close': function (a) { if (a.msg != null) S.closing = String(a.msg).slice(0, 120); save(); closingStart(a.sec); },
    'club.reopen': function () { closingReopen(); },
    'club.msg': function (a) { S.closing = String(a.msg || '').slice(0, 120); save(); },
    'runway.start': function (a) { runwayStart(a.n, a.sec); },
    'runway.stop': function () { runwayStop(); },
    'mod.photo': function (a) {
      var u = rcFind(a); if (!u) throw new Error('not found');
      if (a.hide) { S.nophoto[u.key] = u.name || 1; u.photo = null; u.pimg = null; u._pl = 0; u.photoBad = 0; } else { delete S.nophoto[u.key]; }
      u.dirty = 1; save();
    },
    'mod.block': function (a) {
      var k = a.key; if (!k) throw new Error('no user');
      if (a.on === false) { delete S.blocked[k]; save(); return; }
      var u = users[k]; S.blocked[k] = (u && u.name) || a.n || k; if (u) leave(u); save();
    },
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
  function RCMD_clear() { bubClear(); order.slice().forEach(function (k) { var u = users[k]; u.inside = false; unseat(u, false); }); order = []; Object.keys(users).forEach(function (k) { delete users[k]; }); S.users = {}; overflowUI(); save(); }
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
  function rcZone(u) { return u.stage && stageOn() ? 'stage' : (u.atBar ? 'bar' : (u.vip && !isNicki(u) ? 'vip' : 'floor')); }
  function rcSnap(force) {
    var cnt = { total: 0, floor: 0, bar: 0, vip: 0, stage: 0 }, people = [];
    order.forEach(function (k) { var u = users[k]; if (!u || !u.inside) return; cnt.total++; var z = rcZone(u); cnt[z]++; people.push({ np: !!S.nophoto[u.key], ph: !!u.photo, k: u.key, n: u.name, p: u.plat, h: u.hnd, z: z, c: u.chats, d: u.dances, v: !!u.vip, e: !!isEarned(u), ec: u.grant ? -1 : Object.keys(u.ear || {}).length, eu: u.grant ? [] : Object.keys(EARN.items).filter(function (i) { return itemEarned(u, i); }).slice(0, 14).map(itemName), nk: isNicki(u), la: u.lastActive || 0 }); });
    people.sort(function (a, b) { return b.la - a.la; });
    var top = []; order.forEach(function (k) { var u = users[k]; if (u && u.inside && u.stage && S.top5 && !RW.on) top[u.rank || 0] = { n: u.name, s: u.show }; });
    var L = {}; Object.keys(LT).forEach(function (k) { if (k.charAt(0) !== '_') L[k] = LT[k]; });
    var snap = { t: 'state', ver: 1, ssn: !!(ws && ws.readyState === 1), cnt: cnt, k: CROWDK, top5: !!S.top5, top: top.filter(Boolean), light: L, np: S.np, vip: S.vip, mods: S.mods, need: S.need, maxOn: S.maxOn, spk: S.spk, lite: !!S.lite, liteAuto: S.lite === 'auto', codes: Object.keys(S.codes).map(function (t) { return { t: t, w: S.codes[t].word, on: S.codes[t].on, item: itemName(Object.keys(EARN.items).filter(function (i) { return EARN.items[i] === t; })[0]) }; }), cl: { on: CL.on, ph: CL.ph, left: CL.ph === 'last' ? Math.max(0, Math.ceil((CL.end - Date.now()) / 1000)) : 0, msg: S.closing }, rw: { on: RW.on, ph: RW.phase, left: RW.phase === 'vote' ? Math.max(0, Math.ceil((RW.end - Date.now()) / 1000)) : 0 }, lm: lastMsg ? Date.now() - lastMsg : null, mod: { blocked: Object.keys(S.blocked).map(function (k) { return { k: k, n: S.blocked[k] }; }), nophoto: Object.keys(S.nophoto).map(function (k) { return { k: k, n: S.nophoto[k] }; }) }, city: S.cityOn !== false, bub: { on: S.bub.on !== false, emoji: S.bub.emoji !== false, words: S.bub.words }, scale: R.scale, nicki: { done: !!S.nickiDone, inside: !!(users['x:nickiminaj'] && users['x:nickiminaj'].inside) }, people: people.slice(0, 200), log: (logEl.textContent || '').split('\n').slice(0, 12) };
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
  CITY.start(); spkBuild(); liteApply(); if (K_STEPS.indexOf(S.k) >= 0) CROWDK = S.k; buildSlots(); placeFixed(); buildGlows(); buildLed(); buildBartenders(); setBg(); buildPanel(); setNP(S.np.a, S.np.t); npStart(); vipUI(); lightUI(); tip(); setInterval(tip, 8000); connect(); rcStart();
  Object.keys(S.users || {}).forEach(function (k) { var sv = S.users[k]; if (sv.inside) { var u = newUser(k, sv.name, sv.plat, sv.photo); u.hnd = k.split(':')[1]; u.inside = true; u._restore = true; refreshVip(u); order.push(k); } });
  relayout();
  window.__vnn = { raw: handleRaw, mq: function () { return { q: MQ.length, dropped: mqDrop }; }, slots: function (k) { var o = makeSlots(k); return { floor: o.floor.length, bar: o.bar.length, vip: o.vip.length }; }, city: CITY, perf: function () { return { stride: STRIDE, ms: +fpsMs.toFixed(1), dt: +dtAvg.toFixed(1), cache: VNNA.cacheSize(), n: crowdList().length }; }, top5: setTop5, fit: autoFit, out: function () { var n = users['x:nickiminaj']; if (n) nickiWalkOut(n); }, k: function () { return CROWDK; }, np: setNP, chat: onMessage, raw: handleRaw, users: users, state: function () { return { S: S, R: R, LT: LT }; }, light: lightCmd, bots: addBots, nicki: nickiRehearse, rc: rcRecv, snap: rcSnap, drinks: { order: orderDrink, round: barRound, act: startAct, hold: holdOf }, demo: demoRun, emo: emojiOnly, bub: bubble, bubs: BUB, bubRule: bubRule };
})();
</script>
</body>
</html>
