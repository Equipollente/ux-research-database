import { defineConfig } from 'astro/config';

export default defineConfig({
  // Hosted on Netlify (root of the subdomain, no base path)
  site: 'https://ux-research-database.netlify.app/',

  // Output statique
  output: 'static',

  // Intégration TypeScript
  vite: {
    ssr: {
      external: ['@octokit/rest']
    }
  }
});
