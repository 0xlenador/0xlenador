# 📖 Documentación — 0xLeñador

> Última actualización: 2026-07-10

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Contenido y Colecciones](#4-contenido-y-colecciones)
5. [SEO e Internacionalización (i18n)](#5-seo-e-internacionalización-i18n)
6. [Sistema de Componentes](#6-sistema-de-componentes)
7. [Estilos y Design System](#7-estilos-y-design-system)
8. [Deploy y Hosting](#8-deploy-y-hosting)
9. [Comandos Útiles](#9-comandos-útiles)

---

## 1. Visión General

<!-- TODO: Describir el propósito del sitio, público objetivo y filosofía del proyecto -->

---

## 2. Stack Tecnológico

<!-- TODO: Detallar versiones, por qué se eligió cada herramienta y trade-offs -->

| Herramienta | Uso |
|---|---|
| Astro v6 | Framework SSG (static site generation) |
| Tailwind CSS v4 | Estilos utility-first via `@tailwindcss/vite` |
| MDX | Guías/operaciones con componentes interactivos |
| Sharp | Optimización de imágenes en build-time |
| TypeScript | Tipado en i18n, schemas de contenido y utilidades |
| ESLint + Prettier | Linting y formato |

---

## 3. Estructura del Proyecto

<!-- TODO: Detallar la estructura de carpetas, convenciones de nombres y responsabilidades -->

```
src/
├── assets/           # Imágenes procesadas por Astro
├── components/       # Componentes reutilizables (.astro)
│   ├── activo/       # Componentes de páginas de activos
│   ├── blog/         # Componentes del blog
│   ├── guias/        # Componentes de guías/operaciones
│   ├── home/         # Componentes del home
│   └── views/        # Vistas principales (page-level)
├── content/          # Content Collections
│   ├── blog/         # Posts (es/en, Markdown)
│   ├── guias/        # Guías operativas (es/en, MDX)
│   └── data/         # JSON: watchlist, faucets, directory, sfl
├── i18n/             # Sistema de internacionalización
│   ├── locales/      # Micro-diccionarios JSON por idioma
│   ├── ui.ts         # Carga de traducciones + rutas
│   └── utils.ts      # Helpers: routeMap, getAlternateUrl, etc.
├── layouts/          # Layout.astro (único layout global)
├── lib/              # Helpers: content.ts, sitemapHelpers.mjs
├── pages/            # Rutas ES (raíz) + EN (subcarpeta /en/)
└── styles/           # main.css (Tailwind + custom)
```

---

## 4. Contenido y Colecciones

<!-- TODO: Detallar schemas (content.config.ts), cómo agregar contenido nuevo, campos obligatorios vs opcionales -->

---

## 5. SEO e Internacionalización (i18n)

### Arquitectura

- **Español** = idioma por defecto, sin prefijo de URL (`/blog/`, `/activos/`)
- **Inglés** = bajo el prefijo `/en/` (`/en/blog/`, `/en/watchlist/`)
- Configurado con `prefixDefaultLocale: false` y `trailingSlash: "always"`

### ¿Qué es automático?

| Tipo de contenido | Solo necesitas… |
|---|---|
| **Blog post** | Crear `.md` en `src/content/blog/{es,en}/slug/index.md` con `translationSlug` en el frontmatter |
| **Activo (watchlist)** | Crear `.json` en `src/content/data/watchlist/nombre.json` |
| **Guía (operación)** | Crear `.mdx` en `src/content/guias/{es,en}/slug.mdx` con `translationSlug` si el slug difiere |

El canonical, hreflang (HTML + sitemap) y la indexación se resuelven solos al hacer build.

### ¿Qué es manual?

Solo cuando creas una **página estática nueva** donde el slug **cambia** entre idiomas (ej: `/analiticas` ↔ `/en/analytics`):

1. Crear los `.astro` en `src/pages/` (ES) y `src/pages/en/` (EN)
2. Agregar el segmento en `src/i18n/ui.ts` → objeto `routes`:
   ```ts
   en: { analiticas: "analytics", ... },
   es: { analytics: "analiticas", ... },
   ```
3. Agregar la ruta en `src/i18n/utils.ts` → objeto `routeMap`:
   ```ts
   "/analiticas": { es: "/analiticas/", en: "/en/analytics/" },
   ```

> Si el slug es **igual** en ambos idiomas (ej: `/riskfolio`), no necesitas tocar nada.

### Cómo funciona por debajo

| Pieza | Archivo | Rol |
|---|---|---|
| `routeMap` | `src/i18n/utils.ts` | Mapa de rutas estáticas con slugs traducidos |
| `routes` | `src/i18n/ui.ts` | Traducción de segmentos sueltos (activos→watchlist) |
| `getAlternateUrl()` | `src/i18n/utils.ts` | Busca en routeMap → fallback por segmentos → trailing slash |
| `sitemapHelpers.mjs` | `src/lib/sitemapHelpers.mjs` | Lee `translationSlug` del frontmatter para el sitemap |
| `Layout.astro` | `src/layouts/Layout.astro` | Genera canonical + hreflang. Acepta `esUrl`/`enUrl` manuales |
| `astro.config.mjs` | raíz | Sitemap: filtra 404/redirects, resuelve slugs traducidos |

### Traducciones de UI

Los textos de interfaz viven en micro-diccionarios JSON en `src/i18n/locales/{es,en}/`. Se cargan todos en build-time via `import.meta.glob` y se acceden con `t("clave")`.

---

## 6. Sistema de Componentes

<!-- TODO: Documentar componentes globales (Navbar, Footer, BackToTop, LanguageSuggestionBanner), componentes por feature y convenciones -->

---

## 7. Estilos y Design System

<!-- TODO: Documentar tokens de color, tipografía, clases custom en main.css y convenciones de Tailwind -->

---

## 8. Deploy y Hosting

<!-- TODO: Documentar flujo de deploy (GitHub Pages u otro), CI/CD, dominio y DNS -->

---

## 9. Comandos Útiles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor local en `localhost:4321` |
| `pnpm build` | Build de producción en `./dist/` |
| `pnpm preview` | Preview del build localmente |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm format` | Formatear con Prettier |
