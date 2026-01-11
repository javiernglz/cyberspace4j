import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            heroImage: image().optional(),
            categories: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
        }),
});

// --- NUEVA COLECCIÓN: PROYECTOS ---
const projects = defineCollection({
    loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            heroImage: image().optional(),
            tags: z.array(z.string()).optional(),
            link: z.string().url().optional(), // URL externa (GitHub/Demo)
        }),
});

export const collections = { blog, projects };