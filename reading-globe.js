(function () {
    const GEO_URL =
        'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';
    const GEO_SEARCH_SUPPLEMENT =
        'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson';
    const EARTH_IMG =
        'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';
    const BUMP_IMG =
        'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png';

    const CAP_HAS_BOOK = 'rgba(176, 125, 98, 0.78)';
    const CAP_NO_BOOK = 'rgba(197, 212, 188, 0.35)';
    const CAP_CURRENT_STOP = 'rgba(92, 122, 138, 0.78)';
    const CAP_ON_THE_DOCKET = 'rgba(122, 107, 143, 0.78)';
    const CAP_HOVER = 'rgba(95, 109, 84, 0.72)';
    const CAP_HOVER_BOOK = 'rgba(143, 99, 73, 0.9)';
    const CAP_HOVER_CURRENT_STOP = 'rgba(72, 100, 116, 0.9)';
    const CAP_HOVER_ON_THE_DOCKET = 'rgba(95, 83, 115, 0.9)';
    const POLYGON_ALT = 0.01;
    const STROKE_COLOR = '#a8b89e';
    const MIN_ZOOM_FACTOR = 0.36;
    const MAX_ZOOM_FACTOR = 3;

    const ALLOWED_COUNTRY_TYPES = new Set(['Sovereign country', 'Country']);
    const ALLOWED_ADMIN_EXCEPTIONS = new Set(['Palestine']);
    const EXCLUDED_ADMIN = new Set([
        'Northern Cyprus',
        'French Southern and Antarctic Lands',
        'Antarctica',
        'Falkland Islands',
        'New Caledonia',
        'Puerto Rico',
        'Somaliland',
        'Western Sahara'
    ]);

    let world = null;
    let hoveredFeature = null;
    let selectedFeature = null;
    let countryIndex = [];
    let panelCountryKey = null;
    let panelBookIndex = 0;
    let panelBookAnimating = false;
    let panelBooksMode = 'visited';
    /** GeoJSON properties for the active panel (null = full current-stop carousel). */
    let panelContextProperties = null;

    function initReadingGlobe() {
        const stageEl = document.getElementById('reading-globe');
        const panelEl = document.getElementById('reading-globe-panel');
        const searchInput = document.getElementById('country-search');
        const searchBtn = document.getElementById('country-search-go');
        if (!stageEl || !panelEl || typeof Globe !== 'function') return;

        showCurrentStopPanel(panelEl);

        fetch(GEO_URL)
            .then((res) => {
                if (!res.ok) throw new Error('geojson');
                return res.json();
            })
            .then((countries) => {
                const features = countries.features.filter(isValidCountryFeature);

                countryIndex = features
                    .map((feature) => buildIndexEntry(feature, true))
                    .sort((a, b) => a.name.localeCompare(b.name));

                world = Globe()
                    .globeImageUrl(EARTH_IMG)
                    .bumpImageUrl(BUMP_IMG)
                    .backgroundColor('rgba(0,0,0,0)')
                    .showAtmosphere(true)
                    .atmosphereColor('rgba(126, 139, 111, 0.35)')
                    .atmosphereAltitude(0.12)
                    .lineHoverPrecision(0)
                    .polygonsData(features)
                    .polygonAltitude(() => POLYGON_ALT)
                    .polygonCapColor((feat) => capColor(feat))
                    .polygonSideColor(() => 'rgba(0,0,0,0)')
                    .polygonStrokeColor(() => STROKE_COLOR)
                    .polygonLabel(() => '')
                    .onPolygonHover((hoverD) => {
                        if (selectedFeature) return;
                        hoveredFeature = hoverD || null;
                        refreshPolygonStyles();
                        updateBookPanel(panelEl, hoverD ? hoverD.properties : null);
                    })
                    .onPolygonClick((clickD) => {
                        if (!clickD) return;
                        if (selectedFeature === clickD) {
                            clearSelection(panelEl, searchInput);
                            return;
                        }
                        selectCountry(clickD.properties, clickD, panelEl, searchInput);
                    })
                    .polygonsTransitionDuration(0)(stageEl);

                world.pointOfView({ lat: 20, lng: -30, altitude: 2.2 }, 0);

                const controls = world.controls();
                controls.enableZoom = true;
                controls.enablePan = false;
                controls.autoRotate = false;

                const dist = world.camera().position.distanceTo(controls.target);
                if (Number.isFinite(dist) && dist > 0) {
                    controls.minDistance = dist * MIN_ZOOM_FACTOR;
                    controls.maxDistance = dist * MAX_ZOOM_FACTOR;
                }

                const resize = () => {
                    const w = Math.floor(stageEl.clientWidth);
                    const h = Math.floor(stageEl.clientHeight);
                    if (w > 0 && h > 0) {
                        world.width(w).height(h);
                    }
                };

                resize();
                window.addEventListener('resize', resize);

                initCountrySearch(searchInput, searchBtn, panelEl);
                mergeSearchSupplement();
            })
            .catch((err) => {
                console.error('Reading globe failed:', err);
                stageEl.innerHTML =
                    '<p class="reading-globe-error">Could not load the globe. Check your connection and refresh.</p>';
            });
    }

    function isValidCountryFeature(d) {
        if (!d.properties || !d.geometry) return false;
        const p = d.properties;
        const typeOk =
            ALLOWED_COUNTRY_TYPES.has(p.TYPE) || ALLOWED_ADMIN_EXCEPTIONS.has(p.ADMIN);
        if (!typeOk) return false;
        if (EXCLUDED_ADMIN.has(p.ADMIN)) return false;
        const iso = window.resolveCountryIso(p);
        return Boolean(iso && iso !== 'AQ');
    }

    function indexKey(iso, name) {
        return `${iso || ''}|${name || ''}`;
    }

    function buildIndexEntry(feature, onGlobe) {
        const props = feature.properties;
        const center = featureCentroid(feature);
        const iso = window.resolveCountryIso(props);

        return {
            feature: onGlobe ? feature : null,
            onGlobe,
            name: props.ADMIN,
            iso,
            properties: props,
            lat: center.lat,
            lng: center.lng,
            key: indexKey(iso, props.ADMIN)
        };
    }

    function mergeSearchSupplement() {
        fetch(GEO_SEARCH_SUPPLEMENT)
            .then((res) => {
                if (!res.ok) throw new Error('supplement');
                return res.json();
            })
            .then((data) => {
                const seen = new Set(countryIndex.map((c) => c.key));
                const additions = [];

                data.features.filter(isValidCountryFeature).forEach((feature) => {
                    const entry = buildIndexEntry(feature, false);
                    if (seen.has(entry.key)) return;
                    seen.add(entry.key);
                    additions.push(entry);
                });

                if (additions.length === 0) return;

                countryIndex = countryIndex.concat(additions).sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
            })
            .catch(() => {
                /* Globe and 110m search still work if supplement fails */
            });
    }

    function featureCentroid(feature) {
        const points = [];

        function addRing(ring) {
            ring.forEach(([lng, lat]) => points.push({ lng, lat }));
        }

        const geom = feature.geometry;
        if (geom.type === 'Polygon') {
            addRing(geom.coordinates[0]);
        } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach((poly) => addRing(poly[0]));
        }

        if (points.length === 0) return { lat: 0, lng: 0 };

        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        points.forEach(({ lng, lat }) => {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        });

        return {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2
        };
    }

    function findCountry(query) {
        const q = query.trim().toLowerCase();
        if (!q) return null;

        const exact = countryIndex.find((c) => c.name.toLowerCase() === q);
        if (exact) return exact;

        const prefix = countryIndex.find((c) => c.name.toLowerCase().startsWith(q));
        if (prefix) return prefix;

        const contains = countryIndex.find((c) => c.name.toLowerCase().includes(q));
        return contains || null;
    }

    function flyToCountry(entry, panelEl, searchInput) {
        if (!world || !entry) return;

        selectCountry(entry.properties, entry.onGlobe ? entry.feature : null, panelEl, searchInput);

        world.pointOfView(
            { lat: entry.lat, lng: entry.lng, altitude: entry.onGlobe ? 1.15 : 0.95 },
            1200
        );
    }

    function selectCountry(properties, feature, panelEl, searchInput) {
        selectedFeature = feature || null;
        hoveredFeature = null;

        if (searchInput) {
            searchInput.value = properties.ADMIN || '';
            searchInput.setCustomValidity('');
        }

        refreshPolygonStyles();
        updateBookPanel(panelEl, properties);
    }

    function clearSelection(panelEl, searchInput) {
        selectedFeature = null;
        hoveredFeature = null;

        if (searchInput) {
            searchInput.value = '';
            searchInput.setCustomValidity('');
        }

        refreshPolygonStyles();
        showCurrentStopPanel(panelEl);
    }

    function initCountrySearch(searchInput, searchBtn, panelEl) {
        if (!searchInput) return;

        const runSearch = () => {
            const match = findCountry(searchInput.value);
            if (!match) {
                searchInput.setCustomValidity('Country not found. Try another spelling.');
                searchInput.reportValidity();
                return;
            }
            searchInput.setCustomValidity('');
            flyToCountry(match, panelEl, searchInput);
        };

        searchBtn?.addEventListener('click', runSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
            }
        });
        searchInput.addEventListener('input', () => {
            searchInput.setCustomValidity('');
        });
    }

    function activeFeature() {
        return selectedFeature || hoveredFeature;
    }

    function refreshPolygonStyles() {
        if (!world) return;
        world.polygonCapColor((feat) => capColor(feat));
    }

    function capColor(feat) {
        const props = feat.properties;
        const isCurrentStop = window.isCurrentStopCountry(props);
        const isOnTheDocket = window.isOnTheDocketCountry(props);

        if (feat === activeFeature()) {
            if (isCurrentStop) return CAP_HOVER_CURRENT_STOP;
            if (isOnTheDocket) return CAP_HOVER_ON_THE_DOCKET;
            return window.countryHasBook(props) ? CAP_HOVER_BOOK : CAP_HOVER;
        }
        if (isCurrentStop) return CAP_CURRENT_STOP;
        if (isOnTheDocket) return CAP_ON_THE_DOCKET;
        return window.countryHasBook(props) ? CAP_HAS_BOOK : CAP_NO_BOOK;
    }

    function clearBookPanel(panelEl) {
        panelCountryKey = null;
        panelBookIndex = 0;
        panelEl.innerHTML = '';
    }

    function bindBookCoverFade(root) {
        if (!root) return;
        root.querySelectorAll('.book-panel-cover:not(.book-panel-cover--loaded)').forEach((img) => {
            const reveal = () => {
                requestAnimationFrame(() => {
                    img.classList.add('book-panel-cover--loaded');
                });
            };
            if (img.complete && img.naturalWidth > 0) {
                reveal();
                return;
            }
            img.addEventListener('load', reveal, { once: true });
            img.addEventListener('error', reveal, { once: true });
        });
    }

    function getCurrentStopBooks(properties) {
        if (typeof window.getCurrentStopBooks === 'function') {
            return window.getCurrentStopBooks(properties);
        }
        if (!window.CURRENT_STOP) return [];
        return Array.isArray(window.CURRENT_STOP) ? window.CURRENT_STOP : [window.CURRENT_STOP];
    }

    function renderStatusTagHtml(modifier, label) {
        return `<span class="book-panel-tag book-panel-tag--${modifier}">${escapeHtml(label)}</span>`;
    }

    function bookCountryKey(book) {
        return book.iso || book.country || '';
    }

    function carouselHasDistinctCountries(books) {
        if (!books || books.length < 2) return false;
        const keys = new Set();
        for (const book of books) {
            const key = bookCountryKey(book);
            if (key) keys.add(key);
        }
        return keys.size > 1;
    }

    function renderMultiBookSlideHtml(book, contentHtml, countryName) {
        const name = countryName || book.country || '';
        return `
            <p class="book-panel-eyebrow">${escapeHtml(name)}</p>
            ${contentHtml}
        `;
    }

    function renderCarouselSlideInner(book, contentHtml, countryName, distinctCountries) {
        if (distinctCountries) {
            return renderMultiBookSlideHtml(book, contentHtml, countryName);
        }
        return contentHtml;
    }

    function renderMultiCarouselStackHtml(book, contentHtml, countryName, books) {
        const distinctCountries = carouselHasDistinctCountries(books);
        const eyebrow = distinctCountries
            ? ''
            : `<p class="book-panel-eyebrow">${escapeHtml(countryName)}</p>`;

        return `
            <div class="book-panel-stack">
                ${eyebrow}
                <div class="book-panel-viewport">
                    <div class="book-panel-slide">${renderCarouselSlideInner(
                        book,
                        contentHtml,
                        countryName,
                        distinctCountries
                    )}</div>
                </div>
            </div>
        `;
    }

    function renderStatusBookSlideHtml(book, tagModifier, tagLabel) {
        const coverHtml = book.cover
            ? `<img class="book-panel-cover" src="${escapeAttr(book.cover)}" alt="Cover of ${escapeAttr(book.title)}" loading="lazy">`
            : '';

        return `
            <div class="book-panel-slide-content">
                ${coverHtml}
                <div class="book-panel-info">
                    <p class="book-panel-line-title">${escapeHtml(book.title)}</p>
                    <p class="book-panel-line-author">${escapeHtml(book.author)}</p>
                    ${renderStatusTagHtml(tagModifier, tagLabel)}
                </div>
            </div>
        `;
    }

    function showStatusBookPanel(panelEl, book, tagModifier, tagLabel) {
        panelCountryKey = null;
        panelBookIndex = 0;
        panelBookAnimating = false;

        if (!book) {
            clearBookPanel(panelEl);
            return;
        }

        panelEl.innerHTML = `
            <div class="book-panel-shell">
                <article class="book-panel book-panel--book">
                    <p class="book-panel-eyebrow">${escapeHtml(book.country)}</p>
                    ${renderStatusBookSlideHtml(book, tagModifier, tagLabel)}
                </article>
            </div>
        `;
        bindBookCoverFade(panelEl);
    }

    function showStatusBooksPanel(panelEl, properties, books, tagModifier, tagLabel, bookIndex) {
        if (!books || books.length === 0) {
            clearBookPanel(panelEl);
            return;
        }

        const key = properties
            ? `${countryPanelKey(properties)}|${tagModifier}`
            : `__${tagModifier}_all__`;
        if (key !== panelCountryKey) {
            panelCountryKey = key;
            panelBookIndex = 0;
        }
        if (Number.isFinite(bookIndex)) {
            panelBookIndex =
                ((bookIndex % books.length) + books.length) % books.length;
        }

        const book = books[panelBookIndex];
        const countryName = book.country || (properties && properties.ADMIN) || 'Current reads';
        const multi = books.length > 1;
        const prevBtn = multi
            ? `<button type="button" class="book-panel-arrow book-panel-arrow--prev" data-dir="-1" aria-label="Previous book">‹</button>`
            : '';
        const nextBtn = multi
            ? `<button type="button" class="book-panel-arrow book-panel-arrow--next" data-dir="1" aria-label="Next book">›</button>`
            : '';

        if (multi) {
            panelEl.innerHTML = `
                <div class="book-panel-shell book-panel-shell--multi">
                    ${prevBtn}
                    ${renderMultiCarouselStackHtml(
                        book,
                        renderStatusBookSlideHtml(book, tagModifier, tagLabel),
                        countryName,
                        books
                    )}
                    ${nextBtn}
                </div>
            `;
            bindBookPanelArrows(panelEl, properties);
        } else {
            panelEl.innerHTML = `
                <div class="book-panel-shell">
                    <article class="book-panel book-panel--book">
                        <p class="book-panel-eyebrow">${escapeHtml(countryName)}</p>
                        ${renderStatusBookSlideHtml(book, tagModifier, tagLabel)}
                    </article>
                </div>
            `;
        }

        bindBookCoverFade(panelEl);
        panelBookAnimating = false;
    }

    function showCurrentStopPanel(panelEl, properties, bookIndex) {
        panelBooksMode = 'current-stop';
        panelContextProperties = properties || null;
        showStatusBooksPanel(
            panelEl,
            properties || null,
            getCurrentStopBooks(panelContextProperties),
            'current-stop',
            'CURRENT STOP',
            bookIndex
        );
    }

    function showOnTheDocketPanel(panelEl, properties, bookIndex) {
        panelBooksMode = 'on-the-docket';
        panelContextProperties = properties;
        showStatusBooksPanel(
            panelEl,
            properties,
            window.getOnTheDocketBooks(properties),
            'on-the-docket',
            'ON THE DOCKET',
            bookIndex
        );
    }

    function getActivePanelBooks() {
        if (panelBooksMode === 'current-stop') {
            return getCurrentStopBooks(panelContextProperties);
        }
        if (panelBooksMode === 'on-the-docket') {
            return window.getOnTheDocketBooks(panelContextProperties);
        }
        return window.getBooksForCountry(panelContextProperties);
    }

    function refreshPanelForMode(panelEl, bookIndex) {
        if (panelBooksMode === 'on-the-docket') {
            showOnTheDocketPanel(panelEl, panelContextProperties, bookIndex);
            return;
        }
        if (panelBooksMode === 'current-stop') {
            showCurrentStopPanel(panelEl, panelContextProperties, bookIndex);
            return;
        }
        updateBookPanel(panelEl, panelContextProperties, bookIndex);
    }

    function countryPanelKey(properties) {
        const iso = window.resolveCountryIso(properties);
        return `${iso || ''}|${properties.ADMIN || ''}`;
    }

    function renderBookSlideHtml(book) {
        const coverHtml = book.cover
            ? `<img class="book-panel-cover" src="${escapeAttr(book.cover)}" alt="Cover of ${escapeAttr(book.title)}" loading="lazy">`
            : '';
        const starsHtml = renderStarsHtml(book.stars);

        return `
            <div class="book-panel-slide-content">
                ${coverHtml}
                <div class="book-panel-info">
                    <p class="book-panel-line-title">${escapeHtml(book.title)}</p>
                    <p class="book-panel-line-author">${escapeHtml(book.author)}</p>
                    ${starsHtml}
                </div>
            </div>
        `;
    }

    function renderBookArticleHtml(book, countryName) {
        return `
            <article class="book-panel book-panel--book">
                <p class="book-panel-eyebrow">${escapeHtml(countryName)}</p>
                ${renderBookSlideHtml(book)}
            </article>
        `;
    }

    function bindBookPanelArrows(panelEl, properties) {
        panelEl.querySelectorAll('.book-panel-arrow').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (panelBookAnimating) return;
                const dir = Number(btn.getAttribute('data-dir'));
                switchBookWithSwipe(panelEl, panelBookIndex + dir, dir);
            });
        });
    }

    function switchBookWithSwipe(panelEl, targetIndex, dir) {
        const books = getActivePanelBooks();
        const slide = panelEl.querySelector('.book-panel-slide');
        if (!slide || books.length < 2) {
            refreshPanelForMode(panelEl, targetIndex);
            return;
        }

        const newIndex =
            ((targetIndex % books.length) + books.length) % books.length;
        if (newIndex === panelBookIndex) return;

        const outClass =
            dir > 0 ? 'book-panel-slide--out-left' : 'book-panel-slide--out-right';
        const fromClass =
            dir > 0 ? 'book-panel-slide--from-right' : 'book-panel-slide--from-left';
        const isDocket = panelBooksMode === 'on-the-docket';
        const isCurrentStop = panelBooksMode === 'current-stop';

        panelBookAnimating = true;

        const safety = window.setTimeout(() => {
            panelBookAnimating = false;
        }, 600);

        const finishIn = () => {
            panelBookIndex = newIndex;
            const book = books[newIndex];
            const slideContent = isDocket
                ? renderStatusBookSlideHtml(book, 'on-the-docket', 'ON THE DOCKET')
                : isCurrentStop
                    ? renderStatusBookSlideHtml(book, 'current-stop', 'CURRENT STOP')
                    : renderBookSlideHtml(book);
            const distinctCountries = carouselHasDistinctCountries(books);
            slide.innerHTML = renderCarouselSlideInner(
                book,
                slideContent,
                book.country,
                distinctCountries
            );
            bindBookCoverFade(slide);
            slide.classList.remove(outClass);
            slide.classList.add(fromClass);
            void slide.offsetWidth;
            slide.classList.remove(fromClass);
            slide.addEventListener(
                'transitionend',
                (e) => {
                    if (e.propertyName !== 'transform') return;
                    window.clearTimeout(safety);
                    panelBookAnimating = false;
                },
                { once: true }
            );
        };

        slide.classList.add(outClass);
        slide.addEventListener(
            'transitionend',
            (e) => {
                if (e.propertyName !== 'transform') return;
                finishIn();
            },
            { once: true }
        );
    }

    function updateBookPanel(panelEl, properties, bookIndex) {
        if (!properties) {
            showCurrentStopPanel(panelEl);
            return;
        }

        panelBooksMode = 'visited';
        panelContextProperties = properties;
        const books = window.getBooksForCountry(properties);
        const countryName = books[0] ? books[0].country : properties.ADMIN;

        if (books.length === 0) {
            if (window.isCurrentStopCountry(properties)) {
                showCurrentStopPanel(panelEl, properties);
                return;
            }
            if (window.isOnTheDocketCountry(properties)) {
                showOnTheDocketPanel(panelEl, properties);
                return;
            }
            panelCountryKey = null;
            panelBookIndex = 0;
            panelBookAnimating = false;
            panelEl.innerHTML = `
                <div class="book-panel-shell">
                    <article class="book-panel book-panel--book">
                        <p class="book-panel-eyebrow">${escapeHtml(countryName)}</p>
                        <p class="book-panel-country-note">Not visited yet</p>
                    </article>
                </div>
            `;
            return;
        }

        const key = countryPanelKey(properties);
        if (key !== panelCountryKey) {
            panelCountryKey = key;
            panelBookIndex = 0;
        }
        if (Number.isFinite(bookIndex)) {
            panelBookIndex =
                ((bookIndex % books.length) + books.length) % books.length;
        }

        const book = books[panelBookIndex];
        const multi = books.length > 1;
        const prevBtn = multi
            ? `<button type="button" class="book-panel-arrow book-panel-arrow--prev" data-dir="-1" aria-label="Previous book">‹</button>`
            : '';
        const nextBtn = multi
            ? `<button type="button" class="book-panel-arrow book-panel-arrow--next" data-dir="1" aria-label="Next book">›</button>`
            : '';

        if (multi) {
            panelEl.innerHTML = `
                <div class="book-panel-shell book-panel-shell--multi">
                    ${prevBtn}
                    ${renderMultiCarouselStackHtml(
                        book,
                        renderBookSlideHtml(book),
                        countryName,
                        books
                    )}
                    ${nextBtn}
                </div>
            `;
            bindBookPanelArrows(panelEl, properties);
        } else {
            panelEl.innerHTML = `
                <div class="book-panel-shell">
                    ${renderBookArticleHtml(book, countryName)}
                </div>
            `;
        }

        bindBookCoverFade(panelEl);
        panelBookAnimating = false;
    }

    function renderStarsHtml(stars) {
        const count = Number(stars);
        if (!Number.isFinite(count) || count <= 0) return '';

        const full = Math.min(5, Math.max(0, Math.round(count)));
        let markup = `<p class="book-panel-stars" aria-label="${full} out of 5 stars">`;
        for (let i = 1; i <= 5; i++) {
            const on = i <= full ? ' book-panel-star--on' : '';
            markup += `<span class="book-panel-star${on}" aria-hidden="true">${starIconSvg()}</span>`;
        }
        markup += '</p>';
        return markup;
    }

    function starIconSvg() {
        return (
            '<svg class="book-panel-star-icon" viewBox="0 0 24 24" focusable="false">' +
            '<path d="M12 3.2l2.76 5.59 6.17.9-4.47 4.35 1.05 6.14L12 17.6l-5.51 2.9 1.05-6.14-4.47-4.35 6.17-.9L12 3.2z" ' +
            'fill="currentColor" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" stroke-linecap="round"/>' +
            '</svg>'
        );
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReadingGlobe);
    } else {
        initReadingGlobe();
    }
})();
