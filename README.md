# Move Mountains Artisan Market Website

Production website for Move Mountains Artisan Market, an Austin/Manor TX pop-up artisan market series hosting 55+ vendors across 3 venues monthly.

## Structure

- `site/` contains the production-ready static site (HTML, CSS, JS, assets). No build step required.
- `CHANGELOG.md` tracks version history.

## Local preview

Open `site/index.html` directly in a browser, or serve the folder with any static file server:

```
cd site
python -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Works out of the box with any static host (Vercel, Netlify, GitHub Pages, Surge, Cloudflare Pages). Point the build to `site/` as the publish directory, no build command needed.

## Owner

Built and maintained by Aeopic.
