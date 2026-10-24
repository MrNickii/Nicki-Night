/* Shared connection for the Host and Mod panels: same relay, room and command format as the main control panel. */
var PANEL = (function () {
  var $ = function (i) { return document.getElementById(i); };
  var Q = new URLSearchParams(location.search);
  function ld(k, d) { try { var v = localStorage.getItem('vnnctl_' + k); return v == null ? d : v; } catch (e) { return d; } }
  function sv(k, v) { try { localStorage.setItem('vnnctl_' + k, v); } catch (e) { } }
  var C = { session: Q.get('session') || ld('session', ''), pin: Q.get('pin') || ld('pin', ''), relay: Q.get('relay') || ld('relay', '') };
  if (Q.get('session')) sv('session', C.session);
  var ROLE = '', BY = '', me = Math.random().toString(36).slice(2, 8), ws = null, bc = null, up = false, tries = 0, T = null, st = null, lastSeen = 0, pend = {}, seq = 0, hooks = [];
  function room() { return 'vnn-' + (C.session || 'local') + (C.pin ? '-' + C.pin : ''); }
  function toast(t, k) { var e = $('toast'); if (!e) return; e.textContent = t; e.className = 'on ' + (k || ''); clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 2200); }
  function raw(o) { o.from = me; var s = JSON.stringify({ vnn: o }); if (ws && ws.readyState === 1) try { ws.send(s); } catch (e) { } if (bc) try { bc.postMessage(s); } catch (e) { } }
  function cmd(c, a, okMsg) {
    return new Promise(function (res) {
      var id = ++seq + '-' + me; pend[id] = res; raw({ t: 'cmd', c: c, a: a || {}, id: id, role: ROLE, by: BY });
      setTimeout(function () { if (pend[id]) { delete pend[id]; res({ ok: false, msg: 'No answer from the overlay' }); } }, 4500);
    }).then(function (r) { if (r && r.ok === false) toast(r.msg || 'Did not work', 'bad'); else if (okMsg) toast(okMsg, 'ok'); return r; });
  }
  function parse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function recv(d) {
    var p = null; (function w(o, n) { if (!o || n > 5 || p) return; if (o.vnn) { p = o.vnn; return; } if (Array.isArray(o)) return o.forEach(function (y) { w(y, n + 1); }); ['overlayNinja', 'dataReceived', 'contents'].forEach(function (k) { if (o[k]) w(o[k], n + 1); }); })(d, 0);
    if (!p || p.from === me) return;
    if (p.t === 'state') { st = p; lastSeen = Date.now(); hooks.forEach(function (f) { try { f(st); } catch (e) { console.error(e); } }); paint(); }
    else if (p.t === 'ack' && pend[p.id]) { var f = pend[p.id]; delete pend[p.id]; f(p); }
  }
  var cs = [null, ''];
  function start() {
    clearTimeout(T);
    try { if (!bc && window.BroadcastChannel) { bc = new BroadcastChannel(room()); bc.onmessage = function (e) { recv(parse(e.data)); }; } } catch (e) { }
    if (ws) { try { ws.onclose = null; ws.close(); } catch (e) { } ws = null; }
    if (!C.session && !C.relay) { cs = [false, 'Open the link you were sent (it has the session in it)']; paint(); return; }
    try { ws = new WebSocket(C.relay || 'wss://io.socialstream.ninja'); } catch (e) { cs = [false, 'Bad relay address']; paint(); return; }
    cs = [null, 'Connecting…']; paint();
    ws.onopen = function () { tries = 0; up = true; ws.send(JSON.stringify({ join: room(), in: 6, out: 5 })); raw({ t: 'hello' }); cs = [null, 'Waiting for the overlay…']; paint(); };
    ws.onmessage = function (e) { recv(parse(e.data)); };
    ws.onclose = function () { up = false; tries++; cs = [false, 'Reconnecting…']; paint(); T = setTimeout(start, Math.min(12000, 1200 * tries)); };
    ws.onerror = function () { };
  }
  function paint() {
    var live = st && Date.now() - lastSeen < 20000, d = $('d1'), s = $('s1'); if (!d) return;
    if (live) { d.className = 'dot ok'; s.textContent = 'Connected · ' + (st.cnt ? st.cnt.total : 0) + ' inside'; }
    else if (cs[0] === false) { d.className = 'dot'; s.textContent = cs[1]; }
    else { d.className = 'dot warn'; s.textContent = cs[1] || 'Waiting for the overlay…'; }
  }
  setInterval(function () { paint(); if (up && Date.now() - lastSeen > 9000) raw({ t: 'hello' }); }, 3000);
  /* same PIN as the main control panel; remembered on this device */
  function gate(cb) {
    var H = 'fc97275e3a4221bf48abec981a60b96422fd39fa9c0a0e2b3404db4e18a390be', g = $('gate');
    function ok() { if (g) g.remove(); cb(); }
    try { if (localStorage.getItem('vnn_pin') === H) { ok(); return; } } catch (e) { }
    function sha(t) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
    function go() { var v = $('gin').value.trim(); sha('vnn-pin:' + v).then(function (h) { if (h === H) { try { localStorage.setItem('vnn_pin', H); } catch (e) { } ok(); } else { $('gmsg').textContent = 'Wrong PIN'; $('gin').value = ''; } }); }
    $('gbtn').onclick = go; $('gin').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
  /* a button that needs a second tap within 3 seconds (for blocking people) */
  function armed(b, f) { if (b.classList.contains('arm')) { b.classList.remove('arm'); clearTimeout(b._t); b.textContent = b._lbl; f(); return; } b._lbl = b.textContent; b.classList.add('arm'); b.textContent = 'Tap again'; b._t = setTimeout(function () { b.classList.remove('arm'); b.textContent = b._lbl; }, 3000); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* who is using this panel: picked once per device, sent with every action so the room can say who did it */
  function ident(role, names, cb) {
    ROLE = role; var saved = ld('me_' + role, '');
    function done(n) { BY = n; sv('me_' + role, n); var w = $('who'); if (w) w.innerHTML = 'You: <b>@' + esc(n) + '</b> <button type="button" id="whochg">change</button>'; var c = $('whochg'); if (c) c.onclick = function () { pick(); }; cb && cb(); cb = null; }
    function pick() {
      var d = document.createElement('div'); d.id = 'whobox';
      d.innerHTML = '<div class="wb"><h2>Who are you?</h2><p>Pick your name. It shows on stream when you press a button.</p><div class="grid">' + names.map(function (n) { return '<button class="b go" data-n="' + esc(n) + '">@' + esc(n) + '</button>'; }).join('') + '</div><div class="row" style="margin-top:12px"><input type="text" id="whoin" placeholder="Someone else? Type your @" autocapitalize="off" autocorrect="off"><button class="b" id="whook" style="flex:0 0 90px">OK</button></div></div>';
      document.body.appendChild(d);
      d.onclick = function (e) { var b = e.target.closest('[data-n]'); if (b) { d.remove(); done(b.dataset.n); } };
      $('whook').onclick = function () { var v = $('whoin').value.replace(/[^A-Za-z0-9_.]/g, '').slice(0, 24); if (v) { d.remove(); done(v); } };
    }
    if (saved) done(saved); else pick();
  }
  return { ident: ident, $: $, cmd: cmd, toast: toast, start: start, gate: gate, on: function (f) { hooks.push(f); }, st: function () { return st; }, armed: armed, esc: esc };
})();
