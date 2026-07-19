# 0x Leñador

[![Sitio Web](https://img.shields.io/badge/Website-0xlenador.xyz-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://0xlenador.xyz)&nbsp;&nbsp;&nbsp;&nbsp;[![Twitter / X](https://img.shields.io/badge/Twitter-%400xlenador-black?style=for-the-badge&logo=x&logoColor=white)](https://twitter.com/0xlenador)

**0xLeñador** es un hub integral de investigación y desarrollo de herramientas Web3, creado con el propósito de aportar valor y conocimiento al ecosistema cripto. Desarrollado sobre [Astro](https://astro.build/), el proyecto prioriza un rendimiento excepcional y cuenta con una arquitectura diseñada para un SEO bilingüe (Español e Inglés) eficiente.

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
