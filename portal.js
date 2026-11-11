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
