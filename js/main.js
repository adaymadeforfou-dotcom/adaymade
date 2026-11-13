(() => {
const C = window.CONTENT, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const get = p => p.split('.').reduce((o, k) => o && o[k], C);
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('[data-t]').forEach(el => el.textContent = get(el.dataset.t));
const site = $('#site');

/* ================= SON ================= */
let muted = false, vi = 3, voice = null, ctx, master, nbuf;
/* Mixage : tant qu'une voix ou une vidéo joue, la musique est très basse ; pendant l'audio de la lettre,
   elle reste audible en fond (music.duckLetter) et la voix est au-dessus. */
const duckers = { m: new Map(),
  add(k, f) { this.m.set(k, f ?? C.music.duck); }, delete(k) { this.m.delete(k); },
  factor() { return this.m.has('letter') ? this.m.get('letter') : this.m.size ? Math.min(...this.m.values()) : 1; } };
let letterOn = false;   // audio de la lettre en cours : les vidéos des télés sont coupées
const VOLS = [.25, .5, .75, 1], vids = new Set(), knobsV = new Set();
function ac() {
  if (!ctx) {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    ctx = new A(); master = ctx.createGain(); master.gain.value = muted ? 0 : VOLS[vi]; master.connect(ctx.destination);
    nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume(); return ctx;
}
function tone(f0, f1, dur, type, g, delay = 0) {
  const c = ac(); if (!c) return; const t = c.currentTime + delay, o = c.createOscillator(), e = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  e.gain.setValueAtTime(.0001, t); e.gain.exponentialRampToValueAtTime(g, t + .008); e.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(e).connect(master); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, type, f0, f1, q, g, delay = 0) {
  const c = ac(); if (!c) return; const t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), e = c.createGain();
  s.buffer = nbuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  e.gain.setValueAtTime(.0001, t); e.gain.exponentialRampToValueAtTime(g, t + Math.min(.03, dur / 3)); e.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(e).connect(master); s.start(t); s.stop(t + dur + .02);
}
const SYN = {
  click: () => { tone(1500, 900, .05, 'triangle', .25); noise(.03, 'highpass', 4000, 4000, 1, .15); },
  knob: () => { tone(380, 240, .08, 'square', .1); noise(.04, 'bandpass', 2500, 2500, 1, .2); },
  pop: () => tone(520, 820, .12, 'sine', .18),
  power: () => { noise(.8, 'lowpass', 200, 6000, 1, .35); tone(70, 40, .5, 'sine', .5); },
  off: () => { tone(900, 40, .35, 'sawtooth', .14); noise(.25, 'lowpass', 5000, 300, 1, .25); },
  static: () => noise(.35, 'bandpass', 1800, 2600, .5, .3),
  seal: () => { noise(.12, 'highpass', 3000, 3000, 1, .5); tone(140, 60, .2, 'sine', .5); },
  open: () => noise(.8, 'bandpass', 900, 2600, .7, .22),
  chime: () => { tone(659, 659, 1.4, 'sine', .14); tone(988, 988, 1.6, 'sine', .09, .08); }
};
const missing = new Set();
function sfx(n) {
  if (muted) return; const p = C.sfx[n];
  if (p && !missing.has(n)) { const a = new Audio(p); a.volume = VOLS[vi]; a.play().catch(() => { missing.add(n); SYN[n] && SYN[n](); }); }
  else SYN[n] && SYN[n]();
}
const setGain = () => {
  if (master) master.gain.value = muted ? 0 : VOLS[vi];
  if (voice) { voice.muted = muted; voice.volume = voice._full ? 1 : VOLS[vi]; }   // la lettre audio reste à 100 %, indépendante du bouton volume des télés
  vids.forEach(v => { v.muted = muted || letterOn; v.volume = VOLS[vi]; });
  knobsV.forEach(k => k.style.transform = `rotate(${vi * 40}deg)`);
};
document.addEventListener('pointerdown', ac, { once: true });
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.sfx !== 'none') sfx(b.dataset.sfx || 'click'); });

/* musique d'ambiance (fondu doux, baisse pendant les voix) */
const M = C.music, mus = new Audio(M.src); mus.loop = true; mus.volume = 0; mus.preload = 'auto';
let started = false;
/* iPhone/iPad : le volume d'un <audio> est ignoré (toujours 100 %), donc la musique ne baissait jamais sur mobile.
   Dans ce cas on la fait passer par un réglage de volume Web Audio (GainNode). Si ça échoue, on la met en pause pendant les voix. */
const volOk = (() => { try { const t = new Audio(); t.volume = .5; return t.volume === .5; } catch (e) { return true; } })();
let musGain = null, musTried = false;
function hookMusic() {
  if (volOk || musTried) return; musTried = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // reste audible même en mode silencieux
  const c = ac(); if (!c) return;
  try { const src = c.createMediaElementSource(mus); musGain = c.createGain(); musGain.gain.value = 0; src.connect(musGain); musGain.connect(c.destination); } catch (e) { musGain = null; }
}
function playMusic() { hookMusic(); mus.play().catch(() => {}); }
function startMusic() { if (musicOn) playMusic(); }
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (started && musicOn && mus.paused) startMusic(); if (musGain && ctx && ctx.state !== 'running') ctx.resume(); }, { passive: true }));
let musicOn = true, cur = 0;
const target = () => muted || !musicOn ? 0 : M.volume * VOLS[vi] * duckers.factor();
setInterval(() => {
  const t = target(); cur += (t - cur) * .1; if (Math.abs(t - cur) < .002) cur = t; const v = Math.min(1, cur);
  if (musGain) musGain.gain.value = v;
  else if (volOk) { try { mus.volume = v; } catch (e) {} }
  else if (started && musicOn) {   // secours (mobile sans Web Audio) : pause pendant les voix et vidéos, reprise après
    const quiet = muted || duckers.factor() < .5;
    if (quiet && !mus.paused) mus.pause(); else if (!quiet && mus.paused) mus.play().catch(() => {});
  }
  if (cur === 0 && !musicOn && !mus.paused) mus.pause();
}, 60);
const mute = $('#mute'), music = $('#music');
const paint = () => {
  mute.setAttribute('aria-pressed', muted); mute.setAttribute('aria-label', muted ? C.mute.off : C.mute.on); mute.title = mute.getAttribute('aria-label');
  music.setAttribute('aria-pressed', musicOn); music.setAttribute('aria-label', musicOn ? M.on : M.off); music.title = music.getAttribute('aria-label');
};
mute.onclick = () => { muted = !muted; setGain(); paint(); if (!muted) sfx('click'); };
music.onclick = () => { musicOn = !musicOn; if (musicOn) playMusic(); paint(); sfx('click'); };
paint();

