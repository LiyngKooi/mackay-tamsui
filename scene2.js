/* ======================================================================
   淡水河邊的神奇馬偕 AR · Scene 2「仁醫 · 滬尾偕醫館」邏輯
   S2_* 常數在 index.html 裡已換成圖檔與模型的 base64 內容。
   ====================================================================== */

/* ================= Scene 2 · 仁醫（滬尾偕醫館） =================
 Three objects stand in the painted room, each on its own small stage.
 The label above an object sends it into the viewer's real room; the
 journal at the foot of the screen holds the stories. Reading either
 way counts, and three of three opens the next chapter. */
(function () {
const PANO   = S2_MAP;
const PMASK  = S2_MASK;
const PANO_A = 2576 / 1274;
const SCROLL = S2_SCROLL;
const STAMP  = S2_STAMP;
const THEN   = S2_THEN;
const NOW    = S2_NOW;

/* Lamplight rather than sun on water: no displacement at all, a slow
   warm swell on the flames and the pools of light under them. */
const LOOK = { warm: 1.0, disp: 0.0, swell: 0.0, glint: 0.34, gf: 0.18, gsharp: 1.10, heel: 0.0 };
const HOME = { warm: 0.0, disp: 2.40, swell: 0.026, glint: 0.120, gf: 5.00, gsharp: 2.00, heel: 0.0 };

/* x and y place the object on the painting; sx and sy place its
   sticker on the journal. Both are fractions of their own image. */
const OBJ = [
  { id: 'medicine', x: 0.322, y: 0.618, w: 112, cam: '28deg 74deg auto',
    glb: S2_GLB_BOTTLE,   file: 's2/bottle.glb',
    img: S2_STK_MEDICINE, sx: 0.378, sy: 0.600, sw: 0.150 },
  { id: 'teeth',    x: 0.158, y: 0.792, w: 185, cam: '38deg 68deg auto',
    glb: S2_GLB_PLIERS,   file: 's2/pliers.glb',
    img: S2_STK_TEETH,    sx: 0.628, sy: 0.560, sw: 0.185 },
  { id: 'clinic',   x: 0.511, y: 0.556, w: 192, cam: '26deg 76deg auto',
    glb: S2_GLB_BUILDING, file: 's2/building.glb',
    img: S2_STK_CLINIC,   sx: 0.864, sy: 0.595, sw: 0.180 },
];

const T = {
  zh: {
    hint: '左右滑動看完整個醫館。點物件上的名牌可放到你的桌上看',
    journal: '展開行醫手札',
    next: '前往下一章 · 啟蒙',
    ar: '在現實中檢視 (AR)',
    arOff: 'AR 需要把這個網頁放到網路上才能啟動（例如 GitHub Pages，並把 s2 資料夾一起上傳）。現在是從電腦本機開啟，所以只能在畫面裡轉動模型。',
    arNoDevice: '這台裝置的瀏覽器沒有提供 AR。用 Android 的 Chrome 或 iPhone 的 Safari 開啟同一個網址就可以。',
    names: { medicine: '神奇白藥水', teeth: '傳奇拔牙鉗', clinic: '滬尾偕醫館' },
    arc: {
      medicine: {
        k: 'QUININE SULPHATE',
        t: '神奇白藥水',
        b: '「聽說淡水馬偕牧師有神奇特效藥，大家都稱那是馬偕的神奇白藥水。」那是金雞納霜，也就是奎寧。淡水一帶瘧疾盛行，發作起來忽冷忽熱，當地人原本只能等它自己過去。馬偕把這種白色苦粉用紙一份一份包好發出去，常常混著甘汞一起給，病人隔天就能下床走路。',
        tail: '藥是從加拿大和廈門運來的，數量永遠不夠。他在日記裡算過，一天發出去幾十包，一年下來看了超過一萬人次。',
      },
      teeth: {
        k: 'ONE HOUR, ONE HUNDRED TEETH',
        t: '百顆拔牙傳奇',
        b: '那時候沒有麻醉藥。馬偕讓病人站著，自己也站著，用一把鉗子把壞掉的牙拔下來，最快的時候一小時連拔一百多顆。拔完他會把牙齒放回病人手上，讓圍觀的人看見那不是法術，只是一顆壞掉的牙。',
        ca: '馬偕在野外為民眾拔牙，學生在一旁協助。一次出巡就能服務整個村落，廟埕和榕樹下都是他的診間。',
        cb: '馬偕使用的第一套拔牙鉗。1880 年他返國述職時送給學生陳榮輝，經其後代長期保存，再轉交淡江中學校長，家人後來託偕醫館保管至今。提供者：淡水教會。',
        tail: '拔牙不是傳教的手段，是他取得信任的方式。牙痛在當時沒有別的解法，一個外國人能在幾秒內把痛源拿掉，比任何話都有說服力。他一生估計拔了超過兩萬一千顆牙。',
      },
      clinic: {
        k: '1873 · 2026',
        t: '滬尾偕醫館，與它的後來',
        b: '1873 年，馬偕在租來的民房裡開始看診。1879 年，美國底特律的馬偕夫人（同姓，並非親屬）捐了三千美元，蓋起這間白牆拱窗的小醫館，是北台灣第一所西式醫院。',
        then: '1873 滬尾偕醫館', now: '今日 馬偕紀念醫院',
        tail: '拖動中線，看它變成今天的樣子。那間小醫館後來成了馬偕紀念醫院，一百五十年沒有離開過這條河。',
      },
    },
  },
  en: {
    hint: 'Drag to look around the clinic. Tap a nameplate to stand the object on your own desk',
    journal: 'Open the medical journal',
    next: 'Next chapter · Enlightenment',
    ar: 'View it in your room (AR)',
    arOff: 'AR needs this page to be on the web, for example on GitHub Pages with the s2 folder uploaded alongside it. This copy is open from a local file, so the model can only be turned here on screen.',
    arNoDevice: 'This browser does not offer AR. Open the same address in Chrome on Android or Safari on iPhone.',
    names: { medicine: 'The White Medicine', teeth: 'The Forceps', clinic: 'The Hobe Clinic' },
    arc: {
      medicine: {
        k: 'QUININE SULPHATE',
        t: 'The Magic White Medicine',
        b: 'Word went around Tamsui that the foreign pastor had a miracle powder, and people called it Mackay’s magic white medicine. It was quinine, ground from cinchona bark. Malaria was everywhere along the river, and when it struck there was nothing to do but wait it out. Mackay folded the bitter white powder into paper doses and handed them out, often together with calomel, and patients were back on their feet the next day.',
        tail: 'The supply came from Canada and Amoy and was never enough. He counted the doses in his diary: dozens a day, and more than ten thousand consultations in a year.',
      },
      teeth: {
        k: 'ONE HOUR, ONE HUNDRED TEETH',
        t: 'Pulling Teeth',
        b: 'There was no anaesthetic. Mackay had the patient stand, stood himself, and took the bad tooth out with a pair of forceps. At his fastest he pulled more than a hundred in an hour. Afterwards he put the tooth back into the patient’s own hand, so the crowd could see it was not sorcery, only a bad tooth.',
        ca: 'Mackay pulling teeth in the open air, his students working beside him. One circuit could serve a whole village, and a temple forecourt or a banyan tree was the surgery.',
        cb: 'The first set of forceps Mackay used. He gave them to his student Tan Eng-hui when he sailed home in 1880. They passed down through the family, then to the principal of Tamkang High School, and the family later placed them with the Hobe Mackay Clinic, where they are kept. Lent by Tamsui Church.',
        tail: 'Pulling teeth was not a tactic for preaching. It was how he earned trust. Toothache had no other answer then, and a foreigner who could take the source of the pain away in seconds argued better than any sermon. He is reckoned to have pulled more than twenty one thousand teeth.',
      },
      clinic: {
        k: '1873 · 2026',
        t: 'The Hobe Clinic, and What Became of It',
        b: 'In 1873 Mackay began seeing patients in a rented house. In 1879 a Mrs. Mackay of Detroit, no relation, gave three thousand American dollars, and this small clinic with white walls and arched windows went up: the first Western hospital in northern Taiwan.',
        then: '1873 Hobe Mackay Clinic', now: 'Today Mackay Memorial Hospital',
        tail: 'Drag the seam to see what it became. The little clinic grew into the Mackay Memorial Hospital, and in a hundred and fifty years it has never left this river.',
      },
    },
  },
};

const q = s => document.querySelector(s);
const s2     = q('#s2');
const hint   = q('#s2-hint');
const jrBtn  = q('#jr-btn');
const jrCnt  = q('#jr-count');
const jrWrap = q('#jr-wrap');
const jrPane = q('#jr-pane');
const jrTrack= q('#jr-track');
const jrBg   = q('#jr-bg');
const nextBtn= q('#s2-next');
const arcWrap= q('#arc-wrap');
const arcAr  = q('#arc-ar');
const plates = q('#arc-plates');
const tnStage= q('#tn-stage');
const tnClip = q('#tn-clip');
const tnLine = q('#tn-line');
const tnRange= q('#tn-range');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hosted = location.protocol === 'http:' || location.protocol === 'https:';

let lang = 'zh', active = false, openId = null, pan = 0;
const read = new Set();

/* ---------------- framing ---------------- */
function panRange() {
  const s = (innerWidth / innerHeight) / PANO_A;
  return s >= 1 ? 0 : Math.max(0, 0.5 - s / 2);
}
function toScreen(fx, fyTop) {
  const s = (innerWidth / innerHeight) / PANO_A;
  const uvy = 1 - fyTop;
  let X, V;
  if (s > 1) { X = fx + pan;                   V = (uvy - 0.5) * s + 0.5; }
  else       { X = (fx + pan - 0.5) / s + 0.5; V = uvy; }
  return { x: X * innerWidth, y: (1 - V) * innerHeight };
}
function setPan(v) {
  const m = panRange();
  pan = Math.max(-m, Math.min(m, v));
  if (window.__set) window.__set('pan', pan);
  place();
}
/* Wide enough and the view sits on the midpoint of the three objects
   so all of them are in frame. Narrow, and it opens on the first one,
   with the edge markers leading to the rest. */
function homePan() {
  const s = Math.min((innerWidth / innerHeight) / PANO_A, 1);
  const xs = OBJ.map(o => o.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  return 0.5 - (mid * s + OBJ[0].x * (1 - s));
}

/* ---------------- model-viewer, loaded once and only if needed ---- */
let mvReady = null;
function loadMV() {
  if (window.customElements && customElements.get('model-viewer')) return Promise.resolve(true);
  if (mvReady) return mvReady;
  mvReady = new Promise(res => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
    s.onload = () => customElements.whenDefined('model-viewer').then(() => res(true), () => res(false));
    s.onerror = () => res(false);
    document.head.appendChild(s);
  });
  return mvReady;
}

/* ---------------- the objects in the room ---------------- */
OBJ.forEach(o => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'obj';
  b.dataset.id = o.id;
  b.style.setProperty('--w', o.w + 'px');
  b.innerHTML = '<span class="tag"></span><span class="stage"></span>';
  b.addEventListener('click', () => summon(o.id));
  s2.appendChild(b);
  o.el = b;
  o.tagEl = b.querySelector('.tag');
  o.stageEl = b.querySelector('.stage');
});

/* The three stages hold live models, so they are only built once the
   chapter is actually on screen. */
let built = false;
async function buildModels() {
  if (built) return;
  built = true;
  const ok = await loadMV();
  if (!ok) return;
  OBJ.forEach(o => {
    const mv = document.createElement('model-viewer');
    /* Hosted, the model is a real file so AR has a URL to hand to the
       phone. Opened from disk there is no URL, so the bytes travel
       inline and AR is off: that is the trade, not a bug. */
    mv.setAttribute('src', hosted ? o.file : o.glb);
    mv.setAttribute('alt', T[lang].names[o.id]);
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '14deg');
    mv.setAttribute('camera-orbit', o.cam);
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('disable-zoom', '');
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('exposure', '1.15');
    mv.setAttribute('shadow-intensity', '0.55');
    if (hosted) { mv.setAttribute('ar', ''); mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look'); }
    mv.addEventListener('error', () => {
      if (mv.getAttribute('src') !== o.glb) { mv.removeAttribute('ar'); mv.setAttribute('src', o.glb); }
    }, { once: true });
    o.stageEl.appendChild(mv);
    o.mv = mv;
  });
}

function place() {
  let offL = 0, offR = 0;
  OBJ.forEach(o => {
    const p = toScreen(o.x, o.y);
    o.el.style.left = p.x + 'px';
    o.el.style.top  = p.y + 'px';
    /* Half an object at the edge of the frame is a smudge, so it is
       in view only when all of it is. */
    const m = o.w * 0.62;
    const inView = p.x > m && p.x < innerWidth - m;
    o.el.style.visibility = inView ? 'visible' : 'hidden';
    if (!inView) { if (p.x <= m) offL++; else offR++; }
  });
  arrowL.classList.toggle('on', offL > 0);
  arrowR.classList.toggle('on', offR > 0);
}

const arrowL = document.createElement('button');
const arrowR = document.createElement('button');
[arrowL, arrowR].forEach((a, i) => {
  a.type = 'button';
  a.className = 'edge ' + (i ? 'right' : 'left');
  a.innerHTML = '<span>' + (i ? '›' : '‹') + '</span>';
  a.addEventListener('click', () => nudge(i ? 1 : -1));
  s2.appendChild(a);
});
function nudge(dir) {
  hideHint();
  const t = OBJ.map(o => ({ o, x: toScreen(o.x, o.y).x, m: o.w * 0.62 }))
               .filter(v => dir < 0 ? v.x <= v.m : v.x >= innerWidth - v.m)
               .sort((a, b) => dir < 0 ? b.x - a.x : a.x - b.x)[0];
  glide(t ? 0.5 - t.o.x : pan + dir * 0.18);
}
let gliding = 0;
function glide(to) {
  cancelAnimationFrame(gliding);
  if (reduce) { setPan(to); return; }
  const from = pan, t0 = performance.now();
  (function run() {
    const p = Math.min(1, (performance.now() - t0) / 620);
    setPan(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) gliding = requestAnimationFrame(run);
  })();
}

/* ---------------- drag the room ---------------- */
(function () {
  let id = null, x0 = 0, p0 = 0, moved = 0;
  s2.addEventListener('pointerdown', e => {
    if (e.target.closest('.obj, .edge')) return;
    id = e.pointerId; x0 = e.clientX; p0 = pan; moved = 0;
    s2.setPointerCapture(id);
  });
  s2.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    moved = Math.max(moved, Math.abs(dx));
    setPan(p0 + (dx / innerWidth) * Math.min((innerWidth / innerHeight) / PANO_A, 1));
  });
  const up = e => { if (e.pointerId === id) { id = null; if (moved > 8) hideHint(); } };
  s2.addEventListener('pointerup', up);
  s2.addEventListener('pointercancel', up);
})();

