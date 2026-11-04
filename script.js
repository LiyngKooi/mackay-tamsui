/* ==========================================================================
   淡水河邊的神奇馬偕 AR · Scene 1「登陸滬尾」邏輯
   這份檔案的內容已經完整寫進 index.html 的 <script> 裡，
   index.html 可以直接雙擊打開，不需要這個檔案。

   下面這幾個常數（S1_MAP、S1_MASK、S1_JOURNEY、S1_CARD_*）在 index.html
   裡已經被換成圖片本身的 base64 內容，所以整份網頁不依賴任何外部檔案。
   ========================================================================== */

/* ================= Scene 1 · 登陸滬尾 =================
   Two surfaces, and nothing in between. The panorama stays clean: water
   and the moored junk move, one gold light sits on the far beach, and
   that is all. The whole journey lives in a scroll that stays folded at
   the bottom of the screen until you open it. */
(function () {
  const PANO   = S1_MAP;
  const PMASK  = S1_MASK;
  const PANO_A = 2576 / 1274;        /* the panorama's own aspect */
  const HEEL   = 0.012;              /* roll of the one moored junk */

  const JOURNEY = S1_JOURNEY;

  /* The five stations, in the order he travelled them, placed as
     fractions of the scroll. */
  const STN = [
    /* Placed on open paper beside each vignette rather than on top of
       it, so a chop mark never lands on somebody's face. */
    { id: 'canada',   x: 0.132, y: 0.645, fig: S1_CARD_CANADA   },
    { id: 'ship',     x: 0.268, y: 0.555, fig: S1_CARD_SHIP     },
    { id: 'takow',    x: 0.428, y: 0.640, fig: S1_CARD_TAKOW, tones: true },
    { id: 'suitcase', x: 0.755, y: 0.435, fig: S1_CARD_SUITCASE },
    { id: 'guanyin',  x: 0.905, y: 0.420, fig: S1_CARD_TELESCOPE },
  ];

  const T = {
    zh: {
      hint:   '展開下方的航海地圖，從安大略一路走到滬尾',
      btn:    '展開航海地圖',
      count:  (n, t) => n + '/' + t,
      closeAria: '收合手記',
      closeCard: '閉',
      closeCardAria: '關閉卡片',
      next:   '前往下一章 · 仁醫 ▸',
      locked: '先讀完上一站，路線才會往前延伸',
      allDone: '五站都讀完了 · 1872 年 3 月 9 日，他在滬尾上岸',
      tones:  '播放台語八聲',
      stamp:  '已探',
      cards: {
        canada: { k: 'OCTOBER 1871', t: '從安大略出發',
          b: '1871 年 10 月，他離開安大略牛津郡的家，先橫越北美大陸，再從舊金山登船西行。他剛完成神學訓練，自願前往海外宣教。要去哪裡其實還沒定下來，只知道是中國的某個地方。' },
        ship: { k: 'THE CROSSING', t: '海龍號與那條航線',
          b: '從舊金山出發，橫越太平洋，經橫濱、香港，1871 年 12 月 29 日在打狗上岸。北上淡水的最後一段，他搭的是沿西海岸跑的汽船海龍號。地圖上那條虛線畫的就是這段路。' },
        takow: { k: 'EIGHT TONES', t: '先學會說話',
          b: '他在南部待了兩個多月，沒有急著傳教，先學台語。方法很土：走到田邊跟人講話，聽到一個音就抄下來，自己整理出八個聲調的對照表。對他來說，學會這個語言是後面每一件事的前提。' },
        suitcase: { k: 'ONE CASE', t: '一只皮箱的全部家當',
          b: '上岸那天，他的行李裡只有一本聖經、一把拔牙鉗，和一疊自己抄的台語八聲筆記。他沒有醫學學位，拔牙是在加拿大學來的實用技術，後來成了他和在地人建立信任最快的方式。' },
        guanyin: { k: '9 MARCH 1872', t: '觀音山與落日誓言',
          b: '1872 年 3 月 9 日下午，他在滬尾上岸，第一次看見淡水河對岸的觀音山。那年他還沒滿二十八歲，不會說北部的腔，也沒有人在這裡等他。他在日記裡寫下：「噢！值得讚美的上帝啊！這是我的宣教區。」往後二十九年，他再也沒有換過地方。' },
      },
    },
    en: {
      hint:   'Unroll the map below, from Ontario all the way to Hobe',
      btn:    'Unroll the Voyage Map',
      count:  (n, t) => n + '/' + t,
      closeAria: 'Fold the scroll',
      closeCard: '閉',
      closeCardAria: 'Close card',
      next:   'Next chapter · Healing ▸',
      locked: 'Read the station before it, and the route carries on',
      allDone: 'All five read · he came ashore at Hobe on 9 March 1872',
      tones:  'Play the eight tones',
      stamp:  'READ',
      cards: {
        canada: { k: 'OCTOBER 1871', t: 'Leaving Ontario',
          b: 'In October 1871 he left the family farm in Oxford County, Ontario, crossed North America, and boarded a ship west out of San Francisco. He had just finished his theological training and had volunteered for the foreign field. Where he was going was still unsettled. He knew only that it was somewhere in China.' },
        ship: { k: 'THE CROSSING', t: 'The Hai Loong, and that Dotted Line',
          b: 'From San Francisco he crossed the Pacific, called at Yokohama and Hong Kong, and landed at Takow on 29 December 1871. For the last leg north to Tamsui he took the Hai Loong, a steamer that worked the west coast. The dotted line on this map is that passage.' },
        takow: { k: 'EIGHT TONES', t: 'Learning to Speak First',
          b: 'He spent a little over two months in the south and did not hurry to preach. He learned Taiwanese first, by a plain method: he walked out to the paddy fields, talked to whoever was there, wrote down every sound he heard, and built his own table of the eight tones. For him the language came before everything else.' },
        suitcase: { k: 'ONE CASE', t: 'Everything He Owned',
          b: 'On the day he landed his luggage held a Bible, a pair of tooth forceps, and a sheaf of his own notes on the eight tones. He had no medical degree. Pulling teeth was a practical skill he picked up in Canada, and it became the fastest way he had of earning trust.' },
        guanyin: { k: '9 MARCH 1872', t: 'Guanyin Mountain, and a Vow at Sunset',
          b: 'On the afternoon of 9 March 1872 he came ashore at Hobe and saw Guanyin Mountain across the Tamsui River for the first time. He was not yet twenty eight. He could not speak the northern accent, and nobody was waiting for him. In his diary he wrote: "Oh! Blessed Lord God, this is my mission field." Over the next twenty nine years he never moved on.' },
      },
    },
  };

  const q  = s => document.querySelector(s);
  const s1       = q('#s1');
  const hint     = q('#s1-hint');
  const btn      = q('#scroll-btn');
  const btnLabel = q('#scroll-btn-label');
  const countEl  = q('#unlock-count');
  const wrap     = q('#scroll-wrap');
  const pane     = q('#scroll-pane');
  const track    = q('#scroll-track');
  const mapImg   = q('#scroll-map');
  const trail    = q('#trail');
  const closeBtn = q('#scroll-close');
  const nextBtn  = q('#next-ch');
  const fwrap    = q('#flap-wrap');
  const fclose   = q('#flap-close');
  const ffig     = q('#flap-fig');
  const fkick    = q('#flap-kicker');
  const ftitle   = q('#flap-title');
  const fbody    = q('#flap-body');
  const faudio   = q('#flap-audio');
  const falabel  = q('#flap-audio-label');

  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = 'zh';
  let active = false;        /* is chapter 1 on screen */
  let read = 0;              /* how many stations are read, in order */
  let openIdx = -1;          /* which card is open */

  /* ---------------- framing the panorama ----------------
     Nothing is drawn on top of the painting any more, so `pan` only
     decides what is in frame. The shader cover fits the image and then
     slides it sideways by this amount; the arithmetic is repeated here
     so the drag and the clamp agree with what is rendered. */
  let pan = 0;

  function panRange() {
    const s = (innerWidth / innerHeight) / PANO_A;
    return s >= 1 ? 0 : Math.max(0, 0.5 - s / 2);
  }

  function setPan(v) {
    const m = panRange();
    pan = Math.max(-m, Math.min(m, v));
    if (window.__set) window.__set('pan', pan);
  }

  /* A wide screen shows most of the estuary at once, so it opens centred.
     A phone sees about a fifth of the width, so it opens on the moored
     junk at x 0.37, which is the part of the painting that moves. */
  function homePan() {
    const s = Math.min((innerWidth / innerHeight) / PANO_A, 1);
    return 0.13 * (1 - s);
  }

  /* ---------------- drag the panorama sideways ---------------- */
  (function () {
    let id = null, x0 = 0, p0 = 0, moved = 0;
    s1.addEventListener('pointerdown', e => {
      id = e.pointerId; x0 = e.clientX; p0 = pan; moved = 0;
      s1.setPointerCapture(id);
    });
    s1.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x0;
      moved = Math.max(moved, Math.abs(dx));
      const s = (innerWidth / innerHeight) / PANO_A;
      setPan(p0 + (dx / innerWidth) * Math.min(s, 1));
    });
    const up = e => {
      if (e.pointerId !== id) return;
      id = null;
      if (moved > 8) hideHint();
    };
    s1.addEventListener('pointerup', up);
    s1.addEventListener('pointercancel', up);
  })();

  /* ---------------- sound ----------------
     Short, synthesised, and only ever in answer to a tap, so nothing
     plays on its own. It borrows the ambience context when the user has
     already opened one, rather than stacking a second. */
  let sctx = null;
  function ctx() {
    if (typeof actx !== 'undefined' && actx) return actx;
    if (!sctx) sctx = new (window.AudioContext || window.webkitAudioContext)();
    if (sctx.state === 'suspended') sctx.resume();
    return sctx;
  }

  function chime() {
    const a = ctx(), t = a.currentTime;
    /* A small bell: fundamental plus a fifth, both decaying fast. */
    [[784, 0.09, 0], [1176, 0.05, 0.015], [1568, 0.03, 0.03]].forEach(([f, g, d]) => {
      const o = a.createOscillator(), v = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      v.gain.setValueAtTime(0, t + d);
      v.gain.linearRampToValueAtTime(g, t + d + 0.012);
      v.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.15);
      o.connect(v).connect(a.destination);
      o.start(t + d); o.stop(t + d + 1.2);
    });
  }

  /* The eight tones, as contours rather than as a recording. Taiwanese
     tone 6 merged into tone 2 in most accents, so it is given the same
     shape here. Start, end and length are in semitone offsets from A3. */
  const TONES = [
    [ 7,  7, 0.42],  /* 1 high level   */
    [ 7,  0, 0.40],  /* 2 high falling */
    [-2, -7, 0.44],  /* 3 low falling  */
    [ 0,  0, 0.17],  /* 4 low stopped  */
    [-2,  6, 0.46],  /* 5 rising       */
    [ 7,  0, 0.40],  /* 6 = 2          */
    [ 2,  2, 0.44],  /* 7 mid level    */
    [ 7,  7, 0.17],  /* 8 high stopped */
  ];
  let tonesRunning = false;
  function playTones() {
    if (tonesRunning) return;
    tonesRunning = true;
    const a = ctx();
    let t = a.currentTime + 0.05;
    TONES.forEach(([s, e, d]) => {
      const o = a.createOscillator(), v = a.createGain(), lp = a.createBiquadFilter();
      o.type = 'triangle';
      lp.type = 'lowpass'; lp.frequency.value = 1700;
      const f0 = 220 * Math.pow(2, s / 12), f1 = 220 * Math.pow(2, e / 12);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.linearRampToValueAtTime(f1, t + d);
      v.gain.setValueAtTime(0, t);
      v.gain.linearRampToValueAtTime(0.11, t + 0.03);
      v.gain.setValueAtTime(0.11, t + d - 0.05);
      v.gain.linearRampToValueAtTime(0, t + d);
      o.connect(lp).connect(v).connect(a.destination);
      o.start(t); o.stop(t + d + 0.02);
      t += d + 0.13;
    });
    setTimeout(() => { tonesRunning = false; }, (t - a.currentTime) * 1000);
  }

  /* ---------------- the scroll ---------------- */
  mapImg.src = JOURNEY;

  STN.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'stn';
    b.dataset.i = i;
    b.innerHTML = '<span class="ring"></span><span class="star">✦</span>' +
                  '<span class="stamp"></span>';
    b.addEventListener('click', () => tapStation(i));
    track.appendChild(b);
    s.el = b;
    s.stamp = b.querySelector('.stamp');
  });

  /* Offsets rather than bounding rects: the pane carries a transform
     while the scroll is folded, which would scale every rect by 0.94 and
     leave every marker 6% out of place. */
  function layout() {
    const w = mapImg.offsetWidth, h = mapImg.offsetHeight;
    if (!w || !h) return;
    const ox = mapImg.offsetLeft, oy = mapImg.offsetTop;
    STN.forEach(s => {
      s.px = ox + s.x * w;
      s.py = oy + s.y * h;
      s.el.style.left = s.px + 'px';
      s.el.style.top  = s.py + 'px';
    });
    trail.setAttribute('viewBox', '0 0 ' + track.clientWidth + ' ' + track.clientHeight);
    trail.setAttribute('preserveAspectRatio', 'none');
    drawTrail();
  }

  /* One dashed leg per station already read, bowed off the straight line
     so it reads as a hand drawn route rather than a ruler. */
  function drawTrail() {
    trail.textContent = '';
    for (let i = 0; i < read && i < STN.length - 1; i++) {
      const a = STN[i], b = STN[i + 1];
      const dx = b.px - a.px, dy = b.py - a.py;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const gap = 24;                       /* clear of both markers */
      const x1 = a.px + ux * gap, y1 = a.py + uy * gap;
      const x2 = b.px - ux * gap, y2 = b.py - uy * gap;
      const bow = (i % 2 ? -1 : 1) * len * 0.16;
      const cx = (x1 + x2) / 2 - uy * bow, cy = (y1 + y2) / 2 + ux * bow;
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', 'M' + x1 + ' ' + y1 + ' Q' + cx + ' ' + cy + ' ' + x2 + ' ' + y2);
      p.classList.add('draw');
      trail.appendChild(p);
    }
  }

  function paint() {
    const t = T[lang];
    STN.forEach((s, i) => {
      s.el.classList.toggle('done', i < read);
      s.el.classList.toggle('live', i === read);
      s.stamp.textContent = t.stamp;
      const c = t.cards[s.id];
      /* Not disabled: a station you have not reached is still a live
         control, it just answers with the reason instead of a card. */
      s.el.setAttribute('aria-label',
        (i < read ? t.stamp + ' · ' : i > read ? '🔒 ' : '') + c.t);
    });
    countEl.textContent = t.count(read, STN.length);
    /* The seal reads "0/5" on the paper; a screen reader gets the sentence. */
    btn.setAttribute('aria-label', t.btn + ' · ' + t.count(read, STN.length));
    nextBtn.classList.toggle('is-in', active && read >= STN.length);
    drawTrail();
  }

  function tapStation(i) {
    if (i > read) { showHint(T[lang].locked); return; }
    openCard(i);
  }

  let hintTimer = 0;
  function showHint(msg) {
    hint.textContent = msg;
    hint.classList.add('is-in');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('is-in'), 4200);
  }
  function hideHint() { clearTimeout(hintTimer); hint.classList.remove('is-in'); }

  /* ---------------- open and fold ---------------- */
  function openScroll(focus) {
    wrap.classList.add('is-in');
    wrap.setAttribute('aria-hidden', 'false');
    document.body.classList.add('scroll-open');
    btn.classList.remove('nudge');
    hideHint();
    window.__stagePaused = true;
    requestAnimationFrame(() => {
      layout();
      const i = (focus == null) ? Math.min(read, STN.length - 1) : focus;
      centreOn(i, !reduce);
      STN[i].el.focus({ preventScroll: true });
    });
  }

  function centreOn(i, smooth) {
    const s = STN[i];
    if (s.px == null) return;
    const left = Math.max(0, s.px - pane.clientWidth / 2);
    if (smooth && pane.scrollTo) pane.scrollTo({ left: left, behavior: 'smooth' });
    else pane.scrollLeft = left;
  }

  function foldScroll() {
    wrap.classList.remove('is-in');
    wrap.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('scroll-open');
    window.__stagePaused = false;
    if (window.__setTime) window.__setTime(performance.now() / 1000);
    if (active) btn.focus({ preventScroll: true });
  }

  /* ---------------- the card ---------------- */
  function openCard(i) {
    const t = T[lang], s = STN[i], c = t.cards[s.id];
    openIdx = i;
    ffig.src = s.fig;
    ffig.alt = c.t;
    fkick.textContent = c.k;
    ftitle.textContent = c.t;
    fbody.textContent = c.b;
    /* Only one station has a sound, so the rule above the button goes
       with it rather than leaving a line under nothing. */
    faudio.style.display = s.tones ? '' : 'none';
    q('#flap-rule2').style.display = s.tones ? '' : 'none';
    falabel.textContent = t.tones;
    q('#flap-scroll').scrollTop = 0;
    fwrap.classList.add('is-in');
    fwrap.setAttribute('aria-hidden', 'false');
    fclose.focus({ preventScroll: true });
  }

  function closeCard() {
    const i = openIdx;
    openIdx = -1;
    fwrap.classList.remove('is-in');
    fwrap.setAttribute('aria-hidden', 'true');
    if (i < 0) return;

    /* Reading the station you were up to is what moves the route on.
       Re reading an older one changes nothing. */
    if (i === read) {
      read = i + 1;
      paint();
      STN[i].el.classList.add('just');
      setTimeout(() => STN[i].el.classList.remove('just'), 700);
      chime();
      if (read >= STN.length) showHint(T[lang].allDone);
      if (read < STN.length) centreOn(read, !reduce);
      if (!wrap.classList.contains('is-in')) {
        btn.classList.remove('nudge');
        void btn.offsetWidth;
        btn.classList.add('nudge');
      }
    }
    if (wrap.classList.contains('is-in')) {
      (STN[Math.min(read, STN.length - 1)].el || closeBtn).focus({ preventScroll: true });
    }
  }

  /* ---------------- drag the scroll ---------------- */
  (function () {
    let id = null, x0 = 0, l0 = 0, moved = 0;
    pane.addEventListener('pointerdown', e => {
      id = e.pointerId; x0 = e.clientX; l0 = pane.scrollLeft; moved = 0;
      pane.classList.add('dragging');
    });
    pane.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - x0;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) pane.scrollLeft = l0 - dx;
    });
    const up = e => {
      if (e.pointerId !== id) return;
      id = null;
      pane.classList.remove('dragging');
      /* A drag that ends on a marker should not also open it. */
      if (moved > 8) { const k = e.target.closest('.stn'); if (k) k.blur(); }
    };
    pane.addEventListener('pointerup', up);
    pane.addEventListener('pointercancel', up);
    pane.addEventListener('click', e => { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  })();

  /* ---------------- wiring ---------------- */
  btn.addEventListener('click', () => openScroll());
  closeBtn.addEventListener('click', foldScroll);
  fclose.addEventListener('click', closeCard);
  faudio.addEventListener('click', playTones);
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target === pane) foldScroll(); });
  fwrap.addEventListener('click', e => { if (e.target === fwrap) closeCard(); });
  nextBtn.addEventListener('click', () => goToScene(2));

  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (fwrap.classList.contains('is-in')) closeCard();
    else if (wrap.classList.contains('is-in')) foldScroll();
  });

  const enter = q('#enter');
  if (enter) enter.addEventListener('click', () => goToScene(1));

  addEventListener('resize', () => {
    setPan(pan);
    layout();
  });
  mapImg.addEventListener('load', layout);

  /* ---------------- chapter in, chapter out ---------------- */
  document.addEventListener('scenechange', e => {
    const on = e.detail.id === 1;
    if (on === active) return;
    active = on;
    if (on) {
      if (window.__setScene) window.__setScene(PANO, PMASK, PANO_A);
      if (window.__set) window.__set('heel', HEEL);
      setPan(homePan());
      s1.classList.add('is-in');
      btn.classList.add('is-in');
      showHint(T[lang].hint);
      requestAnimationFrame(layout);
    } else {
      if (fwrap.classList.contains('is-in')) closeCard();
      if (wrap.classList.contains('is-in')) foldScroll();
      s1.classList.remove('is-in');
      btn.classList.remove('is-in');
      hideHint();
      if (window.__set) { window.__set('heel', 0); window.__set('pan', 0); }
      if (window.__resetScene) window.__resetScene();
      pan = 0;
    }
    paint();
  });

  document.addEventListener('langchange', e => {
    lang = e.detail.lang;
    const t = T[lang];
    btnLabel.textContent = t.btn;
    closeBtn.setAttribute('aria-label', t.closeAria);
    nextBtn.textContent  = t.next;
    q('#flap-close-glyph').textContent = t.closeCard;
    fclose.setAttribute('aria-label', t.closeCardAria);
    falabel.textContent = t.tones;
    if (openIdx >= 0) openCard(openIdx);
    paint();
  });

  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: 'zh' } }));
  paint();
})();
