(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = !reduced && hasGsap;
  if (!motion) root.classList.remove('motion');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const universe = (window.__universe = window.__universe || { progress: 0 });

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------

  // Wraps every word of `el` in a clipping mask so it can slide up. Gradient text
  // is moved onto each word, since background-clip breaks on transformed children.
  const splitWords = (el, cls = 'sw') => {
    const gradHosts = new Set();
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3 || !child.textContent.trim()) return;
        const host = child.parentElement.closest('.grad');
        const isGrad = host && el.contains(host) || el.classList.contains('grad');
        if (host && el.contains(host)) gradHosts.add(host);
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const mask = document.createElement('span');
          mask.className = 'sw-mask';
          const w = document.createElement('span');
          w.className = `sw ${cls}${isGrad ? ' grad' : ''}`;
          w.textContent = part;
          mask.appendChild(w);
          frag.appendChild(mask);
        });
        child.replaceWith(frag);
      });
    };
    walk(el);
    gradHosts.forEach((h) => h.classList.remove('grad'));
    if (el.classList.contains('grad')) el.classList.remove('grad');
  };

  const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';
  const scramble = (el, text) => {
    el.setAttribute('aria-label', text);
    if (!motion) { el.textContent = text; return; }
    let frame = 0;
    const total = 38;
    const step = () => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        s += i < reveal || text[i] === ' ' ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = s;
      if (frame < total) requestAnimationFrame(step);
    };
    step();
  };

  // ---------------------------------------------------------------------------
  // Always-on bits (work without GSAP too)
  // ---------------------------------------------------------------------------

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  $$('.clock').forEach((el) => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: el.dataset.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  });

  const roles = $('.scramble');
  if (roles) {
    const words = JSON.parse(roles.dataset.words);
    let i = 0;
    setInterval(() => { i = (i + 1) % words.length; scramble(roles, words[i]); }, 3200);
  }

  // Spotlight gradient follows the pointer inside cards
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  // Mobile menu
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  let lenis = null;
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && window.gsap && motion) gsap.from('#menu nav a', { y: 40, opacity: 0, stagger: 0.05, duration: 0.6, ease: 'expo.out' });
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // In-page links go through Lenis when it's running
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!menu.hidden) setMenu(false);
    if (!lenis || id === '#' || id === '#main') return;
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: target === 0 ? 0 : -64, duration: 1.6 });
  });

  if (!motion) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    $$('.tl__item').forEach((el) => el.classList.add('is-on'));
    return;
  }

  // ---------------------------------------------------------------------------
  // Motion
  // ---------------------------------------------------------------------------

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll
  if (typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Split headings before anything measures them
  $$('[data-split]').forEach((el) => splitWords(el, el.dataset.split || 'sw'));
  const read = $('[data-read]');
  if (read) {
    read.innerHTML = read.textContent.trim().split(/\s+/).map((w) => `<span class="rw">${w}</span>`).join(' ');
  }

  // Custom cursor
  if (finePointer) {
    root.classList.add('has-cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__ring span');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY, opacity: 1 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    window.addEventListener('pointerover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button');
      label.textContent = labelled ? labelled.dataset.cursor : '';
      gsap.to(ring, { scale: labelled ? 2.4 : interactive ? 1.6 : 1, duration: 0.35, ease: 'power3' });
      gsap.to(dot, { scale: labelled ? 0 : 1, duration: 0.25 });
    }, { passive: true });
    document.addEventListener('pointerleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 }));

    // Magnetic buttons
    $$('[data-magnetic]').forEach((el) => {
      const strength = Number(el.dataset.magnetic) || 0.35;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Hero intro — plays when the preloader lifts
  const intro = gsap.timeline({ paused: true })
    .from('.hero-word', { yPercent: 115, rotate: 4, stagger: 0.06, duration: 1.3, ease: 'expo.out' })
    .from('.hero-fade', { y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out' }, 0.35)
    .from('.hero__universe', { opacity: 0, scale: 0.6, duration: 2, ease: 'expo.out' }, 0)
    .from('.nav', { yPercent: -100, duration: 1, ease: 'expo.out' }, 0.2);

  const reveal = () => {
    root.style.overflow = '';
    if (lenis) lenis.start();
    intro.play();
    ScrollTrigger.refresh();
  };

  // Preloader: 000→100 counter, wordmark letter by letter, then the curtain lifts
  const pre = $('.preloader');
  if (pre) {
    root.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    const count = $('.pl-count', pre);
    const o = { v: 0 };
    gsap.timeline({ onComplete: () => pre.remove() })
      .from('.pl-letter', { yPercent: 115, stagger: 0.07, duration: 0.9, ease: 'expo.out' }, 0.1)
      .from('.pl-meta', { opacity: 0, y: 12, duration: 0.6, ease: 'power2.out' }, 0.2)
      .to(o, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .to('.pl-bar', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0)
      .to('.pl-letter', { yPercent: -115, stagger: 0.04, duration: 0.6, ease: 'expo.in' }, '+=0.1')
      .to('.pl-meta', { opacity: 0, duration: 0.3 }, '<')
      .call(reveal, [], '-=0.1')
      .to(pre, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '<');
  } else {
    reveal();
  }

  // Header: glass background once scrolled, hides on the way down
  ScrollTrigger.create({
    start: 'top -80',
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
    onUpdate: (self) => {
      if (!menu.hidden) return;
      gsap.to(nav, { yPercent: self.direction === 1 && self.scroll() > 400 ? -100 : 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    },
  });

  // Active nav link
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (self) => a.classList.toggle('is-active', self.isActive) });
  });

  // Scroll progress bar
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // Hero scroll-out drives the 3D dispersal
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (self) => { universe.progress = self.progress; } });
  gsap.to('.hero__content', { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__hud', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% top', scrub: true } });

  // Velocity marquees: speed and skew follow scroll velocity
  $$('.vmq__row').forEach((row) => {
    const track = $('.vmq__track', row);
    [...track.children].forEach((n) => track.appendChild(n.cloneNode(true)));
    const base = row.hasAttribute('data-reverse') ? 1 : -1;
    let x = base > 0 ? -track.scrollWidth / 2 : 0;
    let skew = 0;
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(row);
    gsap.ticker.add(() => {
      if (!visible) return;
      const v = lenis ? lenis.velocity : 0;
      const dir = v < 0 ? -1 : 1;
      const speed = 0.7 + Math.min(Math.abs(v) * 0.4, 18);
      x += base * speed * dir;
      const half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      skew += (Math.max(-14, Math.min(14, v * 0.7)) - skew) * 0.12;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
    });
  });

  // Partner logos loop
  const logos = $('.logos__track');
  if (logos) [...logos.children].forEach((n) => { const c = n.cloneNode(true); c.alt = ''; c.setAttribute('aria-hidden', 'true'); logos.appendChild(c); });

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)' }, (ctx) => {
    const { desktop } = ctx.conditions;

    // Headings slide up word by word; everything else fades up
    $$('[data-split]').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from($$('.sw', el), { yPercent: 115, stagger: 0.05, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.fade-up').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    // About: words light up as you read; portrait opens up
    gsap.fromTo('.rw', { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '[data-read]', start: 'top 80%', end: 'bottom 45%', scrub: true } });
    gsap.fromTo('.about__clip', { clipPath: 'inset(14% 14% 14% 14% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top 90%', end: 'center 55%', scrub: true } });
    gsap.fromTo('.about__clip img', { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Ventures: vertical scroll → horizontal track
    const track = $('.h-track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const hTween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '.h-pin', pin: true, scrub: 1, start: 'top top', end: () => `+=${distance()}`, invalidateOnRefresh: true },
    });
    gsap.to('.h-progress div', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.h-pin', start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true } });
    $$('.h-card').forEach((card) => {
      gsap.fromTo(card, { opacity: 0.25, scale: 0.88, rotateY: -18 }, {
        opacity: 1, scale: 1, rotateY: 0, ease: 'none',
        scrollTrigger: { containerAnimation: hTween, trigger: card, start: 'left 100%', end: 'left 60%', scrub: true },
      });
    });

    // Services: stacked cards recede as the next one lands
    const cards = desktop ? $$('.stack-card') : [];
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const st = { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true };
      gsap.to($('.stack-inner', card), { scale: 0.9, ease: 'none', scrollTrigger: st });
      gsap.to($('.stack-shade', card), { opacity: 0.75, ease: 'none', scrollTrigger: { ...st } });
    });

    // Process: pinned timeline that draws itself on desktop
    if (desktop) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.process-pin', pin: true, scrub: 1, start: 'top top', end: '+=140%' } });
      tl.fromTo('.proc-line', { scaleX: 0 }, { scaleX: 1, duration: 4, ease: 'none' }, 0);
      $$('.proc-step').forEach((s, i) => {
        tl.fromTo(s, { opacity: 0.15, y: 40 }, { opacity: 1, y: 0, duration: 0.7 }, i * 1.1);
        tl.fromTo($('.proc-node', s),
          { backgroundColor: '#27272a', boxShadow: '0 0 0 0 rgba(255,138,61,0)' },
          { backgroundColor: '#ff8a3d', boxShadow: '0 0 0 6px rgba(255,138,61,0.18), 0 0 24px 4px rgba(192,38,211,0.6)', duration: 0.4 }, i * 1.1);
      });
    } else {
      $$('.proc-step').forEach((s) => gsap.from(s, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
    }

    // Experience: the line draws and each node lights up as you pass it
    gsap.fromTo('.tl__line div', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    $$('.tl__item').forEach((item) => {
      ScrollTrigger.create({ trigger: item, start: 'top 70%', onEnter: () => item.classList.add('is-on'), onLeaveBack: () => item.classList.remove('is-on') });
      gsap.from(item, { x: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 88%' } });
    });

    // Contact headline zooms in; footer wordmark rises
    gsap.fromTo('.cta-big', { scale: 0.72, opacity: 0.2 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true } });
    gsap.from('.cta-orb', { scale: 0, rotate: -90, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.contact__row', start: 'top 85%' } });
    gsap.from('.footer-mark', { yPercent: 45, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });

  // Count-up numbers
  $$('.counter').forEach((el) => {
    const to = Number(el.dataset.to);
    const suffix = el.dataset.suffix || '';
    const o = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true }, onUpdate: () => { el.textContent = `${Math.round(o.v)}${suffix}`; } });
  });

  // Pins depend on final font metrics
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
