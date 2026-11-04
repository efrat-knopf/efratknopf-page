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

  const closeA11y = () => {
    a11yPanel.hidden = true;
    a11yBtn.setAttribute('aria-expanded', 'false');
  };
  a11yBtn.addEventListener('click', () => {
    const open = a11yPanel.hidden;
    a11yPanel.hidden = !open;
    a11yBtn.setAttribute('aria-expanded', String(open));
  });
  a11yPanel.querySelector('.a11y-close').addEventListener('click', () => {
    closeA11y();
    a11yBtn.focus();
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

  /* ---------- הלוגו כמטבע דו-צדדי: סיבוב מלא במעבר עכבר על הלוגו או על הכותרת ---------- */
  const coin = document.querySelector('.hero-logo .coin');
  const emblem = document.querySelector('.hero-logo .emblem');
  const heroTitle = document.querySelector('.hero-inner h1');
  if (coin && coin.animate) {
    let spinning = false;
    const spin = () => {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || root.classList.contains('a11y-nomotion');
      if (spinning || calm) return;
      spinning = true;
      const a = coin.animate(
        [{ transform: 'perspective(1100px) rotateY(0deg)' }, { transform: 'perspective(1100px) rotateY(360deg)' }],
        { duration: 2750, easing: 'cubic-bezier(.45, .1, .2, 1)' }
      );
      a.onfinish = () => { spinning = false; };
    };
    [emblem, heroTitle].forEach((el) => el && el.addEventListener('pointerenter', spin));
  }

  /* ---------- מפת פריסה ארצית ---------- */
  const mapCard = document.querySelector('.map-card');
  const mapStage = document.querySelector('.map-stage');
  const cityDots = [...document.querySelectorAll('.city')];
  let hideTimer;

  // קו המתאר של המפה, ביחידות ה-viewBox, כדי למדוד מרחק אמיתי מהגבול
  const mapOutline = (document.querySelector('.map-art path')?.getAttribute('d')?.match(/[\d.]+/g) || [])
    .reduce((acc, n, i, arr) => {
      if (i % 2 === 0) acc.push({ x: +n, y: +arr[i + 1] });
      return acc;
    }, []);
  const pointInMap = (x, y) => {
    let inside = false;
    for (let i = 0, j = mapOutline.length - 1; i < mapOutline.length; j = i++) {
      const a = mapOutline[i];
      const b = mapOutline[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  };
  const nearestEdge = (px, py) => {
    let best = null;
    for (let i = 0; i < mapOutline.length; i++) {
      const a = mapOutline[i];
      const b = mapOutline[(i + 1) % mapOutline.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1e-9;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
      const x = a.x + t * dx;
      const y = a.y + t * dy;
      const d = Math.hypot(px - x, py - y);
      if (!best || d < best.d) best = { d, x, y, ax: a.x, ay: a.y, bx: b.x, by: b.y };
    }
    return best;
  };
  // דוחף נקודה שנמצאת על הגבול או מחוצה לו פנימה, רק עד שיש רווח ברור מהקו
  const parkInside = (px, py, stageW, stageH) => {
    if (mapOutline.length < 3) return { x: px, y: py };
    const toSvgX = 290 / stageW;
    const toSvgY = 504 / stageH;
    const halfStroke = 0.8 * stageW / 290;
    const margin = (4 + 1.5 + 5 + halfStroke) * toSvgX;
    let x = px * toSvgX;
    let y = py * toSvgY;
    for (let k = 0; k < 5; k++) {
      const hit = nearestEdge(x, y);
      if (!hit) break;
      const signed = pointInMap(x, y) ? hit.d : -hit.d;
      if (signed >= margin) break;
      const ex = hit.bx - hit.ax;
      const ey = hit.by - hit.ay;
      const len = Math.hypot(ex, ey) || 1;
      let nx = -ey / len;
      let ny = ex / len;
      if (!pointInMap(hit.x + nx * 2, hit.y + ny * 2)) { nx = -nx; ny = -ny; }
      const step = margin - signed + 0.2;
      x += nx * step;
      y += ny * step;
    }
    return { x: x / toSvgX, y: y / toSvgY };
  };

  // נקודות צפופות נדחפות מעט זו מזו, כדי שכל יישוב יהיה ניתן לבחירה. המיקום הגאוגרפי נשאר העוגן.
  const spreadCities = () => {
    const stageW = mapStage.offsetWidth;
    const stageH = mapStage.offsetHeight;
    if (!stageW || !stageH) return;
    const expanded = mapStage.matches(':hover') || mapStage.matches(':focus-within');
    const spreadMul = expanded ? 1.55 : 1;
    const minDist = 13 * spreadMul;
    const maxShift = 16 * spreadMul;
    const pts = cityDots.map((dot) => {
      const leftPct = parseFloat(dot.style.left);
      const topPct = parseFloat(dot.style.top);
      const geoX = leftPct / 100 * stageW;
      const geoY = topPct / 100 * stageH;
      const parked = parkInside(geoX, geoY, stageW, stageH);
      return { dot, x: parked.x, y: parked.y, ox: parked.x, oy: parked.y, geoX, geoY, leftPct };
    });
    const clampToAnchor = (p) => {
      const westLimit = p.leftPct < 46 ? 0 : 4;
      p.x = Math.max(p.ox - westLimit, Math.min(p.ox + maxShift, p.x));
      p.y = Math.max(p.oy - maxShift, Math.min(p.oy + maxShift, p.y));
    };
    for (let n = 0; n < 28; n++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[i].x;
          const dy = pts[j].y - pts[i].y;
          const dist = Math.hypot(dx, dy) || 0.01;
          if (dist >= minDist) continue;
          const push = (minDist - dist) / 2;
          let ux = dx / dist;
          let uy = dy / dist;
          if (pts[i].leftPct < 46 && ux > 0) ux = 0;
          if (pts[j].leftPct < 46 && ux < 0) ux = 0;
          const len = Math.hypot(ux, uy) || 1;
          ux /= len;
          uy /= len;
          pts[i].x -= ux * push;
          pts[i].y -= uy * push;
          pts[j].x += ux * push;
          pts[j].y += uy * push;
          clampToAnchor(pts[i]);
          clampToAnchor(pts[j]);
          moved = true;
        }
      }
      if (!moved) break;
    }
    pts.forEach((p) => {
      clampToAnchor(p);
      let dx = p.x - p.ox;
      let dy = p.y - p.oy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxShift) {
        dx = dx / dist * maxShift;
        dy = dy / dist * maxShift;
      }
      const parked = parkInside(p.ox + dx, p.oy + dy, stageW, stageH);
      p.dot.style.setProperty('--dx', (parked.x - p.geoX).toFixed(1) + 'px');
      p.dot.style.setProperty('--dy', (parked.y - p.geoY).toFixed(1) + 'px');
    });
  };
  spreadCities();
  if (window.ResizeObserver) new ResizeObserver(spreadCities).observe(mapStage);
  mapStage.addEventListener('pointerenter', spreadCities);
  mapStage.addEventListener('pointerleave', spreadCities);

  const hideCityNow = () => {
    mapCard.hidden = true;
    cityDots.forEach((p) => p.classList.remove('active'));
  };
  const placeCard = (dot) => {
    const stageBox = mapStage.getBoundingClientRect();
    const scale = stageBox.width / mapStage.offsetWidth || 1;
    const dotBox = dot.getBoundingClientRect();
    const cx = (dotBox.left + dotBox.width / 2 - stageBox.left) / scale;
    const cy = (dotBox.top + dotBox.height / 2 - stageBox.top) / scale;
    const cardW = mapCard.offsetWidth;
    const cardH = mapCard.offsetHeight;
    let left = cx + 14;
    if (left + cardW > mapStage.offsetWidth - 6) left = cx - cardW - 14;
    left = Math.max(6, Math.min(left, mapStage.offsetWidth - cardW - 6));
    let top = cy - cardH / 2;
    top = Math.max(6, Math.min(top, mapStage.offsetHeight - cardH - 6));
    mapCard.style.left = left + 'px';
    mapCard.style.top = top + 'px';
  };
  const showCity = (dot) => {
    clearTimeout(hideTimer);
    cityDots.forEach((p) => p.classList.toggle('active', p === dot));
    mapCard.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = dot.dataset.city;
    mapCard.appendChild(h);
    mapCard.hidden = false;
    placeCard(dot);
  };
  const hideCity = () => {
    hideTimer = setTimeout(hideCityNow, 150);
  };
  cityDots.forEach((p) => {
    p.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showCity(p); });
    p.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hideCity(); });
    p.addEventListener('click', (e) => { e.stopPropagation(); showCity(p); });
  });
  document.addEventListener('click', (e) => {
    if (!mapStage.contains(e.target)) hideCityNow();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCityNow(); });

  /* ---------- מספרים שעולים כשמגיעים לאזור האודות ---------- */
  const counters = [...document.querySelectorAll('[data-count]')];
  const statsList = document.querySelector('.stats');
  if (counters.length && statsList) {
    const calmUser = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || root.classList.contains('a11y-nomotion');
    if (!calmUser()) counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });

    const countUp = (el) => {
      const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
      if (calmUser()) { el.textContent = target + suffix; return; }
      const start = performance.now(), duration = 2200;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix; // האטה בסוף
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((en) => en.isIntersecting)) { counters.forEach(countUp); obs.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(statsList);
  }

  /* ---------- שנה בפוטר ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
