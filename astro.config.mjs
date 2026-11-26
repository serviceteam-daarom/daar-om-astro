import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://serviceteam-daarom.github.io',
  base: '/daar-om-astro/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Pagina-CSS inline in de <head>: geen extra request, geen render-blocking bestand
    inlineStylesheets: 'always',
  },
  compressHTML: true,
});
