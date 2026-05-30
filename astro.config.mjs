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
  redirects: {
    // /tesis migrada como artículo del blog (301 = Moved Permanently, preserva SEO)
    '/tesis': '/blog/tesis-de-inversion',
  },
  integrations: [
    sitemap()
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});