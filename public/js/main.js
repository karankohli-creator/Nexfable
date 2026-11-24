/**
 * NEXFABLE — MODERN DIGITAL AGENCY CONTROLLER
 * Architecture:
 * 1. Sticky Glassmorphic Navbar & Accessible Mobile Navigation Drawer
 * 2. Active Section Highlighting & Scroll-Triggered Reveals via IntersectionObserver
 * 3. Supabase-Connected Contact Form Submission (/api/contact)
 * 4. Spam Honeypot Detection & Real-Time Input Validation
 * 5. Scroll-To-Top Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveals();
  initLeadForms();
  initScrollTop();
});

/* ==========================================================================
   1. NAVBAR & ACCESSIBLE MOBILE DRAWER
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const hamburger = document.querySelector('.hamburger-btn');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const drawerClose = document.querySelector('.drawer-close-btn');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky blur on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  function toggleDrawer() {
    const isOpen = drawer?.classList.toggle('open');
    hamburger?.classList.toggle('active', isOpen);
    hamburger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    hamburger?.classList.remove('active');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger?.focus();
  }

  hamburger?.addEventListener('click', toggleDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  mobileLinks.forEach(link => link.addEventListener('click', closeDrawer));

  const overlay = document.querySelector('.mobile-drawer-overlay');
  overlay?.addEventListener('click', closeDrawer);

  // Close on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Active Link Highlighting with IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { rootMargin: '-25% 0px -55% 0px' });

    sections.forEach(sec => observer.observe(sec));
  }
}

/* ==========================================================================
   2. CONTACT FORM & SUPABASE-BACKED SUBMISSION
   ========================================================================== */
function initLeadForms() {
  const forms = document.querySelectorAll('form[data-lead-form]');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const errorBanner = form.querySelector('.form-error-banner');
      if (errorBanner) {
        errorBanner.style.display = 'none';
        errorBanner.textContent = '';
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit';

      const formData = new FormData(form);
      const payload = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        businessName: formData.get('businessName') || '',
        service: formData.get('service') || 'Full-Service Digital Growth',
        notes: formData.get('notes') || '',
        website_hp: formData.get('website_hp') || '',
        utm: {
          source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
          campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'agency-web'
        }
      };

      // Client-side validation
      const cleanName = (payload.fullName || '').trim();
      const cleanEmail = (payload.email || '').trim();

      if (!cleanName || cleanName.length < 2) {
        if (errorBanner) {
          errorBanner.textContent = 'Please enter your full name (at least 2 characters).';
          errorBanner.style.display = 'block';
        } else {
          alert('Please enter your full name (at least 2 characters).');
        }
        form.querySelector('input[name="fullName"]')?.focus();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        if (errorBanner) {
          errorBanner.textContent = 'Please enter a valid email address (e.g. name@brand.com).';
          errorBanner.style.display = 'block';
        } else {
          alert('Please enter a valid email address.');
        }
        form.querySelector('input[name="email"]')?.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px; display: inline-block; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"></circle>
          </svg>
          Sending Your Message...
        `;
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          const formWrapper = form.closest('.contact-form-wrapper') || form.parentElement;
          const successBox = formWrapper?.querySelector('.form-success-state');

          if (successBox) {
            form.style.display = 'none';
            const leadIdElem = successBox.querySelector('.lead-id-code');
            if (leadIdElem && result.leadId) {
              leadIdElem.textContent = result.leadId;
            }
            successBox.style.display = 'block';
          } else {
            alert(`Message Received! Reference: ${result.leadId}. We will reach out shortly.`);
            form.reset();
          }
        } else {
          const errMsg = result.error || 'Submission error. Please check your inputs and try again.';
          if (errorBanner) {
            errorBanner.textContent = errMsg;
            errorBanner.style.display = 'block';
          } else {
            alert(errMsg);
          }
        }
      } catch (err) {
        console.error('Submission request failed:', err);
        const errMsg = 'Connection error. Please check your connection and try again.';
        if (errorBanner) {
          errorBanner.textContent = errMsg;
          errorBanner.style.display = 'block';
        } else {
          alert(errMsg);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  });
}

/* ==========================================================================
   3. SCROLL TO TOP CONTROLLER
   ========================================================================== */
function initScrollTop() {
  const btn = document.getElementById('scroll-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   4. SCROLL-TRIGGERED REVEAL ANIMATIONS
   ========================================================================== */
function initScrollReveals() {
  const revealEls = document.querySelectorAll('.nf-reveal');
  if (revealEls.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => observer.observe(el));
}
