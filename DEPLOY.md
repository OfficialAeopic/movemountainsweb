# Move Mountains Artisan Market, Vercel deploy guide

Version: 1.0.0
Updated: 2026-04-20
Target host: Vercel (https://vercel.com)
Site type: Static multi-page (HTML + CSS + JS, no backend)

---

## TL;DR for the importer

1. Vercel dashboard, Add New, Project, Import Git Repository.
2. Pick OfficialAeopic/movemountainsweb.
3. **Framework Preset:** Other
4. **Root Directory:** `site` (this is the important one)
5. **Build and Output Settings:** leave everything as default
6. **Environment Variables:** none required
7. Click Deploy.

The site is pure static, no `npm install`, no build step. Everything in `site/` is served directly.

---

## Directory layout

```
/ (repo root)
  README.md              <- project summary, not shipped to production URL
  CHANGELOG.md           <- version history, not shipped to production URL
  DEPLOY.md              <- this file, not shipped to production URL
  .gitignore
  site/                  <- Vercel Root Directory points here
    index.html           <- becomes /
    about/index.html     <- becomes /about/
    vendors/index.html   <- becomes /vendors/
    events/index.html    <- becomes /events/
    get-involved/        <- becomes /get-involved/ + subpages
    contact/index.html   <- becomes /contact/
    css/, js/, images/   <- served under those paths
    sitemap.xml          <- /sitemap.xml
    .surgeignore         <- legacy, ignored by Vercel
```

---

## Why Root Directory must be `site/`

All HTML, CSS, JS, and images live under `site/` so that internal business
docs (financial tracking, scope registry, onboarding notes, etc.) can stay
in the same local folder without shipping to the public repo. The repo
root only contains the README, CHANGELOG, and this DEPLOY guide.

If you leave Root Directory blank, Vercel will try to deploy the repo
root and serve `README.md` as the homepage. You will get a 404 on every
page. Set it to `site`.

---

## Custom domain (when you are ready)

Vercel dashboard, Project, Settings, Domains, Add. Point Amanda's
registrar A record at `76.76.21.21` and CNAME `www` to `cname.vercel-dns.com`.
Vercel will issue the TLS cert automatically.

---

## Future work

The contact form is currently a mock submit. When we wire up a real
backend (likely Formspree or a tiny Vercel serverless function with
Resend, matching the Kubin pattern), add an `api/` folder under `site/`
and an env var for the email provider.
