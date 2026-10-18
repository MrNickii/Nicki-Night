/* Virtual Nicki Night - the full guide, opened from the Style Studio's "Guide" button */
(function () {
  var Q = new URLSearchParams(location.search);
  if (Q.get('mod') === '1') return; /* hidden inside the host control panel */
  function el(t, a, h) { var e = document.createElement(t); if (a) Object.keys(a).forEach(function (k) { e.setAttribute(k, a[k]); }); if (h != null) e.innerHTML = h; return e; }
  function C(cmd, note) { return '<button type="button" class="gc" data-copy="' + cmd.replace(/"/g, '&quot;') + '">' + cmd.replace(/</g, '&lt;') + '</button>' + (note ? '<span class="gn">' + note + '</span>' : ''); }
  function row(cmd, text) { return '<div class="gr">' + C(cmd) + '<div class="gt">' + text + '</div></div>'; }

  var SECTIONS = [
    { id: 'quick', ic: '⚡', t: 'Start here', h:
      '<p class="lead">You get your own animated character in the club. Your chat messages are your controls. No app, no download.</p>' +
      '<div class="steps">' +
      '<div class="step"><b>1</b><div><h4>Style yourself</h4><p>Pick your top, bottoms, shoes, hair and more in this Studio, then tap <em>Copy command</em>.</p></div></div>' +
      '<div class="step"><b>2</b><div><h4>Join the club</h4><p>In the live chat type ' + C('!enter') + ' Your character walks in through the door.</p></div></div>' +
      '<div class="step"><b>3</b><div><h4>Wear your look</h4><p>Paste the command you copied. It looks like ' + C('!look varsity black cargo green') + '</p></div></div>' +
      '<div class="step"><b>4</b><div><h4>Dance</h4><p>Type ' + C('!dance') + ' for a random move or ' + C('!dance twerk') + ' to pick one.</p></div></div>' +
      '<div class="step"><b>5</b><div><h4>Grab a drink</h4><p>Type ' + C('!bar') + ' then ' + C('!drink martini') + ' and ' + C('!cheers') + '</p></div></div>' +
      '<div class="step"><b>6</b><div><h4>Chat</h4><p>Everything you say shows above your head in your own color. Send just an emoji and it floats up from your character.</p></div></div>' +
      '</div><p class="tip">Tap any command in this guide to copy it.</p>' },

    { id: 'join', ic: '🚪', t: 'Joining the club', h:
      '<p>Commands work from <b>X, TikTok or Kick</b> chat, all in the same room at the same time.</p>' +
      row('!enter', 'Walk in through the door. Your character appears and starts dancing.') +
      row('!leave', 'Walk back out. Your look is remembered for next time.') +
      '<h4>Your face</h4><p>Your character wears your <b>profile picture</b> as its face when your platform shares it. If it doesn\'t (Kick can\'t share it), you get a colored initial instead.</p>' +
      '<h4>Where you stand</h4><ul>' +
      '<li><b>The dance floor</b> is the default. Chat often and you stay near the front.</li>' +
      '<li>If you go <b>quiet for about 5 minutes</b>, you drift to the back rows to free up the front. Chat again and you can come forward.</li>' +
      '<li>When the room gets busy everyone <b>shrinks a little</b> so more people fit.</li>' +
      '<li>If the club is completely full you wait in line. Keep chatting and you\'ll get a spot as one opens.</li></ul>' },

    { id: 'style', ic: '👗', t: 'Style yourself', h:
      '<p>Use the Studio to try everything on first. The command bar at the bottom always shows exactly what to paste.</p>' +
      '<div class="chips"><span>👚 Tops</span><span>👖 Bottoms</span><span>👟 Shoes</span><span>💇 Hair</span><span>✨ Extras</span><span>🎨 Skin</span><span>📏 Size &amp; shape</span><span>🕺 Dance</span></div>' +
      '<h4>What\'s in the wardrobe</h4><ul>' +
      '<li><b>Tops:</b> 14 free to wear right away, 13 more to unlock, 3 VIP only.</li>' +
      '<li><b>Bottoms:</b> 7 free (jeans, cargo, flares, joggers and more) and 4 skirts to unlock.</li>' +
      '<li><b>Shoes:</b> 7 styles, all free.</li>' +
      '<li><b>Hair:</b> 20 styles in 22 colors.</li>' +
      '<li><b>Extras:</b> 18 free (shades, caps, hoops, chains, nails and more) plus 2 VIP only.</li>' +
      '<li><b>Body:</b> 8 skin tones, 3 heights, 2 body shapes. Every color can be changed.</li></ul>' +
      '<h4>Locks</h4><ul>' +
      '<li><b>🔒 Earned:</b> you unlock these by being active. By default that is <b>5 dances and 20 chat messages</b>. The host can also unlock them for you.</li>' +
      '<li><b>⭐ VIP:</b> for the host\'s VIP list only.</li>' +
      '<li><b>👑 Nicki:</b> only Nicki wears these.</li></ul>' +
      '<p>If you try a locked piece, the club skips it and tells you which one was locked.</p>' +
      '<h4>Writing a look by hand</h4><p>Words can come in any order. A color word colors the item right before it:</p>' +
      '<div class="ex">' + C('!look varsity black cargo green ankle') + '</div>' +
      '<div class="ex">' + C('!look hoodie pink flares black wavy blonde shades gold') + '</div>' +
      '<p class="tip">Easiest way: build it in the Studio, tap <em>Copy command</em> and paste.</p>' },

    { id: 'dance', ic: '🕺', t: 'Dancing', h:
      '<p>Nine moves. Everyone dances on their own beat, so the floor never looks copy-pasted.</p>' +
      '<div class="dg"><span>Groove</span><span>Bounce</span><span>Rock</span><span>Shuffle</span><span>Pump</span><span>Wave</span><span>B-boy</span><span>Twerk</span><span>Snake</span></div>' +
      row('!dance', 'A random move.') + row('!dance bboy', 'Pick a move by name. Shortcuts work too: <b>spin</b> = B-boy, <b>sway</b> = Rock, <b>hop</b> = Bounce.') +
      '<p class="tip">Every !dance counts toward unlocking the earned looks.</p>' },

    { id: 'bar', ic: '🍸', t: 'The bar & drinks', h:
      '<p>Two bars, one on each side of the club, with five bartenders pouring. Go to the bar and you get a drink in your hand.</p>' +
      row('!bar', 'Walk over to a bar. You pick up a drink automatically and keep dancing.') +
      row('!floor', 'Back to the dance floor.') +
      '<h4>Pick your drink</h4>' +
      '<div class="dg dk"><span>🍸 martini</span><span>🥃 shot</span><span>🍺 beer</span><span>🍹 cocktail</span><span>🥂 champagne</span><span>🍷 wine</span></div>' +
      row('!drink martini', 'Order a specific drink. Plain <b>!drink</b> gets you a surprise.') +
      row('!shot', 'Shortcuts: <b>!martini</b> <b>!shot</b> <b>!beer</b> <b>!cocktail</b> <b>!champagne</b> <b>!wine</b>. You don\'t need to be at the bar first, you\'ll be sent there.') +
      row('!cheers', 'Raise your glass high.') +
      '<h4>What you\'ll see</h4><ul><li>You sip every few seconds. The glass lifts to your mouth and the drink goes down.</li>' +
      '<li>A <b>shot</b> gets knocked back in one go, then a fresh one arrives.</li>' +
      '<li>Sometimes the host calls a <b>round on the house</b>. Everyone at the bar gets a new drink and cheers together.</li></ul>' },

    { id: 'chat', ic: '💬', t: 'Chat bubbles & emoji', h:
      '<p>Just talk. When you\'re in the club, your message pops up above your character.</p>' +
      '<ul><li>Every person gets <b>their own color</b> and their name on the bubble, so it\'s easy to tell who said what.</li>' +
      '<li>When you speak you <b>step forward and glow</b>, with a ring on the floor in your color.</li>' +
      '<li>Quiet club: everyone gets a bubble and it stays up longer. Busy club: bubbles get smaller and shorter. Packed club: only the <b>front half of the room</b> shows bubbles, newest first.</li>' +
      '<li>VIPs and Nicki always get a bubble.</li></ul>' +
      '<h4>Emoji</h4><p>A message that is <b>only emoji</b> shoots up from your character instead of showing a bubble. One emoji gets two little echoes. Send a few and they launch in a burst.</p>' +
      '<div class="dg"><span>🔥</span><span>😍</span><span>👏</span><span>🥂</span><span>💃</span><span>✨</span></div>' +
      '<h4>What never shows</h4><p>Commands (anything starting with <b>!</b>), links, phone numbers, and any message the host has filtered. Those still appear in normal chat.</p>' },

    { id: 'perks', ic: '⭐', t: 'VIP, Top 5 & unlocks', h:
      '<h4>⭐ VIP lounge</h4><p>The host keeps a VIP list. If you\'re on it, you walk into the <b>VIP lounge</b> (upper right) with a gold VIP welcome, and you can wear the VIP-only pieces.</p>' +
      '<h4>🏆 Top 5 stage</h4><p>When the host turns on Top 5, the <b>five people who chat the most</b> that night step onto the center stage with #1 to #5 badges and bigger moves. It counts messages, so keep chatting to climb. It starts fresh every show.</p>' +
      '<h4>🔓 Unlocking looks</h4><p>Dance and chat to earn the locked pieces. By default that is <b>5 dances plus 20 messages</b>. Once earned they stay unlocked.</p>' },

    { id: 'show', ic: '👑', t: 'Nicki & the show', h:
      '<ul><li><b>Nicki\'s entrance:</b> when Nicki first chats, she walks the red carpet to her throne. Her messages show in gold.</li>' +
      '<li><b>The screen and the DJ:</b> the big screen shows the live video, the DJ booth is on the upper left, and a <b>Now Playing</b> strip sits under the screen.</li>' +
      '<li><b>Lights:</b> the host runs beams, lasers, sparkles, fog and color washes. The drop gets a short burst of strobe.</li>' +
      '<li><b>Banners:</b> the host can flash big announcements across the room.</li></ul>' +
      '<p class="tip">Heads up: the lights can flash. The host keeps strobe limited, but take care if flashing lights bother you.</p>' },

    { id: 'cheat', ic: '📋', t: 'All commands', h:
      '<div class="tbl">' +
      row('!enter', 'Join the club') + row('!leave', 'Leave the club') + row('!look …', 'Change what you wear') + row('!dance [name]', 'Dance, random or by name') +
      row('!bar', 'Go to a bar') + row('!floor', 'Back to the dance floor') + row('!drink [kind]', 'New drink (martini, shot, beer, cocktail, champagne, wine)') +
      row('!cheers', 'Raise your glass') + '</div>' +
      '<h4>Host and mod only</h4><div class="tbl">' + row('!vip @name', 'Add to the VIP list') + row('!unvip @name', 'Remove from VIP') + row('!top5 on', 'Top 5 stage on or off') + row('!np Artist - Song', 'Update Now Playing') + row('!light party', 'Light moods and effects') + '</div>' },

    { id: 'faq', ic: '❓', t: 'Questions', h:
      '<details><summary>I typed !enter and nothing happened</summary><p>Make sure you typed it in the <b>live stream chat</b> (X, TikTok or Kick) while the show is on, and that it starts with the exclamation mark. If the club is completely full you\'ll appear as soon as a spot opens and you keep chatting.</p></details>' +
      '<details><summary>My face is a letter, not my picture</summary><p>Your platform didn\'t share your profile picture. Kick can\'t. Your initial shows instead.</p></details>' +
      '<details><summary>It says a piece of my look is locked</summary><p>That piece is earned (dances and chats), VIP only, or Nicki only. Everything else in your command still goes through.</p></details>' +
      '<details><summary>My bubble didn\'t show</summary><p>In a packed club only the front half gets bubbles. Commands, links and filtered words never show.</p></details>' +
      '<details><summary>I got moved to the back</summary><p>You were quiet for about 5 minutes. Chat again and you\'ll move up.</p></details>' +
      '<details><summary>Will it remember my look?</summary><p>Yes. Your look, dance and unlocks are remembered between shows.</p></details>' +
      '<details><summary>Can I change my look while I\'m in?</summary><p>Any time. Paste a new <b>!look</b> command and your character updates on the spot.</p></details>' }
  ];

  var css = '#gOv{position:fixed;inset:0;z-index:80;display:none;flex-direction:column;background:var(--bg,#14061f);color:var(--txt,#fff4fb)}#gOv.on{display:flex}' +
    '#gHead{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 8px;border-bottom:1px solid var(--line,#43245e);background:#14061ff2}' +
    '#gHead h2{margin:0;font-size:18px;flex:1}#gHead h2 b{color:var(--pink,#ff2f9e)}#gX{border:1px solid var(--line,#43245e);background:var(--card2,#2c1640);color:inherit;width:40px;height:40px;border-radius:50%;font-size:20px;line-height:1}' +
    '#gNav{display:flex;gap:8px;overflow-x:auto;padding:10px 14px;border-bottom:1px solid var(--line,#43245e);scrollbar-width:none}#gNav::-webkit-scrollbar{display:none}' +
    '#gNav button{flex:none;border:1px solid var(--line,#43245e);background:var(--card,#22102f);color:var(--dim,#b79bc9);padding:8px 13px;border-radius:99px;font-weight:700;font-size:13px;white-space:nowrap}#gNav button.on{background:linear-gradient(135deg,#7a2bd6,#ff2f9e);color:#fff;border-color:#ff8fd0}' +
    '#gBody{flex:1;overflow:auto;padding:14px 14px calc(30px + env(safe-area-inset-bottom));scroll-behavior:smooth}#gIn{max-width:760px;margin:0 auto}' +
    '.gs{background:var(--card,#22102f);border:1px solid var(--line,#43245e);border-radius:var(--r,18px);padding:16px 16px 14px;margin-bottom:14px;scroll-margin-top:8px}.gs h3{margin:0 0 8px;font-size:20px}.gs h4{margin:16px 0 6px;font-size:14px;letter-spacing:.3px;color:var(--pink2,#ff6cc0)}' +
    '.gs p{margin:6px 0;line-height:1.5}.gs ul{margin:6px 0;padding-left:20px;line-height:1.5}.gs li{margin:4px 0}.lead{font-size:17px}.tip{color:var(--gold,#ffd35a);font-size:14px}' +
    '.gc{font:700 14px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;background:#0b0412;color:#ffd1ea;border:1px solid var(--line,#43245e);border-radius:10px;padding:7px 10px;margin:2px 4px 2px 0;cursor:pointer}.gc:active,.gc.ok{background:var(--pink,#ff2f9e);color:#fff;border-color:#fff}' +
    '.gr{display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-top:1px solid #ffffff12}.gr:first-of-type{border-top:0}.gr .gc{flex:none;min-width:128px;text-align:left}.gt{flex:1;min-width:0;line-height:1.45}' +
    '.steps{display:grid;gap:10px;margin:12px 0}.step{display:flex;gap:12px;background:var(--card2,#2c1640);border-radius:14px;padding:12px}.step b{flex:none;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7a2bd6,#ff2f9e);display:flex;align-items:center;justify-content:center}.step h4{margin:0 0 2px;color:var(--txt,#fff4fb);font-size:16px}.step p{margin:0}' +
    '.chips,.dg{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.chips span,.dg span{background:var(--card2,#2c1640);border:1px solid var(--line,#43245e);border-radius:99px;padding:7px 13px;font-weight:700;font-size:14px}.dk span{font-size:15px}' +
    '.ex{margin:8px 0}.gs details{border-top:1px solid #ffffff14;padding:10px 0}.gs details:first-of-type{border-top:0}.gs summary{font-weight:700;cursor:pointer;line-height:1.4}.gs details p{color:var(--dim,#b79bc9)}' +
    '@media (max-width:520px){.gr{flex-direction:column;gap:4px}.gr .gc{min-width:0}}';

  function build() {
    var top = document.getElementById('top'); if (!top || document.getElementById('gOv')) return;
    var st = el('style', null, css); document.head.appendChild(st);
    var btn = el('button', { type: 'button', class: 'btn sm', id: 'gBtn', style: 'margin-left:auto' }, '📖 Guide'); top.appendChild(btn);
    var ov = el('div', { id: 'gOv', role: 'dialog', 'aria-label': 'Guide' });
    ov.innerHTML = '<div id="gHead"><h2>VIRTUAL <b>NICKI NIGHT</b> guide</h2><button type="button" id="gX" aria-label="Close">×</button></div><div id="gNav"></div><div id="gBody"><div id="gIn"></div></div>';
    document.body.appendChild(ov);
    var nav = ov.querySelector('#gNav'), inn = ov.querySelector('#gIn'), body = ov.querySelector('#gBody');
    SECTIONS.forEach(function (s, i) {
      nav.appendChild(el('button', { type: 'button', 'data-s': s.id, class: i ? '' : 'on' }, s.ic + ' ' + s.t));
      inn.appendChild(el('section', { class: 'gs', id: 'g-' + s.id }, '<h3>' + s.ic + ' ' + s.t + '</h3>' + s.h));
    });
    function open(id) { ov.classList.add('on'); document.body.style.overflow = 'hidden'; if (id) go(id); }
    function close() { ov.classList.remove('on'); document.body.style.overflow = ''; }
    function go(id) { var t = ov.querySelector('#g-' + id); if (t) body.scrollTo({ top: t.offsetTop - 8 }); }
    btn.onclick = function () { open(); };
    ov.querySelector('#gX').onclick = close;
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) close(); });
    nav.onclick = function (e) { var b = e.target.closest('button'); if (b) go(b.dataset.s); };
    body.addEventListener('scroll', function () {
      var cur = SECTIONS[0].id; SECTIONS.forEach(function (s) { var t = ov.querySelector('#g-' + s.id); if (t && t.offsetTop - 60 <= body.scrollTop) cur = s.id; });
      Array.prototype.forEach.call(nav.children, function (b) { var on = b.dataset.s === cur; if (on !== b.classList.contains('on')) { b.classList.toggle('on', on); if (on) b.scrollIntoView({ inline: 'center', block: 'nearest' }); } });
    });
    ov.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]'); if (!c) return; var txt = c.dataset.copy;
      var done = function () { c.classList.add('ok'); setTimeout(function () { c.classList.remove('ok'); }, 700); var t = document.getElementById('toast'); if (t) { t.textContent = 'Copied ' + txt; t.className = 'on'; clearTimeout(build.tt); build.tt = setTimeout(function () { t.className = ''; }, 1400); } };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, done);
      else { var ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) {} ta.remove(); done(); }
    });
    if (location.hash === '#guide') open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
