import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// ସାଇଟ୍ URL ପାଇଁ ଏକମାତ୍ର କନଫିଗ୍। ଡୋମେନ୍ ନିଶ୍ଚିତ ହେଉଅବଧି ଖାଲି ରଖନ୍ତୁ।
const SITE = 'https://dhaulistupa.com';

export default defineConfig({
  site: SITE || undefined,
  output: 'static',
  integrations: SITE ? [sitemap()] : [],
  vite: { plugins: [tailwindcss()] }
});