/* ---------------- ambience: a clock and a lamp ---------------- */
let amb = null;
function ambience(on) {
  if (!on) { if (amb) { try { amb.stop(); } catch (e) {} amb = null; } return; }
  if (amb || typeof actx === 'undefined' || !actx) return;
  const a = actx, out = a.createGain();
  out.gain.value = 0; out.connect(a.destination);

  const n = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const d = n.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.03 * w) / 1.03;
    d[i] = last * 2.4;
  }
  const src = a.createBufferSource(); src.buffer = n; src.loop = true;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = 1.1;
  const ng = a.createGain(); ng.gain.value = 0.55;
  src.connect(bp).connect(ng).connect(out); src.start();

  let t = a.currentTime + 0.4, stopped = false, timer = 0;
  const tick = (when, hi) => {
    const o = a.createOscillator(), g = a.createGain(), hp = a.createBiquadFilter();
    o.type = 'square'; o.frequency.value = hi ? 2050 : 1680;
    hp.type = 'highpass'; hp.frequency.value = 900;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(hi ? 0.055 : 0.045, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
    o.connect(hp).connect(g).connect(out);
    o.start(when); o.stop(when + 0.06);
  };
  const pump = () => {
    if (stopped) return;
    while (t < a.currentTime + 2.0) { tick(t, Math.round(t * 1000) % 2000 < 1000); t += 1.0; }
    timer = setTimeout(pump, 900);
  };
  pump();
  amb = { stop() {
    stopped = true; clearTimeout(timer);
    const now = a.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.linearRampToValueAtTime(0, now + 0.6);
    setTimeout(() => { try { src.stop(); out.disconnect(); } catch (e) {} }, 800);
  } };
  out.gain.linearRampToValueAtTime(0.10, a.currentTime + 1.2);
}
setInterval(() => {
  const on = active && typeof audioOn !== 'undefined' && audioOn;
  if (on && !amb) ambience(true);
  if (!on && amb)  ambience(false);
}, 400);

