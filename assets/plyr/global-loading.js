document.addEventListener('DOMContentLoaded', () => {
    const loadingFile = 'https://bosniana.org/loading/index.html';
    let container = null;

    function showLoading() {
        if (container) return;

        container = document.createElement('div');
        container.id = 'global-loading-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '99999';
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.3s ease';

        document.body.appendChild(container);

        fetch(loadingFile)
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                const backdrop = container.querySelector('#backdrop');
                const ld = container.querySelector('#ld');
                const ldt = container.querySelector('#ldt');

                requestAnimationFrame(() => {
                    container.style.opacity = '1';
                    if (backdrop) backdrop.style.opacity = 1;
                    if (ld) ld.style.opacity = 1;
                    if (ldt) ldt.style.opacity = 1;
                });
            })
            .catch(err => console.error('Loading error:', err));
    }

    function hideLoading() {
        if (!container) return;

        const backdrop = container.querySelector('#backdrop');
        const ld = container.querySelector('#ld');
        const ldt = container.querySelector('#ldt');

        if (backdrop) backdrop.style.opacity = 0;
        if (ld) ld.style.opacity = 0;
        if (ldt) ldt.style.opacity = 0;
        container.style.opacity = '0';

        setTimeout(() => {
            container?.remove();
            container = null;
        }, 300);
    }

    // ================= TRIGGER =================

    // pokaži odmah
    showLoading();

    // sakrij kad video stvarno krene
    video.addEventListener('playing', () => {
        hideLoading();
    });
});
