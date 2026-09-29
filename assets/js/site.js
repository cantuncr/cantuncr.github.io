(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: background on scroll + mobile menu
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('navlinks');

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Active nav link
  const navAnchors = [...links.querySelectorAll('a[href^="#"]')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navAnchors.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  // Typing roles
  const typing = document.querySelector('.typing');
  if (typing && !reduceMotion) {
    const words = JSON.parse(typing.dataset.words);
    let w = 0, c = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typing.textContent = word.slice(0, c);
      let delay = deleting ? 40 : 85;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  // Seamless marquees: duplicate each row once
  if (!reduceMotion) {
    document.querySelectorAll('.marquee__track, .ticker__track').forEach((track) => {
      [...track.children].forEach((el) => {
        const clone = el.cloneNode(true);
        if (clone.tagName === 'IMG') clone.alt = '';
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });
  }

  // Venture filters
  const filterBtns = document.querySelectorAll('.filters button');
  const prods = document.querySelectorAll('.prods .prod');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => {
      b.classList.toggle('is-on', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    prods.forEach((p) => {
      p.hidden = f !== 'all' && !p.dataset.cat.split(' ').includes(f);
      p.classList.add('is-in');
    });
  }));

  // Count-up numbers
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const to = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / 1400, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))) + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => co.observe(el));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
