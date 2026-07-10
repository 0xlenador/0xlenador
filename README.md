# 🌲 0xLeñador

Este es el repositorio oficial de **0xLeñador**, un hub de investigación y herramientas de Web3 enfocado en el ecosistema cripto. Construido con [Astro](https://astro.build/) y enfocado en el rendimiento y un SEO bilingüe (Español/Inglés).

---

## 🚀 Instalación y Desarrollo Local

### 1. Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** (v20 o superior, probado en v24)
- **pnpm** (gestor de paquetes preferido)

Si no tienes `pnpm` instalado:

```bash
npm install -g pnpm
```

### 2. Configuración del Entorno

Clona el repositorio e instala las dependencias:

```bash
pnpm install
```

Inicia el servidor de desarrollo local:

```bash
pnpm run dev
```

El sitio estará disponible en `http://localhost:4321`.

---

## 📖 Documentación Interna

Para detalles técnicos sobre la arquitectura del proyecto, colecciones de contenido y la implementación del SEO bilingüe automático, consulta la **[DOCUMENTACIÓN](./DOCUMENTACION.md)**.

---

## 🛠 Comandos CLI

| Comando            | Descripción                                    |
| :----------------- | :--------------------------------------------- |
| `pnpm run dev`     | Arranca el servidor local en `localhost:4321`. |
| `pnpm run build`   | Compila el sitio para producción en `./dist/`. |
| `pnpm run preview` | Previsualiza el sitio compilado localmente.    |
| `pnpm run format`  | Formatea el código con Prettier.               |
