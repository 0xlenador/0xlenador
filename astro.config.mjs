import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './remark-reading-time.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://0xlenador.xyz',
  base: '/',
  integrations: [
    sitemap()
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});