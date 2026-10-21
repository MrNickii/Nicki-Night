var STG = {};
(function () {
  /* ================= Style Studio (layered avatars) ================= */
  var CAT = VNNA.CATALOG, byId = VNNA.byId;
  function $(id) { return document.getElementById(id); }
  var Q = new URLSearchParams(location.search), MOD = Q.get('mod') === '1', LIBN = Q.get('lib') || 'mid';
  if (MOD) document.body.classList.add('mod');
  var LOOKS = CAT.looks.filter(function (l) { return l.unlock !== 'nicki'; });
  var CLR = CAT.colors.clothing.filter(function (c) { return !c.hidden; }), HC = CAT.hair.colors.filter(function (c) { return !c.hidden; }), AC = CAT.accessories.colors;
  var ITEMS = CAT.accessories.items.filter(function (a) { return !a.hidden; });
  function fresh() { return { top: 'tee', topColor: 'pink', bottom: 'jeans', bottomColor: null, shoes: 'sneakers', shoesColor: null, height: 'regular', body: 'straight', skin: 'caramel', hair: 'long', hairColor: 'brown', acc: [], accColor: 'gold', dance: 'groove' }; }
  var sel = fresh(), photoImg = null, photoURL = null, handle = '', plat = 'x', cat = 'tops', danceOn = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var RING = { x: '#1d9bf0', tiktok: '#fe2c55', kick: '#53fc18' };
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  /* ----- head (profile pic or placeholder) ----- */
  function headFn(ctx, x, y, a, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.save(); ctx.clip();
    if (photoImg && photoImg.complete && photoImg.naturalWidth) { var s = Math.max(2 * r / photoImg.naturalWidth, 2 * r / photoImg.naturalHeight); ctx.drawImage(photoImg, -photoImg.naturalWidth * s / 2, -photoImg.naturalHeight * s / 2, photoImg.naturalWidth * s, photoImg.naturalHeight * s); }
    else {
      var g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); g.addColorStop(0, '#ffb6d9'); g.addColorStop(1, '#b0307a'); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(0, -r * 0.18, r * 0.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, r * 0.78, r * 0.55, r * 0.4, 0, 0, 7); ctx.fill();
    }
    ctx.restore(); ctx.lineWidth = r * 0.07; ctx.strokeStyle = RING[plat] || '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.restore();
  }

  /* ----- stage ----- */
  var cvs = document.createElement('canvas'); cvs.width = 460; cvs.height = 840; $('fig').appendChild(cvs);
  var cx = cvs.getContext('2d'), cur = null, tok = 0, t0 = performance.now(), frozen = 1.0;
  function rebuild() { var my = ++tok; VNNA.build(sel).then(function (r) { if (my === tok) { cur = r; } }); }
  function frame(now) {
    if (cur) {
      cx.clearRect(0, 0, cvs.width, cvs.height);
      var s = 840 / 2010, t = danceOn ? (now - t0) / 1000 : frozen;
      VNNA.draw(cx, cur.set, cur.spec, { st: STG, now: performance.now() / 1000, x: 230, y: 2005 * s, h: 1700 * s * cur.spec.hs, clip: VNNA.clipOf(sel.dance), t: t, beat: 0.5, ph: 0, amp: 1, head: headFn });
    }
    requestAnimationFrame(frame);
  }

  /* ----- thumbnails ----- */
  var TH = {}, OFF = document.createElement('canvas'); OFF.width = 300; OFF.height = 600; var ox = OFF.getContext('2d');
  var REG = { head: [50, 60, 200, 185], torso: [50, 165, 200, 185], mid: [40, 215, 220, 204], legs: [20, 350, 260, 240], feet: [65, 432, 170, 158], full: [0, 0, 300, 600] };
  function thumbKey(S, region) { return region + '|' + [S.top, S.topColor, S.bottom, S.bottomColor, S.shoes, S.shoesColor, S.skin, S.hair, S.hairColor, S.body, S.height, S.acc.join(','), S.accColor].join(','); }
  function thumb(S, region) {
    var key = thumbKey(S, region); if (TH[key]) return Promise.resolve(TH[key]);
    return VNNA.build(S).then(function (r) {
      ox.clearRect(0, 0, 300, 600); VNNA.draw(ox, r.set, r.spec, { x: 150, y: 590, h: 540 * r.spec.hs, clip: 'idle', t: 0.9, beat: 0.5, head: headFn });
      var g = REG[region], c = document.createElement('canvas'); c.width = 168; c.height = region === 'full' ? 156 : Math.round(168 * g[3] / g[2]); var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      if (region === 'full') x.drawImage(OFF, 0, 40, 300, 560, 54, 0, 60, 156); else x.drawImage(OFF, g[0], g[1], g[2], g[3], 0, 0, c.width, c.height);
      return TH[key] = c.toDataURL('image/png');
    });
  }
  var thQ = Promise.resolve(), thTok = 0;
  function fillThumbs() {
    var my = ++thTok;
    Array.prototype.forEach.call($('opts').querySelectorAll('[data-th]'), function (el) {
      var d = JSON.parse(el.getAttribute('data-th')), S = Object.assign({}, sel, d.patch, { acc: d.patch.acc || sel.acc });
      thQ = thQ.then(function () { if (my !== thTok) return; return thumb(S, d.region).then(function (u) { if (my === thTok && el.isConnected) { el.classList.remove('ld'); el.innerHTML = '<img src="' + u + '" alt="">'; } }); }).catch(function () {});
    });
  }
  var UNL = { earned: ['🔒 Earn it', ''], vip: ['👑 VIP', 'vip'] };
  function eh(id, locked) { var e = (typeof VNNA !== 'undefined') && VNNA.EARN; return locked === 'earned' && e && e.items[id] ? e.tasks[e.items[id]].replace(/"/g, '&quot;') : ''; }
  function opt(id, name, patch, region, locked, on) {
    var hn = eh(id, locked);
    return '<button class="opt' + (on ? ' on' : '') + (locked ? ' locked' : '') + '" data-id="' + id + '">' + (locked ? '<span class="badge ' + UNL[locked][1] + '"' + (hn ? ' title="' + hn + '"' : '') + '>' + UNL[locked][0] + '</span>' : '') + '<div class="th ld" data-th=\'' + JSON.stringify({ patch: patch, region: region }) + '\'></div><div class="nm">' + name + '</div></button>';
  }
  function isFree(x) { return !x.unlock || x.unlock === 'free'; }
  function tiered(items, make, first) {
    var f = items.filter(isFree), e = items.filter(function (x) { return x.unlock === 'earned'; }), v = items.filter(function (x) { return x.unlock === 'vip'; });
    return '<div class="grid">' + (first || '') + f.map(make).join('') + '</div>' +
      (e.length ? '<div class="sub">\uD83D\uDD12 Earn it in the club <span class="subn">' + e.length + ' \u00b7 each has a riddle hint</span></div><div class="grid">' + e.map(make).join('') + '</div>' : '') +
      (v.length ? '<div class="sub">\uD83D\uDC51 VIP list <span class="subn">' + v.length + '</span></div><div class="grid">' + v.map(make).join('') + '</div>' : '');
  }
  function swatches(list, cur, key, noneLabel) {
    return '<div class="sw">' + (noneLabel ? '<button class="none ' + (!cur ? 'on' : '') + '" data-sw="' + key + '" data-id="" title="Original"></button>' : '') + list.map(function (c) { var bg = c.ombre ? 'linear-gradient(135deg,' + c.ombre.join(',') + ')' : c.hex; return '<button class="' + (cur === c.id ? 'on' : '') + '" data-sw="' + key + '" data-id="' + c.id + '" title="' + (c.name || c.id) + '" style="background:' + bg + '"></button>'; }).join('') + '</div>';
  }
  var CATS = [['tops', '👚', 'Tops'], ['bottoms', '👖', 'Bottoms'], ['shoes', '👟', 'Shoes'], ['hair', '💇', 'Hair'], ['acc', '✨', 'Extras'], ['skin', '🎨', 'Skin'], ['body', '📏', 'Size & shape'], ['dance', '🕺', 'Dance']];
  function renderCats() { $('cats').innerHTML = CATS.map(function (c) { return '<button data-c="' + c[0] + '" class="' + (cat === c[0] ? 'on' : '') + '">' + c[1] + ' ' + c[2] + '</button>'; }).join(''); }
  function regionFor(a) { return a.slot === 'neck' ? 'torso' : (a.slot === 'waist' ? 'mid' : (a.slot === 'carry' ? 'mid' : (a.slot === 'face' || a.slot === 'head' || a.slot === 'ears' ? 'head' : 'mid'))); }
  function accPatch(a) { var p = { acc: [a.id], accColor: sel.accColor || 'gold' }; if (a.slot === 'hands' || a.slot === 'wrist' || a.slot === 'arm' || a.slot === 'carry' || a.slot === 'waist') p.top = 'tank'; return p; }
  function renderOpts() {
    var h = '', o = $('opts'), sc = o.scrollTop;
    if (cat === 'tops') {
      var selTop = byId(LOOKS, sel.top) || {};
      h += '<div class="sub">Everyday fits</div>' + tiered(LOOKS, function (l) { return opt(l.id, l.name, { top: l.id }, l.dress ? 'full' : 'torso', isFree(l) ? null : l.unlock, sel.top === l.id); }).replace('<div class="grid">', '<div class="grid">');
      if (!selTop.sig && !selTop.nk) h += '<div class="sub">Top color <span class="subn">plain tops and dresses</span></div>' + swatches(CLR, sel.topColor, 'topColor', true);
      else h += '<p class="fx">This piece has its own full-color design, so there is no color to pick.</p>';
    } else if (cat === 'bottoms') {
      var selBot = byId(CAT.bottoms, sel.bottom) || {};
      h += tiered(CAT.bottoms, function (b) { return opt(b.id, b.name, { bottom: b.id, top: 'tank', topColor: 'white' }, 'legs', isFree(b) ? null : b.unlock, sel.bottom === b.id); });
      h += selBot.fixed ? '<p class="fx">This piece has its own full-color design, so there is no color to pick.</p>' : '<div class="sub">Bottom color</div>' + swatches(CLR, sel.bottomColor, 'bottomColor', true);
    } else if (cat === 'shoes') {
      var selSh = byId(CAT.shoes, sel.shoes) || {};
      h += tiered(CAT.shoes, function (s) { return opt(s.id, s.name, { shoes: s.id }, s.shaft ? 'legs' : 'feet', isFree(s) ? null : s.unlock, sel.shoes === s.id); });
      h += selSh.fixed ? '<p class="fx">This piece has its own full-color design, so there is no color to pick.</p>' : '<div class="sub">Shoe color</div>' + swatches(CLR, sel.shoesColor, 'shoesColor', true);
    } else if (cat === 'hair') {
      h += '<div class="sub">Style</div>' + tiered(CAT.hair.styles, function (s) { return opt(s.id, s.name, { hair: s.id }, 'head', isFree(s) ? null : s.unlock, sel.hair === s.id); }, '<button class="opt' + (!sel.hair ? ' on' : '') + '" data-id=""><div class="th ld" data-th=\'' + JSON.stringify({ patch: { hair: null, hairColor: null }, region: 'head' }) + '\'></div><div class="nm">No hair</div></button>');
      h += '<div class="sub">Hair color</div>' + swatches(HC, sel.hairColor, 'hairColor', false);
    } else if (cat === 'acc') {
      var anyTint = sel.acc.some(function (id) { var x = byId(ITEMS, id); return x && !x.full; });
      h += '<div class="sub">Pick any (tap again to remove)</div>' + tiered(ITEMS, function (a) { var on = sel.acc.indexOf(a.id) >= 0; return opt(a.id, a.name, accPatch(a), regionFor(a), isFree(a) ? null : a.unlock, on); });
      if (anyTint || !sel.acc.length) h += '<div class="sub">Accessory color <span class="subn">full-color pieces ignore this</span></div>' + swatches(AC, sel.accColor, 'accColor', false);
    } else if (cat === 'skin') {
      h += '<div class="sub">Skin tone</div>' + swatches(CAT.skin, sel.skin, 'skin', false) + '<div class="swn">' + (byId(CAT.skin, sel.skin) || {}).name + '</div>';
    } else if (cat === 'body') {
      h += '<div class="sub">Height</div><div class="seg">' + CAT.heights.map(function (x) { return '<button class="btn ' + (sel.height === x.id ? 'on' : '') + '" data-h="' + x.id + '">' + x.label + '</button>'; }).join('') + '</div><div class="sub">Shape</div><div class="seg">' + CAT.bodies.map(function (b) { return '<button class="btn ' + (sel.body === b ? 'on' : '') + '" data-b="' + b + '">' + b.charAt(0).toUpperCase() + b.slice(1) + '</button>'; }).join('') + '</div>';
    } else if (cat === 'dance') {
      h += '<div class="sub">Your move (it plays on the left)</div><div class="seg">' + CAT.dances.map(function (d) { return '<button class="btn ' + (sel.dance === d.id ? 'on' : '') + '" data-d="' + d.id + '">' + d.name + '</button>'; }).join('') + '</div>';
    }
    o.innerHTML = h; o.scrollTop = sc; fillThumbs();
  }
  function cmdText() {
    var p = [], S = sel;
    if (S.top) p.push(S.top); if (S.topColor && !((byId(LOOKS, S.top) || {}).sig)) p.push(S.topColor);
    if (S.bottom && !(byId(LOOKS, S.top) || {}).dress) { p.push(S.bottom); if (S.bottomColor) p.push(S.bottomColor); }
    if (S.shoes) { p.push(S.shoes); if (S.shoesColor) p.push(S.shoesColor); }
    if (S.height !== 'regular') p.push(S.height); if (S.body === 'curvy') p.push('curvy'); p.push(S.skin);
    if (S.hair) { p.push(S.hair); if (S.hairColor) p.push(S.hairColor); }
    S.acc.forEach(function (a) { p.push(a); }); if (S.acc.length && S.accColor) p.push(S.accColor);
    return '!look ' + p.join(' ');
  }
  function lockInfo() {
    var t = byId(LOOKS, sel.top), b = byId(CAT.bottoms, sel.bottom), w = [];
    if (t && t.unlock === 'vip') return '👑 ' + t.name + ' is VIP-list only. Preview it here, but it only works for the VIP list.';
    if (t && t.unlock === 'earned') w.push(t.name); if (b && b.unlock === 'earned' && !(t && t.dress)) w.push(b.name);
    var vipAcc = sel.acc.map(function (id) { return byId(ITEMS, id); }).filter(function (a) { return a && a.unlock === 'vip'; });
    if (vipAcc.length && !w.length) return '👑 ' + vipAcc[0].name + ' is VIP-list only.';
    return w.length ? '🔒 ' + w.join(' + ') + ': you can preview it here, but you have to earn it. Hang out, dance and chat in the club and it unlocks on its own.' : '';
  }
  function paint() {
    rebuild();
    $('cmd').textContent = cmdText(); var l = lockInfo(), m = $('lockmsg'); m.style.display = l ? 'block' : 'none'; m.textContent = l;
    $('how').textContent = MOD ? '' : '1) Type !enter in the live chat  2) Paste this command  3) Come back as often as you like. Looks you have not earned show a lock.';
    $('dnc').className = 'btn sm' + (danceOn ? ' on' : ''); $('dnc').textContent = danceOn ? 'Dancing' : 'Paused';
    $('note').textContent = handle ? '' : 'Tip: add your @ to see your profile pic on your avatar';
    if (MOD && window.parent !== window) { try { parent.postMessage({ vnnLook: { look: cmdText().replace(/^!look\s*/, ''), dance: sel.dance } }, '*'); } catch (e) {} }
  }
  function all() { renderCats(); renderOpts(); paint(); }
  function toast(t) { var e = $('toast'); e.textContent = t; e.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.className = ''; }, 1900); }
  function copy(text) {
    function ok() { toast('Copied! Paste it in chat'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fb); else fb();
    function fb() { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Press and hold to copy'); } t.remove(); }
  }
  $('cats').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; renderCats(); renderOpts(); $('opts').scrollTop = 0; };
  $('opts').onclick = function (e) {
    var sw = e.target.closest('[data-sw]'), b = e.target.closest('.opt'), hh = e.target.closest('[data-h]'), bb = e.target.closest('[data-b]'), dd = e.target.closest('[data-d]');
    if (sw) { var k = sw.dataset.sw, v = sw.dataset.id || null; sel[k] = (sel[k] === v && k !== 'skin' && k !== 'hairColor' && k !== 'accColor') ? null : v; if (k === 'hairColor' && v && !sel.hair) sel.hair = 'long'; }
    else if (hh) sel.height = hh.dataset.h; else if (bb) sel.body = bb.dataset.b; else if (dd) sel.dance = dd.dataset.d;
    else if (b) {
      var id = b.dataset.id;
      if (cat === 'tops') sel.top = id; else if (cat === 'bottoms') sel.bottom = id; else if (cat === 'shoes') sel.shoes = id;
      else if (cat === 'hair') { sel.hair = id || null; if (!id) sel.hairColor = null; else if (!sel.hairColor) sel.hairColor = 'brown'; }
      else if (cat === 'acc') { var i = sel.acc.indexOf(id), it = byId(ITEMS, id); if (i >= 0) sel.acc.splice(i, 1); else { sel.acc = sel.acc.filter(function (x) { var o = byId(ITEMS, x); return !(o && it && o.slot === it.slot); }); sel.acc.push(id); } }
    } else return;
    all();
  };
  $('copy').onclick = function () { copy(cmdText()); };
  $('copyd').onclick = function () { copy('!dance ' + sel.dance); };
  $('dnc').onclick = function () { danceOn = !danceOn; frozen = (performance.now() - t0) / 1000; paint(); };
  $('rst').onclick = function () { sel = fresh(); all(); };
  function pk(a) { return a[Math.floor(Math.random() * a.length)]; }
  $('rnd').onclick = function () {
    var free = LOOKS.filter(function (l) { return l.unlock === 'free' && !l.sig; });
    sel.top = pk(free).id; sel.topColor = pk(CLR).id; sel.bottom = pk(CAT.bottoms.filter(function (b) { return b.unlock === 'free'; })).id; sel.bottomColor = Math.random() < .5 ? pk(CLR).id : null;
    sel.shoes = pk(CAT.shoes).id; sel.shoesColor = Math.random() < .5 ? pk(CLR).id : null; sel.skin = pk(CAT.skin).id; sel.hair = pk(CAT.hair.styles).id; sel.hairColor = pk(HC).id;
    sel.acc = Math.random() < .6 ? [pk(ITEMS.filter(function (a) { return !a.unlock; })).id] : []; sel.accColor = pk(AC).id; sel.height = pk(CAT.heights).id; sel.body = pk(['straight', 'curvy']); sel.dance = pk(CAT.dances).id; all();
  };
  /* profile photo */
  function setPhoto(url) { photoURL = url; if (!url) { photoImg = null; return; } var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { photoImg = im; }; im.src = url; }
  function lookup() {
    handle = $('h').value.trim().replace(/^@/, ''); plat = $('pl').value;
    if (!handle) { setPhoto(null); paint(); return; }
    var prov = plat === 'x' ? 'twitter' : (plat === 'tiktok' ? 'tiktok' : null);
    if (!prov) { toast('Kick photos cannot be looked up, so Kick shows initials'); setPhoto(null); paint(); return; }
    var url = 'https://unavatar.io/' + prov + '/' + encodeURIComponent(handle) + '?fallback=false', im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () { photoImg = im; photoURL = url; paint(); toast('Found @' + handle); }; im.onerror = function () { setPhoto(null); paint(); toast('Could not find a photo, so initials are shown'); };
    im.src = url;
  }
  $('h').onchange = lookup; $('pl').onchange = lookup; $('h').onkeydown = function (e) { if (e.key === 'Enter') { this.blur(); } };
  if (Q.get('h')) { $('h').value = Q.get('h'); if (Q.get('p')) $('pl').value = Q.get('p'); lookup(); }
  window.__sty = { sel: function () { return sel; }, set: function (o) { Object.assign(sel, o); all(); }, cmd: cmdText, cat: function (c) { cat = c; all(); }, ready: false };
  VNNA.setCache(36);
  VNNA.init('vnn/lib_' + LIBN + '/', 'vnn/moc.json').then(function () { all(); requestAnimationFrame(frame); $('boot').className = 'off'; window.__sty.ready = true; }).catch(function (e) { $('boot').textContent = 'Could not load the wardrobe: ' + e.message; });
})();
</script></body></html>
