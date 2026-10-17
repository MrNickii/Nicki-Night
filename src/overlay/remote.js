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
      if (a.dance && DANCES.indexOf(a.dance) >= 0) { u.dance = DANCES.indexOf(a.dance) + 1; }
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
