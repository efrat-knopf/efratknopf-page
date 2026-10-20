/* ===== אתר אפרת קנופף - אינטראקציה (Vanilla JS) ===== */
(() => {
  'use strict';

  /* >>> הגדרה: כתובת שירות קבלת הטפסים (ראו מדריך). השאירו ריק למצב הדגמה <<< */
  const FORM_ENDPOINT = 'https://formspree.io/f/maeqzkep'; 

  /* ---------- תפריט מובייל ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

  /* ---------- גלילה חלקה לקישורים פנימיים ---------- */
  // (CSS מטפל ב-scroll-behavior; כאן מוודאים סגירת תפריט ועדכון ה-hash)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
      setMenu(false);
    });
  });

  /* ---------- כותרת עליונה: מצב גלילה + סימון האזור הפעיל ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]:not(.nav-cta)')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- חלון פרויקט ---------- */
  const modal = document.getElementById('project-modal');
  const mTitle = document.getElementById('modal-title');
  const mDesc = document.getElementById('modal-desc');
  let lastFocus = null;

  const closeModal = () => {
    modal.hidden = true;
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll('.project').forEach((card) => {
    card.addEventListener('click', () => {
      lastFocus = card;
      mTitle.textContent = card.dataset.title;
      mDesc.textContent = card.dataset.desc;
      modal.hidden = false;
      modal.querySelector('.modal-close').focus();
    });
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!modal.hidden) closeModal(); setMenu(false); }
  });

  /* ---------- אימות טופס ---------- */
  const form = document.getElementById('contact-form');
  const status = form.querySelector('.form-status');

  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'נא להזין שם מלא'),
    phone: (v) => (/^0\d{1,2}[-\s]?\d{7}$/.test(v.trim()) || /^\+972[-\s]?\d{8,9}$/.test(v.trim())
      ? '' : 'נא להזין מספר טלפון תקין, לדוגמה 050-1234567'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'נא להזין כתובת דוא"ל תקינה'),
    message: (v) => (v.trim().length >= 10 ? '' : 'נא לכתוב הודעה של 10 תווים לפחות'),
  };

  const validateField = (input) => {
    const msg = rules[input.name](input.value);
    const field = input.closest('.field');
    field.classList.toggle('invalid', Boolean(msg));
    field.querySelector('.error').textContent = msg;
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  };

  // רק שדות שיש להם כלל אימות (שדה המלכודת נגד ספאם לא נכלל)
  const inputs = [...form.querySelectorAll('input, textarea')].filter((i) => rules[i.name]);
  inputs.forEach((i) => i.addEventListener('blur', () => validateField(i)));
  inputs.forEach((i) => i.addEventListener('input', () => {
    if (i.closest('.field').classList.contains('invalid')) validateField(i);
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const results = inputs.map(validateField);
    const firstBad = inputs[results.indexOf(false)];
    if (firstBad) { firstBad.focus(); return; }

    if (form.elements._gotcha.value) return; // בוט: מתעלמים

    status.classList.remove('fail');
    if (!FORM_ENDPOINT) { // מצב הדגמה, עד לחיבור שירות הטפסים
      form.reset();
      status.textContent = 'מצב הדגמה: הפנייה לא נשלחה כי לא הוגדר שירות טפסים.';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = 'שולח...';
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error('send failed');
      form.reset();
      status.textContent = 'תודה, הפנייה התקבלה. נחזור אליכם בהקדם.';
    } catch (err) {
      status.classList.add('fail');
      status.textContent = 'לא הצלחנו לשלוח. נסו שוב, או התקשרו ל-02-8020-108.';
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- ווידג'ט נגישות ---------- */
  const root = document.documentElement;
  const a11yBtn = document.querySelector('.a11y-toggle');
  const a11yPanel = document.getElementById('a11y-panel');
  const defaults = { size: 0, contrast: false, gray: false, links: false, font: false, motion: false };
  let a11y = { ...defaults };
  try { a11y = { ...defaults, ...JSON.parse(localStorage.getItem('a11y') || '{}') }; } catch (e) { /* ללא שמירה */ }

  const applyA11y = () => {
    root.style.fontSize = (100 + a11y.size * 10) + '%';
    ['contrast', 'gray', 'links', 'font', 'motion'].forEach((k) => {
      root.classList.toggle('a11y-' + (k === 'motion' ? 'nomotion' : k), a11y[k]);
      const b = a11yPanel.querySelector('[data-a11y="' + k + '"]');
      if (b) b.setAttribute('aria-pressed', String(a11y[k]));
    });
    try { localStorage.setItem('a11y', JSON.stringify(a11y)); } catch (e) { /* ללא שמירה */ }
  };

  a11yBtn.addEventListener('click', () => {
    const open = a11yPanel.hidden;
    a11yPanel.hidden = !open;
    a11yBtn.setAttribute('aria-expanded', String(open));
  });
  a11yPanel.addEventListener('click', (e) => {
    const k = e.target.closest('[data-a11y]')?.dataset.a11y;
    if (!k) return;
    if (k === 'size-up') a11y.size = Math.min(a11y.size + 1, 4);
    else if (k === 'size-down') a11y.size = Math.max(a11y.size - 1, -1);
    else if (k === 'reset') a11y = { ...defaults };
    else a11y[k] = !a11y[k];
    applyA11y();
  });
  applyA11y();

  /* ---------- שנה בפוטר ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
