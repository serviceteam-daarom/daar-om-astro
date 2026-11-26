(function () {
  if (window.domTimelineInit) return;   // voorkomt dubbele listeners bij meerdere blokken
  window.domTimelineInit = true;

  var FILL_POINT = 0.6;   // vulpunt op 60% van de schermhoogte, lager = lijn loopt eerder vol
  var ticking = false;

  function update() {
    ticking = false;
    var timelines = document.querySelectorAll('.dom-timeline');

    for (var i = 0; i < timelines.length; i++) {
      var el = timelines[i];
      var rect = el.getBoundingClientRect();
      if (!rect.height) continue;

      var progress = (window.innerHeight * FILL_POINT - rect.top) / rect.height;
      el.style.setProperty('--dom-progress', Math.min(1, Math.max(0, progress)).toFixed(3));
    }
  }

  function request() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.dom-timeline').forEach(function (el) {
      el.style.setProperty('--dom-progress', 1);
    });
    return;
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', update);
  update();
})();
;
document.addEventListener('DOMContentLoaded', function () {
            var carouselSelector = '.medewerkers-carousel-6afe6bbabf749';
            var displayCount     = -1; // -1 = alle
            var minSlides        = 12; // genoeg slides voor een soepele, doorlopende loop

            var wrapper = document.querySelector(carouselSelector + ' .swiper-wrapper');
            if (wrapper) {
                var slides = Array.prototype.slice.call(wrapper.children);

                // 1) Fisher-Yates shuffle → willekeurige volgorde bij ELKE pageload
                for (var i = slides.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var tmp = slides[i];
                    slides[i] = slides[j];
                    slides[j] = tmp;
                }

                // 2) Willekeurige selectie wanneer een 'aantal' is ingesteld
                if (displayCount > 0 && displayCount < slides.length) {
                    slides = slides.slice(0, displayCount);
                }

                // 3) Aanvullen met clones zodat de loop niet hapert bij weinig slides
                var pool = slides.slice();
                var p = 0;
                while (slides.length < minSlides && pool.length > 0) {
                    slides.push(pool[p % pool.length].cloneNode(true));
                    p++;
                }

                // 4) Opnieuw plaatsen in de nieuwe (willekeurige) volgorde
                wrapper.innerHTML = '';
                slides.forEach(function (slide) {
                    wrapper.appendChild(slide);
                });
            }

            if (typeof Swiper === 'undefined') { return; }

            new Swiper(carouselSelector, {
                slidesPerView: 5.7,
                spaceBetween: 20,
                loop: true,
                loopAdditionalSlides: 15,   // meer clones = soepelere loop
                cssMode: false,             // cssMode breekt delay:0
                speed: 10000,               // rustige sliding-snelheid
                autoplay: {
                    delay: 0,               // geen pauze = continue beweging
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                },
                allowTouchMove: true,
                breakpoints: {
                    0:    { slidesPerView: 2.5, spaceBetween: 10 },
                    480:  { slidesPerView: 2.5, spaceBetween: 12 },
                    768:  { slidesPerView: 3.7, spaceBetween: 15 },
                    1024: { slidesPerView: 4.7, spaceBetween: 15 },
                    1480: { slidesPerView: 5.7, spaceBetween: 20 },
                },
            });
        });
;
(function() {
		function klaar(img) {
			var houder = img.closest('.blog-tegel-afbeelding');
			if (houder) houder.classList.add('is-loaded');
		}
		function init() {
			var imgs = document.querySelectorAll('.blog-tegel-afbeelding img');
			for (var i = 0; i < imgs.length; i++) {
				if (imgs[i].complete) {
					klaar(imgs[i]);
				} else {
					imgs[i].addEventListener('load', function() { klaar(this); }, { once: true });
					imgs[i].addEventListener('error', function() { klaar(this); }, { once: true });
				}
			}
		}
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			init();
		}
	})();
;
(function() {
		var wrapper = document.getElementById('blog-tegels-6afe6bbacbd2d');
		if (!wrapper) return;

		var container = wrapper.querySelector('.blog-tegels-container');
		var prevBtn   = wrapper.querySelector('.blog-tegels-prev');
		var nextBtn   = wrapper.querySelector('.blog-tegels-next');
		if (!container || !prevBtn || !nextBtn) return;

		function step() {
			var first = container.querySelector('.blog-tegel');
			if (!first) return 300;
			var gap = parseInt(window.getComputedStyle(container).gap, 10) || 20;
			return first.offsetWidth + gap;
		}

		function updateNavState() {
			var max = container.scrollWidth - container.clientWidth;
			if (max <= 1) {
				prevBtn.classList.add('is-disabled');
				nextBtn.classList.add('is-disabled');
				return;
			}
			prevBtn.classList.toggle('is-disabled', container.scrollLeft <= 1);
			nextBtn.classList.toggle('is-disabled', container.scrollLeft >= max - 1);
		}

		prevBtn.addEventListener('click', function() {
			container.scrollBy({ left: -step(), behavior: 'smooth' });
		});

		nextBtn.addEventListener('click', function() {
			container.scrollBy({ left: step(), behavior: 'smooth' });
		});

		container.addEventListener('scroll', updateNavState, { passive: true });
		window.addEventListener('resize', updateNavState);

		updateNavState();
		window.addEventListener('load', updateNavState);
	})();
;
(function () {
    'use strict';

    var toggle    = document.getElementById('fnp-toggle');
    var overlay   = document.getElementById('fnp-overlay');
    var debug     = false;
    var activated = false;

    if (!toggle || !overlay) return;

    /* Overlay naar <body> zodat een parent met transform/filter
       position:fixed niet kan breken */
    document.body.appendChild(overlay);

    toggle.addEventListener('change', function () {
        if (toggle.checked && !activated) activate();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') toggle.checked = false;
    });

    /* Zet een inerte scripttag om in een echte en voert hem uit */
    function run(node) {
        return new Promise(function (resolve) {
            var script = document.createElement('script');
            var type   = node.getAttribute('data-fnp-type');
            var src    = node.getAttribute('data-fnp-src');

            if (type) script.type = type;
            if (node.id) script.id = node.id;

            if (src) {
                script.src     = src;
                script.async   = false;
                script.onload  = resolve;
                script.onerror = resolve;
            } else {
                script.textContent = node.textContent;
            }

            node.parentNode.insertBefore(script, node);
            node.remove();

            if (!src) resolve();
        });
    }

    function focusFirstField() {
        var first = overlay.querySelector('input:not([type="hidden"]), textarea, select');
        if (first) first.focus();
    }

    function activate() {
        activated = true;

        document.querySelectorAll('link[data-fnp-style]').forEach(function (link) {
            link.media = 'all';
        });

        var external = Array.prototype.slice.call(document.querySelectorAll('script[data-fnp-src]'));
        var inline   = document.querySelectorAll('script[data-fnp-inline]');

        if (debug) {
            console.log('[fnp] activeren, extern:', external.length, 'inline:', inline.length);
        }

        /* Niets inert klaar? Dan laadde GF normaal en hoeft er alleen gefocust
           te worden. */
        if (!external.length && !inline.length) {
            focusFirstField();
            return;
        }

        /* Eerst de externe scripts op volgorde, dan het inline init-script */
        external.reduce(function (chain, node) {
            return chain.then(function () { return run(node); });
        }, Promise.resolve()).then(function () {
            inline.forEach(run);
            focusFirstField();
        });
    }
}());