/* ================= NON qui fuit ================= */
function flee(btn, ref) {
  const slot = btn.parentElement, b = btn.getBoundingClientRect();
  if (btn.style.position !== 'fixed') {
    slot.style.width = b.width + 'px'; slot.style.height = b.height + 'px';
    btn.classList.add('fled'); btn.style.cssText = `position:fixed;left:${b.left}px;top:${b.top}px;width:${b.width}px;z-index:70`; btn.offsetWidth;
  }
  const r = ref.getBoundingClientRect(), pad = 14, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let best = null, bd = -1;
  for (let i = 0; i < 60; i++) {
    const x = pad + Math.random() * (innerWidth - b.width - 2 * pad), y = pad + Math.random() * (innerHeight - b.height - 2 * pad);
    const hit = x < r.right + 20 && x + b.width > r.left - 20 && y < r.bottom + 20 && y + b.height > r.top - 20;
    const d = Math.hypot(x + b.width / 2 - cx, y + b.height / 2 - cy);
    if (!hit && d > bd) { bd = d; best = [x, y]; }
  }
  if (best) { btn.style.left = best[0] + 'px'; btn.style.top = best[1] + 'px'; }
}
function runaway(no, yes, onFlee) {
  let n = 0; const base = yes.offsetWidth;
  const go = () => { n++; flee(no, yes); sfx('pop'); yes.style.transform = `scale(${Math.min(1 + n * .22, 2.4, innerWidth * .8 / base)})`; onFlee && onFlee(n); };
  no.addEventListener('pointerdown', e => { e.preventDefault(); go(); });
  no.addEventListener('click', e => { if (e.detail === 0) go(); });
}

/* ================= télévisions (hero + section 3) ================= */
const T = C.tv;
function initTv(fig, cfg, { auto = 0, onPower, hints } = {}) {
  fig.innerHTML = `<div class="tv-glass"></div><div class="tv-screen"></div><img alt=""><button class="knob" data-sfx="none"></button><button class="knob" data-sfx="none"></button><button class="power" data-sfx="none" aria-pressed="false"></button>`;
  const glass = fig.querySelector('.tv-glass'), scr = fig.querySelector('.tv-screen'), img = fig.querySelector('img'), [kc, kv] = fig.querySelectorAll('.knob'), pw = fig.querySelector('.power');
  img.src = T.image; img.alt = T.alt; kc.setAttribute('aria-label', T.labels.channel); kv.setAttribute('aria-label', T.labels.volume); pw.setAttribute('aria-label', T.labels.power);
  knobsV.add(kv);
  function layout() {
    const W = img.naturalWidth, H = img.naturalHeight; if (!W) return;
    const s = T.screen; [scr, glass].forEach(e => Object.assign(e.style, { left: s.x + '%', top: s.y + '%', width: s.w + '%', height: s.h + '%' }));
    const kw = 2 * T.r, kh = kw * W / H;
    [[kc, T.channel], [kv, T.volume]].forEach(([b, k]) => Object.assign(b.style, { left: (k.x - T.r) + '%', top: (k.y - kh / 2) + '%', width: kw + '%', aspectRatio: '1', backgroundImage: `url(${T.image})`,
      backgroundSize: `${10000 / kw}% auto`, backgroundPosition: `${(k.x - T.r) / (100 - kw) * 100}% ${(k.y - kh / 2) / (100 - kh) * 100}%` }));
    pw.style.left = T.power.x + '%'; pw.style.top = T.power.y + '%'; kv.style.transform = `rotate(${vi * 40}deg)`;
  }
  img.complete && img.naturalWidth ? layout() : img.addEventListener('load', layout);
  const slides = cfg.map(s => {
    const d = document.createElement('div'); d.className = 'slide' + (s.image || s.video ? ' has-media' : '');
    if (s.image) { const i = new Image(); i.src = s.image; i.alt = s.alt || ''; i.onerror = () => d.classList.add('nofile'); d.append(i); }
    if (s.video) { const v = document.createElement('video'); Object.assign(v, { src: s.video, loop: s.loop ?? !auto, playsInline: true, volume: VOLS[vi], preload: 'auto' }); v.onerror = () => d.classList.add('nofile'); vids.add(v); v.addEventListener('playing', () => duckers.add(v)); ['pause', 'ended', 'emptied', 'error', 'abort'].forEach(ev => v.addEventListener(ev, () => duckers.delete(v))); d.append(v); }
    if (s.text) { const p = document.createElement('p'); p.textContent = s.text; d.append(p); }
    if (s.caption) { const c = document.createElement('span'); c.className = 'cap'; c.textContent = s.caption; d.append(c); }
    scr.append(d); return d;
  });
  const stat = document.createElement('div'); stat.className = 'static'; scr.append(stat);
  let on = false, idx = 0, timer, rotC = 0, away = false;
  const flash = () => { stat.classList.remove('go'); void stat.offsetWidth; stat.classList.add('go'); };
  function schedule() {   // enchaîne tout seul : une vidéo va jusqu'au bout, les autres chaînes durent `duration` ou `auto`
    clearTimeout(timer); if (!auto || !on || away) return;
    const el = slides[idx], v = el.querySelector('video'), s = cfg[idx];
    if (v && !el.classList.contains('nofile') && !s.duration) { v.onended = () => channel(true); timer = setTimeout(() => channel(true), 240000); }
    else timer = setTimeout(() => channel(true), s.duration || auto);
  }
  const show = i => { slides.forEach((s, k) => { s.classList.toggle('on', k === i); const v = s.querySelector('video'); if (v) { if (k === i && !away) { v.currentTime = 0; v.muted = muted || letterOn; v.play().catch(() => {}); } else v.pause(); } }); schedule(); };
  /* section quittée : la vidéo se met en pause (plus aucun son) ; au retour, la chaîne en cours repart */
  function setAway(a) { if (a === away) return; away = a; if (a) { clearTimeout(timer); slides.forEach(s => { const v = s.querySelector('video'); v && v.pause(); }); } else if (on) show(idx); }
  function setPower(v) {
    on = v; pw.classList.toggle('on', on); pw.setAttribute('aria-pressed', on); sfx(on ? 'power' : 'off');
    if (on) { scr.classList.add('on'); flash(); setTimeout(() => on && show(idx), 500); }
    else { clearTimeout(timer); scr.classList.remove('on'); slides.forEach(s => { s.classList.remove('on'); const v = s.querySelector('video'); v && v.pause(); }); }
    onPower && onPower(on);
  }
  function channel(isAuto) { if (!on) return; idx = (idx + 1) % slides.length; flash(); if (!isAuto) sfx('static'); show(idx); }
  /* indications flottantes (disparaissent après quelques secondes ou dès qu'on touche aux boutons) */
  let hintEl = null, hintTimer;
  if (hints) {
    hintEl = document.createElement('div'); hintEl.className = 'hints'; hintEl.setAttribute('aria-hidden', 'true');
    hintEl.innerHTML = [['ch', T.channel.y, hints.channel], ['pw', T.power.y, hints.power]].map(([k, y]) => `<span class="hint ${k}" style="top:${y}%"><svg class="arr" viewBox="0 0 96 56"><path d="M92 20 C66 6 32 10 10 36"/><path d="M26.7 29.4 L10 36 L13.9 18.4"/></svg><b></b></span>`).join('');
    hintEl.querySelectorAll('b').forEach((b, i) => b.textContent = [hints.channel, hints.power][i]); fig.append(hintEl);
  }
  const hideHints = () => { clearTimeout(hintTimer); hintEl && hintEl.classList.remove('on'); };
  const showHints = () => { if (!hintEl) return; clearTimeout(hintTimer); hintTimer = setTimeout(() => { hintEl.classList.add('on'); hintTimer = setTimeout(hideHints, hints.duration ?? 5000); }, hints.delay ?? 1500); };
  [kc, kv, pw].forEach(b => b.addEventListener('pointerdown', hideHints));
  pw.onclick = () => setPower(!on);
  kc.onclick = () => { rotC += 50; kc.style.transform = `rotate(${rotC}deg)`; on ? channel(false) : sfx('knob'); };
  kv.onclick = () => { vi = (vi + 1) % VOLS.length; setGain(); sfx('knob'); };
  return { setPower, showHints, hideHints, setAway };
}
C.hero.phrase.forEach(p => { const s = document.createElement('span'); s.textContent = p.t; if (p.s === 'script') s.className = 'script'; $('#heroPhrase').append(s); });
const heroTv = initTv($('[data-tv=hero]'), C.hero.slides, { auto: T.slideDuration, hints: C.hero.hints });
const room = $('#room'), roomTv = initTv($('[data-tv=room]'), C.room.slides, { onPower: on => room.classList.toggle('lit', on) });
$$('[data-go]').forEach(b => b.addEventListener('click', () => $(b.dataset.go).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })));
addEventListener('scroll', () => site.style.setProperty('--p', Math.min(1, scrollY / innerHeight)), { passive: true });

