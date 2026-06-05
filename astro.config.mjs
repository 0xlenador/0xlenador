import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { remarkReadingTime } from './remark-reading-time.mjs';
import { unified } from '@astrojs/markdown-remark';

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
    '/simulador': '/riskfolio',
    // Activos: movidos de la raíz a /activos/ para evitar el efecto catch-all.
    // Los redirects 301 aseguran que los enlaces externos y el SEO se preserven.
    '/bitcoin': '/activos/bitcoin',
    '/ethereum': '/activos/ethereum',
    '/sunflowerland': '/activos/sunflowerland',
  },
  integrations: [
    mdx(),
    sitemap()
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
    }),
  },
});