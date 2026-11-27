/**
 * Nex Fable - Interactive Components & Behaviours
 * Features:
 * - Clear Click Circular Service Carousel / Dial
 * - Scroll-Driven Progressive Keyword Highlighting
 * - Accessible FAQ Accordion
 * - Mobile Navigation Toggle
 * - Working Contact Enquiry Form integration (/api/contact)
 */
(function() {
  'use strict';

  // 1. Navigation Scroll Effect & Mobile Menu
  function initNav() {
    const nav = document.querySelector('.nf-nav');
    const toggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (nav) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 30) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }, { passive: true });
    }

    if (toggle && mobileMenu) {
      toggle.addEventListener('click', function() {
        const isOpen = mobileMenu.classList.toggle('open');
        toggle.classList.toggle('active', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
      });

      // Close menu when clicking link
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          toggle.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // 2. Clear Click Circular Service Presentation
  function initCircularServices() {
    const dialNodes = document.querySelectorAll('.dial-node');
    const serviceCards = document.querySelectorAll('.service-card-item');
    const coreNumber = document.querySelector('.circular-core .core-number');
    const coreLabel = document.querySelector('.circular-core .core-label');

    if (!dialNodes.length || !serviceCards.length) return;

    let currentIndex = 0;
    let autoRotateTimer = null;
    let userInteracted = false;

    const serviceLabels = [
      'Paid Social',
      'Content',
      'Web Dev',
      'SEO & AI'
    ];

    function setActiveService(index) {
      currentIndex = index;

      dialNodes.forEach((node, i) => {
        node.classList.toggle('active', i === index);
        node.setAttribute('aria-selected', i === index);
      });

      serviceCards.forEach((card, i) => {
        card.classList.toggle('active', i === index);
      });

      if (coreNumber) {
        coreNumber.textContent = `0${index + 1}`;
      }
      if (coreLabel) {
        coreLabel.textContent = serviceLabels[index] || `Service ${index + 1}`;
      }
    }

    dialNodes.forEach((node, index) => {
      node.addEventListener('click', () => {
        userInteracted = true;
        clearInterval(autoRotateTimer);
        setActiveService(index);
      });
    });

    // Auto rotate every 5s if user hasn't clicked
    function startAutoRotate() {
      autoRotateTimer = setInterval(() => {
        if (!userInteracted) {
          const nextIndex = (currentIndex + 1) % dialNodes.length;
          setActiveService(nextIndex);
        }
      }, 5000);
    }

    const showcaseSection = document.querySelector('.services-showcase-section');
    if (showcaseSection) {
      showcaseSection.addEventListener('mouseenter', () => clearInterval(autoRotateTimer));
      showcaseSection.addEventListener('mouseleave', () => {
        if (!userInteracted) startAutoRotate();
      });

      // Scroll trigger to change service as user scrolls through section
      let lastScrollY = window.scrollY;
      window.addEventListener('scroll', () => {
        if (userInteracted) return;
        const rect = showcaseSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.6) {
          const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.4 - rect.top) / rect.height));
          const targetIndex = Math.min(3, Math.floor(progress * 4));
          if (targetIndex !== currentIndex) {
            setActiveService(targetIndex);
          }
        }
      }, { passive: true });
    }

    startAutoRotate();
  }

  // 3. Clear Click Progressive Text Highlighting
  function initProgressiveText() {
    const pills = document.querySelectorAll('.highlight-pill');
    if (!pills.length) return;

    function handleScroll() {
      const windowHeight = window.innerHeight;
      const triggerPoint = windowHeight * 0.55;

      pills.forEach((pill) => {
        const rect = pill.getBoundingClientRect();
        // Check if element is in the active reading focal area
        if (rect.top <= triggerPoint && rect.bottom >= windowHeight * 0.2) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run
  }

  // 4. Minimal FAQ Accordion
  function initFAQ() {
    const triggers = document.querySelectorAll('.faq-trigger');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item');
        const isActive = item.classList.contains('active');

        // Optional: close other open items for clean accordion effect
        document.querySelectorAll('.faq-item').forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('active', !isActive);
        trigger.setAttribute('aria-expanded', !isActive);
      });
    });
  }

  // 5. Contact Enquiry Form Submission (/api/contact)
  function initContactForm() {
    const form = document.getElementById('contact-form') || document.querySelector('form[action*="/api/contact"]');
    if (!form) return;

    const feedbackBox = document.getElementById('form-feedback') || (function() {
      const div = document.createElement('div');
      div.id = 'form-feedback';
      div.style.display = 'none';
      div.style.marginTop = '16px';
      div.style.padding = '14px 18px';
      div.style.borderRadius = '8px';
      div.style.fontSize = '0.95rem';
      form.appendChild(div);
      return div;
    })();

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Check honeypot
      const hp = form.querySelector('input[name="website_url_hp"]');
      if (hp && hp.value) {
        console.warn('Bot submission prevented.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send Enquiry';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending Enquiry...';
      }

      feedbackBox.style.display = 'none';

      const formData = new FormData(form);
      const payload = {
        fullName: formData.get('fullName') || formData.get('name') || '',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        businessName: formData.get('businessName') || formData.get('company') || '',
        service: formData.get('service') || 'General Growth Enquiry',
        message: formData.get('message') || '',
        adBudget: formData.get('adBudget') || 'Flexible'
      };

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          form.reset();
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = 'rgba(37, 211, 102, 0.12)';
          feedbackBox.style.color = '#128C4A';
          feedbackBox.style.border = '1px solid rgba(37, 211, 102, 0.3)';
          feedbackBox.innerHTML = `<strong>Enquiry Received!</strong> ${result.message || 'Thank you for reaching out to Nex Fable. A senior digital strategist will contact you within 24 business hours.'}`;
        } else {
          feedbackBox.style.display = 'block';
          feedbackBox.style.background = 'rgba(235, 87, 87, 0.1)';
          feedbackBox.style.color = '#C53030';
          feedbackBox.style.border = '1px solid rgba(235, 87, 87, 0.25)';
          feedbackBox.innerHTML = `<strong>Submission Error:</strong> ${result.error || 'Please check your inputs and try again.'}`;
        }
      } catch (err) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = 'rgba(235, 87, 87, 0.1)';
        feedbackBox.style.color = '#C53030';
        feedbackBox.style.border = '1px solid rgba(235, 87, 87, 0.25)';
        feedbackBox.innerHTML = '<strong>Network Error:</strong> Unable to connect to server. Please email info@nexfable.in directly or message us on WhatsApp.';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initNav();
    initCircularServices();
    initProgressiveText();
    initFAQ();
    initContactForm();
  });
})();
