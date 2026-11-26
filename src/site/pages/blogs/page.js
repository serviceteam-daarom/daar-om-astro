(function() {
		var select = document.getElementById('blog-filter-select');
		if (!select) return;

		select.addEventListener('change', function() {
			var url  = new URL(window.location.href);
			var slug = this.value;

			url.searchParams.delete('paged');
			url.searchParams.delete('page');
			url.searchParams.delete('blog_paged');

			if (slug) {
				url.searchParams.set('blog_cat', slug);
			} else {
				url.searchParams.delete('blog_cat');
			}

			window.location.href = url.toString();
		});
	})();
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
(function () {
        var MOBILE   = '(max-width: 1024px)';
        var REDUCE   = '(prefers-reduced-motion: reduce)';
        var INTERVAL = 4000;
        var CLONES   = 3;
        var DRAG_MIN = 3;      // px voordat een klik als sleep telt

        function toArray(list) {
            return [].slice.call(list);
        }

        function bag() {
            var items = [];
            return {
                on: function (target, type, fn, opts) {
                    target.addEventListener(type, fn, opts);
                    items.push([target, type, fn]);
                },
                off: function () {
                    items.forEach(function (i) {
                        i[0].removeEventListener(i[1], i[2]);
                    });
                    items = [];
                }
            };
        }

        function capture(el, id) {
            if (!el.setPointerCapture) return;
            try { el.setPointerCapture(id); } catch (e) {}
        }

        function release(el, id) {
            if (!el.releasePointerCapture) return;
            try { el.releasePointerCapture(id); } catch (e) {}
        }

        /* Bolletjes zijn puur een weergave van de huidige index. Beide modi
           voeden dezelfde functie, zodat er geen tweede bron van waarheid
           bijkomt naast de loop-logica. */
        function syncDots(dots, index) {
            dots.forEach(function (d, i) {
                if (i === index) {
                    d.classList.add('is-active');
                    d.setAttribute('aria-current', 'true');
                } else {
                    d.classList.remove('is-active');
                    d.removeAttribute('aria-current');
                }
            });
        }

        function resetDots(dots) {
            dots.forEach(function (d) {
                d.classList.remove('is-active');
                d.removeAttribute('aria-current');
            });
        }

        /* ---------- Desktop: translateX + infinite loop + slepen ---------- */
        function initDesktop(wrap, viewport, track, dots) {
            var origTiles = toArray(track.querySelectorAll('.review-tile'));
            var n = origTiles.length;
            if (n < 3) return function () {};

            var ev      = bag();
            var clones  = [];
            var timer   = null;
            var rTimer  = null;
            var hovered = false;
            var pending = null;
            var drag    = null;
            var noClick = false;

            // Klonen voor de naadloze loop: zodra we in de kloon-zone
            // sliden, springen we instant terug naar het origineel.
            for (var i = 0; i < CLONES; i++) {
                var clone = origTiles[i % n].cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clones.push(clone);
                track.appendChild(clone);
            }
            var allTiles = toArray(track.querySelectorAll('.review-tile'));
            var last     = allTiles.length - 1;

            // Grenzen voor het slepen: binnen [MIN, MAX] heeft de actieve
            // tegel altijd links én rechts een buur, dus nooit een wit gat.
            var MIN = 1;
            var MAX = Math.min(n + 1, last - 1);

            // Kloon-afbeeldingen pas na de eerste page load ophalen, met lage
            // prioriteit. Kost niets van het kritieke laadpad en er is altijd
            // minstens n * INTERVAL ms speling voordat de loop ze nodig heeft.
            function preloadClones() {
                clones.forEach(function (c) {
                    var img = c.querySelector('img');
                    if (!img) return;
                    img.loading = 'eager';
                    if ('fetchPriority' in img) img.fetchPriority = 'low';
                });
            }
            if ('requestIdleCallback' in window) {
                requestIdleCallback(preloadClones, { timeout: 3000 });
            } else {
                setTimeout(preloadClones, 1500);
            }

            var current = 1;   // index van de .active tegel (= middelste van de 3)

            function metrics() {
                var gap = parseFloat(getComputedStyle(track).gap) || 0;
                var tileW = allTiles[0].offsetWidth;
                return {
                    wrapW: viewport.offsetWidth,
                    tileW: tileW,
                    step:  tileW + gap
                };
            }

            function txFor(index, m) {
                return (m.wrapW / 2) - (index * m.step) - (m.tileW / 2);
            }

            function indexFor(tx, m) {
                return ((m.wrapW / 2) - (m.tileW / 2) - tx) / m.step;
            }

            function clampIndex(i) {
                return Math.max(MIN, Math.min(MAX, i));
            }

            // Kloon op positie n is origineel 0, n+1 is origineel 1, enz.
            function normalize(i) {
                while (i > n) i -= n;
                while (i < 1) i += n;
                return i;
            }

            function paint(index) {
                var safe = Math.max(0, Math.min(last, index));
                allTiles.forEach(function (t) { t.classList.remove('active'); });
                allTiles[safe].classList.add('active');
                syncDots(dots, ((safe % n) + n) % n);
            }

            function clearPending() {
                if (!pending) return;
                track.removeEventListener('transitionend', pending.end);
                clearTimeout(pending.timer);
                pending = null;
            }

            // transitionend bubbelt en losse tegels hebben ook een transform-
            // transitie, dus filteren op de track zelf. De timeout is de
            // vangnet-variant voor het geval de transitie nooit start.
            function afterSlide(fn) {
                clearPending();
                var end = function (e) {
                    if (e.target !== track || e.propertyName !== 'transform') return;
                    clearPending();
                    fn();
                };
                var timerId = setTimeout(function () {
                    clearPending();
                    fn();
                }, 900);
                pending = { end: end, timer: timerId };
                track.addEventListener('transitionend', end);
            }

            function render(animate) {
                var m = metrics();
                if (!m.wrapW || !m.tileW) {
                    // Layout nog niet klaar (net terug van een bevroren
                    // achtergrond-tab). Niet doorzetten met een foute
                    // translateX, gewoon een frame later opnieuw proberen.
                    requestAnimationFrame(function () { render(animate); });
                    return;
                }

                if (!animate) {
                    // Niet alleen de track, ook elke tegel z'n eigen transitie
                    // stilzetten. Anders blijft een tegel die van .active
                    // wisselt over 0.6s door-animeren en zag je dat terugkomen
                    // als een oplichtend item bij de wrap.
                    track.style.transition = 'none';
                    allTiles.forEach(function (t) { t.style.transition = 'none'; });
                    track.offsetHeight;                 // force reflow
                }

                track.style.transform = 'translateX(' + txFor(current, m) + 'px)';
                paint(current);

                if (!animate) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            track.style.transition = '';
                            allTiles.forEach(function (t) { t.style.transition = ''; });
                        });
                    });
                }
            }

            // Naar target schuiven en daarna, buiten beeld, terugzetten naar
            // een index binnen [1, n]. Zo blijft de loop oneindig zonder dat
            // de kloon-zone ooit opraakt.
            function settle(target) {
                clearPending();
                current = target;
                render(true);

                var norm = normalize(current);
                if (norm === current) return;

                afterSlide(function () {
                    current = norm;
                    render(false);
                });
            }

            function next() {
                settle(current + 1);
            }

            function start() { if (!timer) timer = setInterval(next, INTERVAL); }
            function stop()  { clearInterval(timer); timer = null; }

            // Klik op een bolletje. Index 0 pakt de kloon op positie n in
            // plaats van het echte eerste item: daar zijn buren aan beide
            // kanten, dus geen gat naast de actieve tegel.
            function goTo(index) {
                var target = (index <= 0) ? n : index;
                if (target === current) return;

                settle(target);

                // Timer opnieuw zetten in plaats van uitschakelen, zodat je
                // niet direct na je klik alweer doorgeschoven wordt.
                stop();
                if (!hovered) start();
            }

            /* ---------- Slepen ---------- */

            function onDown(e) {
                if (drag) return;
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                var m = metrics();
                if (!m.step || !m.wrapW) return;

                clearPending();
                stop();

                drag = {
                    id:    e.pointerId,
                    x:     e.clientX,
                    m:     m,
                    from:  current,
                    tx:    txFor(current, m),
                    at:    null,
                    moved: false
                };
                wrap.classList.add('is-dragging');
            }

            function onMove(e) {
                if (!drag || e.pointerId !== drag.id) return;

                var dx = e.clientX - drag.x;

                if (!drag.moved) {
                    if (Math.abs(dx) < DRAG_MIN) return;
                    drag.moved = true;
                    capture(viewport, drag.id);

                    // Naar achteren slepen vanaf het eerste item zou links een
                    // gat tonen. De kloon een ronde verderop heeft dezelfde
                    // inhoud maar wél buren, dus daar springen we stil naartoe.
                    if (dx > 0 && drag.from <= MIN) {
                        current = Math.min(drag.from + n, MAX);
                        render(false);
                        drag.from = current;
                        drag.tx   = txFor(current, drag.m);
                    }
                }

                if (e.cancelable) e.preventDefault();

                var tx  = drag.tx + dx;
                var min = txFor(MAX, drag.m);
                var max = txFor(MIN, drag.m);
                if (tx < min) tx = min;
                if (tx > max) tx = max;

                drag.at = tx;
                track.style.transform = 'translateX(' + tx + 'px)';
                paint(Math.round(indexFor(tx, drag.m)));
            }

            function onUp(e) {
                if (!drag) return;
                if (e && e.pointerId !== drag.id) return;

                var d = drag;
                drag = null;
                wrap.classList.remove('is-dragging');
                release(viewport, d.id);

                if (!d.moved) {
                    if (!hovered) start();
                    return;
                }

                // Een sleep eindigt in een klik-event; die willen we niet
                // laten doorgaan naar links of knoppen in de tegel.
                noClick = true;
                setTimeout(function () { noClick = false; }, 0);

                var tx     = (d.at === null) ? d.tx : d.at;
                var shift  = tx - d.tx;                  // > 0 = naar rechts gesleept
                var target = clampIndex(Math.round(indexFor(tx, d.m)));

                // Korte, besliste sleep die net niet over de helft komt telt
                // toch als één stap in die richting.
                if (target === d.from && Math.abs(shift) > d.m.step * 0.12) {
                    target = clampIndex(d.from + (shift < 0 ? 1 : -1));
                }

                settle(target);
                if (!hovered) start();
            }

            function cancelDrag() {
                if (!drag) return;
                var d = drag;
                drag = null;
                wrap.classList.remove('is-dragging');
                release(viewport, d.id);
                render(false);
            }

            dots.forEach(function (d, i) {
                ev.on(d, 'click', function () { goTo(i); });
            });

            ev.on(viewport, 'pointerdown', onDown);
            ev.on(window,   'pointermove', onMove);
            ev.on(window,   'pointerup',   onUp);
            ev.on(window,   'pointercancel', cancelDrag);
            ev.on(viewport, 'dragstart', function (e) { e.preventDefault(); });
            ev.on(viewport, 'click', function (e) {
                if (!noClick) return;
                e.preventDefault();
                e.stopPropagation();
            }, true);

            ev.on(wrap, 'mouseenter', function () { hovered = true;  stop();  });
            ev.on(wrap, 'mouseleave', function () { hovered = false; if (!drag) start(); });

            ev.on(document, 'visibilitychange', function () {
                if (document.hidden) {
                    cancelDrag();
                    stop();
                } else {
                    clearPending();
                    render(false);
                    if (!hovered) start();
                }
            });

            ev.on(window, 'resize', function () {
                clearTimeout(rTimer);
                rTimer = setTimeout(function () {
                    if (drag) return;
                    render(false);
                }, 150);
            });

            render(false);
            start();
            wrap.classList.add('is-draggable');

            return function teardown() {
                stop();
                cancelDrag();
                clearPending();
                clearTimeout(rTimer);
                ev.off();
                wrap.classList.remove('is-draggable', 'is-dragging');
                clones.forEach(function (c) {
                    if (c.parentNode) c.parentNode.removeChild(c);
                });
                track.style.transform  = '';
                track.style.transition = '';
                origTiles.forEach(function (t) {
                    t.classList.remove('active');
                    t.style.transition = '';
                });
                resetDots(dots);
            };
        }

        /* ---------- Mobiel: native scroll + slepen + pijltjes + bolletjes ---------- */
        function initMobile(wrap, viewport, track, prev, next, dots) {
            var ev     = bag();
            var smooth = 'scrollBehavior' in document.documentElement.style;
            var reduce = window.matchMedia(REDUCE);
            var raf    = null;
            var drag   = null;
            var noClick = false;

            function tiles() {
                return toArray(track.querySelectorAll('.review-tile'));
            }

            function behavior() {
                return (smooth && !reduce.matches) ? 'smooth' : 'auto';
            }

            function step() {
                var tile = track.querySelector('.review-tile');
                if (!tile) return viewport.clientWidth;
                var gap = parseFloat(getComputedStyle(track).gap) || 0;
                return tile.offsetWidth + gap;
            }

            function scrollByStep(dir) {
                var d = dir * step();
                if (smooth) {
                    viewport.scrollBy({ left: d, behavior: behavior() });
                } else {
                    viewport.scrollLeft += d;
                }
            }

            // Tegel centreren. scroll-snap corrigeert daarna eventueel nog
            // een paar pixels, dus dit hoeft niet exact te zijn.
            function scrollToIndex(index) {
                var tile = tiles()[index];
                if (!tile) return;
                var target = tile.offsetLeft - ((viewport.clientWidth - tile.offsetWidth) / 2);
                if (target < 0) target = 0;
                if (smooth) {
                    viewport.scrollTo({ left: target, behavior: behavior() });
                } else {
                    viewport.scrollLeft = target;
                }
            }

            function activeIndex() {
                var center = viewport.scrollLeft + (viewport.clientWidth / 2);
                var best   = 0;
                var bestD  = Infinity;
                tiles().forEach(function (t, i) {
                    var d = Math.abs((t.offsetLeft + (t.offsetWidth / 2)) - center);
                    if (d < bestD) {
                        bestD = d;
                        best  = i;
                    }
                });
                return best;
            }

            function update() {
                var max = viewport.scrollWidth - viewport.clientWidth;
                prev.disabled = viewport.scrollLeft <= 2;
                next.disabled = viewport.scrollLeft >= (max - 2);
                syncDots(dots, activeIndex());
            }

            function onScroll() {
                if (raf) return;
                raf = requestAnimationFrame(function () {
                    raf = null;
                    update();
                });
            }

            /* Vinger-swipe doet de browser zelf. Dit is puur voor de muis,
               zodat een smal desktopvenster ook sleepbaar is. */
            function onDown(e) {
                if (e.pointerType !== 'mouse' || e.button !== 0) return;
                drag = {
                    id:    e.pointerId,
                    x:     e.clientX,
                    from:  viewport.scrollLeft,
                    moved: false
                };
            }

            function onMove(e) {
                if (!drag || e.pointerId !== drag.id) return;
                var dx = e.clientX - drag.x;
                if (!drag.moved) {
                    if (Math.abs(dx) < DRAG_MIN) return;
                    drag.moved = true;
                    capture(viewport, drag.id);
                    wrap.classList.add('is-dragging');
                }
                if (e.cancelable) e.preventDefault();
                viewport.scrollLeft = drag.from - dx;
            }

            function onUp(e) {
                if (!drag) return;
                if (e && e.pointerId !== drag.id) return;
                var d = drag;
                drag = null;
                release(viewport, d.id);
                if (!d.moved) return;

                wrap.classList.remove('is-dragging');
                noClick = true;
                setTimeout(function () { noClick = false; }, 0);
                scrollToIndex(activeIndex());
            }

            dots.forEach(function (d, i) {
                ev.on(d, 'click', function () { scrollToIndex(i); });
            });

            ev.on(prev, 'click', function () { scrollByStep(-1); });
            ev.on(next, 'click', function () { scrollByStep(1); });
            ev.on(viewport, 'scroll', onScroll, { passive: true });
            ev.on(window, 'resize', update);

            ev.on(viewport, 'pointerdown', onDown);
            ev.on(window,   'pointermove', onMove);
            ev.on(window,   'pointerup',   onUp);
            ev.on(window,   'pointercancel', onUp);
            ev.on(viewport, 'dragstart', function (e) { e.preventDefault(); });
            ev.on(viewport, 'click', function (e) {
                if (!noClick) return;
                e.preventDefault();
                e.stopPropagation();
            }, true);

            wrap.classList.add('is-interactive', 'is-draggable');
            update();

            return function teardown() {
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                if (drag) {
                    release(viewport, drag.id);
                    drag = null;
                }
                ev.off();
                wrap.classList.remove('is-interactive', 'is-draggable', 'is-dragging');
                prev.disabled = false;
                next.disabled = false;
                viewport.scrollLeft = 0;
                resetDots(dots);
            };
        }

        function setup(wrap) {
            var viewport = wrap.querySelector('.reviews-viewport');
            var track    = wrap.querySelector('.reviews-track');
            var prev     = wrap.querySelector('.reviews-nav__btn--prev');
            var next     = wrap.querySelector('.reviews-nav__btn--next');
            var dots     = toArray(wrap.querySelectorAll('.reviews-dots__btn'));
            if (!viewport || !track || !prev || !next) return;

            var count = track.querySelectorAll('.review-tile').length;
            if (count < 3) return;
            if (dots.length !== count) dots = [];   // markup en tegels lopen uiteen

            if (dots.length) wrap.classList.add('has-dots');

            var mq      = window.matchMedia(MOBILE);
            var current = null;
            var mode    = null;

            function apply() {
                var wanted = mq.matches ? 'mobile' : 'desktop';
                if (wanted === mode) return;
                if (current) current();
                mode    = wanted;
                current = (wanted === 'mobile')
                    ? initMobile(wrap, viewport, track, prev, next, dots)
                    : initDesktop(wrap, viewport, track, dots);
            }

            apply();

            if (mq.addEventListener) {
                mq.addEventListener('change', apply);
            } else if (mq.addListener) {
                mq.addListener(apply);
            }
        }

        function run() {
            toArray(document.querySelectorAll('.reviews-carousel')).forEach(setup);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
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