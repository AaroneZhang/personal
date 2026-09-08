/* Personal site — live stats: today's visits + visitor IP/location */
(function () {
  var ctrl; // abort controller for timeouts
  function request(url) {
    if ('AbortController' in window) {
      var c = new AbortController();
      setTimeout(function () { c.abort(); }, 7000);
      return fetch(url, { signal: c.signal, cache: 'no-store' });
    }
    return fetch(url, { cache: 'no-store' });
  }

  var isZh = (document.documentElement.lang || '').indexOf('zh') === 0;

  /* ---------- Visitor IP + location ---------- */
  var ipEl = document.querySelector('[data-ip]');
  var locEl = document.querySelector('[data-location]');
  if (ipEl) {
    function applyInfo(d) {
      if (d && d.ip && ipEl) ipEl.textContent = d.ip;
      if (locEl && d) {
        var parts = [];
        if (d.city) parts.push(d.city);
        else if (d.region) parts.push(d.region);
        if (d.country) parts.push(d.country);
        locEl.textContent = parts.length ? parts.join(', ') : '—';
      }
    }
    request('https://ipinfo.io/json')
      .then(function (r) { return r.json(); })
      .then(applyInfo)
      .catch(function () {
        return request('https://ipwho.is/')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d && d.success === false) throw new Error('ipwho failed');
            return { ip: d.ip, city: d.city, region: d.region, country: d.country, country_code: d.country_code };
          })
          .then(applyInfo)
          .catch(function () { if (ipEl) ipEl.textContent = isZh ? '未知' : 'unknown'; });
      });
  }

  /* ---------- Today's visits (Tallywire, date-keyed, deduped per device per day) ---------- */
  var visitEl = document.querySelector('[data-visits-today]');
  if (visitEl) {
    var ns = 'aaronezhang-site';
    var today = (function () {
      var d = new Date();
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    })();
    var key = 'visits-' + today;
    var dedupeKey = 'visited-' + today;

    var countedToday = null;
    try { countedToday = localStorage.getItem(dedupeKey); } catch (e) {}
    var url;
    if (countedToday) {
      url = 'https://tallywire.cronpulse.workers.dev/get/' + ns + '/' + key;
    } else {
      url = 'https://tallywire.cronpulse.workers.dev/hit/' + ns + '/' + key;
    }

    request(url)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (typeof d.value === 'number') visitEl.textContent = d.value;
        if (!countedToday && d.counted) { try { localStorage.setItem(dedupeKey, '1'); } catch (e) {} }
      })
      .catch(function () {
        // Fallback: local-only count for today (labeled so it's not mistaken for site-wide)
        try {
          var lk = 'localToday-' + today;
          var c = parseInt(localStorage.getItem(lk) || '0', 10);
          if (!localStorage.getItem(dedupeKey)) { c += 1; localStorage.setItem(lk, String(c)); }
          visitEl.textContent = c + (isZh ? '（本机）' : ' (local)');
        } catch (e) {
          visitEl.textContent = '—';
        }
      });
  }
})();
