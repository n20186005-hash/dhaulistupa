# Validation status

## Static checks completed here
- Odia page language (`lang="or"`) and Odia-visible copy across the main/legal pages.
- Google Maps locale changed from Simplified Chinese to Odia / India (`or`, `in`).
- Single `SITE` configuration in `astro.config.mjs`; sitemap conditional on it.
- No `pnpm-workspace.yaml`.
- Exact direct package versions in `package.json`.
- Node and pnpm pins are present.
- Privacy / terms / cookie settings are independent routes, not modals.
- GA4 loads only after analytics consent.
- TouristAttraction + FAQPage JSON-LD present.
- Local logo/favicon set present (SVG, 16, 32, 180).

## SEO entity binding (2026-09-01)
- `SITE` set to `https://dhaulistupa.com`; canonical / og:url / JSON-LD `url` / sitemap are now emitted.
- `src/config.ts` holds every entity variable (name, city, state, country, postal code, plus code, geo, maps share + embed URL, nearby landmarks, government sources, rating).
- `TouristAttraction` JSON-LD gained `@id` (`/#attraction`), absolute `image[]`, `hasMap`, `containedInPlace` (City → AdministrativeArea → Country), `alternateName` with the Latin and Odia names.
- Added `BreadcrumbList` JSON-LD plus a visible `India › Odisha › Bhubaneswar › Dhauli Shanti Stupa` breadcrumb.
- Added `Organization` / `WebSite` / `WebPage` graph (`datePublished` / `dateModified` = 2026-09-01) in `BaseLayout`.
- Title / H1 / H2 subtitles / image `alt` now carry `{{FULL_NAME}} ({{CITY}})`; FAQ extended 6 → 8 questions (location + free-entry questions added); sources extended with ASI and a "last reviewed" line.
- Nothing existing was removed: the Odia copy, sections and styling were kept and only extended.

## PWA (2026-09-01)
- `public/manifest.webmanifest`, `public/sw.js`, registered from `BaseLayout`.
- Raster icons (`icon-192.png`, `icon-512.png`, `maskable-512.png`) generated locally with Pillow via `scripts/make_pwa_icons.py` — they match `favicon.svg` and are real files, not placeholders.
- `scripts/audit-source.mjs` now fails the build if the manifest, the service worker or any raster icon is missing.

## Known pre-existing type error
`src/pages/index.astro` hero `<img fetchpriority="high">` is reported as `ImgHTMLAttributes` not having `fetchpriority`. It predates this change; verify with `pnpm check` on a networked machine and switch to the form Astro 7.2.9 types accept.

## Required clean CI gate — blocked by sandbox networking
The requested first command was attempted after ensuring no `node_modules` was present:

```bash
CI=1 corepack pnpm install --frozen-lockfile
```

Corepack cannot resolve/reach `registry.npmjs.org` in this sandbox, so it cannot obtain pnpm 11.24.0 or dependencies. Therefore `pnpm check` and `pnpm build` cannot honestly be marked as executed/passed here.

A genuine new `pnpm-lock.yaml` was also not fabricated manually. Generate it with the pinned versions on a network-enabled Node 24.20.0 environment, then repeat the frozen clean install.

## Real-photo binary gate — blocked by sandbox networking
Wikimedia Commons sources, authors/licenses and exact file pages were researched, but the container cannot download their JPEG bytes. The files currently under `public/images/` are explicit layout placeholders and **are not real photographs**. Replace them with the licensed real files listed in `PHOTO-SOURCES.md` before deployment.

## Final networked gate
```bash
corepack enable
pnpm install --no-frozen-lockfile
rm -rf node_modules dist .astro
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
node scripts/audit-source.mjs
! grep -RIE 'example\.com|localhost|chrome-extension://' dist
! grep -RIE '<lastmod>|lastmod' dist
```
If `SITE` is empty, no sitemap should be generated. After setting a real production domain in `astro.config.mjs`, rebuild and confirm every generated sitemap URL uses only that domain.
