import { defineConfig } from 'astro/config';

// Webflow Cloud regenerates this config at build time (server + Cloudflare adapter).
// Static output here keeps local `npm run build` simple and mirrors the pages.
export default defineConfig({
  output: 'static',
  build: { format: 'directory' },
});
