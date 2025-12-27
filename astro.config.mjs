// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    // 1. Cambiamos a la URL de la organización
    site: 'https://cyberspace4j.github.io',
    
    // 2. IMPORTANTE: solo la barra '/' 
    // Al renombrar el repo a cyberspace4j.github.io, ya no hay carpeta
    base: '/',
    
    integrations: [mdx(), sitemap()],
});