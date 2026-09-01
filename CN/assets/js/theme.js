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
})();
