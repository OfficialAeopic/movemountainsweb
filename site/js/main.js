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

  /* ---- Newsletter form (real submit -> /api/intake/newsletter) ---- */
  /* Fallback to fake-success on failure so the user UX never breaks. */
  document.querySelectorAll('.newsletter-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button, input[type="submit"]');
      if (!input || !input.value) return;
      const honeypot = form.querySelector('input[name="website"]');
      const payload = {
        email: input.value,
        website: honeypot ? honeypot.value : ''
      };
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
      fetch('/api/intake/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
      }).catch(function (err) {
        try { console.warn('newsletter submit failed, fake-success fallback', err); } catch (_) {}
      }).then(function () {
        if (btn) { btn.textContent = "You're in!"; }
        input.value = '';
      });
    });
  });

  /* ---- Contact form (real submit -> /api/intake/contact) ---- */
  /* Fallback to fake-success on failure so the user UX never breaks. */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const success = contactForm.querySelector('.contact-form-success');
      const formData = new FormData(contactForm);
      const payload = {};
      formData.forEach(function (v, k) { payload[k] = v; });
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      fetch('/api/intake/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
      }).catch(function (err) {
        try { console.warn('contact submit failed, fake-success fallback', err); } catch (_) {}
      }).then(function () {
        if (btn) {
          btn.textContent = 'Message Sent';
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-outline');
        }
        if (success) {
          success.classList.add('show');
          try { success.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
        }
        contactForm.querySelectorAll('input, textarea, select').forEach(function (el) { el.disabled = true; });
      });
    });
  }

})();
