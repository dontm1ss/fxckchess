(function() {
    const root = document.documentElement;
    const body = document.body;
    const heroSection = document.querySelector('.hero-section');
    const heroImage = document.querySelector('.hero-image');
    const wordLeft = document.querySelector('.word-left');
    const wordRight = document.querySelector('.word-right');
    const heroMeta = document.querySelector('.hero-meta');
    const header = document.querySelector('.site-header');
    const titleContainer = document.querySelector('.title-container');
    const showcase = document.querySelector('.product-showcase');
    const lenis = window.siteLenis;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

    function isDesktop() {
        return window.matchMedia('(min-width: 1024px)').matches && window.matchMedia('(pointer: fine)').matches;
    }

    // ---- Прелоадер → появление хиро
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    function reveal() {
        body.classList.add('is-loaded');
        body.classList.remove('intro');
        if (lenis) lenis.start();
        try { sessionStorage.setItem('at-seen', '1'); } catch (e) {}
    }

    const preloader = document.querySelector('.preloader');
    if (root.classList.contains('no-preloader') || !preloader) {
        requestAnimationFrame(function() { requestAnimationFrame(reveal); });
    } else {
        if (lenis) lenis.stop();
        const bar = preloader.querySelector('.preloader-bar span');
        const count = preloader.querySelector('.preloader-count');
        const minTime = 1500;
        const start = performance.now();
        let loaded = document.readyState === 'complete';
        window.addEventListener('load', function() { loaded = true; });

        (function tick(now) {
            const t = clamp((now - start) / minTime, 0, 1);
            // Пока страница грузится, держим счётчик на 90%
            const progress = loaded ? t : Math.min(t, 0.9);
            const eased = 1 - Math.pow(1 - progress, 3);
            bar.style.transform = `scaleX(${eased})`;
            count.textContent = String(Math.round(eased * 100)).padStart(3, '0');
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(function() {
                    preloader.classList.add('is-done');
                    setTimeout(reveal, 350);
                    setTimeout(function() { preloader.style.display = 'none'; }, 1200);
                }, 200);
            }
        })(start);
    }

    // ---- Хиро: разъезд при скролле
    // Хиро зафиксирован и не меняет высоту документа, поэтому прокрутка не «прыгает»
    function heroScroll() {
        return Math.round(window.innerHeight * (isDesktop() ? 0.3 : 0.38));
    }

    function render() {
        const y = window.scrollY || window.pageYOffset;
        const desktop = isDesktop();
        const p = clamp(y / heroScroll(), 0, 2);

        const imgShift = -Math.min(p * (desktop ? 110 : 100), 220);
        const imgScale = 1 - clamp(p, 0, 1) * 0.15;
        if (heroImage) heroImage.style.transform = `translateY(${imgShift}vh) scale(${imgScale})`;

        const wordShift = Math.min(p * (desktop ? 120 : 110), 200);
        if (wordLeft) wordLeft.style.transform = `translateX(-${wordShift}vw)`;
        if (wordRight) wordRight.style.transform = `translateX(${wordShift}vw)`;
        if (heroMeta) heroMeta.style.opacity = body.classList.contains('is-loaded') ? String(1 - clamp(p * 3, 0, 1)) : '';

        if (heroSection) {
            const fade = clamp(p, 0, 1);
            heroSection.style.opacity = String(1 - fade);
            heroSection.style.visibility = fade >= 1 ? 'hidden' : 'visible';
        }
        if (header) {
            header.classList.toggle('is-visible', p >= 0.9);
            header.classList.toggle('is-scrolled', p >= 1.2);
        }

        const appear = clamp((p - 0.3) / 0.7, 0, 1);
        if (titleContainer) {
            titleContainer.style.opacity = String(appear);
            titleContainer.style.transform = `translateY(${(1 - appear) * 60}px)`;
        }
        if (showcase) {
            const a = clamp((p - 0.5) / 0.5, 0, 1);
            showcase.style.opacity = String(a);
            showcase.style.transform = `translateY(${(1 - a) * 60}px)`;
        }

        renderParallax();
    }

    // ---- Параллакс фото в блоке «Изделие»
    const parallaxImgs = document.querySelectorAll('[data-parallax]');
    function renderParallax() {
        const vh = window.innerHeight;
        parallaxImgs.forEach(function(img) {
            const r = img.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            const offset = (r.top + r.height / 2 - vh / 2) / vh;
            img.style.setProperty('--py', `${(offset * -30).toFixed(1)}px`);
        });
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function() { ticking = false; render(); });
    }
    function onResize() {
        body.style.setProperty('--hero-scroll', `${heroScroll()}px`);
        render();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();

    // ---- 3D-наклон карточки товара за курсором
    const card = document.querySelector('.product-card');
    if (card && finePointer) {
        card.addEventListener('pointermove', function(e) {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.classList.add('is-tilting');
            card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
            card.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
            card.style.setProperty('--gx', `${x * 100}%`);
            card.style.setProperty('--gy', `${y * 100}%`);
        });
        card.addEventListener('pointerleave', function() {
            card.classList.remove('is-tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    }

    // На тач-устройствах наведения нет — переворачиваем футболку сами
    if (card && !finePointer) {
        const hint = document.querySelector('.card-hint');
        const front = document.querySelector('.card-caption span');
        setInterval(function() {
            const flipped = card.classList.toggle('is-flipped');
            if (front) front.textContent = flipped ? 'Back' : 'Front';
        }, 2800);
        if (hint) hint.textContent = 'FXCK CHESS';
    }
})();
