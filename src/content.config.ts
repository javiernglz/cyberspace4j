import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    // Cargamos los archivos Markdown y MDX de la carpeta blog
    loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
    
    // Esquema unificado para validar el Frontmatter
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            // Usamos image() para procesar las portadas desde src/assets/
            heroImage: image().optional(), 
            // Añadimos ambos campos como opcionales
            categories: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
        }),
});

// Exportamos la colección
export const collections = { blog };