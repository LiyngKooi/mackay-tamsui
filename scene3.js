  /* ====================== Scene 3 · 啟蒙（理學堂大書院） ======================
     Nothing floats over this painting any more. What moves is the painting:
     the mask carries a blue channel saying how much each pixel belongs to
     something a breeze can shift, and the shader that draws the picture
     reads it. Fronds and leaf edges travel a few pixels; brick, stone, the
     lawn and the benches are left exactly where they were painted.

     The canvas above is empty almost all of the time. It wakes only for a
     press: the breeze gets up, a few leaves come off the trees, and a band
     of light crosses the grass. When the last of that has gone it clears
     itself and stops, so an untouched chapter costs one quad and no layer
     at all. */
  (function () {
    'use strict';

    const PANO3  = 's3/pano3.webp';   /* baked into index.html as a data URI */
    const MASK3  = 's3/mask3.png';    /* baked into index.html as a data URI */
    const PANO_A = 2576 / 1274;
    const IW = 2576, IH = 1274;

    /* No open water here, so every water term is off. The mask carries the
       wind in its blue channel and the sky in its red, which in a chapter
       with a river would be the river instead.

       Every value below is set, not only the ones that differ from the
       chapter before. The renderer is left wherever that chapter put it,
       so a value left unsaid is inherited rather than defaulted, and that
       has already cost this chapter its wind once. */
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const WIND_CALM = 0.01050;        /* how far a frond tip travels, in uv */
    const WIND_GUST = 0.00900;        /* and what a press adds on top       */

    /* What the sky does with that red channel.

       CDRIFT is how far a cloud travels, in uv: 0.0369 is ninety five
       image pixels, and the mask is built around that exact number so a
       cloud can never be carried into a roof. The clouds in this painting
       are cream against blue at almost the same brightness, which is why
       a first pass that measured the sky in brightness alone concluded
       there was nothing there to move. There is.

       CLOUD is the light they cast, a few per cent up and down. Travelling
       alone is honest but quiet, because the painted edges are soft;
       shading alone slides nothing. Together they read.

       Both are scaled by the renderer's own amount, which is what carries
       the reduced-motion setting, so neither needs to ask about it here. */
    const CDRIFT = 0.0369;
    const CLOUD  = 0.062;
    const LOOK = { warm: 0.0, disp: 0.0, swell: 0.0, glint: 0.0,
                   gf: 5.00, gsharp: 2.00, heel: 0.0,
                   wind: WIND_CALM, cloud: CLOUD, cdrift: CDRIFT };

    const T3 = {
      zh: { hint: '拖曳環顧書院　輕觸草地或樹叢，等一陣風' },
      en: { hint: 'Drag to look around. Touch the grass and wait for the wind.' },
    };

    const s3     = document.getElementById('s3');
    const cv     = document.getElementById('enlightenment-fx-canvas');
    const hintEl = document.getElementById('s3-hint');
    if (!s3 || !cv) return;

    const ctx  = cv.getContext('2d', { alpha: true });
    const rand = (a, b) => a + Math.random() * (b - a);

    let lang3 = (document.documentElement.lang || 'zh').indexOf('en') === 0 ? 'en' : 'zh';
    document.addEventListener('langchange', e => {
      lang3 = e.detail.lang;
      if (hintEl.classList.contains('is-in')) hintEl.textContent = T3[lang3].hint;
    });

    /* ---------------- turning the view ---------------- */
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
    }

    /* ---------------- the painting's pixels, on this screen ----------------
       The shader fits the painting the short way round and slides it by
       `pan`, which comes to this: image point (0.5 - pan, 0.5) sits in the
       middle of the screen and one image pixel is k screen pixels. */
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

    /* ---------------- two shapes, drawn once ---------------- */
    /* A leaf, sunlit from behind rather than cut out in silhouette: this
       layer is blended to add light and can never take any away, so a dark
       shape would simply not appear. */
    function leafSprite() {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const lg = g.createLinearGradient(32, 6, 32, 58);
      /* A real green, not a pale one. This layer may only add light, so
         a leaf that is nearly white adds nearly white and reads as a
         speck of dust; a saturated green adds green and reads as a
         leaf. */
      lg.addColorStop(0.00, 'rgba(178,214,108,0.95)');
      lg.addColorStop(0.42, 'rgba(124,170,70,0.90)');
      lg.addColorStop(1.00, 'rgba(78,118,46,0.72)');
      g.fillStyle = lg;
      g.beginPath();
      g.moveTo(32, 5);
      g.bezierCurveTo(51, 20, 51, 44, 32, 59);
      g.bezierCurveTo(13, 44, 13, 20, 32, 5);
      g.fill();
      g.strokeStyle = 'rgba(244,252,206,0.42)';
      g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(32, 9); g.lineTo(32, 55); g.stroke();
      return c;
    }

    /* The band of light that crosses the grass when the cloud cover opens.
       Built as a wide horizontal gradient and then feathered top and
       bottom, so it has no edge anywhere. */
    function sunSprite() {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g = c.getContext('2d');
      const lg = g.createLinearGradient(0, 0, 256, 0);
      lg.addColorStop(0.00, 'rgba(255,247,214,0)');
      lg.addColorStop(0.34, 'rgba(255,247,214,0.72)');
      lg.addColorStop(0.50, 'rgba(255,250,228,1)');
      lg.addColorStop(0.66, 'rgba(255,247,214,0.72)');
      lg.addColorStop(1.00, 'rgba(255,247,214,0)');
      g.fillStyle = lg; g.fillRect(0, 0, 256, 64);
      const vg = g.createLinearGradient(0, 0, 0, 64);
      vg.addColorStop(0.00, 'rgba(0,0,0,0)');
      vg.addColorStop(0.30, 'rgba(0,0,0,1)');
      vg.addColorStop(0.70, 'rgba(0,0,0,1)');
      vg.addColorStop(1.00, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in';
      g.fillStyle = vg; g.fillRect(0, 0, 256, 64);
      return c;
    }

    const LEAF = leafSprite();
    const SUN  = sunSprite();

    /* Where leaves come from. The lower canopy rather than the crowns:
       higher up they would spend their first seconds against a sky that is
       nearly white, and light added to nearly white is nothing at all. */
    /* Below the skyline on purpose. Against pale sky an added green is
       very nearly white, so a leaf up there is a ghost; coming off the
       canopy it has dark foliage behind it the whole way down. */
    const TREES = [
      { x0: 40,   y0: 430, x1: 620,  y1: 700, dir:  1 },   /* left, blowing right */
      { x0: 1850, y0: 420, x1: 2550, y1: 700, dir: -1 },   /* right, blowing left */
    ];
    const GRASS_TOP = 700, GRASS_BOT = 1180;

    /* =============================================================
       the breeze
       ============================================================= */
    let gust = 0;                     /* 0 calm, 1 the moment of the press */

    function pushWind() {
      if (!window.__set) return;
      /* Up quickly and down slowly, the way a gust actually arrives. */
      window.__set('wind', WIND_CALM + WIND_GUST * gust);
    }

    /* =============================================================
       what a press puts there
       ============================================================= */
    const leaves = [];
    let sweep = null;

    /* What part of the painting is on the screen right now. A leaf that
       comes off a tree forty degrees round the panorama is a leaf nobody
       sees, and the first build dropped most of them there. */
    function visibleX() {
      return [(-ox) / k, (innerWidth - ox) / k];
    }

    function dropLeaves(nearX) {
      /* From whichever side of the courtyard the press was nearer to, so
         the leaves come off the trees you were just looking at, and only
         from the part of that stand you can actually see. */
      const tr = TREES[nearX > IW / 2 ? 1 : 0];
      const [vx0, vx1] = visibleX();
      const x0 = Math.max(tr.x0, vx0 + 30), x1 = Math.min(tr.x1, vx1 - 30);
      const wide = x1 - x0 > 60;
      const n = 3 + ((Math.random() * 3) | 0);          /* 3 to 5 */
      for (let i = 0; i < n; i++) {
        leaves.push({
          x: wide ? rand(x0, x1) : Math.max(vx0 + 40, Math.min(vx1 - 40, nearX + rand(-260, 260))),
          y: rand(tr.y0, tr.y1),
          vx: tr.dir * rand(26, 58), vy: rand(52, 84),
          r: rand(8, 14),
          spin: rand(1.2, 2.8) * (Math.random() < 0.5 ? -1 : 1),
          turn: rand(0, Math.PI * 2), tw: rand(1.5, 3.0),
          rot: rand(0, Math.PI * 2),
          ph: rand(0, Math.PI * 2), sw: rand(0.5, 1.1), amp: rand(16, 48),
          t: 0, life: rand(6.5, 10), a: rand(0.55, 0.9),
          delay: i * rand(0.12, 0.55),
        });
      }
    }

    function drawLeaves(dt, t) {
      for (let i = leaves.length - 1; i >= 0; i--) {
        const p = leaves[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.t += dt;
        p.turn += p.tw * dt;
        p.rot += p.spin * dt * 0.22;
        /* Carried along while the gust lasts, then only falling. */
        p.x += p.vx * (0.45 + 0.55 * gust) * dt;
        p.y += p.vy * dt;
        if (p.t >= p.life || p.y > GRASS_BOT + 60) { leaves.splice(i, 1); continue; }

        const u = p.t / p.life;
        const fade = u < 0.07 ? u / 0.07 : u > 0.78 ? Math.max(0, (1 - u) / 0.22) : 1;
        /* The width follows the cosine of its own turn, so each leaf goes
           edge on and flat again as it falls instead of sliding down the
           screen like a sticker. */
        const flat = Math.abs(Math.cos(p.turn));
        ctx.globalAlpha = p.a * fade * (0.34 + 0.66 * flat);
        const hh = p.r * k * 1.5, ww = p.r * k * 0.72 * (0.22 + 0.78 * flat);
        ctx.save();
        ctx.translate(SX(p.x + Math.sin(t * p.sw + p.ph) * p.amp), SY(p.y));
        ctx.rotate(p.rot + Math.sin(p.turn) * 0.30);
        ctx.drawImage(LEAF, -ww, -hh, ww * 2, hh * 2);
        ctx.restore();
      }
    }

    function castSweep(fromX) {
      sweep = { t: 0, life: 3.6, dir: fromX > IW / 2 ? -1 : 1 };
    }

    function drawSweep(dt) {
      if (!sweep) return;
      sweep.t += dt;
      if (sweep.t >= sweep.life) { sweep = null; return; }
      const u = sweep.t / sweep.life;
      /* In, across, out. The band is wider than the screen, so what you
         see is the light changing rather than an object going past. */
      const fade = u < 0.22 ? u / 0.22 : u > 0.62 ? Math.max(0, (1 - u) / 0.38) : 1;
      const travel = -0.35 + u * 1.7;
      const cx = sweep.dir > 0 ? travel * IW : (1 - travel) * IW;
      const w = IW * 0.62, h = (GRASS_BOT - GRASS_TOP) * 1.15;
      const cy = (GRASS_TOP + GRASS_BOT) / 2;
      ctx.globalAlpha = 0.13 * fade;
      ctx.drawImage(SUN, SX(cx - w / 2), SY(cy - h / 2), w * k, h * k);
    }

    /* =============================================================
       one soft rustle, and only if the sound is on
       ============================================================= */
    let noiseBuf = null;
    function ac() {
      /* The mute button in the corner owns these two. If the person has
         never switched the sound on, actx does not exist yet and nothing
         here makes one: a chapter is not allowed to start the audio. */
      if (typeof audioOn === 'undefined' || !audioOn) return null;
      if (typeof actx === 'undefined' || !actx || actx.state !== 'running') return null;
      return actx;
    }

    function rustle() {
      const a = ac();
      if (!a) return;
      if (!noiseBuf) {
        noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const now = a.currentTime;
      const src = a.createBufferSource();
      src.buffer = noiseBuf;
      src.loopStart = Math.random() * 1.0; src.loop = true;

      /* Leaves are a band of noise around two kilohertz that opens and
         closes. Sweeping the filter is what turns a hiss into a rustle. */
      const bp = a.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 0.9;
      bp.frequency.setValueAtTime(900, now);
      bp.frequency.linearRampToValueAtTime(2600, now + 0.55);
      bp.frequency.linearRampToValueAtTime(1200, now + 1.6);

      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.030, now + 0.42);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

      src.connect(bp).connect(g).connect(a.destination);
      src.start(now); src.stop(now + 1.8);
    }

    /* =============================================================
       the loop, which only runs when there is something to run for
       ============================================================= */
    let running = false, raf = 0, last = 0, clock = 0;

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; clock += dt;

      /* The gust decays towards calm; the press is what puts it up. */
      gust = Math.max(0, gust - dt / 4.2);
      pushWind();

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      drawSweep(dt);
      drawLeaves(dt, clock);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      if (leaves.length || sweep || gust > 0.002) {
        raf = requestAnimationFrame(frame);
      } else {
        /* Nothing left to draw. Clear, take the layer off the page and
           stop: an untouched chapter should cost nothing at all. */
        running = false;
        ctx.clearRect(0, 0, W, H);
        cv.classList.remove('is-on');
        if (window.__set) window.__set('wind', WIND_CALM);
      }
    }

    function wake() {
      if (running) return;
      running = true;
      cv.classList.add('is-on');
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stopFX() {
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
      cv.classList.remove('is-on');
      leaves.length = 0; sweep = null; gust = 0;
    }

    /* A press on the grass or the trees. One gust, a few leaves, and the
       light crossing the lawn behind them. */
    function breeze(sx, sy) {
      if (reduce) return;
      const ix = (sx - ox) / k;
      gust = 1;
      pushWind();
      dropLeaves(ix);
      castSweep(ix);
      rustle();
      wake();
    }

    /* ---------------- what counts as touching the grass ----------------
       Anything that landed on a control is not a touch on the grass, and
       neither is the top of the screen where the chapters live or the foot
       of it where this chapter's own buttons will sit. */
    function onChrome(e) {
      const t = e.target;
      if (t && t.closest &&
          t.closest('#nav, #pills, #toast, #s3-hint, button, a, input, [role="dialog"]')) return true;
      const navH = parseFloat(getComputedStyle(document.documentElement)
                     .getPropertyValue('--nav-h')) || 60;
      return e.clientY < navH + 14 || e.clientY > innerHeight - 96;
    }

    let active = false;

    /* A drag ends with a click of its own, and that click is not a touch
       on the grass. Settling this on pointerup with a distance guard is
       the only way to tell the two apart: the gap between a drag and its
       click has no upper bound, so no amount of waiting separates them. */
    (function () {
      let id = null, x0 = 0, y0 = 0, p0 = 0, moved = 0;

      s3.addEventListener('pointerdown', e => {
        if (!active || onChrome(e)) return;
        id = e.pointerId; x0 = e.clientX; y0 = e.clientY; p0 = pan; moved = 0;
        try { s3.setPointerCapture(id); } catch (_) {}
      });

      s3.addEventListener('pointermove', e => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - x0;
        moved = Math.max(moved, Math.abs(dx), Math.abs(e.clientY - y0));
        const s = (innerWidth / innerHeight) / PANO_A;
        setPan(p0 + (dx / innerWidth) * Math.min(s, 1));
        if (moved > 8) hideHint();
      });

      const up = e => {
        if (e.pointerId !== id) return;
        id = null;
        if (moved <= 8 && !onChrome(e)) { breeze(e.clientX, e.clientY); hideHint(); }
      };
      s3.addEventListener('pointerup', up);
      s3.addEventListener('pointercancel', () => { id = null; });
    })();

    /* Assistive software can raise a click that no pointer produced. That
       one is a real press and still deserves its gust. */
    s3.addEventListener('click', e => {
      if (!active || e.detail !== 0 || onChrome(e)) return;
      breeze(e.clientX || W / 2, e.clientY || H / 2);
    });

    /* ---------------- the hint ---------------- */
    let hintTimer = 0;
    function showHint() {
      hintEl.textContent = T3[lang3].hint;
      hintEl.classList.add('is-in');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(hideHint, 7000);
    }
    function hideHint() {
      clearTimeout(hintTimer);
      hintEl.classList.remove('is-in');
    }

    /* ---------------- chapter in, chapter out ---------------- */
    addEventListener('resize', () => {
      if (!active) return;
      sizeCanvas();
      setPan(pan);
    });

    document.addEventListener('visibilitychange', () => {
      if (!active) return;
      if (document.visibilityState !== 'visible') stopFX();
    });

    document.addEventListener('scenechange', e => {
      const on = e.detail.id === 3;
      if (on === active) return;
      active = on;
      if (on) {
        if (window.__setScene) window.__setScene(PANO3, MASK3, PANO_A);
        if (window.__set) for (const key in LOOK) window.__set(key, LOOK[key]);
        setPan(0);
        sizeCanvas();
        s3.classList.add('is-in');
        showHint();
        /* A gust already going when the chapter opens, settling over the
           next few seconds. Waiting for someone to touch the grass before
           anything moves meant most people never saw it move at all. */
        if (!reduce) { gust = 1; pushWind(); wake(); }
      } else {
        s3.classList.remove('is-in');
        hideHint();
        stopFX();
        /* The wind uniform is deliberately NOT cleared here. Both chapters
           listen to the same scenechange, this script is registered first,
           and on the way from chapter 4 to chapter 3 that meant chapter 3
           set its wind and chapter 4's handler then zeroed it a moment
           later. The canopy stood perfectly still and nothing in the code
           looked wrong. Whoever arrives sets their own wind; the chapters
           before these two cannot move whatever it says, because the blue
           channel of their masks is empty. */
      }
    });
  })();
