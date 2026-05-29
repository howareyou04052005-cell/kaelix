/* ================================================
   KAELIX · ANSAR — Main Site Script
   ================================================ */

const SECTION_MAP = [
  { container: 'home-container',      template: 'tpl-home',      file: 'section/home.html' },
  { container: 'services-container',  template: 'tpl-services',  file: 'section/services.html' },
  { container: 'portfolio-container', template: 'tpl-portfolio', file: 'section/portfolio.html' },
  { container: 'about-container',     template: 'tpl-about',     file: 'section/about.html' },
  { container: 'contact-container',   template: 'tpl-contact',   file: 'section/contact.html' },
];

const VIEW_IDS = ['home', 'services', 'portfolio', 'about', 'contact'];
const MOBILE_MQ = window.matchMedia('(max-width: 768px)');

let activeView = 'home';
let mobileShellEnabled = false;
let heroCapTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  document.body.classList.add('is-loading');

  loadSections().then(() => {
    initMobileAppShell();
    initNavbarScroll(navbar);
    initMobileNav(hamburger, navLinks, navOverlay);
    initFounderCarousel();
    initHeroMotion();
    initReveal();
    initActiveNav();
    initPlaceholderLinks();
    handleInitialRoute();
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
  });

  MOBILE_MQ.addEventListener('change', () => {
    initMobileAppShell();
    initFounderCarousel();
    initHeroMotion();
  });
});

async function loadSections() {
  const canFetch = location.protocol === 'http:' || location.protocol === 'https:';

  SECTION_MAP.forEach(({ container, template }) => {
    mountTemplate(container, template);
  });

  if (!canFetch) return;

  await Promise.all(SECTION_MAP.map(async ({ container, file }) => {
    const el = document.getElementById(container);
    if (!el) return;
    try {
      const response = await fetch(file, { cache: 'no-cache' });
      if (!response.ok) return;
      const html = await response.text();
      if (html.trim()) el.innerHTML = html;
    } catch {
      /* templates already mounted */
    }
  }));
}

function mountTemplate(containerId, templateId) {
  const container = document.getElementById(containerId);
  const template = document.getElementById(templateId);
  if (!container || !template) return;
  container.appendChild(template.content.cloneNode(true));
}

/* -------- Mobile app shell: ONE section visible -------- */
function initMobileAppShell() {
  const shouldEnable = MOBILE_MQ.matches;
  const dock = document.getElementById('appDock');

  if (!shouldEnable) {
    mobileShellEnabled = false;
    document.body.classList.remove('is-mobile-app');
    VIEW_IDS.forEach((id) => {
      const el = document.getElementById(`${id}-container`);
      if (el) {
        el.classList.remove('is-active-view');
        el.style.display = '';
      }
    });
    document.body.style.overflow = '';
    return;
  }

  mobileShellEnabled = true;
  document.body.classList.add('is-mobile-app');
  document.body.style.overflow = 'hidden';

  if (!dock) return;

  if (dock.dataset.bound) {
    showView(activeView, false);
    return;
  }

  dock.dataset.bound = 'true';

  dock.querySelectorAll('.dock-btn').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const target = el.dataset.goto;
      if (!target || !mobileShellEnabled) return;
      e.preventDefault();
      showView(target);
    });
  });

  document.querySelectorAll('.nav-link[data-section], .footer-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (!mobileShellEnabled) return;
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const id = href.slice(1);
      if (!VIEW_IDS.includes(id)) return;
      e.preventDefault();
      showView(id);
    });
  });

  const start = window.location.hash.replace('#', '');
  showView(VIEW_IDS.includes(start) ? start : 'home', false);
}

function showView(viewId, animate = true) {
  if (!VIEW_IDS.includes(viewId)) viewId = 'home';
  activeView = viewId;

  VIEW_IDS.forEach((id) => {
    const container = document.getElementById(`${id}-container`);
    if (!container) return;
    const on = id === viewId;
    container.classList.toggle('is-active-view', on);
    if (mobileShellEnabled) {
      container.style.display = on ? 'block' : 'none';
    }
  });

  document.querySelectorAll('.dock-btn').forEach((btn) => {
    const on = btn.dataset.view === viewId;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-current', on ? 'page' : null);
  });

  document.querySelectorAll('.nav-link[data-section]').forEach((link) => {
    link.classList.toggle('active', link.dataset.section === viewId);
  });

  if (mobileShellEnabled) {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
    const panel = document.getElementById(`${viewId}-container`);
    panel?.scrollTo?.(0, 0);
    if (viewId === 'about') initFounderCarousel(true);
  }

  if (animate && history.replaceState) {
    history.replaceState(null, '', `#${viewId}`);
  }
}

