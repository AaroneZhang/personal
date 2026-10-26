/* Personal site — theme toggle + scroll reveal */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var KEY = 'site-theme';

  function apply(theme) {
    root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var label = theme === 'dark' ? 'Light mode' : 'Dark mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.textContent = theme === 'dark' ? '\u2600' : '\u263E'; // sun / moon
    });
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var prefersLight = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  apply(saved || (prefersLight ? 'light' : 'dark'));

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  });

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Album: auto-slides while idle, but is fully manual-scrollable (drag / swipe / wheel)
  (function initAlbum() {
    document.querySelectorAll('.album-track').forEach(function (track) {
      if (track.getAttribute('data-auto') === '1') return;
      var items = Array.prototype.slice.call(track.children);
      if (!items.length) return;
      track.setAttribute('data-auto', '1');

      // Duplicate the set once so the auto-slide can loop seamlessly
      items.forEach(function (it) { track.appendChild(it.cloneNode(true)); });

      var speed = 0.6;        // px per animation frame (~36 px/s)
      var resumeMs = 1500;    // resume auto-slide after this much idle time
      var pausedUntil = 0;
      var dragging = false;

      function seam() { return track.scrollWidth / 2; }

      function step() {
        if (!dragging && Date.now() >= pausedUntil) {
          var s = seam();
          if (s > 0) {
            track.scrollLeft += speed;
            if (track.scrollLeft >= s) track.scrollLeft -= s;
          }
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      var downX = 0, startScroll = 0, moved = 0;
      function hold() { pausedUntil = Date.now() + resumeMs; }

      // Mouse drag-to-scroll
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button === 0) {
          dragging = true; downX = e.clientX; startScroll = track.scrollLeft; moved = 0;
          track.classList.add('dragging');
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          e.preventDefault();
        } else {
          hold();
        }
      });
      function onMove(e) {
        if (!dragging) return;
        var dx = e.clientX - downX;
        moved = Math.max(moved, Math.abs(dx));
        track.scrollLeft = startScroll - dx;
      }
      function onUp() {
        if (!dragging) return;
        dragging = false;
        track.classList.remove('dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        pausedUntil = Date.now() + resumeMs;
      }
      // If the pointer actually dragged, don't open the image link on release
      track.addEventListener('click', function (e) {
        if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
        moved = 0;
      }, true);
      // Stop the browser's native image ghost-drag while dragging
      track.addEventListener('dragstart', function (e) { e.preventDefault(); });

      // Wheel / trackpad — pause the auto-slide and let the browser scroll
      track.addEventListener('wheel', function () { hold(); }, { passive: true });
      // Touch swipe — pause while touching
      track.addEventListener('touchstart', function () { hold(); }, { passive: true });
      track.addEventListener('touchmove', function () { hold(); }, { passive: true });
      track.addEventListener('touchend', function () { pausedUntil = Date.now() + resumeMs; }, { passive: true });
    });
  })();
})();
