(function() {
        function handleFirstTab(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
                window.removeEventListener('keydown', handleFirstTab);
                window.addEventListener('mousedown', handleMouseDownOnce);
            }
        }
        function handleMouseDownOnce() {
            document.body.classList.remove('user-is-tabbing');
            window.removeEventListener('mousedown', handleMouseDownOnce);
            window.addEventListener('keydown', handleFirstTab);
        }
        window.addEventListener('keydown', handleFirstTab);
    })();
;
(function() {
        var uid  = 'hm-1';
        var cbId = 'hm-1-cb';

        function init() {
            var wrap   = document.getElementById(uid);
            var cb     = document.getElementById(cbId);
            var header = wrap ? wrap.querySelector('.hm-header') : null;
            if (!wrap || !cb || !header) return;

            /* 1. FIXED POSITIONERING + BODY PADDING-TOP */
			function applyFixed() {
				if (wrap.parentNode !== document.body) {
					document.body.appendChild(wrap);
				}
				var adminBar = document.getElementById('wpadminbar');
				var adminH   = adminBar ? adminBar.offsetHeight : 0;
				var topbar   = wrap.querySelector('.hm-topbar');
				var topbarH  = topbar ? topbar.offsetHeight : 0;

				/* WordPress voegt html { margin-top: 32px } toe bij ingelogde gebruikers.
				   Wij regelen de positie zelf via fixed + top, dus die margin moet weg. */
				if (adminH > 0) {
					document.documentElement.style.setProperty('margin-top', '0px', 'important');
				}

				wrap.style.cssText += ';position:fixed!important;top:' + adminH + 'px!important;left:0!important;right:0!important;z-index:999999!important;';
				document.body.style.paddingTop = (topbarH + header.offsetHeight + adminH) + 'px';
			}
            applyFixed();
            window.addEventListener('resize', applyFixed, { passive: true });

            /* 2. SCROLL-LOCK */
            var savedScrollY = 0;
            function isMobileMode() {
                return window.innerWidth <= 980 || wrap.classList.contains('hm-nav-overflow');
            }
            function lockScroll() {
                if (!isMobileMode()) return;
                savedScrollY = window.scrollY;
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top      = '-' + savedScrollY + 'px';
                document.body.style.left     = '0';
                document.body.style.right    = '0';
            }
            function unlockScroll() {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top      = '';
                document.body.style.left     = '';
                document.body.style.right    = '';
                window.scrollTo(0, savedScrollY);
                var topbar  = wrap.querySelector('.hm-topbar');
                var topbarH = topbar ? topbar.offsetHeight : 0;
                document.body.style.paddingTop = (topbarH + header.offsetHeight) + 'px';
            }
            cb.addEventListener('change', function() {
                if (cb.checked) { lockScroll(); } else { unlockScroll(); }
            });

            /* 3. SCROLL → transparant / wit */
            function onScroll() {
                wrap.classList.toggle('hm-scrolled', window.scrollY > 20);
            }
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();

            /* 4. TOP-LEVEL DROPDOWN HOVER (desktop) — simple + mega */
            var simpleTriggers = wrap.querySelectorAll('.hm-desk-item.hm-has-simple');
            var megaTriggers   = wrap.querySelectorAll('.hm-desk-item.hm-has-mega');
            var simpleTimer, megaTimer;

            function hideAllSimple() {
                simpleTriggers.forEach(function(t) {
                    var p = t.querySelector(':scope > .hm-simple-panel');
                    if (p) { p.classList.remove('hm-simple-panel--open'); p.setAttribute('aria-hidden', 'true'); }
                    t.classList.remove('hm-desk-item--active');
                });
            }
            function hideAllMega() {
                megaTriggers.forEach(function(t) {
                    var p = t.querySelector(':scope > .hm-mega-panel');
                    if (p) { p.classList.remove('hm-mega-panel--open'); p.setAttribute('aria-hidden', 'true'); }
                    t.classList.remove('hm-desk-item--active');
                });
                wrap.classList.remove('hm-mega-open');
            }
            function hideAll() { hideAllSimple(); hideAllMega(); }

            function showSimple(trigger) {
                hideAll();
                var panel = trigger.querySelector(':scope > .hm-simple-panel');
                if (!panel) return;
                panel.classList.add('hm-simple-panel--open');
                panel.setAttribute('aria-hidden', 'false');
                trigger.classList.add('hm-desk-item--active');
            }
            function showMega(trigger) {
                hideAll();
                var panel = trigger.querySelector(':scope > .hm-mega-panel');
                if (!panel) return;
                panel.classList.add('hm-mega-panel--open');
                panel.setAttribute('aria-hidden', 'false');
                trigger.classList.add('hm-desk-item--active');
                wrap.classList.add('hm-mega-open');
            }

            simpleTriggers.forEach(function(trigger) {
                trigger.addEventListener('mouseenter', function() { clearTimeout(simpleTimer); clearTimeout(megaTimer); showSimple(trigger); });
                trigger.addEventListener('mouseleave', function() {
                    simpleTimer = setTimeout(function() { if (!trigger.matches(':hover')) hideAll(); }, 80);
                });
            });
            megaTriggers.forEach(function(trigger) {
                trigger.addEventListener('mouseenter', function() { clearTimeout(megaTimer); clearTimeout(simpleTimer); showMega(trigger); });
                trigger.addEventListener('mouseleave', function() {
                    megaTimer = setTimeout(function() { if (!trigger.matches(':hover')) hideAll(); }, 120);
                });
            });

            /* 5. KLIK BUITEN → sluit alles */
            document.addEventListener('click', function(e) {
                if (!wrap.contains(e.target)) hideAll();
            });

            /* 6. OVERFLOW DETECTIE */
            var deskNav  = wrap.querySelector('.hm-desk-nav');
            var deskList = wrap.querySelector('.hm-desk-list');
            var overflowActive = false;

            function checkNavOverflow() {
                if (window.innerWidth <= 980) {
                    if (overflowActive) {
                        wrap.classList.remove('hm-nav-overflow');
                        overflowActive = false;
                        cb.checked = false;
                        unlockScroll();
                        applyFixed();
                    }
                    return;
                }
                if (!deskNav || !deskList) return;
                if (overflowActive) { wrap.classList.remove('hm-nav-overflow'); void header.offsetWidth; }

                var headerRect = header.getBoundingClientRect();
                var listRect   = deskList.getBoundingClientRect();
                var logoEl     = header.querySelector('.hm-logo');
                var logoRect   = logoEl ? logoEl.getBoundingClientRect() : null;

                var tooWide   = listRect.right > headerRect.right + 2;
                var tooNarrow = logoRect && (listRect.left < logoRect.right + 16);
                var nowOverflow = tooWide || tooNarrow;

                if (nowOverflow === overflowActive) {
                    if (overflowActive) wrap.classList.add('hm-nav-overflow');
                    return;
                }
                overflowActive = nowOverflow;
                if (nowOverflow) {
                    wrap.classList.add('hm-nav-overflow');
                    hideAll();
                } else {
                    cb.checked = false;
                    unlockScroll();
                }
                applyFixed();
            }

            window.addEventListener('resize', checkNavOverflow, { passive: true });
            checkNavOverflow();
            window.addEventListener('load', checkNavOverflow);

            /* 7. MOBIEL ACCORDION
                  JS is leidend voor de status. De checkbox blijft bestaan als
                  fallback zonder JS en wordt door de klik-handler bijgewerkt.
                  Hoogte loopt via de custom property --hm-sub-h, zodat een
                  inline waarde de !important-regel in de CSS kan overrulen. */

            function subPanel(li) {
                return li ? li.querySelector(':scope > .hm-sub-panel') : null;
            }
            function subCb(li) {
                return li ? li.querySelector(':scope > .hm-sub-cb') : null;
            }
            function subArrow(li) {
                var row = li ? li.querySelector(':scope > .hm-mob-row') : null;
                return row ? row.querySelector(':scope > .hm-mob-arrow') : null;
            }
            function setHeight(panel, value) {
                if (value === null) {
                    panel.style.removeProperty('--hm-sub-h');
                } else {
                    panel.style.setProperty('--hm-sub-h', value);
                }
            }

            /* Wacht op de transitie van dit paneel zelf, met timeout als vangnet.
               Zonder vangnet blijft een gemiste transitionend het paneel
               permanent op een vaste hoogte vastzetten. */
            function afterTransition(panel, done) {
                var finished = false;
                var timer;
                function finish() {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timer);
                    panel.removeEventListener('transitionend', onEnd);
                    done();
                }
                function onEnd(e) {
                    if (e.target !== panel || e.propertyName !== 'max-height') return;
                    finish();
                }
                timer = setTimeout(finish, 450);
                panel.addEventListener('transitionend', onEnd);
            }

            /* Ouder-panelen op 'none' zetten, anders clipt niveau 2/3 weg */
            function unclipParents(li) {
                var node = li.parentNode;
                while (node && node !== wrap) {
                    if (node.classList && node.classList.contains('hm-sub-panel')) {
                        node.style.removeProperty('--hm-sub-h');
                    }
                    node = node.parentNode;
                }
            }

            function scrollIntoPanel(li) {
                var scroller = wrap.querySelector('.hm-mob-scroll');
                var row      = li.querySelector(':scope > .hm-mob-row');
                var panel    = subPanel(li);
                if (!scroller || !row || !panel) return;

                var sRect = scroller.getBoundingClientRect();
                var rRect = row.getBoundingClientRect();
                var pRect = panel.getBoundingClientRect();
                var delta = 0;

                if (rRect.top < sRect.top + 8) {
                    delta = rRect.top - sRect.top - 8;
                } else if (pRect.bottom > sRect.bottom - 8) {
                    delta = Math.min(pRect.bottom - sRect.bottom + 8, rRect.top - sRect.top - 8);
                }
                if (delta !== 0) scroller.scrollTop += delta;
            }

            function openSub(li) {
                var panel  = subPanel(li);
                var box    = subCb(li);
                var arrow  = subArrow(li);
                li.classList.add('hm-sub-open');
                if (box) box.checked = true;
                if (arrow) arrow.setAttribute('aria-expanded', 'true');
                if (!panel) return;

                unclipParents(li);
                setHeight(panel, '0px');
                void panel.offsetHeight;
                setHeight(panel, panel.scrollHeight + 'px');

                afterTransition(panel, function() {
                    if (li.classList.contains('hm-sub-open')) {
                        setHeight(panel, null); /* class-regel geeft 'none' */
                        scrollIntoPanel(li);
                    }
                });
            }

            function closeSub(li) {
                var panel = subPanel(li);
                var box   = subCb(li);
                var arrow = subArrow(li);
                li.classList.remove('hm-sub-open');
                if (box) box.checked = false;
                if (arrow) arrow.setAttribute('aria-expanded', 'false');
                if (!panel) return;

                setHeight(panel, panel.scrollHeight + 'px');
                void panel.offsetHeight;
                setHeight(panel, '0px');

                afterTransition(panel, function() {
                    if (!li.classList.contains('hm-sub-open')) setHeight(panel, null);
                });
            }

            function closeSiblings(li) {
                var list = li.parentNode;
                if (!list) return;
                var items = list.children;
                for (var i = 0; i < items.length; i++) {
                    if (items[i] !== li && items[i].classList.contains('hm-sub-open')) {
                        closeSub(items[i]);
                    }
                }
            }

            /* Schone start: browsers bewaren checkbox-state bij een soft reload,
               dat gaf eerder een dichte lijst met een aangevinkte checkbox. */
            wrap.querySelectorAll('.hm-sub-cb').forEach(function(box) {
                var li = box.closest('li');
                if (!li) return;
                box.checked = false;
                li.classList.remove('hm-sub-open');
                var panel = subPanel(li);
                if (panel) setHeight(panel, null);
            });

            /* Klik op het pijltje: preventDefault voorkomt dat het label de
               checkbox nog een tweede keer toggelt (dubbele toggle op touch). */
            wrap.addEventListener('click', function(e) {
                var arrow = e.target.closest ? e.target.closest('.hm-mob-arrow') : null;
                if (!arrow || !wrap.contains(arrow)) return;

                var li = arrow.closest('li');
                if (!li || !subPanel(li)) return;

                e.preventDefault();
                e.stopPropagation();

                if (li.classList.contains('hm-sub-open')) {
                    closeSub(li);
                } else {
                    closeSiblings(li);
                    openSub(li);
                }
            });

            /* Fallback-sync: mocht de checkbox toch buiten de klik-handler om
               wijzigen, dan trekken we de zichtbare status gelijk. */
            wrap.addEventListener('change', function(e) {
                var box = e.target;
                if (!box.classList || !box.classList.contains('hm-sub-cb')) return;
                var li = box.closest('li');
                if (!li) return;
                var isOpen = li.classList.contains('hm-sub-open');
                if (box.checked && !isOpen)  { closeSiblings(li); openSub(li); }
                if (!box.checked && isOpen)  { closeSub(li); }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();
;
(function () {
        function sluitAlles( behalve ) {
            document.querySelectorAll( '.vacaturepad__nb-badge--open' ).forEach( function ( badge ) {
                if ( badge !== behalve ) {
                    badge.classList.remove( 'vacaturepad__nb-badge--open' );
                }
            } );
        }

        document.addEventListener( 'click', function ( e ) {
            var tegel = e.target.closest ? e.target.closest( '.vacaturepad__tegel--nb' ) : null;

            if ( ! tegel ) {
                sluitAlles( null );
                return;
            }

            var badge = tegel.querySelector( '.vacaturepad__nb-badge' );
            if ( ! badge ) {
                return;
            }

            e.preventDefault();
            sluitAlles( badge );
            badge.classList.toggle( 'vacaturepad__nb-badge--open' );
        } );

        // Toetsenbordbediening: enter of spatie op de tegel
        document.addEventListener( 'keydown', function ( e ) {
            if ( e.key !== 'Enter' && e.key !== ' ' ) {
                return;
            }
            var tegel = e.target.closest ? e.target.closest( '.vacaturepad__tegel--nb' ) : null;
            if ( ! tegel ) {
                return;
            }
            e.preventDefault();
            var badge = tegel.querySelector( '.vacaturepad__nb-badge' );
            if ( badge ) {
                sluitAlles( badge );
                badge.classList.toggle( 'vacaturepad__nb-badge--open' );
            }
        } );
    })();
;
(function () {
	'use strict';

	var AJAX  = "https:\/\/www.daar-om.nl\/wp-admin\/admin-ajax.php";
	var HOME  = "https:\/\/www.daar-om.nl\/";
	var modal = document.getElementById('do-s-modal');
	var back  = document.getElementById('do-s-back');
	if (!modal || !back) return;

	var q     = document.getElementById('do-s-q');
	var start = document.getElementById('do-s-start');
	var res   = document.getElementById('do-s-res');
	var xBtn  = document.getElementById('do-s-x');
	var count = document.getElementById('do-s-count');
	var hint  = document.getElementById('do-s-hint');

	if (modal.parentNode !== document.body) document.body.appendChild(modal);
	if (back.parentNode !== document.body) document.body.appendChild(back);

	var open = false, timer = null, ctrl = null, last = '', scrollTop = 0, sel = -1;

	var ARROW = '<span class="do-s-ar" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5.5l6.5 6.5-6.5 6.5"/></svg></span>';

	var ICONS = {
		page:     '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/>',
		post:     '<path d="M4 19.5V6a2 2 0 012-2h11a2 2 0 012 2v13.5"/><path d="M4 19.5h15"/><path d="M8 8.5h7M8 12h7M8 15.5h4"/>',
		vacature: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5"/><path d="M3 12.5h18"/>',
		person:   '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/>',
		site:     '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z"/>',
		case:     '<path d="M4 6.5h16v11H4z"/><path d="M8 17.5v2.5M16 17.5v2.5M9 11l2.2 2.2L15 9.5"/>'
	};

	function esc(s) {
		var d = document.createElement('div');
		d.textContent = s == null ? '' : String(s);
		return d.innerHTML;
	}

	function mark(text, term) {
		var safe = esc(text);
		var n = term.trim();
		if (n.length < 2) return safe;
		var rx = new RegExp('(' + esc(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
		return safe.replace(rx, '<mark>$1</mark>');
	}

	function tile(item, round) {
		var inner = item.thumb
			? '<img src="' + esc(item.thumb) + '" alt="" loading="lazy">'
			: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[item.icon] || ICONS.page) + '</svg>';
		return '<span class="do-s-thumb' + (round ? ' round' : '') + '" aria-hidden="true">' + inner + '</span>';
	}

	function pageUrl(term) {
		return HOME + '?s=' + encodeURIComponent(term);
	}

	function track(event, params) {
		window.dataLayer = window.dataLayer || [];
		var o = { event: event, search_instance: 'daarom_popup' };
		for (var k in params) { if (params.hasOwnProperty(k)) o[k] = params[k]; }
		window.dataLayer.push(o);
	}

	function show(e) {
		if (e) { e.preventDefault(); e.stopPropagation(); }
		if (open) return;
		open = true;

		scrollTop = window.scrollY || window.pageYOffset;
		document.body.classList.add('do-s-lock');
		back.classList.add('on');
		modal.classList.add('on');
		track('daarom_search_open', { page_path: location.pathname });

		setTimeout(function () { q.focus(); q.select(); }, 70);
	}

	function hide() {
		if (!open) return;
		open = false;
		track('daarom_search_close', { search_term: q.value.trim() });

		modal.classList.remove('on', 'busy');
		back.classList.remove('on');
		document.body.classList.remove('do-s-lock');
		window.scrollTo(0, scrollTop);

		if (ctrl) { ctrl.abort(); ctrl = null; }
		clearTimeout(timer);
		sel = -1;
	}

	var triggers = [];
	document.querySelectorAll('.js-do-search').forEach(function (el) { triggers.push(el); });
	document.querySelectorAll('a, button').forEach(function (el) {
		if (triggers.indexOf(el) !== -1) return;
		if (el.closest('#do-s-modal')) return;
		if (el.querySelector('.fa-magnifying-glass, .fa-search')) triggers.push(el);
	});
	triggers.forEach(function (el) {
		el.setAttribute('aria-haspopup', 'dialog');
		if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Zoeken');
		el.addEventListener('click', show);
	});

	function reset() {
		count.innerHTML = 'Zoek in blogs, cases, vacatures en pagina\'s';
		hint.textContent = 'of typ gewoon iets';
	}

	function onType() {
		var v = q.value.trim();
		sel = -1;
		clearTimeout(timer);

		if (v.length === 0) {
			if (ctrl) { ctrl.abort(); ctrl = null; }
			last = '';
			modal.classList.remove('busy');
			res.hidden = true;
			res.innerHTML = '';
			start.hidden = false;
			reset();
			return;
		}
		if (v.length < 2) return;

		timer = setTimeout(function () { search(v); }, 180);
	}

	function search(term) {
		if (term === last) return;
		last = term;

		start.hidden = true;
		res.hidden = false;
		modal.classList.add('busy');

		if (ctrl) ctrl.abort();
		ctrl = new AbortController();

		window.daaromLocalSearch(term)
			.then(function (data) {
				if (term !== last) return;
				modal.classList.remove('busy');
				paint(data, term);
			})
			.catch(function (err) {
				if (err && err.name === 'AbortError') return;
				modal.classList.remove('busy');
				res.innerHTML = '<div class="do-s-none"><div class="do-s-none-t">Zoeken lukte even niet</div><div class="do-s-none-s">Probeer het nog een keer.</div></div>';
			});
	}

	function paint(data, term) {
		var groups = (data && data.groups) || [];

		if (!groups.length) {
			res.innerHTML =
				'<div class="do-s-none">' +
					'<div class="do-s-none-t">Geen resultaten voor ' + esc(term) + '</div>' +
					'<div class="do-s-none-s">Probeer een korter of ander woord.</div>' +
				'</div>';
			count.innerHTML = 'Niets gevonden';
			hint.textContent = 'probeer het anders';
			track('daarom_search_query', { search_term: term, search_results: 0 });
			return;
		}

		var html = '';

		groups.forEach(function (g) {
			html += '<div class="do-s-sec">';
			html += '<div class="do-s-sec-h">' + esc(g.label) + '<i aria-hidden="true">.</i><span>' + g.items.length + '</span></div>';

			g.items.forEach(function (it) {
				html += '<a class="do-s-hit" href="' + esc(it.url) + '" data-title="' + esc(it.title) + '">' +
					tile(it, g.round) +
					'<span class="do-s-txt">' +
						'<span class="do-s-t">' + mark(it.title, term) + '</span>' +
						(it.meta ? '<span class="do-s-m">' + esc(it.meta) + '</span>' : '') +
					'</span>' +
					ARROW +
				'</a>';
			});

			html += '</div>';
		});

		html += '<a class="do-s-hit do-s-all" href="' + esc(pageUrl(term)) + '" data-title="alle resultaten">' +
			'<span class="do-s-txt"><span class="do-s-t">Alle resultaten voor ' + esc(term) + '</span></span>' +
			ARROW +
		'</a>';

		res.innerHTML = html;
		count.innerHTML = '<b>' + data.total + (data.total === 1 ? ' resultaat' : ' resultaten') + '</b> voor ' + esc(term);
		hint.textContent = 'enter voor alles';
		track('daarom_search_query', { search_term: term, search_results: data.total });
	}

	function rows() {
		var scope = res.hidden ? start : res;
		return Array.prototype.slice.call(scope.querySelectorAll('.do-s-hit'));
	}

	function move(step) {
		var list = rows();
		if (!list.length) return;
		list.forEach(function (el) { el.classList.remove('sel'); });
		sel += step;
		if (sel < 0) sel = list.length - 1;
		if (sel >= list.length) sel = 0;
		list[sel].classList.add('sel');
		list[sel].scrollIntoView({ block: 'nearest' });
	}

	document.addEventListener('keydown', function (e) {
		if (!open) return;
		if (e.key === 'Escape') { hide(); return; }
		if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return; }
		if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); return; }
		if (e.key === 'Enter') {
			var list = rows();
			if (sel >= 0 && list[sel]) { e.preventDefault(); list[sel].click(); return; }

			var v = q.value.trim();
			if (v.length >= 2) {
				e.preventDefault();
				track('daarom_search_submit', { search_term: v });
				window.location.href = pageUrl(v);
			}
		}
	});

	q.addEventListener('input', onType);
	xBtn.addEventListener('click', hide);
	back.addEventListener('click', hide);

	modal.addEventListener('click', function (e) {
		var sug = e.target.closest('.do-s-sug');
		if (sug) {
			e.preventDefault();
			q.value = sug.getAttribute('data-term') || '';
			track('daarom_search_suggestion', { search_term: q.value });
			onType();
			q.focus();
			return;
		}

		var hit = e.target.closest('.do-s-hit');
		if (hit && hit.getAttribute('href') && hit.getAttribute('href') !== '#') {
			track('daarom_search_click', {
				search_term: q.value.trim(),
				click_title: hit.getAttribute('data-title') || '',
				click_url:   hit.getAttribute('href')
			});
		}
	});

	window.addEventListener('pageshow', function () {
		open = false;
		modal.classList.remove('on', 'busy');
		back.classList.remove('on');
		document.body.classList.remove('do-s-lock');
		q.value = '';
		res.innerHTML = '';
		res.hidden = true;
		start.hidden = false;
		last = '';
		reset();
	});
})();