/* ================= entrée + voix ================= */
const gate = $('#gate'), ask = $('#ask'), w = $('#word'), w1 = $('#w1'), w2 = $('#w2'), intro = $('#intro'), enter = $('#enter');
const EXTS = ['mp3', 'm4a', 'opus', 'ogg', 'webm', 'aac', 'wav'];
const candidates = p => { const base = p.replace(/\.\w{2,4}$/, ''); return [...(p !== base ? [p] : []), ...EXTS.map(e => base + '.' + e)].filter((v, i, s) => s.indexOf(v) === i); };
const voiceMap = new Map();   // chemin -> fichier trouvé | null (absent) | undefined (inconnu)
async function discover(path) {
  const r = await Promise.all(candidates(path).map(u => fetch(u, { method: 'HEAD' }).then(x => (x.ok && !/html/.test(x.headers.get('content-type') || '')) ? u : 'absent').catch(() => 'error')));
  const found = r.find(v => v !== 'absent' && v !== 'error'); if (found) return found;
  return r.includes('error') ? undefined : null;   // undefined = test impossible (site ouvert en local) : on essaie de lire directement
}
const voiceReady = Promise.all([...C.words.list.map(w => w.audio), C.intro.audio, C.letter.voice].filter(Boolean).map(async p => voiceMap.set(p, await discover(p))));
async function playVoice(path) {
  await voiceReady; const known = voiceMap.get(path); if (known === null) return null;
  for (const src of known ? [known] : candidates(path)) {
    const a = new Audio(src); a.muted = muted; a.volume = VOLS[vi];
    try { await a.play(); return a; } catch (e) {}
  }
  return null;
}
/* lecture lancée DIRECTEMENT dans un clic (obligatoire sur iPhone/Safari), sans rien attendre avant */
function playNow(path) {
  const known = voiceMap.get(path); if (known === null) return null;
  const a = new Audio(known || candidates(path)[0]); a.muted = muted; a.volume = VOLS[vi];
  return { a, p: a.play() };
}
runaway($('#no'), $('#yes'));
$('#yes').addEventListener('click', async () => {
  ac(); started = true; startMusic();
  ask.classList.add('gone'); await wait(650); ask.hidden = true;
  for (const item of C.words.list) {
    const a = await playVoice(item.audio);
    w1.textContent = item.text; w2.textContent = item.em || ''; w.classList.add('in');
    if (a) { voice = a; duckers.add('voice'); await new Promise(r => { a.onended = r; a.onerror = r; }); duckers.delete('voice'); voice = null; }
    else { sfx('chime'); await wait(C.words.defaultDuration); }
    await wait(150); w.classList.remove('in'); await wait(800 + C.words.pause);
  }
  /* carte finale : « Some days deserve… » + bouton pour entrer */
  intro.hidden = false; intro.offsetWidth; intro.classList.add('in'); sfx('chime');
  if (C.intro.audio) { const a = await playVoice(C.intro.audio); if (a) { voice = a; duckers.add('voice'); a.onended = () => { duckers.delete('voice'); voice = null; }; } }
  enter.focus({ preventScroll: true });
});
enter.addEventListener('click', async () => {
  if (voice) { voice.pause(); voice = null; } duckers.delete('voice'); sfx('click');
  startMusic(); gate.classList.add('out'); site.inert = false; document.body.classList.remove('locked'); scrollTo(0, 0);
  setTimeout(() => { heroTv.setPower(true); heroTv.showHints(); }, 500);
  await wait(1200); gate.hidden = true;
});

