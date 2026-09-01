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
Edit **only** `SITE` in `astro.config.mjs`. It is empty by default. When empty:
- the project is designed to build without a production domain;
- absolute canonical / og:url are omitted;
- JSON-LD `url` is omitted;
- `@astrojs/sitemap` is disabled;
- no placeholder domain is inserted.

When a real domain is selected, fill only `SITE` and rebuild. The sitemap integration then generates the sitemap automatically; no handwritten URL list or `lastmod` exists.

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
See `VALIDATION.md` and `PHOTO-SOURCES.md`. This sandbox could not reach npm registry or download external image binaries, so this candidate is **not certified** for the requested frozen-install/check/build gate and the current local JPEGs are non-photo layout placeholders. Do not publish it as a completed real-photo delivery until the documented replacement and CI steps are completed on a network-enabled machine.
