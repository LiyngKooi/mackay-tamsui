  <script>
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
    const THEN   = S2_THEN;
    const NOW    = S2_NOW;

    /* Lamplight rather than sun on water: no displacement at all, a slow
       warm swell on the flames and the pools of light under them. */
    const LOOK = { warm: 1.0, disp: 0.0, swell: 0.0, glint: 0.14, gf: 0.18, gsharp: 1.10, heel: 0.0 };
    const HOME = { warm: 0.0, disp: 2.40, swell: 0.026, glint: 0.120, gf: 5.00, gsharp: 2.00, heel: 0.0 };

    /* x and y place the mark on the painting; sx and sy place its sticker
       on the journal. Both are fractions of their own image. The objects
       themselves are painted into the room, so nothing is added on top of
       it but a bead of light. */
    const OBJ = [
      { id: 'medicine', x: 0.330, y: 0.628,
        file: 's2/bottle.glb',   usdz: 's2/bottle.usdz',   img: S2_STK_MEDICINE, sx: 0.378, sy: 0.600, sw: 0.150 },
      /* The forceps are long and thin, so the default three quarter view
         puts them end on and they read as a stub. Looking down the length
         of them is the only angle that shows what they are. */
      { id: 'teeth',    x: 0.163, y: 0.800, orbit: '0deg 22deg auto', fov: '20deg',
        file: 's2/pliers.glb',   usdz: 's2/pliers.usdz',   img: S2_STK_TEETH,    sx: 0.628, sy: 0.560, sw: 0.185 },
      { id: 'clinic',   x: 0.606, y: 0.472,
        file: 's2/building.glb', usdz: 's2/building.usdz', img: S2_STK_CLINIC,   sx: 0.864, sy: 0.595, sw: 0.180 },
    ];

    /* Every painted flame in the room, found by picking the bright warm
       blobs out of the artwork. rad is in image pixels, so the halo keeps
       its size relative to the painting at any viewport. */
    const LAMPS = [
      { x: 0.3084, y: 0.4383, rad: 330, i: 1.00 },   /* 左牆煤油提燈 */
      { x: 0.2416, y: 0.6639, rad: 170, i: 0.80 },   /* 診桌蠟燭 */
      { x: 0.2593, y: 0.6461, rad: 140, i: 0.70 },
      { x: 0.2763, y: 0.6518, rad: 130, i: 0.66 },
      { x: 0.3790, y: 0.5164, rad: 195, i: 0.86 },   /* 左桌提燈 */
      { x: 0.4958, y: 0.6038, rad: 290, i: 0.95 },   /* 中央桌提燈 */
      { x: 0.5403, y: 0.4643, rad: 205, i: 0.84 },   /* 中牆提燈 */
      { x: 0.6420, y: 0.3732, rad: 140, i: 0.58 },   /* 遠處小燈 */
      { x: 0.6223, y: 0.6799, rad: 300, i: 1.00 },   /* 右書桌提燈 */
      { x: 0.7569, y: 0.5721, rad: 145, i: 0.58 },   /* 右牆小燈 */
      { x: 0.8231, y: 0.6525, rad: 215, i: 0.85 },   /* 右書桌燭台 */
      { x: 0.8011, y: 0.6567, rad: 160, i: 0.70 },
    ];

    const T = {
      zh: {
        hint: '左右滑動看完整個醫館。展開下方的行醫手札，裡面有三段故事',
        journal: '展開行醫手札',
        next: '前往下一章 · 啟蒙',
        ar: '在現實中檢視 (AR)',
        arOff: 'AR 需要把這個網頁放到網路上才能啟動，例如 GitHub Pages，並把 s2 資料夾一起上傳。現在是從電腦本機開啟的，所以還沒有可以掃描的網址。',
        arNoDevice: '這台裝置的瀏覽器沒有提供 AR。用 Android 的 Chrome 或 iPhone 的 Safari 開啟同一個網址就可以。',
        locked: '先讀完前一站，這張才會翻開',
        portalHint: '輕按推開木門',
        portalTitle: '1873 年滬尾偕醫館 至 今日馬偕紀念醫院',
        portalBody: '一間小小的避風診所，推開了北台灣近代醫學的百年守護。',
        qrKicker: 'VIEW IN YOUR ROOM',
        qrScan: '請使用智慧型手機相機掃描 QR Code，開啟 AR 實境體驗。',
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
            then: '1873 年 滬尾偕醫館', now: '現代 馬偕紀念醫院',
            tail: '拖動中線，看它變成今天的樣子。那間小醫館後來成了馬偕紀念醫院，一百五十年沒有離開過這條河。',
          },
        },
      },
      en: {
        hint: 'Drag to look around the clinic. Open the journal below for the three stories',
        journal: 'Open the medical journal',
        next: 'Next chapter · Enlightenment',
        ar: 'View it in your room (AR)',
        arOff: 'AR needs this page to be on the web, for example on GitHub Pages with the s2 folder uploaded alongside it. This copy is open from a local file, so there is no address to scan yet.',
        arNoDevice: 'This browser does not offer AR. Open the same address in Chrome on Android or Safari on iPhone.',
        locked: 'Read the station before this one to turn this sheet',
        portalHint: 'Push the doors open',
        portalTitle: 'From the Hobe Mackay Clinic of 1873 to Mackay Memorial Hospital today',
        portalBody: 'A small shelter of a surgery opened a hundred years of modern medicine in northern Taiwan.',
        qrKicker: 'VIEW IN YOUR ROOM',
        qrScan: 'Scan this code with a phone camera to open the model in your own room.',
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
    const portal = q('#time-portal-container');
    const portalPlate = q('#portal-plate');

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
    /* Nothing to centre on, so the room opens looking straight ahead. */
    function homePan() { return 0; }

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

    /* ---------------- the room ----------------
       Nothing is hung in it. The painting carries the candlelight and the
       dust and nothing else; the way into the three stories is the
       journal at the foot of the screen. The model files are fetched only
       when somebody asks to see one in their own room. */

    /* One element per painted flame, laid over the artwork. */
    const dust = document.createElement('canvas');
    dust.id = 's2-dust';
    s2.appendChild(dust);
    LAMPS.forEach(L => {
      const e = document.createElement('span');
      e.className = 'lamp';
      s2.appendChild(e);
      L.el = e;
      /* Each flame gets its own phases, so twelve of them never pulse in
         step with one another. */
      L.p1 = Math.random() * 6.283;
      L.p2 = Math.random() * 6.283;
      L.p3 = Math.random() * 6.283;
    });

    function imgScale() {
      const s = (innerWidth / innerHeight) / PANO_A;
      return s > 1 ? innerWidth / 2576 : innerHeight / 1274;
    }

    function place() {
      const k = imgScale();
      LAMPS.forEach(L => {
        const p = toScreen(L.x, L.y);
        const d = L.rad * k * 2;
        L.el.style.left   = p.x + 'px';
        L.el.style.top    = p.y + 'px';
        L.el.style.width  = d + 'px';
        L.el.style.height = d + 'px';
        L.el.style.visibility = (p.x > -d && p.x < innerWidth + d) ? 'visible' : 'hidden';
      });
      /* The markers point at room the viewer has not turned to yet.
         Panning positive walks toward the left wall, so that is the side
         still left to see while pan is short of its limit. */
      const m = panRange();
      arrowL.classList.toggle('on', pan < m - 0.002);
      arrowR.classList.toggle('on', pan > -m + 0.002);
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
      glide(pan - dir * 0.18);
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

    /* ---------------- flame and dust ----------------
       One loop drives both. It runs only while the chapter is on screen
       and nothing is covering it, so the page costs nothing when the
       room is not being looked at. */
    const MOTES = 72;
    const motes = [];
    let dctx = null, dw = 0, dh = 0, dpr = 1, sprite = null;

    function makeSprite() {
      /* One pre drawn speck, blitted per particle. Drawing a gradient per
         particle per frame is what makes dust expensive; this makes it a
         plain image copy. */
      const r = 8 * dpr;
      const c = document.createElement('canvas');
      c.width = c.height = r * 2;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0,    'rgba(255, 226, 160, 1)');
      grd.addColorStop(0.35, 'rgba(255, 196, 92, 0.55)');
      grd.addColorStop(1,    'rgba(255, 186, 66, 0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, r * 2, r * 2);
      sprite = c;
    }

    function sizeDust() {
      /* Dust is soft by definition, so it gets a one to one backing store
         even on a retina screen. At device pixel ratio two this canvas
         would be four times the pixels for no visible gain, and clearing
         it is the single most expensive thing in the loop. */
      dpr = 1;
      dw = innerWidth; dh = innerHeight;
      dust.width  = Math.round(dw * dpr);
      dust.height = Math.round(dh * dpr);
      dust.style.width  = dw + 'px';
      dust.style.height = dh + 'px';
      dctx = dust.getContext('2d');
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeSprite();
    }

    function seedMotes() {
      motes.length = 0;
      if (dctx) dctx.clearRect(0, 0, dw, dh);
      for (let i = 0; i < MOTES; i++) {
        /* z is depth: the far ones are smaller, fainter and drift less,
           which is what gives the swarm a sense of room. */
        const z = 0.35 + Math.random() * 0.65;
        motes.push({
          x: Math.random(), y: Math.random(), z: z,
          r: (1.0 + z * 1.0),                 /* 2px to 4px across */
          a: 0.16 + z * 0.18,                 /* about 0.3 at the front */
          vy: (-0.0036 - Math.random() * 0.004) * z,
          sw: 0.5 + Math.random() * 1.1,      /* sway width */
          ph: Math.random() * 6.283,
          sp: 0.09 + Math.random() * 0.13,    /* sway speed */
        });
      }
    }

    let raf = 0, t0 = performance.now(), lastPan = 0, flip = false;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;

      /* --- flames ---
         The slowest wave here turns over in two and a half seconds, so
         there is nothing to see in a second pass at it. Updating twelve
         of them on alternate frames halves the style writes and looks
         exactly the same. */
      flip = !flip;
      if (flip) for (let i = 0; i < LAMPS.length; i++) {
        const L = LAMPS[i];
        /* Three slow waves at unrelated periods. Nothing here is fast
           enough to read as a strobe; the shortest is two and a half
           seconds. */
        const a = Math.sin(t * 2.513 + L.p1);          /* 2.5s */
        const b = Math.sin(t * 1.698 + L.p2);          /* 3.7s */
        const c = Math.sin(t * 0.571 + L.p3);          /* 11s  */
        const n = (0.46 * a + 0.34 * b + 0.20 * c);    /* -1 .. 1 */
        /* Squared toward the middle, so it lingers near the resting
           brightness and only occasionally reaches the ends. */
        const e = n * Math.abs(n);
        L.el.style.opacity = (L.i * (0.975 + 0.125 * e)).toFixed(3);
        L.el.style.transform = 'translate(-50%, -50%) scale(' + (1 + 0.055 * (0.6 * a + 0.4 * c)).toFixed(4) + ')';
      }

      /* --- dust ---
         Only the squares the specks were in last frame are cleared. A
         full clear of a screen sized canvas is a memset of several
         million pixels every frame; this is a few thousand. */
      if (dctx) {
        const dpan = (pan - lastPan) * dw * 1.6;   /* parallax with the view */
        lastPan = pan;
        const sp = sprite;
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          if (m.w) dctx.clearRect(m.px, m.py, m.w, m.w);
          m.y += m.vy;
          if (m.y < -0.04) { m.y = 1.04; m.x = Math.random(); }
          m.x += (dpan * m.z) / dw;
          if (m.x < -0.05) m.x += 1.1; else if (m.x > 1.05) m.x -= 1.1;
          const x = m.x * dw + Math.sin(t * m.sp + m.ph) * m.sw * 14;
          const y = m.y * dh;
          const d = m.r * 2;
          m.px = (x - d - 1) | 0; m.py = (y - d - 1) | 0; m.w = (d * 2 + 3) | 0;
          dctx.globalAlpha = m.a * (0.75 + 0.25 * Math.sin(t * m.sp * 1.7 + m.ph));
          dctx.drawImage(sp, x - d, y - d, d * 2, d * 2);
        }
        dctx.globalAlpha = 1;
      }
    }

    function runFX(on) {
      if (on && !raf) { t0 = performance.now() - 1000; lastPan = pan; raf = requestAnimationFrame(frame); }
      if (!on && raf)  { cancelAnimationFrame(raf); raf = 0; }
    }
    /* Covered by the journal or a card, there is nothing to look at. */
    function fxShouldRun() {
      return active && !reduce
        && !jrWrap.classList.contains('is-in')
        && !arcWrap.classList.contains('is-in');
    }
    function syncFX() {
      runFX(fxShouldRun());
      if (reduce) LAMPS.forEach(L => { L.el.style.opacity = L.i; });
    }

    /* ---------------- drag the room ---------------- */
    (function () {
      let id = null, x0 = 0, p0 = 0, moved = 0;
      s2.addEventListener('pointerdown', e => {
        if (e.target.closest('.edge')) return;
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
                    '<span class="spark" aria-hidden="true"><i></i><b>\u2726</b></span>' +
                    '<span class="mark" aria-hidden="true">\u5df2\u63a2</span>';
      b.addEventListener('click', () => openArc(o.id));
      jrTrack.appendChild(b);
      o.stk = b;
    });

    /* The walked line between the three stations, drawn under the paper
       cuts. It dips between stops the way a route sketched by hand does,
       rather than ruling straight from one to the next. */
    const jrTrail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    jrTrail.id = 'jr-trail';
    jrTrail.setAttribute('aria-hidden', 'true');
    /* One leg per gap between stations. The dashes do the work on their
       own: they slide into place once, then keep walking, which is the
       same pair of keyframes chapter one uses. */
    const SVGNS = 'http://www.w3.org/2000/svg';
    const LEGS = [];
    for (let i = 0; i < OBJ.length - 1; i++) {
      const leg = document.createElementNS(SVGNS, 'path');
      leg.setAttribute('class', 'leg');
      jrTrail.appendChild(leg);
      LEGS.push({ leg: leg });
    }
    jrTrack.insertBefore(jrTrail, jrTrack.firstChild.nextSibling);

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

      jrTrail.setAttribute('width', w);
      jrTrail.setAttribute('height', h);
      jrTrail.style.left = ox + 'px';
      jrTrail.style.top  = oy + 'px';
      /* Station to station, measured off the gold marks themselves so the
         line always meets them however the sheet is sized. It sags
         between stops the way a route sketched by hand does. */
      /* Measured off the cut sheet, not off the gold mark: once a station
         has been read its mark is display none and would measure zero,
         which would fold the line in on itself. The mark sits on the
         sheet's lower left corner, so that corner is the anchor. */
      const base = jrTrack.getBoundingClientRect();
      const mid = OBJ.map(o => {
        const r = o.stk.getBoundingClientRect();
        if (!r.width) return null;
        return { x: r.left   - base.left - ox,
                 y: r.bottom - base.top  - oy - 8 };
      });
      LEGS.forEach((L, i) => {
        const a = mid[i], b = mid[i + 1];
        if (!a || !b) return;
        /* Leave each mark at its rim rather than from its centre. */
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1, gap = 22;
        const ax = a.x + dx / len * gap, ay = a.y + dy / len * gap;
        const bx = b.x - dx / len * gap, by = b.y - dy / len * gap;
        const d = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) +
                  ' Q' + ((ax + bx) / 2).toFixed(1) + ' ' +
                  (Math.max(ay, by) + h * 0.075).toFixed(1) + ' ' +
                  bx.toFixed(1) + ' ' + by.toFixed(1);
        L.leg.setAttribute('d', d);
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
      syncFX();
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
      syncFX();
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
      /* A sheet that has not been reached yet does not open, however it
         was reached: by the paper cut, by the keyboard, or by code. */
      const at = OBJ.findIndex(o => o.id === id);
      if (at > 0 && !read.has(OBJ[at - 1].id)) return;

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

      const hasPortal = id === 'clinic';
      portal.hidden = !hasPortal;
      portalPlate.hidden = !hasPortal;
      if (hasPortal) {
        /* One photograph across two leaves, so both halves are the same
           file laid out at twice the leaf width. */
        q('#portal-then-l').src = THEN; q('#portal-then-l').alt = c.then;
        q('#portal-then-r').src = THEN; q('#portal-then-r').alt = '';
        q('#portal-now').src    = NOW;  q('#portal-now').alt    = c.now;
        q('#portal-hint').textContent     = t.portalHint;
        q('#portal-plate-t').textContent  = t.portalTitle;
        q('#portal-plate-b').textContent  = t.portalBody;
        portal.setAttribute('aria-label', t.portalHint);
        shutDoors(true);
      }

      /* The exhibit plate: the same hand drawn piece that marks the
         station on the scroll, mounted at the head of the card. */
      const o = OBJ.find(v => v.id === id);
      q('#arc-fig').src = o ? o.img : '';
      q('#arc-fig').alt = c.t;
      q('#arc-figwrap').hidden = !o;

      arcStage.hidden = true;
      q('#arc-ar-label').textContent = t.ar;
      /* The button always works now: on a desk it hands over the address,
         on a phone it opens the camera. No warning bar either way. */
      arcAr.classList.remove('is-off');

      q('#arc .arc-scroll').scrollTop = 0;
      arcWrap.classList.add('is-in');
      arcWrap.setAttribute('aria-hidden', 'false');
      window.__stagePaused = true;
      syncFX();
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
      syncFX();
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

    /* The journal opens on the first station alone. Each one read lays
       down the leg to the next and brings its mark up, so the sheet fills
       in the order the stories happened rather than all at once. */
    function gate() {
      const t = T[lang];
      OBJ.forEach((o, i) => {
        const open = i === 0 || read.has(OBJ[i - 1].id);
        o.stk.classList.toggle('locked', !open);
        o.stk.classList.toggle('unlocked', open);
        o.stk.disabled = !open;
        o.stk.setAttribute('aria-disabled', String(!open));
        if (!open) o.stk.setAttribute('aria-label', t.locked);
      });
      LEGS.forEach((L, i) => L.leg.classList.toggle('drawn', read.has(OBJ[i].id)));
    }

    function paint() {
      const t = T[lang];
      OBJ.forEach(o => {
        o.stk.classList.toggle('done', read.has(o.id));
        o.stk.setAttribute('aria-label', t.arc[o.id].t);
        if (o.mv) o.mv.setAttribute('alt', t.names[o.id]);
      });
      gate();
      q('#jr-label').textContent = t.journal;
      jrCnt.textContent = read.size + '/' + OBJ.length;
      nextBtn.textContent = t.next;
      /* Only out in the room, and only once all three are read. */
      nextBtn.classList.toggle('is-in',
        active && read.size >= OBJ.length && !jrWrap.classList.contains('is-in'));
      q('#arc-ar-label').textContent = t.ar;
    }

    /* ================= the hundred year door =================
       The clinic of 1873 is painted across two leaves hinged at the outer
       edges of the frame. Pushing them open turns them away and the
       hospital that stands on that ground now is behind. A press anywhere
       works it, and so does a drag out from the middle, which is the way
       a hand would actually do it.

       The CSS owns the swing. This only decides when the doors are open,
       and brings the inscription in once they have settled. */

    let doorsOpen = false, plateTimer = 0;

    function setDoors(open, instant) {
      doorsOpen = open;
      portal.classList.toggle('is-open', open);
      portal.setAttribute('aria-pressed', String(open));

      clearTimeout(plateTimer);
      if (!open) { portalPlate.classList.remove('is-in'); return; }
      /* The card waits for the leaves to come to rest, then arrives. */
      const wait = (instant || reduce) ? 0 : 1200 + 600;
      plateTimer = setTimeout(() => portalPlate.classList.add('is-in'), wait);
    }

    /* Used when the card opens: closed, with no animation to watch. */
    function shutDoors(instant) {
      if (instant) {
        const keep = portal.style.transition;
        portal.style.transition = 'none';
        setDoors(false, true);
        void portal.offsetWidth;
        portal.style.transition = keep;
        return;
      }
      setDoors(false);
    }

    function toggleDoors() { setDoors(!doorsOpen); }

    /* ---- a press ----
       Presses are settled on pointerup, not on click. A drag ends with a
       click of its own and the gap between the two is the rest of the
       drag, which has no upper bound, so no amount of waiting tells the
       two apart. What is left for the click handler is the kind that no
       pointer produced, from assistive software: every pointer gesture
       raises this flag and its own click clears it again. */
    portal.addEventListener('click', () => {
      if (pointerUsed) { pointerUsed = false; return; }
      toggleDoors();
    });
    portal.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); toggleDoors();
      }
    });

    /* ---- a drag, by finger or by mouse ----
       Out from the middle opens, back towards it closes. The threshold is
       in fractions of the frame so it feels the same on a phone as on a
       desk. Vertical movement is left alone, because the card behind this
       scrolls. */
    let dragX = 0, dragY = 0, dragging = false, acted = false, fromMid = 0;
    let scrolled = false, pointerUsed = false;

    function down(x, y) {
      dragX = x; dragY = y; dragging = true;
      acted = false; scrolled = false; pointerUsed = true;
      const r = portal.getBoundingClientRect();
      fromMid = (x - (r.left + r.width / 2)) / (r.width / 2);   /* -1 .. 1 */
    }
    function move(x, y) {
      if (!dragging) return false;
      const dx = x - dragX, dy = y - dragY;
      /* Going up or down the page is the card scrolling, not the doors. */
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        dragging = false; scrolled = true; return false;
      }
      const r = portal.getBoundingClientRect();
      const need = r.width * 0.09;
      if (Math.abs(dx) < need) return false;

      /* Away from the centre line opens, towards it closes. On the exact
         middle either direction is outward. */
      const outward = fromMid === 0 ? true : (dx * fromMid > 0);
      dragging = false; acted = true;
      if (outward !== doorsOpen) setDoors(outward);
      return true;
    }
    /* Anything that was not a push and was not the page scrolling is a
       press, however much the finger slid while it was down. A tap with a
       little drag in it is still a tap, and nobody should have to hold
       still to work a door. */
    function up() {
      dragging = false;
      if (acted || scrolled) return;
      toggleDoors();
    }

    if (window.PointerEvent) {
      portal.addEventListener('pointerdown', e => {
        down(e.clientX, e.clientY);
        /* Keep the rest of the gesture with this element even if the hand
           leaves the frame part way through. */
        if (portal.setPointerCapture) { try { portal.setPointerCapture(e.pointerId); } catch (_) {} }
      });
      portal.addEventListener('pointermove', e => { if (move(e.clientX, e.clientY)) e.preventDefault(); });
      portal.addEventListener('pointerup', up);
      portal.addEventListener('pointercancel', () => { dragging = false; });
    } else {
      portal.addEventListener('touchstart', e => {
        const t0 = e.touches[0]; down(t0.clientX, t0.clientY);
      }, { passive: true });
      portal.addEventListener('touchmove', e => {
        const t0 = e.touches[0];
        if (move(t0.clientX, t0.clientY) && e.cancelable) e.preventDefault();
      }, { passive: false });
      portal.addEventListener('touchend', up);
      portal.addEventListener('mousedown', e => down(e.clientX, e.clientY));
      portal.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      portal.addEventListener('mouseup', up);
      portal.addEventListener('mouseleave', () => { dragging = false; });
    }

    /* ---------------- sending an object into the room ----------------
       The models are not in the room any more, so one is built only when
       somebody asks for it, inside the card it was asked from. */
    const arcStage = q('#arc-stage');

    /* The placeholder the plate shows while a model is still arriving:
       the same paper as the card, so nothing ever flashes black. */
    const POSTER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
      '<defs><radialGradient id="p" cx="50%" cy="46%" r="62%">' +
      '<stop offset="0" stop-color="#FFFDF6"/><stop offset="1" stop-color="#F0E9D6"/>' +
      '</radialGradient></defs><rect width="800" height="600" fill="url(#p)"/></svg>');
    async function summon(id) {
      const o = OBJ.find(v => v.id === id);
      if (!o || !hosted) { openQR(id, 'host'); return; }
      const ok = await loadMV();
      if (!ok) { openQR(id, 'nodevice'); return; }
      if (openId !== id) return;

      let mv = arcStage.querySelector('model-viewer');
      if (!mv || mv.dataset.id !== id) {
        arcStage.textContent = '';
        mv = document.createElement('model-viewer');
        mv.dataset.id = id;
        mv.setAttribute('src', o.file);
        /* Quick Look will not take a glTF file, so iPhones are handed the
           USDZ build of the same model. */
        if (o.usdz) mv.setAttribute('ios-src', o.usdz);
        /* Paper, held until the first frame of the model is ready, so the
           plate is never empty and never dark. */
        mv.setAttribute('poster', POSTER);
        mv.setAttribute('alt', T[lang].names[id]);
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('auto-rotate', '');
        mv.setAttribute('rotation-per-second', '16deg');
        /* Framed by model-viewer from the object's own bounding box
           unless the shape needs a particular angle. */
        if (o.orbit) mv.setAttribute('camera-orbit', o.orbit);
        if (o.fov)   mv.setAttribute('field-of-view', o.fov);
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('environment-image', 'neutral');
        mv.setAttribute('exposure', '1.15');
        mv.setAttribute('shadow-intensity', '0.6');
        mv.setAttribute('touch-action', 'pan-y');
        mv.setAttribute('ar', '');
        mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('reveal', 'auto');
        arcStage.appendChild(mv);
      }
      /* The stage has to be on screen before the model will fetch itself:
         model-viewer waits for the element to be visible, and a hidden one
         never loads at all. It also means the object appears in the card
         the moment it is asked for, which is the right thing to see
         whether or not the camera opens afterwards. */
      arcStage.hidden = false;
      arcStage.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      await customElements.whenDefined('model-viewer');
      if (!mv.loaded) {
        await Promise.race([
          new Promise(r => mv.addEventListener('load', r, { once: true })),
          new Promise(r => setTimeout(r, 12000)),
        ]);
      }
      if (openId !== id) return;
      if (mv.canActivateAR) { mv.activateAR(); return; }
      /* No camera to put it in. The card says why rather than a bar across
         the middle of the page. */
      openQR(id, 'nodevice');
    }

    /* ---------------- the rice paper card ----------------
       A desk browser has no pass through camera, so the address goes to a
       phone instead. Where there is no address worth scanning, because the
       page was opened straight off the disk, the card says so plainly and
       shows no code at all. */
    const qrWrap = q('#qr-wrap'), qrPlate = q('#qr-plate'), qrCanvas = q('#qr-canvas');
    let qrReturn = null;

    function drawQR(text) {
      const m = makeQR(text);
      if (!m) return false;
      const n = m.length, quiet = 4, s = 4, px = (n + quiet * 2) * s;
      qrCanvas.width = px; qrCanvas.height = px;
      const g = qrCanvas.getContext('2d');
      g.fillStyle = '#FFFDF5'; g.fillRect(0, 0, px, px);
      g.fillStyle = '#2A1F12';
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (m[r][c]) g.fillRect((c + quiet) * s, (r + quiet) * s, s, s);
      return true;
    }

    function openQR(id, why) {
      const t = T[lang];
      const name = t.names[id] || '';
      q('#qr-kicker').textContent = t.qrKicker;
      q('#qr-title').textContent  = name;

      /* A code is only worth drawing when there is an address behind it. */
      const url = hosted ? location.href : '';
      const drew = url ? drawQR(url) : false;
      qrPlate.classList.toggle('is-empty', !drew);
      q('#qr-note').textContent = drew ? t.qrScan
                                       : (why === 'nodevice' ? t.arNoDevice : t.arOff);
      q('#qr-url').textContent = drew ? url : '';

      qrReturn = document.activeElement;
      qrWrap.classList.add('is-in');
      qrWrap.setAttribute('aria-hidden', 'false');
      q('#qr-close').focus({ preventScroll: true });
    }
    function closeQR() {
      qrWrap.classList.remove('is-in');
      qrWrap.setAttribute('aria-hidden', 'true');
      if (qrReturn && qrReturn.isConnected) qrReturn.focus({ preventScroll: true });
      qrReturn = null;
    }
    q('#qr-close').addEventListener('click', closeQR);
    qrWrap.addEventListener('click', e => { if (e.target === qrWrap) closeQR(); });

    /* A phone opens the camera, a desk hands over the address. */
    const PHONE = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
                  (matchMedia('(hover: none) and (pointer: coarse)').matches);

    arcAr.addEventListener('click', () => {
      if (!openId) return;
      if (PHONE) summon(openId);
      else openQR(openId, 'desktop');
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
      if (qrWrap.classList.contains('is-in')) closeQR();
      else if (arcWrap.classList.contains('is-in')) closeArc();
      else if (jrWrap.classList.contains('is-in')) closeJournal();
    });
    addEventListener('resize', () => { sizeDust(); seedMotes(); setPan(pan); layout(); });

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
        sizeDust(); seedMotes(); syncFX();
        requestAnimationFrame(layout);
      } else {
        if (arcWrap.classList.contains('is-in')) closeArc();
        if (jrWrap.classList.contains('is-in')) closeJournal();
        ambience(false);
        s2.classList.remove('is-in');
        jrBtn.classList.remove('is-in');
        nextBtn.classList.remove('is-in');
        hideHint();
        runFX(false);
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
  </script>
