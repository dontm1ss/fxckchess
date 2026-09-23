// Общие эффекты для всех страниц: плавный скролл, курсор, магнитные кнопки, появление блоков
(function() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---- Плавный скролл (Lenis). Если CDN недоступен — работает обычный скролл
    let lenis = null;
    if (!reduceMotion && typeof window.Lenis === 'function') {
        lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    }
    window.siteLenis = lenis;

    // Якорные ссылки — через плавный скролл, с отступом под шапку
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const id = link.getAttribute('href');
            const target = id === '#top' ? 0 : document.querySelector(id);
            if (target === null) return;
            e.preventDefault();
            const header = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 0;
            if (lenis) {
                lenis.scrollTo(target, { offset: target === 0 ? 0 : -header });
            } else {
                const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - header;
                window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
        });
    });

    // ---- Заголовки: разбиваем на слова для появления из-под маски
    let wordIndex = 0;
    document.querySelectorAll('[data-split]').forEach(function(el) {
        wordIndex = 0;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function(node) {
            const frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(function(part) {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                const outer = document.createElement('span');
                outer.className = 'sw';
                const inner = document.createElement('span');
                inner.textContent = part;
                inner.style.setProperty('--i', wordIndex++);
                outer.appendChild(inner);
                frag.appendChild(outer);
            });
            node.parentNode.replaceChild(frag, node);
        });
    });

    // ---- Появление при скролле
    const revealItems = document.querySelectorAll('[data-reveal], [data-split], [data-curtain]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        // Элемент со «шторкой» полностью обрезан clip-path, и браузер считает его невидимым,
        // поэтому для него следим за родителем
        const io = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    (entry.target._revealTarget || entry.target).classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
        revealItems.forEach(function(el) {
            if (el.hasAttribute('data-curtain') && el.parentElement) {
                el.parentElement._revealTarget = el;
                io.observe(el.parentElement);
            } else {
                io.observe(el);
            }
        });
    } else {
        revealItems.forEach(function(el) { el.classList.add('is-visible'); });
    }

    // Лёгкий каскад для соседних элементов списка
    document.querySelectorAll('.faq').forEach(function(list) {
        list.querySelectorAll('[data-reveal]').forEach(function(el, i) { el.style.setProperty('--delay', (i * 0.07) + 's'); });
    });

    // ---- FAQ: плавное раскрытие вместо резкого
    document.querySelectorAll('.faq-item').forEach(function(item) {
        const summary = item.querySelector('summary');
        const body = item.querySelector('.faq-body');
        if (!body) return;
        summary.addEventListener('click', function(e) {
            e.preventDefault();
            if (item.open) {
                item.classList.remove('is-open');
                body.addEventListener('transitionend', function done() {
                    item.open = false;
                    body.removeEventListener('transitionend', done);
                });
                if (reduceMotion) item.open = false;
            } else {
                item.open = true;
                requestAnimationFrame(function() { requestAnimationFrame(function() { item.classList.add('is-open'); }); });
            }
        });
    });

    // ---- Магнитные кнопки
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('[data-magnetic]').forEach(function(el) {
            el.addEventListener('pointermove', function(e) {
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
            });
            el.addEventListener('pointerleave', function() { el.style.transform = ''; });
        });
    }

    document.querySelectorAll('[data-year]').forEach(function(el) { el.textContent = new Date().getFullYear(); });
})();
