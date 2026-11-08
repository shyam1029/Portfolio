import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Served from GitHub Pages at https://shyam1029.github.io/Portfolio/
export default defineConfig({
  site: 'https://shyam1029.github.io',
  base: '/Portfolio',
  integrations: [react()],
});
