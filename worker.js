/**
 * Cloudflare Worker — entry point for the manual `wrangler deploy`.
 *
 * Serves the static Astro build from ./dist (via the ASSETS binding) and a
 * single server-side endpoint, /api/weather, which:
 *   1. fetches current conditions + a 7-day forecast (incl. UV, wind gusts,
 *      humidity) from the public meteorological service,
 *   2. maps raw WMO codes to readable text + an icon,
 *   3. derives a tourist-facing advice engine (risk / outfit / activity / items)
 *      tuned for a hilltop monument beside a river (not a generic city forecast),
 *   4. caches the transformed response in the Cloudflare Cache API.
 *
 * The upstream needs no key and is fetched entirely on the server; the
 * front-end only ever renders the resulting plain-language suggestions.
 */

const PLACE = { lat: 20.19245, lon: 85.839584, name: 'Dhauli Shanti Stupa' };
const CACHE_TTL = 1800; // seconds — refresh at most every 30 min
const UPSTREAM_TTL = 600; // ask Cloudflare edge to cache the upstream response

const OPEN_METEO = `https://api.open-meteo.com/v1/forecast?latitude=${PLACE.lat}&longitude=${PLACE.lon}`
  + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index`
  + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max,wind_gusts_10m_max,wind_speed_10m_max`
  + `&timezone=Asia%2FKolkata&forecast_days=7`;

/* WMO weather interpretation codes -> {or, en, icon}. */
function wmo(code) {
  const map = {
    0: ['ପରିଷ୍କାର ଆକାଶ', 'Clear sky', '☀️'],
    1: ['ସାମାନ୍ୟ ମେଘ', 'Mainly clear', '🌤️'],
    2: ['ଆଂଶିକ ମେଘଳା', 'Partly cloudy', '⛅'],
    3: ['ମେଘଳା', 'Overcast', '☁️'],
    45: ['କୁୟାସ', 'Fog', '🌫️'],
    48: ['କୁୟାସ (ତୁଷାର)', 'Rime fog', '🌫️'],
    51: ['ହଳକା ଚିତି', 'Light drizzle', '🌦️'],
    53: ['ମଧ୍ୟମ ଚିତି', 'Drizzle', '🌦️'],
    55: ['ଘନ ଚିତି', 'Dense drizzle', '🌦️'],
    56: ['ହଳକା ବରଫ ଚିତି', 'Freezing drizzle', '🌧️'],
    57: ['ବରଫ ଚିତି', 'Freezing drizzle', '🌧️'],
    61: ['ହଳକା ବର୍ଷା', 'Light rain', '🌧️'],
    63: ['ମଧ୍ୟମ ବର୍ଷା', 'Rain', '🌧️'],
    65: ['ଭାରୀ ବର୍ଷା', 'Heavy rain', '🌧️'],
    66: ['ହଳକା ବରଫ ବର୍ଷା', 'Freezing rain', '🌧️'],
    67: ['ବରଫ ବର୍ଷା', 'Freezing rain', '🌧️'],
    71: ['ହଳକା ତୁଷାର', 'Light snow', '🌨️'],
    73: ['ତୁଷାର', 'Snow', '🌨️'],
    75: ['ଭାରୀ ତୁଷାର', 'Heavy snow', '🌨️'],
    77: ['ହିମକଣା', 'Snow grains', '🌨️'],
    80: ['ହଳକା ଝଡ଼ି', 'Rain showers', '🌦️'],
    81: ['ଝଡ଼ି', 'Rain showers', '🌧️'],
    82: ['ପ୍ରବଳ ଝଡ଼ି', 'Violent showers', '⛈️'],
    85: ['ହଳକା ତୁଷାର ଝଡ଼ି', 'Snow showers', '🌨️'],
    86: ['ତୁଷାର ଝଡ଼ି', 'Snow showers', '🌨️'],
    95: ['ବଜ୍ରପାତ ସହିତ ଝଡ଼', 'Thunderstorm', '⛈️'],
    96: ['ବଜ୍ରପାତ + ଶିଳା', 'Thunderstorm + hail', '⛈️'],
    99: ['ପ୍ରବଳ ବଜ୍ରପାତ + ଶିଳା', 'Severe thunderstorm', '⛈️'],
  };
  return map[code] || ['ଅଜଣା', 'Unknown', '🌡️'];
}

