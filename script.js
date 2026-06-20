/* ═══════════════════════════════════════════════════════════════
   NH TECH — Landing Page JavaScript
   Smooth animations, scroll effects & interactivity
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // ─── Preloader ─────────────────────────────────────────────
  const preloader = document.getElementById('preloader');
  function dismissPreloader() {
    preloader.classList.add('loaded');
    // Trigger hero entrance after preloader fades
    setTimeout(animateHeroEntrance, 300);
  }
  window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 800);
  });
  // Fallback if load event already fired
  if (document.readyState === 'complete') {
    setTimeout(dismissPreloader, 800);
  }
  // ─── Hero Entrance Animation ──────────────────────────────
  function animateHeroEntrance() {
    const elements = document.querySelectorAll('.hero-badge, .hero-title, .hero-slogan, .hero-desc, .hero-buttons');
    elements.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = `opacity 0.7s ease ${i * 0.15}s, transform 0.7s ease ${i * 0.15}s`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }
  // ─── Navbar Scroll Effect ──────────────────────────────────
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  function handleScroll() {
    const scrollY = window.scrollY;
    // Navbar background
    if (scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    // Back to top button
    if (scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
    // Active nav link
    updateActiveNav();
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  // Back to top click
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  // ─── Mobile Menu Toggle ────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
  });
  // Close menu on link click
  document.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('open');
    });
  });
  // ─── Active Navigation ─────────────────────────────────────
  const sections = document.querySelectorAll('.section, .hero');
  const navLinks = document.querySelectorAll('.nav-link');
  function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }
  // ─── Reveal on Scroll (Intersection Observer) ──────────────
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });
  revealElements.forEach(el => revealObserver.observe(el));
  // ─── Skill Bars Animation ─────────────────────────────────
  const skillFills = document.querySelectorAll('.skill-fill');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const targetWidth = fill.getAttribute('data-width');
        fill.style.width = targetWidth + '%';
        skillObserver.unobserve(fill);
      }
    });
  }, {
    threshold: 0.5
  });
  skillFills.forEach(fill => skillObserver.observe(fill));
  // ─── Counter Animation ────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, {
    threshold: 0.5
  });
  statNumbers.forEach(el => counterObserver.observe(el));
  function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60;
    const duration = 2000;
    const stepTime = duration / 60;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = Math.round(current) + '+';
    }, stepTime);
  }
  // ─── Contact Form ─────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.form-submit');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="stroke: #ffffff;"><polyline points="20 6 9 17 4 12"></polyline></svg> Message envoyé !';
      btn.style.background = '#25D366';
      btn.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = '';
        btn.style.boxShadow = '';
        contactForm.reset();
      }, 3000);
    });
  }
  // ─── Smooth scroll for anchor links ────────────────────────
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
  // ─── Parallax effect on hero ───────────────────────────────
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.1)`;
      }
    }, { passive: true });
  }
  // ─── Glow effect on hover for interactive cards ────────────
  document.querySelectorAll('.service-card, .why-card, .pricing-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
  // ─── Magnetic Hover on CTA Buttons ─────────────────────────
  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
  // ─── Typewriter Hero Slogan ────────────────────────────────
  const sloganEl = document.querySelector('.hero-slogan');
  if (sloganEl) {
    const sloganWords = ['Build', 'Repair', 'Upgrade'];
    let wordIndex = 0;
    // After initial display, cycle through emphasis
    setInterval(() => {
      const spans = sloganEl.querySelectorAll('span');
      // Brief pulse animation on separator dots
      spans.forEach(span => {
        span.style.transition = 'color 0.3s ease';
        span.style.color = '#0057FF';
        setTimeout(() => {
          span.style.color = '';
        }, 600);
      });
      wordIndex = (wordIndex + 1) % sloganWords.length;
    }, 3000);
  }
});