/* ---------------- hint ---------------- */
let hintTimer = 0;
function showHint(msg) {
  hint.textContent = msg;
  hint.classList.add('is-in');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.remove('is-in'), 5600);
}
function hideHint() { clearTimeout(hintTimer); hint.classList.remove('is-in'); }

/* ---------------- the journal ---------------- */
jrBg.src = SCROLL;
OBJ.forEach(o => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'stk';
  b.dataset.id = o.id;
  b.innerHTML = '<img src="' + o.img + '" alt="">' +
                '<img class="mark" src="' + STAMP + '" alt="">';
  b.addEventListener('click', () => openArc(o.id));
  jrTrack.appendChild(b);
  o.stk = b;
});

function layout() {
  const w = jrBg.offsetWidth, h = jrBg.offsetHeight;
  if (!w || !h) return;
  const ox = jrBg.offsetLeft, oy = jrBg.offsetTop;
  OBJ.forEach(o => {
    o.stk.style.left  = (ox + o.sx * w) + 'px';
    o.stk.style.top   = (oy + o.sy * h) + 'px';
    o.stk.style.width = (o.sw * w) + 'px';
    o.px = ox + o.sx * w;
  });
}
jrBg.addEventListener('load', layout);

function openJournal(focus) {
  jrWrap.classList.add('is-in');
  jrWrap.setAttribute('aria-hidden', 'false');
  document.body.classList.add('jr-open');
  jrBtn.classList.remove('nudge');
  hideHint();
  window.__stagePaused = true;
  requestAnimationFrame(() => {
    layout();
    const first = OBJ.find(o => !read.has(o.id)) || OBJ[0];
    const o = focus ? OBJ.find(v => v.id === focus) || first : first;
    if (o.px != null) {
      const left = Math.max(0, o.px - jrPane.clientWidth / 2);
      if (!reduce && jrPane.scrollTo) jrPane.scrollTo({ left: left, behavior: 'smooth' });
      else jrPane.scrollLeft = left;
    }
    o.stk.focus({ preventScroll: true });
  });
}
function closeJournal() {
  jrWrap.classList.remove('is-in');
  jrWrap.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('jr-open');
  window.__stagePaused = false;
  if (window.__setTime) window.__setTime(performance.now() / 1000);
  paint();
  if (active) jrBtn.focus({ preventScroll: true });
}

