/* Kleine vervanger voor de Divi- en WordPress-runtime: accordeons, demo-formulieren en zoeken. */
(function () {
  'use strict';
  var BASE = '/daar-om-astro/';

  // Divi accordeon/toggle
  document.addEventListener('click', function (e) {
    var title = e.target.closest('.et_pb_toggle_title, .et_pb_toggle .et_pb_toggle_title');
    if (!title) return;
    var item = title.closest('.et_pb_toggle');
    if (!item) return;
    var open = item.classList.contains('et_pb_toggle_open');
    var acc = item.closest('.et_pb_accordion');
    if (acc) {
      acc.querySelectorAll('.et_pb_toggle_open').forEach(function (el) {
        el.classList.remove('et_pb_toggle_open');
        el.classList.add('et_pb_toggle_close');
      });
    }
    item.classList.toggle('et_pb_toggle_open', !open);
    item.classList.toggle('et_pb_toggle_close', open);
  });

  // Formulieren zijn in deze demo niet gekoppeld aan Gravity Forms
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.matches('[data-demo-form]')) return;
    e.preventDefault();
    if (f.querySelector('.demo-form-note')) return;
    var n = document.createElement('p');
    n.className = 'demo-form-note';
    n.textContent = 'Dit is een snelheidsdemo: formulieren zijn hier niet gekoppeld. Gebruik daar-om.nl om echt contact op te nemen.';
    f.appendChild(n);
  });

  // Ingesloten kaart pas laden na klik
  document.addEventListener('click', function (e) {
    var w = e.target.closest('.demo-embed-wrap');
    if (!w || w.classList.contains('is-loaded')) return;
    var f = w.querySelector('iframe[data-demo-src]');
    if (f) { f.src = f.getAttribute('data-demo-src'); w.classList.add('is-loaded'); }
  });

  // Statische zoekindex in plaats van admin-ajax
  var index = null;
  window.daaromLocalSearch = function (term) {
    var get = index ? Promise.resolve(index) : fetch(BASE + 'search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; return d; });
    return get.then(function (all) {
      var t = term.toLowerCase();
      var hits = all.filter(function (it) { return it.title.toLowerCase().indexOf(t) !== -1; });
      var labels = { page: "Pagina's", post: 'Blogs', case: 'Cases', vacature: 'Vacatures' };
      var groups = [];
      ['page', 'case', 'post', 'vacature'].forEach(function (k) {
        var items = hits.filter(function (h) { return h.type === k; }).slice(0, 6)
          .map(function (h) { return { title: h.title, url: h.url, icon: k === 'case' ? 'case' : k }; });
        if (items.length) groups.push({ label: labels[k], items: items });
      });
      return { groups: groups, total: hits.length };
    });
  };
})();