/* ================= lettre ================= */
const L = C.letter, env = $('#envelope'), popup = $('#popup'), reader = $('#reader'), sheet = $('#letterSheet');
$('#envImg').src = L.envelopeImage;
L.photos.forEach(p => {
  const f = document.createElement('figure'), i = document.createElement('img');
  i.src = p.src; i.alt = p.alt; i.loading = 'lazy'; i.onerror = () => f.classList.add('ph'); f.append(i); $('#stamps').append(f);
});
L.body.forEach(t => { const p = document.createElement('p'); p.textContent = t; p.setAttribute('data-rv', ''); $('#letterBody').append(p); });
$('#stampText').textContent = L.stamp.toUpperCase();
function scallop(el, a = 5, L = 22) {
  const W = el.offsetWidth, H = el.offsetHeight; if (!W) return;
  const lx = W / Math.max(1, Math.round(W / L)), ly = H / Math.max(1, Math.round(H / L)), p = [];
  const f = (t, l) => { const u = (t % l) / l * 2 - 1; return a * (1 - Math.sqrt(Math.max(0, 1 - u * u))); };
  for (let x = 0; x <= W; x += 1.5) p.push(`${x}px ${f(x, lx)}px`);
  for (let y = 0; y <= H; y += 1.5) p.push(`${W - f(y, ly)}px ${y}px`);
  for (let x = W; x >= 0; x -= 1.5) p.push(`${x}px ${H - f(x, lx)}px`);
  for (let y = H; y >= 0; y -= 1.5) p.push(`${f(y, ly)}px ${y}px`);
  el.style.clipPath = `polygon(${p.join(',')})`;
}
/* bord de papier fait main (déchiré, irrégulier) + fin liseré clair derrière */
function vn(seed, step, len) { let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const a = Array.from({ length: Math.ceil(len / step) + 3 }, r); return t => { const k = Math.max(0, t) / step, i = Math.floor(k), f = k - i, u = f * f * (3 - 2 * f); return a[i] * (1 - u) + a[i + 1] * u; }; }
function deckle(el) {
  const W = el.offsetWidth, H = el.offsetHeight; if (!W) return;
  const mk = (seed, len) => { const n1 = vn(seed, 18, len), n2 = vn(seed + 7, 5, len), n3 = vn(seed + 13, 2, len); return t => 4.4 * (n1(t) * .9 + n2(t) * .55 + n3(t) * .25); };
  const eT = mk(11, W), eR = mk(23, H), eB = mk(37, W), eL = mk(41, H), p = [], q = [], g = 3, e = 2.6;
  for (let x = 0; x <= W; x += 2) { const o = eT(x); p.push(`${x}px ${o}px`); q.push(`${x + g}px ${Math.max(0, o - e + g)}px`); }
  for (let y = 0; y <= H; y += 2) { const o = eR(y); p.push(`${W - o}px ${y}px`); q.push(`${W - o + e + g}px ${y + g}px`); }
  for (let x = W; x >= 0; x -= 2) { const o = eB(x); p.push(`${x}px ${H - o}px`); q.push(`${x + g}px ${H - o + e + g}px`); }
  for (let y = H; y >= 0; y -= 2) { const o = eL(y); p.push(`${o}px ${y}px`); q.push(`${Math.max(0, o - e + g)}px ${y + g}px`); }
  el.style.clipPath = `polygon(${p.join(',')})`; $('#rim').style.clipPath = `polygon(${q.join(',')})`;
}
const wave = el => deckle(el);
$('#waxSeal').src = L.seal;
$('#pmText').textContent = L.postmark.toUpperCase(); $('#pmYear').textContent = C.site.year;
$$('#letterSheet [data-rv]').forEach((el, i) => el.style.setProperty('--i', i));
new ResizeObserver(() => wave(sheet)).observe(sheet);
let tease = 0; const pyes = $('#pyes'), pno = $('#pno'), teaseEl = $('#tease');
runaway(pno, pyes, () => { teaseEl.textContent = L.popup.teases[tease++ % L.popup.teases.length]; });
function openPopup() {
  pno.classList.remove('fled'); pno.removeAttribute('style'); pno.parentElement.removeAttribute('style'); pyes.style.transform = '';
  teaseEl.textContent = L.popup.hint; tease = 0;
  popup.hidden = false; site.inert = true; popup.offsetWidth; popup.classList.add('show'); pyes.focus();
}
env.onclick = () => env.classList.contains('opened') ? showLetter() : openPopup();
pyes.onclick = async () => {
  popup.classList.remove('show'); env.classList.add('opening'); $('#lettre .hint').style.opacity = 0; sfx('seal');
  await wait(900); popup.hidden = true; sfx('open');
  await wait(300); env.classList.add('opened'); showLetter();
};
function showLetter() {
  env.classList.add('glide'); reader.hidden = false; site.inert = true; reader.offsetWidth; wave(sheet); $$('.stamps figure').forEach(f => scallop(f, 2.4, 9)); $('#listen').classList.remove('gone'); reader.classList.add('show'); $('#close').focus({ preventScroll: true });
}
/* ----- lecteur audio de la lettre (« écoute-moi plutôt ») ----- */
const P = L.player, apl = $('#apl'), bar = $('#aplBar'), playB = $('#aplPlay'), listenB = $('#listen');
let la = null, letterClosing = false;
$('#aplCover').src = P.cover; $('#aplTitle').textContent = P.title; $('#aplSub').textContent = P.sub;
[['#aplBack', P.back], ['#aplFwd', P.forward], ['#aplX', P.close]].forEach(([s, t]) => { $(s).setAttribute('aria-label', t); $(s).title = t; }); bar.setAttribute('aria-label', P.bar); playB.setAttribute('aria-label', P.play);
const dur = a => isFinite(a.duration) ? a.duration : a._dur;   // certains serveurs ne donnent pas la durée d'un .ogg : on la calcule
const fmt = s => { if (!isFinite(s)) return '--:--'; s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function paintPlayer() {
  if (!la) return; const d = dur(la), t = la.currentTime, ok = isFinite(d) && d > 0;
  bar.value = ok ? Math.round(t / d * 1000) : 0; bar.style.setProperty('--p', (bar.value / 10) + '%');
  $('#aplCur').textContent = fmt(t); $('#aplLeft').textContent = ok ? '-' + fmt(d - t) : '--:--';
}
function setPlaying(on) { playB.classList.toggle('on', on); playB.setAttribute('aria-label', on ? P.pause : P.play); on ? duckers.add('letter', C.music.duckLetter) : duckers.delete('letter'); letterOn = on; setGain(); }
async function openPlayer() {
  listenB.classList.add('gone'); apl.hidden = false; apl.offsetWidth; apl.classList.add('show'); reader.classList.add('has-apl');
  const first = playNow(L.voice); let a = null;
  if (first) { try { await first.p; a = first.a; } catch (e) { a = await playVoice(L.voice); } }   // sinon on essaie les autres formats (.ogg, .opus…)
  if (!a) { $('#aplSub').textContent = P.missing; return; }
  if (letterClosing || !apl.classList.contains('show')) { a.pause(); return; }
  la = a; voice = a; a._full = true; a.volume = 1; a.muted = muted;
  a.addEventListener('timeupdate', paintPlayer); a.addEventListener('loadedmetadata', paintPlayer); a.addEventListener('durationchange', paintPlayer);
  a.addEventListener('play', () => !a._swap && setPlaying(true)); a.addEventListener('pause', () => !a._swap && setPlaying(false));
  a.addEventListener('ended', () => { setPlaying(false); if (L.autoCloseAfterVoice !== false) setTimeout(() => { if (la === a && a.ended && reader.classList.contains('show')) closeLetter(); }, L.autoCloseDelay ?? 2500); });
  if (!isFinite(a.duration)) fetch(a.currentSrc || a.src).then(r => r.arrayBuffer()).then(buf => ac().decodeAudioData(buf)).then(b => { a._dur = b.duration; paintPlayer(); }).catch(() => {});
  setPlaying(true); paintPlayer();
}
function closePlayer() {
  if (la) la.pause(); la = null; voice = null; duckers.delete('letter'); setPlaying(false); bar.value = 0; bar.style.setProperty('--p', '0%');
  $('#aplCur').textContent = '0:00'; $('#aplLeft').textContent = '-0:00'; $('#aplSub').textContent = P.sub;
  apl.classList.remove('show'); reader.classList.remove('has-apl'); setTimeout(() => { if (!apl.classList.contains('show')) apl.hidden = true; }, 700);
  listenB.classList.remove('gone');
}
listenB.onclick = openPlayer; $('#aplX').onclick = closePlayer;
playB.onclick = () => { if (!la) return; if (la.paused) { if (la.ended) la.currentTime = 0; la.play(); } else la.pause(); };
/* se déplacer dans l'audio ; si le serveur ne le permet pas (pas de « Range »), on charge le fichier en mémoire */
function seekTo(t) {
  if (!la) return; const a = la; a._target = t; a.currentTime = t; paintPlayer(); clearTimeout(a._vt);
  a._vt = setTimeout(async () => {
    if (la !== a || Math.abs(a.currentTime - a._target) < 3 || a._blob || !/^https?:/.test(location.protocol)) return;
    try {
      const r = await fetch(a.currentSrc), url = URL.createObjectURL(await r.blob()), play = !a.paused;
      a._swap = true; a._blob = true; a.src = url;
      await new Promise(res => a.addEventListener('loadedmetadata', res, { once: true }));
      a.currentTime = a._target; a._swap = false; if (play) a.play().catch(() => {}); paintPlayer();
    } catch (e) { a._swap = false; }
  }, 400);
}
$('#aplBack').onclick = () => { if (la) seekTo(Math.max(0, la.currentTime - 10)); };
$('#aplFwd').onclick = () => { if (!la) return; const d = dur(la); seekTo(isFinite(d) ? Math.min(d - .2, la.currentTime + 10) : la.currentTime + 10); };
bar.addEventListener('input', () => { if (la && isFinite(dur(la))) seekTo(bar.value / 1000 * dur(la)); });

async function closeLetter() {
  if (letterClosing || reader.hidden) return; letterClosing = true; closePlayer();
  reader.classList.add('closing'); reader.classList.remove('show'); env.classList.remove('glide');   // l'enveloppe revient à sa place
  await wait(1300);
  env.classList.remove('opened', 'opening'); sfx('seal');                                             // le rabat se referme, le sceau se reforme
  $('#lettre .hint').style.opacity = 1;
  await wait(300); reader.hidden = true; reader.classList.remove('closing'); site.inert = false; letterClosing = false; env.focus({ preventScroll: true });
}
$('#close').onclick = closeLetter;

/* ================= album : défilement continu ================= */
const A = C.album, track = $('#albTrack'), reel = $('#albReel'), back = $('#albBack'), next = $('#albNext'), pg = $('#albPage');
$('#albTitle').append(A.title.pre + ' ', Object.assign(document.createElement('em'), { className: 'script', textContent: A.title.em }));
back.textContent = A.nav.back; next.textContent = A.nav.next;
const n = A.items.length;
function mkCard(it, i) {
  const b = document.createElement('button'); b.className = 'card v' + (i % 3); b.dataset.i = i; b.setAttribute('aria-label', A.open.replace('{n}', i + 1));
  b.innerHTML = '<span class="rec"><span class="disc"><span class="spin"><img alt=""><i class="hole"></i></span></span><span class="sleeve"><span class="q">?</span><span class="num sans"></span></span></span><span class="lbl"></span>';
  const im = b.querySelector('img'); im.src = it.src; im.style.objectPosition = it.focus || '50% 50%'; im.onerror = () => im.classList.add('bad');
  b.querySelector('.num').textContent = `${A.numLabel} ${String(i + 1).padStart(2, '0')}`; b.querySelector('.lbl').textContent = it.tag || '';
  return b;
}
let x = 0, setW = 1, step = 1, cw = 1, hover = false, visible = true, discOpen = false, tw = null, shown = -1, drag = null, dragMoved = false;
function build() {
  reel.innerHTML = ''; for (let k = 0; k < 3; k++) A.items.forEach((it, i) => reel.append(mkCard(it, i)));
  const c = reel.children; step = c[1].offsetLeft - c[0].offsetLeft; cw = c[0].offsetWidth; setW = step * n;
  const need = Math.ceil(track.clientWidth / setW) + 2;
  for (let k = 3; k < need; k++) A.items.forEach((it, i) => reel.append(mkCard(it, i)));
}
build(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 200); });
const mod = (a, m) => ((a % m) + m) % m;
const idxRaw = () => Math.round((x + track.clientWidth / 2 - cw / 2) / step);
let last = performance.now();
function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (tw) { tw.t += dt * 1000; const k = Math.min(1, tw.t / tw.d), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; x = tw.from + (tw.to - tw.from) * e; if (k >= 1) tw = null; }
  else if (!drag && !hover && !discOpen && visible && !reduced) x += 26 * dt;
  x = mod(x, setW); reel.style.transform = `translate3d(${-x}px,0,0)`;
  const i = mod(idxRaw(), n); if (i !== shown) { shown = i; pg.innerHTML = `${A.nav.page} <b>${i + 1}</b> ${A.nav.of} ${n}`; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
new IntersectionObserver(e => visible = e[0].isIntersecting, { threshold: .1 }).observe(track);
track.addEventListener('mouseenter', () => hover = true); track.addEventListener('mouseleave', () => hover = false);
const goTo = k => { tw = { from: x, to: k * step + cw / 2 - track.clientWidth / 2, t: 0, d: 900 }; };
back.onclick = () => goTo(idxRaw() - 1); next.onclick = () => goTo(idxRaw() + 1);
track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') next.click(); if (e.key === 'ArrowLeft') back.click(); });
track.addEventListener('pointerdown', e => { drag = { px: e.clientX, x0: x }; dragMoved = false; tw = null; });
addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.px; if (Math.abs(dx) > 6) dragMoved = true; if (dragMoved) x = drag.x0 - dx; });
addEventListener('pointerup', () => { drag = null; setTimeout(() => dragMoved = false, 0); });
reel.addEventListener('click', e => { const c = e.target.closest('.card'); if (c && !dragMoved) openDisc(+c.dataset.i, c); });