/* ---------------- drag the journal sideways ---------------- */
(function () {
  let id = null, x0 = 0, l0 = 0, moved = 0;
  jrPane.addEventListener('pointerdown', e => {
    id = e.pointerId; x0 = e.clientX; l0 = jrPane.scrollLeft; moved = 0;
    jrPane.classList.add('dragging');
  });
  jrPane.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) jrPane.scrollLeft = l0 - dx;
  });
  const up = e => { if (e.pointerId === id) { id = null; jrPane.classList.remove('dragging'); } };
  jrPane.addEventListener('pointerup', up);
  jrPane.addEventListener('pointercancel', up);
  jrPane.addEventListener('click', e => {
    if (moved > 8) { e.stopPropagation(); e.preventDefault(); }
  }, true);
})();

/* ---------------- the archive card ---------------- */
function openArc(id) {
  const t = T[lang], c = t.arc[id];
  openId = id;
  q('#arc-kicker').textContent = c.k;
  q('#arc-title').textContent  = c.t;
  q('#arc-body').textContent   = c.b;
  q('#arc-tail').textContent   = c.tail || '';

  const hasPlates = !!c.ca;
  plates.hidden = !hasPlates;
  if (hasPlates) {
    q('#arc-fig-a').src = S2_H_TEETH;  q('#arc-cap-a').textContent = c.ca;
    q('#arc-fig-b').src = S2_H_PLIERS; q('#arc-cap-b').textContent = c.cb;
  }

  const hasTN = id === 'clinic';
  tnStage.hidden = !hasTN;
  if (hasTN) {
    q('#tn-then').src = THEN; q('#tn-then').alt = c.then;
    q('#tn-now').src  = NOW;  q('#tn-now').alt  = c.now;
    q('#tn-tag-then').textContent = c.then;
    q('#tn-tag-now').textContent  = c.now;
    tnRange.setAttribute('aria-label', c.t);
    tnRange.value = 50; paintSeam(50);
  }

  q('#arc-ar-label').textContent = t.ar;
  arcAr.classList.toggle('is-off', !hosted);
  q('#arc-note').textContent = hosted ? '' : t.arOff;

  q('#arc .arc-scroll').scrollTop = 0;
  arcWrap.classList.add('is-in');
  arcWrap.setAttribute('aria-hidden', 'false');
  window.__stagePaused = true;
  q('#arc-close').focus({ preventScroll: true });
}

