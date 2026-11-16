  /* ====================== Scene 3 · 啟蒙（理學堂大書院） ======================
     The chapter is the painting and the light on it. One canvas carries
     everything that moves: fireflies breathing over the grass, flecks of
     gold leaf catching the morning, and now and then a thread of dust
     drawn across the sky. A finger leaves light where it passes, and a
     touch on the grass puts the whole patch up at once.

     The canvas is deaf to the pointer, so a press reaches it only after it
     has passed every button on the page. What turns the view is #s3
     underneath; what the light listens for is the same gesture, read from
     the window and thrown away when it lands on a control. */
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

    const ctx  = cv.getContext('2d', { alpha: true });
    const TAU  = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[(Math.random() * a.length) | 0];
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

    /* ---------------- what the light is made of ----------------
       Every shape is drawn once into a little canvas of its own and
       stamped from there. Building a radial gradient per particle per
       frame is what makes a layer like this expensive; a drawImage of a
       cached sprite is close to free, and it is the only reason forty
       lights and a burst on top of them cost nothing to speak of. */
    function bokehSprite(rgb) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      /* A disc with a soft rim, not a point with a halo. Out of focus
         light is a flat round plate: the first build fell away from the
         centre immediately, which over a sunlit painting left a pinprick
         that read as a speck of dust rather than a firefly. The body is
         held almost flat to half the radius and only then let go. */
      rg.addColorStop(0.00, 'rgba(' + rgb + ',1)');
      rg.addColorStop(0.34, 'rgba(' + rgb + ',0.80)');
      rg.addColorStop(0.52, 'rgba(' + rgb + ',0.62)');
      rg.addColorStop(0.74, 'rgba(' + rgb + ',0.24)');
      rg.addColorStop(1.00, 'rgba(' + rgb + ',0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, 128, 128);
      return c;
    }

    /* A four pointed sparkle with its sides drawn in towards the middle,
       which is what makes it read as struck foil rather than the asterisk
       a star of straight spokes gives you. */
    function foilSprite(rgb) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 40);
      rg.addColorStop(0.00, 'rgba(' + rgb + ',0.85)');
      rg.addColorStop(1.00, 'rgba(' + rgb + ',0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, 128, 128);

      const R = 58, w = 5.5;
      g.translate(64, 64);
      g.fillStyle = 'rgba(' + rgb + ',1)';
      g.beginPath();
      g.moveTo(0, -R);
      g.quadraticCurveTo(w, -w, R, 0);
      g.quadraticCurveTo(w, w, 0, R);
      g.quadraticCurveTo(-w, w, -R, 0);
      g.quadraticCurveTo(-w, -w, 0, -R);
      g.fill();
      /* A shorter pair across the diagonals, so it glitters rather than
         sitting there as a clean cross. */
      g.rotate(Math.PI / 4);
      g.globalAlpha = 0.5;
      g.beginPath();
      g.moveTo(0, -R * 0.42);
      g.quadraticCurveTo(w * 0.5, -w * 0.5, R * 0.42, 0);
      g.quadraticCurveTo(w * 0.5, w * 0.5, 0, R * 0.42);
      g.quadraticCurveTo(-w * 0.5, w * 0.5, -R * 0.42, 0);
      g.quadraticCurveTo(-w * 0.5, -w * 0.5, 0, -R * 0.42);
      g.fill();
      return c;
    }

    const AMBER = bokehSprite('255,209,102');   /* #FFD166 */
    const GOLD  = bokehSprite('244,162,97');    /* #F4A261 */
    const CREAM = bokehSprite('255,248,231');   /* #FFF8E7 */
    const BOKEH = [AMBER, GOLD, CREAM, AMBER, CREAM];   /* amber and cream lead */
    const FOIL  = foilSprite('255,229,153');    /* #FFE599 */

    /* ---------------- the resident light ----------------
       Thirty six of them, which is enough that the air is never empty and
       few enough that nothing has to be thinned when a burst lands on top. */
    /* Forty four, inside the band the brief asks for. Twenty was too thin
       to read across a screen this wide: the air looked empty between
       them. */
    const BOKEH_N = 26, FOIL_N = 18;
    const lights = [];

    function castLight(p, kind, anywhere) {
      p.kind = kind;
      p.x = rand(-0.04, 1.04) * W;
      /* Fireflies belong over the grass and the bushes, and that is also
         the only place they can be seen: added light does nothing to a
         sky that is already near white, and everything to foliage in
         shade. The sky gets the stardust instead. Foil is scattered
         wider, since it is the page's gilding rather than an insect. */
      const top = kind === 'bokeh' ? 0.40 : 0.06;
      p.y = anywhere ? rand(top, 1.05) * H : rand(1.02, 1.3) * H;
      if (kind === 'bokeh') {
        p.r    = rand(2.5, 10);
        p.img  = pick(BOKEH);
        /* Big ones are soft and dim, small ones are tight and bright,
           which is how a lens actually renders light it cannot resolve
           and what stops the large discs from blowing out to white when
           two of them cross. */
        p.a    = Math.max(0.46, Math.min(1, 1.16 - p.r * 0.054)) * rand(0.88, 1.08);
        p.rise = rand(5, 17);
        p.bw   = rand(0.30, 0.95);            /* its own breath */
      } else {
        /* Most of the foil is dust; a few are struck stars. */
        p.star = Math.random() < 0.42;
        p.r    = p.star ? rand(3.0, 7.5) : rand(0.8, 1.9);
        p.img  = FOIL;
        p.a    = p.star ? rand(0.62, 1) : rand(0.45, 0.8);
        p.rise = rand(4, 14);
        p.bw   = rand(0.8, 2.1);              /* foil twinkles quicker */
        p.rot  = rand(0, TAU);
        p.spin = rand(-0.5, 0.5);
      }
      p.ph   = rand(0, TAU);
      p.amp  = rand(6, 26);                   /* how far the air carries it */
      p.sw   = rand(0.14, 0.42);
      p.drift = rand(-7, 7);
    }

    function seedLights(anywhere) {
      lights.length = 0;
      for (let i = 0; i < BOKEH_N; i++) { const p = {}; castLight(p, 'bokeh', anywhere); lights.push(p); }
      for (let i = 0; i < FOIL_N;  i++) { const p = {}; castLight(p, 'foil',  anywhere); lights.push(p); }
    }

    function drawLights(dt, t) {
      for (let i = 0; i < lights.length; i++) {
        const p = lights[i];
        p.y -= p.rise * dt;
        p.x += p.drift * dt;
        if (p.y < -0.12 * H) { castLight(p, p.kind, false); continue; }

        const x = p.x + Math.sin(t * p.sw + p.ph) * p.amp;
        const s = 0.5 + 0.5 * Math.sin(t * p.bw + p.ph);

        if (p.kind === 'bokeh') {
          ctx.globalAlpha = p.a * (0.5 + 0.5 * s);
          const R = p.r * 1.9;
          ctx.drawImage(p.img, x - R, p.y - R, R * 2, R * 2);
        } else {
          /* Squared, so the foil sits dark most of the time and flashes,
             the way a struck surface catches the light only on the turn. */
          ctx.globalAlpha = p.a * (0.1 + 0.9 * s * s);
          p.rot += p.spin * dt;
          const R = p.r * (p.star ? 2.4 : 3.4);
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.rot);
          ctx.drawImage(p.img, -R, -R, R * 2, R * 2);
          ctx.restore();
        }
      }
    }

    /* ---------------- a thread of dust across the sky ----------------
       Once every several seconds, high up. It is a head with a tail of its
       own recent positions, so the arc draws itself and goes out behind. */
    let arc = null, nextArc = rand(2.5, 5);

    function castArc() {
      const leftward = Math.random() < 0.5;
      /* Down nearer the treetops rather than up in the open sky. Added
         light does almost nothing to a pale sky and a great deal against
         foliage, so the thread is drawn where it can actually be seen. */
      const y0 = rand(0.20, 0.50) * H;
      arc = {
        x: leftward ? rand(0.75, 1.05) * W : rand(-0.05, 0.25) * W,
        y: y0,
        vx: (leftward ? -1 : 1) * rand(0.17, 0.30) * W,
        vy: rand(-0.02, 0.05) * H,
        ay: rand(0.03, 0.10) * H,            /* a gentle sag, so it arcs */
        t: 0, life: rand(2.2, 3.4),
        trail: [],
      };
    }

    function drawArc(dt) {
      if (!arc) {
        nextArc -= dt;
        if (nextArc <= 0) { castArc(); nextArc = rand(4.5, 9); }
        return;
      }
      arc.t += dt;
      arc.vy += arc.ay * dt;
      arc.x  += arc.vx * dt;
      arc.y  += arc.vy * dt;
      arc.trail.push(arc.x, arc.y);
      if (arc.trail.length > 76) arc.trail.splice(0, 2);

      const u = arc.t / arc.life;
      /* Comes up, holds, goes out. */
      const fade = u < 0.18 ? u / 0.18 : u > 0.62 ? Math.max(0, (1 - u) / 0.38) : 1;

      const n = arc.trail.length / 2;
      for (let i = 0; i < n; i++) {
        const k = i / n;                      /* 0 oldest, 1 newest */
        const R = 1.6 + 6.0 * k;
        ctx.globalAlpha = fade * 0.9 * k * k;
        ctx.drawImage(CREAM, arc.trail[i * 2] - R, arc.trail[i * 2 + 1] - R, R * 2, R * 2);
      }
      ctx.globalAlpha = fade;
      ctx.drawImage(CREAM, arc.x - 13, arc.y - 13, 26, 26);
      ctx.drawImage(AMBER, arc.x - 8, arc.y - 8, 16, 16);

      if (arc.t >= arc.life || arc.x < -0.15 * W || arc.x > 1.15 * W) arc = null;
    }

    /* ---------------- what a finger leaves behind ----------------
       Light falls where the pointer goes and lifts away. Kept sparse and
       short lived: a trail that lingers stops reading as dust and starts
       reading as a brush. */
    const TRAIL_MAX = 30;
    const trail = [];

    function dropDust(x, y, vx) {
      for (let i = 0, n = 2 + (Math.random() < 0.5 ? 1 : 0); i < n; i++) {
        if (trail.length >= TRAIL_MAX) return;
        const star = Math.random() < 0.3;
        trail.push({
          x: x + rand(-7, 7), y: y + rand(-7, 7),
          vx: vx * rand(0.05, 0.22) + rand(-11, 11),
          vy: rand(-34, -9),
          r: star ? rand(2.8, 5.4) : rand(1.8, 4.6),
          star: star, img: star ? FOIL : pick(BOKEH),
          rot: rand(0, TAU), spin: rand(-2.2, 2.2),
          t: 0, life: rand(0.8, 1.5), a: rand(0.68, 1),
        });
      }
    }

    /* ---------------- a touch on the grass ----------------
       A ring of warm light opening outwards, and the fireflies that were
       sitting in that patch going up all at once. */
    const BURST_MAX = 40, RING_MAX = 3;
    const burst = [], rings = [];

    function startle(px, py) {
      if (rings.length < RING_MAX) rings.push({ x: px, y: py, t: 0, life: 0.95 });

      const n = 12 + ((Math.random() * 7) | 0);      /* 12 to 18 */
      for (let i = 0; i < n; i++) {
        if (burst.length >= BURST_MAX) break;
        const a = rand(0, TAU);
        /* Thrown out, then the air takes it, and what is left is the
           climb. */
        const sp = rand(90, 320);
        const star = Math.random() < 0.35;
        burst.push({
          x: px + rand(-5, 5), y: py + rand(-5, 5),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp * 0.78 - rand(20, 70),
          r: star ? rand(2.6, 6.2) : rand(2, 8),
          star: star, img: star ? FOIL : pick(BOKEH),
          rot: rand(0, TAU), spin: rand(-3.4, 3.4),
          t: 0, life: rand(1.5, 2.6), a: rand(0.7, 1),
          bw: rand(3, 7), ph: rand(0, TAU),
        });
      }
    }

    function drawFlecks(list, dt, t) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.t += dt;
        if (p.t >= p.life) { list.splice(i, 1); continue; }
        /* Drag, then lift. The first build halved the speed every tenth
           of a second, which stopped the whole burst dead on the spot it
           was thrown from and left a smudge rather than a scatter. At
           this rate the speed halves in about four fifths of a second, so
           the throw carries and then the climb takes over. */
        const k = Math.pow(0.42, dt);
        p.vx *= k; p.vy *= k;
        p.vy -= 30 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.spin * dt;

        const u = p.t / p.life;
        const fade = u < 0.10 ? u / 0.10 : Math.max(0, (1 - u) / 0.9);
        const tw = p.bw ? (0.55 + 0.45 * Math.sin(t * p.bw + p.ph)) : 1;
        ctx.globalAlpha = p.a * fade * tw;
        const R = p.r * (p.star ? 2.4 : 2.6);
        if (p.star) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.drawImage(p.img, -R, -R, R * 2, R * 2);
          ctx.restore();
        } else {
          ctx.drawImage(p.img, p.x - R, p.y - R, R * 2, R * 2);
        }
      }
    }

    function drawRings(dt) {
      for (let i = rings.length - 1; i >= 0; i--) {
        const g = rings[i];
        g.t += dt;
        if (g.t >= g.life) { rings.splice(i, 1); continue; }
        const u = g.t / g.life;
        /* Fast out of the gate and easing to a stop, which is how a ring
           on water opens. */
        const e = 1 - Math.pow(1 - u, 3);
        const R = 6 + e * Math.min(135, Math.max(W, H) * 0.12);
        ctx.globalAlpha = (1 - u) * (1 - u) * 0.72;
        ctx.strokeStyle = 'rgba(255,221,150,1)';
        ctx.lineWidth = Math.max(0.7, 4.2 * (1 - u));
        ctx.beginPath();
        ctx.arc(g.x, g.y, R, 0, TAU);
        ctx.stroke();
        /* A second, fainter ring just behind it, so the water has depth. */
        ctx.globalAlpha = (1 - u) * (1 - u) * 0.3;
        ctx.lineWidth = Math.max(0.5, 1.8 * (1 - u));
        ctx.beginPath();
        ctx.arc(g.x, g.y, R * 0.72, 0, TAU);
        ctx.stroke();
      }
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
      /* Added to the painting rather than laid over it, so the light sits
         in the grass and on the brick instead of greying them. */
      ctx.globalCompositeOperation = 'lighter';

      drawLights(dt, clock);
      drawArc(dt);
      drawFlecks(trail, dt, clock);
      drawFlecks(burst, dt, clock);
      drawRings(dt);

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
        trail.length = 0; burst.length = 0; rings.length = 0; arc = null;
      }
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

    /* The trail follows the pointer whether or not anything is held down,
       read from the window so it keeps up across the whole page, and
       dropped the moment it crosses a control. */
    let lastDust = 0, lastMX = 0;
    addEventListener('pointermove', e => {
      if (!active || reduce || !running) return;
      if (onChrome(e)) { lastMX = e.clientX; return; }
      const now = performance.now();
      if (now - lastDust < 16) return;
      lastDust = now;
      dropDust(e.clientX, e.clientY, e.clientX - lastMX);
      lastMX = e.clientX;
    }, { passive: true });

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
        if (moved <= 8 && !reduce && !onChrome(e)) {
          startle(e.clientX, e.clientY);
          hideHint();
        }
      };
      s3.addEventListener('pointerup', up);
      s3.addEventListener('pointercancel', () => { id = null; });
    })();

    /* Assistive software can raise a click that no pointer produced. That
       one is a real press and still deserves its fireflies. */
    s3.addEventListener('click', e => {
      if (!active || reduce || e.detail !== 0 || onChrome(e)) return;
      startle(e.clientX || W / 2, e.clientY || H / 2);
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
      seedLights(true);
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
        seedLights(true);
        arc = null; nextArc = rand(2.5, 5);
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
