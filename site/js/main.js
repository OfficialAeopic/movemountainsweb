/* ============================================================
   Move Mountains Artisan Market - main.js
   Stage 1 Pitch Build | Archetype: Editorial Magazine
   Motion: NO scroll-triggered animations. Hover only.
   ============================================================ */

(function () {
  'use strict';

  /* ---- Auto-hiding nav ---- */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    let lastY = window.scrollY;

    window.addEventListener('scroll', function () {
      const y = window.scrollY;
      if (y > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      // Hide on scroll down, show on scroll up
      if (y > lastY + 8 && y > 120) {
        nav.classList.add('hidden');
      } else if (y < lastY - 4) {
        nav.classList.remove('hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  /* ---- Hamburger / mobile drawer ---- */
  const burger  = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav a');

  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      const open = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Active nav link ---- */
  (function setActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(function (a) {
      const href = a.getAttribute('href');
      if (!href) return;
      // Match directory-based paths: /events/ matches /events/index.html etc.
      const clean = path.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
      const ahref = href.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
      if (clean === ahref || (ahref !== '' && ahref !== '/' && clean.startsWith(ahref))) {
        a.classList.add('active');
      }
    });
  })();

  /* ---- Newsletter form (mock submit) ---- */
  document.querySelectorAll('.newsletter-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button, input[type="submit"]');
      if (!input || !input.value) return;
      if (btn) {
        btn.textContent = 'You\'re in!';
        btn.disabled = true;
      }
      input.value = '';
    });
  });

  /* ---- Contact form (mock submit) ---- */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Message Sent';
        btn.disabled = true;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      }
    });
  }

})();