function closeArc() {
  const id = openId;
  openId = null;
  arcWrap.classList.remove('is-in');
  arcWrap.setAttribute('aria-hidden', 'true');
  if (!jrWrap.classList.contains('is-in')) {
    window.__stagePaused = false;
    if (window.__setTime) window.__setTime(performance.now() / 1000);
  }
  if (id) { markRead(id); }
  if (jrWrap.classList.contains('is-in')) {
    const o = OBJ.find(v => v.id === id);
    if (o) o.stk.focus({ preventScroll: true });
  }
}

/* Reading a story, by either route, is what advances the journal. */
function markRead(id) {
  if (read.has(id)) { paint(); return; }
  read.add(id);
  paint();
  if (!jrWrap.classList.contains('is-in')) {
    jrBtn.classList.remove('nudge');
    void jrBtn.offsetWidth;
    jrBtn.classList.add('nudge');
  }
}

function paint() {
  const t = T[lang];
  OBJ.forEach(o => {
    o.tagEl.textContent = t.names[o.id];
    o.el.setAttribute('aria-label', t.names[o.id] + ' · ' + t.ar);
    o.el.classList.toggle('done', read.has(o.id));
    o.stk.classList.toggle('done', read.has(o.id));
    o.stk.setAttribute('aria-label', t.arc[o.id].t);
    if (o.mv) o.mv.setAttribute('alt', t.names[o.id]);
  });
  q('#jr-label').textContent = t.journal;
  jrCnt.textContent = read.size + '/' + OBJ.length;
  nextBtn.textContent = t.next;
  /* Only out in the room, and only once all three are read. */
  nextBtn.classList.toggle('is-in',
    active && read.size >= OBJ.length && !jrWrap.classList.contains('is-in'));
  q('#arc-ar-label').textContent = t.ar;
}