const LIGHT_RAIN = new Set([51, 53, 55, 56, 57, 61, 80]);
const HEAVY_RAIN = new Set([63, 65, 66, 67, 81, 82]);
const STORM = new Set([95, 96, 99]);
const FOG = new Set([45, 48]);
const CLEAR = new Set([0, 1]);
const CLOUDY = new Set([2, 3]);

function kmhToBeaufort(kmh) {
  const s = kmh || 0;
  if (s < 1) return 0;
  if (s < 6) return 1;
  if (s < 12) return 2;
  if (s < 20) return 3;
  if (s < 29) return 4;
  if (s < 39) return 5;
  if (s < 50) return 6;
  if (s < 62) return 7;
  if (s < 75) return 8;
  if (s < 89) return 9;
  if (s < 103) return 10;
  if (s < 117) return 11;
  return 12;
}

/* Derive tourist-facing suggestions from raw readings.
   Returns { risk:[], outfit:[], activity:[], items:[] } — only applicable
   items are included, so the page never shows empty/unused advice. */
function buildAdvice(c, d) {
  const risk = [], outfit = [], activity = [], items = [];
  const tmax = d.tmax ?? c.temp ?? 0;
  const tmin = d.tmin ?? c.temp ?? 0;
  const precip = Math.max(c.precipProb ?? 0, d.precipProb ?? 0);
  const uv = Math.max(c.uv ?? 0, d.uvMax ?? 0);
  const gust = Math.max(c.gusts ?? 0, d.gustsMax ?? 0);
  const wind = Math.max(c.wind ?? 0, d.windMax ?? 0);
  const gustLv = kmhToBeaufort(gust);
  const windLv = kmhToBeaufort(wind);
  const code = c.code;
  const hot = tmax >= 32;
  const cold = tmax <= 10;
  const bigSwing = tmax - tmin > 8;

  // ---- Risk (safety), shown only when genuinely hazardous ----
  if (STORM.has(code)) {
    risk.push({ icon: '⚡', or: 'ବଜ୍ରପାତ ସମ୍ଭାବ୍ୟ — ପାହାଡ଼ ନ ଚଢ଼ନ୍ତୁ, ଗଛ ତଳେ ଛାଇଁ ନ ରହନ୍ତୁ, ନଦୀ/ଜଳରେ ଖେଳିବେ ନାହିଁ।', en: 'Lightning risk — no hill climb, no shelter under trees, avoid water.' });
    activity.push({ icon: '🌊', or: 'ଜଳ କ୍ରୀଡ଼ା ଓ ଖୋଲା ପ୍ରକଳ୍ପ ସମ୍ଭବତଃ ବନ୍ଦ।', en: 'Water sports & open attractions likely closed.' });
  }
  if (HEAVY_RAIN.has(code) || (d.precipSum ?? 0) >= 10) {
    risk.push({ icon: '🌧️', or: 'ବର୍ଷା ପ୍ରବଳ — ଉପତ୍ୟକା ଓ ନିମ୍ନ ଅଞ୍ଚଳ ଏଡ଼ାନ୍ତୁ; ନାଓ/ରଜ୍ଜୁ ପରିବହନ ବନ୍ଦ ହୋଇପାରେ।', en: 'Heavy rain — avoid valleys/low areas; boats/cable cars may stop.' });
    items.push({ icon: '🧥', or: 'ରେନକୋଟ (ଲମ୍ବା ଛତା ନୁହେଁ, ବାୟୁ ବିରୁଦ୍ଧ)', en: 'Raincoat (no long umbrella — wind)' });
  }
  if (gustLv >= 7 || windLv >= 7) {
    risk.push({ icon: '💨', or: 'ବତାସ ପ୍ରବଳ — ବିଜ୍ଞାପନ ଫଳକ, ସମୁଦ୍ର ପାଷାଣ ଓ ଉଚ୍ଚ ସ୍ଥାନ ଏଡ଼ାନ୍ତୁ; ଜଳ ପ୍ରକଳ୍ପ ସମ୍ଭବତଃ ବନ୍ଦ।', en: 'Strong wind — avoid billboards, sea rocks, high places; water projects likely closed.' });
  }
  if (FOG.has(code)) {
    risk.push({ icon: '🌫️', or: 'କୁୟାସ — ଦୃଶ୍ୟମାନତା କମ୍; ପାହାଡ଼ ଉପରୁ ଦୃଶ୍ୟ ସୀମିତ, ମାସ୍କ ରଖନ୍ତୁ।', en: 'Fog — low visibility; hilltop view limited; bring a mask.' });
  }

  // ---- Outfit / dress ----
  if (hot) outfit.push({ icon: '👕', or: 'ତାପମାତ୍ରା ଅଧିକ — ସକାଳ/ସନ୍ଧ୍ୟାରେ ବୁଲନ୍ତୁ, ମଧ୍ୟାହ୍ନ ଏଡ଼ାନ୍ତୁ।', en: 'Hot — go early/late, avoid midday.' });
  if (cold) outfit.push({ icon: '🧣', or: 'ତାପମାତ୍ରା କମ୍ — ଗରମ ଜାମା ଓ ସାଲ ରଖନ୍ତୁ।', en: 'Cold — warm jacket & scarf.' });
  if (bigSwing) outfit.push({ icon: '🧥', or: 'ଦିନରାତି ତାପମାତ୍ରା ଅନ୍ତର ଅଧିକ — ପିନ୍ଧି/ଖୋଲିବା ସହଜ ଜାମା ରଖନ୍ତୁ।', en: 'Big day-night temp swing — bring a removable layer.' });
  if (precip >= 60) outfit.push({ icon: '🧥', or: 'ବର୍ଷା ସମ୍ଭାବନା ଅଧିକ — ଜଳ-ପ୍ରତିରୋଧୀ ପୋଶାକ ଉତ୍ତମ।', en: 'Likely rain — waterproof clothing helps.' });
  if ((c.humidity ?? 0) >= 80 && hot) outfit.push({ icon: '💧', or: 'ଆର୍ଦ୍ରତା ଅଧିକ — ହଲ୍‌କା, ଶ୍ୱାସଯୋଗ୍ୟ ପୋଶାକ ପିନ୍ଧନ୍ତୁ।', en: 'Humid — wear light, breathable clothes.' });

  // ---- Activity / plan ----
  if (precip >= 60) activity.push({ icon: '☔', or: 'ବର୍ଷା ସମ୍ଭାବନା ଅଧିକ — ଛାଇଁ ଥିବା ସ୍ଥାନ ପସନ୍ଦ କରନ୍ତୁ; ପାହାଡ଼ ଚଢ଼ିବା ଓ ନଦୀ କୂଳ ଭ୍ରମଣ ପିଛକୁ ଟିକାନ୍ତୁ।', en: 'Rain likely — prefer covered spots; delay hill climb & riverside walks.' });
  if (LIGHT_RAIN.has(code)) activity.push({ icon: '🌦️', or: 'ହାଲୁକା ବର୍ଷା — ରାସ୍ତା ପିଚ୍ଛିଳ, ପାଦଚାରୀ ସାବଧାନ।', en: 'Light rain — wet paths, walk carefully.' });
  if (hot) activity.push({ icon: '🌳', or: 'ଖୋଲା ସ୍ଥାନରେ ସମୟ କମ୍ ରଖନ୍ତୁ; ଛାଇଁରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ।', en: 'Limit open-area time; rest in shade.' });
  if (uv >= 5) activity.push({ icon: '🕶️', or: 'ଅତିବଂଶ ସବଳ — ସୂର୍ଯ୍ୟରୁ ରକ୍ଷା କରନ୍ତୁ।', en: 'Strong UV — protect from the sun.' });
  if (CLEAR.has(code)) activity.push({ icon: '🌅', or: 'ଆକାଶ ସ୍ୱଚ୍ଛ — ବାହାରେ ବୁଲିବା ଭଲ; ସୂର୍ଯ୍ୟୋଦୟ/ସୂର୍ଯ୍ୟାସ୍ତ ଦେଖନ୍ତୁ।', en: 'Clear — great for outdoor; catch sunrise/sunset.' });
  if (CLOUDY.has(code)) activity.push({ icon: '📷', or: 'ଆଲୋକ ସୌମ୍ୟ — ଫଟୋ ପାଇଁ ଉତ୍ତମ; ଅଧିକ ସମୟ ବାହାରେ ବୁଲିପାରିବେ।', en: 'Soft light — good for photos; longer outdoor time.' });
  if (windLv >= 5 || gustLv >= 5) activity.push({ icon: '🚤', or: 'ବତାସ ଅଧିକ — ସମୁଦ୍ର ନୌକା/କିଛି ଖୋଲା ପ୍ରକଳ୍ପ ବନ୍ଦ ହୋଇପାରେ।', en: 'Breezy — boat/attractions may close.' });

  // ---- Items to carry ----
  if (precip >= 60 || LIGHT_RAIN.has(code)) items.push({ icon: '☂️', or: 'ଛତା / ରେନକୋଟ', en: 'Umbrella / raincoat' });
  if (HEAVY_RAIN.has(code)) items.push({ icon: '👟', or: 'ପିଚ୍ଛିଳ ରାସ୍ତା ପାଇଁ ଘିଷା ଜୁତା', en: 'Grippy shoes for wet paths' });
  if (uv >= 5) items.push({ icon: '🧴', or: 'ସୂର୍ୟ୍ୟତେଲ, ଚଶମା, ଟୋପି', en: 'Sunscreen, sunglasses, hat' });
  if (hot) items.push({ icon: '💧', or: 'ପର୍ୟାପ୍ତ ପାଣି ଓ ଗରମରୁ ରକ୍ଷା ସାମଗ୍ରୀ', en: 'Water & heat protection' });
  if (windLv >= 5 || gustLv >= 5) items.push({ icon: '🧢', or: 'ଟୋପି ଉଡ଼ିଯାଏ, ଢିଲା ପୋଶାକ ପିନ୍ଧିବେ ନାହିଁ', en: 'Hat may blow; avoid loose clothing' });
  if (FOG.has(code)) items.push({ icon: '😷', or: 'ମାସ୍କ', en: 'Mask' });

  return { risk, outfit, activity, items };
}

