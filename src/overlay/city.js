
  /* ================= living city window (round window, top right) =================
     A small canvas sits exactly over the glass. Everything is drawn from the room art itself:
     the river shimmers, stars and tower lights twinkle, some windows switch off and on, cars cross
     the bridge, a boat drifts by, a plane blinks past, haze drifts, and now and then fireworks go off.
     The frame, the mullion and the sofa are never touched. */
  var CITY = (function () {
    var X0 = 1553, Y0 = 0, CW = 340, CH = 330, CX = 1723, CY = 160, CR = 150, GB = 306, MUL = [1729, 1738];
    var cv = $('city'), g = cv ? cv.getContext('2d') : null, img = new Image(), bc = null, bd = null, ready = false;
    var st = { on: true, fps: 24, fwAuto: true };
    var stars = [], wins = [], lamps = [], cars = [], boats = [], parts = [], glints = [], haze = [], plane = null, shoot = null, nextFw = 0, nextBoat = 0, nextPlane = 0, nextShoot = 0, last = 0, tSec = 0, raf = 0, frames = 0;
    var BEACONS = [[1666, 67], [1633, 67], [1789, 63], [1835, 88], [1681, 112]];
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function px(x, y) { var i = ((y | 0) * CW + (x | 0)) * 4; return [bd[i], bd[i + 1], bd[i + 2]]; }
    function inGlass(x, y) { var dx = x - CX, dy = y - CY; return dx * dx + dy * dy < (CR - 4) * (CR - 4) && y < GB - 2 && (x < MUL[0] - 2 || x > MUL[1] + 2); }
    function scan() {
      /* find the bright dots in the art: stars (sky) and tower lights (skyline) */
      var x, y, i, lum = function (a, b) { var p = px(a - X0, b - Y0); return Math.max(p[0], p[1], p[2]); };
      for (y = 6; y < 212; y += 1) for (x = X0 + 20; x < X0 + CW - 20; x += 1) {
        if (!inGlass(x, y)) continue;
        var L = lum(x, y); if (L < (y < 100 ? 120 : 175)) continue;
        var m = 0, k, j; for (k = -2; k <= 2; k++) for (j = -2; j <= 2; j++) { if (!k && !j) continue; var l2 = lum(x + k, y + j); if (l2 > m) m = l2; }
        if (L < m) continue;
        var around = (lum(x - 4, y) + lum(x + 4, y) + lum(x, y - 4) + lum(x, y + 4)) / 4;
        if (L - around < (y < 100 ? 22 : 35)) continue;
        var p = px(x - X0, y - Y0), o = { x: x - X0, y: y - Y0, r: p[0], g: p[1], b: p[2], ph: Math.random() * 6.28, f: rnd(0.6, 2.4), L: L };
        if (y < 100 && p[2] >= p[0] * 0.7) stars.push(o); else if (y >= 100) { wins.push(o); }
      }
      /* the art's own stars are faint: add extra twinkles only on sky-coloured pixels above the skyline */
      var tries = 0; while (stars.length < 90 && tries++ < 4000) { var sx = rnd(X0 + 10, X0 + CW - 10), sy = rnd(4, 120); if (!inGlass(sx, sy)) continue; var sp = px(sx - X0, sy - Y0); if (sp[2] > sp[0] * 0.62 && Math.max(sp[0], sp[1], sp[2]) > 70 && Math.max(sp[0], sp[1], sp[2]) < 190 && sp[1] < sp[2]) stars.push({ x: sx - X0, y: sy - Y0, r: 255, g: 235, b: 255, ph: Math.random() * 6.28, f: rnd(0.5, 2.2), L: 200 }); }
      /* keep it light: sample, and choose a few windows that can switch off and on */
      function cap(a, n) { while (a.length > n) a.splice((Math.random() * a.length) | 0, 1); }
      cap(stars, 160); cap(wins, 230);
      wins.forEach(function (w, idx) { w.sw = idx % 4 === 0; w.off = 0; w.nt = rnd(2, 20); w.fade = 0; var q = px(w.x, Math.max(0, w.y - 5)); w.dk = [Math.round(q[0] * 0.6), Math.round(q[1] * 0.55), Math.round(q[2] * 0.6)]; });
      for (i = 0; i < 4; i++) haze.push({ x: rnd(-60, CW), y: rnd(30, 190), r: rnd(70, 130), v: rnd(2, 6), a: rnd(0.05, 0.1), hue: i % 2 ? 330 : 285 });
    }
    function deckY(x, lane) { return 192 + (x - 1566) * 0.1126 + (lane ? 7 : 3) - Y0; }
    function mkCars() {
      var i; cars = [];
      for (i = 0; i < 16; i++) cars.push({ x: rnd(X0, X0 + CW), lane: 0, v: rnd(10, 22), big: Math.random() < 0.12 });
      for (i = 0; i < 16; i++) cars.push({ x: rnd(X0, X0 + CW), lane: 1, v: -rnd(12, 26), big: Math.random() < 0.1 });
    }
    function mkBoat() { var dir = Math.random() < 0.5 ? 1 : -1, yy = rnd(240, 282); boats.push({ x: dir > 0 ? -20 : CW + 20, y: yy - Y0 + Y0, dir: dir, v: rnd(5, 9), s: 0.7 + (yy - 238) / 70, ph: Math.random() * 6 }); }
    function mkPlane() { var dir = Math.random() < 0.5 ? 1 : -1; plane = { x: dir > 0 ? 10 : CW - 10, y: rnd(22, 70), dir: dir, v: rnd(14, 22), ph: Math.random() * 3 }; }
    function mkShoot() { var x = rnd(60, 260), y = rnd(10, 50); shoot = { x: x, y: y, vx: rnd(150, 230) * (Math.random() < 0.5 ? 1 : -1), vy: rnd(70, 110), life: 0, max: 0.55 }; }
    function fire(n, at) {
      var cx = at ? at[0] : rnd(50, 280), cy = at ? at[1] : rnd(30, 105), cols = [[255, 120, 200], [255, 215, 120], [255, 255, 255], [190, 150, 255], [255, 90, 120]], c = cols[(Math.random() * cols.length) | 0], c2 = cols[(Math.random() * cols.length) | 0], i, N = n || 46;
      for (i = 0; i < N; i++) { var a = Math.PI * 2 * i / N + rnd(-0.08, 0.08), sp = rnd(52, 96) * (i % 2 ? 0.6 : 1), cc = i % 3 ? c : c2; parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(1.3, 2.0), r: cc[0], g: cc[1], b: cc[2] }); }
      parts.push({ x: cx, y: cy, vx: 0, vy: 0, life: 0, max: 0.35, r: 255, g: 255, b: 255, flash: 1 });
    }
    function glow(x, y, rad, r, gg, b, a) {
      var gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!ready || !st.on) return;
      if (now - last < 1000 / st.fps) return;
      var dt = Math.min(0.1, (now - last) / 1000); last = now; tSec += dt; var t = tSec; frames++;
      g.clearRect(0, 0, CW, CH); g.save();
      g.beginPath(); g.arc(CX - X0, CY - Y0, CR - 3, 0, 7); g.clip(); g.beginPath(); g.rect(0, 0, CW, GB - Y0); g.clip();
      var y, i, k;
      /* river: slices of the real reflection slide gently */
      for (y = 214; y < GB; y += 2) { var a = 0.45 + (y - 214) * 0.017, dx = Math.sin(y * 0.33 + t * 1.25) * a + Math.sin(y * 0.12 - t * 0.7) * a * 0.7; g.drawImage(bc, 0, y - Y0, CW, 2, dx, y - Y0, CW, 2); }
      g.globalCompositeOperation = 'lighter';
      /* water glints */
      if (Math.random() < dt * 14) glints.push({ x: rnd(30, CW - 30), y: rnd(222, 298) - Y0, life: 0, max: rnd(0.5, 1.1), w: rnd(3, 8), c: Math.random() < 0.7 ? [255, 120, 200] : [255, 200, 235] });
      for (i = glints.length - 1; i >= 0; i--) { var gl = glints[i]; gl.life += dt; if (gl.life > gl.max) { glints.splice(i, 1); continue; } var ga = Math.sin(gl.life / gl.max * Math.PI) * 0.4; g.fillStyle = 'rgba(' + gl.c[0] + ',' + gl.c[1] + ',' + gl.c[2] + ',' + ga + ')'; g.fillRect(gl.x - gl.w / 2, gl.y, gl.w, 1.2); }
      /* drifting haze in front of the skyline */
      for (i = 0; i < haze.length; i++) { var hz = haze[i]; hz.x += hz.v * dt; if (hz.x - hz.r > CW) hz.x = -hz.r; glow(hz.x, hz.y, hz.r, hz.hue > 300 ? 255 : 200, hz.hue > 300 ? 120 : 110, hz.hue > 300 ? 190 : 255, hz.a * (0.75 + 0.25 * Math.sin(t * 0.3 + i))); }
      /* stars */
      for (i = 0; i < stars.length; i++) { var s = stars[i], tw = 0.5 + 0.5 * Math.sin(t * s.f + s.ph); tw = tw * tw; if (tw < 0.08) continue; glow(s.x, s.y, 3.2, 255, 240, 255, 0.5 * tw); }
      /* tower lights: twinkle, and some windows switch off and on */
      for (i = 0; i < wins.length; i++) {
        var w = wins[i];
        if (w.sw) { w.nt -= dt; if (w.nt <= 0) { w.off = w.off ? 0 : 1; w.nt = w.off ? rnd(3, 9) : rnd(6, 28); } w.fade += ((w.off ? 1 : 0) - w.fade) * Math.min(1, dt * 6); }
        var tw2 = 0.55 + 0.45 * Math.sin(t * w.f + w.ph);
        if (!w.sw || w.fade < 0.6) glow(w.x, w.y, 3, Math.min(255, w.r + 40), Math.min(255, w.g + 40), Math.min(255, w.b + 40), 0.28 * tw2 * (1 - w.fade));
      }
      g.globalCompositeOperation = 'source-over';
      for (i = 0; i < wins.length; i++) { var w2 = wins[i]; if (w2.sw && w2.fade > 0.05) { g.fillStyle = 'rgba(' + w2.dk[0] + ',' + w2.dk[1] + ',' + w2.dk[2] + ',' + (0.92 * w2.fade) + ')'; g.fillRect(w2.x - 1.6, w2.y - 1.6, 3.2, 3.2); } }
      g.globalCompositeOperation = 'lighter';
      /* beacons on the spires */
      for (i = 0; i < BEACONS.length; i++) { var bb = BEACONS[i], pu = Math.pow(0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7), 3); glow(bb[0] - X0, bb[1] - Y0, 5.5, 255, 60, 90, 0.2 + 0.7 * pu); }
      /* traffic on the bridge */
      for (i = 0; i < cars.length; i++) {
        var c = cars[i]; c.x += c.v * dt; if (c.v > 0 && c.x > X0 + CW) c.x = X0 - 6; if (c.v < 0 && c.x < X0 - 6) c.x = X0 + CW + 6;
        var cx = c.x - X0, cyy = deckY(c.x, c.lane); if (!inGlass(c.x, cyy + Y0)) continue;
        if (c.v > 0) { g.fillStyle = 'rgba(255,70,80,.95)'; g.fillRect(cx, cyy, 1.4, 1.2); g.fillRect(cx + 2.2, cyy, 1.4, 1.2); glow(cx + 1.8, cyy + 0.6, c.big ? 5 : 3.5, 255, 40, 70, 0.4); }
        else { g.fillStyle = 'rgba(255,245,215,.98)'; g.fillRect(cx, cyy, 1.4, 1.2); g.fillRect(cx + 2.2, cyy, 1.4, 1.2); glow(cx + 1.8, cyy + 0.6, c.big ? 5.5 : 4, 255, 235, 190, 0.45); }
      }
      /* boat */
      if (!boats.length && t > nextBoat) { mkBoat(); nextBoat = t + rnd(25, 50); }
      for (i = boats.length - 1; i >= 0; i--) {
        var bt = boats[i]; bt.x += bt.dir * bt.v * dt; if (bt.x < -30 || bt.x > CW + 30) { boats.splice(i, 1); continue; }
        var by = bt.y + Math.sin(t * 1.3 + bt.ph) * 0.4, sc = bt.s;
        g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(bt.x - 0.5, by - 4 * sc, 1.2, 1.2);
        g.fillStyle = bt.dir > 0 ? 'rgba(80,255,120,.95)' : 'rgba(255,70,70,.95)'; g.fillRect(bt.x + 2.5 * bt.dir * sc - 0.6, by - 0.4, 1.3, 1.3);
        glow(bt.x, by - 1, 6 * sc, 255, 220, 240, 0.32);
        g.fillStyle = 'rgba(255,200,230,.35)'; g.fillRect(bt.x - bt.dir * 9 * sc, by + 1.2, 12 * sc, 0.8); g.fillRect(bt.x - bt.dir * 15 * sc, by + 2.6, 9 * sc, 0.6);
      }
      /* plane */
      if (!plane && t > nextPlane) { mkPlane(); nextPlane = t + rnd(35, 75); }
      if (plane) {
        plane.x += plane.dir * plane.v * dt; if (plane.x < 6 || plane.x > CW - 6) plane = null;
        else { var pr = (Math.sin(t * 5 + plane.ph) > 0.65) ? 1 : 0, pw = (Math.sin(t * 2 + plane.ph) > 0.95) ? 1 : 0; g.fillStyle = 'rgba(255,60,60,' + (0.35 + 0.65 * pr) + ')'; g.fillRect(plane.x, plane.y, 1.4, 1.4); if (pw) glow(plane.x, plane.y, 6, 255, 255, 255, 0.8); g.fillStyle = 'rgba(120,255,160,.7)'; g.fillRect(plane.x - plane.dir * 4, plane.y + 0.2, 1, 1); }
      }
      /* shooting star */
      if (!shoot && t > nextShoot) { mkShoot(); nextShoot = t + rnd(22, 50); }
      if (shoot) {
        shoot.life += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt;
        var sa = Math.sin(Math.min(1, shoot.life / shoot.max) * Math.PI);
        g.strokeStyle = 'rgba(255,240,255,' + (0.8 * sa) + ')'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(shoot.x, shoot.y); g.lineTo(shoot.x - shoot.vx * 0.09, shoot.y - shoot.vy * 0.09); g.stroke();
        if (shoot.life > shoot.max) shoot = null;
      }
      /* fireworks */
      if (st.fwAuto && t > nextFw) { fire(); nextFw = t + rnd(40, 85); }
      for (i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life += dt; if (p.life > p.max) { parts.splice(i, 1); continue; }
        var f = 1 - p.life / p.max;
        if (p.flash) { glow(p.x, p.y, 26, 255, 255, 255, 0.75 * f); continue; }
        p.vy += 34 * dt; p.vx *= 0.975; p.vy *= 0.975; p.x += p.vx * dt; p.y += p.vy * dt;
        g.strokeStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (0.9 * f) + ')'; g.lineWidth = 1.7; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.11, p.y - p.vy * 0.11); g.stroke();
        glow(p.x, p.y, 4.5, p.r, p.g, p.b, 0.42 * f);
      }
      g.globalCompositeOperation = 'source-over'; g.restore();
      g.clearRect(MUL[0] - X0 - 4, 0, MUL[1] - MUL[0] + 8, CH);
    }
    function start() {
      if (!cv || ready) return;
      img.onload = function () {
        try {
          bc = document.createElement('canvas'); bc.width = CW; bc.height = CH; var x = bc.getContext('2d'); x.drawImage(img, X0, Y0, CW, CH, 0, 0, CW, CH);
          bd = x.getImageData(0, 0, CW, CH).data; scan(); mkCars(); nextFw = 14; nextBoat = 6; nextPlane = 20; nextShoot = 9; ready = true; cv.style.display = st.on ? 'block' : 'none';
        } catch (e) { console.error('city', e); }
      };
      img.src = ART; raf = requestAnimationFrame(frame);
    }
    function set(on) { st.on = !!on; if (cv) { cv.style.display = st.on && ready ? 'block' : 'none'; if (!st.on) g.clearRect(0, 0, CW, CH); } }
    return { start: start, set: set, fire: function (n) { for (var i = 0; i < (n || 1); i++) fire(46, i ? [rnd(40, 300), rnd(30, 110)] : null); }, stats: function () { return { ready: ready, on: st.on, stars: stars.length, wins: wins.length, cars: cars.length, boats: boats.length, parts: parts.length, frames: frames }; }, state: st };
  })();
