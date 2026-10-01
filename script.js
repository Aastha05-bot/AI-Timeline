// Loads data.json and builds the timeline. Edit data.json to change the content.
(function () {
  var track = document.getElementById('track');
  var detail = document.getElementById('detail');
  var dTitle = document.getElementById('d-title');
  var dYear = document.getElementById('d-year');
  var dText = document.getElementById('d-text');
  var dImg = document.getElementById('d-img');
  var prev = document.getElementById('prev');
  var next = document.getElementById('next');

  var allEvents = [];   // flat list, index matches each dot's data-i
  var dots = [];
  var pages = [];
  var current = -1;     // selected event index
  var page = 0;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // one label item (title or year) placed above or below the line
  function item(pos, kind, text) {
    var d = el('div', 'item ' + pos + ' ' + (kind === 'title' ? 'stub' : 'plain'));
    d.appendChild(el('p', kind === 'title' ? 'text' : 'year', text));
    return d;
  }

  function buildSection(section, sIndex) {
    var sec = el('section', 'page' + (sIndex === 0 ? ' active' : ''));
    sec.setAttribute('aria-label', 'Part ' + (sIndex + 1));
    var ol = el('ol', 'events');
    ol.style.setProperty('--cols', section.events.length);

    section.events.forEach(function (ev, i) {
      var idx = allEvents.length;
      allEvents.push(ev);

      var li = el('li', 'event');
      var up = i % 2 === 0;                       // alternate: title above / year above
      var wrap = el('div', 'dotwrap');
      var dot = el('button', 'dot');
      dot.setAttribute('aria-expanded', 'false');
      dot.setAttribute('aria-label', ev.year + ': ' + ev.title);
      dot.setAttribute('data-i', idx);
      dot.addEventListener('click', function () { openDetail(idx); });
      wrap.appendChild(dot);
      dots.push(dot);

      li.appendChild(up ? item('up', 'title', ev.title) : item('up', 'year', ev.year));
      li.appendChild(wrap);
      li.appendChild(up ? item('down', 'year', ev.year) : item('down', 'title', ev.title));
      ol.appendChild(li);
    });

    ol.addEventListener('scroll', placePointer);
    sec.appendChild(ol);
    track.appendChild(sec);
    pages.push(sec);
  }

  function placePointer() {
    if (current < 0) return;
    var d = dots[current].getBoundingClientRect();
    var t = track.getBoundingClientRect();
    var w = detail.offsetWidth;
    var x = d.left + d.width / 2 - t.left;
    var left = Math.max(0, Math.min(t.width - w, x - w / 2));
    detail.style.left = left + 'px';
    detail.style.setProperty('--px', Math.max(14, Math.min(w - 14, x - left)) + 'px');
  }

  function closeDetail() {
    current = -1;
    detail.classList.remove('open');
    dots.forEach(function (d) {
      d.setAttribute('aria-expanded', 'false');
      d.closest('.event').classList.remove('sel');
    });
  }

  function openDetail(n) {
    if (current === n) { closeDetail(); return; }
    current = n;
    var e = allEvents[n];
    dTitle.textContent = e.title;
    dYear.textContent = e.year;
    dText.textContent = e.description;
    if (e.image) { dImg.hidden = false; dImg.alt = e.title; dImg.src = e.image; }
    else { dImg.hidden = true; dImg.removeAttribute('src'); }
    detail.classList.add('open');
    dots.forEach(function (d, idx) {
      d.setAttribute('aria-expanded', idx === n ? 'true' : 'false');
      d.closest('.event').classList.toggle('sel', idx === n);
    });
    placePointer();
  }

  function show(n) {
    page = n;
    closeDetail();
    pages.forEach(function (p, idx) { p.classList.toggle('active', idx === page); });
    prev.disabled = page === 0;
    next.disabled = page === pages.length - 1;
  }

  dImg.onload = function () {
    dImg.classList.toggle('wide', dImg.naturalWidth > dImg.naturalHeight * 1.2);
  };
  dImg.onerror = function () { dImg.hidden = true; }; // missing image: text only

  prev.addEventListener('click', function () { if (page > 0) show(page - 1); });
  next.addEventListener('click', function () { if (page < pages.length - 1) show(page + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' && page > 0) show(page - 1);
    if (e.key === 'ArrowRight' && page < pages.length - 1) show(page + 1);
    if (e.key === 'Escape') closeDetail();
  });
  window.addEventListener('resize', placePointer);

  fetch('data.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (data.title) {
        document.getElementById('title').textContent = data.title;
        document.title = data.title;
      }
      data.sections.forEach(buildSection);
      show(0);
    })
    .catch(function () {
      var m = el('p', 'load-error',
        'Could not load data.json. Open this page through a web server (for example run "python3 -m http.server" in this folder) instead of double-clicking the file.');
      track.appendChild(m);
    });
})();
