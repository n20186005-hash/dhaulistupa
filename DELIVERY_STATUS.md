# Delivery status: source candidate — NOT final production certification

The content/design/SEO/legal/Cloudflare source work is present. One requested gate is not satisfiable inside the current sandbox and is intentionally not represented as passed:

1. **Clean pnpm CI:** Corepack cannot reach `registry.npmjs.org` to fetch the pinned pnpm binary. `ci-install.log` contains the actual failure. No fabricated transitive `pnpm-lock.yaml` has been created.

The five JPEGs under `public/images/` are confirmed real photographs; sources and licensing references are listed in `PHOTO-SOURCES.md`. Do not label this archive as the final frozen-lockfile-certified release until the clean-CI gate is completed in a network-enabled environment.

## 2026-09-01 round: SEO entity binding + PWA

Added on top of the existing page (nothing was removed):

- **Domain:** `SITE` in `astro.config.mjs` is now `https://dhaulistupa.com`, so canonical, `og:url`, JSON-LD `url` and the sitemap are emitted; `robots.txt` points at `/sitemap-index.xml`.
- **Entity config:** new `src/config.ts` is the single source of truth for full/short name, Odia names, city/state/country, PIN, plus code, geo, Maps share + embed URL, nearby landmarks and government sources.
- **JSON-LD:** `TouristAttraction` gained `@id`, absolute `image[]`, `hasMap`, `containedInPlace`; new `BreadcrumbList`; new `Organization` → `WebSite` → `WebPage` graph with `dateModified`; `FAQPage` grew from 6 to 8 questions.
- **On-page:** new `#about` section (entity-equivalence paragraph + `India › Odisha › Bhubaneswar › Dhauli Shanti Stupa` breadcrumb + address/plus-code/coordinate facts), H1 Latin subtitle, `h2-alt` semantic subtitles on every major heading, entity-bound image `alt` text, the supplied Google Maps embed plus an authority outbound link, an ASI source and a "last reviewed" line.
- **PWA:** `manifest.webmanifest`, `sw.js` (network-first navigations, stale-while-revalidate assets), registration in `BaseLayout`, and `icon-192/512` + `maskable-512` PNGs generated from `favicon.svg` by `scripts/make_pwa_icons.py` (Pillow). `scripts/audit-source.mjs` now enforces all of them; `node scripts/audit-source.mjs` passes here.

Not verified in this sandbox: `pnpm/npm install` + `astro build`. The repository has no `node_modules`, so the install/build gate still has to run on the networked CI described in `VALIDATION.md`.

## 2026-09-01 round 2: facilities + content depth (visitor landing page)

Added on top of the existing page (nothing was removed):

- **FacilitiesSection (`#facilities`)** — 8 service categories (public toilets / parking / food & drinks / accommodation / groceries / fuel & EV / medical & pharmacy / cash & ATM). Type words only, no merchant, brand or establishment names; a neutral note states the project is a non-commercial guide. Facts reviewed with Odisha Tourism + BMC links.
- **StoriesSection (`#stories`)** — 6 verified history/tradition/research entries, each with a `kind` badge (ଐତିହାସିକ ତଥ୍ୟ / ଶିଳାଲେଖ / ଧାର୍ମିକ ପରମ୍ପରା / ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଆବିଷ୍କାର / ଗବେଷଣା ବିବାଦ / ଆଧୁନିକ କାଳ). Facts cross-checked against Puratattva (Kittoe 1833 discovery; edicts I–X + XIV with two separate Kalinga Edicts replacing XI–XIII; Maurya rock-cut elephant; Toshali/Sisupalgarh debate; 1971–72 Japan Buddha Sangha + Kalinga Nippon Buddha Sangha construction; Dhavalesvar temple context).
- **EtiquetteSection (`#etiquette`)** — 6 do / 6 don't for a Buddhist monument + protected epigraph site (no touching rock edicts, no drone/commercial shooting without permission, clockwise circuit, etc.).
- **AccessibilitySection (`#access`)** — 4 cards on stairs/effort, heat, monsoon, crowd timing.
- **PhotoSpotsSection (`#photos`)** — 5 photography spots with best-time hints.
- **Page enhancements** — table of contents in `#about`; history timeline grew (1833 discovery item; 1971–72 corrected label; edict numbering detail); `#architecture` id + "what to look at" list (dome/chatra, relief panels, lion motifs, Ashokan pillar replica, stone stairs, Daya valley view); FAQ grew from 8 to 14 questions; header nav gained କାହାଣୀ (#stories) and ସୁବିଧା (#facilities).
- **State:** `npm install` succeeded here (deps already cached, engine warning node 24.14 vs pinned 24.20 is cosmetic). `astro build` not re-run in sandbox — run `npm run build` on the networked CI.

Known constraints (unchanged): Odia copy is machine-assisted for the newly added paragraphs and needs a native Odia review. `public/images` JPEGs are confirmed real photographs (sources: `PHOTO-SOURCES.md`). The `fetchpriority="high"` report from the earlier round was re-checked with `astro check` — it passes with 0 errors; any IDE diagnostic for it is stale.
