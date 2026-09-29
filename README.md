# [cantuncr.github.io](https://cantuncr.github.io/)

Personal site of **Can Tuncer** — founder of CTSS LLC, QA engineer and educator.

Static HTML/CSS/JS, no build step — served directly by GitHub Pages.

```
index.html              single-page site
assets/css/site.css     styles (brand tokens live in :root)
assets/js/site.js       preloader, Lenis smooth scroll, GSAP ScrollTrigger scenes,
                        cursor, magnetic buttons, scramble text, velocity marquees
assets/js/universe.js   three.js hero scene (ES module)
assets/vendor/          GSAP 3.15 + ScrollTrigger, Lenis 1.3, three.js r170 (vendored)
assets/img/             photos, partner logos, testimonial avatars, favicons
```

All motion is progressive enhancement: with `prefers-reduced-motion` (or if a script
fails) the page renders fully without the preloader, pins or smooth scroll.

Run locally: `python3 -m http.server` and open http://localhost:8000.
