document.addEventListener('DOMContentLoaded', () => {

  // ===== HEADER SCROLL =====
  const header = document.getElementById('header');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 50);
    lastScroll = scrollY;
  }, { passive: true });

  // ===== BURGER MENU =====
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('active');
  });
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('active');
    });
  });

  // ===== ANIMATED COUNTERS =====
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('ru-RU');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===== SCROLL ANIMATIONS =====
  const fadeEls = document.querySelectorAll('.advantage-card, .product-card, .cert-card, .faq__item, .review-card');
  fadeEls.forEach(el => el.classList.add('fade-in'));
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // ===== CATALOG TABS =====
  const tabs = document.querySelectorAll('.catalog__tab');
  const panels = document.querySelectorAll('.catalog__panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  // ===== CALCULATOR =====
  let calcState = {
    basePrice: 8900,
    profileMult: 1,
    glassAdd: 0,
    qty: 1,
    extras: 0
  };

  document.querySelectorAll('[data-calc] .calc__option').forEach(opt => {
    opt.addEventListener('click', () => {
      const group = opt.closest('[data-calc]');
      group.querySelectorAll('.calc__option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');

      const calcType = group.dataset.calc;
      if (calcType === 'type') calcState.basePrice = parseInt(opt.dataset.price);
      if (calcType === 'profile') calcState.profileMult = parseFloat(opt.dataset.mult);
      if (calcType === 'glass') calcState.glassAdd = parseInt(opt.dataset.add);

      updateCalc();
    });
  });

  const qtyEl = document.getElementById('calcQty');
  document.querySelectorAll('.calc__counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'plus') calcState.qty = Math.min(calcState.qty + 1, 20);
      if (btn.dataset.action === 'minus') calcState.qty = Math.max(calcState.qty - 1, 1);
      qtyEl.textContent = calcState.qty;
      updateCalc();
    });
  });

  document.querySelectorAll('.calc__check input').forEach(cb => {
    cb.addEventListener('change', () => {
      let extras = 0;
      document.querySelectorAll('.calc__check input:checked').forEach(c => {
        extras += parseInt(c.dataset.addExtra);
      });
      calcState.extras = extras;
      updateCalc();
    });
  });

  function updateCalc() {
    const unitPrice = Math.round(calcState.basePrice * calcState.profileMult + calcState.glassAdd);
    const total = unitPrice * calcState.qty + calcState.extras;
    const monthly = Math.ceil(total / 12);
    document.getElementById('calcResult').textContent = total.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('calcPer').innerHTML = `или от <strong>${monthly.toLocaleString('ru-RU')} ₽/мес</strong> в рассрочку`;
  }

  // ===== BEFORE/AFTER SLIDERS =====
  document.querySelectorAll('[data-ba]').forEach(slider => {
    const beforeEl = slider.querySelector('.ba-slider__before');
    const handle = slider.querySelector('.ba-slider__handle');
    let isDragging = false;

    function updatePosition(x) {
      const rect = slider.getBoundingClientRect();
      let pos = ((x - rect.left) / rect.width) * 100;
      pos = Math.max(5, Math.min(95, pos));
      beforeEl.style.width = pos + '%';
      handle.style.left = pos + '%';
    }

    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      updatePosition(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updatePosition(e.clientX);
    });
    window.addEventListener('mouseup', () => isDragging = false);

    slider.addEventListener('touchstart', (e) => {
      isDragging = true;
      updatePosition(e.touches[0].clientX);
    }, { passive: true });
    slider.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      updatePosition(e.touches[0].clientX);
    }, { passive: true });
    slider.addEventListener('touchend', () => isDragging = false);
  });

  // ===== REVIEWS CAROUSEL =====
  const track = document.querySelector('.reviews__track');
  const cards = document.querySelectorAll('.review-card');
  const dotsContainer = document.getElementById('revDots');
  let currentSlide = 0;
  let slidesPerView = 3;

  function getSlidesPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function getTotalSlides() {
    return Math.max(1, cards.length - slidesPerView + 1);
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const total = getTotalSlides();
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.className = 'reviews__dot' + (i === currentSlide ? ' active' : '');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goToSlide(index) {
    const total = getTotalSlides();
    currentSlide = Math.max(0, Math.min(index, total - 1));
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
    dotsContainer.querySelectorAll('.reviews__dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentSlide);
    });
  }

  document.getElementById('revPrev').addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('revNext').addEventListener('click', () => goToSlide(currentSlide + 1));

  function initCarousel() {
    slidesPerView = getSlidesPerView();
    currentSlide = 0;
    buildDots();
    goToSlide(0);
  }
  initCarousel();
  window.addEventListener('resize', initCarousel);

  // Auto-scroll reviews
  let autoSlide = setInterval(() => {
    const total = getTotalSlides();
    goToSlide(currentSlide + 1 >= total ? 0 : currentSlide + 1);
  }, 5000);
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoSlide));
  track.parentElement.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => {
      const total = getTotalSlides();
      goToSlide(currentSlide + 1 >= total ? 0 : currentSlide + 1);
    }, 5000);
  });

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq__question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ===== MODALS =====
  const overlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');

  window.openModal = function(type, productName) {
    const tpl = document.getElementById('tpl-' + type);
    if (!tpl) return;
    modalBody.innerHTML = tpl.innerHTML;
    if (productName) {
      const nameEl = modalBody.querySelector('#modalProductName');
      if (nameEl) nameEl.textContent = productName;
    }
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    const form = modalBody.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        showSuccess();
      });
    }
  };

  window.closeModal = function() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  function showSuccess() {
    const tpl = document.getElementById('tpl-success');
    modalBody.innerHTML = tpl.innerHTML;
  }

  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.modal;
      const productName = btn.dataset.productName || '';
      openModal(type, productName);
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ===== CONTACT FORM =====
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    openModal('callback');
    showSuccess();
  });

  // ===== SMOOTH SCROLL for anchors =====
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== PHONE MASK (simple) =====
  document.addEventListener('input', (e) => {
    if (e.target.type === 'tel') {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);
      if (val.length > 0) {
        if (val[0] === '8' || val[0] === '7') {
          let formatted = '+7';
          if (val.length > 1) formatted += ' (' + val.slice(1, 4);
          if (val.length > 4) formatted += ') ' + val.slice(4, 7);
          if (val.length > 7) formatted += '-' + val.slice(7, 9);
          if (val.length > 9) formatted += '-' + val.slice(9, 11);
          e.target.value = formatted;
        }
      }
    }
  });

});