/* ================= un disque s'ouvre ================= */
const dv = $('#disc'), dst = $('#dstage'), dsl = $('#dsleeve'), dd = $('#ddisc'); let initT = null, lastCard = null;
async function openDisc(i, card) {
  const it = A.items[i]; discOpen = true; lastCard = card; sfx('open');
  dsl.className = 'sleeve dsleeve v' + (i % 3); const im = $('#dimg'); im.classList.remove('bad'); im.onerror = () => im.classList.add('bad'); im.src = it.src; im.alt = it.alt; im.style.objectPosition = it.focus || '50% 50%';
  $('#dnum').textContent = `${A.numLabel} ${String(i + 1).padStart(2, '0')}${it.date ? ' · ' + it.date : ''}`; $('#dtitle').textContent = it.title; $('#dtext').textContent = it.anecdote;
  dd.classList.remove('spinning'); dst.classList.remove('go'); dv.classList.remove('closing');
  [dsl, dd].forEach(e => { e.style.transition = 'none'; e.style.transform = 'none'; });
  dv.hidden = false; site.inert = true; dv.offsetWidth;
  const v = matchMedia('(max-width:700px)').matches, rs = dsl.getBoundingClientRect(), rd = dd.getBoundingClientRect();
  const cs = v ? rs.top + rs.height / 2 : rs.left + rs.width / 2, cd = v ? rd.top + rd.height / 2 : rd.left + rd.width / 2;
  const S = v ? rs.height : rs.width, D = v ? rd.height : rd.width, mid = (cs + cd) / 2, si = mid, di = mid;
  const T = d => v ? `translateY(${d}px)` : `translateX(${d}px)`;
  initT = [T(si - cs), T(di - cd)]; dsl.style.transform = initT[0]; dd.style.transform = initT[1]; dsl.style.opacity = 0; dd.style.opacity = 0;
  dv.offsetWidth; dsl.style.transition = dd.style.transition = ''; dv.classList.add('show'); dsl.style.opacity = 1; dd.style.opacity = 1;
  await wait(600); dsl.style.transform = 'none'; dd.style.transform = 'none'; dst.classList.add('go');
  await wait(1400); dd.classList.add('spinning');
}
async function closeDisc() {
  if (!discOpen) return; dv.classList.add('closing'); dst.classList.remove('go'); dd.classList.remove('spinning'); sfx('open');
  dsl.style.transform = initT[0]; dd.style.transform = initT[1];
  await wait(1100); dv.classList.remove('show'); await wait(800); dv.hidden = true; dv.classList.remove('closing'); site.inert = false; discOpen = false;
  lastCard && lastCard.focus({ preventScroll: true });
}
$('#dclose').onclick = closeDisc;
$('#disc .scroller').addEventListener('click', e => { if (e.target.closest('.dsleeve,.ddisc,.dnote') || String(getSelection()).length) return; closeDisc(); });
$('#reader .scroller').addEventListener('click', e => { if (e.target.closest('.sheet,.apl') || String(getSelection()).length) return; closeLetter(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { closeDisc(); closeLetter(); } });
/* ================= le son reste dans sa section ================= */
/* Quand on quitte une section, tout ce qui y fait du bruit se tait. Pour ajouter une section sonore plus tard :
   ajoute-la dans `scopes` avec ce qu'il faut couper (leave) et, si besoin, relancer (enter). */
const scopes = {
  hero: { leave: () => heroTv.setAway(true), enter: () => heroTv.setAway(false) },
  room: { leave: () => roomTv.setAway(true), enter: () => roomTv.setAway(false) },
  lettre: { leave: () => { if (la && !la.paused) la.pause(); } }
};
let curSec = 'hero'; const seenPx = new Map();
function setSection(id) { if (id === curSec) return; const old = scopes[curSec]; curSec = id; old && old.leave && old.leave(); const nw = scopes[id]; nw && nw.enter && nw.enter(); }
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    es.forEach(e => seenPx.set(e.target.id, e.intersectionRect.height));   // la section la plus visible à l'écran est la section courante
    let best = curSec, bv = 0; seenPx.forEach((h, id) => { if (h > bv) { bv = h; best = id; } });
    if (bv > 0) setSection(best);
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
  ['hero', 'lettre', 'room', 'album', 'day'].forEach(id => { const el = document.getElementById(id); el && io.observe(el); });
}
/* changer d'appli ou verrouiller le téléphone : télés et lettre audio se taisent, et reviennent avec la page */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { heroTv.setAway(true); roomTv.setAway(true); if (la && !la.paused) la.pause(); }
  else { const nw = scopes[curSec]; nw && nw.enter && nw.enter(); }
});

