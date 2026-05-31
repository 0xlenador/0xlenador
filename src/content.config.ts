import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // Requerido en Astro v6

const blog = defineCollection({
  // Define el cargador para buscar los archivos .md en tu carpeta de contenido
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string().default('Investigación'),
    date: z.coerce.string(), 
    author: z.string().default('0xLeñador'),
    layout: z.string().optional(),
    keywords: z.string().optional(),
    readTime: z.string().optional(),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional()
  })
});

const guias = defineCollection({
  // Carga archivos .mdx desde la carpeta de guías operativas
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guias' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    categoria: z.enum(["Airdrop", "DeFi", "Gaming", "Trading", "Mixta"]),
    estado: z.enum(["activa", "completada", "expirada"]).default("activa"),
    temporada: z.string().optional(),
    fechaLimite: z.coerce.string().optional(),
    plataforma: z.string(),
    imagen: z.string().optional(),
    tags: z.array(z.string()).default([]),
    dificultad: z.enum(["baja", "media", "alta"]).default("media"),
    tiempoEstimado: z.string().optional(),
    date: z.coerce.string(),
    author: z.string().default("0xLeñador"),
    readTime: z.string().optional(),
    prioridad: z.number().default(0),
  })
});

export const collections = { blog, guias };