function handleInitialRoute() {
  const hash = window.location.hash.replace('#', '');
  if (mobileShellEnabled && VIEW_IDS.includes(hash)) {
    showView(hash, false);
  } else if (hash) {
    const target = document.querySelector(window.location.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }
}

/* -------- Founder carousel (mobile app only) -------- */
let founderIndex = 0;

function initFounderCarousel(reset = false) {
  const cards = [...document.querySelectorAll('.founder-card')];
  const prev = document.getElementById('founderPrev');
  const next = document.getElementById('founderNext');
  const count = document.getElementById('founderCount');

  if (!cards.length) return;

  if (!mobileShellEnabled) {
    cards.forEach((c) => {
      c.classList.remove('is-fc-hidden');
      c.style.display = '';
    });
    return;
  }

  if (reset) founderIndex = 0;

  const render = () => {
    cards.forEach((card, i) => {
      const show = i === founderIndex;
      card.classList.toggle('is-fc-hidden', !show);
      card.style.display = show ? 'flex' : 'none';
    });
    if (count) {
      count.textContent = `${String(founderIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    }
  };

  if (!prev?.dataset.bound) {
    prev?.addEventListener('click', () => {
      founderIndex = (founderIndex - 1 + cards.length) % cards.length;
      render();
    });
    next?.addEventListener('click', () => {
      founderIndex = (founderIndex + 1) % cards.length;
      render();
    });
    if (prev) prev.dataset.bound = 'true';
    if (next) next.dataset.bound = 'true';
  }

  render();
}

function initNavbarScroll(navbar) {
  if (!navbar) return;
  const update = () => {
    if (mobileShellEnabled) {
      navbar.classList.add('scrolled');
      return;
    }
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMobileNav(hamburger, navLinks, navOverlay) {
  if (!hamburger || !navLinks || !navOverlay) return;

  const closeMenu = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = mobileShellEnabled ? 'hidden' : '';
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
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link, .nav-cta, .footer-links a');
    if (link && !mobileShellEnabled) closeMenu();
  });
}

function initActiveNav() {
  if (mobileShellEnabled) return;

  const navItems = document.querySelectorAll('.nav-link[data-section]');
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navItems.forEach((link) => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    });
  }, { rootMargin: '-40% 0px -50%', threshold: 0 });

  sections.forEach((s) => observer.observe(s));
}

function initHeroMotion() {
  if (heroCapTimer) {
    clearInterval(heroCapTimer);
    heroCapTimer = null;
  }

  const home = document.getElementById('home');
  if (!home) return;

  const stage = home.querySelector('.hero-stage');
  const cards = home.querySelectorAll('.hero-stage .cap-card');
  cards.forEach((c) => c.classList.remove('is-lit'));

  if (stage) stage.style.transform = '';

  if (mobileShellEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  if (!cards.length) return;

  let idx = 0;
  const pulse = () => {
    cards.forEach((card, i) => card.classList.toggle('is-lit', i === idx));
    idx = (idx + 1) % cards.length;
  };
  pulse();
  heroCapTimer = setInterval(pulse, 2800);

  if (stage && window.innerWidth > 768) {
    const onMove = (e) => {
      const rect = home.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      stage.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
    };
    const onLeave = () => {
      stage.style.transform = '';
    };
    if (!home.dataset.heroParallax) {
      home.addEventListener('mousemove', onMove);
      home.addEventListener('mouseleave', onLeave);
      home.dataset.heroParallax = 'true';
    }
  }
}

function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (mobileShellEnabled) return;

  const targets = document.querySelectorAll(
    '.service-card, .portfolio-card, .founder-card, ' +
    '.services-header, .portfolio-header, ' +
    '.studio-profile-header, .studio-principles > div, ' +
    '.founder-board-intro, .contact-inner'
  );

  targets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  targets.forEach((el) => observer.observe(el));
}

function initPlaceholderLinks() {
  document.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener('click', (e) => e.preventDefault());
  });
}
