---
trigger: always_on
---

# 0xLeñador — Reglas Fundamentales

## Identidad
Plataforma de **herramientas, dashboards y contenido educativo** sobre crypto/finanzas.
**NO es un blog genérico ni una landing page comercial.** Las decisiones de diseño priorizan densidad de datos y utilidad operativa.

## Stack
- **Framework:** Astro v7 (SSG estático, GitHub Pages)
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/vite`) + clases custom en `src/styles/main.css`
- **Contenido:** Content Collections con Zod schemas (`src/content.config.ts`)
- **Tipado:** TypeScript strict
- **Package manager:** pnpm (NUNCA npm ni yarn)
- **Formato:** Prettier (sin semicolons, comillas dobles, printWidth 100, LF)

## Design System — Tokens y Clases Clave

**Colores (definidos en `main.css` como `@theme inline`):**
`terminal-bg` (#141414), `terminal-surface` (#1e1e1e), `terminal-elevated` (#282828), `terminal-border` (#2a2a2a), `terminal-text` (#f7faf7), `terminal-secondary` (#a8b2c1), `terminal-muted` (#8892a2).

**Antes de crear clases CSS nuevas**, revisar `src/styles/main.css` — ya existen clases reutilizables para tarjetas, tablas, badges, animaciones glitch y separadores.

## Prohibiciones Críticas

1. **No commits ni deploy** a menos que se pida explícitamente.
2. **Cero deuda técnica:** No proponer hacks, injertos ni soluciones de fuerza bruta.
3. **DRY estricto:** Si detectas código duplicado o un archivo creciendo a monolito (>300 líneas sin justificación), detente y propón refactorización.
4. **Auditoría previa:** Si la arquitectura existente no es escalable para lo que se pide, advierte ANTES de escribir código nuevo.
5. **No crear clases CSS ad-hoc** si ya existe una equivalente en `main.css`.
