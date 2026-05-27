/* ================================================
   ANSAR - main site script
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  loadSections();
  initNavbarScroll(navbar);
  initMobileNav(hamburger, navLinks, navOverlay);
});

async function loadSections() {
  const sections = [
    { file: 'section/home.html', container: 'home-container' },
    { file: 'section/services.html', container: 'services-container' },
    { file: 'section/portfolio.html', container: 'portfolio-container' },
    { file: 'section/about.html', container: 'about-container' },
    { file: 'section/contact.html', container: 'contact-container' },
  ];

  await Promise.all(sections.map(async (section) => {
    const container = document.getElementById(section.container);
    if (!container) return;

    try {
      const response = await fetch(section.file);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      container.innerHTML = await response.text();
    } catch (error) {
      container.innerHTML = `
        <section class="section-load-error">
          <h2>Section could not load</h2>
          <p>${section.file}</p>
        </section>
      `;
      console.warn(`Could not load ${section.file}:`, error);
    }
  }));

  initReveal();
  initActiveNav();
  initPlaceholderLinks();
  scrollToInitialHash();
}

function initNavbarScroll(navbar) {
  if (!navbar) return;

  const updateNavbar = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  };

  updateNavbar();
  window.addEventListener('scroll', updateNavbar, { passive: true });
}

function initMobileNav(hamburger, navLinks, navOverlay) {
  if (!hamburger || !navLinks || !navOverlay) return;

  const closeMenu = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    navOverlay.classList.add('show');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) closeMenu();
    else openMenu();
  });

  navOverlay.addEventListener('click', closeMenu);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.nav-link, .nav-cta, .footer-links a');
    if (link) closeMenu();
  });
}

function initActiveNav() {
  const navItems = document.querySelectorAll('.nav-link[data-section]');
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length || !navItems.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.id;
      navItems.forEach((link) => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    });
  }, {
    rootMargin: '-35% 0px -55%',
    threshold: 0,
  });

  sections.forEach((section) => observer.observe(section));
}

function initReveal() {
  const targets = document.querySelectorAll(
    '.service-card, .portfolio-card, .team-card, .team-contact-card, ' +
    '.about-stat-card, .glass-card, .hero-content, .hero-right, ' +
    '.services-header, .portfolio-header, .contact-header, .contact-action-panel, ' +
    '.about-left, .about-right, .about-intro, .founder-card, .contact-copy, ' +
    '.founder-contact-card, .studio-profile-header, .studio-principles > div, ' +
    '.founder-board, .founder-row, .contact-desk-main, .directory-row'
  );

  if (!targets.length) return;

  targets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.transitionDelay = `${(index % 4) * 0.08}s`;
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
  });

  targets.forEach((element) => revealObserver.observe(element));
}

function initPlaceholderLinks() {
  document.querySelectorAll('a[href=""]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });
}

function scrollToInitialHash() {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  if (target) {
    requestAnimationFrame(() => target.scrollIntoView());
  }
}
