import { defineConfig } from 'astro/config';

export default defineConfig({
  // Hébergement GitHub Pages
  site: 'https://equipollente.github.io/ux-research-database/',
  base: '/ux-research-database/',

  // Output statique
  output: 'static',

  // Intégration TypeScript
  vite: {
    ssr: {
      external: ['@octokit/rest']
    }
  }
});
