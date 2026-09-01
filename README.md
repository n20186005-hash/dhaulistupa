# ଧଉଳି ଶାନ୍ତି ସ୍ତୂପ ପର୍ଯ୍ୟଟକ ଗାଇଡ୍

Single-page Odia visitor guide plus separate privacy, terms and cookie-settings pages.

## Stack
- Astro 7.2.9
- Tailwind CSS 4.3.3 via @tailwindcss/vite 4.3.3
- TypeScript 6.0.3
- @astrojs/check 0.9.10
- @astrojs/sitemap 3.7.3
- Wrangler 4.127.1
- pnpm 11.24.0
- Node.js 24.20.0

All declared direct versions are exact. The project is intentionally a single package and has no `pnpm-workspace.yaml`.

## Domain configuration
Edit **only** `SITE` in `astro.config.mjs`. It is currently `https://dhaulistupa.com`. When empty:
- the project is designed to build without a production domain;
- absolute canonical / og:url are omitted;
- JSON-LD `url` is omitted;
- `@astrojs/sitemap` is disabled;
- no placeholder domain is inserted.

With the domain set, `@astrojs/sitemap` generates the sitemap automatically; no handwritten URL list or `lastmod` exists. `public/robots.txt` points at `/sitemap-index.xml`.

## SEO entity binding
`src/config.ts` is the single source of truth that anchors the site to the **Dhauli Shanti Stupa** entity (Bhubaneswar, Odisha, India). It holds the full/short name, localised Odia names, address, postal code, plus code, geo coordinates, Google Maps share URL + embed source, nearby landmarks, official government sources and the rating. Everything derived from it:

| Item | Where it lands |
| --- | --- |
| `name` / `alternateName` | `TouristAttraction` JSON-LD (`@id` = `/#attraction`) |
| `image` (absolute URLs) | JSON-LD, `og:image`, `twitter:image` |
| `hasMap`, `sameAs`, `containedInPlace` | JSON-LD, outbound authority links |
| Full name + city | `<title>`, `og:title`, H1 alt line, every `h2-alt` semantic subtitle, image `alt` |
| Full → City → State → Country | visible breadcrumb + `BreadcrumbList` JSON-LD |
| Sources | `SourcesSection` (Odisha Tourism, Incredible India, BMC, ASI, Google Maps) |

Head graph (`Organization` → `WebSite` → `WebPage`, all with `@id`, `dateModified`) is emitted by `src/layouts/BaseLayout.astro`; the `FAQPage` graph (8 questions) comes from the `faqs` array in `src/pages/index.astro`.

## PWA
- `public/manifest.webmanifest` — standalone display, theme `#17211f`, 4 icons, 3 shortcuts (`/#visit`, `/#map`, `/#faq`).
- `public/sw.js` — network-first for navigations, stale-while-revalidate for same-origin assets; registered in `BaseLayout` on `load`.
- `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` — raster icons generated from the same vector mark as `favicon.svg`:
  ```bash
  python scripts/make_pwa_icons.py   # requires Pillow
  ```

## Cloudflare Workers Static Assets
`wrangler.jsonc` deploys `./dist` as Worker static assets.

```bash
corepack enable
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm deploy
```

## GA4 and consent
Measurement ID: `G-HXM22WWPKP`. Google Analytics is dynamically loaded only when analytics consent saved on `/cookies/` is true. Marketing tracking is not enabled.

## Important delivery limitation
See `VALIDATION.md` and `PHOTO-SOURCES.md`. This sandbox could not reach the npm registry, so this candidate is **not certified** for the requested frozen-install/check/build gate. The five JPEGs under `public/images/` are confirmed real photographs; their source and license mapping is recorded in `PHOTO-SOURCES.md`. Do not publish it as a completed certified release until the clean-CI steps are completed on a network-enabled machine.
