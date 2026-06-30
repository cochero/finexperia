# FinExperia — Marketing Website

Landing site for **finexperia.com** — India's only platform built on **100%
Experiential Learning**. FinExperia's Experiential Learning Method helps fresh
graduates gain years of real, portfolio-ready work experience in a fraction of
the time by learning through doing: real briefs, real mentors, real outcomes.

## Stack

Zero-dependency static site — plain HTML, CSS, and vanilla JavaScript. No build
step, no framework. Hosts on any static host (Netlify, Vercel, GitHub Pages,
Cloudflare Pages, S3, etc.).

```
index.html    Single-page site (hero, problem, how-it-works, programs,
              outcomes, employers, FAQ, apply CTA, footer)
styles.css    Design tokens + all styling, fully responsive
script.js     Nav toggle, scroll-reveal, sticky header, demo apply form
```

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then visit http://localhost:8080.

## Deploy

Upload the three files (plus this README) to any static host. No environment
variables or build command required.

- **Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder, or connect
  the repo with build command *(none)* and publish directory `.`
- **GitHub Pages:** push to a repo and enable Pages on the root.

## Customising

- **Brand colors & spacing:** edit the `:root` design tokens at the top of
  `styles.css` (`--brand`, `--brand-2`, `--bg`, `--radius`, etc.).
- **Copy, stats, programs, FAQ:** edit the corresponding sections in
  `index.html`.
- **Apply form:** currently a front-end demo. Wire `script.js`'s submit handler
  to your backend or a form service (Formspree, Netlify Forms, etc.) to capture
  real applications.

> Note: headline statistics (e.g. "12,000+ graduates", "87% hired") are
> placeholders — replace with verified figures before going live.
