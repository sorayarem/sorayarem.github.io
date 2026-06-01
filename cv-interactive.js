/**

 * Interactive CV: renders cv.pdf and overlays clickable hotspots.

 * Hotspots: cv-hotspots-data.js (local) or fetch cv-hotspots.json (HTTP).

 * Regenerate: python scripts/generate-cv-hotspots.py

 */

(function () {

    const PDF_URL = 'cv.pdf';

    const HOTSPOTS_URL = 'cv-hotspots.json';

    const WORKER_URL = 'pdf.worker.min.js';

    const FALLBACK_IMAGE = 'cv-preview.png';

    const CV_PAGE_MAX_WIDTH = 900;
    const SCROLLBAR_GUTTER = 16;

    const MIN_RENDER_RATIO = 2;

    const MAX_RENDER_RATIO = 4;



    const container = document.getElementById('cv-interactive');

    const layout = document.getElementById('cv-layout');

    const layoutHint = document.getElementById('cv-layout-hint');

    const detailPanel = document.getElementById('cv-detail-panel');

    const detailBody = document.getElementById('cv-detail-body');

    const detailClose = document.querySelector('.cv-detail-close');

    if (!container || !layout || !detailPanel || !detailBody || !detailClose) return;



    let hotspots = [];

    let pdfDoc = null;

    let resizeTimer = null;

    let pagesRoot = null;

    let renderToken = 0;
    let activePopupImages = [];
    let activePopupImageIndex = 0;
    let popupGalleryEl = null;
    let popupCarouselAnimating = false;



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

        if (typeof window.applyImageFadeIn === 'function') {
            window.applyImageFadeIn(container);
        }

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

        if (window.CV_HOTSPOTS_CONFIG) {

            return Promise.resolve(cloneHotspots(window.CV_HOTSPOTS_CONFIG));

        }

        return fetch(HOTSPOTS_URL)

            .then((r) => {

                if (!r.ok) throw new Error('hotspots');

                return r.json();

            })

            .catch(() => {

                throw new Error('hotspots');

            });

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



    function pageWidth() {

        const root =
            layout.querySelector('.cv-layout-main') ||
            container.closest('.cv-page-container') ||
            container;

        const w = root.getBoundingClientRect().width;

        return Math.min(Math.max(Math.floor(w), 280), CV_PAGE_MAX_WIDTH);

    }

    function scheduleRerender() {

        requestAnimationFrame(() => {

            if (pdfDoc && pagesRoot) renderAllPages();

        });

    }



    function syncScrollShell(pageCssWidth, pageCssHeight) {

        const shell = container.querySelector('.cv-scroll-shell');

        if (!shell || !pagesRoot) return;

        shell.style.width = `${pageCssWidth}px`;

        shell.style.paddingRight = `${SCROLLBAR_GUTTER}px`;

        shell.style.height = `${pageCssHeight}px`;

        shell.style.minHeight = `${pageCssHeight}px`;

        shell.style.maxHeight = 'none';

        pagesRoot.style.width = `${pageCssWidth}px`;

    }



    function renderPixelRatio() {

        const dpr = window.devicePixelRatio || 1;

        const ratio = Math.max(dpr * 1.5, MIN_RENDER_RATIO);

        return Math.min(ratio, MAX_RENDER_RATIO);

    }



    function buildHint() {

        const hint = document.createElement('p');

        hint.className = 'cv-interactive-hint';

        hint.appendChild(document.createTextNode('Hover highlighted areas for details. View a PDF version '));

        const pdfLink = document.createElement('a');

        pdfLink.href = PDF_URL;

        pdfLink.className = 'method-link';

        pdfLink.target = '_blank';

        pdfLink.rel = 'noopener noreferrer';

        pdfLink.textContent = 'here';

        hint.appendChild(pdfLink);

        hint.appendChild(document.createTextNode('.'));

        return hint;

    }



    function estimatePageHeight(cssWidth) {

        return Math.floor(cssWidth * (792 / 612));

    }



    function createLoadingState(inline, cssWidth, cssHeight) {

        const wrap = document.createElement('div');

        wrap.className = inline ? 'cv-loading-state cv-loading-state--inline' : 'cv-loading-state';

        if (cssWidth && cssHeight) {

            wrap.classList.add('cv-loading-state--sized');

        }

        wrap.setAttribute('role', 'status');

        wrap.setAttribute('aria-live', 'polite');

        wrap.setAttribute('aria-label', 'Loading CV');



        const panel = document.createElement('div');

        panel.className = 'cv-loading-panel';



        const skeleton = document.createElement('div');

        skeleton.className = 'cv-loading-skeleton';

        skeleton.setAttribute('aria-hidden', 'true');

        const lineWidths = ['72%', '88%', '64%', '80%', '56%', '76%'];

        lineWidths.forEach((width) => {

            const line = document.createElement('div');

            line.className = 'cv-loading-skeleton-line';

            line.style.width = width;

            skeleton.appendChild(line);

        });



        const spinner = document.createElement('div');

        spinner.className = 'cv-loading-spinner';

        spinner.setAttribute('aria-hidden', 'true');



        const label = document.createElement('p');

        label.className = 'cv-loading-label';

        label.textContent = 'Loading CV…';



        panel.appendChild(skeleton);

        panel.appendChild(spinner);

        panel.appendChild(label);



        if (cssWidth && cssHeight) {

            panel.style.width = `${cssWidth}px`;

            panel.style.height = `${cssHeight}px`;

            panel.style.aspectRatio = 'auto';

            panel.style.maxWidth = 'none';

        }



        wrap.appendChild(panel);

        return wrap;

    }



    function buildViewer() {

        container.innerHTML = '';

        if (layoutHint) {
            layoutHint.innerHTML = '';
            layoutHint.appendChild(buildHint());
        }



        const viewer = document.createElement('div');

        viewer.className = 'cv-viewer';



        const scrollShell = document.createElement('div');

        scrollShell.className = 'cv-scroll-shell';



        pagesRoot = document.createElement('div');

        pagesRoot.className = 'cv-scroll';



        scrollShell.appendChild(pagesRoot);

        viewer.appendChild(scrollShell);

        container.appendChild(viewer);

    }



    async function renderAllPages() {

        if (!pagesRoot || !pdfDoc) return;



        const token = ++renderToken;

        const width = pageWidth();

        const firstPage = await pdfDoc.getPage(1);

        if (token !== renderToken) return;



        const firstViewport = firstPage.getViewport({ scale: 1 });

        const pageCssWidth = Math.floor(width);

        const pageCssHeight = Math.floor((firstViewport.height / firstViewport.width) * width);



        syncScrollShell(pageCssWidth, pageCssHeight);

        pagesRoot.innerHTML = '';

        pagesRoot.appendChild(createLoadingState(true, pageCssWidth, pageCssHeight));



        const pixelRatio = renderPixelRatio();

        const fragment = document.createDocumentFragment();



        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {

            if (token !== renderToken) return;



            const page = pageNum === 1 ? firstPage : await pdfDoc.getPage(pageNum);

            const baseViewport = page.getViewport({ scale: 1 });

            const cssWidth = pageCssWidth;

            const cssHeight = Math.floor((baseViewport.height / baseViewport.width) * width);

            const renderScale = (width / baseViewport.width) * pixelRatio;

            const viewport = page.getViewport({ scale: renderScale });



            const wrapper = document.createElement('div');

            wrapper.className = 'cv-pdf-page';

            wrapper.dataset.page = String(pageNum);

            const canvas = document.createElement('canvas');

            canvas.className = 'cv-pdf-canvas';

            canvas.width = Math.floor(viewport.width);

            canvas.height = Math.floor(viewport.height);

            canvas.style.width = `${cssWidth}px`;

            canvas.style.height = `${cssHeight}px`;

            canvas.setAttribute('aria-label', `CV page ${pageNum}`);



            const ctx = canvas.getContext('2d', { alpha: false });

            ctx.imageSmoothingEnabled = true;

            if ('imageSmoothingQuality' in ctx) {

                ctx.imageSmoothingQuality = 'high';

            }



            await page.render({

                canvasContext: ctx,

                viewport

            }).promise;



            if (token !== renderToken) return;



            const layer = document.createElement('div');

            layer.className = 'cv-hotspot-layer';

            appendHotspots(layer, pageNum);



            wrapper.appendChild(canvas);

            wrapper.appendChild(layer);

            fragment.appendChild(wrapper);

        }



        if (token !== renderToken) return;

        pagesRoot.innerHTML = '';

        pagesRoot.appendChild(fragment);

        syncScrollShell(pageCssWidth, pageCssHeight);

    }



    function hotspotsInGroup(group) {

        return container.querySelectorAll(`.cv-hotspot[data-group="${group}"]`);

    }

    function isMovingWithinGroup(group, relatedTarget) {

        if (!group || !relatedTarget) return false;

        return Array.from(hotspotsInGroup(group)).some(

            (el) => el === relatedTarget || el.contains(relatedTarget)

        );

    }

    function setGroupHover(group, active) {

        if (!group) return;

        hotspotsInGroup(group).forEach((el) => {

            el.classList.toggle('cv-hotspot--group-active', active);

        });

    }

    function bindHotspot(btn, hotspot) {

        btn.addEventListener('click', () => openDetailPanel(hotspot));

        if (!hotspot.group) return;

        btn.dataset.group = hotspot.group;

        btn.addEventListener('mouseenter', () => setGroupHover(hotspot.group, true));

        btn.addEventListener('mouseleave', (e) => {

            if (!isMovingWithinGroup(hotspot.group, e.relatedTarget)) {

                setGroupHover(hotspot.group, false);

            }

        });

        btn.addEventListener('focus', () => setGroupHover(hotspot.group, true));

        btn.addEventListener('blur', (e) => {

            if (!isMovingWithinGroup(hotspot.group, e.relatedTarget)) {

                setGroupHover(hotspot.group, false);

            }

        });

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

                bindHotspot(btn, hotspot);

                layer.appendChild(btn);

            });

    }

    function waitForPopupImageSrc(src) {
        return new Promise((resolve) => {
            const pre = new Image();
            const finish = () => resolve();
            pre.addEventListener('load', finish, { once: true });
            pre.addEventListener('error', finish, { once: true });
            pre.src = src;
            if (pre.complete) {
                queueMicrotask(finish);
            }
        });
    }

    function revealPopupMedia(mediaEl) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                mediaEl.classList.add('cv-popup-media--ready');
            });
        });
    }

    function buildPopupMediaNode(img) {
        const media = document.createElement('div');
        media.className = 'cv-popup-media';

        const el = document.createElement('img');
        el.alt = img.alt || '';
        el.decoding = 'async';
        el.src = img.src;

        if (img.url) {
            const imageLink = document.createElement('a');
            imageLink.className = 'cv-modal-image-link';
            imageLink.href = img.url;
            const hoverText = img.hoverText || 'Open linked file';
            imageLink.title = hoverText;
            imageLink.setAttribute('aria-label', hoverText);
            if (img.url.startsWith('http') || img.url.endsWith('.pdf')) {
                imageLink.target = '_blank';
                imageLink.rel = 'noopener noreferrer';
            }
            imageLink.appendChild(el);
            const overlay = document.createElement('span');
            overlay.className = 'cv-modal-image-overlay';
            const cta = document.createElement('span');
            cta.className = 'cv-modal-image-cta';
            cta.textContent = hoverText;
            overlay.appendChild(cta);
            imageLink.appendChild(overlay);
            media.appendChild(imageLink);
        } else {
            media.appendChild(el);
        }

        revealPopupMedia(media);
        return media;
    }

    async function buildPopupImageFigure(img) {
        await waitForPopupImageSrc(img.src);

        const figure = document.createElement('figure');
        figure.className = 'cv-modal-figure';
        figure.appendChild(buildPopupMediaNode(img));

        if (img.captionHtml || img.caption) {
            const cap = document.createElement('figcaption');
            cap.className = 'cv-modal-caption';
            if (img.captionHtml) {
                cap.innerHTML = img.captionHtml;
                cap.querySelectorAll('a[href]').forEach((a) => {
                    if (a.href.startsWith('http')) {
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                    }
                });
            } else {
                cap.textContent = img.caption;
            }
            figure.appendChild(cap);
        }

        return figure;
    }

    async function setPopupSlideContent(slideEl, imgData) {
        slideEl.innerHTML = '';
        slideEl.appendChild(await buildPopupImageFigure(imgData));
    }

    function getPopupCarouselCountEl() {
        return popupGalleryEl?.querySelector('.cv-detail-carousel-count') || null;
    }

    function getPopupCarouselSlide() {
        return popupGalleryEl?.querySelector('.cv-detail-carousel-viewport .cv-popup-slide');
    }

    async function renderPopupImageCarousel() {
        if (!popupGalleryEl || !activePopupImages.length) return;
        popupCarouselAnimating = false;
        popupGalleryEl.innerHTML = '';

        const slide = document.createElement('div');
        slide.className = 'cv-popup-slide';

        if (activePopupImages.length > 1) {
            const shell = document.createElement('div');
            shell.className = 'cv-detail-carousel-shell';

            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'cv-detail-carousel-btn';
            prev.setAttribute('aria-label', 'Previous image');
            prev.textContent = '‹';
            prev.addEventListener('click', () => shiftPopupImage(-1));

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'cv-detail-carousel-btn';
            next.setAttribute('aria-label', 'Next image');
            next.textContent = '›';
            next.addEventListener('click', () => shiftPopupImage(1));

            const viewport = document.createElement('div');
            viewport.className = 'cv-detail-carousel-viewport';
            viewport.appendChild(slide);

            shell.appendChild(prev);
            shell.appendChild(viewport);
            shell.appendChild(next);
            popupGalleryEl.appendChild(shell);

            const countViewport = document.createElement('div');
            countViewport.className = 'cv-detail-carousel-count-viewport';
            const count = document.createElement('p');
            count.className = 'cv-detail-carousel-count cv-popup-slide';
            count.textContent = `${activePopupImageIndex + 1} / ${activePopupImages.length}`;
            countViewport.appendChild(count);
            popupGalleryEl.appendChild(countViewport);
        } else {
            popupGalleryEl.appendChild(slide);
        }

        await setPopupSlideContent(slide, activePopupImages[activePopupImageIndex]);
    }

    function shiftPopupImage(delta) {
        if (!activePopupImages.length || activePopupImages.length < 2) return;
        const slide = getPopupCarouselSlide();
        if (!slide || popupCarouselAnimating) return;

        const len = activePopupImages.length;
        const newIndex =
            ((activePopupImageIndex + delta) % len + len) % len;
        if (newIndex === activePopupImageIndex) return;

        popupCarouselAnimating = true;
        const countEl = getPopupCarouselCountEl();
        const nextFigurePromise = buildPopupImageFigure(activePopupImages[newIndex]);
        const outClass =
            delta > 0 ? 'cv-popup-slide--out-left' : 'cv-popup-slide--out-right';
        const fromClass =
            delta > 0 ? 'cv-popup-slide--from-right' : 'cv-popup-slide--from-left';

        const safety = window.setTimeout(() => {
            popupCarouselAnimating = false;
        }, 600);

        const animateIn = (el) => {
            if (!el) return;
            el.classList.remove(outClass);
            el.classList.add(fromClass);
            void el.offsetWidth;
            el.classList.remove(fromClass);
        };

        const finishIn = async () => {
            const figure = await nextFigurePromise;
            slide.replaceChildren(figure);
            if (countEl) {
                countEl.textContent = `${newIndex + 1} / ${len}`;
            }
            activePopupImageIndex = newIndex;
            animateIn(slide);
            animateIn(countEl);
            slide.addEventListener(
                'transitionend',
                (e) => {
                    if (e.propertyName !== 'transform') return;
                    window.clearTimeout(safety);
                    popupCarouselAnimating = false;
                },
                { once: true }
            );
        };

        slide.classList.add(outClass);
        if (countEl) countEl.classList.add(outClass);
        slide.addEventListener(
            'transitionend',
            (e) => {
                if (e.propertyName !== 'transform') return;
                finishIn();
            },
            { once: true }
        );
    }



    function openDetailPanel(hotspot) {
        const wasHidden = detailPanel.hidden;
        activePopupImages = [];
        activePopupImageIndex = 0;
        popupGalleryEl = null;
        popupCarouselAnimating = false;

        const popup = hotspot.popup || {};

        detailBody.innerHTML = '';

        const eyebrowText = popup.description || popup.title || hotspot.label || '';

        if (eyebrowText) {

            const eyebrow = document.createElement('p');

            eyebrow.className = 'book-panel-eyebrow cv-detail-eyebrow';

            eyebrow.textContent = eyebrowText;

            detailBody.appendChild(eyebrow);

        }



        if (popup.images && popup.images.length) {

            const gallery = document.createElement('div');

            gallery.className = 'cv-modal-gallery';
            activePopupImages = popup.images.slice();
            activePopupImageIndex = 0;
            popupGalleryEl = gallery;
            detailBody.appendChild(gallery);
            void renderPopupImageCarousel();

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

            detailBody.appendChild(files);

        }



        if (popup.links && popup.links.length) {
            const imageLinkUrls = new Set(
                (popup.images || [])
                    .map((img) => (img && img.url ? String(img.url) : ''))
                    .filter(Boolean)
            );
            const visibleLinks = popup.links.filter(
                (link) => !(link && link.url && imageLinkUrls.has(String(link.url)))
            );
            if (!visibleLinks.length) {
                /* Link already available on image hover/click. */
            } else {

            const links = document.createElement('ul');

            links.className = 'cv-modal-links';

            visibleLinks.forEach((link) => {

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

            detailBody.appendChild(links);
            }

        }



        if (!detailBody.innerHTML) {

            detailBody.innerHTML =

                '<p class="book-panel-eyebrow cv-detail-eyebrow">Add content for this section in cv-hotspots.json.</p>';

        }



        detailPanel.hidden = false;

        layout.classList.add('cv-layout--open');

        if (wasHidden) {
            scheduleRerender();
            detailClose.focus();
        }

    }



    function closeDetailPanel() {
        if (detailPanel.hidden) return;
        activePopupImages = [];
        activePopupImageIndex = 0;
        popupGalleryEl = null;
        popupCarouselAnimating = false;

        detailPanel.hidden = true;

        layout.classList.remove('cv-layout--open');

        scheduleRerender();

    }



    async function init() {

        container.innerHTML = '';

        const bootstrapWidth = pageWidth();

        const bootstrapHeight = estimatePageHeight(bootstrapWidth);

        container.appendChild(createLoadingState(false, bootstrapWidth, bootstrapHeight));



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

            buildViewer();

            const preloadWidth = pageWidth();

            const preloadHeight = estimatePageHeight(preloadWidth);

            syncScrollShell(preloadWidth, preloadHeight);

            pagesRoot.innerHTML = '';

            pagesRoot.appendChild(createLoadingState(true, preloadWidth, preloadHeight));



            pdfDoc = await loadPdf(lib);

            await renderAllPages();

        } catch (err) {

            console.error('CV PDF load failed:', err);

            showImageFallback('Could not render the interactive CV.');

        }



        window.addEventListener('resize', () => {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {

                if (pdfDoc && pagesRoot) renderAllPages();

            }, 200);

        });



        detailClose.addEventListener('click', closeDetailPanel);

        document.addEventListener('keydown', (e) => {

            if (e.key === 'Escape' && !detailPanel.hidden) closeDetailPanel();
            if (e.key === 'ArrowLeft' && !detailPanel.hidden) shiftPopupImage(-1);
            if (e.key === 'ArrowRight' && !detailPanel.hidden) shiftPopupImage(1);

        });

    }



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }

})();