/* ================= programme : carte interactive « The Day » ================= */
(() => {
const D = C.day, svg = $('#mapSvg'), stage = $('#mapStage'), pinsEl = $('#mapPins'), tk = $('#ticket'), dayEl = $('#day'), N = D.stops.length;
const mq = matchMedia('(max-width: 900px)');
$('#dayTitle').append(D.title.pre + ' ', Object.assign(document.createElement('em'), { className: 'script', textContent: D.title.em }));
pinsEl.setAttribute('aria-label', D.mapLabel);
$('#tkClose').setAttribute('aria-label', D.nav.close); $('#tkClose').title = D.nav.close;
$('#tkPrev').textContent = D.nav.prev; $('#tkNext').textContent = D.nav.next;

/* forme de la carte, lac, rivière, routes (coordonnées à plat : 1000 × 640) */
const LAND = [[60,300],[110,170],[250,95],[420,70],[560,110],[700,70],[850,110],[940,230],[910,380],[820,470],[700,520],[620,590],[470,560],[330,590],[190,540],[90,440]];
const LAKE = { c: [705, 415], rx: 74, ry: 46 };
const RIVER = [[700,455],[690,510],[650,560],[628,600]];
const ROADS = [[[110,400],[215,430],[290,510],[320,590]], [[790,185],[800,290],[830,440]], [[420,70],[470,190],[520,290],[560,400],[600,560]]];

const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function crSample(pts, closed, per) {   // courbe lisse (Catmull-Rom) passant par tous les points
  const m = pts.length, out = [], g = i => closed ? pts[(i + m) % m] : pts[Math.max(0, Math.min(m - 1, i))];
  for (let i = 0; i < (closed ? m : m - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let t = 0; t < per; t++) { const u = t / per, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3))); }
  }
  if (!closed) out.push(pts[m - 1].slice());
  return out;
}
const inPoly = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const dmin = (p, pts) => { let m = 1e9; for (const q of pts) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])); return m; };
const pd = (pts, close) => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + (close ? 'Z' : '');

let tok = 0, cur = -1, sel = -1, hintDone = false, geo = null; const seen = new Set();

