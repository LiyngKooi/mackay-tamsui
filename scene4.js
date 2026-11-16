  /* ====================== Scene 4 · 永恆（長眠淡水） ======================
     The last chapter is an evening. The sun is already on the water, the
     lamp beside the book is the warmest thing left in the picture, and
     everything that moves here moves slowly.

     Almost all of it moves inside the painting rather than on top of it.
     The mask carries three channels: red says where the estuary is, so the
     shader can shift the reflection and lay its glitter on the sun path
     and lift the moored boats with it; green says how high each pixel sits
     on the water; blue says how much a pixel belongs to something a breeze
     can move, which is the palm crowns and the bushes and nothing else.
     No particle drawn over water can displace a reflection, and none drawn
     over a frond can bend it.

     What is left for the canvas is the lamp, what comes off it, and the
     leaves. Everything on it is placed in the painting's own pixels and
     converted at the last moment, so a drag that turns the view carries
     the whole scene with it. */
  (function () {
    'use strict';

    const PANO4 = 's4/pano4.webp';    /* baked into index.html as a data URI */
    const MASK4 = 's4/mask4.png';     /* baked into index.html as a data URI */
    const CATB  = 's4/cat.webp';
    const CATH  = 's4/cat_head.webp';

    const IW = 2576, IH = 1274, PANO_A = IW / IH;

    const WIND_CALM = 0.00820;        /* how far a frond tip travels, in uv */
    const WIND_GUST = 0.00760;        /* and what a press adds on top       */

    /* The full look, not only the parts that differ: the chapter before
       this one leaves the renderer wherever it had it. Warm, because the
       glitter here is a sunset and not a noon sun; fine and tight, because
       the estuary is far away and its sparkle should be small. */
    const LOOK = { warm: 0.55, disp: 2.60, swell: 0.0125, glint: 0.185,
                   /* Coarse and tight rather than fine and soft. The first
                      build had the glitter grain finer than the pixels the
                      estuary is drawn on, which does not read as sparkle:
                      it aliases, and the whole river came out in long hard
                      diagonal stripes. */
                   gf: 2.20, gsharp: 3.80, heel: 0.0, wind: WIND_CALM,
                   cloud: 0.0, cdrift: 0.0 };

    /* ---------------- where things are, in the painting's own pixels ----------------
       Read off the artwork rather than taken on trust: the lamp sits a
       little lower than a round number would put it and the cat a little
       left, and a glow half on its object looks like a mistake. */
    const LAMP = { x: 684, y: 999 };          /* the flame itself          */
    const OBEL = { x: 277, y: 440 };          /* middle of the shaft       */
    const CAT  = { x: 178, y: 1021 };         /* the cat on the step       */
    const CATBOX  = { x: 150, y: 972, w: 70,  h: 104 };   /* his whole cut */
    const HEADBOX = { x: 145, y: 967, w: 54,  h: 58  };   /* and his head  */
    const CATBUSH = { x0: 150, y0: 940, x1: 440, y1: 1110 };  /* beside him */

    const HOT = {
      lantern: { x0: 620, y0: 945, x1: 790, y1: 1105 },
      obelisk: { x0: 225, y0: 265, x1: 335, y1: 640 },
      cat:     { x0: 148, y0: 968, x1: 222, y1: 1080 },
    };

    /* Leaves come off the lower canopy rather than the crowns. Higher up
       they would spend their first seconds against a sky that is nearly
       white, and light added to nearly white is nothing at all. */
    const TREES = [
      { x0: 77,   y0: 300, x1: 850,  y1: 575, dir:  1 },
      { x0: 1983, y0: 350, x1: 2550, y1: 650, dir: -1 },
    ];

    const T4 = {
      zh: {
        hint: '拖曳環顧河岸　輕觸提燈、石碑與小貓',
        obelisk: { k: '2 JUNE 1901', t: '他留在了這裡',
                   b: '1901 年 6 月 2 日，他因喉癌病逝於淡水的住所。遺體葬在今天淡江中學的校園裡，妻子張聰明與子女後來也葬在他身旁。從 1872 年 3 月 9 日在滬尾上岸算起，他在這裡待了二十九年，中間只為述職短暫回過加拿大兩次。',
                   s: '' },
        next: '前往下一章 · 尋蹤 ▸',
        close: '閉', closeAria: '關閉卡片',
        aria: { lantern: '煤油提燈與翻開的書本', obelisk: '馬偕紀念碑', cat: '石階上的小花貓' },
      },
      en: {
        hint: 'Drag to look along the bank. Touch the lamp, the monument, the cat.',
        obelisk: { k: '2 JUNE 1901', t: 'He stayed',
                   b: 'He died of throat cancer at his house in Tamsui on 2 June 1901. He is buried on the grounds of what is now Tamkang High School, and his wife Tiu Chhang-mia and their children were later laid beside him. Counting from the day he landed, 9 March 1872, he had been here twenty-nine years, broken only by two short furloughs in Canada.',
                   s: '' },
        next: 'Next chapter · Traces ▸',
        close: 'x', closeAria: 'Close card',
        aria: { lantern: 'The oil lamp and the open book', obelisk: "Mackay's monument",
                cat: 'The cat on the stone step' },
      },
    };

    const s4     = document.getElementById('s4');
    const cv     = document.getElementById('eternity-fx-canvas');
    const hintEl = document.getElementById('s4-hint');
    const catEl  = document.getElementById('s4-cat');
    const card   = document.getElementById('s4-card');
    if (!s4 || !cv || !card || !catEl) return;

    const catBody = catEl.querySelector('.s4-cat-body');
    const catNeck = catEl.querySelector('.s4-cat-neck');
    const catHead = catEl.querySelector('.s4-cat-head');
    const cardX = document.getElementById('s4-card-x');
    const cardK = document.getElementById('s4-card-k');
    const cardT = document.getElementById('s4-card-t');
    const cardB = document.getElementById('s4-card-b');
    const cardS = document.getElementById('s4-card-s');
    const nextB = document.getElementById('s4-next');
    const hotEl = {
      lantern: document.getElementById('s4-h-lantern'),
      obelisk: document.getElementById('s4-h-obelisk'),
      cat:     document.getElementById('s4-h-cat'),
    };

    const ctx = cv.getContext('2d', { alpha: true });
    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[(Math.random() * a.length) | 0];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    catBody.src = CATB;
    catHead.src = CATH;

    let lang4 = (document.documentElement.lang || 'zh').indexOf('en') === 0 ? 'en' : 'zh';

    /* ---------------- turning the view ---------------- */
    const OPEN_AT = 0.182;            /* the point of the painting it opens on */
    let pan = 0;
    function panRange() {
      const s = (innerWidth / innerHeight) / PANO_A;
      return s >= 1 ? 0 : Math.max(0, 0.5 - s / 2);
    }
    function setPan(v) {
      const m = panRange();
      pan = Math.max(-m, Math.min(m, v));
      if (window.__set) window.__set('pan', pan);
      mapView();
      placeChrome();
    }

    /* ---------------- the painting's pixels, on this screen ----------------
       The shader fits the painting to the viewport the short way round and
       then slides it by `pan`, which comes to this: the point
       (0.5 - pan, 0.5) of the image is always in the middle of the screen,
       and one image pixel is always `k` screen pixels, the same in both
       directions. Everything else here is that one line, forwards for
       drawing and backwards for a press. */
    let k = 1, ox = 0, oy = 0, W = 0, H = 0, dpr = 1;

    function mapView() {
      k  = Math.max(innerWidth / IW, innerHeight / IH);
      ox = innerWidth  / 2 - (0.5 - pan) * IW * k;
      oy = innerHeight / 2 - 0.5 * IH * k;
    }
    const SX = px => ox + px * k;
    const SY = py => oy + py * k;

    function sizeCanvas() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width  = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mapView();
    }

    /* ---------------- what the light is made of ----------------
       Each shape is drawn once into a canvas of its own and stamped from
       there. Building a gradient per particle per frame is what makes a
       layer like this cost something; a drawImage of a cached sprite is
       close to free. */
    function glowSprite(rgb, core) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0.00, 'rgba(' + rgb + ',1)');
      rg.addColorStop(core, 'rgba(' + rgb + ',0.74)');
      rg.addColorStop(0.62, 'rgba(' + rgb + ',0.40)');
      rg.addColorStop(0.82, 'rgba(' + rgb + ',0.13)');
      rg.addColorStop(1.00, 'rgba(' + rgb + ',0)');
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
      return c;
    }

    /* A leaf coming off a tree at sunset is lit from behind, so it carries
       the light rather than blocking it. Drawn warm for that reason, and
       because this layer may only ever add: a true silhouette would have
       to take light out, and taking light out of a painting reads as
       dirt. */
    function leafSprite() {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const lg = g.createLinearGradient(32, 6, 32, 58);
      lg.addColorStop(0.00, 'rgba(255,228,160,0.96)');
      lg.addColorStop(0.45, 'rgba(236,176,86,0.88)');
      lg.addColorStop(1.00, 'rgba(176,110,48,0.70)');
      g.fillStyle = lg;
      g.beginPath();
      g.moveTo(32, 5);
      g.bezierCurveTo(50, 20, 50, 44, 32, 59);
      g.bezierCurveTo(14, 44, 14, 20, 32, 5);
      g.fill();
      g.strokeStyle = 'rgba(255,240,200,0.42)';
      g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(32, 8); g.lineTo(32, 56); g.stroke();
      return c;
    }

    const EMBER = glowSprite('255,196,104', 0.34);   /* the lamp's own colour */
    const AMBER = glowSprite('255,209,102', 0.34);
    const CREAM = glowSprite('255,246,226', 0.30);
    const LAMPG = glowSprite('255,180,78',  0.22);   /* broader, for the halo */
    const LEAF  = leafSprite();

    /* =============================================================
       the breeze
       ============================================================= */
    let gust = 0;
    function pushWind() {
      if (window.__set) window.__set('wind', WIND_CALM + WIND_GUST * gust);
    }

    /* =============================================================
       the lamp
       ============================================================= */
    let flare = 0;                       /* a press brightens it, then it settles */

    function drawLamp(t) {
      /* Two breaths on unrelated periods: a slow one that is the lamp
         being watched from across a garden, and a quick shallow one that
         is the flame itself. */
      const slow = 0.5 + 0.5 * Math.sin(t * 0.62);
      const fast = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 8.9) * 0.5;
      const b = 0.62 + 0.26 * slow + 0.07 * fast;

      const x = SX(LAMP.x), y = SY(LAMP.y);
      const R = (96 + 70 * flare) * k;
      ctx.globalAlpha = Math.min(1, (0.30 * b + 0.46 * flare));
      ctx.drawImage(LAMPG, x - R, y - R, R * 2, R * 2);
      const r = (34 + 16 * flare) * k;
      ctx.globalAlpha = Math.min(1, 0.42 * b + 0.42 * flare);
      ctx.drawImage(EMBER, x - r, y - r, r * 2, r * 2);
    }

    /* ---------------- what comes off it ----------------
       Specks of lit ash going up and out. Anchored to a flame rather than
       floating free, which is the whole difference between a spark and a
       dot put on a picture. */
    const embers = [];
    const EMBER_MAX = 30;
    let embTimer = 0;

    function castEmber(strong) {
      if (embers.length >= EMBER_MAX) return;
      embers.push({
        x: LAMP.x + rand(-13, 13), y: LAMP.y + rand(-16, 6),
        vx: rand(-9, 13) * (strong ? 2.6 : 1),
        vy: -rand(14, 34) * (strong ? 2.2 : 1),
        r: rand(1.3, 3.4),
        img: Math.random() < 0.26 ? CREAM : EMBER,
        ph: rand(0, TAU), sw: rand(0.5, 1.5), amp: rand(5, 20),
        t: 0, life: rand(2.6, 5.0), a: rand(0.55, 1),
      });
    }

    function drawEmbers(dt, t) {
      embTimer -= dt;
      if (embTimer <= 0) { castEmber(false); embTimer = rand(0.26, 0.58); }
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.t += dt;
        if (p.t >= p.life) { embers.splice(i, 1); continue; }
        /* The air slows what was thrown and then only the climb is left,
           which is how a spark off a wick actually goes. */
        const d = Math.pow(0.46, dt);
        p.vx *= d; p.vy *= d;
        p.vy -= 9 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;

        const u = p.t / p.life;
        const fade = u < 0.12 ? u / 0.12 : Math.max(0, (1 - u) / 0.88);
        const tw = 0.62 + 0.38 * Math.sin(t * 3.1 + p.ph);
        ctx.globalAlpha = p.a * fade * tw * 0.9;
        const R = p.r * k * 2.4;
        const x = SX(p.x + Math.sin(t * p.sw + p.ph) * p.amp), y = SY(p.y);
        ctx.drawImage(p.img, x - R, y - R, R * 2, R * 2);
      }
    }

    /* ---------------- leaves ---------------- */
    const leaves = [];
    let nextLeaf = rand(2.0, 4.5);

    function castLeaves(zone, n, dir) {
      /* Only from the part of that stand the screen is actually showing.
         A leaf coming off a tree forty degrees round the panorama is a
         leaf nobody sees. */
      const vx0 = (-ox) / k, vx1 = (innerWidth - ox) / k;
      const x0 = Math.max(zone.x0, vx0 + 30), x1 = Math.min(zone.x1, vx1 - 30);
      if (x1 - x0 < 50) return;
      for (let i = 0; i < n; i++) {
        leaves.push({
          x: rand(x0, x1), y: rand(zone.y0, zone.y1),
          vx: dir * rand(20, 52), vy: rand(46, 78),
          r: rand(8.5, 15),
          spin: rand(1.4, 3.2) * (Math.random() < 0.5 ? -1 : 1),
          turn: rand(0, TAU), tw: rand(1.5, 3.0),
          rot: rand(0, TAU),
          ph: rand(0, TAU), sw: rand(0.5, 1.1), amp: rand(14, 44),
          t: 0, life: rand(15, 23), a: rand(0.50, 0.86),
          delay: i * rand(0.15, 0.7),
        });
      }
    }

    function drawLeaves(dt, t) {
      nextLeaf -= dt;
      if (nextLeaf <= 0) {
        const tr = pick(TREES);
        castLeaves(tr, 3 + ((Math.random() * 3) | 0), tr.dir);
        nextLeaf = rand(5, 9);
      }
      for (let i = leaves.length - 1; i >= 0; i--) {
        const p = leaves[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.t += dt;
        p.turn += p.tw * dt;
        p.rot += p.spin * dt * 0.22;
        p.x += p.vx * (0.6 + 0.4 * gust) * dt;
        p.y += p.vy * dt;
        if (p.t >= p.life || p.y > 1262) { leaves.splice(i, 1); continue; }

        const u = p.t / p.life;
        const fade = u < 0.06 ? u / 0.06 : u > 0.82 ? Math.max(0, (1 - u) / 0.18) : 1;
        /* The width follows the cosine of its own turn, so each leaf goes
           edge on and flat again as it falls rather than sliding down the
           screen like a sticker. */
        const flat = Math.abs(Math.cos(p.turn));
        ctx.globalAlpha = p.a * fade * (0.34 + 0.66 * flat);
        const hh = p.r * k * 1.55, ww = p.r * k * 0.74 * (0.22 + 0.78 * flat);
        ctx.save();
        ctx.translate(SX(p.x + Math.sin(t * p.sw + p.ph) * p.amp), SY(p.y));
        ctx.rotate(p.rot + Math.sin(p.turn) * 0.30);
        ctx.drawImage(LEAF, -ww, -hh, ww * 2, hh * 2);
        ctx.restore();
      }
    }

    /* ---------------- the light on the monument ----------------
       Only after a press. A tall soft column rather than a disc, because
       what it is lighting is tall. */
    let holy = 0;
    function drawHoly(t) {
      if (holy <= 0.002) return;
      const x = SX(OBEL.x), y = SY(OBEL.y);
      const w = 150 * k, h = 300 * k;
      ctx.globalAlpha = holy * (0.26 + 0.07 * Math.sin(t * 1.5));
      ctx.drawImage(CREAM, x - w, y - h, w * 2, h * 2);
      ctx.globalAlpha = holy * 0.22;
      const w2 = 76 * k, h2 = 190 * k;
      ctx.drawImage(AMBER, x - w2, y - h2, w2 * 2, h2 * 2);
    }

    /* ---------------- rings ---------------- */
    const rings = [];
    const RING_MAX = 3;
    const RING = {
      warm:  { c: '255,206,132', a: 0.66, r: 1.00, w: 4.0, life: 1.05 },
      soft:  { c: '255,236,206', a: 0.42, r: 0.72, w: 4.0, life: 1.05 },
      faint: { c: '255,214,146', a: 0.19, r: 0.56, w: 2.4, life: 1.45 },
    };
    function ring(px, py, kind) {
      if (rings.length >= RING_MAX) return;
      const s = RING[kind] || RING.soft;
      rings.push({ x: px, y: py, t: 0, life: s.life, s: s });
    }
    function drawRings(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i];
        g.t += dt;
        if (g.t >= g.life) { rings.splice(i, 1); continue; }
        const u = g.t / g.life;
        const e = 1 - Math.pow(1 - u, 3);          /* out fast, easing to a stop */
        const R = (8 + e * 128) * k * g.s.r;
        ctx.strokeStyle = 'rgba(' + g.s.c + ',1)';
        ctx.globalAlpha = (1 - u) * (1 - u) * g.s.a;
        ctx.lineWidth = Math.max(0.7, g.s.w * (1 - u) * k * 1.4);
        ctx.beginPath(); ctx.arc(SX(g.x), SY(g.y), R, 0, TAU); ctx.stroke();
        ctx.globalAlpha = (1 - u) * (1 - u) * g.s.a * 0.4;
        ctx.lineWidth = Math.max(0.5, g.s.w * 0.45 * (1 - u) * k * 1.4);
        ctx.beginPath(); ctx.arc(SX(g.x), SY(g.y), R * 0.70, 0, TAU); ctx.stroke();
      }
    }

    /* ---------------- the marks that say a thing can be touched ----------------
       Light, not a ring. A circle drawn round an object in a painting
       reads as a sticker put on top of it; a glow that breathes behind the
       object reads as the evening finding it. Both stop once their card
       has been opened, so the chapter grows quieter the more of it you
       have seen. */
    const seen = { obelisk: false, cat: false };

    function drawMarks(t) {
      if (!seen.obelisk) {
        /* The shaft is pale stone and added light does almost nothing to
           pale stone. What this lifts is the dark planting behind it,
           which haloes the monument and comes to the same thing. */
        const s = 0.5 + 0.5 * Math.sin(t * 0.85);
        const w = 88 * k, h = 205 * k;
        ctx.globalAlpha = 0.07 + 0.10 * s;
        ctx.drawImage(CREAM, SX(OBEL.x) - w, SY(OBEL.y + 40) - h, w * 2, h * 2);
      }
      if (!seen.cat) {
        const s = 0.5 + 0.5 * Math.sin(t * 0.85 + 2.1);
        const r = 56 * k;
        ctx.globalAlpha = 0.10 + 0.12 * s;
        ctx.drawImage(AMBER, SX(CAT.x) - r, SY(CAT.y + 24) - r * 0.70, r * 2, r * 1.40);
      }
    }

    /* =============================================================
       sound, which the mute button in the corner owns
       ============================================================= */
    function ac() {
      /* If the person has never switched the sound on, actx does not exist
         yet and nothing here makes one: a chapter is not allowed to start
         the audio by itself. */
      if (typeof audioOn === 'undefined' || !audioOn) return null;
      if (typeof actx === 'undefined' || !actx || actx.state !== 'running') return null;
      return actx;
    }

    function meow() {
      const a = ac();
      if (!a) return;
      const t0 = a.currentTime + 0.01, dur = 0.60;

      /* The voice: two saws a few cents apart, so it has a body instead of
         the thin buzz one of them gives. */
      const mix = a.createGain(); mix.gain.value = 0.5;
      const osc = [];
      [-7, 6].forEach(cents => {
        const o = a.createOscillator();
        o.type = 'sawtooth';
        o.detune.value = cents;
        /* The pitch contour is most of what makes it a meow rather than a
           note: up into the vowel, held, then down and away. */
        o.frequency.setValueAtTime(430, t0);
        o.frequency.linearRampToValueAtTime(690, t0 + 0.11);
        o.frequency.setValueAtTime(690, t0 + 0.20);
        o.frequency.linearRampToValueAtTime(560, t0 + 0.36);
        o.frequency.exponentialRampToValueAtTime(330, t0 + dur);
        o.connect(mix); osc.push(o);
      });

      /* A little vibrato, or it is a synthesiser and not an animal. */
      const vib = a.createOscillator(); vib.frequency.value = 5.8;
      const vibG = a.createGain(); vibG.gain.value = 11;        /* cents */
      vib.connect(vibG);
      osc.forEach(o => vibG.connect(o.detune));

      /* Two formants running from an open vowel to a closed one. The
         second one falling is the mouth shutting, which is the "ow". */
      const f1 = a.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4.5;
      f1.frequency.setValueAtTime(760, t0);
      f1.frequency.linearRampToValueAtTime(880, t0 + 0.14);
      f1.frequency.linearRampToValueAtTime(560, t0 + dur);
      const f2 = a.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6.0;
      f2.frequency.setValueAtTime(1900, t0);
      f2.frequency.linearRampToValueAtTime(2250, t0 + 0.13);
      f2.frequency.linearRampToValueAtTime(1050, t0 + dur);
      const g1 = a.createGain(); g1.gain.value = 1.0;
      const g2 = a.createGain(); g2.gain.value = 0.55;

      const lp = a.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.6;

      const env = a.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(0.055, t0 + 0.045);
      env.gain.setValueAtTime(0.055, t0 + 0.30);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.10);

      mix.connect(f1).connect(g1).connect(lp);
      mix.connect(f2).connect(g2).connect(lp);
      lp.connect(env).connect(a.destination);

      osc.forEach(o => { o.start(t0); o.stop(t0 + dur + 0.14); });
      vib.start(t0); vib.stop(t0 + dur + 0.14);
    }

    /* =============================================================
       the loop
       ============================================================= */
    let running = false, raf = 0, last = 0, clock = 0;

    function paint(dt) {
      ctx.clearRect(0, 0, W, H);
      /* Added to the painting rather than laid over it. Combined with the
         screen blend on the element itself, which is what carries the
         addition through to the picture underneath: `lighter` on its own
         only adds inside the canvas. */
      ctx.globalCompositeOperation = 'lighter';

      drawLeaves(dt, clock);
      drawHoly(clock);
      drawLamp(clock);
      drawEmbers(dt, clock);
      drawMarks(clock);
      drawRings(dt);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      clock += dt;
      if (flare > 0) flare = Math.max(0, flare - dt / 2.0);
      if (holy  > 0) holy  = Math.max(0, holy  - dt / 3.6);
      if (gust  > 0) { gust = Math.max(0, gust - dt / 4.2); pushWind(); }
      paint(dt);
    }

    function runFX(on) {
      if (on === running) return;
      running = on;
      if (on) {
        cv.classList.add('is-on');
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, W, H);
        cv.classList.remove('is-on');
        rings.length = 0; leaves.length = 0; embers.length = 0;
        flare = 0; holy = 0; gust = 0;
      }
    }

    /* Someone who asked not to be shown movement still gets the lamp lit.
       One frame, then nothing. */
    function drawStill() {
      cv.classList.add('is-on');
      clock = 2.2;
      for (let i = 0; i < 24; i++) castEmber(false);
      embers.forEach(p => { p.t = rand(0.3, p.life * 0.7); p.y -= rand(10, 90); p.x += rand(-30, 30); });
      paint(0);
    }

    /* =============================================================
       the three things that answer
       ============================================================= */
    let mewTimer = 0;
    function mew() {
      catEl.classList.remove('is-mew');
      void catEl.offsetWidth;                    /* let it start again */
      catEl.classList.add('is-mew');
      clearTimeout(mewTimer);
      mewTimer = setTimeout(() => catEl.classList.remove('is-mew'), 1400);
    }

    function hit(id) {
      switch (id) {
        case 'lantern':
          /* No card. The lamp answers by burning brighter and throwing a
             handful of sparks, which is all it needs to say. */
          flare = 1;
          ring(LAMP.x, LAMP.y, 'warm');
          for (let i = 0; i < 22; i++) castEmber(true);
          break;

        case 'obelisk':
          holy = 1;
          seen.obelisk = true;
          ring(OBEL.x, OBEL.y + 120, 'soft');
          openCard('obelisk');
          break;

        case 'cat':
          seen.cat = true;
          meow();
          if (!reduce) {
            mew();
            /* Enough of a breeze that the bush beside him stirs, and not
               so much that the whole bank starts moving: a cat shifting
               on a step is a small event. */
            gust = Math.max(gust, 0.38);
            pushWind();
            ring(CAT.x, CAT.y + 45, 'faint');
            castLeaves(CATBUSH, 1 + ((Math.random() * 2) | 0), 1);
          }
          break;
      }
      hideHint();
    }

    /* A press on the grass or the sky, which is not one of the three. One
       gust, and the light goes through the trees. */
    function touchAir(sx, sy) {
      if (reduce) return;
      gust = 1;
      pushWind();
      ring((sx - ox) / k, (sy - oy) / k, 'soft');
    }

    /* =============================================================
       the card
       ============================================================= */
    let openId = null, lastFocus = null;

    function openCard(id) {
      const t = T4[lang4][id];
      if (!t) return;
      openId = id;
      cardK.textContent = t.k;
      cardT.textContent = t.t;
      cardB.textContent = t.b;
      cardS.textContent = t.s;
      nextB.textContent = T4[lang4].next;
      nextB.classList.toggle('is-on', id === 'obelisk');
      cardX.setAttribute('aria-label', T4[lang4].closeAria);
      cardX.firstElementChild.textContent = T4[lang4].close;
      card.setAttribute('aria-hidden', 'false');
      card.classList.add('is-in');
      lastFocus = document.activeElement;
      requestAnimationFrame(() => cardX.focus({ preventScroll: true }));
    }

    function closeCard() {
      if (!openId) return;
      openId = null;
      card.classList.remove('is-in');
      card.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    cardX.addEventListener('click', closeCard);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && openId) { e.stopPropagation(); closeCard(); }
    });
    nextB.addEventListener('click', () => {
      closeCard();
      /* The stepper is a plain global in the scene architecture block, the
         same one the chapter pills call. An unbuilt chapter answers it
         with "in production" rather than switching. */
      if (typeof goToScene === 'function') goToScene(5);
    });

    /* =============================================================
       placing the furniture
       ============================================================= */
    function placeChrome() {
      /* The cut has to land on the painted cat to the pixel, or you would
         see two of him. It is the same mapping the canvas uses, so he
         lands wherever the painting puts him. */
      catEl.style.left   = SX(CATBOX.x) + 'px';
      catEl.style.top    = SY(CATBOX.y) + 'px';
      catEl.style.width  = (CATBOX.w * k) + 'px';
      catEl.style.height = (CATBOX.h * k) + 'px';
      catNeck.style.left   = ((HEADBOX.x - CATBOX.x) * k) + 'px';
      catNeck.style.top    = ((HEADBOX.y - CATBOX.y) * k) + 'px';
      catNeck.style.width  = (HEADBOX.w * k) + 'px';
      catNeck.style.height = (HEADBOX.h * k) + 'px';

      for (const id in hotEl) {
        const b = hotEl[id], H4 = HOT[id];
        let x = SX(H4.x0), y = SY(H4.y0);
        let w = (H4.x1 - H4.x0) * k, h = (H4.y1 - H4.y0) * k;
        /* Nothing a finger has to find should be smaller than a finger. */
        if (w < 44) { x -= (44 - w) / 2; w = 44; }
        if (h < 44) { y -= (44 - h) / 2; h = 44; }
        b.style.left = x + 'px'; b.style.top = y + 'px';
        b.style.width = w + 'px'; b.style.height = h + 'px';
        /* Off the side of the screen it is not a target, and a button
           hanging off the edge still takes presses meant for the page. */
        const off = x + w < -8 || x > innerWidth + 8 || y + h < -8 || y > innerHeight + 8;
        b.style.display = off ? 'none' : 'block';
      }
    }

    function labelChrome() {
      for (const id in hotEl) hotEl[id].setAttribute('aria-label', T4[lang4].aria[id]);
    }

    /* =============================================================
       presses
       ============================================================= */
    function onChrome(e) {
      const t = e.target;
      if (t && t.closest &&
          t.closest('#nav, #pills, #toast, #s4-hint, #s4-card, button, a, input, [role="dialog"]')) return true;
      const navH = parseFloat(getComputedStyle(document.documentElement)
                     .getPropertyValue('--nav-h')) || 60;
      return e.clientY < navH + 14 || e.clientY > innerHeight - 96;
    }

    let active = false;

    /* A drag ends with a click of its own, and that click is not a press on
       anything. Settling it on pointerup with a distance guard is the only
       way to tell the two apart: the gap between a drag and its click has
       no upper bound, so no amount of waiting separates them.

       The capture is taken only once the drag has really started. Taken on
       pointerdown it would swallow the hotspot's own click and none of the
       three would ever answer. */
    let pid = null, x0 = 0, y0 = 0, p0 = 0, moved = 0, held = false;

    s4.addEventListener('pointerdown', e => {
      if (!active) return;
      pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; p0 = pan; moved = 0; held = false;
    });

    s4.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      const dx = e.clientX - x0;
      moved = Math.max(moved, Math.abs(dx), Math.abs(e.clientY - y0));
      if (moved > 8 && !held) {
        held = true;
        try { s4.setPointerCapture(pid); } catch (_) {}
        hideHint();
      }
      if (!held) return;
      const s = (innerWidth / innerHeight) / PANO_A;
      setPan(p0 + (dx / innerWidth) * Math.min(s, 1));
    });

    const up = e => {
      if (e.pointerId !== pid) return;
      pid = null;
      if (moved <= 8 && !onChrome(e)) touchAir(e.clientX, e.clientY);
    };
    s4.addEventListener('pointerup', up);
    s4.addEventListener('pointercancel', () => { pid = null; held = false; });

    for (const id in hotEl) {
      hotEl[id].addEventListener('click', (function (which) {
        return function (e) {
          /* A drag that began on a hotspot and ended back on it is still a
             drag. The pointer guard above knows which it was. */
          if (!active || moved > 8) return;
          e.stopPropagation();
          hit(which);
        };
      })(id));
    }

    /* ---------------- the hint ---------------- */
    let hintTimer = 0;
    function showHint() {
      hintEl.textContent = T4[lang4].hint;
      hintEl.classList.add('is-in');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(hideHint, 7000);
    }
    function hideHint() {
      clearTimeout(hintTimer);
      hintEl.classList.remove('is-in');
    }

    document.addEventListener('langchange', e => {
      lang4 = e.detail.lang;
      labelChrome();
      if (hintEl.classList.contains('is-in')) hintEl.textContent = T4[lang4].hint;
      if (openId) openCard(openId);
    });

    /* ---------------- chapter in, chapter out ---------------- */
    addEventListener('resize', () => {
      if (!active) return;
      sizeCanvas();
      setPan(pan);
      if (reduce) { ctx.clearRect(0, 0, W, H); embers.length = 0; drawStill(); }
    });

    document.addEventListener('visibilitychange', () => {
      if (!active || reduce) return;
      runFX(document.visibilityState === 'visible');
    });

    document.addEventListener('scenechange', e => {
      const on = e.detail.id === 4;
      if (on === active) return;
      active = on;
      if (on) {
        if (window.__setScene) window.__setScene(PANO4, MASK4, PANO_A);
        if (window.__set) for (const key in LOOK) window.__set(key, LOOK[key]);
        sizeCanvas();
        setPan(0.5 - OPEN_AT);
        leaves.length = 0; embers.length = 0;
        nextLeaf = rand(2.0, 4.5);
        gust = 0;
        seen.obelisk = false; seen.cat = false;
        /* Already blowing when the chapter opens, settling over the next
           few seconds, so the bank is moving before anyone touches it. */
        if (!reduce) { gust = 1; pushWind(); }
        labelChrome();
        s4.classList.add('is-in');
        showHint();
        if (reduce) drawStill(); else runFX(true);
      } else {
        s4.classList.remove('is-in');
        hideHint();
        closeCard();
        runFX(false);
        cv.classList.remove('is-on');
        /* Not cleared here, for the reason set out in chapter 3: these two
           share one event, and whichever leaves would otherwise undo the
           wind the one arriving had just set. */
      }
    });
  })();
