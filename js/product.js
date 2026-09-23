// Галерея на странице товара: стрелки, превью, свайп и клавиши
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.gallery-image');
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const main = document.querySelector('.gallery-main');
    let current = 0;

    function show(index) {
        current = (index + images.length) % images.length;
        images.forEach(function(img, i) { img.classList.toggle('active', i === current); });
        thumbs.forEach(function(t, i) { t.classList.toggle('active', i === current); });
    }

    document.querySelector('.gallery-prev').addEventListener('click', function() { show(current - 1); });
    document.querySelector('.gallery-next').addEventListener('click', function() { show(current + 1); });
    thumbs.forEach(function(t, i) { t.addEventListener('click', function() { show(i); }); });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') show(current - 1);
        if (e.key === 'ArrowRight') show(current + 1);
    });

    let startX = null;
    main.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function(e) {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
        startX = null;
    });

    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
});
