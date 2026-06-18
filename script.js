function currentNavPage(pathname) {
    const segment = pathname.split('/').pop();
    if (!segment || segment === '') return 'index.html';
    return segment;
}


function updateActiveNavLink() {
    const currentPage = currentNavPage(window.location.pathname);
    const navLinks = document.querySelectorAll('.nav-pill a:not([target="_blank"])');
    const indicator = document.querySelector('.nav-pill .absolute');
    
    navLinks.forEach((link, index) => {
        link.classList.remove('text-neutral-900');
        link.classList.add('text-neutral-400');
        
        const linkPath = link.getAttribute('href');
        if (currentPage === linkPath) {
            link.classList.remove('text-neutral-400');
            link.classList.add('text-neutral-900');
            
            
            if (indicator) {
                const linkRect = link.getBoundingClientRect();
                const containerRect = link.parentElement.getBoundingClientRect();
                const left = linkRect.left - containerRect.left;
                const width = linkRect.width;
                
                indicator.style.opacity = '1';
                indicator.style.width = `${width}px`;
                indicator.style.transform = `translate(${left}px)`;
            }
        }
    });
}


function initNavHoverEffects() {
    const navLinks = document.querySelectorAll('.nav-pill a:not([target="_blank"])');
    const indicator = document.querySelector('.nav-pill .absolute');
    
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            const linkRect = link.getBoundingClientRect();
            const containerRect = link.parentElement.getBoundingClientRect();
            const left = linkRect.left - containerRect.left;
            const width = linkRect.width;
            
            if (indicator) {
                indicator.style.opacity = '1';
                indicator.style.width = `${width}px`;
                indicator.style.transform = `translate(${left}px)`;
            }
        });
    });
    
    const navContainer = document.querySelector('.nav-pill');
    if (navContainer) {
        navContainer.addEventListener('mouseleave', () => {
            updateActiveNavLink(); 
        });
    }
}


function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}


function initProjectFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');
                
                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}


function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const contactEmail = 'sremaili@email.sc.edu';

    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = contactForm.querySelector('#name').value.trim();
        const senderEmail = contactForm.querySelector('#email').value.trim();
        const subject = contactForm.querySelector('#subject').value.trim();
        const message = contactForm.querySelector('#message').value.trim();

        const mailSubject = encodeURIComponent(subject);
        const mailBody = encodeURIComponent(
            `From: ${name}\nReply-to: ${senderEmail}\n\n${message}`
        );

        window.location.href = `mailto:${contactEmail}?subject=${mailSubject}&body=${mailBody}`;

        formStatus.textContent = `Your email app should open with a message to ${contactEmail}.`;
        formStatus.className = 'form-status success';
        formStatus.style.display = 'block';
    });
}

const SITE_LOGO_SRC = 'assets/logo2.png';

function initSiteLogo() {
    let logo = document.querySelector('.site-logo');
    if (!logo) {
        logo = document.createElement('a');
        logo.className = 'site-logo';
        logo.href = 'index.html';
        logo.setAttribute('aria-label', 'Soraya Remaili — Home');
        const img = document.createElement('img');
        img.className = 'site-logo-img';
        img.width = 180;
        img.height = 36;
        img.alt = '';
        logo.appendChild(img);
    }

    const img = logo.querySelector('img');
    if (img) {
        img.src = new URL(SITE_LOGO_SRC, window.location.href).href;
    }

    if (logo.parentElement !== document.body) {
        document.body.insertBefore(logo, document.body.firstChild);
    } else if (document.body.firstChild !== logo) {
        document.body.insertBefore(logo, document.body.firstChild);
    }
}

function bindImageFadeIn(img) {
    if (!img || img.dataset.fadeInit === '1') return;
    img.dataset.fadeInit = '1';
    img.classList.add('image-fade-in');

    const reveal = () => {
        requestAnimationFrame(() => {
            img.classList.add('image-fade-in--loaded');
        });
    };

    if (img.complete && img.naturalWidth > 0) {
        reveal();
        return;
    }

    img.addEventListener('load', reveal, { once: true });
    img.addEventListener('error', reveal, { once: true });
}

function applyImageFadeIn(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('img:not(.site-logo-img):not(.book-panel-cover):not([data-no-fade])')
        .forEach(bindImageFadeIn);
}


function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    
    const animateElements = document.querySelectorAll('.about-card, .activity-item, .publication-item, .project-card, .interest-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}


function initFloatingElements() {
    const elements = document.querySelectorAll('.element');
    
    elements.forEach((el, index) => {
        const duration = 6 + (index * 2);
        const delay = index * 0.5;
        
        el.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
    });
}


function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navToggle || !navMenu) return;
    
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}


function initThemeToggle() {
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    
}


document.addEventListener('DOMContentLoaded', function() {
    initSiteLogo();
    updateActiveNavLink();
    initNavHoverEffects();
    initSmoothScrolling();
    initProjectFiltering();
    initContactForm();
    initScrollAnimations();
    initFloatingElements();
    initMobileMenu();
    initThemeToggle();
    applyImageFadeIn(document);
});

window.applyImageFadeIn = applyImageFadeIn;
window.bindImageFadeIn = bindImageFadeIn;


window.addEventListener('popstate', updateActiveNavLink);
window.addEventListener('load', updateActiveNavLink);


const utils = {
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    
    scrollToTop: function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};


function initScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(scrollBtn);
    
    
    window.addEventListener('scroll', utils.debounce(() => {
        if (window.scrollY > 300) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    }, 100));
    
    
    scrollBtn.addEventListener('click', utils.scrollToTop);
}


initScrollToTop();


console.log('%c🌱 Welcome to Soraya\'s Digital Garden!', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%cFeel free to explore the code and get inspired!', 'color: #2563eb; font-size: 12px;');