function transform(data) {
  const cur = data.current || {};
  const d = data.daily || {};
  const [or, en, icon] = wmo(cur.weather_code);
  const today = {
    tmax: d.temperature_2m_max?.[0],
    tmin: d.temperature_2m_min?.[0],
    precipProb: d.precipitation_probability_max?.[0],
    precipSum: d.precipitation_sum?.[0],
    uvMax: d.uv_index_max?.[0],
    gustsMax: d.wind_gusts_10m_max?.[0],
    windMax: d.wind_speed_10m_max?.[0],
  };
  const daily = (d.time || []).map((date, i) => {
    const [dor, den, dicon] = wmo(d.weather_code?.[i]);
    return {
      date,
      code: d.weather_code?.[i],
      tmax: d.temperature_2m_max?.[i],
      tmin: d.temperature_2m_min?.[i],
      precipProb: d.precipitation_probability_max?.[i],
      uvMax: d.uv_index_max?.[i],
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
      icon: dicon,
      textOr: dor,
      textEn: den,
    };
  });
  const current = {
    temp: cur.temperature_2m,
    feels: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    wind: cur.wind_speed_10m,
    windLevel: kmhToBeaufort(cur.wind_speed_10m),
    windDir: cur.wind_direction_10m,
    gusts: cur.wind_gusts_10m,
    gustLevel: kmhToBeaufort(cur.wind_gusts_10m),
    precipProb: cur.precipitation_probability,
    uv: cur.uv_index,
    isDay: cur.is_day,
    cloud: cur.cloud_cover,
    code: cur.weather_code,
    icon,
    textOr: or,
    textEn: en,
  };
  return {
    place: PLACE.name,
    updated: cur.time || null,
    current,
    today,
    daily,
    advice: buildAdvice(current, today),
  };
}

async function handleWeather(cache) {
  const key = new Request('https://dhaulistupa.com/api/weather', { method: 'GET' });
  try {
    const hit = await cache.match(key);
    if (hit && Number(hit.headers.get('x-epoch') || 0) > Date.now() - CACHE_TTL * 1000) {
      const res = new Response(hit.body, hit);
      res.headers.set('x-cache', 'HIT');
      return res;
    }
  } catch (_) { /* ignore cache read errors */ }

  const upstream = await fetch(OPEN_METEO, { cf: { cacheTtl: UPSTREAM_TTL } });
  if (!upstream.ok) return new Response(JSON.stringify({ error: 'upstream' }), { status: 502, headers: { 'content-type': 'application/json' } });
  const payload = transform(await upstream.json());
  const body = JSON.stringify(payload);
  const res = new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_TTL}`,
      'x-epoch': String(Date.now()),
      'access-control-allow-origin': '*',
    },
  });
  try { await cache.put(key, res.clone()); } catch (_) { /* best-effort */ }
  res.headers.set('x-cache', 'MISS');
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/weather' && request.method === 'GET') {
      return handleWeather(caches.default);
    }
    return env.ASSETS.fetch(request);
  },
};
