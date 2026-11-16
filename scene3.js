  /* ====================== Scene 3 · 啟蒙（理學堂大書院） ======================
     The chapter is the painting and the light on it. One canvas carries
     everything that moves: fifteen seeds on the wind, a few butterflies
     that a touch puts up out of the grass, and the thin wake a finger
     leaves when it turns the view.

     The canvas is deaf to the pointer, so the press that reaches it has
     already passed every button on the page. What turns the view is #s3
     underneath; what the effects listen for is the same gesture, read
     from the window and thrown away when it lands on a control. */
  (function () {
    'use strict';

    const PANO3  = 's3/pano3.webp';   /* baked into index.html as a data URI */
    const MASK3  = 's3/mask3.png';    /* baked into index.html as a data URI */
    const PANO_A = 2576 / 1274;

    /* No water in this chapter, so the river shader is given a black mask
       and a flat look: it draws the painting and leaves it alone. Every
       value is set, not only the ones that differ, because the chapter
       before this one leaves the renderer wherever it had it. */
    const LOOK = { warm: 0.0, disp: 0.0, swell: 0.0, glint: 0.0,
                   gf: 5.00, gsharp: 2.00, heel: 0.0 };

    const T3 = {
      zh: { hint: '拖曳環顧書院　輕觸草地' },
      en: { hint: 'Drag to look around. Touch the grass.' },
    };

    const s3     = document.getElementById('s3');
    const cv     = document.getElementById('enlightenment-fx-canvas');
    const hintEl = document.getElementById('s3-hint');
    if (!s3 || !cv) return;

    const ctx = cv.getContext('2d', { alpha: true });
    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lang3 = (document.documentElement.lang || 'zh').indexOf('en') === 0 ? 'en' : 'zh';
    document.addEventListener('langchange', e => {
      lang3 = e.detail.lang;
      if (hintEl.classList.contains('is-in')) hintEl.textContent = T3[lang3].hint;
    });

    /* ---------------- turning the view ----------------
       The same model chapter two uses: one uniform slides the painting
       sideways, bounded so the edge of the canvas never comes into frame. */
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

    /* ---------------- the canvas ---------------- */
    let W = 0, H = 0, dpr = 1;
    function sizeCanvas() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width  = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* A soft dot, drawn once into its own little canvas and stamped from
       there. Building a radial gradient per particle per frame is what
       makes this kind of layer expensive; one drawImage is close to free. */
    function makeGlow(rgb) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0.00, 'rgba(' + rgb + ',0.90)');
      rg.addColorStop(0.22, 'rgba(' + rgb + ',0.34)');
      rg.addColorStop(1.00, 'rgba(' + rgb + ',0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, 64, 64);
      return c;
    }
    const GLOW_PALE = makeGlow('255,252,240');
    const GLOW_GOLD = makeGlow('255,214,130');

    /* ---------------- the seeds ----------------
       Fifteen, which is enough to read as weather and few enough that the
       whole layer stays one short pass. They come in over the right
       shoulder with the light and cross to the lower left, swinging as
       they fall, the way a pappus actually travels. */
    const SEED_N = 15;
    const seeds = [];

    function castSeed(s, anywhere) {
      s.x    = anywhere ? rand(-0.05, 1.15) * W : rand(0.55, 1.25) * W;
      s.y    = anywhere ? rand(-0.10, 1.00) * H : rand(-0.30, 0.25) * H;
      s.r    = rand(1.1, 2.4);
      s.vx   = -rand(9, 21);
      s.vy   =  rand(10, 23);
      s.amp  = rand(9, 30);
      s.freq = rand(0.22, 0.55);
      s.ph   = rand(0, TAU);
      s.rot  = rand(0, TAU);
      s.spin = rand(-0.45, 0.45);
      s.gold = Math.random() < 0.45;
      s.a    = rand(0.42, 0.88);
    }
    function seedAll(anywhere) {
      seeds.length = 0;
      for (let i = 0; i < SEED_N; i++) { const s = {}; castSeed(s, anywhere); seeds.push(s); }
    }

    function stepSeed(s, dt) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
      if (s.y > H + 40 || s.x < -60) castSeed(s, false);
    }

    function drawSeed(s, t) {
      const x = s.x + Math.sin(t * s.freq + s.ph) * s.amp;
      const y = s.y;
      const R = s.r * 7;
      ctx.globalAlpha = s.a * 0.5;
      ctx.drawImage(s.gold ? GLOW_GOLD : GLOW_PALE, x - R, y - R, R * 2, R * 2);

      /* The crown of hairs, then the seed itself. Six strokes is the
         fewest that still reads as a pappus rather than an asterisk. */
      ctx.globalAlpha = s.a * 0.85;
      ctx.strokeStyle = s.gold ? 'rgba(255,226,166,0.9)' : 'rgba(255,253,247,0.92)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = s.rot + i * (Math.PI / 3);
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * s.r * 3.1, y + Math.sin(a) * s.r * 3.1);
      }
      ctx.stroke();

      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.gold ? 'rgba(255,238,200,1)' : 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(x, y, s.r * 0.6, 0, TAU);
      ctx.fill();
    }

    /* ---------------- the butterflies ----------------
       A touch on the grass puts one or two up. They leave on a curve
       towards the roof of the college, which is the thing the chapter is
       about, and are gone by the time they get there. */
    const FLY_MAX = 4;
    const flies = [];

    function putUpButterflies(px, py) {
      const n = Math.random() < 0.5 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        if (flies.length >= FLY_MAX) break;
        const x0 = px + rand(-16, 16), y0 = py + rand(-12, 12);
        const x1 = W * 0.5 + rand(-0.13, 0.13) * W;
        const y1 = H * 0.30 + rand(-0.07, 0.07) * H;
        flies.push({
          x0: x0, y0: y0, x1: x1, y1: y1,
          /* The handle sits off to one side and well above both ends, so
             the path lifts and leans instead of running straight. */
          cx: (x0 + x1) / 2 + rand(-0.20, 0.20) * W,
          cy: Math.min(y0, y1) - rand(0.08, 0.24) * H,
          t: 0, life: rand(2.7, 3.3),
          size: rand(7, 11), ph: rand(0, TAU), flap: rand(12, 19),
          x: x0, y: y0, ang: 0,
        });
      }
    }

    /* Slow at both ends: it has to look like something deciding to go,
       not something fired out of a tube. */
    const ease = u => u * u * u * (u * (u * 6 - 15) + 10);

    function stepFly(f, dt) {
      f.t += dt / f.life;
      const u = ease(Math.min(1, f.t)), v = 1 - u;
      const nx = v * v * f.x0 + 2 * v * u * f.cx + u * u * f.x1;
      const ny = v * v * f.y0 + 2 * v * u * f.cy + u * u * f.y1;
      /* Heading from where it actually went this frame, so the body keeps
         pointing along the curve. */
      const dx = nx - f.x, dy = ny - f.y;
      if (dx || dy) f.ang = Math.atan2(dy, dx) + Math.PI / 2;
      f.x = nx; f.y = ny;
      return f.t < 1;
    }

    function drawFly(f, t) {
      const a = f.t < 0.12 ? f.t / 0.12
              : f.t > 0.70 ? Math.max(0, (1 - f.t) / 0.30)
              : 1;
      if (a <= 0) return;
      const flap = Math.abs(Math.sin(t * f.flap + f.ph));
      const spread = 0.26 + 0.74 * flap;      /* wings seen edge on to flat */
      const S = f.size;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.ang);

      const R = S * 2.7;
      ctx.globalAlpha = a * 0.3;
      ctx.drawImage(GLOW_GOLD, -R, -R, R * 2, R * 2);

      ctx.globalAlpha = a * 0.92;
      ctx.fillStyle = 'rgba(255,208,122,0.88)';
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.scale(side * spread, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(S * 0.40, -S * 1.10, S * 1.50, -S * 0.86, S * 1.14, -S * 0.04);
        ctx.bezierCurveTo(S * 1.44,  S * 0.74, S * 0.50,  S * 0.96, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(255,238,198,0.95)';
      ctx.beginPath();
      ctx.ellipse(0, 0, S * 0.13, S * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    /* ---------------- the wake under a finger ----------------
       Sparse on purpose: a few points that lift and go out, so turning the
       view feels like moving air rather than painting with a brush. */
    const MOTE_MAX = 10;
    const motes = [];

    function breeze(x, y, dx) {
      if (motes.length >= MOTE_MAX) return;
      motes.push({
        x: x + rand(-7, 7), y: y + rand(-7, 7),
        vx: dx * rand(0.9, 2.2) + rand(-10, 10),
        vy: rand(-26, -6),
        t: 0, life: rand(0.55, 1.0), r: rand(0.9, 2.0),
      });
    }

    /* ---------------- the loop ---------------- */
    let running = false, raf = 0, last = 0, clock = 0;

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      clock += dt;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < seeds.length; i++) { stepSeed(seeds[i], dt); drawSeed(seeds[i], clock); }

      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.t += dt;
        if (m.t >= m.life) { motes.splice(i, 1); continue; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        m.vy += 14 * dt;
        const a = 1 - m.t / m.life;
        const R = m.r * 6;
        ctx.globalAlpha = a * 0.55;
        ctx.drawImage(GLOW_PALE, m.x - R, m.y - R, R * 2, R * 2);
      }

      for (let i = flies.length - 1; i >= 0; i--) {
        if (!stepFly(flies[i], dt)) { flies.splice(i, 1); continue; }
        drawFly(flies[i], clock);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    function runFX(on) {
      if (on === running) return;
      running = on;
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, W, H);
        flies.length = 0; motes.length = 0;
      }
    }

    /* ---------------- what counts as touching the grass ----------------
       Anything that landed on a control is not a touch on the grass, and
       neither is the top of the screen where the chapters live or the
       foot of it where this chapter's own buttons will sit. */
    function onChrome(e) {
      const t = e.target;
      if (t && t.closest &&
          t.closest('#nav, #pills, #toast, #s3-hint, button, a, input, [role="dialog"]')) return true;
      const navH = parseFloat(getComputedStyle(document.documentElement)
                     .getPropertyValue('--nav-h')) || 60;
      return e.clientY < navH + 14 || e.clientY > innerHeight - 96;
    }

    /* A drag ends with a click of its own, and that click is not a tap on
       the grass. Settling this on pointerup with a distance guard is the
       only way to tell the two apart: the gap between a drag and its click
       has no upper bound, so no amount of waiting separates them. */
    let active = false;
    (function () {
      let id = null, x0 = 0, y0 = 0, p0 = 0, moved = 0, lastX = 0, lastEmit = 0;

      s3.addEventListener('pointerdown', e => {
        if (!active || onChrome(e)) return;
        id = e.pointerId; x0 = lastX = e.clientX; y0 = e.clientY; p0 = pan; moved = 0;
        lastEmit = 0;
        try { s3.setPointerCapture(id); } catch (_) {}
      });

      s3.addEventListener('pointermove', e => {
        if (e.pointerId !== id) return;
        const dx = e.clientX - x0;
        moved = Math.max(moved, Math.abs(dx), Math.abs(e.clientY - y0));
        const s = (innerWidth / innerHeight) / PANO_A;
        setPan(p0 + (dx / innerWidth) * Math.min(s, 1));

        if (!reduce && moved > 8) {
          const now = performance.now();
          if (now - lastEmit > 48) {
            lastEmit = now;
            breeze(e.clientX, e.clientY, Math.sign(e.clientX - lastX) || 1);
          }
          lastX = e.clientX;
          hideHint();
        }
      });

      const up = e => {
        if (e.pointerId !== id) return;
        id = null;
        if (moved <= 8 && !reduce && !onChrome(e)) {
          putUpButterflies(e.clientX, e.clientY);
          hideHint();
        }
      };
      s3.addEventListener('pointerup', up);
      s3.addEventListener('pointercancel', () => { id = null; });
    })();

    /* Assistive software can raise a click that no pointer produced. That
       one is a real press and still deserves its butterflies. */
    s3.addEventListener('click', e => {
      if (!active || reduce || e.detail !== 0 || onChrome(e)) return;
      putUpButterflies(e.clientX || W / 2, e.clientY || H / 2);
    });

    /* ---------------- the hint ---------------- */
    let hintTimer = 0;
    function showHint() {
      hintEl.textContent = T3[lang3].hint;
      hintEl.classList.add('is-in');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(hideHint, 6000);
    }
    function hideHint() {
      clearTimeout(hintTimer);
      hintEl.classList.remove('is-in');
    }

    /* ---------------- chapter in, chapter out ---------------- */
    addEventListener('resize', () => {
      if (!active) return;
      sizeCanvas();
      seedAll(true);
      setPan(pan);
    });

    document.addEventListener('visibilitychange', () => {
      if (!active) return;
      runFX(document.visibilityState === 'visible' && !reduce);
    });

    document.addEventListener('scenechange', e => {
      const on = e.detail.id === 3;
      if (on === active) return;
      active = on;
      if (on) {
        if (window.__setScene) window.__setScene(PANO3, MASK3, PANO_A);
        if (window.__set) for (const k in LOOK) window.__set(k, LOOK[k]);
        setPan(0);
        sizeCanvas();
        seedAll(true);
        s3.classList.add('is-in');
        showHint();
        runFX(!reduce);
      } else {
        s3.classList.remove('is-in');
        hideHint();
        runFX(false);
      }
    });
  })();