function build() {
  const tall = mq.matches, k = tall ? 2.2 : 1;     // k : le décor est dessiné plus gros sur mobile (la carte y est plus petite à l'écran)
  const P = tall ? { th: -62, sq: .92 } : { th: -22, sq: .56 }, thick = tall ? 60 : 30, pad = tall ? 52 : 40;
  const a = P.th * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
  const raw = ([x, y]) => { const dx = x - 500, dy = y - 320; return [dx * cs - dy * sn, (dx * sn + dy * cs) * P.sq]; };
  const landS = crSample(LAND, true, 14), lr = landS.map(raw), xs = lr.map(p => p[0]), ys = lr.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), W = Math.max(...xs) - x0 + 2 * pad, H = Math.max(...ys) - y0 + 2 * pad + thick;
  const S = p => { const q = raw(p); return [q[0] - x0 + pad, q[1] - y0 + pad]; };

  /* chemin : points des étapes + détours, puis longueurs cumulées */
  const route = [], idx = [];
  D.stops.forEach((s, i) => { idx.push(route.length); route.push([s.x, s.y]); (D.via[i] || []).forEach(p => route.push(p)); });
  const per = 16, rs = crSample(route, false, per), rp = rs.map(S), cum = [0];
  for (let i = 1; i < rp.length; i++) cum.push(cum[i - 1] + Math.hypot(rp[i][0] - rp[i - 1][0], rp[i][1] - rp[i - 1][1]));
  const total = cum[cum.length - 1], stopLen = idx.map(i => cum[i * per]);
  const at = L => { L = Math.max(0, Math.min(total, L)); let lo = 0, hi = cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; cum[m] <= L ? lo = m : hi = m; }
    const t = (L - cum[lo]) / ((cum[hi] - cum[lo]) || 1); return [rp[lo][0] + (rp[hi][0] - rp[lo][0]) * t, rp[lo][1] + (rp[hi][1] - rp[lo][1]) * t]; };

  /* décor */
  const lakeP = Array.from({ length: 44 }, (_, i) => { const t = i / 44 * 6.2832; return [LAKE.c[0] + LAKE.rx * Math.cos(t), LAKE.c[1] + LAKE.ry * Math.sin(t)]; });
  const rvS = crSample(RIVER, false, 10), R = rng(7), palms = [];
  for (let t = 0; t < 1200 && palms.length < (tall ? 15 : 24); t++) {
    const p = [90 + R() * 820, 80 + R() * 500];
    if (!inPoly(p, landS) || dmin(p, landS) < 42 || dmin(p, rs) < 46 || dmin(p, rvS) < 40) continue;
    if (D.stops.some(s => Math.hypot(p[0] - s.x, p[1] - s.y) < 100)) continue;
    if (((p[0] - LAKE.c[0]) / (LAKE.rx + 36)) ** 2 + ((p[1] - LAKE.c[1]) / (LAKE.ry + 36)) ** 2 < 1) continue;
    if (palms.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 64)) continue;
    palms.push(p);
  }
  palms.sort((p, q) => S(p)[1] - S(q)[1]);
  const ps = 27 * k, palmMk = p => { const [X, Y] = S(p); return `<use href="#mPalm" x="${(X - ps / 2).toFixed(1)}" y="${(Y - ps * 1.28).toFixed(1)}" width="${ps}" height="${(ps * 1.3).toFixed(1)}"/>`; };
  const band = d => { const f = d / thick; return f < .1 ? '#a9483c' : f < .42 ? '#6f1e1b' : f < .52 ? '#8b2a22' : f < .8 ? '#5e1816' : '#4a1211'; };
  const sides = Array.from({ length: thick }, (_, d) => `<use href="#mLand" y="${d + 1}" fill="${band(d + 1)}" stroke="${band(d + 1)}" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
  const c2 = S([D.stops[1] ? D.stops[1].x : 500, D.stops[1] ? D.stops[1].y : 300]);
  const clouds = [[-52, 10, 64, 22], [32, -2, 70, 26], [-4, 24, 78, 21], [68, 20, 48, 17], [-78, -2, 42, 16], [6, -14, 50, 18]]
    .map(([dx, dy, rx, ry]) => { const ck = tall ? 1.5 : 1; return `<ellipse cx="${(c2[0] + dx * ck).toFixed(1)}" cy="${(c2[1] + dy * ck - 6 * ck).toFixed(1)}" rx="${(rx * ck).toFixed(1)}" ry="${(ry * ck).toFixed(1)}"/>`; }).join('');
  const routeD = pd(rp, false), hw = 26 * k, hh = 23 * k;

  svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
  svg.innerHTML = `<defs>
    <filter id="mBlur" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="${12 * k}"/></filter>
    <filter id="mCloud" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${5 * k}"/></filter>
    <linearGradient id="mLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7a3a20" stop-opacity=".16"/></linearGradient>
    <pattern id="mPaper" width="370" height="340" patternUnits="userSpaceOnUse"><image href="assets/img/papier.jpg" width="370" height="340"/></pattern>
    <path id="mLand" d="${pd(landS.map(S), true)}"/>
    <clipPath id="mClip"><use href="#mLand"/></clipPath>
    <mask id="mMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W.toFixed(0)}" height="${H.toFixed(0)}"><path class="rmask" d="${routeD}" fill="none" stroke="#fff" stroke-width="${30 * k}" stroke-linecap="round" stroke-linejoin="round" style="--L:${total.toFixed(1)}"/></mask>
    <symbol id="mPalm" viewBox="0 0 40 52" overflow="visible"><ellipse cx="21" cy="50.5" rx="10" ry="3" fill="rgba(70,40,20,.2)"/><path d="M21 50 C22 38 19 30 20 20" stroke="#7a5a45" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path fill="#75835a" d="M20 20 C10 18 3 24 2 32 C8 26 14 24 20 20Z"/><path fill="#75835a" d="M20 20 C30 18 37 24 38 32 C32 26 26 24 20 20Z"/>
      <path fill="#8d9a6a" d="M20 20 C13 8 4 8 0 16 C8 12 14 14 20 20Z"/><path fill="#8d9a6a" d="M20 20 C27 8 36 8 40 16 C32 12 26 14 20 20Z"/><path fill="#a3ad80" d="M20 20 C16 10 16 3 20 0 C24 3 24 10 20 20Z"/></symbol>
  </defs>
  <g class="m-shadow"><use href="#mLand" y="${thick + 14 * k}" fill="rgba(70,20,20,.32)" filter="url(#mBlur)"/></g>
  <g class="m-land">
    <g>${sides}</g>
    <use href="#mLand" fill="#f0e2c8"/><use href="#mLand" fill="url(#mPaper)" opacity=".55"/><use href="#mLand" fill="url(#mLight)"/>
    <g clip-path="url(#mClip)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${ROADS.map(r => { const d = pd(crSample(r, false, 10).map(S), false); return `<path d="${d}" stroke="#dcc7a2" stroke-width="${9 * k}"/><path d="${d}" stroke="#fff8ea" stroke-width="${6 * k}"/>`; }).join('')}
      <path d="${pd(rvS.map(S), false)}" stroke="#a9b8b8" stroke-width="${17 * k}"/><path d="${pd(rvS.map(S), false)}" stroke="#cfdcd9" stroke-width="${13 * k}"/>
      <path d="${pd(lakeP.map(S), true)}" fill="#cfdcd9" stroke="#a9b8b8" stroke-width="${3 * k}"/>
      <path d="${pd(lakeP.map(p => S([LAKE.c[0] + (p[0] - LAKE.c[0]) * .7 - 8, LAKE.c[1] + (p[1] - LAKE.c[1]) * .6 - 6])), true)}" fill="#e3ecea" opacity=".7" stroke="none"/>
    </g>
    <use href="#mLand" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2"/>
  </g>
  <path class="m-route" d="${routeD}" fill="none" stroke="#8a1414" stroke-width="${4.6 * k}" stroke-linecap="round" stroke-dasharray="${9 * k} ${9 * k}" mask="url(#mMask)"/>
  <g class="m-trees">${palms.map(palmMk).join('')}</g>
  <g class="m-clouds"><g class="m-drift" fill="#fffaf2" opacity=".93" filter="url(#mCloud)">${clouds}</g></g>
  <g id="mTrav" class="m-trav" opacity="0"><ellipse cx="0" cy="0" rx="${8 * k}" ry="${3 * k}" fill="rgba(60,20,20,.3)"/><use href="#heart" x="${-hw / 2}" y="${-hh - 7 * k}" width="${hw}" height="${hh}"/></g>`;

  /* épingles = boutons HTML posés par-dessus (zone de clic confortable, accessibles au clavier) */
  pinsEl.innerHTML = '';
  D.stops.forEach((s, i) => {
    const [X, Y] = S([s.x, s.y]), b = document.createElement('button');
    b.type = 'button'; b.className = 'pin' + (s.side === 'left' ? ' left' : '') + (s.secret ? ' secret' : ''); b.dataset.i = i; b.dataset.sfx = 'pop';
    b.style.cssText = `--x:${(X / W * 100).toFixed(3)}%;--y:${(Y / H * 100).toFixed(3)}%;--d:${(.45 + stopLen[i] / total * 2.4).toFixed(2)}s`;
    b.setAttribute('aria-label', `${s.time}, ${s.title}`);
    b.innerHTML = `<span class="pin-ground"></span><svg class="pin-ico" viewBox="0 0 40 56" aria-hidden="true"><path d="M20 54 C20 54 3 34 3 19 A17 17 0 0 1 37 19 C37 34 20 54 20 54Z" fill="#b42222" stroke="#6f0e0e" stroke-width="1.4"/><ellipse cx="12" cy="12" rx="5" ry="2.6" fill="rgba(255,255,255,.35)" transform="rotate(-35 12 12)"/>${s.secret ? '<circle cx="20" cy="19" r="9.4" fill="#faf3e3"/><text x="20" y="26.2" text-anchor="middle" font-size="20" font-style="italic" fill="#8a1414" font-family="Instrument Serif,Georgia,serif">?</text>' : '<circle cx="20" cy="19" r="7" fill="#faf3e3"/>'}</svg><span class="pin-tag"><b></b><small></small></span><i class="pin-ok"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.4l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`;
    b.querySelector('b').textContent = s.time; b.querySelector('small').textContent = s.short || s.title;
    b.addEventListener('click', () => pick(i)); pinsEl.append(b);
  });
  const s0 = D.stops[0], [hx, hy] = S([s0.x, s0.y]), mh = document.createElement('span');
  mh.className = 'mhint' + (tall ? ' below' : ''); mh.setAttribute('aria-hidden', 'true'); mh.style.cssText = `--x:${(hx / W * 100).toFixed(3)}%;--y:${(hy / H * 100).toFixed(3)}%`;
  mh.innerHTML = '<b></b><svg viewBox="0 0 30 44"><path d="M14 2 C6 14 8 28 16 38"/><path d="M6.5 30.5 L16 39 L21 27"/></svg>'; mh.querySelector('b').textContent = D.start; pinsEl.append(mh);
  geo = { at, stopLen, total, k, rp, W };
  paintPins();
}

const pinEls = () => [...pinsEl.querySelectorAll('.pin')];
function paintPins() { pinEls().forEach((p, i) => { p.classList.toggle('active', i === sel); p.classList.toggle('visited', seen.has(i)); p.setAttribute('aria-pressed', i === sel); }); }

/* voyageur : un petit cœur qui suit le chemin jusqu'au point choisi */
function travel(to, token) {
  return new Promise(res => {
    const trav = svg.querySelector('#mTrav'), from = cur >= 0 ? geo.stopLen[cur] : 0, dist = Math.abs(to - from);
    let pos = from;
    if (!dist || reduced || !trav) return res(false);
    const dur = Math.min(2400, 750 + dist * 2.1), t0 = performance.now(); trav.style.opacity = 1;
    const f = now => {
      if (token !== tok) { trav.style.opacity = 0; return res(false); }
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, p = geo.at(from + (to - from) * e);
      trav.setAttribute('transform', `translate(${p[0].toFixed(1)} ${(p[1] - Math.abs(Math.sin(k * Math.PI * dist / 90)) * 5 * geo.k).toFixed(1)})`);
      if (k < 1) requestAnimationFrame(f); else { trav.style.opacity = 0; res(true); }
    };
    requestAnimationFrame(f);
  });
}

function fill(i) {
  const s = D.stops[i];
  $('#tkStep').textContent = D.step.replace('{n}', i + 1).replace('{m}', N);
  $('#tkTime').textContent = s.time; $('#tkProv').textContent = D.provisional; $('#tkTitle').textContent = s.title; $('#tkPlace').textContent = s.place || '';
  $('#tkText').textContent = s.text || ''; $('#tkHint').textContent = s.hint || ''; $('#tkHint').hidden = !s.hint; $('#tkPlace').hidden = !s.place;
  const m = $('#tkMaps'); if (s.maps && !s.secret) { m.hidden = false; m.textContent = D.maps; m.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.maps); } else m.hidden = true;
  $('#tkPrev').disabled = i === 0; $('#tkNext').disabled = i === N - 1; tk.classList.toggle('secret', !!s.secret);
}
function place(i) {
  if (mq.matches) { tk.style.left = tk.style.top = ''; return; }
  /* on essaie dessous / dessus / droite / gauche du point et on garde l'emplacement qui cache le moins
     les autres points, leurs étiquettes et le chemin */
  const sw = stage.clientWidth, sh = stage.clientHeight, sr = stage.getBoundingClientRect(), ps = pinEls();
  const rects = ps.map(p => { const r = p.getBoundingClientRect(), lf = p.classList.contains('left'); return { l: r.left - sr.left - (lf ? 112 : 6), r: r.right - sr.left + (lf ? 6 : 112), t: r.top - sr.top - 6, b: r.bottom - sr.top + 6 }; });
  const pr = ps[i].getBoundingClientRect(), px = pr.left - sr.left + pr.width / 2, pt = pr.top - sr.top, pb = pr.bottom - sr.top;
  const cw = tk.offsetWidth, ch = tk.offsetHeight, gap = 18, sc = sw / geo.W, mid = (pt + pb) / 2 - ch / 2;
  const cands = [[px - cw / 2, pb + gap], [px - cw / 2, pt - gap - ch], [px + pr.width / 2 + gap, mid], [px - pr.width / 2 - gap - cw, mid]];
  const ov = (A, B) => Math.max(0, Math.min(A.r, B.r) - Math.max(A.l, B.l)) * Math.max(0, Math.min(A.b, B.b) - Math.max(A.t, B.t));
  let best = null;
  cands.forEach(([l0, t0]) => {
    const oob = Math.max(0, -l0) + Math.max(0, l0 + cw - sw) + Math.max(0, -t0) + Math.max(0, t0 + ch - sh);
    const l = Math.max(8, Math.min(sw - cw - 8, l0)), t = Math.max(8, Math.min(sh - ch - 8, t0)), R = { l, r: l + cw, t, b: t + ch };
    let score = oob * 3;
    rects.forEach((q, j) => { if (j !== i) score += ov(R, q) * .05; });
    score += ov(R, { l: px - pr.width / 2 - 10, r: px + pr.width / 2 + 10, t: pt - 10, b: pb + 10 }) * 10;   // jamais sur son propre point
    geo.rp.forEach(q => { const x = q[0] * sc, y = q[1] * sc; if (x > R.l && x < R.r && y > R.t && y < R.b) score += 2; });
    if (!best || score < best.score) best = { score, l, t };
  });
  tk.style.left = best.l + 'px'; tk.style.top = best.t + 'px';
}
function hideTk() { tk.classList.remove('show'); sel = -1; paintPins(); }
function closeTk() { tok++; hideTk(); const t = svg.querySelector('#mTrav'); t && (t.style.opacity = 0); }
async function pick(i) {
  if (i === sel && tk.classList.contains('show')) return closeTk();
  const token = ++tok; hintDone = true; pinsEl.querySelector('.mhint').classList.remove('on'); hideTk();
  const moved = await travel(geo.stopLen[i], token); if (token !== tok) return;
  cur = i; sel = i; seen.add(i); paintPins(); fill(i);
  tk.classList.remove('show'); void tk.offsetWidth; tk.classList.add('show'); place(i);
  if (moved) sfx('chime');
  tk.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
}
$('#tkClose').addEventListener('click', closeTk);
$('#tkPrev').addEventListener('click', () => sel > 0 && pick(sel - 1));
$('#tkNext').addEventListener('click', () => sel >= 0 && sel < N - 1 && pick(sel + 1));
dayEl.addEventListener('click', e => { if (!e.target.closest('.pin,.ticket')) closeTk(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && tk.classList.contains('show')) closeTk(); });
addEventListener('resize', () => { if (sel >= 0 && tk.classList.contains('show')) place(sel); });
mq.addEventListener('change', () => { build(); sel >= 0 && tk.classList.contains('show') && place(sel); });

build();
/* entrée : le chemin se dessine et les points tombent un à un, une seule fois, quand la section arrive à l'écran */
const go = () => {
  stage.classList.add('go'); setTimeout(() => stage.classList.add('done'), 4600);
  setTimeout(() => { if (!hintDone) pinsEl.querySelector('.mhint').classList.add('on'); }, reduced ? 200 : 3400);
};
'IntersectionObserver' in window ? new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { go(); o.disconnect(); } }, { threshold: .35 }).observe(dayEl) : go();
})();

})();