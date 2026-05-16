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
    readTime: z.string().default('5 min')
  })
});

export const collections = { blog };