/* ---------------- then and now ---------------- */
function paintSeam(v) {
  tnClip.style.clipPath = 'inset(0 0 0 ' + v + '%)';
  tnLine.style.left = v + '%';
}
tnRange.addEventListener('input', () => paintSeam(+tnRange.value));

/* ---------------- sending an object into the room ---------------- */
async function summon(id) {
  const o = OBJ.find(v => v.id === id);
  if (!o) return;
  markRead(id);
  if (!hosted) { showHint(T[lang].arOff); return; }
  await buildModels();
  if (!o.mv) return;
  await customElements.whenDefined('model-viewer');
  if (!o.mv.loaded) await new Promise(r => o.mv.addEventListener('load', r, { once: true }));
  if (o.mv.canActivateAR) o.mv.activateAR();
  else showHint(T[lang].arNoDevice);
}

arcAr.addEventListener('click', () => {
  if (!hosted) { q('#arc-note').textContent = T[lang].arOff; return; }
  if (openId) summon(openId);
});

/* ---------------- wiring ---------------- */
jrBtn.addEventListener('click', () => openJournal());
q('#jr-close').addEventListener('click', closeJournal);
q('#arc-close').addEventListener('click', closeArc);
arcWrap.addEventListener('click', e => { if (e.target === arcWrap) closeArc(); });
jrWrap.addEventListener('click', e => { if (e.target === jrWrap || e.target === jrPane) closeJournal(); });
nextBtn.addEventListener('click', () => goToScene(3));
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (arcWrap.classList.contains('is-in')) closeArc();
  else if (jrWrap.classList.contains('is-in')) closeJournal();
});
addEventListener('resize', () => { setPan(pan); layout(); });

/* ---------------- chapter in, chapter out ---------------- */
document.addEventListener('scenechange', e => {
  const on = e.detail.id === 2;
  if (on === active) return;
  active = on;
  if (on) {
    if (window.__setScene) window.__setScene(PANO, PMASK, PANO_A);
    if (window.__set) for (const k in LOOK) window.__set(k, LOOK[k]);
    setPan(homePan());
    s2.classList.add('is-in');
    jrBtn.classList.add('is-in');
    paint();
    showHint(T[lang].hint);
    buildModels();
    requestAnimationFrame(layout);
  } else {
    if (arcWrap.classList.contains('is-in')) closeArc();
    if (jrWrap.classList.contains('is-in')) closeJournal();
    ambience(false);
    s2.classList.remove('is-in');
    jrBtn.classList.remove('is-in');
    nextBtn.classList.remove('is-in');
    hideHint();
    /* Every chapter sets its own complete look on the way in, and its
       enter runs before this exit, so only the title page is handed
       the defaults back. */
    if (e.detail.id === 0) {
      if (window.__set) { for (const k in HOME) window.__set(k, HOME[k]); window.__set('pan', 0); }
      if (window.__resetScene) window.__resetScene();
    }
    pan = 0;
  }
});

document.addEventListener('langchange', ev => { lang = ev.detail.lang; paint(); if (openId) openArc(openId); });
paint();

/* Warmed in the quiet after the loading plate lifts. */
window.__warm = (window.__warm || []).concat([PANO, PMASK, SCROLL, THEN, NOW]);
})();
