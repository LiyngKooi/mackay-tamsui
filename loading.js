/* ======================================================================
   淡水河邊的神奇馬偕 AR · Loading Page 進度與轉場
   LOADING_HERO 常數在 index.html 裡已換成圖片的 base64 內容。
   ====================================================================== */

/* ================= Loading =================
 The bar tracks real work: every embedded texture and card has to be
 decoded before the first chapter can be painted, and that is what is
 counted here. When the browser has them cached the whole thing is over
 in a few milliseconds, which reads as a flash rather than an opening,
 so the bar is also held to a floor of MIN_MS. */
(function () {
const MIN_MS   = 1800;   /* shortest the bar may take to reach 100 */
const HOLD_MS  = 500;    /* beat at 100% before the plate lifts */
const OUT_MS   = 1200;   /* matches the CSS transition */
const STAGE_MS = 7000;   /* longest we wait on the renderer itself */
const GIVE_UP  = 9000;   /* a stalled asset must not trap anyone here */

const screen = document.getElementById('loading-screen');
const hero   = document.getElementById('loading-hero');
const bar    = document.getElementById('ld-bar');
const pct    = document.getElementById('ld-pct');
if (!screen) return;

hero.src = LOADING_HERO;

let real = 0, shown = 0, finished = false;
const t0 = performance.now();
let last = t0;

/* ---- what we are actually waiting for ----
   Three things, and only things the first view needs: this
   illustration, the title face, and the renderer announcing that it
   has a frame on screen. Chapter 1's images are warmed afterwards,
   because nobody is looking at them yet and decoding them behind the
   plate would hold the door shut for several seconds. */
function stageReady() {
  return new Promise(res => {
    if (window.__stageReady) return res();
    const done = () => {
      clearTimeout(t);
      /* The painting is behind an opaque plate. Rendering it at sixty
         frames a second while the textures are still being decoded
         only slows the thing the person is waiting for. */
      window.__stagePaused = true;
      res();
    };
    document.addEventListener('stageready', done, { once: true });
    /* If the renderer never reports in, the plate still lifts. Better
       a page that explains itself than a plate that never moves. */
    const t = setTimeout(done, STAGE_MS);
  });
}

/* Decoded in the quiet after the plate lifts, so chapter 1 opens on a
   texture the browser already holds. */
function warm() {
  const list = (window.__warm || []).slice();
  const next = () => {
    const u = list.shift();
    if (!u) return;
    decode(u).then(() => {
      if (window.requestIdleCallback) requestIdleCallback(next, { timeout: 900 });
      else setTimeout(next, 120);
    });
  };
  if (window.requestIdleCallback) requestIdleCallback(next, { timeout: 1200 });
  else setTimeout(next, 400);
}

function decode(uri) {
  return new Promise(res => {
    const i = new Image();
    /* Resolve either way. A broken asset is the renderer's problem to
       report, not a reason to hold the door shut. */
    i.onload = i.onerror = () => res();
    i.src = uri;
    if (i.decode) i.decode().then(res, () => {});
  });
}

function track() {
  /* Fonts count too: the title is set in a Ming face and swapping it
     in behind the plate is better than swapping it in front of the
     person. */
  const jobs = [decode(hero.src), stageReady()];
  if (document.fonts && document.fonts.ready) jobs.push(document.fonts.ready);

  const total = jobs.length || 1;
  let done = 0;
  jobs.forEach(p => Promise.resolve(p).then(() => {
    done++;
    real = Math.max(real, (done / total) * 100);
  }));
  Promise.all(jobs.map(p => Promise.resolve(p).catch(() => {})))
         .then(() => { real = 100; });
}

function paint(v) {
  bar.style.width = v.toFixed(2) + '%';
  pct.textContent = Math.round(v);
}

function frame() {
  const now = performance.now();
  const el = now - t0;
  const dt = Math.min(now - last, 120);
  last = now;
  /* Two limits: the work that is genuinely finished, and the floor that
     keeps a cached load from blinking past. The bar follows whichever
     is lower, so it never races ahead of either. */
  const floor  = Math.min(100, (el / MIN_MS) * 100);
  const target = Math.min(real, floor);
  /* Eased against the clock, not against the frame count. The stage
     is painting a full screen shader on whatever GPU this machine
     has, and on a slow one the callbacks arrive at a tenth of the
     rate, which would otherwise stretch this easing from half a
     second into five. */
  shown += (target - shown) * (1 - Math.exp(-dt / 170));
  if (Math.abs(target - shown) < 0.35) shown = target;
  paint(shown);

  if (shown >= 99.95 || el > GIVE_UP) { paint(100); leave(); return; }
  requestAnimationFrame(frame);
}

function leave() {
  if (finished) return;
  finished = true;
  setTimeout(() => {
    /* The painting starts moving before it is uncovered, so it is
       already alive by the time the plate has gone. */
    window.__stagePaused = false;
    screen.classList.add('is-out');
    setTimeout(() => {
      screen.style.display = 'none';
      screen.remove();
      warm();
    }, OUT_MS + 60);
  }, HOLD_MS);
}

/* The plate is already opaque; this is the contents arriving. */
function start() {
  requestAnimationFrame(() => screen.classList.add('is-in'));
  track();
  requestAnimationFrame(frame);
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', start);
else
  start();
})();
