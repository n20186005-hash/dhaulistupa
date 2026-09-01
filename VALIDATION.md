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
