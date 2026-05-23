/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * GitHub repo owner (e.g. "equipollente").
   * Safe to expose: identifies a public repo.
   */
  readonly PUBLIC_GITHUB_OWNER: string;

  /**
   * GitHub repo name.
   * Safe to expose: identifies a public repo.
   */
  readonly PUBLIC_GITHUB_REPO: string;

  /**
   * GitHub branch to read/write (typically "main").
   * Safe to expose.
   */
  readonly PUBLIC_GITHUB_BRANCH: string;

  /**
   * GitHub Personal Access Token.
   * ⚠️ DEPRECATED — being removed in Phase 2B (Netlify migration).
   * See PHASE_2B_TOKEN_MIGRATION.md. Token will move server-side into a Netlify Function.
   */
  readonly PUBLIC_GITHUB_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
