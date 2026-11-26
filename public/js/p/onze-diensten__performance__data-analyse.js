(function() {
        var uid  = 'hm-2';
        var cbId = 'hm-2-cb';

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
(function() {
        var uid  = 'hm-3';
        var cbId = 'hm-3-cb';

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
document.addEventListener('DOMContentLoaded', function () {
            var carouselSelector = '.medewerkers-carousel-6b08936021f24';
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