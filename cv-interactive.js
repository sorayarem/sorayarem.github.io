/**
 * Interactive CV: renders cv.pdf and overlays clickable hotspots.
 * Hotspots are inlined so the page works from file:// and GitHub Pages.
 * Optional fetch of cv-hotspots.json overrides when served over HTTP.
 * Edit cv-hotspots.json, then sync DEFAULT_HOTSPOTS below (or rely on fetch on deploy).
 */
(function () {
    const PDF_URL = 'cv.pdf';
    const HOTSPOTS_URL = 'cv-hotspots.json';
    const WORKER_URL = 'pdf.worker.min.js';
    const FALLBACK_IMAGE = 'cv-preview.png';

    const DEFAULT_HOTSPOTS = {
        hotspots: [
            {
                id: 'education',
                page: 1,
                label: 'Education',
                region: { left: 3, top: 10, width: 94, height: 15 },
                popup: {
                    title: 'Education',
                    description:
                        'B.S. in Computer Science, Statistics, and Biology at the University of South Carolina Honors College (expected May 2027, GPA 4.0). Also attended Thomas Jefferson High School for Science and Technology and Sciences Po.',
                    images: [],
                    files: [],
                    links: [{ label: 'USC Honors College', url: 'https://www.sc.edu' }]
                }
            },
            {
                id: 'honors',
                page: 1,
                label: 'Honors and grants',
                region: { left: 3, top: 25, width: 94, height: 22 },
                popup: {
                    title: 'Honors & Grants',
                    description:
                        'Scholarships and research funding including Magellan Mini, Honors College research grants, and the Provost AI Undergraduate Fellowship.',
                    images: [],
                    files: [],
                    links: []
                }
            },
            {
                id: 'presentations',
                page: 1,
                label: 'Presentations',
                region: { left: 3, top: 47, width: 94, height: 50 },
                popup: {
                    title: 'Posters & Presentations',
                    description:
                        'Conference talks on marine acoustics, sclerochronology, and proxy system modeling. See the Research page for the full list.',
                    images: [],
                    files: [],
                    links: [{ label: 'Research page', url: 'research.html' }]
                }
            }
        ]
    };

    const container = document.getElementById('cv-interactive');
    const modal = document.getElementById('cv-modal');
    if (!container || !modal) return;

    const modalTitle = document.getElementById('cv-modal-title');
    const modalBody = document.getElementById('cv-modal-body');
    const modalClose = modal.querySelector('.cv-modal-close');
    const modalBackdrop = modal.querySelector('.cv-modal-backdrop');

    let hotspots = [];
    let pdfDoc = null;
    let resizeTimer = null;

    function cloneHotspots(config) {
        return JSON.parse(JSON.stringify(config));
    }

    function showError(message) {
        container.innerHTML = `<p class="cv-error">${message} <a href="cv.pdf" class="method-link">Open the PDF</a> instead.</p>`;
    }

    function showImageFallback(message) {
        container.innerHTML = `
            <p class="cv-error">${message}</p>
            <p class="cv-interactive-hint">Static preview below. <a href="cv.pdf" class="method-link">Open the PDF</a> for the full document.</p>
            <a href="cv.pdf" class="cv-fallback-preview" target="_blank" rel="noopener noreferrer">
                <img src="${FALLBACK_IMAGE}" alt="CV preview" width="900" loading="lazy">
            </a>`;
    }

    function waitForPdfJs(maxMs) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            (function tick() {
                if (typeof pdfjsLib !== 'undefined') {
                    resolve(pdfjsLib);
                    return;
                }
                if (Date.now() - start > maxMs) {
                    reject(new Error('pdfjs'));
                    return;
                }
                requestAnimationFrame(tick);
            })();
        });
    }

    function loadHotspots() {
        if (location.protocol === 'file:') {
            return Promise.resolve(cloneHotspots(DEFAULT_HOTSPOTS));
        }
        return fetch(HOTSPOTS_URL)
            .then((r) => {
                if (!r.ok) throw new Error('hotspots');
                return r.json();
            })
            .catch(() => cloneHotspots(DEFAULT_HOTSPOTS));
    }

    function workerSrc() {
        try {
            return new URL(WORKER_URL, document.baseURI || window.location.href).href;
        } catch {
            return WORKER_URL;
        }
    }

    async function loadPdf(lib) {
        if (location.protocol === 'file:') {
            return lib.getDocument(PDF_URL).promise;
        }
        const res = await fetch(PDF_URL);
        if (!res.ok) throw new Error('pdf');
        const data = await res.arrayBuffer();
        return lib.getDocument({ data }).promise;
    }

    async function init() {
        container.innerHTML = '<p class="cv-loading">Loading CV…</p>';

        let lib;
        try {
            lib = await waitForPdfJs(10000);
        } catch {
            showImageFallback('PDF viewer did not load.');
            return;
        }

        lib.GlobalWorkerOptions.workerSrc = workerSrc();

        let config;
        try {
            config = await loadHotspots();
            hotspots = config.hotspots || [];
        } catch {
            showError('Could not load hotspot configuration.');
            return;
        }

        try {
            pdfDoc = await loadPdf(lib);
            await renderAllPages();
        } catch (err) {
            console.error('CV PDF load failed:', err);
            showImageFallback('Could not render the interactive CV.');
        }

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (pdfDoc) renderAllPages();
            }, 200);
        });

        modalClose.addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) closeModal();
        });
    }

    function buildHint() {
        const hint = document.createElement('p');
        hint.className = 'cv-interactive-hint';
        hint.textContent = 'Hover highlighted areas for details. Click to open photos, files, and links.';
        return hint;
    }

    async function renderAllPages() {
        container.innerHTML = '';
        container.appendChild(buildHint());

        const pagesRoot = document.createElement('div');
        pagesRoot.className = 'cv-pages';

        const maxWidth = Math.min(container.clientWidth || 800, 900);

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const baseViewport = page.getViewport({ scale: 1 });
            const scale = maxWidth / baseViewport.width;
            const viewport = page.getViewport({ scale });

            const wrapper = document.createElement('div');
            wrapper.className = 'cv-pdf-page';
            wrapper.dataset.page = String(pageNum);

            const canvas = document.createElement('canvas');
            canvas.className = 'cv-pdf-canvas';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.setAttribute('aria-label', `CV page ${pageNum}`);

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport
            }).promise;

            const layer = document.createElement('div');
            layer.className = 'cv-hotspot-layer';
            appendHotspots(layer, pageNum);

            wrapper.appendChild(canvas);
            wrapper.appendChild(layer);
            pagesRoot.appendChild(wrapper);
        }

        container.appendChild(pagesRoot);
    }

    function appendHotspots(layer, pageNum) {
        hotspots
            .filter((h) => h.page === pageNum)
            .forEach((hotspot) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cv-hotspot';
                btn.setAttribute('aria-label', hotspot.label || 'More information');
                const r = hotspot.region;
                btn.style.left = `${r.left}%`;
                btn.style.top = `${r.top}%`;
                btn.style.width = `${r.width}%`;
                btn.style.height = `${r.height}%`;
                btn.addEventListener('click', () => openModal(hotspot));
                layer.appendChild(btn);
            });
    }

    function openModal(hotspot) {
        const popup = hotspot.popup || {};
        modalTitle.textContent = popup.title || hotspot.label || 'Details';
        modalBody.innerHTML = '';

        if (popup.description) {
            const p = document.createElement('p');
            p.className = 'cv-modal-description';
            p.textContent = popup.description;
            modalBody.appendChild(p);
        }

        if (popup.images && popup.images.length) {
            const gallery = document.createElement('div');
            gallery.className = 'cv-modal-gallery';
            popup.images.forEach((img) => {
                const el = document.createElement('img');
                el.src = img.src;
                el.alt = img.alt || '';
                gallery.appendChild(el);
            });
            modalBody.appendChild(gallery);
        }

        if (popup.files && popup.files.length) {
            const files = document.createElement('ul');
            files.className = 'cv-modal-files';
            popup.files.forEach((file) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = file.url;
                a.textContent = file.label || file.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                li.appendChild(a);
                files.appendChild(li);
            });
            modalBody.appendChild(files);
        }

        if (popup.links && popup.links.length) {
            const links = document.createElement('ul');
            links.className = 'cv-modal-links';
            popup.links.forEach((link) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = link.url;
                a.textContent = link.label || link.url;
                if (link.url.startsWith('http')) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                }
                li.appendChild(a);
                links.appendChild(li);
            });
            modalBody.appendChild(links);
        }

        if (!modalBody.innerHTML) {
            modalBody.innerHTML =
                '<p class="cv-modal-description">Add content for this section in cv-hotspots.json.</p>';
        }

        modal.hidden = false;
        document.body.classList.add('cv-modal-open');
        modalClose.focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('cv-modal-open');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
