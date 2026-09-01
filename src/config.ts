/**
 * Single source of truth for the SEO entity-binding variables required to
 * anchor this site to the "Dhauli Shanti Stupa" entity in Google. The
 * production domain itself lives in `astro.config.mjs` (`SITE`) — everything
 * else (canonical URLs, JSON-LD, og:url, sitemap) reads the resolved value
 * from `import.meta.env.SITE` so there is no duplicate copy of the domain.
 *
 * Adding or renaming an attraction only requires editing this file plus the
 * 5-line `entity` block below.
 */

const RAW_SITE = (import.meta.env.SITE ?? '').toString().replace(/\/+$/, '');

export const SITE_URL = RAW_SITE; // e.g. "https://dhaulistupa.com" (no trailing slash)
export const DOMAIN = SITE_URL ? new URL(SITE_URL).host : '';

/** Resolve a path (e.g. "/images/hero.jpg") to an absolute URL when a site is configured. */
export const abs = (path: string): string | undefined =>
  SITE_URL ? new URL(path, `${SITE_URL}/`).toString() : undefined;

/** The reviewed-on date that JSON-LD `dateModified` and the editorial footer reference. */
export const CONTENT_DATE = '2026-09-01';

export const entity = {
  /** Google-visible full name. Appears in title, H1 alt, JSON-LD, breadcrumb, alt text. */
  fullName: 'Dhauli Shanti Stupa',
  fullNameLocal: 'ଧଉଳି ଶାନ୍ତି ସ୍ତୂପ',
  /** Short name matching the domain. */
  shortName: 'Dhauli Stupa',
  shortNameLocal: 'ଧଉଳି ସ୍ତୂପ',
  /** Alternate, descriptive label used in JSON-LD `alternateName`. */
  alsoKnownAs: ['Peace Pagoda Dhauli', 'Dhauligiri Shanti Stupa'],

  city: 'Bhubaneswar',
  cityLocal: 'ଭୁବନେଶ୍ୱର',
  state: 'Odisha',
  stateLocal: 'ଓଡ଼ିଶା',
  country: 'India',
  countryLocal: 'ଭାରତ',
  countryCode: 'IN',
  postalCode: '751002',
  plusCode: '5RRQ+XQ',
  streetAddress: 'Puri Road, Dhauli, Bhubaneswar',

  latitude: 20.19245,
  longitude: 85.839584,

  mapsUrl: 'https://maps.app.goo.gl/7qV2Q1HFgcDgmCJj7',
  mapsEmbedSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6660.314840046148!2d85.83689107708808!3d20.192428481255828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1909ff47a6b839%3A0x41e4c5c0a7d51f9f!2sDhauli%20Shanti%20Stupa!5e1!3m2!1sor!2sin!4v1788188818750!5m2!1sor!2sin',

  nearbyLandmarks: [
    'Ashokan Rock Edicts & Rock-Cut Elephant (Dhauli)',
    'Lingaraj Temple (Old Town Bhubaneswar)',
  ],

  /** Indian government / official tourism sources. */
  sources: [
    {
      label: 'India / Odisha Official Tourism Portal',
      url: 'https://odishatourism.gov.in/content/tourism/en/discover/attractions/buddhist-sites/dhauligiri.html',
    },
    {
      label: 'Incredible India — Dhauligiri Hills (Ministry of Tourism)',
      url: 'https://www.incredibleindia.gov.in/en/odisha/bhubaneswar/dhauligiri-hills',
    },
    { label: 'Bhubaneswar Municipal Corporation', url: 'https://www.bmc.gov.in/' },
    { label: 'Archaeological Survey of India', url: 'https://asi.nic.in/' },
  ],

  ratingValue: 4.5,
  reviewCount: 28223,

  hours: { opens: '06:30', closes: '18:30' },
} as const;